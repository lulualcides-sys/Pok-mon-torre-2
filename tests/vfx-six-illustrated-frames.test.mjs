import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {VFX_SIX,VFX_SIX_FRAME_SIZE,VFX_SIX_FRAMES_PER_MOVE,VFX_SIX_ATLAS,VFX_SIX_TIMINGS,sixFrame} from '../tools/pokearena/torre2-vfx-six-scene.js';
const ids=['gunk-shot','magnet-bomb','ominous-wind','drill-run','freeze-dry','head-smash'];
test('Six distinct new move effect names, each exactly 16 cels',()=>{
 assert.deepEqual(VFX_SIX.map(x=>x.id),ids);
 assert.deepEqual(VFX_SIX.map(x=>x.start),[0,16,32,48,64,80]);
 assert.equal(new Set(VFX_SIX.map(x=>x.type)).size,6);
 assert.equal(VFX_SIX_FRAMES_PER_MOVE,16);
 assert.equal(VFX_SIX_TIMINGS.length,16);
 assert.equal(sixFrame(0,0),0);assert.equal(sixFrame(5,15),95);
 assert.equal(sixFrame(4,16),79);
});
test('No conflicting names in the saved P2 native catalog; original kits immutable',()=>{
 const cat=JSON.parse(readFileSync('data/pokearena2d-source-moves.json','utf8'));
 for(const id of ids)assert.equal(cat.moves.some(x=>x.id===id),false,id);
 const scene=readFileSync('tools/pokearena/torre2-vfx-six-scene.js','utf8');
 assert.match(scene,/class VfxSixLab extends Phaser.Scene/);
 assert.match(scene,/super\("vfx-six"\)/);
 assert.doesNotMatch(scene,/\.recibir\(|\.kitActual\(|localStorage|scene\.add\.graphics\(/);
});
test('True PNG source atlas matches all 96 sprites and unmodified vetted art SHA',()=>{
 assert.equal(VFX_SIX_ATLAS,'assets/torre2/vfx-six/atlas.png');
 assert.equal(VFX_SIX_FRAME_SIZE,56);
 const png='reference-assets/vfx-six/atlas.png';
 assert.ok(existsSync(png),'Missing six visual art sprites: do not publish code-only placeholders');
 const b=readFileSync(png);
 assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(b.readUInt32BE(16),56*4);
 assert.equal(b.readUInt32BE(20),56*24);
 assert.equal(createHash('sha256').update(b).digest('hex'),
  'c7d9b5adcb59dddb86c6e140bb45eaeb9acc9de0e0ce4fbf63b500e55e6b294c');
});
test('Actual Pages build includes new isolated Phaser scene, title menu and cache revision',()=>{
 const s=readFileSync('tools/pokearena/build-preview.mjs','utf8');
 for(const mark of ['torre2-vfx-six-scene.js','VfxSixLab','vfx-six-scene.js',
  'VFX 6 · TESTAR','sixAtlasBytes','vfx-six/atlas.png'])assert.ok(s.includes(mark),mark);
 assert.ok(!s.includes('VFX_SIX_IN_NATIVE_FORMAS'));
});
