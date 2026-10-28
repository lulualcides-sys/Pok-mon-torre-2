/* T08/T03: 150 Kanto species get 3 genuine selectable weak campaign
 * abilities at Lv5, a meter-gated ULT at Lv8 and stronger REAL renderer
 * options across 9..50. Official FRLG metadata stays unmodified.
 * Run against built/versioned Phaser, not an independent test-only move pool.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const modules=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const load=name=>import(pathToFileURL(path.join(root,modules,name)).href);
const [{KANTO_151},{
 availableMoves,selectedMoves,defaultLoadout,resolveLoadout,campaignLearnset,
 moveUnlockLevel,equipMove,TEST_LIBRARY,KANTO_CAMPAIGN_MOVE_CAP
},{frlgUnlockLevel,frlgMachineCompatible},{KANTO_INTRO}]=await Promise.all([
 load('torre2/all-kanto-species.js'),load('torre2/move-pool.js'),
 load('torre2/frlg-learnsets.js'),load('torre2/kanto-intro-moves.js')
]);
assert.equal(KANTO_151.length,151);
assert.equal(KANTO_CAMPAIGN_MOVE_CAP,50);
const make=(id,level)=>({id,progression:{species:id,level},tmMoves:[]});
const attackSlots=['lmb','rmb','q'];
let reviewed=0,optionsAt50=0;
const samples={};
for(const {id} of KANTO_151){
 if(id==='mewtwo')continue; // pre-existing unrestricted Lv50 test character.
 const member=make(id,5);
 const moves5=availableMoves(member);
 const ids5=new Set(moves5.map(m=>m.id));
 const three=moves5.filter(m=>m.torre2IntroPractice&&
  m.torre2IntroUnlockLevel===5);
 assert.equal(three.length,3,id+' must have 3 campaign skills at Lv5');
 assert.equal(new Set(three.map(m=>m.id)).size,3,id+' training moves overlap');
 assert.ok(three.every(m=>m.forma&&m.dano>=0&&m.dano<=9&&
  m.torre2IntroSlot!=='e'),id+' initial skills unsafe');
 const selected=selectedMoves(member);
 const initial=resolveLoadout(member);
 for(const slot of attackSlots){
  assert.ok(initial[slot]?.torre2IntroPractice,id+' '+slot+' missing');
  assert.ok(initial[slot].dano<=9,id+' '+slot+' stronger than starter cap');
  assert.ok(ids5.has(initial[slot].id),id+' displayed/equipped mismatch '+slot);
  assert.equal(initial[slot].torre2IntroSlot,slot,
   id+' cannot select the correct intro role '+slot);
 }
 assert.equal(new Set(attackSlots.map(slot=>initial[slot].id)).size,3,
  id+' must have 3 distinct selectable controls');
 assert.equal(initial.e,undefined,id+' Lv5 early ULT');
 assert.ok(!moves5.some(m=>m.torre2IntroSlot==='e'),id+' ULT appears at Lv5');
 member.progression.level=7;
 assert.equal(resolveLoadout(member).e,undefined,id+' early ULT at Lv7');
 member.progression.level=8;
 const moves8=availableMoves(member);
 const ultimate=moves8.find(m=>m.torre2IntroSlot==='e');
 assert.ok(ultimate?.ulti&&ultimate.torre2IntroUnlockLevel===8,
  id+' ULT not offered at Lv8');
 assert.equal(moveUnlockLevel(member,ultimate.id),8);
 assert.ok(ultimate.forma&&ultimate.dano<=12&&ultimate.cd>=8,
  id+' ULT exceeds early caps');
 const battle8=resolveLoadout(member);
 assert.equal(battle8.e?.id,ultimate.id,id+' equipped ULT and menu disagree');
 assert.ok(battle8.e.ulti,id+' ULT should require native full energy');
 assert.equal(new Set(['lmb','rmb','q','e'].map(k=>battle8[k]?.id)).size,4,
  id+' four unique active moves at Lv8');
 const learnedAt8=new Set(moves8.map(m=>m.id));
 assert.ok([...ids5].every(k=>learnedAt8.has(k)),id+' Lv8 lost learned skill');
 for(const level of [13,20,30,40,50]){
  member.progression.level=level;
  const kit=resolveLoadout(member),options=availableMoves(member);
  const ids=new Set(options.map(m=>m.id));
  assert.ok(attackSlots.every(slot=>kit[slot]?.forma),
   id+' lost active move at Lv'+level);
  assert.ok(kit.e?.ulti,id+' lost native ULT at Lv'+level);
  assert.ok(ids.size>=learnedAt8.size,id+' forgot known attacks at Lv'+level);
  assert.ok(!options.some(m=>m.id==='protect'&&!frlgMachineCompatible(id,'protect')),
   id+' gained incompatible Protect');
  assert.ok(!options.some(m=>m.id==='protect'),
   id+' auto-learned TM-only Protect');
  for(const move of options){
   assert.ok(move.forma,id+' has an unrendered option '+move.id);
   // Native stat / dodge / status techniques can have no numeric damage.
   // They are valid once a real approved Phaser form exists.
   assert.ok(move.torre2IntroPractice||move.dano===undefined||
    Number.isFinite(move.dano),id+' invalid damage metadata '+move.id);
  }
 }
 member.progression.level=50;
 const at50=availableMoves(member);
 optionsAt50+=at50.length;
 const levelRows=campaignLearnset(id);
 assert.ok(levelRows.some(m=>m.practice&&m.level===5&&m.slot==='lmb'),
  id+' Pokédex omits Lv5 ATK');
 assert.equal(levelRows.filter(m=>m.practice&&m.level===5).length,3,
  id+' Pokédex omits three initial moves');
 assert.equal(levelRows.filter(m=>m.practice&&m.level===8&&m.slot==='e').length,1,
  id+' Pokédex omits Lv8 ultimate');
 assert.ok(levelRows.every(m=>m.method==='TM'||m.level<=50),
  id+' has a campaign level gate after Lv50');
 assert.deepEqual(
  levelRows.filter(m=>m.method==='LEVEL').map(m=>m.id).sort(),
  at50.map(m=>m.id).sort(),
  id+' Lv50 Pokedex and battle diverged');
 reviewed++;
 if(['ponyta','charmander','bulbasaur','squirtle','magikarp','ditto'].includes(id)){
  samples[id]={
   start:attackSlots.map(slot=>initial[slot].nombre),
   ult:battle8.e.nombre,
   unlocks:levelRows.filter(m=>m.method==='LEVEL'&&!m.practice)
    .filter(m=>m.level>=8&&m.level<=50)
    .slice(0,12).map(m=>[m.level,m.id])
  };
 }
}
assert.equal(reviewed,150);
assert.equal(TEST_LIBRARY.length,availableMoves(make('mewtwo',50)).length,
 'The Mewtwo debug laboratory remains unrestricted');
const ponyta=make('ponyta',5);
assert.equal(frlgUnlockLevel('ponyta','ember'),14,
 'Never rewrite canonical FireRed data');
assert.ok(!availableMoves(ponyta).some(m=>m.id==='ember'),
 'Full-power Ember must NOT unlock at Lv5');
assert.ok(availableMoves(ponyta).some(m=>m.torre2IntroPractice&&
 m.nombre.toLowerCase().includes('ember')),
 'Lv5 Ponyta needs a weak Ember training choice before real Lv14');
ponyta.progression.level=14;
assert.ok(availableMoves(ponyta).some(m=>m.id==='ember'),
 'Ponyta must unlock genuine Ember at Lv14');
ponyta.progression.level=49;
assert.ok(!availableMoves(ponyta).some(m=>m.id==='fire-blast'),
 'Late Fire Blast should not appear at Lv49');
ponyta.progression.level=50;
assert.equal(frlgUnlockLevel('ponyta','fire-blast'),53);
assert.equal(moveUnlockLevel(ponyta,'fire-blast'),50);
assert.ok(availableMoves(ponyta).some(m=>m.id==='fire-blast'),
 'Campaign final Fire Blast unlock must happen by Lv50');
// The failing Pages hard gate: after Metapod evolves into Butterfree at
// Lv10, all four inherited Caterpie/Metapod moves must be normalized to
// the new species, while a choice made AFTER that evolution is respected.
const evolved=make('butterfree',10);
const evolvedDefaults=selectedMoves(evolved);
const stale={...make('butterfree',10),
 moves:['tackle','gust','bite','quick-attack'],movePlanSpecies:'metapod'};
assert.deepEqual(selectedMoves(stale),evolvedDefaults,
 'Butterfree must not retain Caterpie/Metapod equipped IDs after evolving');
const newlySelected={...make('butterfree',10),movePlanSpecies:'butterfree',
 moves:[...evolvedDefaults]};
assert.deepEqual(selectedMoves(newlySelected),evolvedDefaults,
 'Correct-species equipped choices must survive read/reload');
const legitimate=availableMoves(newlySelected).find(m=>m.torre2IntroSlot==='rmb');
assert.ok(legitimate,'Butterfree must have a real usable Lv10 HAB2');
assert.equal(equipMove(newlySelected,1,legitimate.id),true,
 'Player can equip its own Butterfree practice move after evolution');
assert.equal(resolveLoadout(newlySelected).rmb?.id,legitimate.id,
 'Re-entering battle must honor a same-species equipped practice move');
const charmander=make('charmander',5);
assert.ok(!availableMoves(charmander).some(m=>m.id==='flamethrower'));
assert.ok(!resolveLoadout(charmander).rmb?.nombre.startsWith('Metal Claw'),
 'Metal Claw must not be an early full-power slot');
const bulba=make('bulbasaur',5);
assert.ok(!availableMoves(bulba).some(m=>m.id==='solar-beam'));
assert.ok(!availableMoves(bulba).some(m=>m.id==='protect'));
assert.equal(moveUnlockLevel(bulba,'vine-whip'),10);
const rmb=availableMoves(bulba).find(m=>m.torre2IntroSlot==='rmb');
assert.ok(rmb);
assert.equal(equipMove(bulba,1,rmb.id),true,'Player can choose a Lv5 practice HAB2');
assert.equal(resolveLoadout(bulba).rmb?.id,rmb.id);
assert.equal(equipMove(bulba,2,rmb.id),false,'Practice cannot be moved into HAB3');
assert.equal(equipMove(bulba,3,rmb.id),false,'Early HAB2 cannot become ULT');
assert.equal(equipMove(bulba,3,'solar-beam'),false,'Full-power Solar Beam still locked');
bulba.progression.level=8;
const ult=availableMoves(bulba).find(m=>m.torre2IntroSlot==='e');
assert.equal(equipMove(bulba,3,ult.id),true,'Lv8 ULT is equippable');
assert.equal(resolveLoadout(bulba).e?.id,ult.id);
bulba.progression.level=10;
assert.ok(availableMoves(bulba).some(m=>m.id==='vine-whip'));
assert.equal(equipMove(bulba,1,'vine-whip'),true,
 'After Lv8 a real stronger learned move must be selectable');
assert.equal(resolveLoadout(bulba).rmb?.id,'vine-whip',
 'The native battle must respect the real level-10 move selected by the player');
console.log('T08 KANTO FULL CAMPAIGN PROGRESSION PASS',JSON.stringify({
 species:reviewed,starterMoves:reviewed*3,ultimatesAt8:reviewed,
 optionCountAt50:optionsAt50,examples:samples
}));
