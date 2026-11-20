import test from 'node:test';
import assert from 'node:assert/strict';
import {removeMessagesTitleButton} from '../tools/pokearena/torre2-title-pokedex-fast.mjs';

const CORNER='[["regalo",600],["mensaje",576],["tiktok",552],["youtube",528],["instagram",504],["discord",D]]';
test('0.77.3 title loses the MESSAGES envelope; 0.76.2 title is unchanged',()=>{
 const t0773='x;'+CORNER+'.forEach(([id,x])=>id==="regalo"?this.botonRegalos(x,Y):id==="mensaje"?this.botonMensajes(x,Y):icono(id,x));';
 const out=removeMessagesTitleButton(t0773);
 assert.ok(!out.includes('["mensaje",'));
 assert.ok(out.includes('["regalo",576]'));
 const t0762='x;[["regalo",600],["tiktok",576]].forEach(()=>{})';
 assert.equal(removeMessagesTitleButton(t0762),t0762);
 assert.throws(()=>removeMessagesTitleButton('this.botonMensajes(x,Y) without the known corner list'));
});
