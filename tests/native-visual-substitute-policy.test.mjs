import test from 'node:test';
import assert from 'node:assert/strict';
import {ALLOWED_VISUAL_SUBSTITUTES,validPng} from '../tools/pokearena/stage-licensed-visual-substitutes.mjs';
import {routeInstalledKantoLooseSprites} from '../tools/pokearena/torre2-native-loose-pmd-compat.mjs';
const native='const enComun=ruta=>ruta.endsWith("/portrait.png");const paqueteDe=ruta=>enComun(ruta)?INDICE.comun:INDICE.formas[ruta.split("/")[0]];function cargarHoja(){}function urlHoja(){}';
const nativeIndex={comun:'original-common',formas:{
 '0007':'squirtle-original','0007-squad':'squad-original','0094':'gengar-original',
 '0146':'moltres-original','0146-aureo':'moltres-aureo-original'
}};
function route(ids){
 const patched=routeInstalledKantoLooseSprites(native,ids);
 const snippet=patched.match(/const paqueteDe=ruta=>\{[^;]+;[^;]+;[^;]+\};/);
 assert.ok(snippet,'All modifications isolated to recognized native pack resolver');
 return Function('INDICE','enComun',snippet[0]+'return paqueteDe;')(
  nativeIndex,ruta=>ruta.endsWith('/portrait.png'));
}
test('exact inaccessible official IDs are known; no broad substitution of approved art',()=>{
 assert.equal(ALLOWED_VISUAL_SUBSTITUTES.length,19);
 assert.equal(new Set(ALLOWED_VISUAL_SUBSTITUTES).size,19);
 assert.ok(!ALLOWED_VISUAL_SUBSTITUTES.includes('0007'));
 assert.ok(!ALLOWED_VISUAL_SUBSTITUTES.includes('0094'));
});
test('a verified missing skin uses its local licensed PNG, never calls the unavailable .bin',()=>{
 const f=route(['0007-squad','0146-aureo']);
 assert.equal(f('0007-squad/Idle-Anim.png'),null);
 assert.equal(f('0007-squad/portrait.png'),null);
 assert.equal(f('0146-aureo/Attack-Anim.png'),null);
 assert.equal(f('0007/Attack-Anim.png'),'squirtle-original');
 assert.equal(f('0094/Attack-Anim.png'),'gengar-original');
 assert.equal(f('0146/Attack-Anim.png'),'moltres-original');
});
test('unapproved or duplicate fallback IDs are rejected',()=>{
 assert.throws(()=>routeInstalledKantoLooseSprites(native,['0007']),/Unsafe/);
 assert.throws(()=>routeInstalledKantoLooseSprites(native,['0146','0146']),/duplicate/);
});
test('fallback PNG must have compatible original PMD sheet dimensions',()=>{
 const png=Buffer.alloc(160);
 Buffer.from([137,80,78,71,13,10,26,10]).copy(png);
 png.writeUInt32BE(32*8,16);png.writeUInt32BE(32*8,20);
 assert.equal(validPng(png,{fw:32,fh:32,durations:Array(8).fill(1)}),true);
 assert.equal(validPng(png,{fw:48,fh:56,durations:Array(8).fill(1)}),false);
 assert.equal(validPng(Buffer.from('not-png'),null),false);
});

test('new Alpha 0.71.3 priorities may use only actually installed licensed PNGs',()=>{
 const f=route(['0132','0133','0480']);
 assert.equal(f('0132/Idle-Anim.png'),null);
 assert.equal(f('0133/portrait.png'),null);
 assert.equal(f('0480/Attack-Anim.png'),null);
 assert.equal(f('0094/Attack-Anim.png'),'gengar-original');
 assert.equal(f('0007/Attack-Anim.png'),'squirtle-original');
 assert.throws(()=>routeInstalledKantoLooseSprites(native,['0483']),/Unsafe/);
});
