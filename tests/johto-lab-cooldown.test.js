import test from "node:test";
import assert from "node:assert/strict";
import {withJohtoLabCooldown,JOHTO_LAB_COOLDOWN_SECONDS} from "../tools/pokearena/torre2-johto-lab-cooldown.js";
import {JOHTO_LAB_ALL,JOHTO_LAB_DEFAULT,makeJohtoTrainingKit} from "../tools/pokearena/torre2-johto-lab-catalog.js";
test("46 Johto test moves have 1s cooldown; production move pools unaffected",()=>{
 assert.equal(JOHTO_LAB_COOLDOWN_SECONDS,1);
 assert.equal(JOHTO_LAB_ALL.length,46);
 for(const m of JOHTO_LAB_ALL)assert.equal(m.cd,1,m.id);
 for(const m of Object.values(makeJohtoTrainingKit(JOHTO_LAB_DEFAULT)))assert.equal(m.cd,1);
});
test("Shared 1s cooldown blocks rapid repeats and swapping attack buttons",()=>{
 const scene={datos:{johtoLab:true},efectos:[]};
 const me={escena:scene,t:10,cd:{lmb:0,rmb:0,q:0,e:0}};
 let calls=0;
 const cast=withJohtoLabCooldown(()=>{calls++;scene.efectos.push({update(){return true},destroy(){}});return true;});
 const other=withJohtoLabCooldown(()=>{calls++;return true;});
 assert.equal(cast(me),true);
 assert.deepEqual(me.cd,{lmb:1,rmb:1,q:1,e:1});
 assert.equal(cast(me),false);
 assert.equal(other(me),false);
 me.t=10.99;assert.equal(other(me),false);
 me.t=11.01;assert.equal(other(me),false,"Still-playing VFX cannot be stacked");
 scene.efectos[0].destroy();
 assert.equal(other(me),true);
 assert.equal(calls,2);
});
test("Failed cast does not consume cooldown; effect completion releases guard",()=>{
 const scene={datos:{johtoLab:true},efectos:[]};
 const me={escena:scene,t:5,cd:{lmb:0,rmb:0,q:0,e:0}};
 assert.equal(withJohtoLabCooldown(()=>false)(me),false);
 assert.equal(me.__johtoLabNextCastAt,undefined);
 const cast=withJohtoLabCooldown(()=>{
  scene.efectos.push({update(){return false},destroy(){}});
  return true;
 });
 assert.equal(cast(me),true);
 assert.equal(scene.efectos[0].update(.2),false);
 me.t=6;assert.equal(cast(me),true);
});
test("Lab-only guard never enables preview moves outside training",()=>{
 const me={escena:{datos:{torre2:true},efectos:[]},t:0};
 let n=0;
 assert.equal(withJohtoLabCooldown(()=>{n++;return true;})(me),false);
 assert.equal(n,0);
});
