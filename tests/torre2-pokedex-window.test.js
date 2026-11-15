import test from 'node:test';
import assert from 'node:assert/strict';
import {windowNativePokedex} from '../tools/pokearena/torre2-pokedex-window.mjs';
const native=[
 'preload(){this.torre2DirectLocal(this._torre2JohtoForms);}',
 'create(){crearAnimsPMD(this,this._torre2JohtoForms,["Idle"]);',
 'this.casillas=ROSTER.map((p,i)=>this.casilla(p,GX+(i%PAGE_SIZE)%COLS*CEL,GY+Math.floor((i%PAGE_SIZE)/COLS)*CEL,i));',
 'this.actualizarPaginaDex();}',
 'torre2CargarPagina(page){this.actualizarPaginaDex();}',
 'actualizarPaginaDex(){const start=this.dexPage*PAGE_SIZE;',
 'this.casillas.forEach((c,i)=>{const on=i>=start&&i<start+PAGE_SIZE;',
 'c.g.setVisible(on);c.img.setVisible(on);c.zone.setVisible(on);});',
 'this.rotuloPagina?.setText("1");}',
 'controlesPaginaDex(){this.actualizarPaginaDex();}',
 'casilla(p,x,y,i){return{p,x,y,g:{},img:{},zone:{}}}',
 'elegir(i){this.foco=i;this.dexPage=Math.floor(i/PAGE_SIZE);',
 'this.actualizarPaginaDex();this.torre2CargarPagina(this.dexPage);}',
 'mover(d){return d;}'
].join('');
test('real Alpha 0.71.3 keeps all logical slots but only PAGE_SIZE graphical cards',()=>{
 const transformed=windowNativePokedex(native);
 assert.ok(transformed.includes('this.casillas=ROSTER.map(p=>({p,g:null,img:null,zone:null}))'));
 assert.ok(transformed.includes('for(let i=page*PAGE_SIZE;i<Math.min(ROSTER.length,(page+1)*PAGE_SIZE);i++)'));
 assert.ok(transformed.includes('c.zone?.destroy();c.img?.destroy();c.g?.destroy()'));
 assert.ok(!transformed.includes('this.casillas.forEach'));
 assert.ok(transformed.includes('this.torre2DexMountPage(this.dexPage)'));
 assert.ok(transformed.includes('this.torre2CargarPagina(this.dexPage)'));
 assert.ok(!transformed.includes('this.torre2DirectLocal(this._torre2JohtoForms)'));
 assert.ok(!transformed.includes('crearAnimsPMD(this,this._torre2JohtoForms,["Idle"])'));
 assert.ok(transformed.includes('mover(d){return d;}'));
});
test('unknown client variants fail closed instead of mutating source or saves',()=>{
 assert.throws(()=>windowNativePokedex('class Pokedex {}'),/expected once/);
 assert.throws(()=>windowNativePokedex(native+native),/expected once/);
});
