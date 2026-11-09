import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {pathToFileURL} from 'node:url';
// The original Phaser build renames authored modules to their native
// aliases. Stage ONLY the verified four-Punch dependency graph for Node tests.
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'torre2-punch-review-'));
const source=path.resolve('tools/pokearena');
const files=[
 ['torre2-finale13.js','finale13.js'],
 ['torre2-finale13-catalog.js','torre2-finale13-catalog.js'],
 ['torre2-clash-fx.js','clash-fx.js'],
 ['torre2-early-route-fx.js','early-route-fx.js'],
 ['batch24/pixels.js','batch24/pixels.js'],
 ['batch24/emerald-fragments.js','batch24/emerald-fragments.js']
];
for(const [src,dst] of files){
 const dest=path.join(temp,dst);
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.copyFileSync(path.join(source,src),dest);
}
fs.writeFileSync(path.join(temp,'package.json'),'{"type":"module"}');
const {sweptPunchContact,paintCustomPunchImpact,TORRE2_FINALE_13_FORMS}=
 await import(pathToFileURL(path.join(temp,'finale13.js')).href);
const moves=[
 ['firepunch','FIRE'],['icepunch','ICE'],
 ['thunderpunch','ELECTRIC'],['poisonpunch','POISON']
];
const makeGraphics=(history)=>{
 let color=0;return {
  setDepth(){return this},
  fillStyle(c){color=c;return this},
  fillRect(x,y,w,h){history.push({color,x,y,w,h});return this},
  clear(){return this},destroy(){return this}
 };
};
function sim(kind,{targetX=109,targetY=120,blocked=false}={}){
 const events=[],history=[],scene={efectos:[],add:{graphics:()=>makeGraphics(history)}};
 const target={x:targetX,y:targetY,alto:36,ko:false,hp:100,est:{},
  recibir(a,h){events.push({damage:h.dano,time:a.t});
   if(blocked)return 'bloqueado';
   this.hp-=h.dano;return 'golpe';},
  ponerEstado(k){this.est[k]=true}};
 const actor={x:0,y:120,alto:36,ax:130,ay:120,escena:scene,ko:false,
  est:{},t:1,rival:target,limitar(){},animar(){}};
 const fx=TORRE2_FINALE_13_FORMS['torre2_finale_'+kind](
  actor,{dano:15,tipo:moves.find(x=>x[0]===kind)[1],categoria:'PHYSICAL'},{slot:'q'});
 for(let k=0;k<80;k++){
  actor.t+=.016;
  if(fx.update(.016)===false)break;
 }
 return {actor,target,events,history};
}
test('capsule detects physical contact along a swept punch trajectory',()=>{
 const moving=sweptPunchContact({x:30,y:100},{x:104,y:100},
  {x:93,y:94},{x:93,y:99},16);
 assert.ok(moving);
 assert.ok(moving.x>50&&moving.x<106);
 assert.equal(sweptPunchContact({x:30,y:100},{x:104,y:100},
  {x:93,y:160},{x:93,y:160},16),null);
 assert.equal(sweptPunchContact({x:30,y:100},{x:30,y:100},
  {x:93,y:100},{x:93,y:100},16),null);
 assert.equal(sweptPunchContact({x:0,y:0},{x:1,y:0},
  {x:0,y:0},{x:0,y:0},0),null);
});
test('only four custom Punches own the new small elemental accent',()=>{
 for(const [kind] of moves){
  const h=[];assert.equal(paintCustomPunchImpact(makeGraphics(h),kind,{x:10,y:10},.016,0),true);
  assert.ok(h.length>0,kind+' impact must draw real pixel rectangles');
  assert.ok(Math.max(...h.map(p=>p.w))<=3,'No oversized impact geometry');
  assert.equal(paintCustomPunchImpact(makeGraphics([]),kind,{x:10,y:10},.22,0),false);
 }
 for(const kind of ['cross','aerial','wheel','fireblast']){
  const h=[];assert.equal(paintCustomPunchImpact(makeGraphics(h),kind,{x:10,y:10},.02,0),false);
  assert.equal(h.length,0,'Other moves cannot be rewritten');
 }
});
for(const [kind] of moves){
 test(kind+': one confirmed hit, a visible elemental contact and return to start',()=>{
  const p=sim(kind);
  assert.equal(p.events.length,1,'Must call native recibir exactly once');
  assert.ok(p.target.hp<100,'Hit must reduce HP once');
  assert.ok(p.history.length>0,'Actual graphics were drawn');
  assert.ok(Math.abs(p.actor.x)<.2&&Math.abs(p.actor.y-120)<.2,'Dash must release');
 });
 test(kind+': out-of-range or blocked contact creates no extra damage or poison',()=>{
  const miss=sim(kind,{targetX:280});
  assert.equal(miss.events.length,0,'Miss must not call native recibir');
  assert.equal(miss.target.hp,100,'Miss must not damage');
  assert.deepEqual(miss.target.est,{},'Miss cannot add status');
  const blocked=sim(kind,{blocked:true});
  assert.equal(blocked.events.length,1,'Native blocked contact only once');
  assert.equal(blocked.target.hp,100,'Blocked contact deals zero damage');
  assert.deepEqual(blocked.target.est,{},'Blocked contact cannot add status');
 });
}
