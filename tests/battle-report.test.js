import test from 'node:test';
import assert from 'node:assert/strict';
import {makeBattleReport,showBattleReport} from '../tools/pokearena/torre2-battle-report.js';
const mon=(id,uid,level=5)=>({id,uid,progression:{level}});
const state=(extras={})=>({
 team:[mon('bulbasaur','one'),mon('mewtwo','test',50)],
 money:1400,wins:0,losses:0,badges:[],leagueHonors:[],gymTMClaims:[],
 ...extras
});
test('battle report uses real before/after rewards and is read-only',()=>{
 const before=state(),after=state({money:2600,wins:1,badges:['Rocha'],
  gymTMClaims:['tm-rock-tomb'],team:[mon('ivysaur','one',16),mon('mewtwo','test',50)]});
 const original=JSON.stringify(after);
 const summary={won:true,message:'Vitória!',sharedExp:[
  {uid:'one',reward:287,index:0},{uid:'test',reward:0,tester:true,index:1}
 ]};
 const report=makeBattleReport(before,after,summary,{
  tmNames:{'tm-rock-tomb':'Rock Tomb'},
  listMoves:m=>m.id==='ivysaur'?[{nombre:'Vine Whip'},{nombre:'Razor Leaf'}]:
   [{nombre:'Vine Whip'}]});
 assert.equal(report.title,'VITÓRIA!');
 assert.equal(report.money,1200);
 assert.equal(report.team[0].experience,287);
 assert.equal(report.team[1].tester,true);
 assert.deepEqual(report.evolutions,[{from:'bulbasaur',to:'ivysaur'}]);
 assert.deepEqual(report.moves,[{id:'ivysaur',name:'Razor Leaf'}]);
 assert.deepEqual(report.badges,['Rocha']);
 assert.deepEqual(report.tms,['Rock Tomb']);
 assert.equal(JSON.stringify(after),original,'Displaying results must not grant rewards again');
});
test('loss has no fictitious XP, money or badges',()=>{
 const report=makeBattleReport(state(),state({losses:1}),{won:false,message:'Derrota'});
 assert.equal(report.won,false);assert.equal(report.money,0);
 assert.deepEqual(report.badges,[]);assert.equal(report.team[0].experience,0);
 assert.deepEqual(report.moves,[]);
});
test('rematch rewards use real shared experience but no duplicate badge',()=>{
 const after=state({money:1520,wins:1});
 const report=makeBattleReport(state(),after,{ok:true,won:true,
  shared:{gains:[{uid:'one',reward:99,index:0}]}},{kind:'rematch'});
 assert.equal(report.kind,'rematch');assert.equal(report.money,120);
 assert.equal(report.team[0].experience,99);
 assert.equal(report.badges.length,0);assert.equal(report.tms.length,0);
});
test('missing/stale battle results never show an invented outcome',()=>{
 assert.equal(makeBattleReport(state(),state(),{}),null);
 assert.equal(makeBattleReport(null,state(),{won:true}),null);
});
const obj=()=>{const o={handlers:{},destroyed:false,data:{}};
 for(const name of ['setDepth','setInteractive','setOrigin','fillStyle','fillRect',
 'fillRoundedRect','lineStyle','strokeRoundedRect'])o[name]=()=>o;
 o.setText=value=>{o.text=value;return o};
 o.setData=(k,v)=>{o.data[k]=v;return o};
 o.on=(k,fn)=>{o.handlers[k]=fn;return o};
 o.destroy=()=>{o.destroyed=true};
 return o};
test('native overlay blocks underlying actions and dismissal destroys every object',()=>{
 const created=[];const make=()=>{const o=obj();created.push(o);return o};
 const scene={add:{zone:make,graphics:make,text:make},
  events:{once(){}}
 };
 const result=showBattleReport(scene,makeBattleReport(state(),state(),{won:false}));
 assert.equal(result.blocker.data['torre2-report-blocker'],true);
 assert.equal(result.button.data['torre2-report-continue'],true);
 assert.ok(created.length>9);
 result.button.handlers.pointerdown(null,null,null,{stopPropagation(){}});
 assert.ok(created.every(x=>x.destroyed),'No orphaned hit zones or graphics');
 result.dismiss();
});
