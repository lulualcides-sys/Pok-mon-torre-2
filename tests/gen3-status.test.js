import test from 'node:test';import assert from 'node:assert/strict';
import {applyGen3Status as apply,tickGen3Status as tick,gen3StatusInput as input,serializeGen3Status as save,restoreGen3Status as restore,statusLabel} from '../tools/pokearena/torre2-gen3-status.js';
const actor=(tipos=['NORMAL'])=>({hp:160,hpMax:160,tipos,est:{},t:0,cd:{},atk:1,defensa:1});
test('exclusive major status, separate confusion and Gen III immunities',()=>{
 const a=actor();apply(a,'veneno');apply(a,'quemado');apply(a,'confuso');assert.ok(a.est.veneno&&a.est.confuso);assert.ok(!a.est.quemado);
 for(const [type,status] of [['POISON','veneno'],['STEEL','toxic'],['FIRE','quemado'],['ICE','congelado']]){const p=actor([type]);apply(p,status);assert.deepEqual(p.est,{});}
 const electric=actor(['ELECTRIC']);apply(electric,'paralizado');assert.ok(electric.est.paralizado,'Electric is not immune to paralysis in Gen III');
});
test('poison and burn tick once per window; Toxic increases and resets on switching',()=>{
 for(const status of ['veneno','quemado']){const a=actor();apply(a,status);tick(a,3.9);assert.equal(a.hp,160);tick(a,.1);assert.equal(a.hp,140);tick(a,0);assert.equal(a.hp,140);}
 const a=actor();apply(a,'toxic');tick(a,4);assert.equal(a.hp,150);tick(a,4);assert.equal(a.hp,130);
 const b=actor();restore(b,save(a));tick(b,4);assert.equal(b.hp,150);
});
test('sleep expires, freeze thaws and fire-status labels are real state',()=>{
 const a=actor();apply(a,'dormido',{},()=>0);assert.equal(input(a,{lmb:true}),null);tick(a,8);assert.ok(!a.est.dormido);
 apply(a,'congelado');tick(a,4,()=>.1);assert.ok(!a.est.congelado);
 apply(a,'quema');assert.equal(statusLabel(a),'BRN');
});
test('paralysis and confusion use one chance per window, not every rendered frame',()=>{
 const a=actor();apply(a,'confuso',{},()=>.99);let rolls=0;const rng=()=>{rolls++;return 0};
 assert.equal(input(a,{lmb:true},rng).lmb,false);const hp=a.hp;
 for(let i=0;i<60;i++){a.t=i/60;input(a,{lmb:true},rng);}
 assert.equal(rolls,1);assert.equal(a.hp,hp);
 a.t=4;input(a,{lmb:true},rng);assert.equal(rolls,2);assert.ok(a.hp<hp);
 const p=actor();apply(p,'paralizado');const control=input(p,{mx:1,my:0,lmb:true},()=>.1);assert.equal(control.mx,.25);assert.equal(control.lmb,false);
});
test('serialization has no source reference and does not transfer confusion',()=>{
 const a=actor();apply(a,'veneno',{fuente:a});apply(a,'confuso');const saved=JSON.parse(JSON.stringify(save(a)));const b=actor();restore(b,saved);assert.ok(b.est.veneno);assert.ok(!b.est.confuso);assert.equal(save(actor()),null);
});
