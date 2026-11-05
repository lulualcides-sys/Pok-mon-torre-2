import test from "node:test";
import assert from "node:assert/strict";
import {JOHTO_LAB_VISIBLE,JOHTO_LAB_ALL,JOHTO_LAB_DEFAULT}
 from "../tools/pokearena/torre2-johto-lab-catalog.js";
import {JOHTO_FOUR_NATIVE_IDS,makeJohtoFourNative} from "../tools/pokearena/torre2-johto-four-native.js";
test("Only four unapproved attacks are in the review UI; approved three untouched",()=>{
 assert.deepEqual(JOHTO_LAB_VISIBLE.map(x=>x.id),JOHTO_FOUR_NATIVE_IDS);
 assert.deepEqual([...JOHTO_LAB_DEFAULT],JOHTO_FOUR_NATIVE_IDS);
 assert.equal(JOHTO_LAB_ALL.length,46);
 for(const id of ["powder-snow","whirlpool","zap-cannon","triple-kick","octazooka"]){
  assert.ok(JOHTO_LAB_ALL.some(x=>x.id===id));
  assert.ok(!JOHTO_LAB_VISIBLE.some(x=>x.id===id));
  if(!["triple-kick","octazooka"].includes(id))
   assert.equal(makeJohtoFourNative({},id),null);
 }
});
test("All four VFX move and change native P2 sprite layers, no painted rectangles",()=>{
 const names=new Set(["p-cuchilla","p-estrella","p-aura","p-fantasma","p-hipnosis","p-espuma","p-agua","p-sombra","p-psiquico","p-mira","p-guijarro",
 "vfx-quickattack","vfx-arco","vfx-astonish","vfx-acometida","vfx-cuchilla","vfx-fly","vfx-aeroblast","vfx-roca"]);
 const scene={textures:{exists(id){return names.has(id)},get(){return{setFilter(){}}}},
  add:{image(x,y,id){return {
   name:id,active:true,visible:false,alpha:0,
   setDepth(){return this},setAlpha(x){this.alpha=x;return this},
   setTint(){return this},setBlendMode(){return this},
   setFrame(n){this.frame=n;return this},
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
    fx.update(t,{x:170,y:146},{x:293,y:151},{
     hitIndex:Math.min(2,Math.floor(t*3)),hitAge:t*.27,
     hitPoint:{x:293,y:151},projectile:{x:170+(293-170)*t,y:146+5*t,active:t<.7}
    });
    poses.push(fx.sprites.map(o=>o.visible?
     [o.x,o.y,o.w,o.h,o.frame,Math.round(o.alpha*100)].join(","):"off").join("|"));
   }
   assert.ok(new Set(poses).size>=5,"Native animation is static for "+id);
   fx.destroy();assert.ok(fx.sprites.every(x=>!x.active));
  }
 }finally{delete globalThis.Phaser}
});
test("Gen III stats and one-second shared lab cooldown remain",()=>{
 for(const m of JOHTO_LAB_VISIBLE)assert.equal(m.cd,1);
 const thief=JOHTO_LAB_VISIBLE.find(x=>x.id==="thief");
 const rock=JOHTO_LAB_VISIBLE.find(x=>x.id==="rock-smash");
 assert.equal(thief.poder,40);assert.equal(thief.categoria,"SPECIAL");
 assert.equal(thief.pp,10);assert.equal(rock.poder,20);assert.equal(rock.categoria,"PHYSICAL");
 assert.equal(rock.precisao,100);assert.equal(rock.pp,15);
});

test("P2 contact geometry rejects remote melee and accepts actual overlapping body",async()=>{
 const {johtoP2BodyContact,johtoP2Advance}
  =await import("../tools/pokearena/torre2-johto-four-native.js");
 const foe={x:280,y:190,alto:39,est:{}};
 assert.equal(johtoP2BodyContact(foe,180,190,16,0,18),false);
 assert.equal(johtoP2BodyContact(foe,267,190,16,0,18),true);
 assert.equal(Math.min(70+25,100-17),83);
 assert.equal(johtoP2BodyContact(foe,263,190,16,0,18),true);
 assert.equal(johtoP2BodyContact({...foe,est:{vuelo:true}},280,190,16,0,18),false);
 assert.deepEqual(johtoP2Advance({x:180,y:190},0,80,0),{x:180,y:190});
 assert.equal(Math.round(johtoP2Advance({x:180,y:190},0,80,1).x),260);
});
test("Triple Kick never paints a hit without confirmed native recibir",()=>{
 const names=new Set(["p-cuchilla","p-estrella","p-aura"]);
 const scene={textures:{exists(id){return names.has(id)},get(){return{setFilter(){}}}},
  add:{image(x,y,id){return{
   active:true,visible:false,setDepth(){return this},setAlpha(){return this},
   setTint(){return this},setBlendMode(){return this},setVisible(v){this.visible=v;return this},
   setPosition(){return this},setDisplaySize(){return this},
   setAngle(){return this},setFlipX(){return this},destroy(){this.active=false}
  }}}};
 globalThis.Phaser={BlendModes:{NORMAL:0},Textures:{FilterMode:{NEAREST:1}}};
 try{
  const fx=makeJohtoFourNative(scene,"triple-kick");
  fx.update(.3,{x:180,y:140},{x:280,y:140});
  assert.equal(fx.sprites.filter(s=>s.visible).length,0);
  fx.update(.3,{x:180,y:140},{x:280,y:140},
   {hitIndex:0,hitAge:.045});
  assert.ok(fx.sprites.some(s=>s.visible),"Visible only after confirmed native contact");
  fx.destroy();
 }finally{delete globalThis.Phaser}
});
