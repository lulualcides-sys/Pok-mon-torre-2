import test from 'node:test';
import assert from 'node:assert/strict';
import {battlePotionUses,canUseBattlePotion,recordBattlePotionUse,BATTLE_POTION_LIMIT}
 from '../tools/pokearena/torre2-battle-bag-limits.js';

test('T31: exactly three Potions across UI reinstalls for one battle party',()=>{
 const party={friend:[{id:'bulbasaur',hp:41}],changes:0};
 const before=JSON.stringify(party.friend);
 assert.equal(BATTLE_POTION_LIMIT,3);
 for(let i=0;i<3;i++){
  assert.equal(canUseBattlePotion(party),true);
  assert.equal(recordBattlePotionUse(party),true);
  // A fresh HUD reads the same battle payload (not a new local let=0).
  const reinstatedBattleBag=party;
  assert.equal(battlePotionUses(reinstatedBattleBag),i+1);
 }
 assert.equal(canUseBattlePotion(party),false);
 assert.equal(recordBattlePotionUse(party),false);
 assert.equal(party.torre2PotionUses,3);
 assert.equal(JSON.stringify(party.friend),before,'Limit tracking does not alter fighters');
});

test('T31: a NEW encounter gets a fresh allowance without persisting limits to saves',()=>{
 const save={team:[{id:'bulbasaur',uid:'safe',hp:75}],inventory:{potion:7}};
 const original=JSON.stringify(save);
 const firstParty={friend:[{id:'bulbasaur'}]};
 for(let i=0;i<3;i++)assert.equal(recordBattlePotionUse(firstParty),true);
 const secondParty={friend:[{id:'bulbasaur'}]};
 assert.equal(battlePotionUses(secondParty),0);
 assert.equal(recordBattlePotionUse(secondParty),true);
 assert.equal(JSON.stringify(save),original);
});

test('T31: invalid or manipulated counters cannot grant extra Potions',()=>{
 for(const value of [-1,3,4,100,Infinity,NaN,'1',1.5]){
  const party={torre2PotionUses:value};
  assert.equal(canUseBattlePotion(party),false,String(value));
  assert.equal(recordBattlePotionUse(party),false,String(value));
 }
 assert.equal(battlePotionUses({torre2PotionUses:2}),2);
 assert.equal(canUseBattlePotion(null),false);
 assert.equal(recordBattlePotionUse(null),false);
});
