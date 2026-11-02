/* Master T20 — verify the CURRENT compiled Phaser League against all three
 * ORIGINAL starters. This tests roster selection and progression boundaries,
 * NOT a fabricated Champion victory or a full natural campaign.
 * No changes to user saves, moves, sprites, capture or approved VFX.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
const modules=version.modules;
const core=await import(pathToFileURL(path.join(root,modules,'torre2/campaign-core.js')).href);
const party=await import(pathToFileURL(path.join(root,modules,'torre2/party-battle.js')).href);
const approved={
 bulbasaur:['pidgeot','alakazam','rhydon','exeggutor','gyarados','charizard'],
 charmander:['pidgeot','alakazam','rhydon','arcanine','exeggutor','blastoise'],
 squirtle:['pidgeot','alakazam','rhydon','gyarados','arcanine','venusaur']
};
const levels=[59,57,59,59,61,63];
const evidence={build:modules,scope:'Champion roster for all original Kanto starters, no simulated battles',
 results:[]};
function snapshot(s){return JSON.stringify(s)}
test('T20 original starter determines Champion team, even if the player evolved or swapped',()=>{
 for(const starter of Object.keys(approved)){
  const state=core.createPlayerCampaign(starter);
  assert.equal(state.stage,0,'New game must genuinely start at Pallet');
  assert.deepEqual(state.team.map(p=>p.id),[starter],
   'No test fixture Mewtwo in production Kanto team');
  assert.equal(state.champion,false);
  // A fixture initializes a locked Indigo Plateau inspection, not a victory.
  state.stage=12;state.trainer=core.TRAINERS_PER_GYM(12);
  state.badges=core.GYMS.map(g=>g.badge);
  state.leagueHonors=['Elite 1','Elite 2','Elite 3','Elite 4'];
  state.wins=0;state.losses=0;
  state.team[0].id='jolteon'; // The starter is stored persistently, not inferred from active party.
  const before=snapshot(state);
  assert.equal(core.campaignStarter(state),starter);
  const foe=core.currentOpponent(state);
  assert.ok(foe&&foe.leader,'Champion must be a six-member boss encounter');
  assert.equal(foe.name,'Campeão');
  assert.equal(foe.id,approved[starter][5], 'Champion ace changes with ORIGINAL starter');
  const match=party.createPartyMatch(state,foe);
  const ids=match.foes.map(m=>m.id),actualLevels=match.foes.map(m=>m.level);
  assert.deepEqual(ids,approved[starter],starter+' exact six FRLG enemy IDs');
  assert.deepEqual(actualLevels,levels,starter+' original FRLG levels');
  assert.ok(match.foes.every(m=>m.hp===100&&m.loadout?.lmb?.forma),
   starter+' every enemy must start with real basic move renderer');
  assert.equal(snapshot(state),before,
   starter+' preview must not consume items/earn XP/advance stage/change saved roster');
  assert.equal(state.champion,false);
  evidence.results.push({starter,foes:ids,levels:actualLevels,first:ids[0],ace:ids.at(-1)});
 }
 assert.equal(new Set(evidence.results.map(x=>x.ace)).size,3,
  'Three starter branches must have three distinct final aces');
});
test('T20 no fight after genuine champion state, no fictitious eighth/ninth badge',()=>{
 const state=core.createPlayerCampaign('bulbasaur');
 state.stage=13;state.trainer=0;state.champion=true;
 state.badges=core.GYMS.map(g=>g.badge);
 state.leagueHonors=['Elite 1','Elite 2','Elite 3','Elite 4','Campeão'];
 const before=snapshot(state);
 assert.equal(core.currentOpponent(state),null);
 assert.throws(()=>core.startBattle(state),/Kanto campaign completed/);
 assert.equal(snapshot(state),before,'Completed campaign must stay immutable');
 assert.equal(state.badges.length,8,'No duplicated Kanto gym badge');
 assert.equal(state.leagueHonors.length,5,'Elite Four + Champion honors must be distinct');
});
test('T20 fainted whole team cannot launch a fresh Champion encounter',()=>{
 const state=core.createPlayerCampaign('charmander');
 state.stage=12;state.trainer=0;state.team[0].hp=0;
 const before=snapshot(state);
 assert.throws(()=>core.startBattle(state),/Equipe desmaiada/);
 assert.equal(snapshot(state),before,'Rejected battle cannot resurrect fainted Pokémon');
 assert.equal(state.wins,0);
});
fs.mkdirSync('test-evidence',{recursive:true});
fs.writeFileSync('test-evidence/t20-three-starter-champion-stage-boundary.json',JSON.stringify(evidence,null,2));
console.log('T20 CHAMPION ALL THREE ORIGINAL STARTERS BUILT',JSON.stringify(evidence));
