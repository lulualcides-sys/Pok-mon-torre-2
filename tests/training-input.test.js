import test from 'node:test';
import assert from 'node:assert/strict';
import {TRAINING_ATTACK_SLOTS,singleTrainingCastReader} from '../tools/pokearena/torre2-training-input.js';

function mock(){
 let current={mx:1,my:0,ax:100,ay:100},calls=0;
 const fighter={t:1,accion:null,cd:{lmb:0,rmb:0,q:0,e:0,esp:0}};
 const controller={label:'native-kbm',leer(){calls++;return current}};
 const original=controller.leer;
 controller.leer=singleTrainingCastReader(controller.leer,()=>fighter);
 return{controller,fighter,set(value){current={...current,...value}},get calls(){return calls},original};
}
const attacks=x=>TRAINING_ATTACK_SLOTS.filter(k=>x?.[k]);
test('Training reader gates simultaneous LMB + RMB + Q to exactly ONE move',()=>{
 const m=mock();m.set({lmb:true,rmb:true,q:true});
 let output=m.controller.leer();
 assert.deepEqual(attacks(output),['q']);
 assert.equal(output.mx,1,'preserve movement');
 assert.equal(output.ax,100,'preserve aim');
 assert.equal(m.controller.leer.__torre2SingleTrainingCast,true);
 for(let i=0;i<15;i++){
  m.fighter.t+=.08;output=m.controller.leer();
  assert.equal(attacks(output).length,0,'holding buttons must not autofire');
 }
 assert.equal(m.calls,16,'original native controller still called');
 assert.ok(Object.values(m.fighter.cd).every(x=>x===0),'no gameplay cooldown inserted');
});
test('A fresh press after release casts immediately; animation in progress blocks overlaps',()=>{
 const m=mock();
 m.set({q:true});assert.deepEqual(attacks(m.controller.leer()),['q']);
 m.fighter.accion={hasta:2.2};m.fighter.t=1.5;
 m.set({q:false,rmb:true});assert.deepEqual(attacks(m.controller.leer()),[]);
 m.fighter.t=2.3;m.set({rmb:false});assert.deepEqual(attacks(m.controller.leer()),[]);
 m.set({rmb:true});assert.deepEqual(attacks(m.controller.leer()),['rmb']);
 m.set({rmb:false});m.controller.leer();
 m.fighter.t=2.45;m.set({lmb:true});assert.deepEqual(attacks(m.controller.leer()),['lmb']);
});
test('Two new keys pressed together cannot cast the second key on the next frame',()=>{
 const m=mock();m.set({lmb:true,e:true});assert.deepEqual(attacks(m.controller.leer()),['e']);
 m.fighter.t=5;assert.deepEqual(attacks(m.controller.leer()),[]);
 m.set({lmb:false,e:false});m.controller.leer();
 m.set({q:true});assert.deepEqual(attacks(m.controller.leer()),['q']);
});
test('Native reader handles null input and preserves the this binding',()=>{
 const fighter={t:0},subject={hint:'original',leer(){assert.equal(this,subject);return null}};
 const wrapped=singleTrainingCastReader(subject.leer,()=>fighter);
 assert.equal(wrapped.call(subject),null);
});
