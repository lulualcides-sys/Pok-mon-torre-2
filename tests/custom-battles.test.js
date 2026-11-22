// Owner 2026-11-22 (README 6 and 11): custom battles and custom challenge series.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {defaultRules,cleanRules,cycleRule,ruleLabel,eligibleIndices,playerLevelFor,buildOpponents,seriesReward,
 startSeries,resolveCustomResult,customState,EXCLUDED} from '../tools/pokearena/torre2-custom-battles.js';
const types={charmander:['FIRE'],squirtle:['WATER'],pidgey:['NORMAL','FLYING'],vulpix:['FIRE'],growlithe:['FIRE'],ponyta:['FIRE'],oddish:['GRASS','POISON'],moltres:['FIRE','FLYING']};
const typesOf=id=>types[id]||[];
const pool=Object.keys(types).map(id=>({id,types:types[id]}));

test('rules: defaults, cycling both ways and labels',()=>{
 assert.deepEqual(defaultRules(),{level:null,type:null,size:3,difficulty:'normal',series:3});
 assert.equal(cycleRule(defaultRules(),'level',1).level,10);
 assert.equal(cycleRule(defaultRules(),'level',-1).level,50);
 assert.equal(cycleRule(defaultRules(),'type',1).type,'NORMAL');
 assert.equal(cycleRule({size:3},'size',1).size,1);
 assert.equal(ruleLabel({type:'FIRE'},'type'),'Fogo');assert.equal(ruleLabel({level:20},'level'),'Até Nv 20');
 assert.deepEqual(cleanRules({level:7,type:'X',size:9,difficulty:'?',series:4}),defaultRules());
});
test('eligibility: alive and of the chosen type; level cap only lowers',()=>{
 const team=[{id:'charmander',hp:50},{id:'squirtle',hp:100},{id:'vulpix',hp:0},{id:'growlithe'}];
 assert.deepEqual(eligibleIndices(team,{type:'FIRE'},typesOf),[0,3]);
 assert.deepEqual(eligibleIndices(team,{},typesOf),[0,1,3]);
 assert.equal(playerLevelFor(35,{level:20}),20);assert.equal(playerLevelFor(12,{level:20}),12);assert.equal(playerLevelFor(40,{}),40);
});
test('opponents: allowed type, no legendaries, level from difficulty and cap',()=>{
 let i=0;const rnd=()=>[0,.3,.6,.9][i++%4];
 const foes=buildOpponents({type:'FIRE',size:3,difficulty:'dificil',level:20},pool,[18,20],rnd);
 assert.equal(foes.length,3);
 for(const f of foes){assert.ok(typesOf(f.id).includes('FIRE'));assert.ok(!EXCLUDED.includes(f.id));assert.equal(f.level,20,'capped')}
 assert.equal(new Set(foes.map(f=>f.id)).size,3,'different species when possible');
 assert.equal(buildOpponents({difficulty:'facil',size:1},pool,[20],()=>0)[0].level,17);
 assert.deepEqual(buildOpponents({type:'DRAGON'},pool,[10]),[]);
});
test('series: HP carries inside the run, win pays once, loss ends it',()=>{
 let s=startSeries({money:100,inventory:{}},{series:3,difficulty:'normal'});
 assert.equal(customState(s).run.fight,1);
 let r=resolveCustomResult(s,'series',true,{a:60});assert.equal(r.done,false);assert.equal(r.state.custom.run.hp.a,60);
 r=resolveCustomResult(r.state,'series',true,{a:30});assert.equal(r.state.custom.run.fight,3);
 r=resolveCustomResult(r.state,'series',true,{a:10});assert.ok(r.done);assert.ok(r.reward.money>0);
 assert.equal(r.state.money,100+seriesReward({series:3,difficulty:'normal'}).money);assert.equal(r.state.custom.run,null);
 assert.equal(r.state.custom.seriesWon,1);
 const lost=resolveCustomResult(startSeries({money:5},{series:5}),'series',false,{});
 assert.ok(lost.done);assert.equal(lost.state.money,5);assert.equal(lost.state.custom.run,null);
 const single=resolveCustomResult({},'single',true);assert.equal(single.state.custom.wins,1);assert.equal(single.reward,null);
 assert.ok(seriesReward({series:10,difficulty:'dificil',type:'FIRE'}).money>seriesReward({series:3,difficulty:'facil'}).money);
});
test('wiring: core start/resolve, scene screens, friendly battle never applies team HP',()=>{
 const read=f=>fs.readFileSync(new URL('../tools/pokearena/'+f,import.meta.url),'utf8');
 const core=read('torre2-campaign-core.js'),scene=read('torre2-campaign-scene.js');
 assert.match(core,/export function startCustomBattle/);assert.match(core,/export function resolveCustomBattle/);
 assert.match(scene,/customScreen\(state,mode='single'\)/);assert.match(scene,/torre2-challenges-custom/);
 const branch=scene.slice(scene.indexOf("marker.kind==='custom'"),scene.indexOf("marker.kind==='event3'"));
 assert.ok(branch.includes('resolveCustomBattle')&&!branch.includes('applyPartyBattleResult'),'campaign team HP untouched');
 assert.match(read('publish-alpha0762.mjs'),/torre2-custom-battles\.js','torre2\/custom-battles\.js'/);
});
