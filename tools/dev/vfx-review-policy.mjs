/* Mandatory per-move comparison across every catalogued VFX library.
 * Structural evidence validator; only a human judges artistic similarity.
 */
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../..");
const LEGACY=["T2","P2","Z","E"];
const filled=s=>typeof s==="string"&&s.trim().length>=18;
const states=new Set(["candidate","rejected","blocked","unavailable"]);
const isBlocked=s=>["conflict","missing"].includes(s.licenseState);
export function parseJohtoVisualIds(code){
 const text=String(code||"");
 const literal=[...text.matchAll(/\{\s*"id"\s*:\s*"([a-z0-9-]+)"/g)].map(x=>x[1]);
 const object=[...text.matchAll(/\{\s*id\s*:\s*"([a-z0-9-]+)"\s*,\s*fx\s*:/g)].map(x=>x[1]);
 return [...new Set([...literal,...object])];
}
export function requiredVfxIds(root=ROOT,data){
 const current=data||JSON.parse(fs.readFileSync(path.join(root,"data/vfx-selection-decisions.json"),"utf8"));
 const reused=JSON.parse(fs.readFileSync(path.join(root,"data/move-reuse-policy.json"),"utf8"));
 const grandfathered=new Set(current.legacyMoveIds||[]);
 const ids=Object.keys(reused.newMoves||{}).filter(id=>!grandfathered.has(id));
 // Johto has 43 experimental VFX, but only four are submitted for this review.
 // Keep the other 39 quarantined until they enter JOHTO_LAB_REVIEW_4.
 // On parsing failure, fail closed by requiring every experimental VFX.
 const johto=path.join(root,"tools/pokearena/torre2-johto-pixelfx-catalog.js");
 if(fs.existsSync(johto)){
  const candidates=parseJohtoVisualIds(fs.readFileSync(johto,"utf8"));
  const lab=path.join(root,"tools/pokearena/torre2-johto-lab-catalog.js");
  if(!fs.existsSync(lab)){ids.push(...candidates);}
  else{
   const code=fs.readFileSync(lab,"utf8");
   const m=code.match(/JOHTO_LAB_REVIEW_4\s*=\s*Object\.freeze\(\[([^\]]+)\]\)/);
   const selected=m?[...m[1].matchAll(/"([a-z0-9-]+)"/g)].map(x=>x[1]):[];
   if(!selected.length||selected.some(id=>!candidates.includes(id)))
    ids.push(...candidates);
   else ids.push(...selected);
  }
 }
 return [...new Set(ids)].sort();
}
export function validateVfxSelections(data,catalog,required=[]){
 const errors=[],add=message=>errors.push(message);
 if(data?.schemaVersion!==1)add("Invalid VFX review schema version");
 if(!Array.isArray(data?.legacyMoveIds)||data.legacyMoveIds.length!==40||
    new Set(data.legacyMoveIds).size!==40)add("40 frozen historical moves required; cannot add grandfathered moves");
 if(!data?.decisions||typeof data.decisions!=="object"||Array.isArray(data.decisions))
  add("decisions must be a map");
 const sources=catalog?.sources||[],known=new Map(sources.map(s=>[s.id,s]));
 if(sources.length!==10||known.size!==10)add("Must inspect exactly ten unique library sources");
 for(const id of required)if(!data?.decisions?.[id])add(id+": MISSING VFX source comparison");
 for(const [id,entry] of Object.entries(data?.decisions||{})){
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)){add(id+": invalid move ID");continue}
  if(!entry||typeof entry!=="object"){add(id+": invalid record");continue}
  if(!/^https:\/\//.test(entry.mechanics?.reference||"")||!filled(entry.mechanics?.behavior))
   add(id+": factual mechanics and reference URL required");
  for(const field of ["origin","travel","contact","aftermath"])
   if(!filled(entry.animation?.[field]))add(id+": missing movement stage "+field);
  if(!["research-complete","implemented","ready-to-merge"].includes(entry.stage))
   add(id+": stage must represent real research, not pending");
  for(const key of LEGACY){
   const ref=entry.originalSources?.[key];
   if(!["inspected","unavailable"].includes(ref?.state)||!filled(ref?.reference)||!filled(ref?.finding))
    add(id+": unreviewed original source "+key);
  }
  for(const source of sources){
   const review=entry.libraryReview?.[source.id];
   if(!review||!states.has(review.state)||!filled(review.reason)){
    add(id+": unreviewed library "+source.id);continue;
   }
   if(isBlocked(source)&&review.state!=="blocked")add(id+": license-blocked library "+source.id);
   if(["candidate","rejected"].includes(review.state)){
    if(!filled(review.effectRef)||review.licenseChecked!==true)
     add(id+": missing actual effect file and license check for "+source.id);
    for(const metric of ["semantics","pixelArt","phaser","performance"])
     if(!Number.isInteger(review.fit?.[metric])||review.fit[metric]<0||review.fit[metric]>5)
      add(id+": missing comparison metric "+metric+" for "+source.id);
   }
  }
  for(const extra of Object.keys(entry.libraryReview||{}))
   if(!known.has(extra))add(id+": unrecognized source "+extra);
  if(!Array.isArray(entry.selected)||!entry.selected.length)add(id+": no justified best-match VFX selected");
  else for(const choice of entry.selected){
   const native=LEGACY.includes(choice.sourceId);
   const eligible=native?entry.originalSources?.[choice.sourceId]?.state==="inspected":
    known.has(choice.sourceId)&&entry.libraryReview?.[choice.sourceId]?.state==="candidate";
   if(!eligible)add(id+": selected effect not an eligible compared candidate: "+choice.sourceId);
   const ref=native?entry.originalSources?.[choice.sourceId]?.effectRef:
    entry.libraryReview?.[choice.sourceId]?.effectRef;
   if(!filled(choice.effectRef)||choice.effectRef!==ref||!filled(choice.contribution))
    add(id+": chosen effect needs matching path and real contribution");
  }
  if(!filled(entry.comparisonRationale))add(id+": missing documented comparison and decision rationale");
  if(!["pending","approved"].includes(entry.visualApproval?.state))
   add(id+": visual approval must be explicit and distinct from CI");
  if(entry.visualApproval?.state==="approved"&&!filled(entry.visualApproval.evidence))
   add(id+": approved VFX needs real user approval evidence");
  if(["implemented","ready-to-merge"].includes(entry.stage)&&
     (!Array.isArray(entry.implementation?.files)||!entry.implementation.files.length))
   add(id+": implementation paths are required");
  if(entry.stage==="ready-to-merge"){
   for(const key of ["unit","browser","screenshots","mobilePerformance"])
    if(!filled(entry.validation?.[key]))add(id+": missing test evidence "+key);
   if(entry.visualApproval?.state!=="approved")add(id+": user visual approval is required before publishing");
  }
 }
 return errors;
}
export function createVfxDraft(name,catalog){
 const id=String(name||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"")
 .toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
 if(!id)throw Error("Move name required");
 return {[id]:{stage:"pending",mechanics:{reference:"",behavior:""},
  animation:{origin:"",travel:"",contact:"",aftermath:""},
  originalSources:Object.fromEntries(LEGACY.map(key=>[key,{state:"pending",reference:"",finding:""}])),
  libraryReview:Object.fromEntries(catalog.sources.map(s=>[s.id,{
    state:"pending",effectRef:"",reason:"",licenseChecked:false,
    fit:{semantics:null,pixelArt:null,phaser:null,performance:null},
    sourceURL:s.url,copyState:s.copyState,licenseState:s.licenseState
  }])),selected:[],comparisonRationale:"",implementation:{files:[]},validation:{},
  visualApproval:{state:"pending",evidence:""}}};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const catalog=JSON.parse(fs.readFileSync(path.join(ROOT,"reference-library/vfx-sources/catalog.json"),"utf8"));
 if(process.argv.includes("--draft")){
  const name=process.argv.slice(process.argv.indexOf("--draft")+1).join(" ");
  console.log(JSON.stringify(createVfxDraft(name,catalog),null,2));
 }else{
  const data=JSON.parse(fs.readFileSync(path.join(ROOT,"data/vfx-selection-decisions.json"),"utf8"));
  const errors=validateVfxSelections(data,catalog,requiredVfxIds(ROOT,data));
  if(errors.length){errors.forEach(e=>console.error("VFX AUDIT:",e));process.exitCode=1;}
  else console.log("PASS: VFX source comparison records satisfy required structural checks");
 }
}
