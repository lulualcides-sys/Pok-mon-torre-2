import test from "node:test";
import assert from "node:assert/strict";
import {JOHTO_LAB_VISIBLE,JOHTO_LAB_ALL,JOHTO_LAB_DEFAULT}
 from "../tools/pokearena/torre2-johto-lab-catalog.js";
import {JOHTO_FOUR_NATIVE_IDS,makeJohtoFourNative,johtoBatch3Roll} from "../tools/pokearena/torre2-johto-four-native.js";
test("Only Vital Throw remains unapproved; 16 user-approved effects frozen",()=>{
 assert.deepEqual(JOHTO_LAB_VISIBLE.map(x=>x.id),JOHTO_FOUR_NATIVE_IDS);
 assert.deepEqual([...JOHTO_LAB_DEFAULT],JOHTO_FOUR_NATIVE_IDS);
 assert.equal(JOHTO_LAB_VISIBLE.filter(x=>!x.approved).length,1);
 assert.equal(JOHTO_LAB_VISIBLE.find(x=>x.id==="pursuit").approved,true);
 assert.equal(JOHTO_LAB_VISIBLE.find(x=>x.id==="beat-up").approved,true);
 assert.equal(JOHTO_LAB_VISIBLE.find(x=>x.id==="hidden-power").approved,true);
 assert.equal(JOHTO_LAB_ALL.length,46);
 for(const id of ["powder-snow","whirlpool","zap-cannon","triple-kick","octazooka","thief","false-swipe","steel-wing","rock-smash","return","present","frustration","magnitude","hidden-power"]){
  assert.ok(JOHTO_LAB_ALL.some(x=>x.id===id));
  if(!["hidden-power","pursuit","beat-up"].includes(id))
   assert.ok(!JOHTO_LAB_VISIBLE.some(x=>x.id===id));
  else assert.equal(JOHTO_LAB_VISIBLE.find(x=>x.id===id).approved,true);
  if(!["triple-kick","octazooka","thief","false-swipe","steel-wing","rock-smash","return","present","frustration","magnitude","hidden-power"].includes(id))
   assert.equal(makeJohtoFourNative({},id),null);
 }
});
test("All four VFX move and change native P2 sprite layers, no painted rectangles",()=>{
 const names=new Set(["p-cuchilla","p-estrella","p-aura","p-fantasma","p-hipnosis","p-espuma","p-agua","p-sombra","p-psiquico","p-mira","p-guijarro",
 "vfx-quickattack","vfx-arco","vfx-astonish","vfx-acometida","vfx-cuchilla","vfx-fly","vfx-aeroblast","vfx-roca","vfx-huevo","vfx-hiper_impacto","p-corazon","p-brasa","p-roca",
 "vfx-psico","vfx-psywave","p-sombra","vfx-teleporte",
 "vfx-hexgolpe","vfx-hexaviso","vfx-atadura","vfx-rapidspin","vfx-aterriza"]);
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
   assert.equal(fx.source,id==="vital-throw"?"pokearena2d-native-body-motion":"pokearena2d-native-textures");
   if(id==="vital-throw")assert.equal(fx.sprites.length,0,"Vital Throw must have zero visual overlay");
   else assert.ok(fx.sprites.length>=8,"Need layered animation for "+id);
   const poses=[];
   for(const t of [.04,.10,.16,.24,.32,.43,.5,.61,.7,.82,.9,.97]){
    fx.update(t,{x:170,y:146},{x:293,y:151},{
     hitIndex:Math.min(2,Math.floor(t*3)),hitAge:t*.27,
     hitPoint:{x:293,y:151},projectile:{x:170+(293-170)*t,y:146+5*t,active:t<.7}
    });
    poses.push(fx.sprites.map(o=>o.visible?
     [o.x,o.y,o.w,o.h,o.frame,Math.round(o.alpha*100)].join(","):"off").join("|"));
   }
   if(id!=="vital-throw")assert.ok(new Set(poses).size>=5,"Native animation is static for "+id);
   fx.destroy();assert.ok(fx.sprites.every(x=>!x.active));
  }
 }finally{delete globalThis.Phaser}
});
test("Gen III stats and one-second shared lab cooldown remain",async()=>{
 for(const m of JOHTO_LAB_VISIBLE)assert.equal(m.cd,1);
 const pursued=JOHTO_LAB_VISIBLE.find(x=>x.id==="pursuit");
 const throwMove=JOHTO_LAB_VISIBLE.find(x=>x.id==="vital-throw");
 const hidden=JOHTO_LAB_VISIBLE.find(x=>x.id==="hidden-power");
 const beat=JOHTO_LAB_VISIBLE.find(x=>x.id==="beat-up");
 assert.equal(pursued.poder,40);assert.equal(pursued.categoria,"SPECIAL");
 assert.equal(throwMove.poder,70);assert.equal(throwMove.precisao,100);
 assert.equal(hidden.pp,15);assert.equal(beat.pp,10);
 const {hiddenPowerGen3,beatUpGen3Participants}=await import("../tools/pokearena/torre2-johto-gen3-mechanics.js");
 assert.deepEqual(hiddenPowerGen3({hp:31,attack:31,defense:31,speed:31,spAttack:31,spDefense:31}),
   {type:"DARK",power:70});
 assert.equal(beatUpGen3Participants(),1);
 assert.equal(beatUpGen3Participants([{hp:90,est:{}},{hp:0,est:{}},{hp:80,est:{veneno:true}}]),1);
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

test("Pursuit, Vital Throw and Beat Up have distinct native frame identities; no palette-only duplication",()=>{
 const a=()=>new Set(["vfx-quickattack","vfx-aterriza",
 "vfx-acometida","vfx-hiper_impacto","vfx-astonish","p-sombra",
 "p-guijarro","p-estrella"]);
 const sources={
  pursuit:["vfx-quickattack","vfx-astonish"],
  "vital-throw":[],
  "beat-up":["vfx-acometida","vfx-hiper_impacto"]
 };
 const names=a();const scene={textures:{exists(n){return names.has(n)},get(){return{setFilter(){}}}},
  add:{image(_x,_y,name){return {name,active:true,visible:false,
    setDepth(){return this},setAlpha(){return this},setTint(){return this},
    setBlendMode(){return this},setFrame(){return this},setVisible(v){this.visible=v;return this},
    setPosition(){return this},setDisplaySize(){return this},setAngle(){return this},
    setFlipX(){return this},destroy(){this.active=false}}}}};
 globalThis.Phaser={BlendModes:{NORMAL:0},Textures:{FilterMode:{NEAREST:1}}};
 try{
  const fingerprints=[];
  for(const [id,signature] of Object.entries(sources)){
   const fx=makeJohtoFourNative(scene,id);
   assert.ok(fx,id+" must create native effect");
   const assetSet=new Set(fx.sprites.map(s=>s.name));
   for(const key of signature)assert.ok(assetSet.has(key),id+" missing "+key);
   fingerprints.push([...assetSet].sort().join(","));
   if(id==="vital-throw")assert.equal(assetSet.size,0,"No decorative animations for throw");
   if(id==="vital-throw"){
    for(const forbidden of ["vfx-rapidspin","vfx-fly","vfx-atadura"])
      assert.ok(!assetSet.has(forbidden),"Vital Throw must never spin: "+forbidden);
   }
   if(id==="pursuit")for(const forbidden of ["vfx-hexgolpe","vfx-hexaviso","vfx-teleporte"])
    assert.ok(!assetSet.has(forbidden),"Pursuit is chase, NOT spell column: "+forbidden);
   if(id==="beat-up")assert.ok(!assetSet.has("vfx-rapidspin"),"Beat Up has no spin");
   fx.update(.5,{x:180,y:150},{x:280,y:150},
    {actor:{x:260,y:150},hitAge:.09,hitPoint:{x:280,y:150},dirX:1,hitIndex:0});
   if(id!=="vital-throw")assert.ok(fx.sprites.some(s=>s.visible),id+" no visual attack on hit");
   fx.destroy();
  }
  assert.equal(new Set(fingerprints).size,3,"Three rejected identical VFX must have unique textures");
 }finally{delete globalThis.Phaser}
});
