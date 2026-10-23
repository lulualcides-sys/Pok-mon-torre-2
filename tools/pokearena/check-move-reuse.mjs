/* Pokémon Torre 2 — gate of verifiable REAL four-source reuse.
 * New moves only: 37 historical entries are grandfathered, NOT retroactively
 * certified. This gate checks evidence records, not copyright ownership or
 * aesthetic similarity. Humans still review source/license/visual results.
 */
import fs from 'node:fs';
import {BATCH24_MOVES} from './batch24/catalog.js';
import {SURGE3_MOVES} from './surge3/catalog.js';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const SOURCES=Object.freeze(['T2','P2','Z','E']);
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const failPlaceholder=s=>/^(?:todo|tbd|n\/a|none|not applicable|pending|\?{3}|xxx|\.\.\.)$/i.test(String(s||'').trim());
function meaningful(s,min=10){
 return typeof s==='string'&&s.trim().length>=min&&!failPlaceholder(s);
}
export function signatureEntries(pool){
 const start=pool.indexOf('export const SIGNATURE_MOVES=Object.freeze([');
 const finish=pool.indexOf('function collect(def)',start);
 if(start<0||finish<start)throw Error('SIGNATURE_MOVES layout changed: update the parser BEFORE merging moves');
 const section=pool.slice(start,finish),entries=[];
 for(const m of section.matchAll(/\{id:'([^']+)',approved:(true|false),nombre:'([^']+)',forma:'([^']+)'/g))
  entries.push({id:m[1],approved:m[2]==='true',name:m[3],form:m[4]});
 const spreads=[...section.matchAll(/\.\.\.([A-Za-z_$][\w$]*)/g)].map(m=>m[1]);
 for(const name of spreads){
  if(!['BATCH24_MOVES','SURGE3_MOVES'].includes(name))
   throw Error('Unrecognized SIGNATURE_MOVES spread: '+name);
  const source=name==='BATCH24_MOVES'?BATCH24_MOVES:SURGE3_MOVES;
  entries.push(...source.map(m=>({id:m.id,approved:m.approved,name:m.nombre,form:m.forma})));
 }
 if(entries.length<37)throw Error('Incomplete SIGNATURE_MOVES parser: fewer than the 37 grandfathered entries');
 return entries;
}
export function validateReusePolicy(pool,policy,{repository=root}={}){
 const errors=[],entries=signatureEntries(pool);
 const names=new Set(),ids=new Set(),original=policy.baselineMoveIds||[];
 const baseline=new Set(original);
 if(policy.schemaVersion!==1)errors.push('Unknown four-source policy schema version');
 if(!Array.isArray(original)||original.length<37||baseline.size!==original.length)
  errors.push('The 37 historical move IDs must be unique and retained in the baseline');
 for(const move of entries){
  const id=move.id,name=move.name.toLowerCase();
  if(ids.has(id)||names.has(name))errors.push('Duplicate signature move: '+id);
  ids.add(id);names.add(name);
  if(baseline.has(id)&&policy.existingNonConformant?.[id]?.status!=='reworked')continue; // Reworks MUST meet the new policy.
  const record=policy.newMoves?.[id];
  if(!record){errors.push('New move '+id+' is missing required four-source reuse evidence');continue}
  if(!['ready-for-visual-review','user-approved'].includes(record.review))
   errors.push(id+': review field must be ready-for-visual-review or user-approved');
  if(move.approved&&record.review!=='user-approved')
   errors.push(id+': move was marked approved without documented user approval');
  if(record.review==='user-approved'&&!meaningful(record.userApprovalEvidence,20))
   errors.push(id+': user-approved requires evidence of the user acceptance');
  let reuseCount=0;
  for(const key of SOURCES){
   const src=record.sources?.[key];
   if(!src){errors.push(id+': missing source '+key);continue}
   if(src.mode==='exception'){
    if(!meaningful(src.reason,35)||!meaningful(src.reviewedUpstream,10)||
      src.userApprovedException!==true||!meaningful(src.approvalEvidence,20))
     errors.push(id+': exception for '+key+' requires inspection, specific reason and EXPLICIT user authorization evidence');
    continue;
   }
   if(src.mode!=='reused'){errors.push(id+': '+key+' must be actually reused or have an authorized exception');continue}
   reuseCount++;
   if(!meaningful(src.upstream,16)||!meaningful(src.local,18)||
      !meaningful(src.contribution,35)||!meaningful(src.license,12))
    errors.push(id+': '+key+' needs exact upstream, local, non-generic contribution and license');
   if(src.upstream===src.local)errors.push(id+': '+key+' source cannot equal target path — a generic local module alone is not four-source reuse');
   const [relative,symbol]=String(src.local||'').split('#');
   if(!relative.startsWith('tools/pokearena/')||!symbol||symbol.length<3||
      relative.includes('..')||!fs.existsSync(path.join(repository,relative)))
    errors.push(id+': '+key+' must point to an existing local FX file and a concrete symbol');
   else{
    try{
     const body=fs.readFileSync(path.join(repository,relative),'utf8');
     if(!body.includes(symbol))
      errors.push(id+': '+key+' symbol '+symbol+' was not found in '+relative);
    }catch{errors.push(id+': '+key+' cannot read target file')}
   }
  }
  if(reuseCount<2)errors.push(id+': requires real reuse from at least two sources even with authorized exceptions; do not count generic Phaser code');
 }
 for(const id of ['flash-cannon','steel-beam','mirror-shot']){
  const move=entries.find(x=>x.id===id),legacy=policy.existingNonConformant?.[id];
  if(!legacy)errors.push('Missing honest debt marker for '+id);
  else if(legacy.status==='requires-rework'){
   // Visual approval is not a claim that all four source bases were reused.
   if(typeof legacy.visualApproved!=='boolean'||move?.approved!==legacy.visualApproved)
    errors.push(id+': visual-approval record and catalog approval must agree');
   if(legacy.visualApproved&&!meaningful(legacy.userApprovalEvidence,35))
    errors.push(id+': direct user acceptance must be recorded');
  }else if(legacy.status==='reworked'){
   if(!policy.newMoves?.[id])
    errors.push(id+' rework requires complete four-source evidence in newMoves');
  }else errors.push(id+': invalid status — requires-rework or reworked');
 }
 return errors;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const pool=fs.readFileSync(path.join(root,'tools/pokearena/torre2-move-pool.js'),'utf8');
 const policy=JSON.parse(fs.readFileSync(path.join(root,'data/move-reuse-policy.json'),'utf8'));
 const errors=validateReusePolicy(pool,policy);
 if(errors.length){for(const error of errors)console.error('REUSE POLICY FAILED:',error);process.exitCode=1}
 else console.log('FOUR-SOURCE GATE PASS: all new moves have verifiable manifests or explicit approved exceptions; legacy Steel VFX are NOT certified.');
}
