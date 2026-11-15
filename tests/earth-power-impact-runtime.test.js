import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../tools/pokearena/batch24/runtime.js',import.meta.url),'utf8');
const start=source.indexOf('function earth(l,h,extra){');
const end=source.indexOf('export const BATCH24_FORMS=',start);
assert.ok(start>0&&end>start,'Earth Power implementation must exist');

function simulate({contact=true,damaging=false,ko=false}={}){
 const impacts=[],strikes=[];
 const g={clear(){}};
 const target={x:40,y:0,alto:36,ko};
 const env={
  Math,
  start:()=>({x:0,y:0,c:1,s:0}),
  PALETTES:{rock:['a','b','c','d']},
  lifecycle:(_actor,render)=>dt=>render(dt,g),
  stamp(){},pixel(){},drawMove(){},
  swept:(_a,_b,r)=>contact&&!r.ko?{x:40,y:0}:null,
  strike:()=>{strikes.push(1);return {landed:damaging,damage:damaging?10:0};},
  impact:(_g,x,y)=>impacts.push({x,y})
 };
 const earth=vm.runInNewContext(source.slice(start,end)+'\nearth',env);
 const actor={x:0,y:0,ax:40,ay:0,rival:target};
 const run=earth(actor,{palette:'rock',alcance:80,style:'earth'});
 run(.36);run(.08);run(.08);
 return {impacts,strikes};
}
test('a miss or dodge cannot emit a false impact',()=>{
 const miss=simulate({contact:false});
 assert.equal(miss.strikes.length,0);
 assert.equal(miss.impacts.length,0);
});
test('accuracy miss and immunity cause no impact even with geometric contact',()=>{
 const immune=simulate({contact:true,damaging:false});
 assert.equal(immune.strikes.length,1);
 assert.equal(immune.impacts.length,0);
});
test('KO target is excluded from attack impact',()=>{
 const dead=simulate({contact:true,damaging:true,ko:true});
 assert.equal(dead.strikes.length,0);
 assert.equal(dead.impacts.length,0);
});
test('confirmed hit damages once and renders contact impact',()=>{
 const hit=simulate({contact:true,damaging:true});
 assert.equal(hit.strikes.length,1);
 assert.ok(hit.impacts.length>0);
 assert.deepEqual(hit.impacts.map(i=>i.x),Array(hit.impacts.length).fill(40));
});
