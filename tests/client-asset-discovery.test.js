import test from 'node:test';
import assert from 'node:assert/strict';
import {discoverClientAssetPaths} from '../tools/pokearena/client-asset-discovery.mjs';

test('discovers quoted native UI assets without external URLs or path traversal',()=>{
 const input='this.load.image("ui-iconos","assets/ui/iconos.png");'+
  'this.load.image("ui-calavera","assets/ui/calavera.png");'+
  'load.image("bad","../assets/ui/secret.png");'+
  'load.image("foreign","https://example.com/assets/ui/foreign.png");';
 assert.deepEqual(discoverClientAssetPaths(input),[
  'assets/ui/calavera.png','assets/ui/iconos.png']);
});
test('recovers dynamically constructed HOJAS spritesheet dependencies',()=>{
 const script='const HOJAS={ember:{fw:32,fh:32,anims:{fire:{fps:12}}},'+
  'solarhaz_impacto:{fw:56,fh:56,cols:6,anims:{}},'+
  'oryx_portal:{fw:64,fh:64,cols:2,anims:{}}};'+
  'function cargarHojas(escena){for(const[k,h]of Object.entries(HOJAS))'+
  'escena.load.spritesheet(`vfx-${k}`,`assets/vfx/${k}.png`,{frameWidth:h.fw})}';
 assert.deepEqual(discoverClientAssetPaths(script),[
  'assets/vfx/ember.png','assets/vfx/oryx_portal.png',
  'assets/vfx/solarhaz_impacto.png']);
 assert.deepEqual(discoverClientAssetPaths(script.replace('spritesheet','image')),[],
  'Do not infer spritesheets unless native loader actually references them');
});
test('handles unrelated or empty client source without inventing assets',()=>{
 assert.deepEqual(discoverClientAssetPaths('const HOJAS={missing:{fw:1,fh:1}};'),[]);
 assert.deepEqual(discoverClientAssetPaths(null),[]);
});
