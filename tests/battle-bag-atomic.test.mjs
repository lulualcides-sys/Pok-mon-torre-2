import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const {applyBattleBagItem,commitBattleBagItem}=await import(pathToFileURL(
 path.join(root,version,'torre2/battle-bag.js')).href);
const make=()=>{
 const starter={id:'squirtle',uid:'safe-1',hp:90,status:null};
 const state={team:[{...starter}],inventory:{
  potion:2,superpotion:1,antidote:1,fullheal:1},lastMessage:'before'};
 const party={friend:[{...starter}],playerIndex:0};
 return {state,party};
};
test('rejected backup/primary writes never mutate live item, HP, party, message',()=>{
 for(const key of ['primary','backup']){
  const {state,party}=make(),s=JSON.stringify(state),p=JSON.stringify(party);
  const refMember=state.team[0],refFriend=party.friend[0],refInv=state.inventory;
  let writes=0;
  assert.throws(()=>commitBattleBagItem(state,party,'potion',0,
   {hp:30},()=>{writes++;throw new Error(key+' denied')}),/denied/);
  assert.equal(writes,1);
  assert.equal(JSON.stringify(state),s);
  assert.equal(JSON.stringify(party),p);
  assert.strictEqual(state.team[0],refMember);
  assert.strictEqual(party.friend[0],refFriend);
  assert.strictEqual(state.inventory,refInv);
  const success=commitBattleBagItem(state,party,'potion',0,
   {hp:30},draft=>{
    assert.equal(draft.inventory.potion,1,'persistence sees the full new snapshot');
    assert.equal(draft.team[0].hp,55);
    assert.equal(state.inventory.potion,2,'live stock unaffected until saved');
    assert.equal(party.friend[0].hp,90,'live battle member unaffected');
   });
  assert.equal(success.ok,true);
  assert.equal(state.inventory.potion,1);
  assert.equal(state.team[0].hp,55);
  assert.equal(party.friend[0].hp,55);
  assert.strictEqual(state.team[0],refMember);
  assert.strictEqual(party.friend[0],refFriend);
  assert.strictEqual(state.inventory,refInv);
  assert.equal(state.lastMessage,'POÇÃO usado em SQUIRTLE.');
 }
});
test('invalid target, exhausted stock, KO or stale species does no write',()=>{
 for(const invalid of ['target','stock','KO','species']){
  const {state,party}=make();
  let target=0,live={hp:30};
  if(invalid==='target')target=3;
  if(invalid==='stock')state.inventory.potion=0;
  if(invalid==='KO')live.hp=0;
  if(invalid==='species')party.friend[0].id='charmeleon';
  const before=JSON.stringify({state,party});
  const r=commitBattleBagItem(state,party,'potion',target,live,
   ()=>{throw Error('should not persist invalid use')});
  assert.equal(r.ok,false,invalid);
  assert.equal(JSON.stringify({state,party}),before,invalid);
 }
});
test('status cure preserves HP, does not spend after a denied commit',()=>{
 const {state,party}=make();
 state.team[0].status={kind:'veneno',toxic:true};
 party.friend[0].status={kind:'veneno',toxic:true};
 const live={hp:37,status:{kind:'veneno',toxic:true}};
 assert.throws(()=>commitBattleBagItem(state,party,'antidote',0,live,
  ()=>{throw Error('quota')}),/quota/);
 assert.equal(state.inventory.antidote,1);
 assert.deepEqual(state.team[0].status,{kind:'veneno',toxic:true});
 assert.equal(commitBattleBagItem(state,party,'antidote',0,live,()=>{}).ok,true);
 assert.equal(state.inventory.antidote,0);
 assert.equal(state.team[0].status,null);
 assert.equal(party.friend[0].status,null);
 assert.equal(state.team[0].hp,37);
});
test('pure legacy apply helper is still preserved for existing consumers',()=>{
 const {state,party}=make();
 assert.equal(applyBattleBagItem(state,party,'potion',0,{hp:20}).ok,true);
 assert.equal(state.inventory.potion,1);
});
