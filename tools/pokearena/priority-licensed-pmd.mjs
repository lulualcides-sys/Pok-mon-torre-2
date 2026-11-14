/* Alpha 0.71.3 independent PMD reference art, QUARANTINED ONLY. Some per-file creator credits explicitly say Unspecified; repository-level CC BY-NC does NOT clear third-party rights.
 * One species is atomic: incomplete sprites are NOT installed. Original
 * game art, approved VFX, source modules and saves are NEVER overwritten.
 * New licensed art is marked separately; never claim native source fidelity.
 * Credits: https://github.com/PMDCollab/SpriteCollab (CC BY-NC 4.0).
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {validPng} from './stage-licensed-visual-substitutes.mjs';
import {contextFor} from './native-progress-folders.mjs';

export const PRIORITY_FORMS=Object.freeze([
 '0132','0133','0480','0481','0482','0196','0197','0282','0286','0128','0700'
]);
const BASE='https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/';
const LICENSE='CC BY-NC 4.0';
const SHA=b=>createHash('sha256').update(b).digest('hex');
const LIMIT=3;
const exists=async file=>{try{await fs.access(file);return true}catch{return false}};
const parse=async file=>JSON.parse(await fs.readFile(file,'utf8'));
const safe=rel=>/^[0-9]{4}\/(?:portrait|[A-Za-z0-9_-]+-Anim)\.png$/.test(rel);
export function candidates(dex,relative){
 if(!/^\d{4}$/.test(dex)||!safe(relative)||!relative.startsWith(dex+'/'))
  throw Error('Unsafe sprite path');
 const basename=relative.slice(5);
 const prefix=basename==='portrait.png'?'portrait':'sprite';
 const filename=basename==='portrait.png'?'Normal.png':basename;
 return [prefix+'/'+dex+'/'+filename,
  prefix+'/'+dex+'/0000/0001/'+filename];
}
export function checkBytes(bytes,meta){
 return validPng(bytes,meta) && bytes.length>=128 &&
  bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
}
function requiredFor(manifest,dex){
 const entry=manifest[dex];
 if(!entry?.anims?.Idle)throw Error('Missing official Idle metadata: '+dex);
 const list=new Map([[dex+'/portrait.png',null]]);
 for(const anim of Object.values(entry.anims)){
  if(!safe(anim.file)||!anim.file.startsWith(dex+'/')||
     !Number.isInteger(anim.fw)||!Number.isInteger(anim.fh)||
     !Array.isArray(anim.durations)||anim.durations.length<1)
   throw Error('Invalid official PMD animation metadata: '+dex);
  list.set(anim.file,anim);
 }
 return list;
}
export async function stagePriorityLicensedPMD(clientRoot,cacheRoot,fetcher=fetch,{limit=LIMIT}={}){
 const c=await contextFor(clientRoot),cache=path.resolve(cacheRoot);
 if(!cache.split(path.sep).includes('site-capture')||
    cache.split(path.sep).includes('_site'))throw Error('Priority cache outside quarantine');
 // Do not silently inherit the next upstream Alpha: audit it separately.
 if(c.alpha!=='0.71.3'||c.src!=='src-5ccc174cb8')
  throw Error('Priority license batch requires verified Alpha 0.71.3 source');
 if(!Number.isInteger(limit)||limit<1||limit>11)throw Error('Invalid bounded batch');
 const manifest=await parse(path.join(c.root,'assets/pmd/manifest.json'));
 const directory=path.join(cache,'priority-pmd');
 const savedManifest=path.join(directory,'manifest.json');
 let saved={alpha:c.alpha,src:c.src,indexSha256:c.indexSha256,license:LICENSE,forms:[]};
 if(await exists(savedManifest)){
  const prior=await parse(savedManifest);
  if(prior.alpha===c.alpha&&prior.src===c.src&&prior.indexSha256===c.indexSha256)
   saved=prior;
 }
 const already=new Map(saved.forms.map(f=>[f.dex,f]));
 const restored=[],completed=[],pending=[],skipped=[],attempted=[],verified=[];
 // Only 11 exact form IDs are permitted; the 19 costume forms are a separate backlog.
 for(const dex of PRIORITY_FORMS){
  if(!c.index.formas[dex]){pending.push({dex,reason:'not-declared-in-current-index'});continue}
  const native=path.join(c.root,'assets/p',c.index.formas[dex]+'.bin');
  if(await exists(native)){skipped.push({dex,reason:'native-pack-present'});continue}
  let required;
  try{required=requiredFor(manifest,dex)}
  catch(e){pending.push({dex,reason:e.message});continue}
  let existingComplete=true;
  for(const rel of required.keys())if(!await exists(path.join(c.root,'assets/pmd',rel)))
   existingComplete=false;
  const prior=already.get(dex);
  if(existingComplete){
   if(prior){
    // Revalidate the local sprites on EVERY use, not only when restoring.
    // Corruption or replacement can never be silently reclassified as
    // official source art.
    for(const [rel,meta] of required){
     const proof=prior.files.find(x=>x.relative===rel);
     const bytes=await fs.readFile(path.join(c.root,'assets/pmd',rel));
     if(!proof||SHA(bytes)!==proof.sha256||!checkBytes(bytes,meta))
      throw Error('Conflicting licensed priority sprite: '+rel);
    }
    verified.push(prior);
   }
   skipped.push({dex,reason:'local-loose-sprites-already-present'});
   continue;
  }
  if(prior){
   try{
    if(prior.files.length!==required.size)throw Error('Incomplete cached species');
    const ready=[];
    for(const [rel,meta] of required){
     const file=prior.files.find(x=>x.relative===rel);
     if(!file||!safe(rel)||!file.source?.startsWith(BASE))
      throw Error('Invalid cached species provenance');
     const bytes=await fs.readFile(path.join(directory,rel));
     if(SHA(bytes)!==file.sha256||!checkBytes(bytes,meta))
      throw Error('Cached species mismatch');
     const dest=path.join(c.root,'assets/pmd',rel);
     if(await exists(dest)){
      if(SHA(await fs.readFile(dest))!==file.sha256)
       throw Error('Original sprite collision: '+rel);
     }else ready.push({dest,bytes});
    }
    for(const {dest,bytes} of ready){await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,bytes,{flag:'wx'})}
    restored.push({dex,files:prior.files.length});
    verified.push(prior);
   }catch(e){pending.push({dex,reason:'cache-validation: '+e.message})}
   continue;
  }
  if(attempted.length>=limit){pending.push({dex,reason:'deferred-to-next-batch'});continue}
  attempted.push(dex);
  const found=[];let failure=null;
  for(const [rel,meta] of required){
   if(await exists(path.join(c.root,'assets/pmd',rel))){
    failure='mixed local sprites require separate provenance audit: '+rel;
    break;
   }
   let accepted=null;
   for(const relCandidate of candidates(dex,rel)){
    const url=BASE+relCandidate;
    try{
     const response=await fetcher(url,{redirect:'error',signal:AbortSignal.timeout(12000)});
     if(response.status===404)continue;
     if(response.status!==200){failure='public SpriteCollab HTTP '+response.status+' '+relCandidate;break}
     if(response.url && !response.url.startsWith(BASE)){failure='off-origin response';break}
     const bytes=Buffer.from(await response.arrayBuffer());
     if(!checkBytes(bytes,meta)){failure='incompatible frames/dimensions: '+rel;break}
     accepted={relative:rel,bytes,sha256:SHA(bytes),source:url};
     break;
    }catch(e){failure='network failure: '+String(e.message).slice(0,100);break}
   }
   if(failure)break;
   if(!accepted){failure='licensed SpriteCollab animation unavailable: '+rel;break}
   found.push(accepted);
  }
  if(failure||found.length!==required.size){
   pending.push({dex,reason:failure||'incomplete licensed art'});continue
  }
  // All required original animation names were independently mapped and
  // validated BEFORE writing any bytes for this species.
  const metaFiles=[];
  for(const f of found){
   const dest=path.join(c.root,'assets/pmd',f.relative);
   const cached=path.join(directory,f.relative);
   await fs.mkdir(path.dirname(dest),{recursive:true});
   await fs.mkdir(path.dirname(cached),{recursive:true});
   await fs.writeFile(dest,f.bytes,{flag:'wx'});
   await fs.writeFile(cached,f.bytes,{flag:'wx'});
   metaFiles.push({relative:f.relative,sha256:f.sha256,bytes:f.bytes.length,source:f.source});
  }
  const record={dex,files:metaFiles};
  saved.forms.push(record);already.set(dex,record);
  completed.push({dex,files:metaFiles.length});
  verified.push(record);
 }
 await fs.mkdir(directory,{recursive:true});
 await fs.writeFile(savedManifest,JSON.stringify(saved,null,2)+'\n');
 // Per-species credit report is retained in isolated candidate; full release
 // still requires source/asset QA and adherence to noncommercial license.
 const report={alpha:c.alpha,src:c.src,indexSha256:c.indexSha256,
  license:'MIXED_OR_UNVERIFIED',repositoryLicense:LICENSE,
  redistributionCleared:false,licenseReviewRequired:true,sourceAuthentic:false,
  origin:'https://github.com/PMDCollab/SpriteCollab',
  noncommercialOnly:true,completed,restored,skipped,pending,attempted,
  licensed:verified};
 await fs.writeFile(path.join(c.root,'priority-licensed-pmd-report.json'),
  JSON.stringify(report,null,2)+'\n');
 return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
 stagePriorityLicensedPMD(
  process.argv[2]||'site-capture/pokearena-client',
  process.argv[3]||'site-capture/native-pack-cache')
 .then(r=>console.log('PRIORITY_LICENSED_PMD',JSON.stringify({
  alpha:r.alpha,completed:r.completed.length,restored:r.restored.length,
  pending:r.pending.length,attempted:r.attempted
 })))
 .catch(e=>{console.error(e);process.exitCode=1});
