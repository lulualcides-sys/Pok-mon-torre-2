// T21 — validate built Phaser Kanto XP share for a whole team + QA Mewtwo.
// PREPARED save and resolver outcomes are fixtures, NOT naturally played fights.
// Only real campaign modules, no simulator or patched in-game moves/levels.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const modules=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const load=p=>import(pathToFileURL(path.join(root,modules,'torre2',p)).href);
const [core,progress,levels]=await Promise.all([
 load('campaign-core.js'),load('progression.js'),load('kanto-levels.js')
]);
const copy=x=>JSON.parse(JSON.stringify(x));
const db=new Map();
globalThis.localStorage={getItem:k=>db.get(k)??null,
 setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k)};
const member=(id,i,level=5)=>({id,uid:'t21-'+id+'-'+i,hp:55+i*10,
 progression:progress.createPokemonProgression(id,level),
 status:i===2?{kind:'quemado'}:null,tmMoves:[]});
const initial=()=>{
 db.clear();const s=core.createCampaign('bulbasaur');
 s.team.push(member('squirtle',2),member('caterpie',3));
 core.saveCampaign(s);
 return core.readCampaign();
};
const report={scope:'T21 shared Kanto XP and level caps in built Phaser campaign resolver',
 method:'prepared team and direct battle outcome resolver; not naturally played combat',
 trainer:[],wild:[],defeat:null,caps:null};
test('T21 trainer resolver awards all ordinary teammates, never QA Mewtwo or PC',()=>{
 const s=initial();assert.equal(s.team.length,4);
 const before=copy(s);
 const uid=s.team.map(m=>m.uid);
 const beforeExp=s.team.map(m=>m.progression.experience);
 const beforeHp=s.team.map(m=>m.hp);
 const beforeBox=s.box.map(m=>m.uid);
 const result=core.resolveBattle(s,true);
 assert.equal(result.won,true);
 assert.equal(result.sharedExp.length,4);
 assert.equal(result.sharedExp.filter(x=>!x.tester).length,3);
 assert.equal(s.wins,before.wins+1);
 assert.equal(s.trainer,before.trainer+1);
 assert.equal(s.money,before.money+180);
 assert.equal(s.team[0].hp,100,'Only active starter healed by trainer victory');
 for(const i of [2,3]){
  assert.equal(s.team[i].hp,beforeHp[i],'Bench HP should not be reset by XP Share');
  assert.deepEqual(s.team[i].status,before.team[i].status,
   'Bench status should not be reset by XP Share');
 }
 for(const i of [0,2,3]){
  const gain=result.sharedExp.find(x=>x.index===i);
  assert.ok(gain&&!gain.tester&&gain.reward>0,'Ordinary recipient gained 0 XP '+i);
  assert.equal(s.team[i].progression.experience-beforeExp[i],gain.reward,
   'Recorded XP must equal actual earned progression '+i);
  assert.ok(s.team[i].progression.level<=14,'Stage 0 cap exceeded '+i);
 }
 const qa=result.sharedExp.find(x=>x.index===1);
 assert.ok(qa?.tester);
 assert.equal(qa.reward,0,'Mewtwo QA must earn 0 XP');
 assert.equal(s.team[1].progression.experience,beforeExp[1]);
 assert.deepEqual(s.team.map(m=>m.uid),uid,'XP cannot change owner UIDs');
 assert.deepEqual(s.box.map(m=>m.uid),beforeBox,'XP cannot mutate PC');
 assert.deepEqual(s.inventory,before.inventory,'XP cannot award items');
 const saved=core.readCampaign();
 assert.deepEqual(saved,s,'Reload should retain exact award results');
 report.trainer=result.sharedExp;
});
test('T21 defeat never grants XP or trophy, including to bench members',()=>{
 const s=initial(),before=copy(s);
 const res=core.resolveBattle(s,false);
 assert.equal(res.won,false);
 assert.equal(s.wins,before.wins);
 assert.equal(s.losses,before.losses+1);
 assert.equal(s.trainer,before.trainer);
 assert.equal(s.money,before.money);
 assert.deepEqual(s.badges,before.badges);
 for(let i=0;i<s.team.length;i++){
  assert.equal(s.team[i].id,before.team[i].id);
  assert.equal(s.team[i].uid,before.team[i].uid);
  assert.deepEqual(s.team[i].progression,before.team[i].progression,
   'Defeat gave XP to '+s.team[i].id);
 }
 assert.deepEqual(s.inventory,before.inventory);
 report.defeat={wins:s.wins,losses:s.losses,xpUnchanged:true};
});
test('T21 level caps apply to every participant, Mewtwo tester is untouched',()=>{
 const s=initial();const cap=levels.currentLevelCap(0);
 assert.equal(cap,14);
 const maxXp=progress.totalExperienceForLevel(cap+1)-1;
 s.team[0].progression=progress.createPokemonProgression('bulbasaur',cap,{
  experience:maxXp});
 s.team[2].progression=progress.createPokemonProgression('squirtle',cap,{
  experience:maxXp});
 s.team[3].progression=progress.createPokemonProgression('caterpie',cap,{
  experience:maxXp});
 const before=s.team.map(m=>m.progression.experience);
 const result=core.awardSharedTeamExperience(s,999999,{kind:'trainer'});
 for(const i of [0,2,3]){
  assert.equal(result.gains[i].reward,0,'Cap must block XP entirely '+i);
  assert.equal(s.team[i].progression.level,cap,'Cap exceeded '+i);
  assert.equal(s.team[i].progression.experience,before[i]);
 }
 assert.equal(result.gains[1].reward,0);
 assert.equal(s.team[1].progression.experience,before[1]);
 const labels=s.team.map(m=>m.id);
 assert.deepEqual(s.team.map(m=>m.id),labels);
 report.caps={cap,maxXp,blocked:3,qaBlocked:true};
});
test('T21 wild victory XP also goes to entire ordinary squad, not a PC tester',()=>{
 const s=initial(),before=copy(s);
 const enc=core.startWildEncounter(s,()=>0);
 assert.equal(enc.ok,true);
 assert.ok(enc.encounter.id);
 const result=core.resolveWildBattle(s,true);
 assert.equal(result.won,true);
 assert.equal(result.sharedExp.filter(x=>!x.tester).length,3);
 for(const i of [0,2,3]){
  assert.ok(result.sharedExp.find(g=>g.index===i)?.reward>0,
   'Wild XP Share excluded member '+i);
  assert.ok(s.team[i].progression.experience>before.team[i].progression.experience,
   'No wild XP for member '+i);
 }
 assert.equal(s.team[1].progression.experience,before.team[1].progression.experience);
 assert.equal(s.money,before.money,'Wild XP cannot grant Poké Dollars by default');
 assert.equal(s.stage,before.stage);
 assert.equal(s.trainer,before.trainer);
 assert.equal(s.pendingWild,null);
 assert.deepEqual(s.inventory,before.inventory);
 assert.equal(s.wins,before.wins+1);
 report.wild=result.sharedExp;
 const raw=db.get(core.SAVE_KEY),save=core.readCampaign();
 assert.equal(db.get(core.SAVE_KEY),raw,'Loading earned XP cannot rewrite save');
 assert.deepEqual(save,s);
});
test('T21 preserve all source evidence and report real scope',()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 fs.writeFileSync('test-evidence/t21-team-xp-and-level-cap.json',
  JSON.stringify(report,null,2));
 console.log('T21 BUILT PHASER PARTY XP PASS',JSON.stringify({
  trainerRecipients:report.trainer.length,wildRecipients:report.wild.length,
  capped:report.caps.blocked,qaExcluded:true,defeatNoXP:report.defeat.xpUnchanged
 }));
});
