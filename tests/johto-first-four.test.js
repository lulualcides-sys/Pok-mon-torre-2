import test from "node:test";
import assert from "node:assert/strict";
import {FIRST_FOUR,FRAME_COUNT,FRAME_WIDTH,FRAME_HEIGHT,drawBatchFourFrames}
 from "../tools/pokearena/torre2-johto-first-four-sheets.mjs";
import {JOHTO_LAB_VISIBLE,JOHTO_LAB_ALL,JOHTO_LAB_DEFAULT}
 from "../tools/pokearena/torre2-johto-lab-catalog.js";
test("Exactly four unapproved moves visible; 3 approved preserved in catalog",()=>{
 assert.deepEqual(JOHTO_LAB_VISIBLE.map(x=>x.id),FIRST_FOUR);
 assert.deepEqual([...JOHTO_LAB_DEFAULT],FIRST_FOUR);
 assert.equal(JOHTO_LAB_ALL.length,46);
 for(const id of ["powder-snow","whirlpool","zap-cannon"]){
  assert.ok(JOHTO_LAB_ALL.some(m=>m.id===id));
  assert.ok(!JOHTO_LAB_VISIBLE.some(m=>m.id===id));
  assert.throws(()=>drawBatchFourFrames(id),/Not an unapproved/);
 }
});
test("Each of four sprites has 24 distinct moving nonempty native RGBA frames",()=>{
 assert.equal(FRAME_COUNT,24);assert.equal(FRAME_WIDTH,96);assert.equal(FRAME_HEIGHT,96);
 const outputs=[];
 for(const id of FIRST_FOUR){
  const {rgba,hashes}=drawBatchFourFrames(id);
  assert.equal(rgba.length,2304*96*4);
  assert.equal(hashes.length,24);
  assert.equal(new Set(hashes).size,24,id+" cannot be static");
  outputs.push(hashes.join(","));
 }
 assert.equal(new Set(outputs).size,4);
});
test("Gen III move specifics and global 1s cooldown",()=>{
 for(const move of JOHTO_LAB_VISIBLE)assert.equal(move.cd,1);
 const thief=JOHTO_LAB_VISIBLE.find(x=>x.id==="thief");
 const snore=JOHTO_LAB_VISIBLE.find(x=>x.id==="snore");
 assert.equal(thief.poder,40);assert.equal(thief.categoria,"SPECIAL");
 assert.equal(thief.pp,10);assert.equal(snore.poder,40);assert.equal(snore.categoria,"PHYSICAL");
});
