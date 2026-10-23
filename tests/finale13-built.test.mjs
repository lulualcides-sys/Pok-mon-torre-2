/* Kanto 13 new attacks: Phaser hooks, hit timing and statuses. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve('_site/arena2d');
const ver=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const base=path.join(root,ver);
const load=p=>import(pathToFileURL(path.join(base,p)));
const {FINALE_13_MOVES,FINALE_13_NAMES,TORRE2_FINALE_13_FORMS}=await load('torre2/finale13.js');
const {TEST_LIBRARY,availableMoves,filterMoveLibrary}=await load('torre2/move-pool.js');
const {ROSTER}=await load('datos.js');
assert.equal(FINALE_13_MOVES.length,13);
assert.equal(FINALE_13_NAMES.length,13);
assert.equal(new Set(FINALE_13_NAMES).size,13);
assert.equal(Object.keys(TORRE2_FINALE_13_FORMS).length,13);
assert.ok(ROSTER.some(p=>p.id==='mewtwo'));
for(const h of FINALE_13_MOVES){
 const entries=TEST_LIBRARY.filter(m=>m.id===h.id);
 assert.equal(entries.length,1,'One canonical name only: '+h.nombre);
 assert.equal(entries[0].forma,h.forma,'Renderer mismatch '+h.nombre);
 assert.equal(entries[0].approved,false,'New move requires user visual review');
 assert.equal(typeof TORRE2_FINALE_13_FORMS[h.forma],'function');
 assert.ok(filterMoveLibrary(TEST_LIBRARY,'NEW').some(x=>x.id===h.id));
 assert.ok(availableMoves({id:'mewtwo',progression:{species:'mewtwo',level:50}})
  .some(x=>x.id===h.id),'Mewtwo must equip '+h.nombre);
}
for(const [id,pokemon] of [
 ['psychic','alakazam'],['sleep-powder','butterfree'],['surf','lapras'],
 ['ice-punch','hitmonchan'],['thunder-punch','electabuzz'],
 ['fire-punch','magmar'],['cross-chop','machamp'],['aerial-ace','pidgeot'],
 ['flame-wheel','rapidash'],['light-screen','mr-mime'],
 ['rain-dance','starmie'],['sand-attack','sandshrew'],['protect','blastoise']
])assert.ok(availableMoves({id:pokemon,progression:{species:pokemon,level:70},
  ...(id==='protect'?{tmMoves:['protect']}:{})})
 .some(x=>x.id===id),id+' not learned by '+pokemon);
function graphic(){
 return {fillStyle(){return this},fillRect(){return this},
  setDepth(){return this},clear(){return this},destroy(){this.dead=true}};
}
const savedRandom=Math.random;
try{
 Math.random=()=>0;
 for(const h of FINALE_13_MOVES){
  const scene={efectos:[],t:1,add:{graphics:graphic},datos:{torre2:true}};
  const foe={x:98,y:120,alto:36,hp:100,est:{},ko:false,invulnerable:false,
   recibir(_att,args){this.hp-=args.dano||0;this.hits=(this.hits||0)+1;return 'golpe'},
   ponerEstado(k,t,data){this.est[k]={duration:t,...data}}};
  const actor={x:0,y:120,ax:120,ay:120,alto:36,t:1,escena:scene,est:{},
   ko:false,nivel:50,limitar(){},rival:foe,animar(){},
   ponerEstado(k,t,data){this.est[k]={duration:t,...data}}};
  const effect=TORRE2_FINALE_13_FORMS[h.forma](actor,h,{slot:'q'});
  assert.ok(effect&&typeof effect.update==='function','No real FX for '+h.nombre);
  const frames=h.id==='rain-dance'?560:h.id==='light-screen'?490:132;
  for(let k=0;k<frames;k++){
   scene.t+=.016;actor.t+=.016;
   for(const fx of scene.efectos.slice())
    if(fx.update(.016)===false){
     const idx=scene.efectos.indexOf(fx);
     if(idx>=0)scene.efectos.splice(idx,1);
    }
   if(!scene.efectos.length)break;
  }
  assert.equal(scene.efectos.length,0,'GPU effect leaked '+h.nombre);
  if(h.id==='protect'){
   assert.ok(actor.est.bloqueo,'Protect missing block status');
  }else if(h.id==='light-screen'){
   assert.ok(actor.est.torre2LightScreen,'Light Screen missing special defense');
  }else if(h.id==='rain-dance'){
   assert.ok(scene.__torre2Rain?.until>1,'Rain Dance missing weather');
  }else if(h.id==='sand-attack'){
   assert.ok(foe.est.torre2SandAccuracy,'Sand Attack missing accuracy reduction');
  }else if(h.id==='sleep-powder'){
   assert.ok(foe.est.aturdido,'Sleep Powder must induce sleep on direct hit');
  }else{
   assert.equal(foe.hits,1,'Must hit once on contact '+h.nombre);
   assert.ok(foe.hp<100,'Attack did not deal damage '+h.nombre);
  }
  if(['protect','light-screen','rain-dance','sand-attack','sleep-powder'].includes(h.id))
   assert.equal(foe.hits||0,0,'Status may not damage target '+h.nombre);
  if(['ice-punch','thunder-punch','fire-punch','cross-chop','aerial-ace','flame-wheel'].includes(h.id))
   assert.ok(Math.abs(actor.x)<.2,'Melee Pokémon did not retreat '+h.nombre);
 }
}finally{Math.random=savedRandom}
const fighter=fs.readFileSync(path.join(base,'luchador.js'),'utf8');
for(const name of ['torre2LightScreen','torre2SandAccuracy','__torre2Rain'])
 assert.ok(fighter.includes(name),'Native combat missing status integration '+name);
const fxText=fs.readFileSync(path.join(base,'torre2/finale13.js'),'utf8');
for(const piece of ['contactDash','p2EmeraldImpact','clashAt','stamp(g,WAVE','stamp(g,BARRIER'])
 assert.ok(fxText.includes(piece),'Missing reusable real pixel renderer '+piece);
console.log('Kanto 13: independent pixel effects, true hits, cleanups and status wiring PASS.');
