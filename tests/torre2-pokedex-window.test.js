import test from 'node:test';
import assert from 'node:assert/strict';
import {windowNativePokedex} from '../tools/pokearena/torre2-pokedex-window.mjs';

const nativeMock=[
 'preload(){cargarPMD(this,this._torre2DexForms,["Idle"]);}',
 'create(){crearAnimsPMD(this,this._torre2DexForms,["Idle"]);',
 'this.casillas=ROSTER.map((p,i)=>{const rank=TORRE2_DEX_RANK[i],root=TORRE2_DEX_FAMILIES.rootSet.has(i);const v=rank%TORRE2_DEX_PAGE_SIZE;return this.casilla(p,root?GX+(v%COLS)*CEL:-200,root?GY+Math.floor(v/COLS)*CEL:-200,i)});',
 'casilla(p,x,y,i){return{p}}',
 'elegir(i){const root=TORRE2_DEX_FAMILIES.rootIndexForIndex[i]??i;',
 'if(root===this.foco)return;const next=Math.floor(TORRE2_DEX_RANK[root]/TORRE2_DEX_PAGE_SIZE);',
 'if(next!==this.dexPage){this.dexPage=next;for(const[index,c]of this.casillas.entries()){',
 'const show=TORRE2_DEX_FAMILIES.rootSet.has(index)&&',
 'Math.floor(TORRE2_DEX_RANK[index]/TORRE2_DEX_PAGE_SIZE)===next;',
 'c.g.setVisible(show);c.img.setVisible(show);c.zone.setVisible(show);',
 'if(show)c.zone.setInteractive();else c.zone.disableInteractive();}',
 'this.torre2DexLoadPage(next);}',
 'this.dexPageLabel?.setText((this.dexPage+1)+" / "+this.dexPages);',
 'this.foco=root;this.etapa=0;sfx("seleccion");this.refrescar()}',
 'mover(d){return d;}',
 'for(const c of this.casillas||[]){if(!TORRE2_DEX_FAMILIES.rootSet.has(this.casillas.indexOf(c))||Math.floor(TORRE2_DEX_RANK[this.casillas.indexOf(c)]/TORRE2_DEX_PAGE_SIZE)!==page)continue;',
 'const key="retrato-"+c.p.dex;}'
].join('');
test('virtual window bounds actual Phaser cards and retains full logical ROSTER',()=>{
 const s=windowNativePokedex(nativeMock);
 assert.ok(s.includes('this.casillas=ROSTER.map(p=>({p,g:null,img:null,zone:null}))'));
 assert.ok(s.includes('TORRE2_DEX_ORDER.slice(page*TORRE2_DEX_PAGE_SIZE'));
 assert.ok(s.includes('c.zone?.destroy();c.img?.destroy();c.g?.destroy()'));
 assert.ok(s.includes('this.torre2DexMountPage(next)'));
 assert.ok(s.includes('this.__torre2MountedDexPage!==page'));
 assert.ok(!s.includes('this.casillas.indexOf(c)'));
 assert.ok(!s.includes('this.casillas.entries()'));
 assert.ok(s.includes('cargarPMD(this,this._torre2DexForms,[]);'));
 assert.ok(!s.includes('create(){crearAnimsPMD(this,this._torre2DexForms'));
 assert.ok(s.includes('mover(d){return d;}'));
});
test('native source drift fails closed rather than altering battle roster',()=>{
 assert.throws(()=>windowNativePokedex('class Pokedex {}'),/expected once/);
 assert.throws(()=>windowNativePokedex(nativeMock+nativeMock),/expected once/);
});
