// Owner 2026-11-22: city missions (16), nicknames (25), battle speed (21), tutorial (35).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {QUESTS,objectiveText,questState,questProgress,acceptQuest,claimQuest,questSummary,questUnlocked} from '../tools/pokearena/torre2-npc-quests.js';
import {cleanNickname,setNickname,HELD_ITEMS} from '../tools/pokearena/torre2-individuality.js';
import {SPEEDS,nextSpeed,scaledDelta,readSpeed,saveSpeed,speedLabel} from '../tools/pokearena/torre2-battle-speed.js';
const read=f=>fs.readFileSync(new URL('../tools/pokearena/'+f,import.meta.url),'utf8');
const types={rattata:['NORMAL'],caterpie:['BUG'],weedle:['BUG','POISON'],squirtle:['WATER']};
const ctx={typesOf:id=>types[id]||[],starsOf:m=>m.stars||1,hasAbility:m=>!!m.ha,towerBest:s=>s.towerBest||0};
test('52 missions: unique ids, text, rewards that exist, unlocked by city',()=>{
 assert.ok(QUESTS.length>=50);assert.equal(new Set(QUESTS.map(q=>q.id)).size,QUESTS.length);
 for(const q of QUESTS){assert.ok(objectiveText(q).length>8,q.id);assert.ok(q.line.length>15,q.id);
  assert.ok(q.reward.money||q.reward.items||q.reward.held,q.id);if(q.reward.held)assert.ok(HELD_ITEMS[q.reward.held],q.id+' held')}
 assert.ok(questUnlocked({stage:0},QUESTS[0]));assert.ok(!questUnlocked({stage:0},QUESTS.find(q=>q.stage===3)));
 assert.ok(!questUnlocked({stage:8},QUESTS.find(q=>q.stage===9)));assert.ok(questUnlocked({stage:8,champion:true},QUESTS.find(q=>q.stage===9)));
});
test('accept → progress since accepting → deliver once with reward',()=>{
 let s={stage:0,wins:3,money:100,team:[{uid:'a',id:'rattata'}],box:[],inventory:{}};
 const q=QUESTS.find(x=>x.id==='q02');// capture 2 since accepting
 assert.equal(questState(s,q,ctx),'available');
 s=acceptQuest(s,'q02');assert.equal(questState(s,q,ctx),'active');assert.equal(acceptQuest(s,'q02'),null,'only once');
 s.team.push({uid:'b',id:'caterpie'});assert.equal(questProgress(s,q,ctx),1);
 s.box.push({uid:'c',id:'weedle'});assert.equal(questState(s,q,ctx),'ready');
 const done=claimQuest(s,'q02',ctx);assert.equal(done.inventory.pokeball,5);assert.equal(questState(done,q,ctx),'done');
 assert.equal(claimQuest(done,'q02',ctx),null,'reward once');
 const bug=QUESTS.find(x=>x.id==='q03');let t=acceptQuest(done,'q03');assert.equal(questProgress(t,bug,ctx),2);
 t=claimQuest(t,'q03',ctx);assert.equal(t.inventory.held.silverpowder,1,'held item reward');
 assert.equal(questSummary(t,ctx).done,2);
});
test('nicknames: cleaned, max 12, empty clears',()=>{
 assert.equal(cleanNickname('  Fogo<script>  '),'Fogoscript');assert.equal(cleanNickname('Chamazinha da Silva').length,12);
 let s={team:[{uid:'x',id:'charmander'}],box:[]};
 s=setNickname(s,'x','Faísca');assert.equal(s.team[0].nickname,'Faísca');
 s=setNickname(s,'x','');assert.equal(s.team[0].nickname,undefined);assert.equal(setNickname(s,'nope','a'),null);
});
test('battle speed: 1x/1.5x/2x, whole-clock scaling, remembered',()=>{
 assert.deepEqual([...SPEEDS],[1,1.5,2]);assert.equal(nextSpeed(2),1);assert.equal(speedLabel(1.5),'1,5x');
 assert.equal(scaledDelta(16,2),32);assert.equal(scaledDelta(500,2),200,'clamped');assert.equal(scaledDelta(16,9),16);
 const st={m:{},getItem(k){return this.m[k]??null},setItem(k,v){this.m[k]=v}};saveSpeed(1.5,st);assert.equal(readSpeed(st),1.5);
});
test('wiring: missions/tutorial in Mais, nickname in Summary and HUD, speed in battle',()=>{
 const cards=read('torre2-trainer-cards.js'),scene=read('torre2-campaign-scene.js'),pb=read('torre2-party-battle.js');
 assert.match(cards,/'MISSÕES DA CIDADE',handlers\.quests/);assert.match(cards,/'COMO JOGAR',handlers\.tutorial/);
 assert.match(scene,/questsScreen\(state\)\{/);assert.match(scene,/tutorialScreen\(state,page=0\)\{/);
 assert.match(scene,/torre2-summary-nickname/);assert.match(scene,/!navigator\.webdriver/,'tutorial never auto-opens under automation');
 assert.match(pb,/installBattleSpeed\(scene\)/);assert.match(pb,/pintarIdentidad/);assert.match(pb,/nickname:m\.nickname/);
 const pub=read('publish-alpha0762.mjs');
 for(const f of ['npc-quests','battle-speed'])assert.match(pub,new RegExp("torre2-"+f+"\\.js','torre2/"+f+"\\.js'"));
});
