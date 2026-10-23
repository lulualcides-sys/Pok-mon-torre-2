import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const code=await fs.readFile(new URL('../tools/pokearena/torre2-steel-fx.js',import.meta.url),'utf8');
assert.ok(code.includes("import {clashAt} from './clash-fx.js';"));
const isolated=code.replace("import {clashAt} from './clash-fx.js';",
 "const clashAt=()=>false;");
const {TORRE2_STEEL_FORMS}=await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(isolated));
function scene(){
 const e={efectos:[],pixels:0};
 e.add={graphics(){
  return {clear(){return this},setDepth(){return this},
   fillStyle(){return this},fillRect(){e.pixels++;return this},
   destroy(){this.destroyed=true;return this}};
 }};
 return e;
}
function actors(ay=80){
 const e=scene();
 const foe={x:137,y:80,alto:40,hp:300,hpMax:300,ko:false,est:{},
  recibir(source,h){this.hp=Math.max(0,this.hp-h.dano);
   if(this.hp===0)this.ko=true;return 'golpe'}};
 const user={x:0,y:80,ax:250,ay,alto:40,escena:e,rival:foe,
  hp:300,hpMax:300,ko:false,est:{},t:0,animar(){},
  recibir(source,h){this.hp=Math.max(0,this.hp-h.dano);return 'golpe'}};
 return{user,foe,e};
}
function run(form,h,angle=80){
 const{user,foe,e}=actors(angle);
 const fx=TORRE2_STEEL_FORMS[form](user,h,{slot:'q'});
 assert.ok(e.efectos.includes(fx),'Installs a real battle effect');
 for(let frame=0;frame<145;frame++)
  e.efectos=e.efectos.filter(item=>item.update(1/60));
 assert.ok(e.pixels>500,'Animated pixel geometry rendered with Phaser Graphics');
 assert.equal(e.efectos.length,0,'No leaking frames/effects');
 return{user,foe,e};
}
test('Flash Cannon receives the PREVIOUS Steel Beam metallic ray, with NO recoil',()=>{
 const rand=Math.random;Math.random=()=>0;
 try{
  assert.ok(code.includes("export function flashcannon(l,h,extra){\n const e=l.escena"));
  const hit=run('torre2_flashcannon',{dano:16,precisao:100,alcance:260});
  assert.equal(hit.foe.hp,284);
  assert.equal(hit.user.hp,300,'Flash Cannon must NOT inherit Steel Beam self damage');
  assert.equal(hit.foe.est.torre2SteelSpDef.stacks,1);
  const miss=run('torre2_flashcannon',{dano:16,precisao:100,alcance:260},240);
  assert.equal(miss.foe.hp,300,'Off-axis aim can miss');
 }finally{Math.random=rand}
});
test('Mirror Shot is FLASH light instead of spinning metallic plate',()=>{
 const rand=Math.random;Math.random=()=>0;
 try{
  assert.ok(code.includes('const MIRROR_FLASH='));
  assert.ok(!code.includes('const MIRROR_PLATE='));
  const hit=run('torre2_mirrorshot',{dano:13,precisao:85,alcance:250});
  assert.equal(hit.foe.hp,287);
  assert.equal(hit.foe.est.torre2MudAccuracy.stacks,1);
  const miss=run('torre2_mirrorshot',{dano:13,precisao:85,alcance:250},240);
  assert.equal(miss.foe.hp,300);
 }finally{Math.random=rand}
});
test('Steel Beam REUSES original Aura Storm/Chorro (not custom graphics), and recoils once',()=>{
 const{user,foe,e}=actors();
 const schedule=[];e.programar=(delay,fn)=>schedule.push({delay,fn});
 let wasCalled=false,received=null;
 const native=(actor,h,extra)=>{
  wasCalled=true;received=h;
  assert.equal(actor,user);assert.equal(extra.slot,'q');
  return 'native-Chorro';
 };
 assert.equal(TORRE2_STEEL_FORMS.torre2_steelbeam(user,
  {tipo:'STEEL',dano:28,precisao:95,carga:.38}, {slot:'q'},native),'native-Chorro');
 assert.equal(wasCalled,true);
 assert.equal(received.forma,'chorro');
 assert.equal(received.paleta,'metalTorre2');
 assert.equal(received.haz,true);
 assert.equal(received.trozos,undefined);
 assert.equal(received.tipo,'STEEL');
 assert.equal(received.dano,28);
 assert.equal(user.hp,300,'Recoil happens on native beam launch');
 assert.equal(schedule.length,1);assert.equal(schedule[0].delay,.38);
 schedule[0].fn();schedule[0].fn();
 assert.equal(user.hp,150,'50% maximum HP loss exactly ONCE');
 assert.equal(foe.hp,300,'Wrapper does not fake a hit');
 assert.equal(e.pixels,0,'Wrapper does not paint fake Aura Storm graphics');
});
test('Steel Beam native-palette hook is isolated in build-preview',async()=>{
 const s=await fs.readFile(new URL('../tools/pokearena/build-preview.mjs',import.meta.url),'utf8');
 assert.ok(s.includes('HAZ.metalTorre2='));
 assert.ok(s.includes('PALETAS.metalTorre2='));
 assert.ok(s.includes('torre2_steelbeam:(l,h,extra)=>TORRE2_FORMS.torre2_steelbeam(l,h,extra,chorro)'));
});
