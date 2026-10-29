/* Kanto 13 new attacks: Phaser hooks, hit timing and statuses. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const ver=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const base=path.join(root,ver);
const load=p=>import(pathToFileURL(path.join(base,p)));
const {FINALE_13_MOVES,FINALE_13_NAMES,TORRE2_FINALE_13_FORMS}=await load('torre2/finale13.js');
const {POISON_PUNCH_MOVES}=await load('torre2/torre2-finale13-catalog.js');
// All 13 original finishing moves and the extra purple Poison Punch are
// explicitly approved: none of them may return to the NEW review queue.
const reviewedMoveIds=FINALE_13_MOVES.map(x=>x.id).concat(POISON_PUNCH_MOVES.map(x=>x.id));
const userApproved=new Set(reviewedMoveIds);
const reviewedMoves=[...FINALE_13_MOVES,...POISON_PUNCH_MOVES];
const {TEST_LIBRARY,availableMoves,filterMoveLibrary}=await load('torre2/move-pool.js');
const {ROSTER}=await load('datos.js');
assert.equal(FINALE_13_MOVES.length,13);
assert.equal(FINALE_13_NAMES.length,13);
assert.equal(new Set(FINALE_13_NAMES).size,13);
assert.equal(POISON_PUNCH_MOVES.length,1);
assert.equal(Object.keys(TORRE2_FINALE_13_FORMS).length,14);
assert.ok(ROSTER.some(p=>p.id==='mewtwo'));
for(const h of reviewedMoves){
 const entries=TEST_LIBRARY.filter(m=>m.id===h.id);
 assert.equal(entries.length,1,'One canonical name only: '+h.nombre);
 assert.equal(entries[0].forma,h.forma,'Renderer mismatch '+h.nombre);
 assert.equal(entries[0].approved,userApproved.has(h.id),
  'Explicit visual approval must persist: '+h.nombre);
 assert.equal(typeof TORRE2_FINALE_13_FORMS[h.forma],'function');
 assert.equal(filterMoveLibrary(TEST_LIBRARY,'NEW').some(x=>x.id===h.id),
  !userApproved.has(h.id),'Only unapproved attacks should be listed in NEW: '+h.nombre);
 assert.ok(availableMoves({id:'mewtwo',progression:{species:'mewtwo',level:50}})
  .some(x=>x.id===h.id),'Mewtwo must equip '+h.nombre);
}
for(const [id,pokemon] of [
 ['psychic','alakazam'],['sleep-powder','butterfree'],
 ['ice-punch','hitmonchan'],['poison-punch','muk'],['thunder-punch','electabuzz'],
 ['fire-punch','magmar'],['cross-chop','machamp'],['aerial-ace','pidgeot'],
 ['flame-wheel','rapidash'],['light-screen','mr-mime'],
 ['rain-dance','starmie'],['sand-attack','sandshrew'],['protect','blastoise']
])assert.ok(availableMoves({id:pokemon,progression:{species:pokemon,level:70},
  ...(id==='protect'?{tmMoves:['protect']}:{})})
 .some(x=>x.id===id),id+' not learned by '+pokemon);
// The installed Surf renderer is preserved for historical/visual audit,
// but the user's latest decision rejects it for Kanto campaign equipment.
// Do not turn the old Finale 13 smoke test into a Surf auto-unlock.
assert.ok(TEST_LIBRARY.some(m=>m.id==='surf'),'Never delete the installed Surf VFX');
for(const id of ['lapras','squirtle','blastoise']){
 const member={id,progression:{species:id,level:70},tmMoves:['surf']};
 const before=JSON.stringify(member);
 assert.ok(!availableMoves(member).some(m=>m.id==='surf'),
  'Rejected Surf must not enter the campaign: '+id);
 assert.equal(JSON.stringify(member),before,'Reading moves must not rewrite save');
}
let spanX=0,spanY=0,fullScreenRain=false;
let usedColors=new Set(),renderBounds=null;
function graphic(){
 return {fillStyle(color){usedColors.add(color);return this},fillRect(x,y,w,h){
   spanX=Math.max(spanX,x+w);spanY=Math.max(spanY,y+h);
   if(!renderBounds)renderBounds={minX:x,minY:y,maxX:x+w,maxY:y+h};
   else{
    renderBounds.minX=Math.min(renderBounds.minX,x);
    renderBounds.minY=Math.min(renderBounds.minY,y);
    renderBounds.maxX=Math.max(renderBounds.maxX,x+w);
    renderBounds.maxY=Math.max(renderBounds.maxY,y+h);
   }
   return this;},
  setDepth(){return this},setScrollFactor(f){if(f===0)fullScreenRain=true;return this;},
  clear(){return this},destroy(){this.dead=true}};
}
const savedRandom=Math.random;
try{
 Math.random=()=>0;
 for(const h of reviewedMoves){
  spanX=0;spanY=0;fullScreenRain=false;usedColors=new Set();renderBounds=null;
  const scene={efectos:[],t:1,cameras:{main:{width:960,height:540,
   shake(ms,power){scene.shakes=(scene.shakes||0)+1;scene.lastShake={ms,power}}}},
   add:{graphics:graphic},datos:{torre2:true}};
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
   assert.ok(usedColors.has(0x43bd64),'Protect must be GREEN, one simple rectangle');
   assert.ok(!usedColors.has(0x9141c4),'Protect must never render a purple screen');
   assert.ok(renderBounds,'Protect must draw its small green barrier');
   assert.ok(renderBounds.maxX-renderBounds.minX<=47,
    'Protect width must be 30% smaller than original 56px, incl. scaled rim');
   assert.ok(renderBounds.maxY-renderBounds.minY<=51,
    'Protect height must be 30% smaller than original 62px, incl. scaled rim');
  }else if(h.id==='light-screen'){
   assert.ok(actor.est.torre2LightScreen,'Light Screen missing special defense');
   assert.ok(usedColors.has(0x9141c4),'Light Screen must be PURPLE, one simple rectangle');
   assert.ok(!usedColors.has(0x43bd64),'Light Screen must never render a green shield');
   assert.ok(renderBounds,'Light Screen must draw its small purple barrier');
   assert.ok(renderBounds.maxX-renderBounds.minX<=54,
    'Light Screen width must shrink to 70% of original 66px, incl. rim');
   assert.ok(renderBounds.maxY-renderBounds.minY<=59,
    'Light Screen height must shrink to 70% of original 72px, incl. rim');
  }else if(h.id==='rain-dance'){
   assert.ok(scene.__torre2Rain?.until>1,'Rain Dance missing weather');
   assert.ok(fullScreenRain,'Rain Dance must cover the camera');
   assert.ok(spanX>800&&spanY>465,
    'Rain must fill the 960 × 540 arena, not a local 420 × 280 region');
  }else if(h.id==='sand-attack'){
   assert.ok(foe.est.torre2SandAccuracy,'Sand Attack missing accuracy reduction');
  }else if(h.id==='sleep-powder'){
   assert.ok(foe.est.aturdido,'Sleep Powder must induce sleep on direct hit');
  }else{
   if(h.id==='poison-punch')
    assert.ok(foe.est.veneno,'Purple contact punch must poison only on hit');
   assert.equal(foe.hits,1,'Must hit once on contact '+h.nombre);
   assert.ok(foe.hp<100,'Attack did not deal damage '+h.nombre);
   if(h.id==='psychic'){
    assert.ok(foe.hp<=78,'Psychic must actually have more battle damage');
    assert.equal(scene.shakes,1,'One camera kick on real Psychic impact');
   }
  }
  if(['protect','light-screen','rain-dance','sand-attack','sleep-powder'].includes(h.id))
   assert.equal(foe.hits||0,0,'Status may not damage target '+h.nombre);
  if(['ice-punch','thunder-punch','fire-punch','poison-punch','cross-chop','aerial-ace','flame-wheel'].includes(h.id))
   assert.ok(Math.abs(actor.x)<.2,'Melee Pokémon did not retreat '+h.nombre);
 }
}finally{Math.random=savedRandom}
// Requested Arena-only 50% resize: compare REAL Phaser graphics pixel bounds.
// The campaign keeps its previously approved barrier scale and protection.
function barrierBounds(id,campaign){
 usedColors=new Set();renderBounds=null;
 const scene={efectos:[],t:1,datos:campaign?{torre2:true}:{modo:'cpu'},
  add:{graphics:graphic}};
 const actor={x:0,y:120,ax:120,ay:120,alto:36,t:1,escena:scene,est:{},ko:false,
  nivel:50,limitar(){},rival:{x:98,y:120,alto:36,hp:100,est:{},ko:false},
  animar(){},ponerEstado(k,t,data){this.est[k]={duration:t,...data}}};
 const move=FINALE_13_MOVES.find(m=>m.id===id);
 assert.ok(move,'Missing approved barrier '+id);
 const effect=TORRE2_FINALE_13_FORMS[move.forma](actor,move,{slot:'q'});
 assert.ok(effect?.update);
 effect.update(.016);
 assert.ok(renderBounds,'Barrier did not draw '+id);
 return {width:renderBounds.maxX-renderBounds.minX,
  height:renderBounds.maxY-renderBounds.minY,
  protection:id==='protect'?actor.est.bloqueo:actor.est.torre2LightScreen};
}
for(const id of ['protect','light-screen']){
 const story=barrierBounds(id,true),arena=barrierBounds(id,false);
 assert.ok(arena.width<=story.width*.56&&arena.width>=story.width*.40,
  id+' Arena width should be half the currently approved shield: '+JSON.stringify({story,arena}));
 assert.ok(arena.height<=story.height*.56&&arena.height>=story.height*.40,
  id+' Arena height should be half the currently approved shield: '+JSON.stringify({story,arena}));
 assert.deepEqual(arena.protection,story.protection,
  id+' protection status and duration must not change with visual scaling');
}
const fighter=fs.readFileSync(path.join(base,'luchador.js'),'utf8');
for(const name of ['torre2LightScreen','torre2SandAccuracy','__torre2Weather','weatherDamageMultiplier'])
 assert.ok(fighter.includes(name),'Native combat missing status integration '+name);
const fxText=fs.readFileSync(path.join(base,'torre2/finale13.js'),'utf8');
assert.ok(fxText.includes('function simpleBarrier('),
 'Both shields must use the ONE simple rectangular pixel barrier');
assert.ok(!fxText.includes('PROTECT_OCTAGON')&&!fxText.includes('LIGHT_PANEL'),
 'Old decorative complex shields must be entirely removed');
for(const wheel of ['const WHEEL_FLAME=','const WHEEL_EMBER='])
 assert.ok(fxText.includes(wheel),'Approved Flame Wheel pixel silhouette must never be removed: '+wheel);
const psychic=FINALE_13_MOVES.find(x=>x.id==='psychic');
assert.equal(psychic.poder,90,'FireRed Psychic power must be 90');
assert.equal(psychic.dano,22,'Psychic must be stronger than the old value 18');
assert.ok(fxText.includes("function surfRemastered("),'Missing Torre 1 Surf wave remaster');
assert.ok(fxText.includes("TORRE1_SURF_SILHOUETTE"),'Torre 1 original seven-point wave must be ported');
assert.ok(fxText.includes("torre2_finale_surf:(l,h,x)=>surfRemastered"),'Rejected Surf projectile must be replaced');
for(const piece of ['contactDash','p2EmeraldImpact','clashAt','stamp(g,WAVE','simpleBarrier(g'])
 assert.ok(fxText.includes(piece),'Missing reusable real pixel renderer '+piece);
assert.equal(filterMoveLibrary(TEST_LIBRARY,'NEW').length,0,
 'User approved all pending custom attacks: NEW queue must be empty');
console.log('All 14 finale moves approved; NEW empty; Protect and Light Screen 30% smaller, mechanics unchanged.');
