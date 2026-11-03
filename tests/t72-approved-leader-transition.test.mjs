import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {KANTO_BADGES,approvedMapEntryAllowed} from
 '../tools/pokearena/torre2-approved-progression-gates.js';

const scene=readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
const core=readFileSync('tools/pokearena/torre2-campaign-core.js','utf8');
const valid=(stage,badges,champion=false)=>({stage,badges:[...badges],champion});

test('T72: reward must be durably committed before entering next chapter',()=>{
 const commit=scene.indexOf('battleOutcomeCommitted=true;');
 const report=scene.indexOf('const panel=showBattleReport(this,battleReport);');
 const restart=scene.indexOf('if(battleOutcomeCommitted&&fresh.stage!==preBattleStage){');
 assert.ok(commit>0&&report>commit&&restart>report,
  'no stage reload before the native resolver and the acknowledged report');
 const resume=scene.slice(restart,restart+190);
 assert.ok(resume.includes('this.__torre2ApprovedReturn=null;'),
  'a prior gym must not survive a stage transition');
 assert.ok(resume.includes('this.scene.restart({});'),
  'clear the old finished marker so no badges/EXP are awarded twice');
 assert.ok(scene.includes('if(this.promptPendingEeveeEvolution(fresh))return;'),
  'the post-battle Eevee choice must take priority');
});

test('T72: stage preload is selected using the freshly persisted chapter',()=>{
 assert.ok(scene.includes('const state=readCampaign();'));
 assert.ok(scene.includes('const stage=state?.stage??0;'));
 assert.ok(scene.includes('const openingMap=restored||APPROVED_STAGE_MAPS[stage];'));
 assert.ok(scene.includes('if(openingMap)preloadApprovedMap(this,openingMap);'));
 assert.ok(scene.includes("'route-3','cerulean-city','vermilion-city'"));
});

test('T72: only the native leader resolver grants real badges or league honors',()=>{
 assert.ok(core.includes('if(opponent.leader){'));
 assert.ok(core.includes('const awards=next.stage<GYMS.length?next.badges:(next.leagueHonors??=[]);'));
 assert.ok(core.includes('if(!awards.includes(STAGES[next.stage].badge))awards.push(STAGES[next.stage].badge);'));
 assert.ok(core.includes('const tm=grantGymTM(next,next.stage);'));
 assert.ok(core.includes('next.stage++;next.trainer=0;'));
 assert.ok(core.includes('if(next.stage>=STAGES.length)next.champion=true;'));
 assert.ok(core.includes('saveCampaign(next);'));
 assert.equal(KANTO_BADGES.length,8);
});

test('T72: stage-eight art still requires all eight real badges',()=>{
 const seven=valid(8,KANTO_BADGES.slice(0,7));
 const eight=valid(8,KANTO_BADGES);
 assert.equal(approvedMapEntryAllowed(seven,'routes-22-23'),false);
 assert.equal(approvedMapEntryAllowed(eight,'routes-22-23'),true);
 assert.equal(approvedMapEntryAllowed(eight,'hall-of-fame'),false);
 assert.equal(approvedMapEntryAllowed(valid(13,KANTO_BADGES,true),'hall-of-fame'),true);
});
