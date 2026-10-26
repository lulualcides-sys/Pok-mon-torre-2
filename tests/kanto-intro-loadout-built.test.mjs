// Campaign starter progression regression on the ACTUAL generated Phaser tree.
// The official FRLG learned moves and saved loadouts are checked separately.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const load=name=>import(pathToFileURL(path.join(root,version,name)));
const [{KANTO_151},{resolveLoadout,availableMoves,moveUnlockLevel,TEST_LIBRARY},{frlgUnlockLevel},{createCampaign}] =
 await Promise.all([
  load('torre2/all-kanto-species.js'),load('torre2/move-pool.js'),
  load('torre2/frlg-learnsets.js'),load('torre2/campaign-core.js')
 ]);
const slots=['lmb','rmb','q'];
const report={species:0,lv5:0,lv8:0,lv13:0,noviceExceptions:[],starters:{}};
const make=(id,level)=>({id,progression:{species:id,level},tmMoves:[]});
for(const {id} of KANTO_151){
 if(id==='mewtwo')continue; // intentionally unrestricted Lv50 testing character
 const member=make(id,5),original=JSON.stringify(member);
 const at5=resolveLoadout(member);
 assert.equal(at5.e,undefined,id+' level 5 must not allow ULT');
 const sourceMoves=new Set();
 for(const slot of slots){
  const move=at5[slot];
  assert.ok(move?.forma,id+' level 5 missing '+slot);
  assert.equal(move.pendiente,false,id+' level 5 slot locked '+slot);
  assert.ok(Number.isFinite(move.dano)&&move.dano>=0&&move.dano<=9,
   id+' level 5 move too powerful: '+slot+' '+move.nombre+' '+move.dano);
  assert.equal(move.torre2IntroPractice,true,id+' missing separate practice designation '+slot);
  sourceMoves.add(move.id);
 }
 assert.equal(sourceMoves.size,3,id+' initial battle controls need distinct usable action keys');
 assert.equal(JSON.stringify(member),original,id+' practice loadout must never mutate save data');
 assert.equal(resolveLoadout(make(id,7)).e,undefined,id+' ULT must remain locked Lv7');
 const at8=resolveLoadout(make(id,8));
 assert.ok(at8.e?.ulti,id+' Lv8 has no 100%-meter ultimate');
 assert.ok(at8.e.dano<=12,id+' Lv8 ULT exceeds safe training damage');
 assert.ok(at8.e.cd>=8,id+' Lv8 ULT too spammable');
 for(const slot of slots)assert.ok(at8[slot]?.forma,id+' Lv8 lost '+slot);
 const at13=resolveLoadout(make(id,13));
 assert.ok(!Object.values(at13).some(x=>x?.torre2IntroPractice),
   id+' training moves must leave after onboarding');
 report.species++;report.lv5+=3;report.lv8++;report.lv13++;
 if(['bulbasaur','charmander','squirtle'].includes(id))
  report.starters[id]={
   initial:slots.map(slot=>at5[slot].nombre),
   ultAt8:at8.e.nombre,
   damage:slots.map(slot=>at5[slot].dano)
  };
}
for(const [species,move,level] of [
 ['bulbasaur','vine-whip',10],['bulbasaur','solar-beam',46],
 ['charmander','ember',7],['charmander','flamethrower',31],
 ['squirtle','bubble',7],['squirtle','hydro-pump',47]]){
 assert.equal(frlgUnlockLevel(species,move),level);
}
for(const [species,late] of [
 ['charmander','flamethrower'],['bulbasaur','solar-beam'],
 ['squirtle','hydro-pump'],['rattata','hyper-fang']]){
 assert.ok(!availableMoves(make(species,5)).some(m=>m.id===late),
  species+' official late learned move unlocked early');
}
for(const id of ['bulbasaur','charmander','squirtle']){
 const campaign=createCampaign(id);
 assert.equal(campaign.team[0].progression.level,5);
 assert.equal(campaign.team[0].id,id);
}
assert.ok(TEST_LIBRARY.length>20,'Use actual existing approved Poké Arena attacks');
assert.equal(report.species,150);
console.log('KANTO_LEVEL5_INTRO_AUDIT',JSON.stringify(report));
console.log('PASS Lv5 weak ATK/SKL/Q, Lv8 ULT and official FRLG learnsets preserved for 150 Kanto species + Mewtwo test exception');
