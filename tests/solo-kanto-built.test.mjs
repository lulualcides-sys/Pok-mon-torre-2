import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
const stage=path.resolve('_site/arena2d');
const version=fs.readdirSync(stage).find(x=>/^src-[a-f0-9]{10}$/.test(x));
assert.ok(version,'Captured Phaser original client not staged');
const {createCampaign,currentOpponent,resolveBattle,attemptCapture,readCampaign,
 TRAINERS_PER_GYM,GYMS,STARTERS,KANTO_DEX,SAVE_KEY,saveCampaign,
 startBattle,recordSeen,recordCaught,storePokemon,withdrawPokemon,swapPokemon}=await import(pathToFileURL(path.join(stage,version,'torre2/campaign-core.js')));
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
for(const id of ['bonemerang','bone-club','tri-attack','pay-day','swift','shadow-ball','lovely-kiss',
 'ice-beam','rock-blast','confuse-ray','soft-boiled'])
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
for(const id of ['ice-beam','rock-blast','confuse-ray','soft-boiled']){
 assert.equal(equipMove(tester,0,id),true,'new move equippable '+id);
 assert.equal(resolveLoadout(tester).lmb.id,id,'new Phaser move active '+id);
}
const realBeam=allMoves.find(m=>m.id==='ice-beam');
assert.equal(realBeam.forma,'chorro','Ice Beam must reuse real Hyper Beam/Aura Storm engine');
assert.equal(realBeam.paleta,'hieloTorre2');
assert.equal(realBeam.haz,true);
assert.equal(realBeam.giro,3.5);
assert.equal(realBeam.source,'new-phaser-fx','Only native renderer is reused, not falsely relabeled');
for(const id of ['rock-blast','soft-boiled','confuse-ray'])
 assert.equal(allMoves.find(m=>m.id===id)?.approved,true,'Approved '+id);
assert.equal(realBeam.approved,undefined,'Ice Beam not approved yet');
const abilityBody=fs.readFileSync(path.join(stage,version,'habilidades.js'),'utf8');
assert.ok(abilityBody.includes('HAZ.hieloTorre2='),'Exact original beam renderer with new palette');
assert.ok(abilityBody.includes('h.paleta==="hieloTorre2"'),'Ice particles apply only to Ice Beam');
assert.equal(equipMove(tester,0,'ice-beam'),true);
assert.equal(resolveLoadout(tester).lmb.forma,'chorro');
assert.equal(resolveLoadout(tester).lmb.paleta,'hieloTorre2');
assert.equal(equipMove(tester,0,'bonemerang'),true);
const original=allMoves.filter(m=>['Flamethrower','Rock Slide','Water Pulse','Thunderbolt'].includes(m.nombre));
assert.ok(original.length>=2,'captured Poké Arena move catalog retained');
assert.ok(original.every(m=>m.source==='arena2d-original'),'original Arena VFX always take priority');
assert.equal(state.dexCaught.includes('charmander'),true);
assert.equal(recordSeen(state,'onix'),true);
assert.equal(recordSeen(state,'onix'),false);
assert.equal(recordSeen(state,'pichu'),false,'Kanto Pokedex excludes Pichu');
assert.equal(startBattle(state).nivel,'facil');
assert.equal(state.dexSeen.includes('onix'),true);
state.stage=5;state.trainer=TRAINERS_PER_GYM(5);
assert.equal(startBattle(state).nivel,'dificil','later gym bosses gain advanced native AI');
state.stage=8;state.trainer=0;
assert.equal(startBattle(state).nivel,'maestro','Elite Four uses the original master AI');
state.stage=0;state.trainer=0;saveCampaign(state);
assert.equal(recordCaught(state,'onix'),true);
assert.equal(recordCaught(state,'onix'),false);


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
const beforeParty=state.team.map(x=>x.uid),beforeBox=state.box.map(x=>x.uid);
assert.equal(storePokemon(state,0),true);
assert.equal(state.team.length,5);
assert.equal(state.box.at(-1).uid,beforeParty[0]);
assert.equal(withdrawPokemon(state,state.box.length-1),true);
assert.equal(state.team.at(-1).uid,beforeParty[0]);
assert.equal(state.box.length,beforeBox.length);
const bench=state.box[0].uid,slot=state.team[0].uid;
assert.equal(swapPokemon(state,0,0),true);
assert.equal(state.team[0].uid,bench);
assert.equal(state.box[0].uid,slot);
assert.equal(swapPokemon(state,0,0),true);
assert.equal(state.team[0].uid,slot);
assert.equal(storePokemon(state,-1),false);
assert.equal(withdrawPokemon(state,999),false);
assert.equal(readCampaign().team[0].uid,slot);
const legacy=JSON.parse(items.get(SAVE_KEY));
delete legacy.box;delete legacy.dexSeen;delete legacy.dexCaught;
items.set(SAVE_KEY,JSON.stringify(legacy));
const migrated=readCampaign();
assert.ok(Array.isArray(migrated.box)&&Array.isArray(migrated.dexCaught));
assert.ok(migrated.team.length>0&&migrated.team.length<=6);
saveCampaign(state);

assert.ok(state.team[0].progression.level>=5);
assert.ok(state.team[0].id!==initialSpecies || state.team[0].progression.level<16);
const save=items.get(SAVE_KEY);assert.ok(save.includes('"version":1'));
const before=state.trainer;
resolveBattle(state,false);
assert.equal(state.trainer,before,'a lost battle does not advance trainer progression');
assert.equal(readCampaign().losses,state.losses,'defeat statistics must persist after refresh');
assert.equal(readCampaign().trainer,before,'loss must not advance the saved trainer');
assert.equal(readCampaign().pendingCapture,null,'loss must clear any stale capture opportunity');
console.log('PASS offline Kanto campaign: 151 names, 8 gyms, 13 trainers, badges, captures, saves and no in-combat evolution.');
