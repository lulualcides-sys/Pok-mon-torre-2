import test from 'node:test';
import assert from 'node:assert/strict';
import {stripUnusedUiBallsPreload} from '../tools/pokearena/optional-ui-balls.mjs';

const old='this.load.spritesheet("ui-balls","assets/ui/balls20.png",{frameWidth:20,frameHeight:20});';
const modern='this.load.spritesheet("ui-balls","assets/ui/balls20.png",{frameWidth:20,frameHeight:24, endFrame:4});';
test('removes only obsolete optional preload, preserving other native calls',()=>{
 const before='this.load.image("logo","assets/ui/logo.png");'+old+'this.load.image("p","p.png");';
 assert.equal(stripUnusedUiBallsPreload(before),'this.load.image("logo","assets/ui/logo.png");this.load.image("p","p.png");');
});
test('accepts changed upstream frame dimensions without changing other preload',()=>{
 assert.equal(stripUnusedUiBallsPreload('preload(){ '+modern+' this.load.image("a","b"); }'),
  'preload(){  this.load.image("a","b"); }');
});
test('does not delete an optional asset still used by the native client',()=>{
 assert.throws(()=>stripUnusedUiBallsPreload(old,[{path:'escenas/batalla.js'}]),/referenced/);
 assert.throws(()=>stripUnusedUiBallsPreload(old+'this.add.image(0,0,"ui-balls");'),/referenced/);
});
test('rejects ambiguous, unknown or unsafe native preloads',()=>{
 assert.throws(()=>stripUnusedUiBallsPreload(old+old),/ambiguous/);
 assert.throws(()=>stripUnusedUiBallsPreload('this.load.spritesheet("ui-balls","assets/ui/new.png",{frameWidth:20,frameHeight:20});'),/Unknown/);
 assert.throws(()=>stripUnusedUiBallsPreload('this.load.spritesheet("ui-balls","assets/ui/balls20.png",{frameWidth:20});'),/metadata/);
});
