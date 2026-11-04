import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const scene=readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
const cards=readFileSync('tools/pokearena/torre2-trainer-cards.js','utf8');

test('Kanto campaign never renders any world map or hidden battle-road behind cards',()=>{
 const method=scene.slice(scene.indexOf(' renderCampaign(state,{deferEeveeChoice=false}={}){'),
  scene.indexOf(' // This is a campaign-only choice'));
 assert.ok(method.length>500);
 assert.match(method,/this\.__torre2BattlePath=null/);
 assert.match(method,/renderTrainerCardHub\(this,state,handlers\)/);
 assert.doesNotMatch(method,/renderBattlePath\(|renderCityHub\(|renderTrainerCardMapTab\(/);
 assert.doesNotMatch(method,/__torre2CardsMapOnly|URLSearchParams\(location\.search\)/);
 assert.match(cards,/'MAIS'/);
 assert.doesNotMatch(cards,/'MAPA',handlers\.map/);
});
test('Enemy party is rendered fully with genuine PMD textures at exact 50% size',()=>{
 assert.match(cards,/OPPONENT_SPRITE_SCALE=0\.5/);
 assert.match(cards,/OPPONENT_LIST_SPRITE_SIZE=22\*OPPONENT_SPRITE_SCALE/);
 assert.match(cards,/OPPONENT_DETAIL_SPRITE_SIZE=53\*OPPONENT_SPRITE_SCALE/);
 assert.match(cards,/entry\.species\.slice\(0,6\)/);
 assert.match(cards,/compactRoster\(scene,layer,entry/);
 assert.match(cards,/const species=entry\.species\.slice\(0,6\)/);
 assert.match(cards,/portrait\(scene,layer,species\[k\],cx,cy-15,OPPONENT_DETAIL_SPRITE_SIZE\)/);
 assert.doesNotMatch(cards,/entry\.locked&&!leader\?\[\]:entry\.species/);
 assert.match(cards,/nationalDex=new Map\(KANTO_DEX/);
});
test('Retired maps do not consume campaign preload memory; original features remain accessible',()=>{
 const preload=scene.slice(scene.indexOf(' preload(){'),scene.indexOf(' create(){'));
 assert.doesNotMatch(preload,/this\.load\.image\(key,AVAILABLE_FRLG_FILES/);
 assert.match(preload,/if\(key\.startsWith\('frlg-location-'\)\)this\.textures\.remove\(key\)/);
 for(const token of ['rematchAtlas','battle:()=>this.enterBattle(state)',
  'reset:()=>this.confirmResetJourney()','dex:()=>this.dexScreen(state)',
  'badges:()=>this.badgeCaseScreen(state)','audio:()=>this.__torre2AudioSettings?.open()'])
  assert.ok(scene.includes(token),'Missing campaign handler: '+token);
 assert.match(cards,/\['ÁUDIO',handlers\.audio\]/);
 assert.match(cards,/\['REINICIAR JORNADA',handlers\.reset\]/);
});
