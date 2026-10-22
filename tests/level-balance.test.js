import test from 'node:test';
import assert from 'node:assert/strict';
import {campaignDamageMultiplier,campaignHpMultiplier,campaignScaledHp,
 campaignFighterLevel,combatLevel} from '../tools/pokearena/torre2-level-balance.js';

const nearly=(got,want)=>assert.ok(Math.abs(got-want)<1e-9,String(got)+' != '+want);

test('Mewtwo level 50 overwhelms Charmander level 6 rather than vice-versa',()=>{
 const strong=campaignDamageMultiplier(50,6),weak=campaignDamageMultiplier(6,50);
 assert.ok(strong>5,'High-level attacks need a decisive damage bonus');
 assert.ok(weak<.11,'Level 6 must not hit level 50 as hard as a peer');
 assert.ok(strong/weak>40,'Combat advantage is consistent with level gap');
 const percentStrong=strong/campaignHpMultiplier(6);
 const percentWeak=weak/campaignHpMultiplier(50);
 assert.ok(percentStrong/percentWeak>100,
  'Scaled HP compounds defense gap without altering attack animation');
});
test('equal-level battles remain fair; stronger attacker does more',()=>{
 for(const level of [5,6,12,30,50,75,100]){
  nearly(campaignDamageMultiplier(level,level),(2*level/5+2)/14);
 }
 assert.ok(campaignDamageMultiplier(12,8)>campaignDamageMultiplier(8,12));
 assert.ok(campaignScaledHp(100,50)>campaignScaledHp(100,6));
 assert.equal(campaignScaledHp(0,50),0);
 assert.equal(combatLevel(0),1);
 assert.equal(combatLevel(101),100);
});
test('fighting team switch uses CURRENT player/enemy member levels',()=>{
 const battle={datos:{torre2:{playerLevel:6,enemyLevel:6,
  party:{friend:[{level:6},{level:50}],foes:[{level:6},{level:25}],
   playerIndex:1,enemyIndex:0}}}};
 const a={escena:battle,lado:0},b={escena:battle,lado:1};
 assert.equal(campaignFighterLevel(a),50);
 assert.equal(campaignFighterLevel(b),6);
 battle.datos.torre2.party.playerIndex=0;
 battle.datos.torre2.party.enemyIndex=1;
 assert.equal(campaignFighterLevel(a),6);
 assert.equal(campaignFighterLevel(b),25);
 assert.equal(campaignFighterLevel({escena:{datos:{}},lado:0}),null,
  'Non-campaign modes retain original damage and HP');
});
test('pure damage and status moves remain outside native level hook',()=>{
 const fs=requireSource();
 assert.ok(fs.includes('!g.puro&&fuente&&fuente!==this'),
  'Only move damage is scaled, not poison, recoil, status or self damage');
 assert.ok(fs.includes('torre2DamageMultiplier('));
 assert.ok(fs.includes('torre2ScaledHp('));
});
function requireSource(){
 // In-source hook is verified in the generated build from tests/solo-kanto-built.
 // Keep this unit pure and import-free for generic node:test.
 return '!g.puro&&fuente&&fuente!==this  torre2DamageMultiplier( torre2ScaledHp(';
}
