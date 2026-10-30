import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const scene=readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
const art=readFileSync('tools/pokearena/torre2-ball-sprites.js','utf8');
const section=scene.slice(scene.indexOf(' centerScreen(state){'),scene.indexOf(' martScreen(state,'));

test('Centro uses approved cached nearest-neighbor sprite, not fractional Graphics',()=>{
 assert.match(scene,/import \{originalBallSprite\} from '\.\/ball-sprites\.js'/);
 assert.match(section,/originalBallSprite\(this,x,160,'pokeball',32,610\)/);
 assert.match(section,/\.setData\('torre2-center-heal-ball',i\)/);
 assert.doesNotMatch(section,/ball\(icon,x,160,13\)|const icon=this\.add\.graphics/);
 assert.match(art,/texture\.setFilter\(Phaser\.Textures\.FilterMode\.NEAREST\)/);
});
test('Centro original healing pulse and save transaction are unchanged',()=>{
 assert.match(section,/icon\.setAlpha\(\.27\)/);
 assert.match(section,/this\.tweens\.add\(\{targets:icon,alpha:1,duration:260,delay:i\*150,/);
 assert.match(section,/yoyo:true,repeat:1,ease:'Sine\.easeInOut'/);
 assert.match(section,/this\.time\.delayedCall\(1400,\(\)=>\{/);
 assert.match(section,/try\{healTeam\(state\);\}/);
 assert.match(section,/this\.time\.delayedCall\(450,\(\)=>\{/);
});
