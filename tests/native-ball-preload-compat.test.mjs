import test from 'node:test';
import assert from 'node:assert/strict';
import {stripUnavailableBallPreload} from '../tools/pokearena/torre2-native-ball-preload-compat.mjs';

const old = 'this.load.spritesheet("ui-balls","assets/ui/balls20.png",{frameWidth:20,frameHeight:20});';
const spaced = "this.load.spritesheet('ui-balls', 'assets/ui/balls20.png', { frameWidth: 20, frameHeight: 20 });";
test('T41: strips the unavailable optional texture in original and reformatted clients', () => {
 for (const call of [old, spaced]) {
  const src = 'preload(){' + call + 'this.load.image("pc","assets/ui/pc.png");}';
  const result = stripUnavailableBallPreload(src);
  assert.equal(result.includes('ui-balls'), false);
  assert.match(result, /this\.load\.image\("pc"/);
 }
});
test('T41: preserves native source when upstream already removed the optional request', () => {
 const src = 'preload(){this.load.image("pc","assets/ui/pc.png");}';
 assert.equal(stripUnavailableBallPreload(src), src);
});
test('T41: rejects unknown asset, missing frame configuration, duplicates and active references', () => {
 const invalid = [
  'this.load.spritesheet("ui-balls","assets/ui/new-balls.png",{frameWidth:20,frameHeight:20});',
  'this.load.spritesheet("ui-balls","assets/ui/balls20.png",{frameWidth:20});',
  old + old,
  old + 'this.add.image(1,2,"ui-balls");'
 ];
 for (const src of invalid) assert.throws(() => stripUnavailableBallPreload(src));
});
