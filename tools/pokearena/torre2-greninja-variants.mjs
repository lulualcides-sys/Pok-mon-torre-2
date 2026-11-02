/* Exact-source, Kanto-safe installation of the five native Greninja skins.
 * The assets belong to the captured Poké Arena 2D Phaser client: four genuine
 * recolor sprite sheets and the native azabacheaura glow on the black sheet.
 * Do not fabricate/recolor assets, alter damage, moves, saves, or original VFX.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

export const GRENINJA_VARIANTS=Object.freeze([
 {id:'naranja',label:'ORANGE',folder:'naranja'},
 {id:'amarillo',label:'YELLOW',folder:'amarillo'},
 {id:'blanco',label:'WHITE',folder:'blanco'},
 {id:'azabache',label:'BLACK',folder:'azabache'},
 {id:'azabacheaura',label:'RED AURA',folder:'azabache'}
]);
export const GRENINJA_DEX=Object.freeze(['0656','0657','0658']);
const SKIN_FOLDERS=Object.freeze(['naranja','amarillo','blanco','azabache']);

function replaceOnce(source,from,to,label){
 const at=source.indexOf(from);
 if(at<0||source.indexOf(from,at+from.length)>=0)
  throw Error('Greninja skin source changed or ambiguous: '+label);
 return source.slice(0,at)+to+source.slice(at+from.length);
}
export function patchGreninjaAspectSource(source){
 if(typeof source!=='string')throw TypeError('Missing native aspectos.js');
 let s=source;
 s=replaceOnce(s,
  'froakie:["azabacheaura","azabache","blanco","amarillo","naranja"]',
  'froakie:["naranja","amarillo","blanco","azabache","azabacheaura"]',
  'upstream native five Greninja colors');
 s=replaceOnce(s,'azabacheaura:"BLACK",azabache:"BLACK"',
  'azabacheaura:"RED AURA",azabache:"BLACK"',
  'black and red aura separate labels');
 // The original hides BLACK whenever BLACK+RED is unlocked and locks most
 // colors behind Discord. In this independent, free, OFFLINE fan game only,
 // allow both skins together. Do not touch the original client or its server.
 s=replaceOnce(s,'function abiertos(id){',
  'function abiertos(id){if(id==="froakie")return todos(id);',
  'five skins visible with no Discord dependency');
 // Leave the original navy Froakie selected by default rather than silently
 // forcing the first unlocked variant on existing users without preferences.
 s=replaceOnce(s,
  'const p=preferencias()[id];return p==="normal"?null:t.includes(p)?p:t[0]',
  'const p=preferencias()[id];return p==="normal"||id==="froakie"&&p==null?null:t.includes(p)?p:t[0]',
  'preserve native default and existing saved selections');
 return s;
}
export function patchGreninjaSelectionSource(source){
 if(typeof source!=='string')throw TypeError('Missing native selection scene');
 let s=source;
 const original='this._torre2Selecao=soloFormas(m,formasDe(ROSTER.map(p=>p.id)));cargarPMD(this,this._torre2Selecao,["Idle"]);';
 const expanded='const baseDex=formasDe(ROSTER.map(p=>p.id));for(const dex of ["0656","0657","0658"])for(const color of ["naranja","amarillo","blanco","azabache"])baseDex.add(dex+"-"+color);this._torre2Selecao=soloFormas(m,baseDex);cargarPMD(this,this._torre2Selecao,["Idle"]);';
 s=replaceOnce(s,original,expanded,
  'native 3-stage Greninja color Idle preload for 2-player selector');
 s=replaceOnce(s,
  'const t=texto(this,x+21,y+45,a?NOMBRE_ASPECTO[a]??a.toUpperCase():"NORMAL",{tam:8,color:puesta?"#ffd447":"#8fb3e6"})',
  'const t=texto(this,x+21,y+45,a?NOMBRE_ASPECTO[a]??a.toUpperCase():"NORMAL",{tam:a==="azabacheaura"?6:8,color:puesta?"#ffd447":"#8fb3e6"})',
  'red aura name fits its native 46px preview tile');
 // Froakie is a League challenger in the upstream game. Allow its selector
 // entry in our local CPU, training, and local VS only; do not grant League,
 // online or ranked unlocks and do not write to any original account.
 const blocked='const bloqueado=this.modo==="ranked"?!desbloqueadoRanked(p.id):!desbloqueado(p.id);';
 s=replaceOnce(s,blocked,
  'const bloqueado=this.modo==="ranked"?!desbloqueadoRanked(p.id):!(p.id==="froakie"&&["cpu","entreno","versus"].includes(this.modo)||desbloqueado(p.id));',
  'Froakie selectable in our offline Arena without League progress');
 // Upstream draws the skin overlay inside the stats panel container. On
 // Chromium, other scene input regions intercept its clicks. Give ONLY the
 // Froakie popup an independent topmost Phaser container; preserve all 5
 // genuine sprites, every other species' original selector and hit areas.
 s=replaceOnce(s,
  'const s=this.add.container(0,0),W=6+opciones.length*46;',
  'const s=this.add.container(p.id==="froakie"?panel.x:0,p.id==="froakie"?PY:0),W=6+opciones.length*46;if(p.id==="froakie"){s.setDepth(9000);s.setData("torre2-greninja-popup",true)}',
  'the 5 Greninja skin buttons stay above native scene hit zones');
 s=replaceOnce(s,
  'panel.contenido.add(s);panel.selector=s}',
  'if(p.id!=="froakie")panel.contenido.add(s);panel.selector=s}',
  'native standalone Greninja skin popup preserves exact screen coordinates');
 s=replaceOnce(s,
  'panel.mostrado=p?.id??null;panel.contenido?.destroy(true);',
  'panel.mostrado=p?.id??null;if(panel.selector?.getData?.("torre2-greninja-popup"))panel.selector.destroy(true);panel.contenido?.destroy(true);',
  'clean standalone popup on selection change without orphan hitboxes');
 return s;
}
export function patchGreninjaPrepararSource(source){
 if(typeof source!=='string')throw TypeError('Missing six-player Arena scene');
 return replaceOnce(source,
  'import{desbloqueado}from"../liga.js";',
  'import{desbloqueado as desbloqueadoNativo}from"../liga.js";const desbloqueado=id=>id==="froakie"||desbloqueadoNativo(id);',
  'Froakie selectable only in local six-player Arena');
}
export function verifyGreninjaManifest(manifest){
 for(const dex of GRENINJA_DEX){
  for(const folder of SKIN_FOLDERS){
   const key=dex+'-'+folder,entry=manifest?.[key];
   if(!entry||!entry.anims)throw Error('Missing native Greninja manifest: '+key);
   for(const animation of ['Idle','Walk','Attack']){
    const item=entry.anims[animation];
    if(!item?.file||!item?.fw||!item?.fh)
     throw Error('Missing native Greninja '+key+'/'+animation);
    if(item.file!==key+'/'+animation+'-Anim.png')
     throw Error('Unexpected Greninja sprite path: '+item.file);
   }
  }
 }
 return {colors:GRENINJA_VARIANTS.length,spriteFolders:GRENINJA_DEX.length*SKIN_FOLDERS.length,
  redAuraSource:'native sprite.js auraAspecto / azabacheaura'};
}
export async function installGreninjaVariants(dest,clientSource){
 const pmd=path.join(dest,'assets/pmd');
 const manifest=JSON.parse(await fs.readFile(path.join(pmd,'manifest.json'),'utf8'));
 const report=verifyGreninjaManifest(manifest);
 // Guarantee that ALL four sprite families are downloaded by the native
 // capture, rather than merely mentioned in a manifest.
 for(const dex of GRENINJA_DEX)for(const folder of SKIN_FOLDERS){
  const k=dex+'-'+folder;
  for(const file of ['Idle-Anim.png','Walk-Anim.png','Attack-Anim.png','portrait.png'])
   await fs.access(path.join(pmd,k,file));
 }
 const edit=async(filename,patcher)=>{
  const filenameFull=path.join(dest,clientSource,filename);
  const original=await fs.readFile(filenameFull,'utf8');
  const patched=patcher(original);
  if(original===patched)throw Error('Greninja patch did not modify '+filename);
  await fs.writeFile(filenameFull,patched);
 };
 await edit('aspectos.js',patchGreninjaAspectSource);
 await edit('escenas/seleccion.js',patchGreninjaSelectionSource);
 await edit('escenas/preparar.js',patchGreninjaPrepararSource);
 return report;
}
