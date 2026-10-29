import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveKantoIntro,KANTO_INTRO} from '../tools/pokearena/torre2-kanto-intro-moves.js';

const canon=name=>String(name).toLowerCase().replace(/[^a-z0-9]+/g,'-');
const moves=[
 ['Tackle',7],['Growl',0],['Leech Seed',0],['Vine Whip',9],
 ['Scratch',7],['Ember',8],['Metal Claw',11],
 ['Tail Whip',0],['Bubble',6],['Water Gun',8],
 ['Solar Beam',47],['Flamethrower',38],['Hydro Pump',45]
].map(([nombre,dano])=>({id:canon(nombre),nombre,forma:'approved-'+canon(nombre),tipo:'NORMAL',dano,cd:4,coste:8}));
const levels={
 bulbasaur:{tackle:1,growl:4,'leech-seed':7,'vine-whip':10,'solar-beam':46},
 charmander:{scratch:1,growl:1,ember:7,'metal-claw':13,'flamethrower':31},
 squirtle:{tackle:1,'tail-whip':4,bubble:7,'water-gun':13,'hydro-pump':47}
};
const kit=(id,level)=>resolveKantoIntro({id,progression:{level}}, {},{
 library:moves,canonical:canon,levelUp:levels[id]||{}
});
const slots=['lmb','rmb','q'];
for(const species of ['bulbasaur','charmander','squirtle']){
 test(species+' starts at Lv5 with three different species-appropriate weak moves',()=>{
  const out=kit(species,5);
  assert.equal(out.e,undefined);
  assert.equal(new Set(slots.map(k=>out[k]?.torre2IntroSource)).size,3);
  for(const slot of slots){
   assert.ok(out[slot]?.forma);
   assert.equal(out[slot].pendiente,false);
   assert.ok(out[slot].dano<=KANTO_INTRO.maxStarterDamage);
   assert.equal(out[slot].torre2IntroPractice,true);
   assert.ok(!['solar-beam','flamethrower','hydro-pump'].includes(canon(out[slot].nombre)));
  }
 });
 test(species+' only unlocks weak full-meter finisher at level 8',()=>{
  assert.equal(kit(species,7).e,undefined);
  const ult=kit(species,8).e;
  assert.equal(ult.ulti,true);
  assert.equal(ult.pendiente,false);
  assert.ok(ult.dano<=KANTO_INTRO.maxIntroUltDamage);
  assert.ok(ult.cd>=8);
 });
}
test('none of the intro overlays edits an approved source attack',()=>{
 const original=JSON.stringify(moves);
 const member={id:'bulbasaur',progression:{level:5},moves:['tackle']};
 const before=JSON.stringify(member);
 const out=resolveKantoIntro(member,{}, {library:moves,canonical:canon,levelUp:levels.bulbasaur});
 assert.equal(JSON.stringify(member),before);
 assert.equal(JSON.stringify(moves),original);
 assert.notEqual(out.lmb,moves[0]);
 assert.equal(out.lmb.forma,moves[0].forma,'existing sprite/VFX reused unchanged');
});
test('late-game, laboratory Mewtwo and level 1 canonical resolution untouched',()=>{
 const marker={lmb:{nombre:'Original',forma:'approved'},rmb:{nombre:'Other',forma:'approved'},q:{nombre:'Extra',forma:'approved'},e:{nombre:'Native ultimate',forma:'approved'}};
 for(const member of [{id:'bulbasaur',progression:{level:13}},
  {id:'mewtwo',progression:{level:5}},{id:'bulbasaur',progression:{level:1}}]){
  const out=resolveKantoIntro(member,marker,{library:moves,canonical:canon});
  assert.equal(out,marker);
 }
});
test('Magikarp and Ditto only borrow weak reusable contact VFX as last resort',()=>{
 for(const id of ['magikarp','ditto']){
  const out=kit(id,5);
  assert.equal(Object.keys(out).filter(k=>slots.includes(k)).length,3);
  for(const k of slots){
   assert.ok(out[k].dano<=9);
   assert.equal(out[k].tipo,'NORMAL');
  }
 }
});

test('Struggle filler never disguises an elemental projectile as a NORMAL hit',()=>{
 const catalog=[
  {id:'tackle',nombre:'Tackle',forma:'approved-contact',tipo:'NORMAL',dano:7,cd:4,coste:8},
  {id:'ember',nombre:'Ember',forma:'approved-fire-projectile',tipo:'FIRE',dano:8,cd:4,coste:8}
 ];
 const before=JSON.stringify(catalog);
 const out=resolveKantoIntro({id:'ponyta',progression:{level:5}}, {},{
  library:catalog,canonical:canon,levelUp:{ember:14}
 });
 assert.equal(out.lmb.forma,'approved-fire-projectile','Ponyta retains its legal weak Ember preview');
 for(const slot of ['rmb','q']){
  assert.equal(out[slot].forma,'approved-contact','Struggle must use neutral contact VFX');
  assert.equal(out[slot].tipo,'NORMAL');
  assert.ok(out[slot].dano<=5);
  assert.match(out[slot].nombre,/^Struggle /);
 }
 assert.equal(JSON.stringify(catalog),before,'approved renderers remain unchanged');
});

test('deferred Scratch is not fabricated from Tackle in Charmander onboarding',()=>{
 const withoutScratch=moves.filter(m=>m.id!=='scratch');
 const original=JSON.stringify(withoutScratch);
 const out=resolveKantoIntro({id:'charmander',progression:{level:5}}, {},{
  library:withoutScratch,canonical:canon,levelUp:levels.charmander
 });
 for(const slot of slots){
  assert.ok(out[slot]?.forma,'Lv5 must still have a usable weak control');
  assert.ok(out[slot].dano<=KANTO_INTRO.maxStarterDamage);
  assert.notEqual(canon(out[slot].nombre),'scratch');
  assert.notEqual(out[slot].torre2IntroSource,'scratch');
  assert.equal(out[slot].torre2IntroFallbackFX,undefined);
 }
 assert.equal(JSON.stringify(withoutScratch),original,'source renderers changed');
});
