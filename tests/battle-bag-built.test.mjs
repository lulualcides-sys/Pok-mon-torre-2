import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const {BATTLE_BAG_ITEMS,BATTLE_POTION_LIMIT,applyBattleBagItem}=await import(pathToFileURL(
 path.join(root,version,'torre2/battle-bag.js')).href);
const actor=(hp=80,status=null)=>({id:'pikachu',uid:'a1',hp,status});
const fixtures=(hp=80,status=null)=>({
 state:{team:[actor(hp,status)],stage:0,trainer:0,
   inventory:{potion:2,superpotion:1,antidote:1,paralyzeheal:1,awakening:1,
    burnheal:1,iceheal:1,fullheal:1},money:500},
 party:{friend:[actor(hp,status)],playerIndex:0}
});
test('battle bag only exposes approved healing and status items',()=>{
 assert.deepEqual(BATTLE_BAG_ITEMS,['potion','superpotion','antidote','paralyzeheal',
  'awakening','burnheal','iceheal','fullheal']);
 assert.equal(BATTLE_BAG_ITEMS.includes('pokeball'),false);
 assert.equal(BATTLE_BAG_ITEMS.includes('tm-rock-tomb'),false);
});
test('live HP is authoritative and stock is decremented exactly once',()=>{
 const {state,party}=fixtures(100);
 const result=applyBattleBagItem(state,party,'potion',0,{hp:23,status:null});
 assert.equal(result.ok,true);
 assert.equal(result.fromHp,23);assert.equal(result.toHp,48);
 assert.equal(state.inventory.potion,1);assert.equal(state.team[0].hp,48);
 assert.equal(party.friend[0].hp,48);
});
test('rejects futile use, KO revive, depleted stock and invalid save UID',()=>{
 for(const [name,mutate,live]of [
  ['full',()=>{},{hp:100}],
  ['fainted',()=>{},{hp:0}],
  ['empty',s=>s.inventory.potion=0,{hp:40}],
  ['UID mismatch',s=>s.team[0].uid='other',{hp:40}]
 ]){
  const {state,party}=fixtures();
  mutate(state);
  const orig=JSON.stringify({state,party});
  const result=applyBattleBagItem(state,party,'potion',0,live);
  assert.equal(result.ok,false,name);assert.equal(JSON.stringify({state,party}),orig,name);
 }
});
test('antidote cures Toxic poison, but not burn or confusion',()=>{
 const {state,party}=fixtures(55,{kind:'veneno',toxic:true,elapsed:2});
 const origHp=state.team[0].hp;
 const yes=applyBattleBagItem(state,party,'antidote',0,{
  hp:55,status:{kind:'veneno',toxic:true}});
 assert.equal(yes.ok,true);assert.equal(yes.clearStatus,'veneno');
 assert.equal(state.team[0].status,null);
 assert.equal(state.team[0].hp,origHp);
 assert.equal(state.inventory.antidote,0);
 const before=JSON.stringify({state,party});
 assert.equal(applyBattleBagItem(state,party,'antidote',0,{hp:55,
  status:{kind:'quemado'}}).ok,false);
 assert.equal(JSON.stringify({state,party}),before);
});
test('Full Heal clears confusion and status, not HP or unrelated conditions',()=>{
 const {state,party}=fixtures(36,{kind:'paralizado'});
 state.team[0].confusion={turns:2};
 const cured=applyBattleBagItem(state,party,'fullheal',0,{
  hp:36,status:{kind:'paralizado'},confused:true});
 assert.equal(cured.clearStatus,'paralizado');assert.equal(cured.clearConfusion,true);
 assert.equal(state.team[0].hp,36);
 assert.equal(state.team[0].confusion,null);
 assert.equal(state.team[0].status,null);
});
test('bench heal consumes inventory only for target, not active fighter',()=>{
 const {state,party}=fixtures();
 const b=actor(22,{kind:'quemado'});b.id='squirtle';b.uid='b2';
 state.team.push({...b});party.friend.push({...b});
 const result=applyBattleBagItem(state,party,'superpotion',1);
 assert.equal(result.toHp,82);assert.equal(state.team[1].hp,82);
 assert.equal(state.team[0].hp,80);assert.equal(party.friend[0].hp,80);
});

test('two shared healing potions per battle, third rejected without spending stock',()=>{
 const {state,party}=fixtures(20,{kind:'veneno'});
 assert.equal(BATTLE_POTION_LIMIT,2);
 const first=applyBattleBagItem(state,party,'potion',0,{hp:20,status:null});
 assert.equal(first.ok,true);
 assert.equal(party.playerPotionUses,1);
 const second=applyBattleBagItem(state,party,'superpotion',0,{hp:30,status:null});
 assert.equal(second.ok,true);
 assert.equal(party.playerPotionUses,2);
 const before=JSON.stringify({state,party});
 const blocked=applyBattleBagItem(state,party,'potion',0,{hp:30,status:null});
 assert.equal(blocked.ok,false);
 assert.match(blocked.reason,/Limite de 2 poções/);
 assert.equal(JSON.stringify({state,party}),before,'Third heal cannot spend or change campaign state');
 const cure=applyBattleBagItem(state,party,'antidote',0,{hp:90,status:{kind:'veneno'}});
 assert.equal(cure.ok,true,'Status cure does not consume the healing-potion quota');
 assert.equal(party.playerPotionUses,2);
 // New encounter, independent counter; inventory remains authoritative.
 const freshParty={friend:party.friend,playerIndex:0,playerPotionUses:0};
 assert.equal(applyBattleBagItem(state,freshParty,'potion',0,{hp:20,status:null}).ok,true);
 assert.equal(freshParty.playerPotionUses,1);
});
