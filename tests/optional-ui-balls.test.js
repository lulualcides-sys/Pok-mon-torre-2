import test from 'node:test';
import assert from 'node:assert/strict';
import {stripUnusedUiBallsPreload,preserveActiveUiBallsOrStripUnused} from '../tools/pokearena/optional-ui-balls.mjs';

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

test('preserves active balls10.png original bytes only when locally present',()=>{
 const active='this.load.spritesheet("ui-balls","assets/ui/balls10.png",{frameWidth:20,frameHeight:20});';
 assert.equal(preserveActiveUiBallsOrStripUnused(active,{balls10Available:true}),active);
 assert.throws(()=>preserveActiveUiBallsOrStripUnused(active,{balls10Available:false}),/file missing/);
 assert.throws(()=>preserveActiveUiBallsOrStripUnused(active+active,{balls10Available:true}),/Ambiguous/);
});
test('legacy unused balls20 may be dropped, but no other active key',()=>{
 assert.equal(preserveActiveUiBallsOrStripUnused(old,{balls10Available:false}), '');
 assert.throws(()=>preserveActiveUiBallsOrStripUnused(old,[{path:'other.js'}]),/referenced/);
 const changed='this.load.spritesheet("ui-balls","assets/ui/balls11.png",{frameWidth:20,frameHeight:20});';
 assert.throws(()=>preserveActiveUiBallsOrStripUnused(changed,{balls10Available:true}),/Unknown/);
});
