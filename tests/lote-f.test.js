// Owner 2026-11-22: day/night (18), Rocket events (19), trainer reactions (24),
// favorite Pokémon (26). Rare forms (28) were dropped by the owner.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {timeOfDay,timeWeight,filterByTime,NIGHT_ONLY,favoriteMember,toggleFavorite,ARENA_SHADE} from '../tools/pokearena/torre2-world.js';
import {ROCKET_EVENTS,ALL_EVENTS,EVENTS_3X3,eventStatus,resolveEventResult} from '../tools/pokearena/torre2-battle-events.js';
import {EVENT_ITEMS,HELD_ITEMS} from '../tools/pokearena/torre2-individuality.js';
const read=f=>fs.readFileSync(new URL('../tools/pokearena/'+f,import.meta.url),'utf8');
const at=h=>{const d=new Date(2026,10,22,h,0,0);return d};
test('day/night: phases from the clock, night-only species, never an empty area',()=>{
 assert.equal(timeOfDay(at(10)),'dia');assert.equal(timeOfDay(at(18)),'entardecer');assert.equal(timeOfDay(at(23)),'noite');assert.equal(timeOfDay(at(3)),'noite');
 assert.equal(timeWeight('gastly','dia'),0);assert.equal(timeWeight('gastly','noite'),1);assert.equal(timeWeight('zubat','noite'),2);
 assert.deepEqual(filterByTime(['gastly','haunter'],'dia'),[1,1],'area with only night species still works by day');
 assert.equal(ARENA_SHADE.dia,null);assert.ok(ARENA_SHADE.noite.alpha>ARENA_SHADE.entardecer.alpha);
 assert.ok(NIGHT_ONLY.includes('gastly'));
});
test('rare forms were dropped by the owner (nothing left in the game)',()=>{
 for(const f of ['torre2-world.js','torre2-campaign-core.js','torre2-party-battle.js','torre2-campaign-scene.js'])
  assert.ok(!/RareForm|RARE_FORM|applyRareForm/.test(read(f)),f);
});
test('favorite Pokémon: toggle and shown beside the trainer on the card',()=>{
 let s={team:[{uid:'a',id:'pikachu'}],box:[]};
 s=toggleFavorite(s,'a');assert.equal(favoriteMember(s).id,'pikachu');s=toggleFavorite(s,'a');assert.equal(favoriteMember(s),null);
 const scene=read('torre2-campaign-scene.js');assert.match(scene,/torre2-summary-favorite/);assert.match(scene,/torre2-card-favorite/);
});
test('Team Rocket events: stories, 3x3, unlocks, rewards and held items',()=>{
 assert.equal(ROCKET_EVENTS.length,5);assert.equal(ALL_EVENTS.length,EVENTS_3X3.length+5);
 for(const ev of ROCKET_EVENTS){assert.ok(ev.rocket&&ev.team.length===3&&ev.story.length>=2&&ev.place);assert.ok(HELD_ITEMS[EVENT_ITEMS[ev.id]],ev.id)}
 assert.equal(eventStatus({badges:[]},ROCKET_EVENTS[0]).state,'locked');assert.equal(eventStatus({badges:['a']},ROCKET_EVENTS[0]).state,'open');
 assert.equal(eventStatus({badges:Array(8).fill('b')},ROCKET_EVENTS[4]).state,'locked','Giovanni after the League');
 const r=resolveEventResult({badges:['a'],money:0,inventory:{}},'k1',true);assert.ok(r.first);assert.match(r.message,/Equipe Rocket fugiu/);
 const scene=read('torre2-campaign-scene.js');assert.match(scene,/torre2-challenges-rocket/);assert.match(scene,/ev\.story\|\|\[\]/);
});
test('trainer reactions at the end of a battle; night shade and forms in battle',()=>{
 const at=read('torre2-arena-trainers.js');assert.match(at,/scene\.fase!=='fin'/);assert.match(read('torre2-arena-follow.js'),/'Isso aí!'/);assert.match(at,/FRAMES\.back/);
 const pb=read('torre2-party-battle.js');assert.match(pb,/ARENA_SHADE\[timeOfDay\(\)\]/);
});
