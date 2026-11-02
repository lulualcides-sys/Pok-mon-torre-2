import test from 'node:test';
import assert from 'node:assert/strict';
import {stripUnavailableUiBallsPreload} from '../tools/pokearena/torre2-native-asset-compat.mjs';

test('missing optional ball sprite request is removed without touching other textures',()=>{
 const base='this.load.image("badge","assets/ui/badges.png");\n'+
  'this.load.spritesheet("ui-balls","assets/ui/balls20.png",{frameWidth:20,frameHeight:20});\n'+
  'this.load.image("capture","assets/ui/capture.png");';
 const output=stripUnavailableUiBallsPreload(base);
 assert.ok(!output.includes('ui-balls'));
 assert.ok(output.includes('this.load.image("badge"'));
 assert.ok(output.includes('this.load.image("capture"'));
});
test('upstream syntax changes in optional preload do not crash the client build',()=>{
 const source="this.load.spritesheet( 'ui-balls' , 'assets/ui/balls20.png' , { frameHeight: 20, frameWidth: 20, margin: 0 } );";
 assert.equal(stripUnavailableUiBallsPreload(source),'');
});
test('upstream removal of optional asset does not block build',()=>{
 const source='this.load.image("pokeball","assets/ui/capture.png");';
 assert.equal(stripUnavailableUiBallsPreload(source),source);
});
test('referenced or changed ball sprite is NOT silently removed',()=>{
 for(const source of [
  'this.load.spritesheet("ui-balls","assets/ui/new.png",{frameWidth:20});',
  'this.load.spritesheet("ui-balls","assets/ui/balls20.png",{frameWidth:20}); this.add.image(1,2,"ui-balls");',
  'this.load.spritesheet("ui-balls","assets/ui/balls20.png",{frameWidth:20}); this.load.spritesheet("ui-balls","assets/ui/balls20.png",{frameWidth:20});'
 ])assert.throws(()=>stripUnavailableUiBallsPreload(source),/refusing/);
});

test('current original upstream balls10 texture survives unchanged',()=>{
 const source='this.load.spritesheet("ui-balls","assets/ui/balls10.png",{frameWidth:20,frameHeight:20});';
 assert.equal(stripUnavailableUiBallsPreload(source),source);
});
