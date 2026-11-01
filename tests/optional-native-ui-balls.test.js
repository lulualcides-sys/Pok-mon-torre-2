import test from 'node:test';
import assert from 'node:assert/strict';
import {stripOptionalUiBallsPreload} from '../tools/pokearena/optional-native-ui-balls.mjs';

const canonical='this.load.spritesheet("ui-balls","assets/ui/balls20.png",{frameWidth:20,frameHeight:20});';
test('new native Phaser client without optional ui-balls builds unchanged',()=>{
 const input='preload(){this.load.image("arena","assets/ui/arena.png");}';
 assert.deepEqual(stripOptionalUiBallsPreload(input),{body:input,removed:false});
});
test('remove exactly one unavailable legacy preload without touching sprites',()=>{
 const input='preload(){'+canonical+'this.load.image("arena","assets/ui/arena.png");}';
 const result=stripOptionalUiBallsPreload(input);
 assert.equal(result.removed,true);
 assert.equal(result.body,'preload(){this.load.image("arena","assets/ui/arena.png");}');
});
test('allow equivalent whitespace and single quotes',()=>{
 const input="this.load.spritesheet( 'ui-balls' , 'assets/ui/balls20.png' , {frameWidth:20,frameHeight:20} );";
 assert.deepEqual(stripOptionalUiBallsPreload(input),{body:'',removed:true});
});
test('fail closed if preload is duplicated',()=>{
 assert.throws(()=>stripOptionalUiBallsPreload(canonical+canonical),/ambiguously: 2/);
});
test('fail closed if other native code still uses the texture',()=>{
 assert.throws(()=>stripOptionalUiBallsPreload(canonical+"get('ui-balls')"),/still references/);
});
test('fail closed if upstream changes the preload to an unknown form',()=>{
 assert.throws(()=>stripOptionalUiBallsPreload('this.load.image("ui-balls","assets/ui/balls20.png");'),/ambiguously: 0/);
});
test('fail closed if asset filename changes key',()=>{
 assert.throws(()=>stripOptionalUiBallsPreload('this.load.image("other","assets/ui/balls20.png");'),/ambiguously: 0/);
});

const native10='this.load.spritesheet("ui-balls","assets/ui/balls10.png",{frameWidth:20,frameHeight:20});';
test('preserve current original balls10 pixel-art texture and all its consumers',()=>{
 const input='preload(){'+native10+'}create(){this.add.image(0,0,"ui-balls");}';
 assert.deepEqual(stripOptionalUiBallsPreload(input),{body:input,removed:false});
});
test('reject duplicate current native preloads rather than changing artwork',()=>{
 assert.throws(()=>stripOptionalUiBallsPreload(native10+native10),/mixed or duplicated: 2/);
});
test('reject mixed current and unavailable legacy assets',()=>{
 assert.throws(()=>stripOptionalUiBallsPreload(native10+canonical),/mixed or duplicated: 1/);
});
test('reject unrecognized balls10 loader format',()=>{
 assert.throws(()=>stripOptionalUiBallsPreload('this.load.image("ui-balls","assets/ui/balls10.png");'),/ambiguously: 0/);
});
