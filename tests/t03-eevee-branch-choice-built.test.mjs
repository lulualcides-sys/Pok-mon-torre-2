import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

// Prepared campaign fixtures, not a naturally played route or rendered battle.
// Test the real captured/compiled Phaser campaign modules, not a duplicate.
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const at=p=>import(pathToFileURL(path.join(root,version,p)).href);
const [core,progression]=await Promise.all([
 at('torre2/campaign-core.js'),at('torre2/progression.js')
]);
const choices=['vaporeon','jolteon','flareon'];
function seeded(){
 const data=new Map();
 globalThis.localStorage={
  getItem:key=>data.get(key)??null,
  setItem:(key,value)=>data.set(key,String(value)),
  removeItem:key=>data.delete(key)
 };
 const s=core.createCampaign('bulbasaur');
 s.stage=4; // Level cap 43 permits natural Eevee level-30 evolution.
 s.box.push(s.team.pop()); // The special Mewtwo is still in PC.
 const original=s.team[0];
 const uid='t03-eevee-persist';
 const xp=progression.totalExperienceForLevel(30)-1;
 const eevee={id:'eevee',uid,hp:63,
  progression:progression.createPokemonProgression('eevee',29,{experience:xp}),
  nickname:'Meu Eevee',tmMoves:['Protect'],moves:['Tackle'],movePlanSpecies:'eevee'};
 s.team=[original,eevee];s.active=0;
 core.saveCampaign(s);
 // Normalize legacy inventory defaults before testing byte-for-byte save stability.
 return {s:core.readCampaign(),uid,xp};
}
test('Eevee choice is forbidden before Lv30 and cannot mutate a save on invalid input',()=>{
 const {s,uid}=seeded();
 assert.equal(core.pendingEeveeEvolution(s),null);
 const raw=localStorage.getItem(core.SAVE_KEY);
 assert.equal(core.chooseEeveeEvolution(s,uid,'jolteon').ok,false);
 assert.equal(core.chooseEeveeEvolution(s,uid,'slowking').ok,false);
 assert.equal(core.chooseEeveeEvolution(s,'another-uid','vaporeon').ok,false);
 assert.equal(localStorage.getItem(core.SAVE_KEY),raw);
});
for(const choice of choices)test('T03 Eevee '+choice+' after battle: level, save, UID, TM and PC',()=>{
 const {s,uid}=seeded();
 const pre=JSON.stringify(s);
 assert.equal(s.team[1].id,'eevee');
 const won=core.resolveBattle(s,true); // Campaign event resolver on prepared fixture.
 assert.equal(won.won,true);
 assert.equal(s.team[1].id,'eevee','A pending choice must never auto-select a branch');
 assert.ok(s.team[1].progression.level>=30);
 assert.equal(s.team[1].progression.pendingEvolution,true);
 assert.equal(s.team[1].moves[0],'Tackle','No kit refresh before evolution is chosen');
 assert.deepEqual(core.pendingEeveeEvolution(s),{
  uid,level:s.team[1].progression.level,choices
 });
 const bytes=localStorage.getItem(core.SAVE_KEY);
 assert.equal(core.readCampaign().team[1].id,'eevee');
 assert.equal(localStorage.getItem(core.SAVE_KEY),bytes,'Reading a valid pending save is idempotent');
 for(const invalid of ['ditto','slowbro','',undefined]){
  assert.equal(core.chooseEeveeEvolution(s,uid,invalid).ok,false);
  assert.equal(localStorage.getItem(core.SAVE_KEY),bytes,'Invalid choice must not write');
 }
 const wonCount=s.wins,money=s.money,badges=JSON.stringify(s.badges),uidBefore=s.team[1].uid;
 const level=s.team[1].progression.level,experience=s.team[1].progression.experience;
 const result=core.chooseEeveeEvolution(s,uid,choice);
 assert.deepEqual(result,{ok:true,uid,from:'eevee',to:choice,level});
 assert.equal(s.team[1].id,choice);
 assert.equal(s.team[1].progression.species,choice);
 assert.equal(s.team[1].progression.level,level);
 assert.equal(s.team[1].progression.experience,experience);
 assert.equal(s.team[1].uid,uidBefore);
 assert.equal(s.team[1].nickname,'Meu Eevee');
 assert.equal(s.team[1].hp,63,'Bench HP should not be changed by evolution');
 assert.deepEqual(s.team[1].tmMoves,['Protect']);
 assert.deepEqual(s.team[1].moves,[],'Old kit cannot leak across evolution');
 assert.equal(s.team[1].movePlanSpecies,undefined);
 assert.equal(s.wins,wonCount);
 assert.equal(s.money,money);
 assert.equal(JSON.stringify(s.badges),badges);
 assert.ok(s.dexCaught.includes(choice),'Evolved form must be recorded in Pokédex');
 assert.equal(core.pendingEeveeEvolution(s),null);
 const saved=localStorage.getItem(core.SAVE_KEY);
 const reloaded=core.readCampaign();
 assert.equal(localStorage.getItem(core.SAVE_KEY),saved);
 assert.equal(reloaded.team[1].id,choice);
 assert.equal(core.chooseEeveeEvolution(reloaded,uid,choice).ok,false,'Never evolve twice');
 assert.equal(localStorage.getItem(core.SAVE_KEY),saved,'Repeat choice must not rewrite');
 // The original Eevee can also be in PC when the trainer confirms its branch.
 const boxed=seeded();const second=boxed.s;
 core.resolveBattle(second,true);
 const [pokemon]=second.team.splice(1,1);
 second.box.push(pokemon);
 core.saveCampaign(second);
 assert.equal(core.pendingEeveeEvolution(second).uid,uid);
 assert.equal(core.chooseEeveeEvolution(second,uid,choice).ok,true);
 assert.equal(core.readCampaign().box.find(x=>x.uid===uid).id,choice);
 assert.equal(second.team.some(x=>x.uid===uid),false,'PC selection cannot duplicate in party');
 assert.ok(pre.includes('"eevee"'));
});
console.log('PASS T03 Eevee 3 branches (fixture), Lv30 gate, pending save, PC, idempotence');
