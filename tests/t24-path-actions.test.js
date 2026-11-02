import test from 'node:test';
import assert from 'node:assert/strict';
import {pathCheckpointAction} from '../tools/pokearena/torre2-path-actions.js';
import {battleReportPage,battleReportDetailLines} from '../tools/pokearena/torre2-battle-report.js';
test('on mandatory trainers 3 and 9, catch is optional and never the primary action',()=>{
 for(const index of [2,8,15,21]){
  const p=pathCheckpointAction(index,index,25);
  assert.deepEqual([p.primary,p.optionalCapture,p.active],['battle',true,true]);
 }
});
test('defeated optional-capture checkpoints preserve native VS Seeker rematch',()=>{
 for(const index of [2,8,15,21]){
  const p=pathCheckpointAction(index,index+1,25,true);
  assert.deepEqual([p.primary,p.optionalCapture,p.done],['rematch',true,true]);
  assert.equal(pathCheckpointAction(index,index+1,25,false).primary,'locked');
 }
});
test('leaders are always gym actions, never wild capture',()=>{
 for(const total of [13,15,17]){
  const p=pathCheckpointAction(total,total,total);
  assert.deepEqual([p.primary,p.boss,p.optionalCapture],['gym',true,false]);
 }
});
test('locked future trainers do not accidentally start battle or capture',()=>{
 const p=pathCheckpointAction(8,2,17);
 assert.equal(p.primary,'locked');assert.equal(p.available,false);
 assert.equal(p.optionalCapture,true);
 for(const bad of [[-1,0,13],[15,0,13],[2,14,13],[2,2,-1]])
  assert.equal(pathCheckpointAction(...bad),null);
});
test('report paging preserves all 7 unlocks, 2 badges and a TM with wrap and no mutation',()=>{
 const report={
  evolutions:[{from:'bulbasaur',to:'ivysaur'}],
  moves:Array.from({length:7},(_,i)=>({id:'ivysaur',name:'Move '+i})),
  badges:['Cascade','Thunder'],
  leagueHonors:['Champion'],
  tms:['Water Pulse']
 };
 const snapshot=JSON.stringify(report),lines=battleReportDetailLines(report);
 assert.equal(lines.length,12);
 const first=battleReportPage(lines);
 assert.equal(first.pages,6);
 assert.deepEqual(Array.from({length:first.pages},(_,i)=>battleReportPage(lines,i).items).flat(),lines);
 assert.deepEqual(battleReportPage(lines,6),first);
 assert.equal(battleReportPage(lines,-1).page,5);
 assert.equal(JSON.stringify(report),snapshot);
});
