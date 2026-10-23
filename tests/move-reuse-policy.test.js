import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {validateReusePolicy,signatureEntries,SOURCES} from '../tools/pokearena/check-move-reuse.mjs';

const root=process.cwd();
const pool=fs.readFileSync(path.join(root,'tools/pokearena/torre2-move-pool.js'),'utf8');
const data=JSON.parse(fs.readFileSync(path.join(root,'data/move-reuse-policy.json'),'utf8'));
const clone=()=>structuredClone(data);
const add=pool.replace("export const SIGNATURE_MOVES=Object.freeze([",
 "export const SIGNATURE_MOVES=Object.freeze([\n {id:'four-source-test',approved:false,nombre:'Four Source Test',forma:'torre2_foursourcetest'},");
test('Project standard: exactly 4 verified sources',()=>{
 assert.deepEqual(SOURCES,['T2','P2','Z','E']);
 assert.equal(signatureEntries(pool).length,data.baselineMoveIds.length+Object.keys(data.newMoves).length,
  'Catalog count: 37 historic + 23 first batch + 3 Surge + 13 Kanto finale moves');
 assert.equal(Object.keys(data.newMoves).length,39);
 assert.ok(!signatureEntries(pool).some(m=>m.id==='dragon-pulse'),
  'Dragon Pulse must remain only in the native Poké Arena 2D library');
 assert.deepEqual(validateReusePolicy(pool,data),[]);
});
test('Future custom move is BLOCKED if the four-source evidence is missing',()=>{
 const errors=validateReusePolicy(add,clone());
 assert.ok(errors.some(x=>x.includes('four-source-test')&&x.includes('missing')));
});
test('Generic inspirations do NOT pass as source reuse',()=>{
 const evidence=clone();
 evidence.newMoves['four-source-test']={review:'ready-for-visual-review',
  sources:Object.fromEntries(SOURCES.map(k=>[k,{
   mode:'reused',upstream:'visual inspiration only',
   local:'tools/pokearena/torre2-steel-fx.js#not-a-real-symbol',
   license:'license unverified',contribution:'I looked at a screenshot and drew a new effect'
  }]))};
 const errors=validateReusePolicy(add,evidence);
 assert.ok(errors.some(x=>x.includes('symbol')));
});
test('No fabricated exception: user authorization is mandatory',()=>{
 const evidence=clone();
 evidence.newMoves['four-source-test']={review:'ready-for-visual-review',
  sources:Object.fromEntries(SOURCES.map(k=>[k,{
   mode:'exception',reason:'Unclear license and no distributable sprite pack found',
   reviewedUpstream:'github.com/example/arena/src',
   userApprovedException:false
  }]))};
 const errors=validateReusePolicy(add,evidence);
 assert.ok(errors.some(x=>x.includes('EXPLICIT user authorization')));
 assert.ok(errors.some(x=>x.includes('at least two sources')));
});
test('Three steel effects visually approved without claiming complete four-source provenance',()=>{
 for(const id of ['flash-cannon','steel-beam','mirror-shot']){
  assert.equal(data.existingNonConformant[id].status,'requires-rework');
  const move=signatureEntries(pool).find(x=>x.id===id);
  assert.equal(move.approved,true);
  assert.equal(data.existingNonConformant[id].visualApproved,true);
  assert.ok(data.existingNonConformant[id].userApprovalEvidence);
 }
});

test('Unknown imported catalogs cannot bypass the evidence gate',()=>{
 assert.throws(()=>signatureEntries(pool.replace('...BATCH24_MOVES','...UNREVIEWED_MOVES')),/Unrecognized/);
});
