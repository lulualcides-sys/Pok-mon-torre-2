'use strict';
const fs=require('node:fs'),p='reference-library/pb-ranked/';
const plan=JSON.parse(fs.readFileSync(p+'PLANO-LOTES-245-GOLPES.json','utf8'));
const matrix=JSON.parse(fs.readFileSync(p+'MATRIZ-EFEITOS-283-GOLPES.json','utf8'));
const roster=JSON.parse(fs.readFileSync(p+'pokemon-movesets-completos-publicos.json','utf8'));
const ast=JSON.parse(fs.readFileSync(p+'golpes-mecanicas-ast.json','utf8'));
const N=s=>String(s||'').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
const expected=new Set(roster.species.flatMap(s=>s.pool.map(m=>N(m.name))));
const species=new Map(roster.species.map(s=>[s.name,new Set(s.pool.map(m=>m.id))]));
const seen=new Set();
const errors=[];
if(plan.totalBatches!==plan.batches.length)errors.push('Wrong batch total');
if(plan.declaredMoves!==ast.unique||matrix.items.length!==ast.unique)errors.push('AST mismatch');
if(plan.rosterAccessibleCandidates!==expected.size)errors.push('Expected roster moves mismatch');
if(plan.staticOnlyMoves!==ast.unique-expected.size)errors.push('Static-only count incorrect');
for(const b of plan.batches){
 if(b.status!=='NOT_EXECUTED')errors.push('Plan wrongly marks execution');
 if(b.team.length!==3)errors.push('Wrong 3v3 team batch '+b.batch);
 const occupied=new Set();
 for(const s of b.team){
  if(occupied.has(s.pokemon))errors.push('Duplicate Pokemon same batch: '+s.pokemon);
  occupied.add(s.pokemon);
  if(s.moves.length!==4)errors.push('Wrong move count: '+s.pokemon);
  const valid=species.get(s.pokemon);
  if(!valid)errors.push('Unknown species '+s.pokemon);
  const local=new Set();
  for(const m of s.moves){
   if(!valid?.has(m.moveId))errors.push('Move ID not in '+s.pokemon+' pool: '+m.moveId);
   if(local.has(N(m.name)))errors.push('Repeated move in same Pokemon: '+m.name);
   local.add(N(m.name));
   if(m.newResearch){
    const key=N(m.name);
    if(seen.has(key))errors.push('Duplicate planned new move '+m.name);
    seen.add(key);
   }
  }
 }
}
for(const k of expected)if(!seen.has(k))errors.push('Unplanned move '+k);
const indexes=new Set(matrix.items.map(m=>N(m.name)));
for(const m of ast.moves)if(!indexes.has(N(m.name)))errors.push('Missing matrix row '+m.name);
if(errors.length){console.error(errors.join('\n'));process.exit(2);}
console.log(JSON.stringify({result:'PASS',declared:ast.unique,rosterMoves:expected.size,staticOnly:plan.staticOnlyMoves,
  batches:plan.batches.length,newCoverage:seen.size,matrixEntries:matrix.items.length,
  warning:'Coverage is a VERIFIED PLAN, not observed in gameplay.'},null,2));
