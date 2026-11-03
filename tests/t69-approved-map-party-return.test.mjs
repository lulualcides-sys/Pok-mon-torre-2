import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {approvedReturnMapId,KANTO_BADGES} from '../tools/pokearena/torre2-approved-progression-gates.js';
const state=(stage,badges=[],champion=false)=>({stage,badges:[...badges],champion});
const checkpoint=(id,stage)=>({id,stage});

test('T69: the same approved map is restored after opening the party summary',()=>{
 const s=state(2);
 const original=JSON.stringify(s);
 assert.equal(approvedReturnMapId(checkpoint('vermilion-city',2),s),'vermilion-city');
 assert.equal(approvedReturnMapId(checkpoint('cerulean-city',2),s),'cerulean-city');
 assert.equal(JSON.stringify(s),original,'return must never rewrite the save');
});

test('T69: stage changes and fake/unknown map IDs cannot resume',()=>{
 assert.equal(approvedReturnMapId(checkpoint('vermilion-city',2),state(3)),null);
 assert.equal(approvedReturnMapId(checkpoint('vermilion-city',2),state(1)),null);
 assert.equal(approvedReturnMapId(checkpoint('pallet-town',1),state(1)),null);
 assert.equal(approvedReturnMapId(checkpoint('rocket-warehouse',13),
  state(13,KANTO_BADGES,true)),null);
 assert.equal(approvedReturnMapId(checkpoint('hall-of-fame',13),
  state(13,KANTO_BADGES,false)),null);
 assert.equal(approvedReturnMapId(checkpoint('hall-of-fame',13),
  state(13,KANTO_BADGES.slice(0,7),true)),null);
 assert.equal(approvedReturnMapId(checkpoint('hall-of-fame',13),
  state(13,KANTO_BADGES,true)),'hall-of-fame');
});

test('T69: returning never bypasses the Giovanni / League badge gates',()=>{
 const missingSeven=state(7,KANTO_BADGES.slice(0,6));
 const seven=state(7,KANTO_BADGES.slice(0,7));
 const eight=state(8,KANTO_BADGES);
 assert.equal(approvedReturnMapId(checkpoint('gym-giovanni',7),missingSeven),null);
 assert.equal(approvedReturnMapId(checkpoint('gym-giovanni',7),seven),'gym-giovanni');
 assert.equal(approvedReturnMapId(checkpoint('victory-road',8),state(8,KANTO_BADGES.slice(0,7))),null);
 assert.equal(approvedReturnMapId(checkpoint('victory-road',8),eight),'victory-road');
});

test('T69: missing, malformed and forged UI return state fails closed',()=>{
 const valid=state(2);
 for(const candidate of [null,undefined,{},[],{id:24,stage:2},
  {id:'vermilion-city',stage:'2'}, {id:'vermilion-city'},
  checkpoint('nonexistent-map',2)])
  assert.equal(approvedReturnMapId(candidate,valid),null);
 assert.equal(approvedReturnMapId(checkpoint('vermilion-city',2),null),null);
});

test('T69: Summary buttons return through authorization, not legacy path',()=>{
 const scene=readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
 const policy=readFileSync('tools/pokearena/torre2-approved-progression-gates.js','utf8');
 assert.ok(scene.includes('returnFromPartyToMap(state){'));
 assert.ok(scene.includes('const id=approvedReturnMapId(this.__torre2ApprovedReturn,fresh);'));
 assert.ok(scene.includes('this.textures.exists(mapTextureKey(id))'));
 assert.ok(scene.includes('this.approvedMapPreview(fresh,id)'));
 assert.ok(scene.includes("this.returnFromPartyToMap(state);\n  }).setData('torre2-summary-back',true);"));
 assert.ok(scene.includes("this.returnFromPartyToMap(state);\n  },index===state.active).setData('torre2-active-select',true);"));
 assert.ok(policy.includes('returnEntry.stage!==state?.stage'));
});
