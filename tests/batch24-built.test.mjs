import assert from 'node:assert/strict';
import fs from 'node:fs';
const root=new URL('../_site/arena2d/',import.meta.url);
const version=JSON.parse(fs.readFileSync(new URL('version.json',root))).modules;
const dir=new URL(version+'/torre2/batch24/',root);
const {BATCH24_MOVES}=await import(new URL('catalog.js',dir));
const {BATCH24_FORMS}=await import(new URL('runtime.js',dir));
const {TEST_LIBRARY,filterMoveLibrary}=await import(new URL('../move-pool.js',dir));
assert.equal(filterMoveLibrary(TEST_LIBRARY,'NEW').filter(h=>h.forma.startsWith('torre2_batch24_')).length,24);
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
console.log('24 moves: real hit, manual miss, drain, cleanup and cancellation passed.');
