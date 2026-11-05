import test from "node:test";
import assert from "node:assert/strict";
import {JOHTO_LAB_VISIBLE,JOHTO_LAB_ALL,JOHTO_LAB_DEFAULT}
 from "../tools/pokearena/torre2-johto-lab-catalog.js";
import {JOHTO_FOUR_NATIVE_IDS,makeJohtoFourNative} from "../tools/pokearena/torre2-johto-four-native.js";
test("Only four unapproved attacks are in the review UI; approved three untouched",()=>{
 assert.deepEqual(JOHTO_LAB_VISIBLE.map(x=>x.id),JOHTO_FOUR_NATIVE_IDS);
 assert.deepEqual([...JOHTO_LAB_DEFAULT],JOHTO_FOUR_NATIVE_IDS);
 assert.equal(JOHTO_LAB_ALL.length,46);
 for(const id of ["powder-snow","whirlpool","zap-cannon"]){
  assert.ok(JOHTO_LAB_ALL.some(x=>x.id===id));
  assert.ok(!JOHTO_LAB_VISIBLE.some(x=>x.id===id));
  assert.equal(makeJohtoFourNative({},id),null);
 }
});
test("All four VFX move and change native P2 sprite layers, no painted rectangles",()=>{
 const names=new Set(["p-cuchilla","p-estrella","p-aura","p-fantasma","p-hipnosis","p-espuma","p-agua"]);
 const scene={textures:{exists(id){return names.has(id)},get(){return{setFilter(){}}}},
  add:{image(x,y,id){return {
   name:id,active:true,visible:false,alpha:0,
   setDepth(){return this},setAlpha(x){this.alpha=x;return this},
   setTint(){return this},setBlendMode(){return this},
   setVisible(x){this.visible=x;return this},
   setPosition(x,y){this.x=x;this.y=y;return this},
   setDisplaySize(w,h){this.w=w;this.h=h;return this},
   setAngle(x){this.angle=x;return this},
   setFlipX(){return this},destroy(){this.active=false}
  }}}};
 globalThis.Phaser={BlendModes:{NORMAL:0},Textures:{FilterMode:{NEAREST:1}}};
 try{
  for(const id of JOHTO_FOUR_NATIVE_IDS){
   const fx=makeJohtoFourNative(scene,id);
   assert.equal(fx.source,"pokearena2d-native-textures");
   assert.ok(fx.sprites.length>=8,"Need layered animation for "+id);
   const poses=[];
   for(const t of [.04,.16,.32,.5,.7,.9]){
    fx.update(t,{x:170,y:146},{x:293,y:151});
    poses.push(fx.sprites.map(o=>o.visible?
     [o.x,o.y,o.w,o.h,Math.round(o.alpha*100)].join(","):"off").join("|"));
   }
   assert.ok(new Set(poses).size>=5,"Native animation is static for "+id);
   fx.destroy();assert.ok(fx.sprites.every(x=>!x.active));
  }
 }finally{delete globalThis.Phaser}
});
test("Gen III stats and one-second shared lab cooldown remain",()=>{
 for(const m of JOHTO_LAB_VISIBLE)assert.equal(m.cd,1);
 const thief=JOHTO_LAB_VISIBLE.find(x=>x.id==="thief");
 const snore=JOHTO_LAB_VISIBLE.find(x=>x.id==="snore");
 assert.equal(thief.poder,40);assert.equal(thief.categoria,"SPECIAL");
 assert.equal(thief.pp,10);assert.equal(snore.poder,40);assert.equal(snore.categoria,"PHYSICAL");
});
