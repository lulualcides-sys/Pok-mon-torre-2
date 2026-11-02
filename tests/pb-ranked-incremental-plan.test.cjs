'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const p=path.join(__dirname,'../reference-library/pb-ranked');
const read=name=>JSON.parse(fs.readFileSync(path.join(p,name),'utf8'));
const norm=s=>String(s||'').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');

test('PB Ranked incremental plan: 175 unreported names, exact disjoint coverage, and no fake visual evidence',()=>{
 const plan=read('PLANO-INCREMENTAL-175-PENDENTES-2026-11-01.json');
 const progress=read('PROGRESSO-GOLPES-283-2026-10-31.json');
 const roster=read('pokemon-movesets-completos-publicos.json');
 const byPokemon=new Map(roster.species.map(s=>[s.name,s]));
 const moveRows=new Map(progress.rows.map(m=>[norm(m.name),m]));
 const missing=progress.rows.filter(m=>m.inPublicRoster&&!m.browserAgentUseReported);
 const expected=new Set(missing.map(m=>norm(m.name)));
 const encountered=new Set();
 const phases={remaining_defaults:0,remaining_requires_edit:0};
 let configured=0,edits=0;
 assert.equal(progress.rows.length,283);
 assert.equal(progress.rows.filter(m=>m.inPublicRoster).length,245);
 assert.equal(progress.rows.filter(m=>m.browserAgentUseReported).length,70);
 assert.equal(missing.length,175);
 assert.equal(missing.filter(m=>m.availableAsDefault).length,121);
 assert.equal(missing.filter(m=>!m.availableAsDefault).length,54);
 assert.equal(plan.counts.archivedFrameByFrameVfx,0);
 assert.equal(plan.counts.totalPlannedMatches,30);
 assert.equal(plan.counts.earlierFullPlanMatches,37);
 assert.equal(plan.batches.length,30);
 for(const [index,batch] of plan.batches.entries()){
  assert.equal(batch.seq,index+1);
  assert.equal(batch.status,'PLANNED_NOT_PLAYED');
  assert.equal(batch.team.length,3);
  assert.equal(new Set(batch.team.map(s=>s.pokemon)).size,3);
  assert.ok(Object.hasOwn(phases,batch.phase),'Unknown phase');
  phases[batch.phase]++;
  for(const member of batch.team){
   const species=byPokemon.get(member.pokemon);
   assert.ok(species,'Species missing from public roster: '+member.pokemon);
   assert.equal(member.configuredMoves.length,4,member.pokemon);
   const pool=new Set(species.pool.map(m=>m.id));
   const configuredNames=new Set(member.configuredMoves.map(m=>norm(m.name)));
   for(const move of member.configuredMoves){
    configured++;
    assert.ok(pool.has(move.moveId),member.pokemon+' has unknown move ID '+move.moveId);
   }
   for(const name of member.pendingMoves){
    assert.ok(configuredNames.has(norm(name)),member.pokemon+' missing pending '+name);
   }
   edits+=member.changesRequired;
  }
  for(const pending of batch.pending){
   const name=norm(pending.name);
   assert.ok(batch.coverageKeys.some(k=>norm(k)===name),'Missing coverage-key for '+pending.name);
   assert.ok(expected.has(name),'Already reported or non-roster target: '+pending.name);
   const row=moveRows.get(name);
   assert.equal(pending.protectedApprovedMove,Boolean(row.protectedByTorre2BaselineOrApprovedPolicy));
  }
  for(const name of batch.coverageKeys){
   const n=norm(name);
   assert.ok(!encountered.has(n),'Duplicate target '+name);
   encountered.add(n);
  }
 }
 assert.deepEqual([...encountered].sort(),[...expected].sort());
 assert.deepEqual(phases,{remaining_defaults:22,remaining_requires_edit:8});
 assert.equal(configured,360);
 assert.equal(edits,54);
 assert.equal(missing.filter(m=>m.protectedByTorre2BaselineOrApprovedPolicy).length,31);
 assert.ok(Object.values(plan.checks).every(Boolean));
});
