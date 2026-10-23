import assert from 'node:assert/strict';
import fs from 'node:fs';
const root=new URL('../_site/arena2d/',import.meta.url);
const version=JSON.parse(fs.readFileSync(new URL('version.json',root))).modules;
const dir=new URL(version+'/torre2/batch24/',root);
const {BATCH24_MOVES,BATCH24_NATIVE_REUSE}=await import(new URL('catalog.js',dir));
const {BATCH24_FORMS}=await import(new URL('runtime.js',dir));
const {TEST_LIBRARY,filterMoveLibrary}=await import(new URL('../move-pool.js',dir));
assert.equal(BATCH24_MOVES.length,23,'No reimplementation of original Dragon Pulse');
assert.equal(filterMoveLibrary(TEST_LIBRARY,'NEW').filter(h=>h.forma.startsWith('torre2_batch24_')).length,3,
  'Only Ancient Power, Ice Shard and Poison Jab remain pending');
for(const move of BATCH24_MOVES){
 const indexed=TEST_LIBRARY.find(h=>h.id===move.id);
 assert.equal(indexed?.approved,move.approved,move.id+' catalog approval was not retained');
 const inNew=filterMoveLibrary(TEST_LIBRARY,'NEW').some(h=>h.id===move.id);
 assert.equal(inNew,!move.approved,move.id+' NEW tab must not show an approved move');
}
const original=TEST_LIBRARY.filter(h=>h.nombre==='Dragon Pulse');
assert.equal(original.length,1,'The original Dragon Pulse remains selectable exactly once');
assert.equal(original[0].source,'arena2d-original','Do not override the original Dragon Pulse');
assert.ok(!original[0].forma?.startsWith('torre2_batch24_'));
assert.equal(BATCH24_NATIVE_REUSE.nombre,'Dragon Pulse');
for(const h of BATCH24_MOVES)assert.equal(TEST_LIBRARY.filter(x=>x.id===h.id).length,1,h.id+' duplicated');
function fixture(y=100){
 const parts=[];
 const scene={efectos:[],add:{graphics(){const g={dead:false,setDepth(){return this},clear(){return this},fillStyle(){return this},fillRect(){assert.ok(!this.dead);return this},destroy(){this.dead=true}};parts.push(g);return g}}};
 const actor={x:100,y:100,ax:180,ay:100,alto:36,hp:50,hpMax:100,t:0,est:{},escena:scene,animar(){},limitar(){},ponerEstado(k,d,v){this.est[k]={...v,hasta:this.t+d}}};
 const target={x:180,y,alto:36,hp:1000,tipos:['NORMAL'],t:0,est:{},ponerEstado:actor.ponerEstado,recibir(l,h){this.hp-=h.dano;return 'golpe'},envenenar(){}};
 actor.rival=target;target.rival=actor;
 return {actor,target,scene,parts};
}
const originalRandom=Math.random;Math.random=()=>.01;
try{
 for(const h of BATCH24_MOVES){
  const f=fixture();const fx=BATCH24_FORMS[h.forma](f.actor,h,{});
  assert.equal(f.target.hp,1000,h.id+' damages before effect');
  for(let n=0;n<180;n++){f.actor.t+=1/60;fx.update(1/60);}
  assert.ok(f.target.hp<1000,h.id+' should hit aligned target');
  assert.ok(f.parts.every(x=>x.dead),h.id+' leaked graphics');
  assert.equal(f.actor.x,100,h.id+' failed to return from contact');
  if(h.secondary==='drain')assert.equal(f.actor.hp,50+(1000-f.target.hp)*.5);
  const miss=fixture(260),missFX=BATCH24_FORMS[h.forma](miss.actor,h,{});
  for(let n=0;n<180;n++)missFX.update(1/60);
  assert.equal(miss.target.hp,1000,h.id+' must not auto-hit');
  assert.equal(miss.actor.hp,50,h.id+' must not heal on miss');
  const cancel=fixture(),cancelFX=BATCH24_FORMS[h.forma](cancel.actor,h,{});
  cancelFX.update(.1);cancel.actor.ko=true;cancelFX.update(.01);
  assert.ok(cancel.parts.every(x=>x.dead),h.id+' leaks on KO');
  assert.equal(cancel.actor.x,100,h.id+' interrupted dash must return');
 }
}finally{Math.random=originalRandom;}
// Regression: Poison Jab must reach with its actual physical SPIKE, and its
// subtle violet contact flash is drawn ONLY after contact. No projectile/auto-target added.
{
 const h=BATCH24_MOVES.find(move=>move.id==='poison-jab');
 const sample=fixture();sample.target.x=227;sample.actor.ax=227;
 const colors=new Set();
 const graphics=sample.scene.add.graphics;
 sample.scene.add.graphics=function(){
  const g=graphics();
  const fill=g.fillStyle;
  g.fillStyle=function(color,...args){colors.add(color);return fill.call(this,color,...args)};
  return g;
 };
 const fx=BATCH24_FORMS[h.forma](sample.actor,h,{slot:'q'});
 for(let i=0;i<100;i++){sample.actor.t+=1/60;fx.update(1/60)}
 assert.ok(sample.target.hp<1000,'Poison Jab damages target at correct physical spike reach');
 assert.ok(colors.has(0xb08abe)||colors.has(0xd2b2de),
  'A landed Poison Jab leaves a small violet contact flash');
 const whiff=fixture();whiff.target.x=227;whiff.actor.ax=25;
 const failed=BATCH24_FORMS[h.forma](whiff.actor,h,{slot:'q'});
 for(let i=0;i<100;i++){whiff.actor.t+=1/60;failed.update(1/60)}
 assert.equal(whiff.target.hp,1000,'Aimed away Poison Jab must not magically hit');
 const practice=fixture();practice.target.x=227;practice.actor.ax=227;
 practice.target.__torre2TrainingDummy=true;
 practice.scene.__torre2TrainingHits=0;practice.scene.__torre2TrainingLastDamage=0;
 practice.target.recibir=function(_src,hit){
  practice.scene.__torre2TrainingHits++;
  practice.scene.__torre2TrainingLastDamage=hit.dano;
  return 'golpe';
 };
 const dummyFx=BATCH24_FORMS[h.forma](practice.actor,h,{slot:'q'});
 for(let i=0;i<100;i++){practice.actor.t+=1/60;dummyFx.update(1/60)}
 assert.equal(practice.target.hp,1000,'Onix training HP stays fixed');
 assert.equal(practice.scene.__torre2TrainingHits,1,'Training receives one genuine Poison Jab hit');
}
console.log('23 signature moves tested, 20 approved and 3 pending; Poison Jab validated on real and training targets.');
