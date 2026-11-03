import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {approvedReturnMapId,KANTO_BADGES} from '../tools/pokearena/torre2-approved-progression-gates.js';

const source=readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
const fixture=(stage,badges=[],champion=false)=>({stage,badges:[...badges],champion});

test('T70: six menu Back controls return using the T69 checked map entry',()=>{
 const names=['center','mart','bag','pc','dex','badge-case'];
 for(const name of names){
  const marker='torre2-'+name+'-back';
  const i=source.indexOf(".setData('"+marker+"',true)");
  assert.ok(i>0,marker+' must expose a Phaser testable button');
  const button=source.slice(Math.max(0,i-240),i);
  assert.ok(button.includes('this.returnFromPartyToMap(state)'),
   marker+' must use approved return without scene.restart()');
 }
 assert.ok(source.includes('const fresh=readCampaign()||state;'),
  'the actual checkpoint, not the stale menu state, must authorize return');
});

test('T70: menu return policy is read-only and locked after a stage change',()=>{
 const state=fixture(2),checkpoint={id:'vermilion-city',stage:2};
 const original=JSON.stringify(state);
 for(let i=0;i<6;i++)
  assert.equal(approvedReturnMapId(checkpoint,state),'vermilion-city');
 assert.equal(JSON.stringify(state),original);
 assert.equal(approvedReturnMapId(checkpoint,fixture(3)),null);
 assert.equal(approvedReturnMapId(checkpoint,fixture(0)),null);
 assert.equal(approvedReturnMapId({id:'hall-of-fame',stage:13},
  fixture(13,KANTO_BADGES,false)),null);
 assert.equal(approvedReturnMapId({id:'rocket-warehouse',stage:13},
  fixture(13,KANTO_BADGES,true)),null);
});

test('T70: healing/purchases/transfers retain original save checkpoint operations',()=>{
 for(const marker of ['healTeam(state)','purchaseItem(state,item.id)',
  'attemptTransfer(()=>storePokemon(state,this.pcSelected))',
  'const view=kantoDexPageModel(state,KANTO_DEX,supported,this.dexPage||0)'])
  assert.ok(source.includes(marker),marker+' must not be replaced by an implicit reward');
 // Existing post-healing animation remains a separate confirmed save event.
 assert.ok(source.includes('this.time.delayedCall(1400,()=>'));
 assert.ok(source.includes('try{healTeam(state);}'));
});
