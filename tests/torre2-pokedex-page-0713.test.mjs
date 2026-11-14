import test from 'node:test';
import assert from 'node:assert/strict';
import {paginateModernPokedex0713} from '../tools/pokearena/torre2-pokedex-page-0713.mjs';
const base='import{atacarEnMenu,trioMenu}from"../sprites.js";const out=slot==="e"?["ULT"]:[];';
const grid='const COLS=(()=>{for(let c=5;c<12;c++){const cel=Math.min(44,Math.floor(ANCHO_REJILLA/c));if(Math.ceil(ROSTER.length/c)*cel<=ALTO_REJILLA)return c}return 12})();const CEL=Math.min(44,Math.floor(ANCHO_REJILLA/COLS));';
const cards='this.casillas=ROSTER.map((p,i)=>this.casilla(p,GX+i%COLS*CEL,GY+Math.floor(i/COLS)*CEL,i));';
const cell='casilla(p,x,y,i){casillaRetrato(this,x,y,CEL-2,p.dex);this.add.zone(x+(CEL-2)/2,y+(CEL-2)/2,CEL-2,CEL-2).setInteractive({useHandCursor:true}).on("pointerdown",()=>this.elegir(i));return{p,x,y,w:CEL-2,h:CEL-2}}';
const picker='elegir(i){if(i===this.foco)return;this.foco=i;this.etapa=0;this.alt=0;sfx("seleccion");this.refrescar()}';
const source=base+grid+'class Pokedex extends Phaser.Scene{create(){'+cards+'}'+cell+picker+'movimientos(c,p,et,tam){}'+'}';
test('preserves form/move renderer and installs 25-card interactive pages',()=>{
 const p=paginateModernPokedex0713(source,'0.71.3');
 assert.ok(p.includes('trioMenu'));
 assert.ok(p.includes('movimientos(c,p,et,tam){'));
 assert.ok(p.includes('const COLS=5;const CEL=44;const PAGE_SIZE=COLS*5;'));
 assert.ok(p.includes('c.g.setVisible(on);c.img.setVisible(on);c.zone.setVisible(on)'));
 assert.ok(p.includes('c.zone.disableInteractive()'));
 assert.ok(p.includes('this.dexPage=Math.floor(i/PAGE_SIZE);this.actualizarPaginaDex()'));
 assert.ok(p.includes('irPaginaDex(d){'));
 assert.equal(p.split('casilla(p,x,y,i){').length,2);
});
test('all original & Kanto families remain accessible, no pedestal collision',()=>{
 for(const n of [26,37,120,151,190,240]){
  const seen=new Set();
  for(let page=0;page<Math.ceil(n/25);page++){
   const visible=Array.from({length:Math.min(25,n-page*25)},(_,i)=>page*25+i);
   assert.ok(visible.length>0&&visible.length<=25);
   visible.forEach(i=>{seen.add(i);const y=36+Math.floor((i%25)/5)*44;assert.ok(y+42<=326-22)});
  }
  assert.equal(seen.size,n);
 }
});
test('approved older Alpha stays untouched and new upstream structure fails closed',()=>{
 assert.equal(paginateModernPokedex0713(source,'0.70.0'),source);
 assert.throws(()=>paginateModernPokedex0713(source.replaceAll('trioMenu','removedTrio'),'0.71.3'),/Unrecognized/);
 assert.throws(()=>paginateModernPokedex0713(source.replace('this.casillas=ROSTER.map','this.cells=ROSTER.map'),'0.71.3'),/anchor/);
 assert.throws(()=>paginateModernPokedex0713(source.replace('casillaRetrato(this,x,y,CEL-2,p.dex);','missingSprite();'),'0.71.3'),/anchor/);
});
