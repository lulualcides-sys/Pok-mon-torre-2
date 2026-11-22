// Owner 2026-11-22 (README items 7, 2, 4): battle weather by chance,
// Eventos 3x3 and the Museum.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {battleWeatherRoll,TYPE_WEATHER,WEATHER_CHANCE,EVENTS_3X3,eventStatus,eventTeam,playerTrio,resolveEventResult,eventToken}
 from '../tools/pokearena/torre2-battle-events.js';
const read=f=>fs.readFileSync(new URL('../tools/pokearena/'+f,import.meta.url),'utf8');

test('weather by chance: leader type, route weather, low rates',()=>{
 assert.equal(battleWeatherRoll({leader:true,stageType:'FIRE'},()=>.1),'sun');
 assert.equal(battleWeatherRoll({leader:true,stageType:'WATER'},()=>.1),'rain');
 assert.equal(battleWeatherRoll({leader:true,stageType:'ROCK'},()=>.1),'sand');
 assert.equal(battleWeatherRoll({leader:true,stageType:'ICE'},()=>.1),'hail');
 assert.equal(battleWeatherRoll({leader:true,stageType:'FIRE'},()=>.5),'none','most battles have no weather');
 assert.equal(battleWeatherRoll({leader:true,stageType:'PSYCHIC'},()=>.0),'none','no weather type');
 assert.equal(battleWeatherRoll({stageType:'FIRE',routeSky:'rain'},()=>.05),'rain','trainers follow the route');
 assert.equal(battleWeatherRoll({stageType:'FIRE',routeSky:'clear'},()=>.0),'none');
 assert.equal(battleWeatherRoll({wild:true,routeSky:'sand'},()=>.07),'none','wild chance is lower');
 assert.ok(WEATHER_CHANCE.leader<=.2&&WEATHER_CHANCE.trainer<=.1);
 // Over many battles the leader weather stays rare.
 let n=0;for(let i=0;i<1000;i++)if(battleWeatherRoll({leader:true,stageType:'FIRE'},()=>i/1000)!=='none')n++;
 assert.ok(n>=150&&n<=200,String(n));
 assert.deepEqual(Object.keys(TYPE_WEATHER).sort(),['ELECTRIC','FIRE','GRASS','GROUND','ICE','ROCK','WATER']);
});
test('fifteen 3x3 events: unlocks, teams of three, first-win reward only once',()=>{
 assert.equal(EVENTS_3X3.length,15);
 assert.equal(new Set(EVENTS_3X3.map(e=>e.id)).size,15);
 for(const ev of EVENTS_3X3){assert.equal(ev.team.length,3);assert.ok(ev.line.length>20);assert.ok(ev.reward.money>0)}
 const s0={badges:[],team:[]};
 assert.equal(eventStatus(s0,EVENTS_3X3[0]).state,'locked');
 assert.equal(eventStatus({badges:['b']},EVENTS_3X3[0]).state,'open');
 assert.equal(eventStatus({badges:Array(8).fill('b')},EVENTS_3X3[5]).state,'locked','last one after the League');
 assert.equal(eventStatus({badges:[],champion:true},EVENTS_3X3[5]).state,'open');
 assert.deepEqual(eventTeam(EVENTS_3X3[0],20).map(m=>m.level),[18,20,22]);
 assert.deepEqual(playerTrio([{hp:0},{hp:50},{hp:100},{hp:10},{hp:90}]).map(x=>x.i),[1,2,3]);
 let s={badges:['b'],money:100,inventory:{greatball:0},wins:3,losses:1};
 const r1=resolveEventResult(s,'e1',true);assert.ok(r1.first);assert.equal(r1.state.money,1600);assert.equal(r1.state.inventory.greatball,3);
 const r2=resolveEventResult(r1.state,'e1',true);assert.ok(!r2.first);assert.equal(r2.state.money,1600);
 assert.equal(eventStatus(r2.state,EVENTS_3X3[0]).state,'won');
 const lost=resolveEventResult(s,'e2',false);assert.equal(lost.state.money,100);assert.equal(lost.state.events3x3.won.length,0);
 assert.match(eventToken(s,'e1'),/^event3-e1-3-1$/);
});
test('campaign wiring: weather in the battle payload, events and museum screens',()=>{
 const scene=read('torre2-campaign-scene.js'),core=read('torre2-campaign-core.js'),cards=read('torre2-trainer-cards.js');
 assert.match(scene,/match\.torre2\.weather=battleWeatherRoll\(/);
 assert.match(scene,/marker\.kind==='event3'/);
 assert.match(scene,/kind:'event3',token:r\.token/);
 assert.match(scene,/party\.friend=r\.trio\.map\(i=>party\.friend\[i\]\)/,'exactly the three chosen Pokémon');
 assert.match(scene,/museumScreen\(state\)\{/);
 assert.match(scene,/'MUSEU',\(\)=>this\.museumScreen\(state\)/);
 assert.match(cards,/\['DESAFIOS',handlers\.tower,'badges'\]/);
 const fn=core.slice(core.indexOf('export function resolveEventBattle'),core.indexOf('export function startWildBattle'));
 assert.ok(!/next\.trainer\s*[+=]/.test(fn)&&!/next\.stage\s*[+=]/.test(fn),'events never move the ladder');
});

test('3x3 events: 5% chance to earn one of the challenger\'s Pokémon',async()=>{
 const {eventPokemonRoll,EVENT_POKEMON_CHANCE}=await import('../tools/pokearena/torre2-battle-events.js');
 assert.equal(EVENT_POKEMON_CHANCE,.05);
 const ev=EVENTS_3X3.find(e=>e.id==='e8');
 const seq=v=>{let i=0;return()=>v[i++]};
 assert.equal(eventPokemonRoll(ev,seq([.04,.99])),'starmie');
 assert.equal(eventPokemonRoll(ev,seq([.04,0])),'poliwhirl');
 assert.equal(eventPokemonRoll(ev,seq([.05,0])),null);
 let n=0;for(let i=0;i<2000;i++)if(eventPokemonRoll(ev,Math.random))n++;
 assert.ok(n>40&&n<170,String(n));
 const core=fs.readFileSync(new URL('../tools/pokearena/torre2-campaign-core.js',import.meta.url),'utf8');
 assert.match(core,/eventPokemonRoll\(EVENTS_3X3\.find/);assert.match(core,/eventSpeciesOk\(species\)/);
});
