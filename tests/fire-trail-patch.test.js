import test from 'node:test';
import assert from 'node:assert/strict';
import {patchFireTrailMarks,FIRE_SCORCH} from '../tools/pokearena/torre2-fire-trail-patch.mjs';
const native='function quemado(e,x,y,R,{brasas=true,hueco=0}={}){if(!activas()||R<3)return;const m=gestor(e),t=reloj(e);if(repetida(m,hueco?"aro":"quemado",x,y,R))return;draw()}function mojado(){draw()}';
const run=(src,times)=>{let drawn=0,clock=0;const m={};
 const fn=new Function('activas','gestor','reloj','repetida','draw','times',src+';return t=>{clock=t};');
 // execute calls at given times
 const api={};const quemado=new Function('activas','gestor','reloj','repetida','draw',src+';return quemado')(()=>true,()=>m,()=>api.t,()=>false,()=>drawn++);
 for(const t of times){api.t=t;quemado({},0,0,6)}return drawn};
test('at most 6 scorch marks per second per scene, then it recovers',()=>{
 const out=patchFireTrailMarks(native);
 assert.equal(FIRE_SCORCH.perSecond,6);
 const burst=Array.from({length:32},(_,i)=>i*0.03); // Flare Blitz: ~32 marks in ~1 s
 assert.equal(run(native,burst),32);
 assert.equal(run(out,burst),6);
 assert.equal(run(out,[...burst,2,2.1,2.2]),9,'a new second allows new marks');
 assert.match(out,/function mojado\(\)\{draw\(\)\}/,'other marks untouched');
});
test('refuses to patch a changed base client',()=>{
 assert.throws(()=>patchFireTrailMarks('changed'),/base client changed/);
});
