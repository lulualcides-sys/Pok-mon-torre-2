import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

// Standalone logic/renderer regression: stub only the native clash import.
// No modifications to approved Poké Arena 2D modules required.
const code=await fs.readFile(new URL('../tools/pokearena/torre2-steel-fx.js',import.meta.url),'utf8');
assert.ok(code.includes("import {clashAt} from './clash-fx.js';"));
const isolated=code.replace("import {clashAt} from './clash-fx.js';",
 "const clashAt=()=>false;");
const {TORRE2_STEEL_FORMS}=await import('data:text/javascript;charset=utf-8,'+
 encodeURIComponent(isolated));
function scene(){
 const e={efectos:[],pixels:0};
 e.add={graphics(){
  const g={clear(){return this},setDepth(){return this},
   fillStyle(){return this},fillRect(){e.pixels++;return this},
   destroy(){this.destroyed=true;return this}};
  return g;
 }};
 return e;
}
function actors(ay=80){
 const e=scene();
 const foe={x:137,y:80,alto:40,hp:300,hpMax:300,ko:false,est:{},
  recibir(source,g){if(this.ko)return 'nada';this.hp=Math.max(0,this.hp-g.dano);
   if(this.hp===0)this.ko=true;return 'golpe'}};
 const user={x:0,y:80,ax:250,ay,alto:40,escena:e,rival:foe,
  hp:300,hpMax:300,ko:false,est:{},t:0,
  animar(){},
  recibir(source,g){this.hp=Math.max(0,this.hp-g.dano);
   if(this.hp===0)this.ko=true;return 'golpe'}};
 return {user,foe,e};
}
function run(form,attributes,angle=80){
 const {user,foe,e}=actors(angle);
 const fx=TORRE2_STEEL_FORMS[form](user,attributes,{slot:'q'});
 assert.ok(e.efectos.includes(fx),'Move installs in real Phaser effect update list');
 for(let frame=0;frame<145;frame++){
  e.efectos=e.efectos.filter(f=>f.update(1/60));
 }
 assert.ok(e.pixels>500,'Rendered many moving opaque pixel cells via WebGL Graphics');
 assert.equal(e.efectos.length,0,'Effect must clean up completely');
 return {user,foe,e};
}
test('Flash Cannon: concentrated silver pixels, real hit, one-stage SpDef',()=>{
 const old=Math.random;Math.random=()=>0;
 try{
  const hit=run('torre2_flashcannon',{dano:16,precisao:100,alcance:250});
  assert.equal(hit.foe.hp,284);
  assert.equal(hit.foe.est.torre2SteelSpDef.stacks,1);
  const miss=run('torre2_flashcannon',{dano:16,precisao:100,alcance:250},240);
  assert.equal(miss.foe.hp,300,'aiming away MUST miss');
  assert.equal(miss.foe.est.torre2SteelSpDef,undefined);
 }finally{Math.random=old}
});
test('Mirror Shot: rotating mirror is its own VFX, accuracy debuff only on hit',()=>{
 const old=Math.random;Math.random=()=>0;
 try{
  const hit=run('torre2_mirrorshot',{dano:13,precisao:85,alcance:250});
  assert.equal(hit.foe.hp,287);
  assert.equal(hit.foe.est.torre2MudAccuracy.stacks,1);
  const miss=run('torre2_mirrorshot',{dano:13,precisao:85,alcance:250},240);
  assert.equal(miss.foe.hp,300);
  assert.equal(miss.foe.est.torre2MudAccuracy,undefined);
 }finally{Math.random=old}
});
test('Steel Beam: heavy beam, one hit, 50% MAX HP recoil on hit and miss',()=>{
 const old=Math.random;Math.random=()=>0;
 try{
  const hit=run('torre2_steelbeam',{dano:28,precisao:95,alcance:320});
  assert.equal(hit.foe.hp,272);
  assert.equal(hit.user.hp,150);
  const miss=run('torre2_steelbeam',{dano:28,precisao:95,alcance:320},260);
  assert.equal(miss.foe.hp,300);
  assert.equal(miss.user.hp,150,'Recoil applies even when beam completely misses');
 }finally{Math.random=old}
});
