import test from 'node:test';
import assert from 'node:assert/strict';
import {paginateSelectionSource} from '../tools/pokearena/torre2-selection-pages.mjs';
import {adaptArenaFamilySelectorSource} from '../tools/pokearena/torre2-arena-family-selector.mjs';

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

 
// Alpha 0.71.2 adds abrirEleccion, which launches the official 4x2
// selection scene. This tiny original fixture models ONLY its public API.
const native0712='const LW=44,LH=44,LG=2;'+
 'const POR_FILA=13;'+
 'function abrirEleccion(escena,opts){return opts.alElegir}'+
 'class SelectorPokemon{constructor(){}elegir(){}cerrar(){}}'+
 'export{POR_FILA,SelectorPokemon,abrirEleccion};';

test('Alpha 0.71 native choice bridge keeps new export and selection scene intact',()=>{
 const adapted=adaptArenaFamilySelectorSource(native0712);
 assert.equal(adapted,native0712);
 assert.match(adapted,/function abrirEleccion/);
 assert.match(adapted,/export\\{POR_FILA,SelectorPokemon,abrirEleccion\\};$/);
});

test('Alpha 0.71 choice bridge with mismatched exports fails closed',()=>{
 const broken=native0712.replace('SelectorPokemon,abrirEleccion};','SelectorPokemon};');
 assert.throws(()=>adaptArenaFamilySelectorSource(broken),
  /Unrecognized native 0\\.71 choice bridge/);
});

test('Alpha 0.71 duplicated selection-bridge functions fail closed',()=>{
 const broken=native0712.replace('class SelectorPokemon{',
  'function abrirEleccion(escena){return escena}class SelectorPokemon{');
 assert.throws(()=>adaptArenaFamilySelectorSource(broken),
  /Unrecognized native 0\\.71 choice bridge/);
});

test('legacy selector without the new choice bridge retains original family page rewrite',()=>{
 const legacy='const LW=44,LH=44,LG=2;const POR_FILA=13;'+
  'class SelectorPokemon{}export{POR_FILA,SelectorPokemon};';
 const adapted=adaptArenaFamilySelectorSource(legacy);
 assert.ok(adapted.includes('buildPokedexFamilies'));
 assert.ok(adapted.includes('PAGE_SIZE=8'));
});
