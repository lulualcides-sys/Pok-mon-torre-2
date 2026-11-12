import test from 'node:test';
import assert from 'node:assert/strict';
import {paginateSelectionSource} from '../tools/pokearena/torre2-selection-pages.mjs';

// Mock only upstream source ANCHORS. No native gameplay, VFX or button logic
// is altered by this compatibility fix.
const shared=[
 'const fila=Math.floor(i/POR_FILA),col=i%POR_FILA;',
 'const enFila=Math.min(POR_FILA,ROSTER.length-fila*POR_FILA);',
 'return this.casilla(p,x0+col*(TW+TGAP),TY+fila*(TH+TGAP),i)',
 'const bloqueado=this.modo==="ranked"?!desbloqueadoRanked(p.id):!desbloqueado(p.id);',
 'if(esTactil()&&this.paso<2&&this.foco!==i){this.foco=i;sfx("seleccion");this.refrescar();return}this.elegir(i)',
 'this.opciones();this.ayuda=',
 'refrescar(){const porId='
].join('');
const old='const POR_FILA=12;const FILAS=Math.ceil(ROSTER.length/POR_FILA);'+shared;
const october='const TY=43,TGAP=2,FILAS=ROSTER.length>13?2:1;'+
 'const POR_FILA=Math.ceil(ROSTER.length/FILAS);'+shared;
test('legacy original two-row grid still receives real native page navigation',()=>{
 const patched=paginateSelectionSource(old);
 assert.ok(patched.includes('Math.min(2,Math.ceil(ROSTER.length/POR_FILA))'));
 assert.ok(patched.includes('const POR_FILA=4;'));
 assert.ok(patched.includes('this.torre2Pages=Math.ceil(ROSTER.length/(POR_FILA*2))'));
 assert.ok(patched.includes('card.objects=this.children.list.slice(before)'));
 assert.ok(patched.includes('this.torre2Page=Math.floor(this.foco/(POR_FILA*2))'));
});
test('Native grid is four columns, two rows, 8 per page',()=>{
 const patched=paginateSelectionSource(october);
 assert.ok(patched.includes('FILAS=2;const POR_FILA=4;'));
 assert.ok(!patched.includes('Math.ceil(ROSTER.length/FILAS)'),
  'Huge dynamic column count makes FIGHT button and roster inaccessible');
 assert.ok(patched.includes('Math.floor((i%(POR_FILA*2))/POR_FILA)'));
 assert.ok(patched.includes('this.torre2PageLabel=texto(this,ANCHO-14'));
 assert.ok(patched.includes('this.torre2PageLabel?.setText("PÁG "'));
 assert.ok(patched.includes('card.page=Math.floor(i/(POR_FILA*2))'));
 assert.ok(patched.includes('this.torre2Pages=Math.ceil(ROSTER.length/(POR_FILA*2))'));
});
test('unsupported upstream code fails closed rather than guessing native hitboxes',()=>{
 assert.throws(()=>paginateSelectionSource('const FILAS=999;'+shared),
  /Unrecognized Poké Arena selection dimensions/);
});

test('Selection pages have direct one-tap mobile picking and only load visible portraits',()=>{
 const patched=paginateSelectionSource(october);
 assert.ok(patched.includes('if(this.paso<2)this.foco=i;this.elegir(i)'));
 assert.ok(patched.includes('this.torre2LoadPortraitPage(this.torre2Page)'));
 assert.ok(patched.includes('this.load.image(key,"assets/pmd/"+c.p.dex+"/portrait.png")'));
 assert.ok(patched.includes('const bloqueado=this.modo==="ranked"?!desbloqueadoRanked(p.id):false'));
});

test('Alpha 0.70.0 challenge draft locks and RANDOM button remain native',()=>{
 const current=october.replace(
  'const bloqueado=this.modo==="ranked"?!desbloqueadoRanked(p.id):!desbloqueado(p.id);',
  'const bloqueado=this.encargo?!!this.encargo.bloqueado?.(p.id):this.modo==="ranked"?!desbloqueadoRanked(p.id):!desbloqueado(p.id);'
 ).replace('this.opciones();this.ayuda=',
  'this.opciones();if(this.encargo?.azar)this.botonAzar=boton(this,76,this.posLuchar.y-4,"RANDOM",()=>this.azarEncargo(),{altoZona:40,anchoExtra:44});this.ayuda=');
 const patched=paginateSelectionSource(current);
 assert.ok(patched.includes('this.encargo?!!this.encargo.bloqueado?.(p.id)'));
 assert.ok(patched.includes('this.modo==="ranked"?!desbloqueadoRanked(p.id):false'));
 assert.ok(patched.includes('if(this.encargo?.azar)this.botonAzar='));
 assert.ok(patched.includes('this.torre2Pages=Math.ceil(ROSTER.length/(POR_FILA*2))'));
 assert.ok(patched.includes('this.torre2LoadPortraitPage(this.torre2Page)'));
});
