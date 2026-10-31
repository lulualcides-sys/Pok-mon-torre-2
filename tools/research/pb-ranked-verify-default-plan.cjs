'use strict';
// Check plan only. No gameplay execution, credentials, asset downloads, or production edits.
const fs=require('node:fs');
const dir='reference-library/pb-ranked/';
const plan=JSON.parse(fs.readFileSync(dir+'PLANO-PADROES-PRIMEIRO-245-GOLPES.json'));
const roster=JSON.parse(fs.readFileSync(dir+'pokemon-movesets-completos-publicos.json'));
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const byName=new Map(roster.species.map(s=>[s.name,s]));
const all=new Set(roster.species.flatMap(s=>s.pool.map(m=>norm(m.name))));
const defaults=new Set(roster.species.flatMap(s=>s.defaults.map(m=>norm(m.name))));
const found=new Set();
const errors=[];let countedEdits=0,countedDefaults=0,countedRares=0;
for(const [idx,batch] of plan.batches.entries()){
 if(batch.status!=='PLANNED_NOT_PLAYED')errors.push('Not a planned batch: '+(idx+1));
 if(batch.team.length!==3)errors.push('Not 3v3 '+(idx+1));
 const perTeam=new Set();
 for(const member of batch.team){
  if(perTeam.has(member.pokemon))errors.push('Duplicate Pokemon in batch '+(idx+1));
  perTeam.add(member.pokemon);
  const species=byName.get(member.pokemon);
  if(!species){errors.push('Unknown species '+member.pokemon);continue;}
  if(member.configuredMoves.length!==4)errors.push('Not 4 moves in '+member.pokemon);
  const ids=new Map(species.pool.map(x=>[norm(x.name),x.id]));
  const d=new Set(species.defaults.map(x=>norm(x.name))),seen=new Set();
  for(const move of member.configuredMoves){
    const name=norm(move.name);
    if(!ids.has(name))errors.push('Unlisted move '+member.pokemon+':'+move.name);
    if(move.id&&ids.get(name)!==move.id)errors.push('Wrong move ID '+member.pokemon+':'+move.name);
    if(seen.has(name))errors.push('Duplicate move '+member.pokemon+':'+move.name);
    seen.add(name);
    if(move.default!==d.has(name))errors.push('Wrong default mark '+member.pokemon+':'+move.name);
    if(!move.default)countedEdits++;
  }
 }
 for(const newName of batch.coverageNew){
   if(found.has(newName))errors.push('Duplicate NEW coverage '+newName);
   found.add(newName);
   if(batch.phase==='defaults'){
     if(!defaults.has(newName))errors.push('Rare move in default phase '+newName);
     countedDefaults++;
   }else{
     if(defaults.has(newName))errors.push('Default move in rare phase '+newName);
     countedRares++;
   }
 }
}
if(plan.totalMatches!==plan.batches.length)errors.push('Wrong totalMatches');
if(plan.totalDistinctMoves!==all.size||found.size!==all.size)errors.push('Incomplete move names');
for(const name of all)if(!found.has(name))errors.push('Missing name '+name);
if(countedEdits!==plan.totals.slotReplacements||countedRares!==plan.rareUnique||countedDefaults!==plan.defaultUnique)errors.push('Incorrect plan counts');
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log(JSON.stringify({status:'PASS',allMoveNames:all.size,plannedMatches:plan.batches.length,defaultMoves:countedDefaults,rareMoves:countedRares,moveEdits:countedEdits,
 warning:'A validated plan is not proof of actual battle animations.'},null,2));
