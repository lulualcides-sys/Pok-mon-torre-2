'use strict';
// Noncommercial research metadata extractor. Does NOT redistribute game source/assets.
const fs=require('node:fs'),acorn=require('acorn'),walk=require('acorn-walk'),crypto=require('node:crypto');
const DIR='reference-library/pb-ranked',HOST='https://ranked.pokemonbattlegrounds.com',BUNDLE='/bundles/03413a73844b301c.js';
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const literal=n=>{
 if(!n)return null;
 if(n.type==='Literal'&&['string','number','boolean'].includes(typeof n.value))return n.value;
 if(n.type==='TemplateLiteral'&&!n.expressions.length)return n.quasis.map(x=>x.value.cooked).join('');
 if(n.type==='UnaryExpression'&&['-','+'].includes(n.operator)&&n.argument?.type==='Literal'&&typeof n.argument.value==='number')return n.operator==='-'?-n.argument.value:n.argument.value;
 if(n.type==='BinaryExpression'&&['+','-','*','/'].includes(n.operator)){
  const x=literal(n.left),y=literal(n.right);
  if(typeof x==='number'&&typeof y==='number'&&(n.operator!=='/'||y!==0)){
   const z=n.operator==='+'?x+y:n.operator==='-'?x-y:n.operator==='*'?x*y:x/y;
   return Number.isFinite(z)?Math.round(z*100000)/100000:null;
  }
 }return null;
};
const key=n=>!n?null:n.type==='Identifier'?n.name:literal(n);
const propmap=n=>new Map(n.properties.filter(p=>p.type==='Property').map(p=>[key(p.key),p.value]).filter(([k])=>typeof k==='string'));
const callee=n=>!n?'':n.type==='Identifier'?n.name:n.type==='MemberExpression'?callee(n.object)+'.'+(key(n.property)||'computed'):n.type;
const simple=s=>String(s||'').slice(0,85);
const normalize=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const acceptedKeys=['beam','projectile','contact','melee','windup','utility','sureHit','freezes','highCrit','powerFor','finisher','anim','op','sub','total','rgb','who','status','duration'];
async function main(){
 const r=await fetch(HOST+BUNDLE,{signal:AbortSignal.timeout(55000)});
 if(!r.ok)throw Error('Public JS HTTP '+r.status);
 const src=await r.text();if(src.length>15000000)throw Error('Oversized JS');
 const tree=acorn.parse(src,{ecmaVersion:'latest',sourceType:'module',allowReturnOutsideFunction:true});
 const raw=[];let nodes=0;
 walk.fullAncestor(tree,(obj,s,anc)=>{
  nodes++;if(obj.type!=='ObjectExpression'||obj.properties.length<4||obj.properties.length>60)return;
  const p=propmap(obj);
  if(!['name','type','power','run','cat'].every(k=>p.has(k)))return;
  const name=literal(p.get('name'));if(typeof name!=='string'||name.length>80)return;
  const m={name,type:literal(p.get('type')),category:literal(p.get('cat')),
   power:literal(p.get('power')),range:literal(p.get('range')),
   cooldownValue:literal(p.get('cooldown')),cooldownUnit:'unknown (not seconds)',
   metadata:{},calledFunctions:[],effectStrings:[],context:[],
   evidence:'public JS AST only, no authenticated visual proof'};
  for(const k of acceptedKeys)if(p.has(k)){const v=literal(p.get(k));m.metadata[k]=v===null?{expressionType:p.get(k)?.type}:v;}
  if(p.has('range')&&m.range===null)m.metadata.rangeExpression=p.get('range')?.type;
  const fns=new Set(),txt=new Set();let visited=0;
  const fn=p.get('run');
  if(fn)walk.full(fn,(n)=>{
    if(++visited>13000)return;
    if(n.type==='CallExpression'&&fns.size<55)fns.add(simple(callee(n.callee)));
    if(n.type==='Literal'&&typeof n.value==='string'&&txt.size<45){
      const s=simple(n.value);
      if(s.length>1&&/attack|fire|water|ice|beam|pulse|blast|claw|shadow|hit|miss|dodge|charge|wind|particle|effect|ball|throw|slice|rock|bolt|electric|poison|freeze|cast|sound|anim|hurt|dash|burn|stun|heal|flash|shield/i.test(s))txt.add(s);
    }
  });
  m.calledFunctions=[...fns].sort();m.effectStrings=[...txt].sort();
  m.context=anc.slice(-9,-1).filter(n=>n.type==='Property'||n.type==='VariableDeclarator').map(n=>simple(n.type==='Property'?key(n.key):key(n.id))).filter(Boolean).slice(-6);
  raw.push(m);
 });
 const by=new Map();for(const m of raw){const k=normalize(m.name);if(!by.has(k))by.set(k,[]);by.get(k).push(m)}
 const grouped=[...by].map(([id,variants])=>({id,name:variants[0].name,variantCount:variants.length,variants,proof:'static only'})).sort((a,b)=>a.name.localeCompare(b.name));
 const payload={schemaVersion:2,source:HOST+BUNDLE,at:new Date().toISOString(),bundleSha256:crypto.createHash('sha256').update(src).digest('hex'),
  astNodes:nodes,records:raw.length,unique:grouped.length,
  warnings:['No source code or third-party assets redistributed','No REA link to authenticated browser','cooldown numeric unit unknown','Dynamically constructed moves may be absent'],moves:grouped};
 const types={};for(const x of grouped)for(const t of new Set(x.variants.map(v=>v.type).filter(Boolean)))types[t]=(types[t]||0)+1;
 const summary={at:payload.at,records:raw.length,unique:grouped.length,byType:types,withRange:grouped.filter(x=>x.variants.some(v=>v.range!==null)).length,withCooldown:grouped.filter(x=>x.variants.some(v=>v.cooldownValue!==null)).length,names:grouped.map(x=>x.name)};
 fs.mkdirSync(DIR,{recursive:true});fs.writeFileSync(DIR+'/golpes-mecanicas-ast.json',JSON.stringify(payload,null,2)+'\n');
 fs.writeFileSync(DIR+'/golpes-mecanicas-resumo.json',JSON.stringify(summary,null,2)+'\n');
 console.log(JSON.stringify({records:raw.length,unique:grouped.length,byType:types,withRange:summary.withRange,withCooldown:summary.withCooldown}));
 if(grouped.length<100)process.exitCode=2;
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1});