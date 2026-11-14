import {preserveModernPokedex} from './torre2-pokedex-modern-compat.mjs';
/* Build-only, fail-closed visual customization for four NONCOMBAT screens.
 * The native battle HUD, movement, moves, cooldowns, hitboxes and arena
 * fighting screens MUST NOT be modified by this adapter.
 */
const once=(source,from,to,scope)=>{
 if(source.split(from).length!==2)throw Error('Noncombat button skin: upstream changed '+scope);
 return source.replace(from,to);
};

export function skinMenuScene(source,scene,officialAlpha=null){
 if(typeof source!=='string')throw TypeError('Expected captured Phaser JS');
 if(scene==='seleccion'||scene==='preparar'){
  const match=source.match(/import\{([^}]+)\}from"\.\.\/ui\.js";/);
  if(!match)throw Error('Noncombat skin: original '+scene+' ui import missing');
  const tokens=match[1].split(',');
  if(tokens.filter(t=>t==='boton').length!==1)
   throw Error('Noncombat skin: original '+scene+' boton import ambiguous');
  const original=match[0];
  const modified='import{'+tokens.filter(t=>t!=='boton').join(',')+'}from"../ui.js";'+
   'import{pixelMenuButton as boton}from"../torre2/noncombat-pixel-buttons.js";';
  return once(source,original,modified,scene+' import');
 }
 if(scene==='titulo'){
  const old='marco(b.g,x0,y0,BW,b.h,i===this.foco?"oro":"azul");efectosBoton(b.g,b.luz,x0,y0,BW,b.h,this.time.now)';
  const pixels='marco(b.g,x0,y0,BW,b.h,i===this.foco?"oro":"azul");'+
   // The title uses its own native buttons. Add precise layered pixels only.
   'b.g.fillStyle(i===this.foco?0xfff2ab:0x91dbff,1);'+
   'b.g.fillRect(x0+6,y0+3,9,2);b.g.fillRect(x0+BW-15,y0+3,9,2);'+
   'b.g.fillStyle(i===this.foco?0x98621b:0x082541,1);'+
   'b.g.fillRect(x0+6,y0+b.h-5,BW-12,2);'+
   'b.g.fillStyle(i===this.foco?0xf0ce67:0x68bfe3,1);'+
   'b.g.fillRect(x0+6,y0+6,2,Math.max(1,b.h-12));'+
   'efectosBoton(b.g,b.luz,x0,y0,BW,b.h,this.time.now)';
  return once(source,old,pixels,'titulo pixel borders');
 }
 if(scene==='pokedex'){
  // Alpha 0.71.3 owns an entirely new responsive Pokédex with trio forms.
  // Keep the approved native cosmetics, rather than forcing old coordinates.
  if(officialAlpha==='0.71.3'){
   if(!preserveModernPokedex(source,officialAlpha))
    throw Error('Unrecognized modern Pokédex pixel skin context');
   return source;
  }
  const old='marco(g,x0,PY+3,w,14,i===this.etapa?"oro":"azul");efectosBoton(g,luz,x0,PY+3,w,14,this.time.now)';
  const pixels='marco(g,x0,PY+3,w,14,i===this.etapa?"oro":"azul");'+
   'g.fillStyle(i===this.etapa?0xfff2ac:0x7bd3f3,1);'+
   'g.fillRect(x0+4,PY+5,Math.max(1,w-8),1);'+
   'g.fillStyle(i===this.etapa?0x97641e:0x103353,1);'+
   'g.fillRect(x0+4,PY+14,Math.max(1,w-8),1);'+
   'efectosBoton(g,luz,x0,PY+3,w,14,this.time.now)';
  return once(source,old,pixels,'pokedex evolution tabs');
 }
 throw Error('Noncombat skin refuses to modify unapproved scene '+scene);
}
