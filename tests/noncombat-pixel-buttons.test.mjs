import test from 'node:test';
import assert from 'node:assert/strict';
import {skinMenuScene} from '../tools/pokearena/torre2-noncombat-button-skin.mjs';

test('premium menus replace only the native button import, never global UI or HUD',()=>{
 for(const scene of ['seleccion','preparar']){
  const initial='import{cabecera,boton,marco,UI}from"../ui.js";\n'+
   'class Prueba extends Phaser.Scene{create(){this.b=boton(this,20,20,"PLAY",()=>{})}}';
  const updated=skinMenuScene(initial,scene);
  assert.ok(updated.includes('import{cabecera,marco,UI}from"../ui.js";'));
  assert.ok(updated.includes('import{pixelMenuButton as boton}from"../torre2/noncombat-pixel-buttons.js";'));
  assert.equal(updated.split('boton(this').length,2);
  assert.ok(!updated.includes('escenas/combate'));
 }
});
test('title and Pokédex gain pixel highlights without altering click listeners',()=>{
 const title='pintarBoton(b,i){marco(b.g,x0,y0,BW,b.h,i===this.foco?"oro":"azul");efectosBoton(b.g,b.luz,x0,y0,BW,b.h,this.time.now)}';
 const t=skinMenuScene(title,'titulo');
 assert.ok(t.includes('fillRect(x0+6,y0+3'));
 assert.ok(t.includes('efectosBoton(b.g,b.luz'));
 const dex='const pintar=()=>{g.clear();marco(g,x0,PY+3,w,14,i===this.etapa?"oro":"azul");efectosBoton(g,luz,x0,PY+3,w,14,this.time.now)};const z=this.add.zone(x+w/2,PY+10,w+4,22).setInteractive()';
 const p=skinMenuScene(dex,'pokedex');
 assert.ok(p.includes('fillRect(x0+4,PY+5'));
 assert.ok(p.includes('setInteractive()'));
});
test('abort for combat scenes and unknown source instead of changing gameplay',()=>{
 for(const scene of ['combate','batalla','hud','tactil','main'])
  assert.throws(()=>skinMenuScene('const attack=1;',scene),/refuses/);
 assert.throws(()=>skinMenuScene('const begin=1;','titulo'),/upstream changed/);
 assert.throws(()=>skinMenuScene('const begin=1;','preparar'),/import missing/);
});

// Match the Alpha 0.63.6 native ui.js public interface. A missing ancho()
// crashes the actual arena selection before the scene becomes active.
test('premium menu retains native ancho and apagar methods',async()=>{
 const {readFileSync}=await import('node:fs');
 const code=readFileSync('tools/pokearena/torre2-noncombat-pixel-buttons.js','utf8');
 for(const method of ['activar(value)','apagar(value)','texto(value)','mostrar(value)','mover(nx,ny)','ancho(){return dimensions().w}','capa(depth)','destruir()'])
  assert.ok(code.includes(method),'Missing native button method: '+method);
});

// Preserve original PLAY item ordering; only shrink when the menu overlaps ground.
test('PLAY responsive layout preserves all original actions and does not touch battle scenes',()=>{
 const skin='marco(b.g,x0,y0,BW,b.h,i===this.foco?"oro":"azul");efectosBoton(b.g,b.luz,x0,y0,BW,b.h,this.time.now)';
 const setup='const ops=MENUS[menu],{y,paso,alto=BH}=DISPOSICION[menu];this.botones=ops.map((o,i)=>this.boton(o,i,y+i*paso,paso,alto));';
 const output=skinMenuScene('pintarBoton(){'+skin+'};abrirMenu(menu){'+setup+'}', 'titulo');
 assert.ok(output.includes('if(menu==="jugar"&&ops.length>1'));
 assert.ok(output.includes('for(const h of [alto,26,24,22])'));
 assert.ok(output.includes('this.botones=ops.map((o,i)=>this.boton(o,i,y+i*paso,paso,alto))'));
 assert.ok(!output.includes(setup),'Upstream overlapping fixed layout must be replaced');
 assert.equal(output.includes('escenas/combate'),false);
 assert.throws(()=>skinMenuScene('pintarBoton(){'+skin+'}', 'titulo'),/upstream changed titulo responsive PLAY submenu layout/);
});
