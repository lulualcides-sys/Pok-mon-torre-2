import test from 'node:test';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
import {routeInstalledKantoLooseSprites} from '../tools/pokearena/torre2-native-loose-pmd-compat.mjs';
const anchor='const paqueteDe=ruta=>enComun(ruta)?INDICE.comun:INDICE.formas[ruta.split("/")[0]];';
const mock='const enComun=ruta=>ruta.endsWith("/portrait.png")||/\\/(Idle|Walk)-Anim\\.png$/.test(ruta);'+anchor+'function cargarHoja(){}function urlHoja(){}';
function router(source){
 const rule=source.match(/const paqueteDe=ruta=>\{[^;]+;[^;]+;[^;]+\};/);
 assert.ok(rule,'Strictly scoped routing replacement is present');
 return runInNewContext(`(function(INDICE,enComun){${rule[0]}return paqueteDe;})`)({comun:'native-common',formas:{'0001':'native-bulbasaur','0007-squad':'native-squad'}},
  ruta=>ruta.endsWith('/portrait.png')||/\/(Idle|Walk)-Anim\.png$/.test(ruta));
}
test('Kanto SpriteCollab non-indexed portraits and Idle fall back to verified loose PNG',()=>{
 const route=router(routeInstalledKantoLooseSprites(mock));
 assert.equal(route('0016/portrait.png'),null);
 assert.equal(route('0016/Idle-Anim.png'),null);
 assert.equal(route('0016/Attack-Anim.png'),null);
 assert.equal(route('0074/Walk-Anim.png'),null);
});
test('official native pack routing remains byte-for-byte in behavior',()=>{
 const route=router(routeInstalledKantoLooseSprites(mock));
 assert.equal(route('0001/portrait.png'),'native-common');
 assert.equal(route('0001/Idle-Anim.png'),'native-common');
 assert.equal(route('0001/Attack-Anim.png'),'native-bulbasaur');
 assert.equal(route('0007-squad/Idle-Anim.png'),'native-common');
 assert.equal(route('0007-squad/Attack-Anim.png'),'native-squad');
 assert.equal(route('0200/portrait.png'),'native-common');
});
test('unknown native upstream source fails closed and no double patch',()=>{
 assert.throws(()=>routeInstalledKantoLooseSprites('const paqueteDe=ruta=>undefined;'),/changed/);
 const first=routeInstalledKantoLooseSprites(mock);
 assert.throws(()=>routeInstalledKantoLooseSprites(first),/changed/);
});
