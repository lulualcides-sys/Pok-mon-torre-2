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
test('rare missions: 3% once per new map, one at a time, much harder and much better',async()=>{
 const {RARE_QUESTS,RARE_CHANCE,rollRareQuest,ALL_QUESTS,questState:qs,claimQuest:claim,acceptQuest:accept,objectiveText:ot}=await import('../tools/pokearena/torre2-npc-quests.js');
 assert.equal(RARE_CHANCE,.03);assert.ok(RARE_QUESTS.length>=12);
 for(const q of RARE_QUESTS){assert.ok(ot(q).length>8,q.id);assert.ok(q.reward.items?.masterball||q.reward.money>=40000,q.id+' much better prize')}
 // first look only records the current map
 let r=rollRareQuest({stage:2,wins:10,npcQuests:{}},()=>0);assert.equal(r.appeared,null);assert.equal(r.state.npcQuests.rareStage,2);
 // victories on the same map never roll
 const same=rollRareQuest({...r.state,wins:99},()=>0);assert.equal(same.appeared,null);assert.equal(same.state,same.state);
 // a new map rolls once: fail, then the next map succeeds
 r=rollRareQuest({...r.state,stage:3},()=>.5);assert.equal(r.appeared,null);assert.equal(r.state.npcQuests.rareStage,3);
 r=rollRareQuest({...r.state,stage:4},()=>.01);assert.ok(r.appeared);
 const q=ALL_QUESTS.find(x=>x.id===r.appeared);assert.equal(qs(r.state,q,{}),'available');
 // while it is open no second one appears
 assert.equal(rollRareQuest({...r.state,stage:6},()=>0).appeared,null);
 // statistics: about 3% per map
 let n=0;for(let i=0;i<20000;i++){if(rollRareQuest({stage:5,npcQuests:{rareStage:4}},Math.random).appeared)n++}
 assert.ok(n>440&&n<760,String(n));
 // deliver: Master Ball arrives
 const shinyQ=RARE_QUESTS.find(x=>x.id==='r06');
 let s={stage:3,wins:1,dexShinyCaught:['a','b','c'],team:[],box:[],inventory:{},npcQuests:{rare:['r06'],rareStage:3}};
 s=accept(s,'r06');s=claim(s,'r06',{});assert.equal(s.inventory.masterball,2);assert.equal(qs(s,shinyQ,{}),'done');
});
