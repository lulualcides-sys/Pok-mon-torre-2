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

test('Lv5 Ponyta fills a Struggle slot with legal installed HGSS Tackle, not Scratch or Surf',()=>{
 const library=[
  {id:'quick-attack',nombre:'Quick Attack',forma:'approved-dash',tipo:'NORMAL',dano:6,cd:3,coste:8},
  {id:'ember',nombre:'Ember',forma:'approved-ember',tipo:'FIRE',dano:8,cd:4,coste:8},
  {id:'tackle',nombre:'Tackle',forma:'approved-contact',tipo:'NORMAL',dano:7,cd:3,coste:8},
  {id:'scratch',nombre:'Scratch',forma:'legacy-scratch',tipo:'NORMAL',dano:7,cd:3,coste:8},
  {id:'surf',nombre:'Surf',forma:'legacy-surf',tipo:'WATER',dano:7,cd:3,coste:8},
  {id:'vine-whip',nombre:'Vine Whip',forma:'approved-vine',tipo:'GRASS',dano:8,cd:3,coste:8}
 ];
 const before=JSON.stringify(library);
 const member={id:'ponyta',progression:{level:5}};
 const out=resolveKantoIntro(member,{},{
  library,canonical:canon,
  levelUp:{'quick-attack':1,growl:5,ember:14},
  verifiedTables:[{ponyta:{tackle:1,scratch:1,surf:1},bulbasaur:{'vine-whip':1}}]
 });
 assert.deepEqual(slots.map(k=>out[k].torre2IntroSource),
  ['quick-attack','ember','tackle']);
 assert.ok(slots.every(k=>out[k].dano<=KANTO_INTRO.maxStarterDamage));
 assert.ok(slots.every(k=>!out[k].nombre.startsWith('Struggle')));
 assert.equal(out.q.forma,'approved-contact');
 assert.equal(JSON.stringify(library),before,'approved effects were mutated');
 assert.equal(JSON.stringify(member),JSON.stringify({id:'ponyta',progression:{level:5}}));
});

test('Gen VII compact keys are accepted only for own verified installed early moves',()=>{
 const library=[
  {id:'ember',nombre:'Ember',forma:'approved-ember',tipo:'FIRE',dano:8,cd:4,coste:8},
  {id:'quick-attack',nombre:'Quick Attack',forma:'approved-dash',tipo:'NORMAL',dano:6,cd:3,coste:8},
  {id:'tackle',nombre:'Tackle',forma:'approved-contact',tipo:'NORMAL',dano:7,cd:3,coste:8},
  {id:'water-gun',nombre:'Water Gun',forma:'approved-water',tipo:'WATER',dano:7,cd:3,coste:8}
 ];
 const out=resolveKantoIntro({id:'vulpix',progression:{level:5}}, {},{
  library,canonical:canon,levelUp:{ember:1,'quick-attack':13},
  verifiedTables:[{vulpix:{tackle:1},squirtle:{watergun:1}}]
 });
 assert.deepEqual(slots.map(k=>out[k].torre2IntroSource),
  ['ember','quick-attack','tackle']);
 assert.ok(!slots.some(k=>out[k].torre2IntroSource==='water-gun'));
});


test('explicit evolution/level block takes priority over preferred Lv8 ULT',()=>{
 const library=[
  {id:'tackle',nombre:'Tackle',forma:'approved-contact',tipo:'NORMAL',dano:7,cd:3,coste:8},
  {id:'vine-whip',nombre:'Vine Whip',forma:'approved-vine',tipo:'GRASS',dano:8,cd:4,coste:8},
  {id:'solar-beam',nombre:'Solar Beam',forma:'approved-solar',tipo:'GRASS',
   dano:10,cd:8,coste:24,source:'new-phaser-fx',approved:true}
 ];
 const original=JSON.stringify(library);
 const input={id:'ivysaur',progression:{level:8}};
 const config={library,canonical:canon,speciesTypes:['GRASS'],
  levelUp:{tackle:1,'vine-whip':10,'solar-beam':46},
  preferredSignature:'solar-beam'};
 const allowed=resolveKantoIntro(input,{},config);
 assert.equal(allowed.e.torre2IntroSource,'solar-beam',
  'approved preferred preview remains available without a block');
 const blocked=resolveKantoIntro(input,{},{
  ...config,blockedSignature:'solar-beam'
 });
 assert.equal(blocked.e.torre2IntroSource,'vine-whip',
  'blocked Solar Beam must not be restored by preferredSignature');
 assert.ok(blocked.e.ulti&&blocked.e.dano<=KANTO_INTRO.maxIntroUltDamage);
 assert.equal(JSON.stringify(library),original,'approved VFX metadata changed');
 assert.deepEqual(input,{id:'ivysaur',progression:{level:8}});
});

test('preferred Lv8 ULT cannot bypass pending VFX approval',()=>{
 const library=[
  {id:'tackle',nombre:'Tackle',forma:'approved-contact',tipo:'NORMAL',dano:7,cd:3,coste:8},
  {id:'vine-whip',nombre:'Vine Whip',forma:'approved-vine',tipo:'GRASS',dano:8,cd:4,coste:8},
  {id:'solar-beam',nombre:'Solar Beam',forma:'pending-solar',tipo:'GRASS',
   dano:10,cd:8,coste:24,source:'new-phaser-fx',approved:false}
 ];
 const original=JSON.stringify(library);
 const out=resolveKantoIntro({id:'ivysaur',progression:{level:8}}, {},{
  library,canonical:canon,speciesTypes:['GRASS'],
  levelUp:{tackle:1,'vine-whip':10,'solar-beam':46},
  preferredSignature:'solar-beam'
 });
 assert.equal(out.e.torre2IntroSource,'vine-whip',
  'pending renderer cannot be promoted to a thematic ULT');
 assert.equal(JSON.stringify(library),original);
});

test('Lv5/Lv8 never promote a pending, unavailable or HM/TM-gated renderer',()=>{
 const library=[
  {id:'tackle',nombre:'Tackle',forma:'approved-contact',tipo:'NORMAL',dano:7,cd:3,coste:8},
  {id:'ember',nombre:'Ember',forma:'approved-fire',tipo:'FIRE',dano:8,cd:4,coste:8},
  {id:'quick-attack',nombre:'Quick Attack',forma:'approved-dash',tipo:'NORMAL',dano:7,cd:3,coste:8,torre2RequiresTM:true},
  {id:'flame-wheel',nombre:'Flame Wheel',forma:'approved-flame',tipo:'FIRE',dano:9,cd:4,coste:8,torre2Unavailable:true},
  {id:'fire-spin',nombre:'Fire Spin',forma:'approved-spin',tipo:'FIRE',dano:9,cd:4,coste:8,pendiente:true},
  {id:'flamethrower',nombre:'Flamethrower',forma:'approved-jet',tipo:'FIRE',dano:12,cd:4,coste:8,torre2RequiresHM:true}
 ];
 const before=JSON.stringify(library);
 const context={library,canonical:canon,speciesTypes:['FIRE'],
  levelUp:{ember:1,'quick-attack':1,'flame-wheel':6,'fire-spin':8,flamethrower:10},
  preferredSignature:'quick-attack'};
 for(const level of [5,8]){
  const out=resolveKantoIntro({id:'ponyta',progression:{level}}, {},context);
  const names=['lmb','rmb','q','e'].map(k=>out[k]?.torre2IntroSource).filter(Boolean);
  assert.ok(names.includes('ember'),'the approved species attack must remain available');
  for(const blocked of ['quick-attack','flame-wheel','fire-spin','flamethrower'])
   assert.ok(!names.includes(blocked),blocked+' must not bypass its lock at Lv'+level);
  assert.ok(['lmb','rmb','q'].every(k=>out[k]?.forma&&!out[k]?.pendiente));
  if(level===8){
   assert.equal(out.e.torre2IntroSource,'ember',
    'a blocked preferred ULT must fall back to a verified installed renderer');
   assert.ok(out.e.ulti&&out.e.dano<=KANTO_INTRO.maxIntroUltDamage);
  }else assert.equal(out.e,undefined);
 }
 assert.equal(JSON.stringify(library),before,'approved source VFX metadata changed');
});

test('RED: official Lv5 and Lv8 paths reject an unapproved custom renderer',()=>{
 const library=[
  {id:'tackle',nombre:'Tackle',forma:'approved-contact',tipo:'NORMAL',dano:7,cd:3,coste:8},
  {id:'ember',nombre:'Ember',forma:'unapproved-fire',tipo:'FIRE',dano:8,cd:4,coste:8,
   source:'new-phaser-fx',approved:false},
  {id:'quick-attack',nombre:'Quick Attack',forma:'approved-dash',tipo:'NORMAL',dano:7,cd:3,coste:8,
   source:'new-phaser-fx',approved:true}
 ];
 const before=JSON.stringify(library);
 const config={library,canonical:canon,levelUp:{ember:1,'quick-attack':1},
  speciesTypes:['FIRE'],preferredSignature:'ember'};
 for(const level of [5,8]){
  const out=resolveKantoIntro({id:'ponyta',progression:{level}}, {},config);
  const selected=['lmb','rmb','q','e'].map(slot=>out[slot]).filter(Boolean);
  assert.ok(selected.every(move=>move.forma!=='unapproved-fire'),
   'unapproved FRLG renderer leaked into Lv'+level);
  assert.ok(selected.some(move=>move.forma==='approved-dash'),
   'approved renderer should remain selectable at Lv'+level);
 }
 assert.equal(JSON.stringify(library),before,'source VFX metadata must not be mutated');
});

test('RED: unapproved neutral contact cannot become Struggle fallback',()=>{
 const library=[
  {id:'tackle',nombre:'Tackle',forma:'unapproved-contact',tipo:'NORMAL',dano:7,cd:3,coste:8,
   source:'new-phaser-fx',approved:false},
  {id:'quick-attack',nombre:'Quick Attack',forma:'approved-contact',tipo:'NORMAL',dano:6,cd:3,coste:8,
   source:'new-phaser-fx',approved:true},
  {id:'ember',nombre:'Ember',forma:'approved-ember',tipo:'FIRE',dano:8,cd:4,coste:8}
 ];
 const before=JSON.stringify(library);
 const out=resolveKantoIntro({id:'ponyta',progression:{level:5}}, {},{
  library,canonical:canon,levelUp:{ember:1}
 });
 assert.ok(['lmb','rmb','q'].every(slot=>out[slot]?.forma&&
  out[slot].forma!=='unapproved-contact'));
 assert.ok(['lmb','rmb','q'].some(slot=>out[slot].forma==='approved-contact'));
 assert.equal(JSON.stringify(library),before);
});


test('RED: preferred Lv8 ULT cannot bypass excluded Tackle, Surf HM or deferred Scratch/Transform',()=>{
 const library=[
  {id:'tackle',nombre:'Tackle',forma:'approved-contact',tipo:'NORMAL',dano:7,cd:3,coste:8},
  {id:'vine-whip',nombre:'Vine Whip',forma:'approved-vine',tipo:'GRASS',dano:9,cd:4,coste:8},
  {id:'scratch',nombre:'Scratch',forma:'legacy-scratch',tipo:'NORMAL',dano:8,cd:3,coste:8},
  {id:'transform',nombre:'Transform',forma:'legacy-transform',tipo:'NORMAL',dano:8,cd:3,coste:8},
  {id:'surf',nombre:'Surf',forma:'approved-surf',tipo:'WATER',dano:12,cd:6,coste:16}
 ];
 const original=JSON.stringify(library);
 const member={id:'bulbasaur',progression:{level:8}};
 for(const preferredSignature of ['Tackle','Surf','Scratch','Transform']){
  const out=resolveKantoIntro(member,{},{
   library,canonical:canon,levelUp:{tackle:1,'vine-whip':10},
   speciesTypes:['GRASS'],preferredSignature
  });
  assert.equal(out.e?.torre2IntroSource,'vine-whip',
   preferredSignature+' must not bypass the canonical ULT exclusions');
  assert.ok(out.e?.ulti&&out.e.dano<=KANTO_INTRO.maxIntroUltDamage);
 }
 assert.equal(JSON.stringify(library),original,'approved VFX must remain unchanged');
 assert.deepEqual(member,{id:'bulbasaur',progression:{level:8}});
});
