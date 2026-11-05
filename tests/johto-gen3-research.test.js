import test from "node:test";
import assert from "node:assert/strict";
import {JOHTO_LAB_ALL} from "../tools/pokearena/torre2-johto-lab-catalog.js";
import {JOHTO_GEN3_SPEC,JOHTO_GEN3_IDS,JOHTO_GEN3_STATUS} from "../tools/pokearena/torre2-johto-gen3-research.js";
import {JOHTO_APPROVED_3,JOHTO_PIXELFX_REWORK_15,JOHTO_PIXELFX_28} from "../tools/pokearena/torre2-johto-pixelfx-catalog.js";
test("All 46 Johto moves have documented Gen III behavior, cinematic staging and official move page",()=>{
 assert.equal(JOHTO_GEN3_IDS.length,46);
 assert.deepEqual(new Set(JOHTO_GEN3_IDS),new Set(JOHTO_LAB_ALL.map(m=>m.id)));
 for(const m of Object.values(JOHTO_GEN3_SPEC)){
  assert.ok(m.effect.length>15&&m.visual.length>12,m.id);
  assert.match(m.source,new RegExp("/move/"+m.id+"$"));
  assert.ok(m.anchor&&m.motion);
 }
});
test("Only the original three are marked immutable",()=>{
 assert.deepEqual(JOHTO_GEN3_IDS.filter(id=>JOHTO_GEN3_SPEC[id].approved).sort(),[...JOHTO_APPROVED_3].sort());
 assert.equal(JOHTO_GEN3_STATUS.visualOnly,28);
 assert.equal(JOHTO_PIXELFX_REWORK_15.length+JOHTO_PIXELFX_28.length,43);
});
test("Important Gen III distinctions and unsupported systems are explicitly documented",()=>{
 assert.match(JOHTO_GEN3_SPEC["sweet-kiss"].effect,/Gen III/);
 assert.match(JOHTO_GEN3_SPEC["beat-up"].effect,/Gen III/);
 assert.match(JOHTO_GEN3_SPEC["magnitude"].effect,/4 até 10/);
 assert.match(JOHTO_GEN3_SPEC["present"].effect,/cura/);
 for(const id of ["sketch","baton-pass","spite","hidden-power"])
  assert.match(JOHTO_GEN3_SPEC[id].visual,/desabilitada|indisponível|sem PP|não simulados/);
});
