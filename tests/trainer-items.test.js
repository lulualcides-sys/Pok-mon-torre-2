import test from 'node:test';import assert from 'node:assert/strict';
import {trainerInventory,createTrainerItems,trainerItemStep} from '../tools/pokearena/torre2-trainer-items.js';
const actor=()=>({hp:20,hpMax:100,est:{veneno:{},confuso:{}}});
test('leaders have bounded inventories and wild encounters have none',()=>{
 assert.deepEqual(trainerInventory(0,true),{potion:1});assert.deepEqual(trainerInventory(12,true),{fullrestore:3});
 assert.deepEqual(trainerInventory(12,true,0,true),{});assert.deepEqual(trainerInventory(0,false),{});
});
test('item cast takes time, heals correct HP, obeys cooldown and cannot use infinite potions',()=>{
 const s=createTrainerItems({potion:2}),a=actor();
 assert.equal(trainerItemStep(s,a,0,0).kind,'started');assert.equal(a.hp,20);assert.equal(s.inventory.potion,1);
 assert.equal(trainerItemStep(s,a,0,1),null);assert.equal(trainerItemStep(s,a,0,1.2).hp,20);assert.equal(a.hp,40);
 a.hp=10;assert.equal(trainerItemStep(s,a,0,19),null);assert.equal(trainerItemStep(s,a,0,20).kind,'started');trainerItemStep(s,a,0,22);
 a.hp=10;assert.equal(trainerItemStep(s,a,0,60),null);assert.equal(s.uses,2);
});
test('cannot heal a replacement or fainted target; full restore cures without exceeding max HP',()=>{
 const s=createTrainerItems({fullrestore:2}),a=actor();trainerItemStep(s,a,0,0);
 assert.equal(trainerItemStep(s,a,1,2).kind,'cancelled');assert.equal(a.hp,20);
 trainerItemStep(s,a,1,20);trainerItemStep(s,a,1,22);assert.equal(a.hp,100);assert.deepEqual(a.est,{});
 const d=createTrainerItems({potion:1}),b=actor();trainerItemStep(d,b,0,0);b.hp=0;assert.equal(trainerItemStep(d,b,0,2).kind,'cancelled');assert.equal(b.hp,0);
});
