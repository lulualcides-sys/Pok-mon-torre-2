import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CLICKABLE_OVERWORLD_MAPS,installClickableOverworld,showOverworldParty}
 from '../tools/pokearena/torre2-map-playable-hud.js';
import {APPROVED_MAPS_ATLAS,USER_OPENING_MAPS}
 from '../tools/pokearena/torre2-approved-maps-atlas.js';

test('T90 six Kanto entry maps use clicking, never a player controller',()=>{
 assert.deepEqual(CLICKABLE_OVERWORLD_MAPS,[
  'pallet-town','route-1','viridian-city','viridian-forest','route-2','pewter-city'
 ]);
 assert.equal(new Set(CLICKABLE_OVERWORLD_MAPS).size,6);
 assert.equal(typeof installClickableOverworld,'function');
 assert.equal(typeof showOverworldParty,'function');
});
test('T90 no character movement, keyboard, joystick or image-ground pointer',()=>{
 const module=readFileSync('tools/pokearena/torre2-map-playable-hud.js','utf8');
 const scene=readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
 for(const forbidden of [
  /addPlayer/,/moveTo/,/keydown/,/keyboard/,/tweens/,/fieldRoad/,
  /roadPoint/,/joystick/,/setVelocity/,/setPosition\(/,/view\.image\.setInteractive/,
  /onPosition/,/__torre2OverworldPositions/,/installPlayableOverworld/
 ]){
  assert.doesNotMatch(module,forbidden,forbidden.toString());
  assert.doesNotMatch(scene,forbidden,forbidden.toString());
 }
 assert.match(scene,/onHotspot:\(_id,kind\)=>/);
 assert.match(scene,/addFireRedNPC\(scene,actor\.kind/);
 assert.match(scene,/this\.enterBattle\(fresh\)/);
});
test('T90 native click UI directly opens existing party/summary/PC/battle screens',()=>{
 const scene=readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
 const renderer=readFileSync('tools/pokearena/torre2-approved-map-renderer.js','utf8');
 const module=readFileSync('tools/pokearena/torre2-map-playable-hud.js','utf8');
 const build=readFileSync('tools/pokearena/build-preview.mjs','utf8');
 assert.match(scene,/this\.scene\.stop\('titulo'\)/);
 assert.match(scene,/this\.input\.setTopOnly\(true\)/);
 assert.match(scene,/hideBackButton:CLICKABLE_OVERWORLD_MAPS\.includes\(id\)/);
 assert.match(scene,/installClickableOverworld\(this,result/);
 assert.match(scene,/onSummary:index=>this\.showSummary/);
 assert.match(scene,/onBag:\(\)=>this\.bagScreen/);
 assert.match(scene,/onDex:\(\)=>this\.dexScreen/);
 assert.match(scene,/onBattle:\(\)=>this\.enterBattle/);
 assert.match(scene,/onCapture:\(\)=>this\.grassScreen/);
 assert.match(renderer,/const back=hideBackButton\?null:/);
 for(const button of ['party','summary','bag','dex','battle','capture'])
  assert.ok(module.includes("'"+button+"'"),button);
 assert.match(module,/onSummary\(i\)/);
 assert.doesNotMatch(module,/saveCampaign\(/);
 assert.match(build,/torre2-map-playable-hud\.js/);
 assert.equal(APPROVED_MAPS_ATLAS.maps.length,60);
 assert.equal(USER_OPENING_MAPS.length,4);
});
