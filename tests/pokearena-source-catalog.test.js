import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const script=path.join(root,'tools/pokearena/sync-source-moves.mjs');
const move=(name,pokemon='pikachu')=>({
 name,types:['electric'],forms:['bolt'],sources:['active'],
 examples:[{pokemon,stage:pokemon,slot:'q'}]
});
test('catalog captures a versioned baseline, then detects a new move and Deoxys without modifying approved code',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'p2catalog-'));
 const source=path.join(dir,'source.json'),output=path.join(dir,'catalog.json'),changes=path.join(dir,'changes.json');
 function run(){
  return spawnSync(process.execPath,[script,source,output,changes],{cwd:root,encoding:'utf8'});
 }
 try{
  const audit={source:'https://www.pokearena2d.com/',version:{modules:'src-1234567890'},
   siteVersion:'src-aabbccddee',
   deduplication:{collisions:[],duplicatedSelections:[]},
   originalMoves:[...Array.from({length:99},(_,i)=>move('Synthetic Move '+i)),move('Thunderbolt')]};
  fs.writeFileSync(source,JSON.stringify(audit));
  const initial=run();
  assert.equal(initial.status,0,initial.stderr);
  const baseline=JSON.parse(fs.readFileSync(output,'utf8'));
  assert.equal(baseline.originalMoveCount,100);
  assert.equal(baseline.siteVersion,'src-aabbccddee');
  assert.ok(baseline.moves.some(m=>m.name==='Thunderbolt'&&
    m.compatibleKantoByVerifiedLevelUp.some(p=>p.species==='pikachu')));
  assert.equal(JSON.parse(fs.readFileSync(changes,'utf8')).comparison,'initial-baseline');

  audit.version.modules='src-abcdef1234';
  audit.siteVersion='src-1122334455';
  audit.originalMoves.push(move('Psycho Boost','deoxys'));
  fs.writeFileSync(source,JSON.stringify(audit));
  const updated=run();
  assert.equal(updated.status,0,updated.stderr);
  const delta=JSON.parse(fs.readFileSync(changes,'utf8'));
  assert.deepEqual(delta.additions.map(m=>m.name),['Psycho Boost']);
  assert.ok(delta.newSourcePokemon.includes('deoxys'));
  assert.equal(delta.previousSiteVersion,'src-aabbccddee');
  assert.equal(delta.currentSiteVersion,'src-1122334455');

  // Homepage can change without changing the module hash or move names.
  // That change must be tracked instead of silently skipped.
  audit.siteVersion='src-9988776655';
  fs.writeFileSync(source,JSON.stringify(audit));
  const siteOnly=run();
  assert.equal(siteOnly.status,0,siteOnly.stderr);
  const siteDelta=JSON.parse(fs.readFileSync(changes,'utf8'));
  assert.equal(siteDelta.currentSiteVersion,'src-9988776655');
  assert.deepEqual(siteDelta.additions,[]);
  assert.equal(JSON.parse(fs.readFileSync(output,'utf8')).siteVersion,'src-9988776655');

  const before=fs.readFileSync(output,'utf8');
  audit.originalMoves=[];
  fs.writeFileSync(source,JSON.stringify(audit));
  assert.notEqual(run().status,0,'incomplete upstream must be rejected');
  assert.equal(fs.readFileSync(output,'utf8'),before,'previous library survives capture failure');
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
