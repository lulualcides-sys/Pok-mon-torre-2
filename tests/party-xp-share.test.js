import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planBattlePathGeometry,rectsOverlap} from '../tools/pokearena/torre2-battle-path-geometry.js';

// Direct imported sources live in the captured client at build time.
// In this pre-build suite, verify integration points; the staged Phaser suite
// tests actual execution with its resolved browser module graph.
const src=readFileSync(new URL('../tools/pokearena/torre2-campaign-core.js',import.meta.url),'utf8');
const hub=readFileSync(new URL('../tools/pokearena/torre2-battle-path.js',import.meta.url),'utf8');
const campaign=readFileSync(new URL('../tools/pokearena/torre2-campaign-scene.js',import.meta.url),'utf8');
test('trainer and wild wins call one whole-party EXP Share, not active-only',()=>{
 assert.ok(src.includes('export function awardSharedTeamExperience('));
 assert.equal((src.match(/const shared=awardSharedTeamExperience\(next,/g)||[]).length,2,
  'Both trainer and wild rewards must use the staged campaign snapshot');
 assert.ok(src.includes("tester:member.id==='mewtwo'"));
 assert.ok(src.includes('for(let index=0;index<state.team.length;index++)'));
 assert.ok(src.includes("resolveEvolutionAfterBattle(progress,'victory',"),
  'Shared EXP should still evolve only AFTER battle, with Kanto branch callback');
 assert.ok(src.includes("gloom:'vileplume',poliwhirl:'poliwrath'"),
  'FireRed branching evolves to the Kanto forms without an inaccessible choice');
 assert.ok(src.includes("member.moves=[]"),
  'Stale unevolved move slots must reset on evolution');
 assert.ok(src.includes("return {won:true,message:next.lastMessage,reward,growth,sharedExp:shared.gains,"));
 assert.ok(src.includes('saveCampaign(next);')&&src.includes('Object.assign(state,next);'),
  'Commit battle rewards only after a successful checkpoint write');
});
test('Brock route portal remains separate from regular trainer hitboxes',()=>{
 const plan=planBattlePathGeometry({total:13,offset:0});
 const boss=plan.spots.find(p=>p.boss);
 assert.ok(boss,'the existing 13 trainers must lead to one boss portal');
 assert.equal(boss.global,13);
 assert.equal(boss.x,414);
 assert.equal(plan.spots.filter(p=>!p.boss).length,13);
 for(const trainer of plan.spots.filter(p=>!p.boss)){
  assert.equal(rectsOverlap(trainer.hitbox,boss.hitbox),false,
   'the gym portal must not steal a route trainer tap');
 }
 assert.ok(hub.includes('planBattlePathGeometry({total,offset,finished})'));
 assert.ok(hub.includes("if(checkpoint.primary==='gym')return handlers.gym();"),
  'boss checkpoint must open the separate gym interior');
});
test('reset requires deliberate confirmation before erasing the save',()=>{
 assert.ok(hub.includes("handlers.reset"));
 assert.ok(campaign.includes("confirmResetJourney(){"));
 assert.ok(campaign.includes("resetCampaign();"));
 assert.ok(campaign.includes("'SIM, REINICIAR'"));
 assert.ok(campaign.includes("if(!confirm)return;"));
});
