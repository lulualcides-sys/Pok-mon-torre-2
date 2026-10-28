import test from 'node:test';
import assert from 'node:assert/strict';
import {toxic,TORRE2_TOXIC_FORMS} from '../tools/pokearena/torre2-toxic-fx.js';
import {tickGen3Status,serializeGen3Status,restoreGen3Status}
 from '../tools/pokearena/torre2-gen3-status.js';
const graphics=()=>{
 const g={destroyed:false,colors:[],setDepth(){return this},
  clear(){return this},fillStyle(color){this.colors.push(color);return this},
  fillRect(){return this},destroy(){this.destroyed=true}};
 return g;
};
function make(types=['NORMAL'],aim=true){
 const objects=[],scene={datos:{torre2:true},efectos:[],add:{graphics(){
  const g=graphics();objects.push(g);return g;
 }}};
 const enemy={x:95,y:100,alto:36,hp:160,hpMax:160,tipos:types,est:{},ko:false};
 const actor={x:0,y:100,ax:aim?120:0,ay:aim?83:240,alto:36,escena:scene,
  rival:enemy,est:{},ko:false,animar(){}};
 return {actor,enemy,scene,objects};
}
function play(a,h,seed=()=>0){
 const original=Math.random;Math.random=seed;
 try{
  const fx=toxic(a.actor,h,{slot:'q'});
  for(let i=0;i<100;i++){
   if(fx.update(.016)===false)break;
  }
  return fx;
 }finally{Math.random=original}
}
test('Toxic uses its own named Phaser effect, not a modified approved move',()=>{
 assert.equal(typeof TORRE2_TOXIC_FORMS.torre2_toxic,'function');
 const a=make();
 play(a,{nombre:'Toxic',dano:0,precisao:85,alcance:225});
 assert.equal(a.enemy.hp,160,'Toxic deals no direct damage in FRLG');
 assert.equal(a.enemy.est.veneno.toxic,true,'Only a real contact applies escalating poison');
 const colors=new Set(a.objects.flatMap(x=>x.colors));
 for(const color of [0x130c24,0x78258e,0xe7b4f2])
  assert.ok(colors.has(color),'Toxic pixel palette '+color.toString(16));
 assert.ok(a.objects.every(x=>x.destroyed),'Phaser graphics must be released');
});
test('Gen III Toxic scales at 1/16, 2/16; save + swap reset increments',()=>{
 const a=make();play(a,{nombre:'Toxic',dano:0,precisao:85});
 tickGen3Status(a.enemy,4);assert.equal(a.enemy.hp,150);
 tickGen3Status(a.enemy,4);assert.equal(a.enemy.hp,130);
 const frozen=JSON.parse(JSON.stringify(serializeGen3Status(a.enemy)));
 const next={hp:160,hpMax:160,tipos:['NORMAL'],est:{},ko:false};
 restoreGen3Status(next,frozen);tickGen3Status(next,4);
 assert.equal(next.hp,150);
});
test('Poison/Steel immunity, existing status and misses do not apply Toxic',()=>{
 for(const types of [['POISON'],['STEEL']]){
  const a=make(types);play(a,{nombre:'Toxic',precisao:85});
  assert.deepEqual(a.enemy.est,{},types+' immune');
 }
 const other=make();other.enemy.est.quemado={torre2Status:true};
 play(other,{nombre:'Toxic',precisao:85});
 assert.equal(other.enemy.est.veneno,undefined,'Do not replace main condition');
 const miss=make();play(miss,{nombre:'Toxic',precisao:85},()=>.999);
 assert.equal(miss.enemy.est.veneno,undefined,'85% accuracy must allow misses');
 const noAim=make(['NORMAL'],false);play(noAim,{nombre:'Toxic',precisao:85});
 assert.equal(noAim.enemy.est.veneno,undefined,'No auto-homing');
});
test('Graphics and status do not leak on cancelled or expired projectile',()=>{
 const a=make();const effect=toxic(a.actor,{nombre:'Toxic',precisao:85});
 a.actor.ko=true;assert.equal(effect.update(.016),false);
 assert.ok(a.objects.every(x=>x.destroyed));
 const b=make(['NORMAL'],false);
 play(b,{nombre:'Toxic',precisao:85});
 assert.ok(b.objects.every(x=>x.destroyed));
});
