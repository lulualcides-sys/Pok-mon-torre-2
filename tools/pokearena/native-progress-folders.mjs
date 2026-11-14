import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {auditNativePacks} from './audit-native-packs.mjs';

// JSON summaries are separate from retained binary files. No original source
// code, sprite or unlicensed asset is ever committed to the repository.
const digest=x=>createHash('sha256').update(x).digest('hex');
const json=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const exists=async p=>{try{await fs.access(p);return true}catch{return false}};
function quarantine(p) {
 const root=path.resolve(p);
 const parts=root.split(path.sep);
 if(!parts.includes('site-capture')||parts.includes('_site')||parts.includes('.git'))
  throw Error('Checkpoint must stay in site-capture quarantine');
 return root;
}
export async function contextFor(rootArg) {
 const root=quarantine(rootArg);
 const v=await json(path.join(root,'version.json'));
 if(!/^0\.\d+\.\d+$/.test(v.officialAlpha||'')||
    !/^src-[a-f0-9]{10}$/.test(v.src||''))
  throw Error('Missing verified Alpha and source fingerprint');
 const html=await fs.readFile(path.join(root,'index.html'),'utf8');
 const m=html.match(/<script[^>]*id=["']paq["'][^>]*>([\s\S]*?)<\/script>/);
 if(!m)throw Error('Public native #paq index missing');
 const index=JSON.parse(m[1]);
 if(!/^[a-f0-9]{20}$/.test(index.comun||'')||
    !index.formas||typeof index.formas!=='object'||Array.isArray(index.formas))
  throw Error('Invalid native pack index');
 for(const [dex,hash] of Object.entries(index.formas))
  if(!/^[0-9]{4}(?:-[a-z0-9]+)*$/.test(dex)||
     !/^[a-f0-9]{20}$/.test(hash))throw Error('Unsafe declared native form');
 const indexSha256=digest(Buffer.from(m[1]));
 const key=v.officialAlpha.replaceAll('.','-')+'-'+v.src+'-'+indexSha256.slice(0,16);
 return {root,alpha:v.officialAlpha,src:v.src,indexSha256,key,index};
}
const safePack=p=>/^assets\/p\/[a-f0-9]{20}\.bin$/.test(p);
const resourceFile=(root,p)=>path.join(root,p);
async function provenance(root) {
 const evidence=new Map(),parent=path.dirname(root);
 const sources=[
  [path.join(parent,'CAPTURE-REPORT.json'),'pinned-capture'],
  [path.join(root,'public-missing-packs-report.json'),'public-http-200'],
  [path.join(parent,'rea-lazy-pack-probe/report.json'),'browser-observed']
 ];
 for(const [p,kind] of sources){
  if(!await exists(p))continue;
  const r=await json(p);
  const items=kind==='pinned-capture'?r.retrieved:
    kind==='public-http-200'?r.downloaded:r.observed;
  for(const x of items||[]){
   const rel=x.path||x.asset;
   if(safePack(rel)&&/^[a-f0-9]{64}$/.test(x.sha256||''))
    evidence.set(rel,{sha256:x.sha256,provenance:kind});
  }
 }
 return evidence;
}
export async function restoreCachedPacks(rootArg,cacheArg){
 const c=await contextFor(rootArg),cache=quarantine(cacheArg);
 const p=path.join(cache,'manifest.json');
 if(!await exists(p))return {restored:0,skipped:'no matching cached manifest'};
 const m=await json(p);
 if(m.alpha!==c.alpha||m.src!==c.src||m.indexSha256!==c.indexSha256)
  return {restored:0,skipped:'different Alpha/source/index; cache ignored'};
 const allowed=new Set([c.index.comun,...Object.values(c.index.formas)]);
 const staged=[];
 for(const item of m.files||[]){
  if(!safePack(item.path)||!allowed.has(item.path.slice(9,-4))||
     !/^[a-f0-9]{64}$/.test(item.sha256||'')||
     !['pinned-capture','public-http-200','browser-observed','previous-certified-cache'].includes(item.provenance))
   throw Error('Unsafe cached resource or provenance');
  const binary=await fs.readFile(resourceFile(cache,item.path));
  if(binary.length!==item.bytes||binary.length<64||digest(binary)!==item.sha256)
   throw Error('Cached native pack SHA256 mismatch: '+item.path);
  const dest=resourceFile(c.root,item.path);
  if(await exists(dest)){
   const current=await fs.readFile(dest);
   if(digest(current)!==item.sha256)
    throw Error('Cached pack conflicts with approved local bytes: '+item.path);
  }else staged.push({dest,binary});
 }
 for(const item of staged) {
  await fs.mkdir(path.dirname(item.dest),{recursive:true});
  await fs.writeFile(item.dest,item.binary,{flag:'wx'});
 }
 return {restored:staged.length,source:c.key};
}
export async function saveCachedPacks(rootArg,cacheArg){
 const c=await contextFor(rootArg),cache=quarantine(cacheArg);
 const oldPath=path.join(cache,'manifest.json');
 const old=await exists(oldPath)?await json(oldPath):null;
 const prior=old&&old.alpha===c.alpha&&old.src===c.src&&
   old.indexSha256===c.indexSha256?new Map((old.files||[]).map(x=>[x.path,x])):new Map();
 const evidence=await provenance(c.root),files=[];
 for(const hash of new Set([c.index.comun,...Object.values(c.index.formas)])){
  const rel='assets/p/'+hash+'.bin';
  const current=resourceFile(c.root,rel);
  if(!await exists(current))continue;
  const binary=await fs.readFile(current);
  const h=digest(binary),record=evidence.get(rel),previous=prior.get(rel);
  const proof=record?.sha256===h?record:
    previous?.sha256===h?{sha256:h,provenance:'previous-certified-cache'}:null;
  if(!proof||binary.length<64)continue;
  const target=resourceFile(cache,rel);
  if(await exists(target)){
   const earlier=await fs.readFile(target);
   if(digest(earlier)!==h)throw Error('Refusing to replace cached pack: '+rel);
  }else{
   await fs.mkdir(path.dirname(target),{recursive:true});
   await fs.writeFile(target,binary,{flag:'wx'});
  }
  files.push({path:rel,sha256:h,bytes:binary.length,provenance:proof.provenance});
 }
 await fs.mkdir(cache,{recursive:true});
 await fs.writeFile(oldPath,JSON.stringify({
  alpha:c.alpha,src:c.src,indexSha256:c.indexSha256,
  verifiedOnly:true,files
 },null,2)+'\n');
 return {saved:files.length,key:c.key};
}
export async function writeProgressFolders(rootArg,outputArg){
 const c=await contextFor(rootArg),output=quarantine(outputArg);
 const audit=await auditNativePacks(c.root);
 const manifest=await json(path.join(c.root,'assets/pmd/manifest.json'));
 const evidence=await provenance(c.root),missing=new Map(audit.gaps.map(x=>[x.dex,x]));
 const verified=[],pending=[];
 for(const [dex,hash] of Object.entries(c.index.formas)){
  const gap=missing.get(dex),packRel='assets/p/'+hash+'.bin';
  if(gap) {
   pending.push({dex,pack:hash,missing:gap.missing,status:'missing-resources'});
   continue;
  }
  if(await exists(resourceFile(c.root,packRel))){
   const binary=await fs.readFile(resourceFile(c.root,packRel));
   const sha256=digest(binary);
   const source=evidence.get(packRel);
   verified.push({dex,via:'native-pack',path:packRel,bytes:binary.length,
    sha256,provenance:source?.sha256===sha256?source.provenance:'local-integrity-only'});
  } else {
   const required=new Set([dex+'/portrait.png',
    ...Object.values(manifest[dex]?.anims||{}).map(x=>x.file)]);
   const sprites=[];
   for(const rel of required){
    const b=await fs.readFile(resourceFile(c.root,'assets/pmd/'+rel));
    sprites.push({path:'assets/pmd/'+rel,bytes:b.length,sha256:digest(b)});
   }
   verified.push({dex,via:'loose-png',sprites,
    provenance:'locally-present-and-hashed; independent source/license audit still required'});
  }
 }
 let denied=[];
 const captureReport=path.join(c.root,'public-missing-packs-report.json');
 if(await exists(captureReport))denied=(await json(captureReport)).denied||[];
 const base=path.join(output,c.alpha,c.src,c.indexSha256.slice(0,16));
 for(const x of ['verificados','pendentes','bloqueados'])
  await fs.mkdir(path.join(base,x),{recursive:true});
 const write=(p,obj)=>fs.writeFile(path.join(base,p),JSON.stringify(obj,null,2)+'\n');
 await Promise.all([
  write('verificados/formas.json',{alpha:c.alpha,source:c.src,forms:verified}),
  write('pendentes/formas.json',{alpha:c.alpha,source:c.src,forms:pending}),
  write('bloqueados/http.json',{alpha:c.alpha,source:c.src,denied}),
  write('resumo.json',{alpha:c.alpha,src:c.src,indexSha256:c.indexSha256,
   totalDeclared:audit.formCount,localFilesPresent:verified.length,
   remaining:pending.length,deniedRequests:denied.length,
   complete:audit.missingFormCount===0,
   warning:'Local SHA256 evidence is not a gameplay or licence approval; full Chromium/Guardiao gates remain mandatory.'})
 ]);
 return {directory:base,verified:verified.length,pending:pending.length,
  denied:denied.length,complete:audit.missingFormCount===0};
}
async function main(){
 const op=process.argv[2],root=process.argv[3]||'site-capture/pokearena-client';
 if(op==='fingerprint'){console.log((await contextFor(root)).key);return}
 const dir=process.argv[4]||
  (op==='report'?'site-capture/native-progress':'site-capture/native-pack-cache');
 let result;
 if(op==='restore')result=await restoreCachedPacks(root,dir);
 else if(op==='save')result=await saveCachedPacks(root,dir);
 else if(op==='report')result=await writeProgressFolders(root,dir);
 else throw Error('Usage: fingerprint|restore|save|report <isolated-root> [output-dir]');
 console.log('NATIVE_PROGRESS_'+op.toUpperCase(),JSON.stringify(result));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
 main().catch(e=>{console.error(e);process.exitCode=1});
