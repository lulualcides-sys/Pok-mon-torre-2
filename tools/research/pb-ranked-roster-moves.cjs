'use strict';
// PUBLIC roster metadata to match names of moves in public AST catalog; no copying artwork/game source.
const fs=require('node:fs');
const DIR='reference-library/pb-ranked',HOST='https://ranked.pokemonbattlegrounds.com';
const norm=s=>String(s||'').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
const moveCatalog=JSON.parse(fs.readFileSync(DIR+'/golpes-mecanicas-ast.json','utf8'));
const byMove=new Map(moveCatalog.moves.map(m=>[norm(m.name),m.name]));
const EXCLUDED=new Set(['rock','fire','grass','water','electric','ice','poison','dragon','normal','ghost','bug','fairy','steel','dark','flying','psychic','ground','fighting']);
function extractNames(x,depth=0,cap=500){
 const all=[];const visited=new Set();
 function rec(v,d){
  if(all.length>=cap||d>7||v==null)return;
  if(typeof v==='string'){if(v.length>=2&&v.length<90)all.push(v);return}
  if(typeof v!=='object'||visited.has(v))return;visited.add(v);
  if(Array.isArray(v)){for(const p of v)rec(p,d+1);}
  else for(const [k,value] of Object.entries(v)){if(value===true)all.push(k);if(typeof value==='string'||Array.isArray(value)||typeof value==='object')rec(value,d+1);}
 }
 rec(x,depth);
 return [...new Set(all)];
}
async function main(){
 const r=await fetch(HOST+'/roster.json',{signal:AbortSignal.timeout(50000)});
 if(!r.ok)throw Error('Public roster unavailable: '+r.status);
 const data=await r.json();if(!Array.isArray(data))throw Error('Unexpected roster schema');
 const report={source:HOST+'/roster.json',researchedAt:new Date().toISOString(),rosterCount:data.length,
   moveCatalogUnique:moveCatalog.unique,warning:[
    'Pokémon listed in PB Ranked public roster; NOT necessarily available/unlocked for this account',
    'Move-pool compatibility is PB Ranked only; not canonical Gen III Pokémon learnset or guaranteed implemented Torre2 moves',
    'Matched move names from public AST catalog; unevaluated dynamic move building may escape detection',
    'No third-party graphics, animation files or original game source redistributed'
   ],species:[]};
 const unmatched=new Map(),freq=new Map();
 for(const p of data){
  if(!p||typeof p!=='object'||typeof p.name!=='string')continue;
  const rawDefault=extractNames(p.defaults),rawPool=extractNames(p.pool);
  const matches=list=>[...new Set(list.map(s=>byMove.get(norm(s))).filter(Boolean))].sort();
  const defaults=matches(rawDefault),pool=matches(rawPool);
  for(const s of rawDefault.concat(rawPool)){
   const n=norm(s);if(!byMove.has(n)&&!EXCLUDED.has(n)&&n.length>4&&unmatched.size<900){
     unmatched.set(s,(unmatched.get(s)||0)+1);
   }
  }
  for(const move of pool)freq.set(move,(freq.get(move)||0)+1);
  report.species.push({
    key:typeof p.key==='string'?p.key:null,name:p.name,
    dex:Number.isInteger(p.dex)?p.dex:null,number:Number.isInteger(p.num)?p.num:null,generation:Number.isInteger(p.gen)?p.gen:null,
    types:Array.isArray(p.types)?p.types.slice(0,3):[],
    mega:typeof p.mega==='string'||p.mega===true,
    ability:typeof p.ability==='string'?p.ability:null,
    megaAbility:typeof p.megaAbility==='string'?p.megaAbility:null,
    defaultMoveNames:defaults,availableMovePoolNames:pool,
    defaultMatchedCount:defaults.length,poolMatchedCount:pool.length,
    defaultFieldType:Array.isArray(p.defaults)?'array':typeof p.defaults,
    poolFieldType:Array.isArray(p.pool)?'array':typeof p.pool
  });
 }
 report.stats={matchedPool:report.species.filter(p=>p.poolMatchedCount).length,
  matchedDefaults:report.species.filter(p=>p.defaultMatchedCount).length,
  totalKnownSpeciesMovePairs:report.species.reduce((a,p)=>a+p.poolMatchedCount,0),
  frequentMoves:[...freq.entries()].sort((a,b)=>b[1]-a[1]).slice(0,35).map(([name,count])=>({name,count})),
  unmatchedSample:[...unmatched.entries()].sort((a,b)=>b[1]-a[1]).slice(0,100).map(([name,count])=>({name,count}))};
 fs.writeFileSync(DIR+'/pokemon-127-movesets-publicos.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({roster:report.species.length,stats:{matchedPool:report.stats.matchedPool,matchedDefaults:report.stats.matchedDefaults,matchedPairs:report.stats.totalKnownSpeciesMovePairs},samples:report.species.slice(0,3)},null,2));
 if(report.species.length<100)process.exitCode=2;
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1});