import test from 'node:test';
import assert from 'node:assert/strict';
import {windowNativePokedex} from '../tools/pokearena/torre2-pokedex-window.mjs';
const native=[
 'preload(){const m=this.registry.get("manifiesto"),start=Math.floor(this.foco/PAGE_SIZE)*PAGE_SIZE;',
 'this._torre2FirstForms=soloFormas(m,new Set(ROSTER.slice(start,start+PAGE_SIZE).map(p=>p.dex)));',
 'this.torre2DirectLocal(this._torre2FirstForms);',
 'this.torre2DirectLocal(this._torre2JohtoForms);}',
 'create(){crearAnimsPMD(this,this._torre2FirstForms,["Idle"]);',
 'crearAnimsPMD(this,this._torre2JohtoForms,["Idle"]);',
 'this.casillas=ROSTER.map((p,i)=>this.casilla(p,GX+(i%PAGE_SIZE)%COLS*CEL,GY+Math.floor((i%PAGE_SIZE)/COLS)*CEL,i));',
 'this.actualizarPaginaDex();this.refrescar()}',
 'torre2DirectLocal(forms){this.load.spritesheet("sample","/native");return 1;}',
 'torre2CargarPagina(page){',
 'const ids=ROSTER.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE).map(p=>p.dex);',
 'const forms=soloFormas(this.manifiesto,new Set(ids));',
 'const missing=ids.some(dex=>!this.textures.exists("retrato-"+dex)||!this.textures.exists("pmd-"+dex+"-Idle"));',
 'if(!missing){this.actualizarPaginaDex();return;}',
 'const done=()=>{crearAnimsPMD(this,forms,["Idle"]);this.actualizarPaginaDex();};',
 'const count=this.torre2DirectLocal(forms);',
 'if(count||this.load.isLoading()){this.load.once("complete",done);',
 'if(count&&!this.load.isLoading())this.load.start();}else done();',
 '}',
 'torre2EnsureIdle(dex){const forms=soloFormas(this.manifiesto,new Set([dex]));',
 'const count=this.torre2DirectLocal(forms);}',
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

 assert.ok(transformed.includes('ROSTER.slice(start,start+Math.min(PAGE_SIZE,8))'),
  'Only eight small portraits are requested before first paint');
 assert.ok(transformed.includes('this.torre2PortraitOnly(this._torre2FirstForms)'));
 assert.ok(transformed.includes('this.refrescar();this.__torre2PortraitQueue?.clear();this.torre2CargarPagina(this.dexPage)'),
  'Remaining first-page portraits start loading after the first frame');
 assert.ok(transformed.includes('const missing=ids.some(dex=>!this.textures.exists("retrato-"+dex))'));
 assert.ok(transformed.includes('const count=this.torre2PortraitOnly(forms)'));
 assert.ok(transformed.includes('const count=this.torre2DirectLocal(forms)'),
  'Selected evolved Pokemon must still load its animated sprite on demand');
 assert.ok(transformed.includes('for(const dex of ids)this.__torre2PortraitQueue?.delete("retrato-"+dex)'),
  'Failed portraits must be retryable on another visit');

});
test('unknown client variants fail closed instead of mutating source or saves',()=>{
 assert.throws(()=>windowNativePokedex('class Pokedex {}'),/expected once/);
 assert.throws(()=>windowNativePokedex(native+native),/expected once/);
});
