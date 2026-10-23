import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Direct imported sources live in the captured client at build time.
// In this pre-build suite, verify integration points; the staged Phaser suite
// tests actual execution with its resolved browser module graph.
const src=readFileSync(new URL('../tools/pokearena/torre2-campaign-core.js',import.meta.url),'utf8');
const hub=readFileSync(new URL('../tools/pokearena/torre2-battle-path.js',import.meta.url),'utf8');
const campaign=readFileSync(new URL('../tools/pokearena/torre2-campaign-scene.js',import.meta.url),'utf8');
test('trainer and wild wins call one whole-party EXP Share, not active-only',()=>{
 assert.ok(src.includes('export function awardSharedTeamExperience('));
 assert.equal((src.match(/const shared=awardSharedTeamExperience\(s,/g)||[]).length,2);
 assert.ok(src.includes("tester:member.id==='mewtwo'"));
 assert.ok(src.includes('for(let index=0;index<state.team.length;index++)'));
 assert.ok(src.includes("resolveEvolutionAfterBattle(progress,'victory')"));
 assert.ok(src.includes("return {won:true,message:s.lastMessage,reward,growth,sharedExp:shared.gains,"));
});
test('Brock stands in gym center and common trainers stay outside',()=>{
 assert.ok(hub.includes('const px=boss?414:('));
 assert.ok(hub.includes("['hiker',359],['youngster',469]"));
 assert.ok(hub.includes("const width=boss?82:60"));
});
test('reset requires deliberate confirmation before erasing the save',()=>{
 assert.ok(hub.includes("handlers.reset"));
 assert.ok(campaign.includes("confirmResetJourney(){"));
 assert.ok(campaign.includes("resetCampaign();"));
 assert.ok(campaign.includes("'SIM, REINICIAR'"));
 assert.ok(campaign.includes("if(!confirm)return;"));
});
