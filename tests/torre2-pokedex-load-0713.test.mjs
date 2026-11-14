import test from 'node:test';
import assert from 'node:assert/strict';
import {loadModernPokedexPage0713} from '../tools/pokearena/torre2-pokedex-load-0713.mjs';
import {paginateModernPokedex0713} from '../tools/pokearena/torre2-pokedex-page-0713.mjs';
const initial='import{atacarEnMenu,trioMenu}from"../sprites.js";'+
 'const COLS=(()=>{for(let c=5;c<12;c++){const cel=Math.min(44,Math.floor(ANCHO_REJILLA/c));if(Math.ceil(ROSTER.length/c)*cel<=ALTO_REJILLA)return c}return 12})();const CEL=Math.min(44,Math.floor(ANCHO_REJILLA/COLS));'+
 'const out=slot==="e"?["ULT"]:[];class Pokedex extends Phaser.Scene{'+
 'constructor(){super("pokedex")}init(datos){this.foco=Math.max(0,ROSTER.findIndex(p=>p.id===datos?.id));this.etapa=0;this.alt=0}'+
 'create(){this.manifiesto=this.registry.get("manifiesto");'+
 'this.casillas=ROSTER.map((p,i)=>this.casilla(p,GX+i%COLS*CEL,GY+Math.floor(i/COLS)*CEL,i));}'+
 'casilla(p,x,y,i){casillaRetrato(this,x,y,CEL-2,p.dex);this.add.zone(x+(CEL-2)/2,y+(CEL-2)/2,CEL-2,CEL-2).setInteractive({useHandCursor:true}).on("pointerdown",()=>this.elegir(i));return{p,x,y,w:CEL-2,h:CEL-2}}'+
 'elegir(i){if(i===this.foco)return;this.foco=i;this.etapa=0;this.alt=0;sfx("seleccion");this.refrescar()}'+
 'peana(et,celebrar){this.sprite?.destroy();const m=this.manifiesto[et.dex];}movimientos(c,p,et,tam){}}';
const paged=paginateModernPokedex0713(initial,'0.71.3');
test('initial preload loads ONLY the visible page and makes Idle animations',()=>{
 const src=loadModernPokedexPage0713(paged,'0.71.3');
 assert.ok(src.includes('preload(){const m=this.registry.get("manifiesto"),start=Math.floor(this.foco/PAGE_SIZE)*PAGE_SIZE'));
 assert.ok(src.includes('cargarPMD(this,this._torre2FirstForms,["Idle"])'));
 assert.ok(src.includes('crearAnimsPMD(this,this._torre2FirstForms,["Idle"])'));
 assert.ok(src.includes('c.img.setVisible(on&&ready)'));
});
test('next page and evolution load on demand without hiding active cards',()=>{
 const src=loadModernPokedexPage0713(paged,'0.71.3');
 assert.ok(src.includes('torre2CargarPagina(page){'));
 assert.ok(src.includes('this._torre2PagesPending??=new Set()'));
 assert.ok(src.includes('const ids=ROSTER.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE)'));
 assert.ok(src.includes('const count=cargarPMD(this,forms,["Idle"])'));
 assert.ok(src.includes('torre2EnsureIdle(dex){'));
 assert.ok(src.includes('if(!this.textures.exists("pmd-"+et.dex+"-Idle"))'));
});
test('old released clients untouched; invalid or duplicate new scene fails closed',()=>{
 assert.equal(loadModernPokedexPage0713(initial,'0.70.0'),initial);
 assert.throws(()=>loadModernPokedexPage0713(initial,'0.71.3'),/Unexpected newer/);
 assert.throws(()=>loadModernPokedexPage0713(paged.replace('this.actualizarPaginaDex();this.controlesPaginaDex();',''), '0.71.3'),/Unexpected newer/);
 assert.throws(()=>loadModernPokedexPage0713(paged+paged,'0.71.3'),/anchor/);
});
