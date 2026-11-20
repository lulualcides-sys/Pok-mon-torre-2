// Owner list 2026-11-20, item 14: Torre de desafios.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {towerStatus,towerFloor,towerReward,startTowerRun,towerCheckHeal,resolveTowerFloor,towerToken,endTowerRun,teamHpMark,TOWER_REWARD_EVERY}
 from '../tools/pokearena/torre2-challenge-tower.js';

const pool=['pidgey','rattata','geodude','onix','psyduck','pikachu','mewtwo','lugia'];
const base=(o={})=>({badges:['b1'],champion:false,money:100,inventory:{greatball:0,ultraball:0},team:[{id:'a',hp:80},{id:'b',hp:50}],...o});

test('unlock after the 1st badge (or champion)',()=>{
 assert.equal(towerStatus({badges:[]}).state,'locked');
 assert.equal(towerStatus(base()).state,'open');
 assert.equal(towerStatus({badges:[],champion:true}).state,'open');
});
test('floors: deterministic, no legendaries, bigger teams and levels going up',()=>{
 assert.deepEqual(towerFloor(42,3,pool,30),towerFloor(42,3,pool,30));
 for(let f=1;f<=30;f++){const fl=towerFloor(42,f,pool,30);
  assert.ok(fl.team.every(m=>!['mewtwo','lugia'].includes(m.id)));
  assert.equal(new Set(fl.team.map(m=>m.id)).size,fl.team.length);
  assert.ok(fl.team.every(m=>m.level>=5&&m.level<=35));
  assert.equal(fl.boss,f%TOWER_REWARD_EVERY===0)}
 assert.equal(towerFloor(1,1,pool,30).team.length,1);
 assert.equal(towerFloor(1,12,pool,30).team.length,3);
 assert.ok(towerFloor(1,20,pool,30).team[0].level>towerFloor(1,1,pool,30).team[0].level);
});
test('rewards only every 5 floors, growing each cycle',()=>{
 assert.equal(towerReward(4),null);
 assert.deepEqual(towerReward(5),{money:1500,items:{greatball:3}});
 assert.ok(towerReward(30).money>towerReward(5).money);
});
test('run: win floors, reward applied, heal ends the run, loss keeps best',()=>{
 let s=startTowerRun(base(),7).state;
 assert.equal(s.tower.floor,1);assert.equal(s.tower.hpMark,teamHpMark(s));
 for(let f=1;f<=5;f++){const r=resolveTowerFloor(s,towerToken(s),true);assert.ok(r.ok);s=r.state}
 assert.equal(s.tower.floor,6);assert.equal(s.tower.best,5);
 assert.equal(s.money,1600);assert.equal(s.inventory.greatball,3);
 // Old token is ignored.
 assert.equal(resolveTowerFloor(s,'tower-7-1',true).ok,false);
 // Damage between floors is fine; healing is not.
 assert.ok(towerCheckHeal({...s,team:[{id:'a',hp:10},{id:'b',hp:50}]}).ok);
 const healed=towerCheckHeal({...s,team:[{id:'a',hp:100},{id:'b',hp:100}]});
 assert.equal(healed.ok,false);assert.equal(healed.state.tower.active,false);assert.equal(healed.state.tower.best,5);
 const lost=resolveTowerFloor(s,towerToken(s),false).state;
 assert.equal(lost.tower.active,false);assert.equal(lost.tower.best,5);
 const left=endTowerRun(s);assert.equal(left.tower.best,5);
});
test('campaign wiring: separate battle, ladder untouched',()=>{
 const core=fs.readFileSync(new URL('../tools/pokearena/torre2-campaign-core.js',import.meta.url),'utf8');
 const fn=core.slice(core.indexOf('export function resolveTowerBattle'),core.indexOf('export function startWildBattle'));
 assert.ok(!/next\.trainer\s*[+=]/.test(fn)&&!/next\.stage\s*[+=]/.test(fn),'tower must not move stage/trainer');
 const scene=fs.readFileSync(new URL('../tools/pokearena/torre2-campaign-scene.js',import.meta.url),'utf8');
 assert.match(scene,/marker\.kind==='tower'/);assert.match(scene,/kind:'tower',token:r\.token/);
 const cards=fs.readFileSync(new URL('../tools/pokearena/torre2-trainer-cards.js',import.meta.url),'utf8');
 assert.match(cards,/\['TORRE',handlers\.tower,'badges'\]/);
});
