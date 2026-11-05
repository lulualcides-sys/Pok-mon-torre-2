import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {validateVfxSelections,requiredVfxIds,parseJohtoVisualIds,createVfxDraft}
 from "../tools/dev/vfx-review-policy.mjs";
const catalog=JSON.parse(fs.readFileSync("reference-library/vfx-sources/catalog.json","utf8"));
const baseline=JSON.parse(fs.readFileSync("data/vfx-selection-decisions.json","utf8"));
const example=()=>{
 const reviews=Object.fromEntries(catalog.sources.map(s=>{
  const blocked=["conflict","missing"].includes(s.licenseState);
  const candidate=s.copyState==="selected-samples-local"&&!blocked;
  return [s.id,{state:blocked?"blocked":candidate?"candidate":"unavailable",
   effectRef:candidate?"reference-library/vfx-sources/"+s.id+"/"+s.localSamples[0]:"",
   licenseChecked:candidate,
   reason:"Examined source availability, licensed samples, semantic effect silhouette and animation pacing.",
   fit:candidate?{semantics:4,pixelArt:4,phaser:3,performance:3}:undefined}];
 }));
 return {stage:"research-complete",
  mechanics:{reference:"https://pokemondb.net/move/steel-wing",
   behavior:"A Steel-type attack using hardened wings with a chance to raise Defense."},
  animation:{origin:"The metallic sheen starts from the actual attacker's wing.",
   travel:"The hard-wing motion sweeps from attacker toward the rival.",
   contact:"A distinct metal slash hits the correct opponent body.",
   aftermath:"Small silver fragments disperse without a generic ball."},
  originalSources:Object.fromEntries(["T2","P2","Z","E"].map(key=>[key,{
   state:"inspected",reference:"project/core/"+key+"/named-effect",
   finding:"Inspected the available original code and its relevant movement and collision."}])),
  libraryReview:reviews,
  selected:[{sourceId:"pixelbolt",effectRef:reviews.pixelbolt.effectRef,
   contribution:"Reuse the licensed metallic slash recipe for a real wing sweep instead of a generic orb."}],
  comparisonRationale:"Pixelbolt's slash gesture describes Steel Wing more accurately than the other available elemental orbs; retain actual Phaser timing.",
  implementation:{files:[]},validation:{},visualApproval:{state:"pending",evidence:""}};
};
test("Legacy existing moves are not falsely classified as newly audited",()=>{
 assert.equal(baseline.legacyMoveIds.length,40);
 // Compare legacy behavior in a fixture without experimental Johto modules.
 const fixture=fs.mkdtempSync(path.join(os.tmpdir(),"torre2-vfx-legacy-"));
 try{
  fs.mkdirSync(path.join(fixture,"data"),{recursive:true});
  fs.writeFileSync(path.join(fixture,"data/move-reuse-policy.json"),JSON.stringify({newMoves:{}}));
  assert.deepEqual(requiredVfxIds(fixture,baseline),[]);
 }finally{fs.rmSync(fixture,{recursive:true,force:true});}
 assert.deepEqual(validateVfxSelections(baseline,catalog,[]),[]);
});
test("New experimental Johto effects require individual VFX audits, not legacy exemption",()=>{
 const ids=requiredVfxIds(process.cwd(),baseline);
 if(fs.existsSync("tools/pokearena/torre2-johto-pixelfx-catalog.js")){
  assert.deepEqual(ids,["beat-up","hidden-power","pursuit","vital-throw"]);
  assert.equal(validateVfxSelections({...baseline,decisions:{}},catalog,ids)
   .filter(x=>x.includes("MISSING VFX source comparison")).length,4);
  const reviews=JSON.parse(fs.readFileSync("data/vfx-selection-decisions.json","utf8"));
  assert.deepEqual(validateVfxSelections(reviews,catalog,ids),[]);
  assert.equal(Object.keys(reviews.decisions).length,15);
  assert.ok(reviews.decisions.snore,"Rejected Snore history must not be erased");
  for(const id of ["triple-kick","octazooka","thief","false-swipe","steel-wing","rock-smash","return","present","frustration","magnitude","hidden-power"])
   assert.ok(reviews.decisions[id],"Previously approved visual audit preserved");
  for(const id of ids)assert.equal(reviews.decisions[id].visualApproval.state,
    id==="hidden-power"?"approved":"pending");
 }else assert.deepEqual(ids,[]);
});
test("Valid individual move comparison covers all ten sources and four native references",()=>{
 const data={...baseline,decisions:{"steel-wing":example()}};
 assert.deepEqual(validateVfxSelections(data,catalog,["steel-wing"]),[]);
});
test("P2 source can be selected when its real native texture reuse is documented",()=>{
 const row=example(),effectRef="tools/pokearena/torre2-johto-four-native.js#createTriple";
 row.originalSources.P2.effectRef=effectRef;
 row.selected=[{sourceId:"P2",effectRef,contribution:"Reuse P2 texture layers and animation timing without changing the existing approved sprites."}];
 assert.deepEqual(validateVfxSelections({...baseline,decisions:{"steel-wing":row}},catalog,["steel-wing"]),[]);
});
test("New move is blocked when no comparison record exists",()=>{
 assert.ok(validateVfxSelections(baseline,catalog,["new-test-move"]).some(x=>x.includes("MISSING")));
});
test("One default PixelFX is NOT enough: missing an alternative blocks review",()=>{
 const row=example();delete row.libraryReview.pixelbolt;
 const errors=validateVfxSelections({...baseline,decisions:{"steel-wing":row}},catalog,["steel-wing"]);
 assert.ok(errors.some(x=>x.includes("unreviewed library pixelbolt")));
});
test("Conflicting and missing licenses cannot be selected",()=>{
 const row=example();
 row.libraryReview.pixeldust={state:"candidate",effectRef:"some unsafe particle file path",licenseChecked:true,
  reason:"An effect that looks interesting but has no verified source license.",
  fit:{semantics:5,pixelArt:5,phaser:5,performance:5}};
 assert.ok(validateVfxSelections({...baseline,decisions:{"steel-wing":row}},catalog,["steel-wing"])
  .some(x=>x.includes("license-blocked library pixeldust")));
});
test("CI cannot substitute visual approval, browser testing or mobile checks",()=>{
 const row=example();row.stage="ready-to-merge";
 const problems=validateVfxSelections({...baseline,decisions:{"steel-wing":row}},catalog,["steel-wing"]);
 assert.ok(problems.some(x=>x.includes("user visual approval")));
 assert.ok(problems.some(x=>x.includes("missing test evidence browser")));
});
test("Draft is deliberately unapproved and cannot pass without actual comparison",()=>{
 const draft=createVfxDraft("Steel Wing",catalog);
 assert.equal(Object.keys(draft["steel-wing"].libraryReview).length,10);
 assert.ok(validateVfxSelections({...baseline,decisions:draft},catalog,["steel-wing"])
  .some(x=>x.includes("unreviewed library")));
});
test("Johto catalog VFX ids are discoverable for future 43-move merge gate",()=>{
 const code='export const A=[{"id":"spider-web","fx":"a"}]; const B=[{id:"steel-wing",fx:"b"}]';
 assert.deepEqual(parseJohtoVisualIds(code),["spider-web","steel-wing"]);
});
