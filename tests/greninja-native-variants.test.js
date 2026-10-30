import test from 'node:test';
import assert from 'node:assert/strict';
import {
 GRENINJA_VARIANTS,GRENINJA_DEX,
 patchGreninjaAspectSource,patchGreninjaSelectionSource,
 patchGreninjaPrepararSource,verifyGreninjaManifest
} from '../tools/pokearena/torre2-greninja-variants.mjs';
const upstreamAspects=`const ASPECTOS={froakie:["azabacheaura","azabache","blanco","amarillo","naranja"]};const NOMBRE_ASPECTO={azabacheaura:"BLACK",azabache:"BLACK"};function abiertos(id){const t=todos(id);return t}function aspectoDe(id){const t=abiertos(id);const p=preferencias()[id];return p==="normal"?null:t.includes(p)?p:t[0]}`;
test('all five distinct native colors (black and red aura are two choices)',()=>{
 assert.deepEqual(GRENINJA_VARIANTS.map(v=>v.id),
  ['naranja','amarillo','blanco','azabache','azabacheaura']);
 assert.equal(new Set(GRENINJA_VARIANTS.map(x=>x.folder)).size,4,
  'The red-aura skin uses the original BLACK sheet + native red glow');
 assert.deepEqual(GRENINJA_DEX,['0656','0657','0658']);
});
test('upstream source becomes five unlocked local options with a normal default',()=>{
 const s=patchGreninjaAspectSource(upstreamAspects);
 assert.match(s,/froakie:\["naranja","amarillo","blanco","azabache","azabacheaura"\]/);
 assert.match(s,/id==="froakie"\)return todos\(id\)/);
 assert.match(s,/azabacheaura:"RED AURA",azabache:"BLACK"/);
 assert.match(s,/id==="froakie"&&p==null/);
 assert.ok(!s.includes('froakie:["azabacheaura","azabache"'));
 assert.throws(()=>patchGreninjaAspectSource(s),/changed or ambiguous/,
  'Do not patch a previously altered source twice');
});
test('upstream other-Pokémon unlocks and account flags are untouched',()=>{
 const s=patchGreninjaAspectSource(upstreamAspects);
 assert.match(s,/function abiertos\(id\)\{if\(id==="froakie"\)return todos\(id\);const t=todos\(id\);/);
 assert.equal((s.match(/function abiertos/g)||[]).length,1);
 assert.equal((s.match(/function aspectoDe/g)||[]).length,1);
});
test('Arena selection preloads sprites and labels RED AURA without ranked unlock',()=>{
 const source=`class Seleccion{preload(){this._torre2Selecao=soloFormas(m,formasDe(ROSTER.map(p=>p.id)));cargarPMD(this,this._torre2Selecao,["Idle"]);}versiones(){const t=texto(this,x+21,y+45,a?NOMBRE_ASPECTO[a]??a.toUpperCase():"NORMAL",{tam:8,color:puesta?"#ffd447":"#8fb3e6"})}casilla(p){const bloqueado=this.modo==="ranked"?!desbloqueadoRanked(p.id):!desbloqueado(p.id);}}`;
 const patched=patchGreninjaSelectionSource(source);
 assert.match(patched,/for\(const dex of \["0656","0657","0658"\]\)/);
 assert.match(patched,/tam:a==="azabacheaura"\?6:8/);
 assert.match(patched,/this.modo==="ranked"\?\!desbloqueadoRanked\(p.id\)/);
 assert.match(patched,/\["cpu","entreno","versus"\]/);
 assert.throws(()=>patchGreninjaSelectionSource(patched),/changed or ambiguous/);
});
test('Six-player local Arena allows Froakie but never alters league.js',()=>{
 const source='import{desbloqueado}from"../liga.js";';
 const altered=patchGreninjaPrepararSource(source);
 assert.match(altered,/const desbloqueado=id=>id==="froakie"\|\|desbloqueadoNativo\(id\)/);
 assert.match(altered,/desbloqueado as desbloqueadoNativo/);
 assert.throws(()=>patchGreninjaPrepararSource(altered),/changed or ambiguous/);
});
test('12 genuine native Greninja sheet families are mandatory',()=>{
 const m={};
 for(const d of GRENINJA_DEX)for(const color of ['naranja','amarillo','blanco','azabache']){
  const key=d+'-'+color,anims={};
  for(const a of ['Idle','Walk','Attack'])anims[a]={file:key+'/'+a+'-Anim.png',fw:32,fh:32};
  m[key]={anims};
 }
 const info=verifyGreninjaManifest(m);
 assert.deepEqual(info.colors,5);
 assert.deepEqual(info.spriteFolders,12);
 delete m['0658-azabache'].anims.Walk;
 assert.throws(()=>verifyGreninjaManifest(m),/Missing native Greninja 0658-azabache\/Walk/);
});
