import test from "node:test";
import assert from "node:assert/strict";
import {JOHTO_GEN3_IDS,JOHTO_GEN3_SPEC} from "../tools/pokearena/torre2-johto-gen3-research.js";
import {johtoPose} from "../tools/pokearena/torre2-johto-motion.js";
test("Every one of 43 unapproved Johto moves has a real finite, different PixelFX motion path",()=>{
 const ids=JOHTO_GEN3_IDS.filter(id=>!JOHTO_GEN3_SPEC[id].approved);
 assert.equal(ids.length,43);
 for(const id of ids){
  const positions=[0,.12,.28,.5,.72,.9,.99].map(t=>johtoPose(id,t,{x:120,y:100},{x:275,y:140},175));
  for(const p of positions)for(const n of ["x","y","frame","angle","scale","alpha"])
   assert.ok(Number.isFinite(p[n]),id+" non-finite "+n);
  assert.ok(new Set(positions.map(p=>p.x+","+p.y+","+p.frame+","+p.scale)).size>1,id+" is not animated");
  assert.ok(positions.every(p=>p.frame>=0&&p.frame<=11),id+" frame overflow");
 }
});
test("Approved three VFX cannot be moved or recolored by new motion helper",()=>{
 for(const id of ["powder-snow","whirlpool","zap-cannon"])
  assert.throws(()=>johtoPose(id,.4,{x:10,y:10},{x:30,y:10}),/Approved/);
});
test("Visual stages are grounded in Gen III move semantics",()=>{
 const P={x:100,y:100},Q={x:275,y:145};
 const spikes=johtoPose("spikes",.5,P,Q,190);
 assert.equal(spikes.y,188,"Spikes must land on ground, not float over enemy");
 const milk=johtoPose("milk-drink",.4,P,Q);
 assert.ok(Math.abs(milk.x-P.x)<=7,"Milk Drink self-only");
 const magn=johtoPose("magnitude",.5,P,Q,190);
 assert.ok(magn.y>=160,"Magnitude near ground");
 const web=johtoPose("spider-web",.9,P,Q);
 assert.equal(web.x,Q.x,"Spider Web traps the foe");
 const triple=[.08,.39,.72].map(t=>johtoPose("triple-kick",t,P,Q));
 assert.equal(new Set(triple.map(p=>p.x)).size,3,"Triple Kick must be multiple separate impacts");
 const theft0=johtoPose("thief",.4,P,Q),theft1=johtoPose("thief",.85,P,Q);
 assert.ok(theft0.x>theft1.x,"Thief returns with stolen item trail");
 const pain=johtoPose("pain-split",.25,P,Q);
 assert.ok(pain.x>P.x&&pain.x<Q.x,"Pain Split connects both actors");
});
