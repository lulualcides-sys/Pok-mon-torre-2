import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

// T20: verify the actual bundled League data without modifying combat,
// granting victories, or writing into a player's browser save.
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const core=await import(pathToFileURL(path.join(root,version,'torre2/campaign-core.js')).href);
const {createPartyMatch}=await import(pathToFileURL(path.join(root,version,'torre2/party-battle.js')).href);

function isolatedStorage(){
 const values=new Map();
 return {getItem:k=>values.get(k)??null,
  setItem:(k,v)=>values.set(k,String(v)),
  removeItem:k=>values.delete(k)};
}

test('Elite Four and Champion have native trainer encounters and distinct full parties',()=>{
 globalThis.localStorage=isolatedStorage();
 const expected=[['Lorelei',5],['Bruno',5],['Agatha',5],['Lance',5],['Champion',6]];
 for(const [index,[label,count]] of expected.entries()){
  const stage=8+index;
  const state=core.createCampaign('bulbasaur');
  state.stage=stage;
  state.trainer=core.TRAINERS_PER_GYM(stage);
  const opponent=core.currentOpponent(state);
  assert.ok(opponent, `${label}: opponent missing`);
  assert.equal(opponent.leader,true,`${label}: must be a boss encounter`);
  const match=createPartyMatch(state,opponent);
  assert.equal(match.foes.length,count,`${label}: full roster required`);
  assert.ok(match.foes.every(p=>p.id&&Number.isFinite(p.level)&&p.level>0),
   `${label}: every opponent needs an identity and level`);
  assert.equal(state.wins,0,`${label}: inspection cannot award victories`);
  assert.equal(state.losses,0,`${label}: inspection cannot award defeats`);
  assert.equal(state.stage,stage,`${label}: inspection cannot advance progress`);
 }
});

test('Agatha uses her Gen III five-member lineup in battle order',()=>{
 globalThis.localStorage=isolatedStorage();
 const state=core.createCampaign('bulbasaur');
 state.stage=10;
 state.trainer=core.TRAINERS_PER_GYM(10);
 const match=createPartyMatch(state,core.currentOpponent(state));
 assert.deepEqual(match.foes.map(p=>p.id),
  ['gengar','golbat','haunter','arbok','gengar']);
 assert.deepEqual(match.foes.map(p=>p.level),[54,54,53,56,58]);
});
