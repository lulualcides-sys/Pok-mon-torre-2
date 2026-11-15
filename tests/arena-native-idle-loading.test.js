import test from 'node:test';
import assert from 'node:assert/strict';
import {loadNativeArenaPreviewIdle} from '../tools/pokearena/torre2-native-arena-preview.mjs';
const tick=String.fromCharCode(96),dollar=String.fromCharCode(36);
const oldImport='import{atacarEnMenu,precargarLineas,alTerminarCarga,dexAspecto,auraAspecto,encajarSprite,trioMenu}from"../sprites.js";';
const block='if(!this.anims.exists('+tick+dollar+'{dex}-Idle-0'+tick+')){this.__torre2PreviewQueued??=new Set();if(!this.__torre2PreviewQueued.has(dex)){this.__torre2PreviewQueued.add(dex);precargarLineas(this,[pl.id],[aspecto]);alTerminarCarga(this,()=>{if(this.scene.isActive()&&this.anims.exists('+tick+dollar+'{dex}-Idle-0'+tick+')){t.mostrado=null;this.refrescar()}})}c.add(texto(this,52,55,"LOADING...",{tam:7}).setOrigin(.5));return}';
test('every six-slot Arena card only loads its own approved native Idle sprite',()=>{
 const code=loadNativeArenaPreviewIdle(oldImport+'\nfunction pintarPlaza(){'+block+'}');
 assert.match(code,/soloFormas\(this\.registry\.get\("manifiesto"\),new Set\(\[dex\]\)\)/);
 assert.match(code,/const count=cargarPMD\(this,forms,\["Idle"\]\)/);
 assert.match(code,/crearAnimsPMD\(this,forms,\["Idle"\]\)/);
 assert.ok(!code.slice(code.indexOf('function pintarPlaza')).includes('precargarLineas('),
  'Never request full families for six random Arena cards');
 assert.match(code,/this\.__torre2PreviewQueued\.delete\(dex\)/);
 assert.match(code,/this\.__torre2PreviewFailedAt\.set\(dex,this\.time\.now\)/);
 assert.match(code,/this\.time\.now-failedAt>8000/);
 assert.match(code,/SPRITE UNAVAILABLE/);
 assert.match(code,/for\(const card of this\.tarjetas\|\|\[\]\)/);
});
test('unknown source/duplicate panels fail closed instead of writing incomplete sprite fixes',()=>{
 assert.throws(()=>loadNativeArenaPreviewIdle(oldImport+'class Preparar{}'),/source drift/);
 assert.throws(()=>loadNativeArenaPreviewIdle(oldImport+block+block),/source drift/);
 assert.throws(()=>loadNativeArenaPreviewIdle(oldImport.replace('precargarLineas','unknown')+block),/source drift/);
});
