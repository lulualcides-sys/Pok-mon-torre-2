import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const dirs=(await fs.readdir(root)).filter(name=>/^src-[a-f0-9]{10}$/.test(name));
assert.equal(dirs.length,1,'Expected exactly one built native Phaser source version');
const src=path.join(root,dirs[0]);
const sprite=await fs.readFile(path.join(src,'sprites.js'),'utf8');
const exports=[...sprite.matchAll(/export\{([^}]+)\}/g)]
 .flatMap(match=>match[1].split(',').map(name=>name.trim().split(/\s+as\s+/).pop()));
assert.ok(exports.includes('ponerRetratoA'),'Current native sprite module must export its real portrait helper');
for(const scene of ['escenas/liga.js','escenas/seleccion.js']){
 const body=await fs.readFile(path.join(src,scene),'utf8');
 const imported=[...body.matchAll(/import\{([^}]+)\}from["']\.\.\/sprites\.js["'];/g)]
  .flatMap(match=>match[1].split(',').map(name=>name.trim().split(/\s+as\s+/)[0]));
 assert.ok(imported.length>0,scene+' missing native sprite imports');
 const missing=imported.filter(name=>!exports.includes(name));
 assert.deepEqual(missing,[],scene+' imports absent native sprite exports');
}
console.log('PASS_T07_NATIVE_PORTRAIT_EXPORTS',JSON.stringify({version:dirs[0],exports:exports.length,mode:'compiled-native-import-graph; not campaign gameplay'}));
