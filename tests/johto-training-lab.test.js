import test from "node:test";
import assert from "node:assert/strict";
import {JOHTO_18,JOHTO_APPROVED_5,JOHTO_LAB_DEFAULT,JOHTO_LAB_SLOTS,validateJohtoLabSlots,makeJohtoTrainingKit,johtoLabMove}
 from "../tools/pokearena/torre2-johto-lab-catalog.js";
test("Johto lab catalog contains 18 unique real identities with explicit renderers",()=>{
 assert.equal(JOHTO_18.length,18);
 assert.equal(new Set(JOHTO_18.map(m=>m.id)).size,18);
 assert.equal(new Set(JOHTO_18.map(m=>m.forma)).size,18);
 for(const m of JOHTO_18){assert.ok(m.nombre&&m.tipo&&m.forma&&m.style);
  assert.equal(m.source,"johto-lab-prototype");
  assert.equal(m.approved,JOHTO_APPROVED_5.includes(m.id));}
});
test("Mewtwo lab enforces four distinct slots without changing original Pokémon kits",()=>{
 assert.ok(validateJohtoLabSlots(JOHTO_LAB_DEFAULT));
 const set=makeJohtoTrainingKit(JOHTO_LAB_DEFAULT);
 assert.deepEqual(Object.keys(set),JOHTO_LAB_SLOTS);
 assert.equal(set.e.ulti,true);
 assert.equal(set.q.ulti,false);
 assert.equal(set.lmb.nome,undefined);
 assert.notStrictEqual(set.lmb,johtoLabMove(JOHTO_LAB_DEFAULT[0]));
 assert.equal(validateJohtoLabSlots(["triple-kick","triple-kick","thief","present"]),false);
 assert.equal(validateJohtoLabSlots(["unknown","thief","present","snore"]),false);
 assert.throws(()=>makeJohtoTrainingKit(["thief","thief","present","snore"]));
});

test("Review UI displays only four offensive moves; preserves all five approved VFX",async()=>{
 const {JOHTO_LAB_REVIEW_4,JOHTO_LAB_VISIBLE,JOHTO_LAB_ALL}
  =await import("../tools/pokearena/torre2-johto-lab-catalog.js");
 assert.deepEqual([...JOHTO_LAB_REVIEW_4],["thief","snore","false-swipe","steel-wing"]);
 assert.deepEqual(JOHTO_LAB_VISIBLE.map(m=>m.id),JOHTO_LAB_REVIEW_4);
 assert.equal(JOHTO_LAB_ALL.length,46);
 for(const id of JOHTO_APPROVED_5){
  assert.ok(JOHTO_LAB_ALL.some(m=>m.id===id),"approved move kept intact");
  assert.ok(!JOHTO_LAB_VISIBLE.some(m=>m.id===id),"approved move hidden from test choices");
 }
});
