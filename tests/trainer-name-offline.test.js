import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {patchAccountRequirement,patchAccountScene,readTrainerName,TRAINER_NAME_KEY} from '../tools/pokearena/torre2-trainer-name.mjs';

const red='const q=1;const pideCuenta=()=>!red.ficha&&!red.cuenta&&!red.sinCuentaHoy&&(q.get("cuenta")==="1");';
const cuenta='class Cuenta extends Phaser.Scene{create(){const d=this.datos;this.modo=d.modo??"crear";this.ocupado=false}seguir(){}}';

test('saved trainer name means the online account is never required',()=>{
 const out=patchAccountRequirement(red);
 assert.match(out,/const pideCuenta=\(\)=>!torre2TrainerName\(\)&&!red\.ficha&&/);
 assert.ok(out.includes('localStorage.getItem("'+TRAINER_NAME_KEY+'")'));
 assert.throws(()=>patchAccountRequirement('const pideCuenta=()=>true;'),/base client changed/);
});

test('only the mandatory first-launch account screen becomes the name screen',()=>{
 const out=patchAccountScene(cuenta);
 assert.ok(out.includes('create(){const d=this.datos;if(d.obligatorio)return this.torre2Nome();this.modo=d.modo??"crear";'));
 assert.match(out,/torre2Nome\(\)\{cabecera\(this,"BEM-VINDO, TREINADOR"\)/);
 assert.match(out,/localStorage\.setItem\("torre2-trainer-name",nome\)/);
 assert.match(out,/red\.sinCuentaHoy=true;sfx\("seleccion"\);this\.seguir\(\)/);
 // Optional online account flow is left intact.
 assert.ok(out.includes('this.ocupado=false'));
 assert.throws(()=>patchAccountScene('create(){}'),/base client changed/);
});

test('readTrainerName survives blocked storage',()=>{
 assert.equal(readTrainerName({getItem:()=>{throw Error('denied')}}),null);
 assert.equal(readTrainerName({getItem:k=>k===TRAINER_NAME_KEY?'Ash':null}),'Ash');
});

test('publisher writes both patched modules and the workflow watches the patch',()=>{
 const pub=readFileSync(new URL('../tools/pokearena/publish-alpha0762.mjs',import.meta.url),'utf8');
 assert.match(pub,/writeFile\(path\.join\(dest,'red\.js'\),redPatched\)/);
 assert.match(pub,/writeFile\(path\.join\(dest,'escenas\/cuenta\.js'\),accountPatched\)/);
 const wf=readFileSync(new URL('../.github/workflows/torre2-alpha0762-publish.yml',import.meta.url),'utf8');
 assert.equal(wf.split("'tools/pokearena/torre2-trainer-name.mjs'").length,3);
});

test('boy/girl choice is saved and drives the FireRed player sprite',async()=>{
 const {patchAccountScene:patch,TRAINER_GENDER_KEY}=await import('../tools/pokearena/torre2-trainer-name.mjs');
 const out=patch('class Cuenta extends Phaser.Scene{create(){const d=this.datos;this.modo=d.modo??"crear";}}');
 assert.ok(out.includes('["red","red_normal"')&&out.includes('["leaf","green_normal"'));
 assert.ok(out.includes('localStorage.setItem("'+TRAINER_GENDER_KEY+'",genero)'));
 const {playerSpriteId}=await import('../tools/pokearena/torre2-frlg-npc.js');
 assert.equal(playerSpriteId({getItem:()=>'leaf'}),'green_normal');
 assert.equal(playerSpriteId({getItem:()=>null}),'red_normal');
 assert.equal(playerSpriteId({getItem:()=>{throw Error('denied')}}),'red_normal');
});
