'use strict';
// Summarize PUBLIC metadata only. No sprites, graphics, sound, credentials or source code included.
const fs=require('node:fs');
const DIR='reference-library/pb-ranked',HOST='https://ranked.pokemonbattlegrounds.com';
const targets=[
 {path:'/assets/sprites/anims.json',label:'pokemon_animations'},
 {path:'/trainers.json',label:'trainers'},
 {path:'/roster.json',label:'roster'},
 {path:'/assets/arena/meteorfalls_tiles.json',label:'arena_meteorfalls_tiles'}
];
const stats=(a)=>{if(!a.length)return {n:0};const b=[...a].sort((x,y)=>x-y);return {n:a.length,min:b[0],max:b[b.length-1],median:b[Math.floor(b.length/2)],mean:+(a.reduce((s,v)=>s+v,0)/a.length).toFixed(2)}};
async function load(path){
 const r=await fetch(HOST+path,{signal:AbortSignal.timeout(50000)});
 if(!r.ok)throw Error('public JSON HTTP '+r.status);
 const s=await r.text();if(s.length>27000000)throw Error('Too big');
 return JSON.parse(s);
}
const structure=obj=>({type:Array.isArray(obj)?'array':typeof obj,length:Array.isArray(obj)?obj.length:Object.keys(obj||{}).length,
 examples:Object.entries(obj||{}).slice(0,3).map(([k,v])=>({key:k,type:Array.isArray(v)?'array':typeof v,keys:v&&typeof v==='object'?Object.keys(v).slice(0,24):[]}))});
async function main(){
 const result={researchedAt:new Date().toISOString(),host:HOST,source:'public metadata files',files:[],errors:[],
 warnings:['Not a cache or redistribution of source JSON and artwork','Durations are ticks/frames from source metadata; not measured seconds','IDs and state names are declarations, not proof of battle use']};
 const anim={source:HOST+targets[0].path,date:result.researchedAt,observedSpeciesIds:0,perSprite:[],byAnimation:{},warnings:result.warnings};
 for(const target of targets){
  try{
    const obj=await load(target.path);
    result.files.push({source:target.path,label:target.label,structure:structure(obj)});
    if(target.label==='pokemon_animations'){
      const agg=new Map();
      for(const [speciesId,species] of Object.entries(obj)){
       if(!species?.anims || typeof species.anims!=='object')continue;
       const entry={id:String(speciesId),stateCount:0,states:[],shadowSize:species.shadowSize??null};
       for(const [state,info] of Object.entries(species.anims)){
        if(!info||!Array.isArray(info.durations))continue;
        const ds=info.durations.filter(Number.isFinite);
        const item={state,frames:ds.length,durationSum:ds.reduce((a,b)=>a+b,0),
          w:typeof info.w==='number'?info.w:null,h:typeof info.h==='number'?info.h:null,
          hitFrame:Number.isInteger(info.hit)?info.hit:null,returnFrame:Number.isInteger(info.ret)?info.ret:null,
          rushFrame:Number.isInteger(info.rush)?info.rush:null,copyOf:typeof info.copyOf==='string'?info.copyOf:null};
        entry.states.push(item);entry.stateCount++;
        if(!agg.has(state))agg.set(state,{species:0,frames:[],ticks:[],hits:0,returns:0,rushes:0});
        const a=agg.get(state);a.species++;a.frames.push(ds.length);a.ticks.push(item.durationSum);
        if(item.hitFrame!==null)a.hits++;if(item.returnFrame!==null)a.returns++;if(item.rushFrame!==null)a.rushes++;
       }
       if(entry.stateCount)anim.perSprite.push(entry);
      }
      anim.observedSpeciesIds=anim.perSprite.length;
      anim.totalAnimationEntries=anim.perSprite.reduce((s,v)=>s+v.stateCount,0);
      anim.byAnimation=Object.fromEntries([...agg.entries()].sort((a,b)=>b[1].species-a[1].species).map(([k,v])=>[k,{
        sprites:v.species,frames:stats(v.frames),durationTicks:stats(v.ticks),withHitMarker:v.hits,withReturnMarker:v.returns,withRushMarker:v.rushes
      }]));
    } else if(target.label==='trainers'){
      result.trainerSummary={
       rootKeys:structure(obj),
       trainerNames:Array.isArray(obj)?obj.map(x=>x?.name).filter(x=>typeof x==='string').slice(0,250):Object.keys(obj).slice(0,250),
       note:'Name keys only; no trainer sprites captured and no Pokeball throw frames proven'
      };
    } else if(target.label==='roster'){
      const top=Array.isArray(obj)?obj:Object.values(obj);
      const species=top.map(x=>x&&typeof x==='object'&&(x.name||x.species||x.id)).filter(v=>typeof v==='string').slice(0,350);
      result.rosterSummary={root:structure(obj),candidateSpeciesNames:species};
    }else if(target.label==='arena_meteorfalls_tiles'){
      result.arenaTileSchema={root:structure(obj),keys:obj&&typeof obj==='object'?Object.keys(obj).slice(0,55):[],groundedArena:'Meteor Falls only; other stage layouts not extracted'};
    }
  }catch(e){result.errors.push({path:target.path,error:String(e.message||e).slice(0,180)})}
 }
 fs.mkdirSync(DIR,{recursive:true});
 fs.writeFileSync(DIR+'/animacoes-marcadores-estados.json',JSON.stringify(anim,null,2)+'\n');
 fs.writeFileSync(DIR+'/fontes-cenarios-treinadores-resumo.json',JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({species:anim.observedSpeciesIds,animationEntries:anim.totalAnimationEntries,
  distinctStates:Object.keys(anim.byAnimation).length,files:result.files.map(x=>x.source),errors:result.errors},null,2));
 if(anim.observedSpeciesIds<10)process.exitCode=2;
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1});