import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

// Coverage for post-battle LEVEL EVOLUTIONS using the real captured,
// versioned client modules. These are prepared state fixtures, NOT natural
// route victories or visually played transitions. No runtime mutation.
const dir=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(dir,'version.json'),'utf8')).modules;
const load=p=>import(pathToFileURL(path.join(dir,version,p)).href);
const [{KANTO_LEVEL_EVOLUTIONS},{KANTO_LEVEL_CAPS},{createPokemonProgression,totalExperienceForLevel},core]=
 await Promise.all([
  load('torre2/frlg-learnsets.js'),
  load('torre2/kanto-levels.js'),
  load('torre2/progression.js'),
  load('torre2/campaign-core.js')
 ]);
const transitions=Object.entries(KANTO_LEVEL_EVOLUTIONS);
const sources=new Map();
for(const [to,[from]] of transitions)sources.set(from,(sources.get(from)||0)+1);
const branching=[...new Set(transitions.filter(([,v])=>sources.get(v[0])>1).map(([,v])=>v[0]))];
const linear=transitions.filter(([,v])=>sources.get(v[0])===1);
const storage=()=>{const m=new Map();return {
 getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),
 removeItem:k=>m.delete(k)
}};
const capture=(from,to,threshold,delta)=>{
 globalThis.localStorage=storage();
 const s=core.createCampaign('bulbasaur');
 const prog=createPokemonProgression(from,threshold-1);
 const exact=totalExperienceForLevel(threshold,prog.growth);
 prog.experience=exact+delta;
 const uid='t03-evo-'+to;
 const member={id:from,uid,progression:prog,hp:64,
  moves:['Tackle'],movePlanSpecies:from,nickname:'Preserve UID',
  tmMoves:['Protect'],status:null};
 s.team=[member];
 // Keep the permanent test Mewtwo unique, without placing it in combat.
 s.box=[{id:'mewtwo',uid:'t03-mewtwo',hp:100,
  progression:createPokemonProgression('mewtwo',50)}];
 s.stage=KANTO_LEVEL_CAPS.findIndex(cap=>cap>=threshold);
 if(s.stage<0)throw Error(to+': evolution threshold exceeds the 13-stage Kanto cap');
 s.trainer=0;
 core.saveCampaign(s);
 const initial=core.readCampaign();
 assert.equal(initial.team[0].id,from,to+': prebattle species mismatch');
 assert.equal(initial.team[0].uid,uid,to+': prebattle UID missing');
 return {state:initial,uid,exact};
};
test('T03 evolution table has broad nonbranching Kanto coverage',()=>{
 assert.equal(new Set(transitions.map(([to])=>to)).size,transitions.length);
 assert.ok(linear.length>=60,'Expected >60 level-boundary evolution transitions');
 assert.deepEqual(branching,['eevee'],'Branching families require a separate choice test');
});
test('T03: every nonbranching Kanto family evolves only on its level boundary, persists and remains idempotent',()=>{
 const report={preparedFixtures:true,levelEvolutionCount:0,premature:0,
  restored:0,repeatBlocked:0,bySpecies:[],branchingNotTested:branching};
 for(const [to,[from,threshold]] of linear){
  const context=to+' ('+from+' Lv'+threshold+')';
  // Before the official threshold: trainer defeat cannot evolve a creature
  // even if the EXP bar is 1 short. No forced victory or XP reward.
  let {state:s,uid,exact}=capture(from,to,threshold,-1);
  const defeat=core.resolveBattle(s,false);
  assert.equal(defeat.won,false,context+': fixture defeat was not registered');
  const before=core.readCampaign();
  assert.equal(before.team[0].id,from,context+': premature evolution after defeat');
  assert.equal(before.team[0].progression.experience,exact-1,
   context+': defeat gave illegitimate EXP');
  report.premature++;
  // Prepared with 1 experience point short, but use the normal campaign
  // resolver and its real reward formula to cross the level threshold.
  const beforeWins=before.wins;
  const won=core.resolveBattle(before,true);
  assert.equal(won.won,true,context+': normal resolver victory failed');
  const record=before.team.find(m=>m.uid===uid);
  assert.ok(record,context+': UID lost');
  assert.equal(record.id,to,context+': wrong final form');
  assert.equal(record.progression.species,to,context+': progression still old form');
  assert.ok(record.progression.level>=threshold,context+': evolved before allowed level');
  assert.equal(record.hp,100,context+': active fighter postbattle recovery changed');
  assert.equal(record.uid,uid,context+': evolution replaced member identity');
  assert.equal(record.nickname,'Preserve UID',context+': nickname erased');
  assert.deepEqual(record.tmMoves,['Protect'],context+': learned TM state lost');
  assert.deepEqual(record.moves,[],context+': obsolete attack-slot cache not invalidated');
  assert.equal(record.movePlanSpecies,undefined,context+': obsolete kit marker survived');
  assert.equal(before.wins,beforeWins+1,context+': no trainer victory recorded');
  assert.ok(won.evolutions.some(e=>e.from===from&&e.to===to),
   context+': missing postbattle evolution event');
  const raw=localStorage.getItem(core.SAVE_KEY);
  const reload=core.readCampaign();
  assert.equal(localStorage.getItem(core.SAVE_KEY),raw,context+': valid save rewritten');
  assert.equal(reload.team.filter(m=>m.uid===uid).length,1,context+': duplicated on reload');
  assert.equal(reload.team[0].id,to,context+': species reverted on reload');
  assert.equal(reload.team[0].progression.species,to,context+': progression reverted');
  assert.equal(reload.team[0].progression.level,record.progression.level);
  assert.ok(reload.box.some(m=>m.id==='mewtwo'),context+': tester lost from PC');
  // A later normal EXP event must not "evolve" the same stage a second time.
  const second=core.awardSharedTeamExperience(reload,1);
  assert.equal(second.evolutions.some(e=>e.from===from&&e.to===to),false,
   context+': same evolution replayed');
  assert.equal(reload.team[0].id,to,context+': species changed on idempotency check');
  report.levelEvolutionCount++;report.restored++;report.repeatBlocked++;
  report.bySpecies.push({from,to,level:record.progression.level,
   stage:before.stage});
 }
 fs.mkdirSync('test-evidence',{recursive:true});
 fs.writeFileSync('test-evidence/t03-kanto-evolution-boundaries.json',
  JSON.stringify(report,null,2));
 console.log('PASS T03 PREPARED LEVEL EVOLUTION BOUNDARIES',JSON.stringify({
  count:report.levelEvolutionCount,premature:report.premature,
  restored:report.restored,repeatBlocked:report.repeatBlocked,
  branchesExcluded:branching
 }));
});
