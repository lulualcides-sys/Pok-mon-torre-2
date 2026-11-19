/* Alpha 0.76.2 new native species: sprite sync, BUILD TIME ONLY.
 * The base client's own packs for these forms (assets/p/*.bin) answer
 * HTTP 403, so the SAME PMDCollab SpriteCollab art is installed from the
 * pinned public repository, with CC BY-NC 4.0 credits. Additive only:
 * existing native or Torre 2 PMD entries are never overwritten.
 */
import fs from "node:fs/promises";
import path from "node:path";
import {JOHTO_SPRITECOLLAB_COMMIT} from "./install-johto-sprites.mjs";

const COMMIT=JOHTO_SPRITECOLLAB_COMMIT;
const ROOT="https://raw.githubusercontent.com/PMDCollab/SpriteCollab/"+COMMIT+"/";
const ACTIONS=["Idle","Walk","Attack","Shoot","Charge","Hurt","Faint",
 "Hop","Swing","Double","Rotate","Pose","Strike"];
// [manifest key, SpriteCollab path, label]
export const ALPHA0762_SPRITE_FORMS=Object.freeze([
 ["0439","0439","Mime Jr."],["0474","0474","Porygon-Z"],
 ["0252","0252","Treecko"],["0253","0253","Grovyle"],["0254","0254","Sceptile"],
 ["0302","0302","Sableye"],["0302-0001","0302/0001","Mega Sableye"],
 ["0390","0390","Chimchar"],["0391","0391","Monferno"],["0392","0392","Infernape"],
 ["0577","0577","Solosis"],["0578","0578","Duosion"],["0579","0579","Reuniclus"],
 ["0679","0679","Honedge"],["0680","0680","Doublade"],
 ["0681","0681","Aegislash"],["0681-0001","0681/0001","Aegislash Blade"],
 ["0378","0378","Regice"],["0807","0807","Zeraora"],
 ["0720","0720","Hoopa"],["0720-0001","0720/0001","Hoopa Unbound"]
]);
const tag=(source,name)=>source.match(new RegExp("<"+name+">([\\s\\S]*?)<\\/"+name+">"))?.[1]?.trim()||"";
function animations(xml,key){
 const anims={},descriptions=new Map();
 for(const match of xml.matchAll(/<Anim>([\s\S]*?)<\/Anim>/g)){
  const block=match[1],name=tag(block,"Name");
  if(name)descriptions.set(name,{name,copy:tag(block,"CopyOf"),
   fw:Number(tag(block,"FrameWidth")),fh:Number(tag(block,"FrameHeight")),
   durations:[...block.matchAll(/<Duration>(\d+)<\/Duration>/g)].map(m=>+m[1]),
   hitFrame:tag(block,"HitFrame")?Number(tag(block,"HitFrame")):-1,
   returnFrame:tag(block,"ReturnFrame")?Number(tag(block,"ReturnFrame")):-1});
 }
 for(const name of ACTIONS){
  let src=descriptions.get(name),real=name,depth=0;
  if(!src)continue;
  while(src?.copy&&depth++<8){real=src.copy;src=descriptions.get(real)}
  if(!src||src.fw<1||src.fh<1||!src.durations.length)continue;
  anims[name]={file:key+"/"+real+"-Anim.png",fw:src.fw,fh:src.fh,
   durations:src.durations,hitFrame:src.hitFrame,returnFrame:src.returnFrame};
 }
 return anims;
}
async function load(url,mandatory=true){
 let error=null;
 for(let attempt=0;attempt<3;attempt++){
  try{
   const response=await fetch(url,{headers:{"User-Agent":"pokemon-torre-2-sprite-build"}});
   if(response.ok)return Buffer.from(await response.arrayBuffer());
   if(response.status===404){if(mandatory)throw Error("Sprite not found: "+url);return null}
   error=Error("HTTP "+response.status+" "+url);
  }catch(e){error=e}
  await new Promise(done=>setTimeout(done,150*(attempt+1)));
 }
 if(mandatory)throw error;
 return null;
}
export async function installAlpha0762SpeciesSprites(site){
 const root=path.join(site,"assets/pmd"),manifestFile=path.join(root,"manifest.json");
 const manifest=JSON.parse(await fs.readFile(manifestFile,"utf8"));
 const missing=ALPHA0762_SPRITE_FORMS.filter(([key])=>!manifest[key]);
 let png=0,bytes=0;
 for(const [key,src] of missing){
  const xml=(await load(ROOT+"sprite/"+src+"/AnimData.xml")).toString("utf8");
  const anims=animations(xml,key);
  if(!anims.Idle)throw Error("SpriteCollab lacks Idle sheet for "+key);
  const files=[...new Set(Object.values(anims).map(a=>a.file))];
  for(const file of files){
   const data=await load(ROOT+"sprite/"+src+"/"+file.slice(key.length+1),file.endsWith("/Idle-Anim.png"));
   if(!data){for(const a of Object.values(anims))if(a.file===file)a.file=null;continue}
   await fs.mkdir(path.join(root,key),{recursive:true});
   await fs.writeFile(path.join(root,file),data);png++;bytes+=data.length;
  }
  for(const [name,a] of Object.entries(anims))if(!a.file)delete anims[name];
  const portrait=await load(ROOT+"portrait/"+src+"/Normal.png");
  await fs.writeFile(path.join(root,key,"portrait.png"),portrait);png++;bytes+=portrait.length;
  manifest[key]={shadowSize:Number(tag(xml,"ShadowSize"))||1,anims,feet:0,head:-16,width:24};
 }
 for(const [key] of ALPHA0762_SPRITE_FORMS)
  if(!manifest[key]?.anims?.Idle)throw Error("Alpha 0.76.2 sprite coverage incomplete for "+key);
 await fs.writeFile(manifestFile,JSON.stringify(manifest));
 await fs.writeFile(path.join(root,"ALPHA0762-SPRITECOLLAB-CREDITS.txt"),
  "Alpha 0.76.2 new species art ("+ALPHA0762_SPRITE_FORMS.map(f=>f[2]).join(", ")+"): PMDCollab SpriteCollab.\n"+
  "Source: https://github.com/PMDCollab/SpriteCollab\nCommit: "+COMMIT+"\n"+
  "License: CC BY-NC 4.0, non-commercial use and creator credit required.\n"+
  "Creator credits: https://github.com/PMDCollab/SpriteCollab/blob/master/spritebot_credits.txt\n"+
  "Installed because the base client's packs for these forms answer HTTP 403; native files were not overwritten.\n");
 return {forms:ALPHA0762_SPRITE_FORMS.length,installed:missing.length,png,bytes};
}
