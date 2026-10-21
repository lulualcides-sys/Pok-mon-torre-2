import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
const stage=path.resolve('_site/arena2d');
const version=fs.readdirSync(stage).find(x=>/^src-[a-f0-9]{10}$/.test(x));
assert.ok(version,'Captured Phaser original client not staged');
const {createCampaign,currentOpponent,resolveBattle,attemptCapture,readCampaign,
 TRAINERS_PER_GYM,GYMS,STARTERS,KANTO_DEX,SAVE_KEY,saveCampaign}=await import(pathToFileURL(path.join(stage,version,'torre2/campaign-core.js')));
const items=new Map();
globalThis.localStorage={getItem:k=>items.get(k)??null,setItem:(k,v)=>items.set(k,String(v)),removeItem:k=>items.delete(k)};
assert.equal(KANTO_DEX.length,151);
assert.equal(GYMS.length,8);
assert.deepEqual(STARTERS,['bulbasaur','charmander','squirtle']);
let state=createCampaign('charmander');
assert.equal(state.trainer,0);
assert.equal(TRAINERS_PER_GYM(0),13);
assert.equal(currentOpponent(state).id,'onix');
const {availableMoves,equipMove,selectedMoves,resolveLoadout}=await import(
 pathToFileURL(path.join(stage,version,'torre2/move-pool.js')));
const tester=state.team.find(p=>p.id==='mewtwo');
assert.ok(tester,'level-50 Mewtwo should be on the Kanto team at game start');
assert.equal(tester.progression.level,50);
const allMoves=availableMoves(tester);
assert.ok(allMoves.length>=100,'test Mewtwo should unlock all captured Poké Arena client moves');
for(const id of ['bonemerang','bone-club','tri-attack','pay-day','swift','shadow-ball','lovely-kiss'])
 assert.ok(allMoves.find(x=>x.id===id),'missing signature move '+id);
assert.deepEqual(selectedMoves(tester),['bonemerang','bone-club','tri-attack','pay-day']);
assert.deepEqual(Object.values(resolveLoadout(tester)).map(h=>h.forma),
 ['torre2_bonemerang','torre2_boneclub','torre2_triattack','torre2_payday']);
const confusion=allMoves.find(x=>x.nombre==='Confusion');
assert.ok(confusion);
assert.equal(equipMove(tester,0,confusion.id),true);
assert.equal(resolveLoadout(tester).lmb.nombre,'Confusion');
assert.equal(equipMove(tester,0,'nonexistent-attack'),false);
assert.equal(equipMove(tester,1,'tri-attack'),false,'prevent duplicate moves in slots');
saveCampaign(state);
assert.equal(readCampaign().team.find(x=>x.id==='mewtwo').moves[0],confusion.id,
 'selected moves must persist in saved campaign');
assert.equal(allMoves.some(x=>x.id==='surf'),false,'unapproved Surf must be hidden from the Kanto move catalog');
assert.equal(equipMove(tester,0,'surf'),false,'unapproved Surf may not be equipped');
assert.equal(equipMove(tester,0,'swift'),true,'new Swift must equip');
assert.equal(resolveLoadout(tester).lmb.forma,'torre2_swift');
assert.equal(equipMove(tester,0,'shadow-ball'),true,'new Shadow Ball must equip');
assert.equal(resolveLoadout(tester).lmb.forma,'torre2_shadowball');
assert.equal(equipMove(tester,0,'lovely-kiss'),true,'new Lovely Kiss must equip');
assert.equal(resolveLoadout(tester).lmb.forma,'torre2_lovelykiss');
assert.equal(equipMove(tester,0,'bonemerang'),true);

const initialSpecies=state.team[0].id;
for(let i=0;i<13;i++){
 assert.equal(currentOpponent(state).leader,false);
 const result=resolveBattle(state,true,()=>0);
 assert.equal(result.won,true);
 assert.equal(state.stage,0);
 assert.ok(state.team[0].progression.experience>0);
 if(state.pendingCapture){const r=attemptCapture(state,()=>0);assert.ok(r.ok)}
}
assert.equal(state.trainer,13);
assert.equal(currentOpponent(state).leader,true);
const beforeBadge=state.badges.length;
resolveBattle(state,true,()=>0);
assert.equal(state.stage,1);
assert.equal(state.badges.length,beforeBadge+1);
if(state.pendingCapture)assert.equal(attemptCapture(state,()=>0).ok,true);
assert.equal(readCampaign().stage,1);
assert.equal(state.team.length,6);
assert.ok(state.box.length>0);
assert.ok(state.team[0].progression.level>=5);
assert.ok(state.team[0].id!==initialSpecies || state.team[0].progression.level<16);
const save=items.get(SAVE_KEY);assert.ok(save.includes('"version":1'));
const before=state.trainer;
resolveBattle(state,false);
assert.equal(state.trainer,before,'a lost battle does not advance trainer progression');
console.log('PASS offline Kanto campaign: 151 names, 8 gyms, 13 trainers, badges, captures, saves and no in-combat evolution.');
