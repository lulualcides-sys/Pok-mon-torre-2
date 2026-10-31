'use strict';
// Map public roster defaults and full move pools. No art, animations, source code or move descriptions copied.
const fs=require('node:fs'),DIR='reference-library/pb-ranked',HOST='https://ranked.pokemonbattlegrounds.com';
const norm=x=>String(x||'').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
const known=new Map(JSON.parse(fs.readFileSync(DIR+'/golpes-mecanicas-ast.json','utf8')).moves.map(m=>[norm(m.name),m.name]));
async function main(){
 const r=await fetch(HOST+'/roster.json',{signal:AbortSignal.timeout(55000)});if(!r.ok)throw Error('HTTP '+r.status);
 const all=await r.json();if(!Array.isArray(all)||all.length<100)throw Error('Unexpected roster');
 const report={source:HOST+'/roster.json',date:new Date().toISOString(),species:[],
  sourceVsAST:{},warning:['Metadata reflects PB Ranked species and public move pools; not actual Torre 2 learnsets','Move cd units are not independently verified (not seconds)','No move description/proprietary artwork reproduced','Default id may refer to cross-species move family; use the actual move name, not id prefix, for comparison']};
 const generation={},types={},abilities=new Set(),megaAbilities=new Set(),unmapped=new Map(),matches=new Set(),defaultsTotal=[],poolTotal=[];
 for(const sp of all){
   if(!sp||typeof sp.name!=='string')continue;
   const pool=Array.isArray(sp.pool)?sp.pool:[];
   const entries=pool.filter(x=>x&&typeof x.name==='string').map(x=>({
     id:typeof x.id==='string'?x.id:null,name:x.name,
     type:typeof x.type==='string'?x.type:null,category:typeof x.cat==='string'?x.cat:null,
     power:Number.isFinite(x.power)?x.power:null,cooldownValue:Number.isFinite(x.cd)?x.cd:null,
     cooldownUnit:'unverified',reach:typeof x.reach==='string'?x.reach:null,
     metadataKeys:Object.keys(x).filter(k=>!['id','name','type','cat','power','cd','reach','desc'].includes(k)).slice(0,18),
     declaredInAST:known.has(norm(x.name))
   }));
   const byId=new Map(entries.map(v=>[v.id,v]));
   const defaults=(Array.isArray(sp.defaults)?sp.defaults:[]).map(id=>{
     const move=byId.get(id);
     return {sourceId:String(id),name:move?.name||String(id).split(':').slice(1).join(':')||null,
        resolvedFromPool:!!move,
        type:move?.type||null,power:move?.power??null,cooldownValue:move?.cooldownValue??null};
   });
   for(const e of entries){poolTotal.push(e);if(e.declaredInAST)matches.add(norm(e.name));else unmapped.set(e.name,(unmapped.get(e.name)||0)+1);}
   defaultsTotal.push(...defaults);
   if(typeof sp.ability==='string')abilities.add(sp.ability);if(typeof sp.megaAbility==='string')megaAbilities.add(sp.megaAbility);
   generation[sp.gen]=(generation[sp.gen]||0)+1;for(const t of sp.types||[])types[t]=(types[t]||0)+1;
   report.species.push({
     name:sp.name,dex:Number.isInteger(sp.dex)?sp.dex:null,generation:Number.isInteger(sp.gen)?sp.gen:null,
     types:Array.isArray(sp.types)?sp.types:[],
     ability:typeof sp.ability==='string'?sp.ability:null,mega:!!sp.mega,
     megaAbility:typeof sp.megaAbility==='string'?sp.megaAbility:null,
     defaults,pool:entries,defaultCount:defaults.length,poolCount:entries.length
   });
 }
 const moveNames=[...new Set(poolTotal.map(x=>x.name))].sort();
 const astNames=new Set(known.keys());
 report.stats={species:report.species.length,movePoolRelations:poolTotal.length,defaultSlots:defaultsTotal.length,
  defaultIdsUnresolved:defaultsTotal.filter(x=>!x.resolvedFromPool).length,
  distinctPoolMoveNames:moveNames.length,matchedASTNames:matches.size,
  poolNotInAST:[...unmapped.entries()].sort((a,b)=>b[1]-a[1]).map(([name,count])=>({name,count})),
  animationASTNotInRoster:[...known.values()].filter(name=>!moveNames.some(x=>norm(x)===norm(name))).sort(),
  generation,types,abilityNames:[...abilities].sort(),megaAbilityNames:[...megaAbilities].sort(),
  poolCounts:{min:Math.min(...report.species.map(x=>x.poolCount)),max:Math.max(...report.species.map(x=>x.poolCount)),mean:+(poolTotal.length/report.species.length).toFixed(2)},
  speciesDefaultFour:report.species.filter(x=>x.defaultCount===4).length};
 fs.writeFileSync(DIR+'/pokemon-movesets-completos-publicos.json',JSON.stringify(report,null,2)+'\n');
 const summary={source:report.source,date:report.date,stats:report.stats,moveNames,
  note:'Public PB roster only; game balance and gameplay differ from Pokémon Torre 2'};
 fs.writeFileSync(DIR+'/pokemon-movesets-estatisticas.json',JSON.stringify(summary,null,2)+'\n');
 console.log(JSON.stringify({species:report.stats.species,poolRelations:report.stats.movePoolRelations,defaultSlots:report.stats.defaultSlots,
  fourDefaults:report.stats.speciesDefaultFour,unresolved:report.stats.defaultIdsUnresolved,
  uniqueMoves:report.stats.distinctPoolMoveNames,matched:report.stats.matchedASTNames},null,2));
 if(report.stats.species<100||report.stats.defaultSlots<400)process.exitCode=2;
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1});