import test from 'node:test';
import assert from 'node:assert/strict';
import {ensureNativePortraitExport} from '../tools/pokearena/torre2-native-portrait-compat.mjs';

test('upstream League import receives named native portrait compatibility without copying artwork',()=>{
 const src='export const cargarPMD=()=>true;export const casillaRetrato=()=>0;';
 const fixed=ensureNativePortraitExport(src);
 assert.ok(fixed.includes('export function ponerRetrato'));
 assert.ok(fixed.includes('scene?.textures?.exists?.(key)'));
 assert.equal(ensureNativePortraitExport(fixed),fixed,'Portrait compatibility must be idempotent');
 assert.ok(fixed.startsWith(src),'Original sprite client must remain byte-identical');
});
test('existing native renderer export takes priority with no modifications',()=>{
 const native='export function ponerRetrato(scene,img,dex){return img}';
 assert.equal(ensureNativePortraitExport(native),native);
 const exportList='function ponerRetrato(){};export{ponerRetrato};';
 assert.equal(ensureNativePortraitExport(exportList),exportList);
});
test('private renderer is re-exported rather than shadowed',()=>{
 const privateFn='function ponerRetrato(){};export const cargarPMD=()=>0;';
 const fixed=ensureNativePortraitExport(privateFn);
 assert.ok(fixed.includes('export{ponerRetrato};'));
 assert.ok(!fixed.includes('export function ponerRetrato('));
});
test('missing recognizable native module aborts the build rather than substituting arbitrary art',()=>{
 assert.throws(()=>ensureNativePortraitExport('const sprites = 1;'),/Unrecognized/);
});
