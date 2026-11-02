'use strict';
// Read-only public-metadata drift audit for PB Ranked.
// Never logs source JS, sprite files, sound, personal data, or credentials.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const HOST='https://ranked.pokemonbattlegrounds.com';
const ROOT=path.resolve('reference-library/pb-ranked');
const output=path.resolve('test-evidence/pb-ranked-public-drift.json');
const norm=x=>String(x||'').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
const read=name=>JSON.parse(fs.readFileSync(path.join(ROOT,name),'utf8'));
const sortedDiff=(a,b,limit=80)=>{
 const old=new Set(a),fresh=new Set(b);
 return {added:[...fresh].filter(x=>!old.has(x)).sort().slice(0,limit),
   removed:[...old].filter(x=>!fresh.has(x)).sort().slice(0,limit),
   addedCount:[...fresh].filter(x=>!old.has(x)).length,
   removedCount:[...old].filter(x=>!fresh.has(x)).length};
};
const normalizeRoster=data=>{
 if(!Array.isArray(data)||data.length<1)throw Error('roster root must be nonempty array');
 return data.filter(s=>s&&typeof s.name==='string').map(s=>({
  name:s.name,defaults:Array.isArray(s.defaults)?s.defaults.map(String):[],
  movePool:Array.isArray(s.pool)?s.pool.filter(m=>m&&typeof m.name==='string').map(m=>({name:m.name,id:String(m.id||'')})):[]
 }));
};
function compareRoster(saved,current){
 const old=saved.species.map(s=>({name:s.name,defaults:s.defaults.map(m=>m.sourceId),movePool:s.pool.map(m=>({name:m.name,id:m.id}))}));
 const live=normalizeRoster(current);
 const before=new Map(old.map(s=>[s.name,s])),after=new Map(live.map(s=>[s.name,s]));
 const diff=sortedDiff(before.keys(),after.keys());
 const movesetPairs=list=>list.flatMap(s=>s.movePool.map(m=>s.name+'\u0001'+norm(m.name)));
 const pairs=sortedDiff(movesetPairs(old),movesetPairs(live));
 const names=sortedDiff(new Set(old.flatMap(s=>s.movePool.map(m=>norm(m.name)))),new Set(live.flatMap(s=>s.movePool.map(m=>norm(m.name)))));
 const changedDefaults=[];
 for(const [name,s] of after){
  const prior=before.get(name);if(!prior)continue;
  if(JSON.stringify(s.defaults)!==JSON.stringify(prior.defaults))
   changedDefaults.push({species:name,beforeCount:prior.defaults.length,afterCount:s.defaults.length,beforeIds:prior.defaults,afterIds:s.defaults});
 }
 return {status:'compared',baselineSpecies:old.length,liveSpecies:live.length,
  speciesDiff:diff,distinctMoveNamesBefore:new Set(old.flatMap(s=>s.movePool.map(m=>norm(m.name)))).size,
  distinctMoveNamesAfter:new Set(live.flatMap(s=>s.movePool.map(m=>norm(m.name)))).size,
  moveNameDiff:names,moveSpeciesPairsDiff:pairs,
  newMoveCandidates:names.added.map(n=>({name:n,owners:live.filter(s=>s.movePool.some(m=>norm(m.name)===n)).map(s=>({pokemon:s.name,isDefault:s.movePool.some(m=>norm(m.name)===n&&s.defaults.includes(m.id))})).slice(0,80)})),
  defaultSlotsChanged:changedDefaults.slice(0,80),
  defaultSlotsChangedCount:changedDefaults.length,warning:'Names and public move pool relations only, no sprites or implementation copied'};
}
const entries=manifest=>{
 if(!manifest||Array.isArray(manifest)||typeof manifest!=='object')throw Error('animation manifest must be object');
 return Object.entries(manifest).filter(([,v])=>v&&typeof v==='object'&&v.anims)
  .map(([id,v])=>({id,states:Object.keys(v.anims||{}).sort()}));
};
function compareAnimations(saved,current){
 const old=saved.perSprite.map(s=>({id:s.id,states:s.states.map(st=>st.state).sort()}));
 const fresh=entries(current);
 const diff=sortedDiff(old.map(s=>s.id),fresh.map(s=>s.id));
 const previous=new Map(old.map(x=>[x.id,x.states]));
 const stateChanges=fresh.filter(s=>previous.has(s.id))
  .map(s=>({id:s.id,diff:sortedDiff(previous.get(s.id),s.states)}))
  .filter(s=>s.diff.addedCount||s.diff.removedCount);
 return {status:'compared',baselineSpriteIds:old.length,liveSpriteIds:fresh.length,
  baselineAnimationEntries:old.reduce((n,s)=>n+s.states.length,0),
  liveAnimationEntries:fresh.reduce((n,s)=>n+s.states.length,0),
  spriteIdDiff:diff,changedStateSetsCount:stateChanges.length,
  changedStateSets:stateChanges.slice(0,35),
  warning:'State declarations; no frame images, runtime timings or original art downloaded'};
}
const trainerNames=v=>Array.isArray(v)?v.map(x=>x?.name).filter(x=>typeof x==='string'):Object.keys(v||{});
function compareTrainers(saved,current){
 const before=saved.trainerSelector.names,after=trainerNames(current);
 return {status:'compared',baselineTrainerCount:before.length,liveTrainerCount:after.length,
  namesDiff:sortedDiff(before,after),
  warning:'Visible trainer identifiers, not ball-throw animation evidence'};
}
async function fetchText(relative){
 const r=await fetch(HOST+relative,{signal:AbortSignal.timeout(45000),headers:{'accept':'application/json,text/plain,*/*','user-agent':'PokemonTorre2PublicMetadataAudit/1.0'}});
 if(!r.ok)throw Error('HTTP '+r.status+' '+relative);
 const body=await r.text();if(body.length>20000000)throw Error('oversized public response');
 return body;
}
const safeErr=e=>String(e?.message||e).slice(0,160);
async function run(){
 const report={schemaVersion:1,observedAt:new Date().toISOString(),source:HOST,
  scope:'Unauthenticated public metadata only; no gameplay, login, video, art or private API',
  baseline:'Research snapshot 2026-10-31',results:{},errors:[],
  caveats:['Public declarations are not evidence of battle animation','Do not auto-patch Torre2 or approved VFX',
   'Runtime gameplay and authenticated match frames remain unverified',
   'A failed endpoint must not be interpreted as a deletion or unchanged catalog']};
 const jobs=[
  ['roster','/roster.json',text=>compareRoster(read('pokemon-movesets-completos-publicos.json'),JSON.parse(text))],
  ['animations','/assets/sprites/anims.json',text=>compareAnimations(read('animacoes-marcadores-estados.json'),JSON.parse(text))],
  ['trainers','/trainers.json',text=>compareTrainers(read('arenas-e-treinadores-curados.json'),JSON.parse(text))],
  ['moveBundleHash','/bundles/03413a73844b301c.js',text=>{
    const old=read('golpes-mecanicas-ast.json').bundleSha256;
    const current=crypto.createHash('sha256').update(text).digest('hex');
    return {status:'compared',baselineHash:old,liveHash:current,
      changed:old?old!==current:null,
      warning:'Hash only, not a claim of all moves unchanged or gameplay verified'};
   }]
 ];
 await Promise.all(jobs.map(async ([name,url,inspect])=>{
  try{const value=await fetchText(url);report.results[name]=inspect(value)}
  catch(e){report.errors.push({source:url,reason:safeErr(e)});report.results[name]={status:'unavailable'}}
 }));
 fs.mkdirSync(path.dirname(output),{recursive:true});
 fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({at:report.observedAt,compared:Object.keys(report.results).filter(k=>report.results[k].status==='compared'),
  errors:report.errors,roster:report.results.roster&&{live:report.results.roster.liveSpecies,baseline:report.results.roster.baselineSpecies,
   newSpecies:report.results.roster.speciesDiff?.addedCount,newMoves:report.results.roster.moveNameDiff?.addedCount,
   newMoveNames:report.results.roster.moveNameDiff?.added,removedMoveNames:report.results.roster.moveNameDiff?.removed,
   newMoveOwners:report.results.roster.newMoveCandidates,
   changedDefaults:report.results.roster.defaultSlotsChanged?.slice(0,12),
   changedDefaultSpecies:report.results.roster.defaultSlotsChanged?.map(x=>x.species).slice(0,30)},
  animations:report.results.animations&&{live:report.results.animations.liveAnimationEntries,
   baseline:report.results.animations.baselineAnimationEntries},
  trainers:report.results.trainers&&{live:report.results.trainers.liveTrainerCount},
  bundleChanged:report.results.moveBundleHash?.changed},null,2));
 if(report.errors.length===jobs.length)process.exitCode=2;
 return report;
}
if(require.main===module)run().catch(e=>{console.error(safeErr(e));process.exitCode=2});
module.exports={norm,sortedDiff,normalizeRoster,compareRoster,entries,compareAnimations,trainerNames,compareTrainers,run};
