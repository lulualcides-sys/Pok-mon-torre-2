import test from 'node:test';
import assert from 'node:assert/strict';
import {installNativeResizeFrameGuard} from '../tools/pokearena/torre2-native-resize-compat.mjs';
test('reuses original medir()/ajustar() and schedules one safe second pass',()=>{
 const s='function medir(){return null};const ajustar=()=>{const n=medir();juego.scale.resize(n.w,n.h)};addEventListener("resize",ajustar);alCambiarGraficos(ajustar);visualViewport?.addEventListener("resize",ajustar);';
 const result=installNativeResizeFrameGuard(s);
 assert.ok(result.includes('requestAnimationFrame(()=>{__torre2ResizeFrame=false;ajustar()})'));
 assert.equal((result.match(/scale.resize/g)||[]).length,1);
 assert.equal((result.match(/visualViewport\?\.addEventListener\("resize"/g)||[]).length,2);
 assert.throws(()=>installNativeResizeFrameGuard(result),/already applied/);
});
test('unrecognized native resize/quality source fails closed',()=>{
 assert.throws(()=>installNativeResizeFrameGuard('window.onresize=()=>{}'),/Unrecognized/);
});
