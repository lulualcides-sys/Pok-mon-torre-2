import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const dir=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const load=p=>import(pathToFileURL(path.join(root,dir,p)).href);
const core=await load('torre2/campaign-core.js');
const {createPartyMatch}=await load('torre2/party-battle.js');
const {buscar}=await load('datos.js');
const {currentLevelCap}=await load('torre2/kanto-levels.js');
const report=[];
const missing=new Set(),empty=new Set();
for(let stage=0;stage<core.STAGES.length;stage++){
 const trainerCount=core.TRAINERS_PER_GYM(stage);
 const count=trainerCount+1;
 for(let trainer=0;trainer<count;trainer++){
  const state=core.createCampaign('bulbasaur');
  state.stage=stage;state.trainer=trainer;
  const foe=core.currentOpponent(state);
  assert.ok(foe,`missing challenger stage ${stage} trainer ${trainer}`);
  const party=createPartyMatch(state,foe,false);
  assert.ok(party.foes.length>=1&&party.foes.length<=6,`party size ${stage}/${trainer}`);
  assert.equal(party.foes[0].id,foe.leader?
   stage===12?core.rivalChampionTeam('bulbasaur')[0]:core.STAGES[stage].leaderTeam[0]:
   foe.id,`first actual battle member ${stage}/${trainer}`);
  for(const member of party.foes){
   assert.ok(member.level>=1&&member.level<=currentLevelCap(stage),
    `level ${member.id} ${stage}/${trainer}=${member.level}`);
   try{
    const found=buscar(member.id);
    if(!found?.def)missing.add(member.id);
   }catch{missing.add(member.id)}
   if(Object.values(member.loadout||{}).filter(m=>m&&!m.pendiente).length===0)
    empty.add(member.id+' at '+stage+'/'+trainer);
  }
  if(foe.leader){
   const lineup=stage===12?core.rivalChampionTeam('bulbasaur'):core.STAGES[stage].leaderTeam;
   assert.deepEqual(party.foes.map(p=>p.id),lineup);
   assert.deepEqual(party.foes.map(p=>p.level),core.STAGES[stage].leaderLevels);
  }
  report.push({stage,trainer,role:foe.kind,name:foe.name,foes:party.foes.length});
 }
}
assert.equal(report.length,190,'eight trainer ladders, Victory Road and five Indigo League bosses');
assert.deepEqual([...missing],[],'no trainer may send a species without a real Arena fighter');
assert.deepEqual([...empty],[],'every encountered enemy must have real unlocked moves');
console.log('SECTION20_KANTO_TRAINER_AUDIT',JSON.stringify({
 totalEncounters:report.length,
 stages:core.STAGES.length,
 bossTeams:report.filter(x=>x.role==='leader').map(x=>x.name),
 wildEncounterPools:'tested separately',
 method:'static full trainer ladder contract; not equivalent to natural full campaign'
}));
