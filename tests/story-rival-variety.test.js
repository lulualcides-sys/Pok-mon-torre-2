// Owner list 2026-11-20: item 13 (Rival variety) and 18 (leader entrance).
import test from 'node:test';
import assert from 'node:assert/strict';
import {storyFor,RIVAL_STARTER,RIVAL_STAGES,RIVAL_RETRY,STORY} from '../tools/pokearena/torre2-story.js';

const rival={kind:'rival',id:'wartortle'};
test('every Rival scene has a line for each starter',()=>{
 for(const st of ['bulbasaur','charmander','squirtle']){
  for(const stage of RIVAL_STAGES){assert.ok(STORY['rival-'+stage]);assert.ok(RIVAL_STARTER[st][stage],st+stage)}
  assert.ok(RIVAL_STARTER[st].champion);
 }
});
test('starter line differs by the original starter',()=>{
 const a=storyFor({stage:0,starter:'bulbasaur'},rival).lines.at(-1)[1];
 const b=storyFor({stage:0,starter:'squirtle'},rival).lines.at(-1)[1];
 assert.notEqual(a,b);
});
test('reaction to the previous Rival battle: first try vs. after a loss',()=>{
 const seen=['rival-0','rival-1'];
 const first=storyFor({stage:2,starter:'charmander',storySeen:seen},rival).lines[1][1];
 const retried=storyFor({stage:2,starter:'charmander',storySeen:[...seen,'rival-retry-1']},rival).lines[1][1];
 assert.notEqual(first,retried);
 assert.match(retried,/última/i);
 // First Rival scene has no previous battle to talk about.
 assert.equal(storyFor({stage:0,starter:'charmander'},rival).lines.length,STORY['rival-0'].lines.length+1);
});
test('after losing to the Rival: a retry line with its own key',()=>{
 const s=storyFor({stage:4,starter:'squirtle',storySeen:['rival-4'],losses:2},rival);
 assert.equal(s.key,'rival-retry-4');assert.equal(s.lines.length,1);
 assert.equal(s.lines[0][1],RIVAL_RETRY[2].replace('{rival}','Wartortle'));
});
test('leaders: entrance on the first meeting only; Champion names the starter',()=>{
 const first=storyFor({stage:0,starter:'bulbasaur'},{kind:'leader',leader:true,id:'onix'});
 assert.equal(first.entrance,true);
 const retry=storyFor({stage:0,starter:'bulbasaur',storySeen:['leader-0']},{kind:'leader',leader:true,id:'onix'});
 assert.ok(!retry.entrance);
 const champ=storyFor({stage:12,starter:'charmander'},{kind:'leader',leader:true,id:'blastoise'});
 assert.ok(champ.lines.some(([,t])=>t===RIVAL_STARTER.charmander.champion));
});
test('Team Rocket scenes unchanged (once per save)',()=>{
 const k=Object.keys(STORY).find(x=>x.startsWith('rocket-'));
 const stage=Number(k.split('-')[1]);
 assert.ok(storyFor({stage},{kind:'rocket',id:'rattata'}));
 assert.equal(storyFor({stage,storySeen:[k]},{kind:'rocket',id:'rattata'}),null);
});
