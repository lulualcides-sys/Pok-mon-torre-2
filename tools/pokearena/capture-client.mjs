#!/usr/bin/env node
/* Pokémon Torre 2 — verified first-party capture of the user-authorized
 * Poké Arena 2D web client. READ-ONLY GETs, no logins, no bypass, no API calls.
 * Assets are quarantined in an Actions artifact; not deployed to public Pages.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';

const ORIGIN='https://www.pokearena2d.com';
const CATALOG='https://raw.githubusercontent.com/lulualcides-sys/Pok-mon-torre/rea-pokearena-all-visible-moves/docs/rea-pokearena/INVENTARIO-GERAL.json';
const DIR=path.resolve('site-capture/pokearena-client');
const MB=1024*1024, MAX_FILE=10*MB, MAX_TOTAL=350*MB;
const sha256=b=>createHash('sha256').update(b).digest('hex');
const details={date:new Date().toISOString(),source:ORIGIN,sourceCatalog:CATALOG,
 note:'User-provided permission to use site client code; public resource capture only',
 requestCount:0,totalBytes:0,retrieved:[],unavailable:[],skipped:[],
 changedHashes:[],security:{noCredentials:true,noLogin:true,noEndpoints:true,publicSiteOnly:true}};
async function get(url,maxBytes=MAX_FILE) {
 const a=new AbortController();const t=setTimeout(()=>a.abort(),18000);
 try {
  const r=await fetch(url,{signal:a.signal,redirect:'follow',headers:{'User-Agent':'PokemonTorre2-SourceInventory/1.0 (personal noncommercial authorized project)','Accept':'*/*'}});
  if(!(new URL(r.url).origin===ORIGIN))throw Error('Off-origin redirect');
  if(!r.ok)throw Error('HTTP '+r.status);
  const advertised=Number(r.headers.get('content-length')||0);
  if(advertised>maxBytes)throw Error('File too large: '+advertised);
  const data=Buffer.from(await r.arrayBuffer());
  if(data.length>maxBytes)throw Error('File exceeds cap');
  if(r.headers.get('content-type')?.includes('text/html')&&!r.url.endsWith('/')&&!r.url.endsWith('.html'))
   throw Error('HTML fallback instead of requested file');
  return {data,contentType:r.headers.get('content-type')||'',url:r.url};
 }finally{clearTimeout(t)}
}
function sanitize(raw) {
 if(typeof raw!=='string')return null;
 let p;
 try {
  const u=new URL(raw,ORIGIN+'/');
  if(u.origin!==ORIGIN)return null;
  p=decodeURIComponent(u.pathname).replace(/^\/+/,'');
 }catch{return null}
 if(!p||p.includes('\\')||p.split('/').includes('..')||p.length>250)return null;
 if(!(/^(assets|lib|src-[a-z0-9]{6,20})\//i.test(p)||p==='analitica.js'||p==='favicon.ico'||p==='index.html'))return null;
 if(/(^|\/)(?:\.env|\.git|secret|token|keys?|password|credentials)(?:\/|\.|$)/i.test(p))return null;
 return p;
}
async function main() {
 await fs.mkdir(DIR,{recursive:true});
 const raw=await fetch(CATALOG,{headers:{'Accept':'application/json'}});
 if(!raw.ok)throw Error('Could not load REA inventory: '+raw.status);
 const catalog=await raw.json();
 const homepage=await get(ORIGIN+'/',3*MB);
 const html=homepage.data.toString('utf8');
 const sourceVersions=[...new Set([...html.matchAll(/src-[0-9a-f]{10}/g)].map(m=>m[0]))];
 const reExisting=(catalog.scripts||[]).map(s=>s.file.match(/^(src-[0-9a-f]{10})\//)?.[1]).find(Boolean);
 const actual=sourceVersions[0]||reExisting;
 details.sourceVersions={discovered:sourceVersions,inventory:reExisting,selected:actual};
 const tasks=new Map([['index.html',{source:'homepage'}]]);
 for(const s of catalog.scripts||[]) {
  const old=s.file||'';
  const actualPath=actual&&reExisting?old.replace(reExisting,actual):old;
  const normalized=sanitize('/'+actualPath);
  if(normalized)tasks.set(normalized,{source:'REA script',reaPath:old,expectedHash:s.sha256||null});
 }
 for(const a of catalog.networkAssets||[]) {
  if(a.status!==200)continue;
  const normalized=sanitize(a.path);
  if(normalized&&!tasks.has(normalized))tasks.set(normalized,{source:'REA network asset'});
 }
 for(const item of catalog.assets||[]){
  const normalized=sanitize(item);
  if(normalized&&!tasks.has(normalized))tasks.set(normalized,{source:'REA named asset'});
 }
 for(const value of html.matchAll(/(?:src|href)\s*=\s*["']([^"'#?]+)["']/gi)){
  const normalized=sanitize(value[1]);
  if(normalized&&!tasks.has(normalized))tasks.set(normalized,{source:'HTML direct'});
 }
 details.planned=tasks.size;
 const queue=[...tasks];
 let index=0;
 async function worker(){
  while(index<queue.length){
   const [p,meta]=queue[index++];
   details.requestCount++;
   if(p==='index.html') {
    await fs.writeFile(path.join(DIR,p),homepage.data);
    details.totalBytes+=homepage.data.length;
    details.retrieved.push({path:p,bytes:homepage.data.length,sha256:sha256(homepage.data),source:'homepage'});
    continue;
   }
   if(details.totalBytes>MAX_TOTAL){details.skipped.push({path:p,reason:'total cap'});continue;}
   try{
    const {data,contentType}=await get(ORIGIN+'/'+p);
    if(details.totalBytes+data.length>MAX_TOTAL){details.skipped.push({path:p,reason:'total cap'});continue;}
    const dest=path.resolve(DIR,p);
    if(!dest.startsWith(DIR+path.sep))throw Error('Invalid destination');
    await fs.mkdir(path.dirname(dest),{recursive:true});
    await fs.writeFile(dest,data);
    details.totalBytes+=data.length;
    const digest=sha256(data);
    const item={path:p,bytes:data.length,sha256:digest,contentType,source:meta.source};
    details.retrieved.push(item);
    if(meta.expectedHash&&meta.expectedHash!==digest)
      details.changedHashes.push({path:p,expected:meta.expectedHash,actual:digest});
   }catch(e){details.unavailable.push({path:p,source:meta.source,error:String(e?.message||e).slice(0,180)})}
  }
 }
 await Promise.all(Array.from({length:8},worker));
 details.retrieved.sort((a,b)=>a.path.localeCompare(b.path));
 details.unavailable.sort((a,b)=>a.path.localeCompare(b.path));
 details.completed=new Date().toISOString();
 details.totalFiles=details.retrieved.length;
 details.complete=details.retrieved.length===details.planned;
 await fs.mkdir('site-capture',{recursive:true});
 await fs.writeFile('site-capture/CAPTURE-REPORT.json',JSON.stringify(details,null,2));
 await fs.writeFile('site-capture/README.txt',
  'Poké Arena 2D public client snapshot — collected for the user-authorized, noncommercial Pokémon Torre 2 project.\n'+
  'Source: '+ORIGIN+'\nFiles: '+details.retrieved.length+'/'+details.planned+
  '\nDo not treat browser client assets as the complete server-side source or online services.\n'+
  'Run a static server rooted at pokearena-client/ to inspect local Training. Online functions need separate work.\n');
 console.log(JSON.stringify({files:details.totalFiles,planned:details.planned,bytes:details.totalBytes,
  sourceVersions:details.sourceVersions,unavailable:details.unavailable.slice(0,14),changedHashes:details.changedHashes.length},null,2));
 if(details.retrieved.filter(x=>x.path.endsWith('.js')).length<10)
  throw Error('Insufficient real JS source captured; check source origin and site availability');
}
main().catch(async e=>{
 await fs.mkdir('site-capture',{recursive:true});
 details.fatalError=String(e?.stack||e);
 await fs.writeFile('site-capture/CAPTURE-REPORT.json',JSON.stringify(details,null,2));
 console.error(e);process.exitCode=1;
});
