#!/usr/bin/env node
/* Pokémon Torre 2 — verified first-party capture of the user-authorized
 * Poké Arena 2D web client. READ-ONLY GETs, no logins, no bypass, no API calls.
 * Assets are quarantined in an Actions artifact; not deployed to public Pages.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {discoverClientAssetPaths} from './client-asset-discovery.mjs';
import {recoverCriticalCapture} from './capture-client-critical.mjs';

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
 if(!(/^(assets|lib|src-[a-z0-9]{6,20}|iconos)\//i.test(p)||['analitica.js','favicon.ico','favicon.png','index.html','manifest.webmanifest','safari.js'].includes(p)))return null;
 if(/(^|\/)(?:\.env|\.git|secret|token|keys?|password|credentials)(?:\/|\.|$)/i.test(p))return null;
 return p;
}
async function main() {
 await fs.mkdir(DIR,{recursive:true});
 // The public GitHub raw CDN occasionally returns HTTP 503. Never let one
 // short outage take the user's playable campaign offline or change its art.
 // Fetch the SAME immutable source inventory via a second GitHub API path.
 const inventoryApi='https://api.github.com/repos/lulualcides-sys/Pok-mon-torre'+
  '/contents/docs/rea-pokearena/INVENTARIO-GERAL.json'+
  '?ref=rea-pokearena-all-visible-moves';
 let catalog=null,inventoryError='';
 for(const url of [CATALOG,CATALOG,inventoryApi,inventoryApi]){
  try{
   const response=await fetch(url,{headers:{
    'Accept':'application/vnd.github+json',
    'User-Agent':'PokemonTorre2-SourceInventory/1.1'},
    signal:AbortSignal.timeout(20000)});
   if(!response.ok)throw Error('HTTP '+response.status);
   const value=await response.json();
   catalog=value?.scripts?value:
    value?.content&&value.encoding==='base64'?
    JSON.parse(Buffer.from(value.content.replace(/\s/g,''),'base64').toString('utf8')):null;
   if(!Array.isArray(catalog?.scripts)||catalog.scripts.length<10)
    throw Error('Incomplete source inventory');
   break;
  }catch(error){inventoryError=String(error?.message||error);catalog=null;
   await new Promise(resolve=>setTimeout(resolve,600));
  }
 }
 if(!catalog)throw Error('Source inventory unavailable via raw and GitHub API: '+inventoryError);
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
 for(const extra of ['safari.js','manifest.webmanifest','favicon.png','iconos/icono-192.png']) {const p=sanitize(extra);if(p)tasks.set(p,{source:'HTML accessory'});}
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
 // A transient 503 can omit seleccion.js (or another boot module) while
 // the generic inventory still has >10 JS files. Previously capture exited
 // successfully and build-preview failed later, defeating Pages' capture
 // retry loop. Re-fetch mandatory versioned Phaser modules and fail capture
 // explicitly if any remain unavailable.
 const capturedCritical=new Set(details.retrieved.filter(item=>item.bytes>0).map(item=>item.path));
 const criticalRecovered=await recoverCriticalCapture({
  version:actual,captured:capturedCritical,maxAttempts:3,
  fetchFile:async p=>{details.requestCount++;return get(ORIGIN+'/'+p)},
  saveFile:async(p,{data,contentType})=>{
   if(details.totalBytes+data.length>MAX_TOTAL)throw Error('Total capture cap exceeded');
   const dest=path.resolve(DIR,p);
   if(!dest.startsWith(DIR+path.sep))throw Error('Unsafe critical module path');
   await fs.mkdir(path.dirname(dest),{recursive:true});
   await fs.writeFile(dest,data);
   details.totalBytes+=data.length;
   details.retrieved.push({path:p,bytes:data.length,sha256:sha256(data),
    contentType,source:'critical Phaser boot recovery'});
   details.unavailable=details.unavailable.filter(item=>item.path!==p);
  },
  wait:ms=>new Promise(resolve=>setTimeout(resolve,ms))
 });
 details.criticalRecovery={files:criticalRecovered};
 // REA's old inventory predates updates to the site's module graph.
 // Resolve relative JS imports recursively, otherwise the site may fail at boot.
 const imported=new Set(details.retrieved.map(x=>x.path));
 const pending=details.retrieved.filter(x=>x.path.endsWith('.js')&&!x.path.endsWith('phaser.min.js'));
 for(let i=0;i<pending.length&&i<220;i++){
  const current=pending[i];
  const contents=await fs.readFile(path.join(DIR,current.path),'utf8');
  for(const match of contents.matchAll(/\b(?:from\s*|import\s*)(?:["'])([^"']+)(?:["'])/g)){
   const reference=match[1];
   if(!reference.startsWith('.'))continue;
   const found=sanitize(new URL(reference,ORIGIN+'/'+current.path).href);
   if(!found||imported.has(found))continue;
   try{
    const {data,contentType}=await get(ORIGIN+'/'+found);
    const dest=path.resolve(DIR,found);
    if(!dest.startsWith(DIR+path.sep))throw Error('Invalid import path');
    await fs.mkdir(path.dirname(dest),{recursive:true});
    await fs.writeFile(dest,data);
    details.totalBytes+=data.length;
    const item={path:found,bytes:data.length,sha256:sha256(data),contentType,source:'relative module import'};
    details.retrieved.push(item);imported.add(found);
    if(found.endsWith('.js'))pending.push(item);
  }catch(error){details.unavailable.push({path:found,source:'relative module import',error:String(error?.message||error)})}
  }
 }

 // Recover the FULL spritesheet catalog, not just the files triggered in one
 // training session. Every declared animation and portrait in the first-party
 // manifest is part of the client's data dependency graph.
 const allManifest=new Set();
 try{
  const manifest=JSON.parse(await fs.readFile(path.join(DIR,'assets/pmd/manifest.json'),'utf8'));
  for(const [dex,meta] of Object.entries(manifest)){
   const portrait=sanitize('assets/pmd/'+dex+'/portrait.png');
   if(portrait)allManifest.add(portrait);
   for(const animation of Object.values(meta?.anims||{})){
    const file=sanitize('assets/pmd/'+animation.file);
    if(file)allManifest.add(file);
   }
  }
 }catch(e){details.unavailable.push({path:'assets/pmd/manifest.json',error:'Cannot expand manifest: '+String(e.message)})}
 const missingManifest=[...allManifest].filter(p=>!imported.has(p));
 details.manifestAssets={declared:allManifest.size,additional:missingManifest.length};
 let cursor=0;
 async function collectManifest(){
  while(cursor<missingManifest.length){
   const p=missingManifest[cursor++];
   details.requestCount++;
   if(details.totalBytes>MAX_TOTAL){details.skipped.push({path:p,reason:'total size limit'});continue}
   try{
    const {data,contentType}=await get(ORIGIN+'/'+p);
    if(details.totalBytes+data.length>MAX_TOTAL){details.skipped.push({path:p,reason:'total size limit'});continue}
    const dest=path.resolve(DIR,p);
    if(!dest.startsWith(DIR+path.sep))throw Error('Unsafe output path');
    await fs.mkdir(path.dirname(dest),{recursive:true});
    await fs.writeFile(dest,data);
    details.totalBytes+=data.length;
    details.retrieved.push({path:p,bytes:data.length,sha256:sha256(data),source:'PMD manifest dependency',contentType});
    imported.add(p);
   }catch(e){details.unavailable.push({path:p,source:'PMD manifest dependency',error:String(e.message).slice(0,180)})}
  }
 }
 await Promise.all(Array.from({length:12},collectManifest));
 // Older REA inventories cover observed network requests, not every resource
 // referenced by newly deployed client code. Catch quoted UI assets and
 // computed VFX spritesheets before publishing a broken preview.
 const captured=new Set(details.retrieved.map(item=>item.path));
 const failedBefore=new Set(details.unavailable.map(item=>item.path));
 const referenced=new Map();
 for(const item of details.retrieved){
  if(!/\.(?:js|css|html)$/i.test(item.path))continue;
  if(/(?:^|\/)phaser(?:\.min)?\.js$/i.test(item.path))continue;
  const source=await fs.readFile(path.join(DIR,item.path),'utf8');
  for(const candidate of discoverClientAssetPaths(source)){
   const p=sanitize(candidate);
   if(p&&!captured.has(p)&&!failedBefore.has(p)&&!referenced.has(p))
    referenced.set(p,item.path);
  }
 }
 const additional=[...referenced];
 let extraIndex=0;
 async function collectReferencedAssets(){
  while(extraIndex<additional.length){
   const [p,source]=additional[extraIndex++];
   details.requestCount++;
   if(details.totalBytes>MAX_TOTAL){
    details.skipped.push({path:p,reason:'total cap',source:'JS referenced asset'});
    continue;
   }
   try{
    const {data,contentType}=await get(ORIGIN+'/'+p);
    if(details.totalBytes+data.length>MAX_TOTAL){
     details.skipped.push({path:p,reason:'total cap',source:'JS referenced asset'});
     continue;
    }
    const dest=path.resolve(DIR,p);
    if(!dest.startsWith(DIR+path.sep))throw Error('Unsafe output path');
    await fs.mkdir(path.dirname(dest),{recursive:true});
    await fs.writeFile(dest,data);
    details.totalBytes+=data.length;
    details.retrieved.push({path:p,bytes:data.length,sha256:sha256(data),
     contentType,source:'JS referenced asset',referencedBy:source});
    captured.add(p);
   }catch(error){
    details.unavailable.push({path:p,source:'JS referenced asset',
     referencedBy:source,error:String(error?.message||error).slice(0,180)});
   }
  }
 }
 await Promise.all(Array.from({length:8},collectReferencedAssets));
 details.referencedAssets={
  attempted:additional.length,
  missing:additional.map(([p])=>p).filter(p=>!captured.has(p))
 };
 details.planned+=additional.length;
 details.manifestAssets.missing=[...allManifest].filter(p=>!imported.has(p));
 details.planned+=missingManifest.length;
 details.planned+=details.retrieved.filter(x=>x.source==='relative module import').length;
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
