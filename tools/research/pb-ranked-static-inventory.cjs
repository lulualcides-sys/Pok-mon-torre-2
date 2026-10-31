// PB Ranked supplementary public asset and gameplay-symbol inventory.
// No authentication, credentials, cookies, bypass, private endpoints or asset redistribution.
'use strict';
const fs=require('node:fs');const path=require('node:path');
const acorn=require('acorn');const walk=require('acorn-walk');
const ROOT='https://ranked.pokemonbattlegrounds.com';
const OUT=path.resolve('reference-library/pb-ranked');
fs.mkdirSync(OUT,{recursive:true});
const MANIFEST=JSON.parse(fs.readFileSync(path.join(OUT,'analise-js-rea.json'),'utf8'));
const FROM=JSON.parse(fs.readFileSync(path.join(OUT,'recursos-publicos.json'),'utf8'));
const sources=MANIFEST.scripts.map(x=>x.path).filter(x=>/^\/[A-Za-z0-9/_\-.]+\.js$/.test(x));
const assets=new Map(),mechanics=new Map(),observed=[],failures=[];
const LIMIT=35000,STRMAX=220;
const normalize=x=>String(x||'').trim().slice(0,STRMAX);
const categoryOf=s=>{
 const l=s.toLowerCase();
 if(/(?:pokeball|poke.ball|ballthrow|throw.ball|ball_)/.test(l))return 'pokeball';
 if(/(?:trainer|avatar|character|portrait|emote)/.test(l))return 'trainers';
 if(/(?:arena|battleground|stadium|stage|backdrop|background|tileset|floor|terrain|landscape)/.test(l))return 'arenas';
 if(/(?:walk|idle|hop|dash|dodge|hurt|sleep|faint|knockout|anim|sprite|frame|run|turn)/.test(l))return 'animation';
 if(/(?:attack|projectile|missile|beam|blaze|blast|impact|hit|slash|effect|fx|particle|splash|bullet|sound|audio)/.test(l))return 'vfx-audio';
 return 'other';
};
const resourceLike=s=>(
 /\.(?:png|webp|jpeg|jpg|gif|svg|ogg|mp3|wav|webm|mp4|atlas|anim|json)(?:[?#].*)?$/i.test(s)
 || /(?:\/|^)(?:assets|sprites|fx|vfx|audio|sounds|baked2|arenas|backdrops|trainers)\//i.test(s)
);
const mechanicsHints=[
 ['movement',/(?:mov(e|ement)|walk|run|steer|velocity|position|dash|dodge|hop|joystick|drag)/i],
 ['pokemon-attack',/(?:attack|spell|skill|ability|move|cooldown|projectile|cast|hitbox|collision|range)/i],
 ['trainer-pokeball',/(?:pokeball|poke.ball|throw|trainer|send.out|switch|summon|release)/i],
 ['arena-camera',/(?:arena|backdrop|stage|terrain|camera|parallax|scroll|background)/i],
 ['defense-status',/(?:shield|block|guard|invulner|burn|poison|freeze|sleep|paraly|stun|weather)/i],
 ];
function addAsset(name,source,kind){
 name=normalize(name);
 if(name.length<5||name.length>=STRMAX||assets.size>=LIMIT||!resourceLike(name))return;
 const key=source+'|'+name;
 if(!assets.has(key))assets.set(key,{source,value:name,kind,category:categoryOf(name),
  observation:'static source reference, unverified in battle'});
}
function addMechanic(name,source,kind){
 name=normalize(name);
 if(!/^[A-Za-z0-9_$ .()/-]{3,100}$/.test(name)||mechanics.size>=LIMIT)return;
 const groups=mechanicsHints.filter(([,rx])=>rx.test(name)).map(([tag])=>tag);
 if(!groups.length)return;
 const key=source+'|'+name;
 if(!mechanics.has(key))mechanics.set(key,{source,name,kind,groups,
  observation:'source identifier, not observed animation or functional feature'});
}
function recordText(s,source,kind){
 s=normalize(s);
 if(!s)return;
 addAsset(s,source,kind);
 if(s.length<110)addMechanic(s,source,kind);
}
async function scan(p){
 const response=await fetch(ROOT+p,{signal:AbortSignal.timeout(35000),
  headers:{'User-Agent':'PB-Ranked-Research-Noncommercial/1.0'}});
 if(!response.ok)throw new Error('HTTP '+response.status);
 const code=await response.text();
 if(code.length>10000000)throw new Error('Source size exceeded');
 const parsed=acorn.parse(code,{ecmaVersion:'latest',sourceType:'module',allowReturnOutsideFunction:true});
 let count=0,matched=0,templateCount=0;
 walk.full(parsed,(node)=>{
   count++;
   if(node.type==='Literal'&&typeof node.value==='string'){
    recordText(node.value,p,'literal');matched++;
   }else if(node.type==='TemplateLiteral'){
    templateCount++;
    const composed=node.quasis.map((q,i)=>q.value.cooked+
      (i<node.expressions.length?'__dynamic__':'')).join('');
    recordText(composed,p,'template');
   }else if(node.type==='Identifier')addMechanic(node.name,p,'identifier');
   else if(node.type==='Property'){
     const key=node.key.type==='Identifier'?node.key.name:node.key.value;
     if(typeof key==='string')addMechanic(key,p,'object-key');
   }
 });
 observed.push({source:p,bytes:Buffer.byteLength(code),ast_nodes:count,strings:matched,templates:templateCount});
}
async function main(){
 for(const p of sources){
  try{await scan(p);}catch(e){failures.push({source:p,error:String(e.message).slice(0,150)})}
 }
 const as=[...assets.values()].sort((a,b)=>a.category.localeCompare(b.category)||a.value.localeCompare(b.value));
 const ms=[...mechanics.values()].sort((a,b)=>a.groups.join(',').localeCompare(b.groups.join(','))||a.name.localeCompare(b.name));
 const grouped=Object.fromEntries(['pokeball','trainers','arenas','animation','vfx-audio','other']
   .map(c=>[c,as.filter(x=>x.category===c)]));
 const observations=Array.isArray(FROM)?FROM.length:0;
 const report={source:ROOT,date:new Date().toISOString(),publicScripts:observed,
  failures,observedResourceCount:observations,staticAssetReferences:as.length,
  mechanicIdentifiers:ms.length,assetCountPerCategory:Object.fromEntries(Object.entries(grouped).map(([k,v])=>[k,v.length])),
  warning:'Public JS identifiers and paths only; no login, match, captured animation, original assets, or license inferred.'};
 const write=(file,obj)=>fs.writeFileSync(path.join(OUT,file),JSON.stringify(obj,null,2)+'\n');
 write('REFERENCIAS-ARTES-ESTATICAS.json',{metadata:report,grouped});
 write('SIMBOLOS-DE-MECANICAS.json',{metadata:report,symbols:ms});
 write('RELATORIO-EXTRACAO-ESTATICA.json',report);
 console.log(JSON.stringify(report,null,2));
 if(!observed.length)process.exitCode=2;
}
main().catch(e=>{console.error(e);process.exitCode=1});