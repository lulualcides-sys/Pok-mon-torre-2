import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../tools/pokearena/batch24/runtime.js',import.meta.url),'utf8');
const first=source.indexOf('function earth(l,h,extra){');
const last=source.indexOf('export const BATCH24_FORMS=',first);
assert.ok(first>0&&last>first,'Expected Earth Power runtime');
function simulate(targets){
 const strikes=[],impacts=[],g={clear(){}};
 const env={
  Math,
  start:()=>({x:0,y:0,c:1,s:0}), PALETTES:{ground:['a','b','c','d']},
  lifecycle:(_l,loop)=>dt=>loop(dt,g),stamp(){},pixel(){},drawMove(){},
  batch24AreaTargets:()=>targets,
  swept:(a,b,r)=>r.ko||r.contact===false?null:{x:r.x,y:r.y},
  strike:(_l,r)=>{strikes.push(r.id);return {landed:r.damaging===true,damage:r.damaging?8:0};},
  impact:(_g,x,y)=>impacts.push([x,y])
 };
 const earth=vm.runInNewContext(source.slice(first,last)+'\nearth',env);
 const actor={x:0,y:0,ax:40,ay:0,rival:targets[0]};
 const tick=earth(actor,{palette:'ground',alcance:80,style:'earth'});
 tick(.36);tick(.08);tick(.08);
 return {strikes,impacts};
}
test('AoE keeps all eligible native enemies, but paints only damaging contacts',()=>{
 const result=simulate([
  {id:'hit1',x:40,y:0,damaging:true},
  {id:'immune',x:42,y:0,damaging:false},
  {id:'dodged',x:44,y:0,damaging:true,contact:false},
  {id:'ko',x:46,y:0,damaging:true,ko:true},
  {id:'hit2',x:50,y:0,damaging:true}
 ]);
 assert.deepEqual(result.strikes,['hit1','immune','hit2']);
 const xs=[...new Set(result.impacts.map(([x])=>x))].sort((a,b)=>a-b);
 assert.deepEqual(xs,[40,50]);
});
test('Earth Power never paints a miss/immune KO as a confirmed impact',()=>{
 for(const target of [
  {id:'miss',x:40,y:0,contact:false},
  {id:'immune',x:40,y:0,damaging:false},
  {id:'ko',x:40,y:0,ko:true,damaging:true}
 ])assert.equal(simulate([target]).impacts.length,0,target.id);
});
test('hit targets receive one strike each, no duplicate damage across frames',()=>{
 const result=simulate([{id:'only',x:40,y:0,damaging:true}]);
 assert.deepEqual(result.strikes,['only']);
 assert.ok(result.impacts.length>0);
});
