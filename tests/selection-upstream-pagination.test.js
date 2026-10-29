import test from 'node:test';
import assert from 'node:assert/strict';
import {paginateSelectionSource} from '../tools/pokearena/torre2-selection-pages.mjs';

// Mock only upstream source ANCHORS. No native gameplay, VFX or button logic
// is altered by this compatibility fix.
const shared=[
 'const fila=Math.floor(i/POR_FILA),col=i%POR_FILA;',
 'const enFila=Math.min(POR_FILA,ROSTER.length-fila*POR_FILA);',
 'return this.casilla(p,x0+col*(TW+TGAP),TY+fila*(TH+TGAP),i)',
 'this.opciones();this.ayuda=',
 'refrescar(){const porId='
].join('');
const old='const POR_FILA=12;const FILAS=Math.ceil(ROSTER.length/POR_FILA);'+shared;
const october='const TY=43,TGAP=2,FILAS=ROSTER.length>13?2:1;'+
 'const POR_FILA=Math.ceil(ROSTER.length/FILAS);'+shared;
test('legacy original two-row grid still receives real native page navigation',()=>{
 const patched=paginateSelectionSource(old);
 assert.ok(patched.includes('Math.min(2,Math.ceil(ROSTER.length/POR_FILA))'));
 assert.ok(patched.includes('this.torre2Pages=Math.ceil(ROSTER.length/(POR_FILA*2))'));
 assert.ok(patched.includes('card.objects=this.children.list.slice(before)'));
 assert.ok(patched.includes('this.torre2Page=Math.floor(this.foco/(POR_FILA*2))'));
});
test('October upstream native grid stays 12 columns, two rows, 24 per page',()=>{
 const patched=paginateSelectionSource(october);
 assert.ok(patched.includes('FILAS=2;const POR_FILA=12;'));
 assert.ok(!patched.includes('Math.ceil(ROSTER.length/FILAS)'),
  'Huge dynamic column count makes FIGHT button and roster inaccessible');
 assert.ok(patched.includes('Math.floor((i%(POR_FILA*2))/POR_FILA)'));
 assert.ok(patched.includes('card.page=Math.floor(i/(POR_FILA*2))'));
 assert.ok(patched.includes('this.torre2Pages=Math.ceil(ROSTER.length/(POR_FILA*2))'));
});
test('unsupported upstream code fails closed rather than guessing native hitboxes',()=>{
 assert.throws(()=>paginateSelectionSource('const FILAS=999;'+shared),
  /Unrecognized Poké Arena selection dimensions/);
});
