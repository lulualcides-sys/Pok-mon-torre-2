// T05 — regression against the compiled Phaser party result path.
// Legacy UID-less members and deliberately duplicated UIDs are prepared fixtures;
// these are not naturally played Kanto victories.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const load=p=>import(pathToFileURL(path.join(root,version,'torre2',p)).href);
const [core,partyBattle]=await Promise.all([load('campaign-core.js'),load('party-battle.js')]);
function storage(){
 const values=new Map();
 return {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),
  removeItem:k=>values.delete(k)};
}
function legacyState(){
 const db=storage();
 const s=core.createCampaign('bulbasaur');
 s.team.forEach(m=>delete m.uid);
 s.team[0].hp=77;s.team[1].hp=63;
 core.saveCampaign(s,db);
 return {db,state:core.readCampaign(db)};
}
test('T05 compiled party result keeps independent HP/status for two UID-less legacy teammates',()=>{
 const {db,state}=legacyState();
 const before={money:state.money,inventory:structuredClone(state.inventory),
  stage:state.stage,trainer:state.trainer};
 const party=partyBattle.createPartyMatch(state,core.currentOpponent(state));
 assert.equal(party.friend.length,2);
 assert.equal(party.friend[0].uid,undefined);
 assert.equal(party.friend[1].uid,undefined);
 party.friend[0].hp=0;party.friend[0].status={kind:'veneno',toxic:false};
 party.friend[1].hp=38;party.friend[1].status={kind:'quemado'};
 party.playerIndex=1;
 partyBattle.applyPartyBattleResult(state,party);
 assert.deepEqual(state.team.map(m=>m.hp),[0,38]);
 assert.deepEqual(state.team.map(m=>m.status),[
  {kind:'veneno',toxic:false},{kind:'quemado'}]);
 assert.equal(state.active,1);
 assert.equal(state.money,before.money);
 assert.deepEqual(state.inventory,before.inventory);
 assert.equal(state.stage,before.stage);
 assert.equal(state.trainer,before.trainer);
 core.saveCampaign(state,db);
 const reloaded=core.readCampaign(db);
 assert.deepEqual(reloaded.team.map(m=>m.hp),[0,38]);
 assert.deepEqual(reloaded.team.map(m=>m.status),state.team.map(m=>m.status));
 assert.deepEqual(reloaded.team.map(m=>m.id),['bulbasaur','mewtwo']);
});
test('T05 mixed modern and legacy UIDs do not alias an unrelated member',()=>{
 const {state}=legacyState();
 state.team[0].uid='stable-starter';
 const party=partyBattle.createPartyMatch(state,core.currentOpponent(state));
 party.friend[0].hp=13;party.friend[0].status={kind:'paralizado'};
 party.friend[1].hp=92;party.friend[1].status=null;
 partyBattle.applyPartyBattleResult(state,party);
 assert.deepEqual(state.team.map(m=>m.hp),[13,92]);
 assert.deepEqual(state.team.map(m=>m.status),[{kind:'paralizado'},null]);
 assert.equal(state.team[0].uid,'stable-starter');
});
test('T05 duplicate legacy UIDs stay distinct in memory until read-time repair',()=>{
 const {state}=legacyState();
 state.team[0].uid='legacy-collision';
 state.team[1].uid='legacy-collision';
 const party=partyBattle.createPartyMatch(state,core.currentOpponent(state));
 party.friend[0].hp=7;party.friend[0].status={kind:'congelado'};
 party.friend[1].hp=56;party.friend[1].status=null;
 partyBattle.applyPartyBattleResult(state,party);
 assert.deepEqual(state.team.map(m=>m.hp),[7,56]);
 assert.deepEqual(state.team.map(m=>m.status),[{kind:'congelado'},null]);
});
test('T05 ambiguous slot with different species never transfers another creature\'s damage',()=>{
 const {state}=legacyState();
 const party=partyBattle.createPartyMatch(state,core.currentOpponent(state));
 party.friend[0].id='pikachu';party.friend[0].hp=1;
 party.friend[1].hp=48;
 partyBattle.applyPartyBattleResult(state,party);
 assert.equal(state.team[0].hp,77,'do not apply damage from mismatched species');
 assert.equal(state.team[1].hp,48);
});

test('T05 stale unique UID with different species cannot overwrite HP or status',()=>{
 const {state}=legacyState();
 state.team[0].uid='stable-starter';
 state.team[1].uid='stable-reserve';
 const party=partyBattle.createPartyMatch(state,core.currentOpponent(state));
 party.friend[0].id='pikachu'; // stale combat snapshot, not the starter
 party.friend[0].hp=0;party.friend[0].status={kind:'veneno'};
 party.friend[1].hp=39;party.friend[1].status={kind:'paralizado'};
 partyBattle.applyPartyBattleResult(state,party);
 assert.equal(state.team[0].hp,77,'mismatched species must not receive KO');
 assert.equal(state.team[0].status??null,null,'mismatched species must not receive poison');
 assert.equal(state.team[1].hp,39);
 assert.deepEqual(state.team[1].status,{kind:'paralizado'});
});
test('T05 in-memory duplicate state UID cannot alias a unique battle member',()=>{
 const {state}=legacyState();
 state.team[0].uid='collision';state.team[1].uid='collision';
 const party=partyBattle.createPartyMatch(state,core.currentOpponent(state));
 party.friend[1].uid='new-reserve-uid'; // changed during a pending recall
 party.friend[0].hp=19;party.friend[0].status={kind:'quemado'};
 party.friend[1].hp=4;party.friend[1].status={kind:'veneno'};
 partyBattle.applyPartyBattleResult(state,party);
 assert.deepEqual(state.team.map(m=>m.hp),[19,63],
  'one unique battle UID must not overwrite both duplicated state UIDs');
 assert.deepEqual(state.team[0].status,{kind:'quemado'});
 assert.equal(state.team[1].status??null,null);
});
test('T05 reordered unique battle UIDs still map HP to their original species',()=>{
 const {state}=legacyState();
 state.team[0].uid='starter-uid';state.team[1].uid='reserve-uid';
 const party=partyBattle.createPartyMatch(state,core.currentOpponent(state));
 party.friend.reverse();
 party.friend[0].hp=31;party.friend[1].hp=44;
 partyBattle.applyPartyBattleResult(state,party);
 assert.deepEqual(state.team.map(m=>m.hp),[44,31]);
});
