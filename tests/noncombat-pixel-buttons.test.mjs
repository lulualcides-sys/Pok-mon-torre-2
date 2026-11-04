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

// Regression: the public Alpha 0.63.6 ui.js exports boton.ancho() and
// boton.apagar(). Missing either silently crashed the original TRAINING route.
test('original native menu button API remains complete with premium skin',async()=>{
 const {readFileSync}=await import('node:fs');
 const custom=readFileSync('tools/pokearena/torre2-noncombat-pixel-buttons.js','utf8');
 for(const method of ['activar(value)','apagar(value)','texto(value)','mostrar(value)','mover(nx,ny)','ancho(){return dimensions().w}','capa(depth)','destruir()'])
  assert.ok(custom.includes(method),'Missing native boton method: '+method);
 assert.ok(custom.includes('dimmed?.45:1'));
});