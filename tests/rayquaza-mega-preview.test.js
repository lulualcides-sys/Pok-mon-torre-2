import test from 'node:test';
import assert from 'node:assert/strict';
import {
 enableRayquazaForHomologation,rayquazaRequiredSpriteFiles,RAYQUAZA_PREVIEW_SPECIES
} from '../tools/pokearena/torre2-rayquaza-preview.mjs';

const native=({ray='desactivado:"local"',mega=true}={})=>
 'const TODOS=[{desactivado:true,id:"mimikyu",dex:"0778"},'+
 '{'+ray+',id:"rayquaza",dex:"0384",kit:{lmb:{nombre:"Dragon Claw"},'+
 'rmb:{nombre:"Twister"},q:{...mov("dragonDance")},'+
 'esp:{...mov("extremeSpeed")},e:{nombre:"Dragon Ascent"}},'+
 'evoluciones:[{dex:"0384"},{'+(mega?'mega:{dex:"0384-0001",nombre:"MEGA RAYQUAZA",kit:{rmb:{nombre:"Hurricane"}}':'')+'}]}];'+
 'const ROSTER=TODOS.filter(p=>!p.desactivado||p.desactivado==="local"&&EN_LOCAL);';

test('enable only native Rayquaza in the isolated copy, keep Mimikyu disabled',()=>{
 const original=native();
 const modified=enableRayquazaForHomologation(original);
 assert.ok(modified.includes('desactivado:false,id:"rayquaza",dex:"0384"'));
 assert.ok(modified.includes('desactivado:true,id:"mimikyu"'));
 assert.equal(enableRayquazaForHomologation(modified),modified,'idempotent preparation');
 assert.equal((modified.match(/id:"rayquaza"/g)||[]).length,1);
 assert.equal(RAYQUAZA_PREVIEW_SPECIES.megaDex,'0384-0001');
});

test('upstream kit changed or disabled twice: fail safely',()=>{
 assert.throws(()=>enableRayquazaForHomologation(native({mega:false})),/Mega kit changed|kit changed/i);
 assert.throws(()=>enableRayquazaForHomologation(native({ray:'desactivado:true'})),/missing or duplicated/i);
 assert.throws(()=>enableRayquazaForHomologation(native()+native()),/missing or duplicated/i);
});

test('required native normal and Mega sprite sheets cannot be missing',()=>{
 const create=dex=>({anims:Object.fromEntries(
  ['Idle','Walk','Attack','Shoot','Hop'].map(name=>[name,{file:dex+'/'+name+'-Anim.png'}])
 )});
 const manifest={'0384':create('0384'),'0384-0001':create('0384-0001')};
 assert.equal(rayquazaRequiredSpriteFiles(manifest).length,10);
 delete manifest['0384-0001'].anims.Hop;
 assert.throws(()=>rayquazaRequiredSpriteFiles(manifest),/0384-0001 Hop/);
 manifest['0384-0001'].anims.Hop={file:'../other/secret.png'};
 assert.throws(()=>rayquazaRequiredSpriteFiles(manifest),/unsafe/);
});
