import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {verifyPublishedFallback} from '../tools/pokearena/verify-pages-site-fallback.mjs';

const m='src-0123456789';
const core=['config.js','main.js','datos.js','liga.js','retos.js',
 'escenas/carga.js','escenas/titulo.js','escenas/combate.js',
 'escenas/liga.js','torre2/campanha.js','torre2/move-pool.js',
 'torre2/auto-battle.js','torre2/next-specific-fx.js'];
async function put(root,rel,data){
 const f=path.join(root,rel);await fs.mkdir(path.dirname(f),{recursive:true});await fs.writeFile(f,data);
}
async function fixture(fn){
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'torre-fallback-'));
 try{
  await put(dir,'index.html','./arena2d/index.html '.repeat(12));
  await put(dir,'lab.html','<html>Lab</html>'.repeat(25));
  await put(dir,'arena2d/index.html',('juego src="'+m+'/main.js" ').repeat(14));
  await put(dir,'arena2d/version.json',JSON.stringify({src:m,modules:m}));
  await put(dir,'arena2d/lib/phaser.min.js','/*! Phaser */'.repeat(12000));
  await put(dir,'arena2d/assets/pmd/manifest.json',JSON.stringify(
    Object.fromEntries(Array.from({length:18},(_,i)=>['00'+i,{anims:{Idle:{}}}]))));
  for(const name of core)await put(dir,'arena2d/'+m+'/'+name,
    name==='config.js'?'const VERSION="0.65.8";'+' '.repeat(280):
      'export const a = true; '.repeat(20));
  await fn(dir);
 }finally{await fs.rm(dir,{recursive:true,force:true})}
}
test('restores real PMD manifests and approved version',()=>fixture(async dir=>{
 const result=await verifyPublishedFallback(dir);
 assert.equal(result.alpha,'0.65.8');assert.equal(result.pmdForms,18);assert.equal(result.prebuilt,true);
}));
test('missing PMD manifest fails closed',()=>fixture(async dir=>{
 await fs.rm(path.join(dir,'arena2d/assets/pmd/manifest.json'));
 await assert.rejects(verifyPublishedFallback(dir),/Missing|truncated/);
}));
test('a spoofed newer Alpha cannot be advertised as released',()=>fixture(async dir=>{
 await put(dir,'arena2d/'+m+'/config.js','const VERSION="0.69.5";'+' '.repeat(280));
 await assert.rejects(verifyPublishedFallback(dir),/does not match approved/);
}));
test('missing approved move library blocks deployment',()=>fixture(async dir=>{
 await fs.rm(path.join(dir,'arena2d/'+m+'/torre2/move-pool.js'));
 await assert.rejects(verifyPublishedFallback(dir),/Missing\/truncated/);
}));
test('invalid module path is blocked',()=>fixture(async dir=>{
 await put(dir,'arena2d/version.json',JSON.stringify({modules:'src-../../x',src:m}));
 await assert.rejects(verifyPublishedFallback(dir),/hash is invalid/);
}));
