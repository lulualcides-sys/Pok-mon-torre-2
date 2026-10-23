import test from 'node:test';
import assert from 'node:assert/strict';
import {createPokemonProgression} from '../src/progression.js';
import {createCampaign,awardSharedTeamExperience,resolveBattle,resolveWildBattle,
 saveCampaign,readCampaign,resetCampaign,SAVE_KEY,SAVE_BACKUP_KEY}
 from '../tools/pokearena/torre2-campaign-core.js';
const storage=()=>{
 const map=new Map();
 return {getItem:key=>map.get(key)||null,
  setItem:(key,value)=>map.set(key,String(value)),
  removeItem:key=>map.delete(key)};
};
test('every party Pokémon gets FULL trainer EXP with no six-way division',()=>{
 const local=storage();
 globalThis.localStorage=local;
 const state=createCampaign('charmander');
 state.team.push({id:'caterpie',uid:'caterpie-test',hp:28,
  progression:createPokemonProgression('caterpie',5)});
 state.team.push({id:'pidgey',uid:'pidgey-test',hp:0,
  progression:createPokemonProgression('pidgey',5)});
 const before=state.team.map(x=>x.progression.experience);
 const result=resolveBattle(state,true,()=>.25);
 assert.equal(result.won,true);
 assert.equal(result.sharedExp.length,4);
 assert.equal(result.sharedExp.filter(x=>!x.tester).length,3);
 assert.ok(result.reward>0);
 for(const i of [0,2,3]){
  assert.ok(state.team[i].progression.experience>before[i],
   'Teammate '+i+' receives EXP even if benched or fainted');
  assert.equal(result.sharedExp[i].reward,result.reward,
   'EXP is not divided among teammates');
 }
 assert.equal(state.team[1].progression.experience,before[1],
  'Permanent level-50 Mewtwo tester does not level');
 assert.equal(state.team[2].hp,28,'Reserve health is preserved');
 assert.equal(state.team[3].hp,0,'XP never revives a fainted Pokemon');
 assert.equal(state.trainer,1,'XP share does not advance extra challenges');
});
test('all-team EXP also applies to wild victory and honors cap/evolution',()=>{
 const local=storage();globalThis.localStorage=local;
 const state=createCampaign('bulbasaur');
 state.team.push({id:'caterpie',uid:'caterpie',hp:100,
  progression:createPokemonProgression('caterpie',6)});
 const before=state.team[2].progression.experience;
 state.pendingWild={id:'pidgey',stage:0,trainer:0,level:3,hpPercent:100};
 const result=resolveWildBattle(state,true);
 assert.ok(result.sharedExp.length===3);
 assert.ok(state.team[2].progression.experience>before);
 assert.equal(state.trainer,0,'Wild battle does not advance trainer progress');
 assert.equal(state.pendingWild,null);
 const big=awardSharedTeamExperience(state,999999,{kind:'trainer'});
 assert.equal(state.team[2].progression.level<=14,true);
 assert.equal(state.team[1].progression.level,50);
 assert.equal(big.totalRecipients,2);
});
test('reset journey requires explicit call and removes both current and backup saves',()=>{
 const local=storage();globalThis.localStorage=local;
 const state=createCampaign('squirtle');
 saveCampaign(state);state.money=9999;saveCampaign(state);
 assert.ok(local.getItem(SAVE_KEY));assert.ok(local.getItem(SAVE_BACKUP_KEY));
 resetCampaign(local);
 assert.equal(local.getItem(SAVE_KEY),null);
 assert.equal(local.getItem(SAVE_BACKUP_KEY),null);
 assert.equal(readCampaign(local),null);
});
