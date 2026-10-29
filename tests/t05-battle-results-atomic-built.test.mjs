// T05: compiled Phaser campaign; storage failures and battles are fixtures.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const core=await import(pathToFileURL(path.join(root,version,'torre2/campaign-core.js')).href);

function fixture(kind){
 const data=new Map();let denied=null;
 const storage={
  getItem:k=>data.get(k)??null,
  setItem(k,v){if(k===denied)throw new Error('QuotaExceededError: '+k);data.set(k,String(v));},
  removeItem:k=>data.delete(k),
  deny:k=>{denied=k;},allow:()=>{denied=null;}
 };
 globalThis.localStorage=storage;
 const s=core.createCampaign('bulbasaur');
 if(kind==='gym')s.trainer=core.TRAINERS_PER_GYM(0);
 if(kind==='champion'){
  s.stage=12;s.trainer=0;
  s.badges=core.GYMS.map(g=>g.badge);
  s.leagueHonors=core.ELITE.slice(0,4).map(g=>g.badge);
 }
 if(kind==='wild')s.pendingWild={id:'caterpie',stage:0,trainer:0,level:4,hpPercent:50};
 if(kind==='rematch'){
  s.stage=1;s.trainer=3;s.badges=['Rocha'];
  s.gymTMClaims=['tm-rock-tomb'];s.inventory.tms=['tm-rock-tomb'];
  s.rematches={charge:3,sequence:0,wins:0,pending:null};
 }
 core.saveCampaign(s,storage);
 const loaded=core.readCampaign(storage);
 core.saveCampaign(loaded,storage);
 storage.setItem(core.SAVE_BACKUP_KEY,storage.getItem(core.SAVE_KEY));
 return {s:loaded,storage};
}
function assertAtomic(kind,denied,invoke,verify){
 const {s,storage}=fixture(kind);
 const ticket=kind==='rematch'?core.startRematch(s,0).ticket:null;
 if(kind==='rematch')assert.ok(ticket,'rematch fixture requires a valid ticket');
 // Both keys must hold a clean checkpoint before the denied transaction.
 storage.setItem(core.SAVE_BACKUP_KEY,storage.getItem(core.SAVE_KEY));
 const before=structuredClone(s),team=s.team,member=s.team[0],inventory=s.inventory;
 const primary=storage.getItem(core.SAVE_KEY),backup=storage.getItem(core.SAVE_BACKUP_KEY);
 storage.deny(denied);
 assert.throws(()=>invoke(s,ticket),/QuotaExceededError/);
 assert.deepEqual(s,before,'denied write mutated live battle rewards');
 assert.strictEqual(s.team,team,'denied write replaced live party');
 assert.strictEqual(s.team[0],member,'denied write replaced live member');
 assert.strictEqual(s.inventory,inventory,'denied write replaced bag');
 assert.equal(storage.getItem(core.SAVE_KEY),primary);
 assert.equal(storage.getItem(core.SAVE_BACKUP_KEY),backup);
 storage.allow();
 assert.deepEqual(core.readCampaign(storage),before,'failed battle lost checkpoint');
 const outcome=invoke(s,ticket);
 verify(before,s,outcome);
 assert.deepEqual(core.readCampaign(storage),s,'retry not durable');
}
const actions=[
 ['trainer',s=>core.resolveBattle(s,true),(b,s,r)=>{
  assert.equal(r.won,true);assert.equal(s.trainer,b.trainer+1);
  assert.equal(s.wins,b.wins+1);assert.ok(s.money>b.money);
  assert.ok(s.team[0].progression.experience>=b.team[0].progression.experience);
 }],
 ['trainer',s=>core.resolveBattle(s,false),(b,s,r)=>{
  assert.equal(r.won,false);assert.equal(s.losses,b.losses+1);
  assert.equal(s.wins,b.wins);assert.equal(s.trainer,b.trainer);
 }],
 ['gym',s=>core.resolveBattle(s,true),(b,s,r)=>{
  assert.equal(r.won,true);assert.equal(s.stage,1);assert.equal(s.trainer,0);
  assert.deepEqual(s.badges,['Rocha']);
  assert.equal(s.inventory.tms.filter(id=>id==='tm-rock-tomb').length,1);
  assert.equal(s.gymTMClaims.filter(id=>id==='tm-rock-tomb').length,1);
 }],
 ['champion',s=>core.resolveBattle(s,true),(b,s,r)=>{
  assert.equal(r.won,true);assert.equal(s.stage,13);assert.equal(s.champion,true);
  assert.equal(s.leagueHonors.filter(x=>x==='Campeão').length,1);
 }],
 ['wild',s=>core.resolveWildBattle(s,true),(b,s,r)=>{
  assert.equal(r.won,true);assert.equal(s.pendingWild,null);
  assert.equal(s.wins,b.wins+1);assert.equal(s.trainer,b.trainer);
 }],
 ['wild',s=>core.resolveWildBattle(s,false),(b,s,r)=>{
  assert.equal(r.won,false);assert.equal(s.pendingWild,null);
  assert.equal(s.losses,b.losses+1);assert.equal(s.wins,b.wins);
 }],
 ['rematch',(s,t)=>core.resolveRematch(s,t,true),(b,s,r)=>{
  assert.equal(r.ok,true);assert.equal(r.won,true);
  assert.equal(s.rematches.wins,b.rematches.wins+1);
  assert.equal(s.rematches.pending,null);
  assert.equal(s.stage,b.stage);assert.equal(s.trainer,b.trainer);
  assert.ok(s.money>b.money);
  assert.equal(core.resolveRematch(s,{token:b.rematches.pending.token,
   stage:b.stage,trainer:0},true).ok,false,'ticket paid twice');
 }],
 ['rematch',(s,t)=>core.resolveRematch(s,t,false),(b,s,r)=>{
  assert.equal(r.ok,true);assert.equal(r.won,false);
  assert.equal(s.rematches.pending,null);assert.equal(s.money,b.money);
  assert.equal(s.rematches.wins,b.rematches.wins);
 }]
];
for(const [kind,invoke,verify] of actions)for(const denied of [core.SAVE_KEY,core.SAVE_BACKUP_KEY])
 test('T05 atomic '+kind+' '+(invoke.toString().includes('false')?'loss':'win')+' denied '+denied,()=>{
  assertAtomic(kind,denied,invoke,verify);
 });
for(const denied of [core.SAVE_KEY,core.SAVE_BACKUP_KEY])
 test('T05 VS Seeker reservation is atomic when '+denied+' denies write',()=>{
  const {s,storage}=fixture('rematch');
  const before=structuredClone(s),primary=storage.getItem(core.SAVE_KEY),backup=storage.getItem(core.SAVE_BACKUP_KEY);
  storage.deny(denied);
  assert.throws(()=>core.startRematch(s,0),/QuotaExceededError/);
  assert.deepEqual(s,before);
  assert.equal(storage.getItem(core.SAVE_KEY),primary);
  assert.equal(storage.getItem(core.SAVE_BACKUP_KEY),backup);
  storage.allow();
  const result=core.startRematch(s,0);
  assert.equal(result.ok,true);
  assert.equal(s.rematches.charge,0);
  assert.deepEqual(core.readCampaign(storage),s);
 });
