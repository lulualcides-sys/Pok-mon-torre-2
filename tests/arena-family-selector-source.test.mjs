import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {adaptArenaFamilySelectorSource} from '../tools/pokearena/torre2-arena-family-selector.mjs';

test('patches only the 13-column Arena popup, preserving native exports',()=>{
 const old='import{ROSTER}from"./datos.js";'+
  'const LW=44,LH=44,LG=2;'+
  'const POR_FILA=Math.min(13,Math.ceil(ROSTER.length/Math.ceil(ROSTER.length/13)));'+
  'class SelectorPokemon{};export{POR_FILA,SelectorPokemon};';
 const revised=adaptArenaFamilySelectorSource(old);
 assert.match(revised,/const POR_FILA=4,FILAS=2,PAGE_SIZE=8/);
 assert.match(revised,/buildPokedexFamilies\(ROSTER,JOHTO_100_ROWS,LEVEL_EVOLUTIONS\)/);
 assert.match(revised,/this\.order\.slice\(this\.page\*PAGE_SIZE/);
 assert.match(revised,/forms\(root\)/);
 assert.match(revised,/this\.elegir\(f\.index\)/);
 assert.match(revised,/this\.alElegir\?\.\(p.id,k\)/);
 assert.match(revised,/this\.bloqueado\?\.\(p.id\)/);
 assert.match(revised,/this\.addPortrait\(cas\.img,p\.dex,LW\)/);
 assert.doesNotMatch(revised,/Math\.min\(13,Math\.ceil\(ROSTER\.length/);
 assert.ok(old.includes('POR_FILA=Math.min(13'),'original fixture preserved');
 const dir=mkdtempSync(join(tmpdir(),'arena-family-selector-'));
 try{
  const file=join(dir,'selector.mjs');
  writeFileSync(file,revised);
  const check=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  assert.equal(check.status,0,check.stderr);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
test('fails closed if upstream changes the selector structure',()=>{
 assert.throws(()=>adaptArenaFamilySelectorSource('const POR_FILA=13;'),
  /Unknown native SelectorPokemon/);
});
