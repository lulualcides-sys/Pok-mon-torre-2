import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {auditNativePacks} from './audit-native-packs.mjs';

// A direct, UNMODIFIED public HTTP GET is allowed only for hashes literally
// declared in the ordinary public index.html and currently missing from the
// isolated candidate. No cookies, login, proxy, special headers, retry on
// denial, discovery of private endpoints or response interception.
const ORIGIN='https://www.pokearena2d.com';
const MAX_FILE_BYTES=12*1024*1024;
const MAX_TOTAL_BYTES=60*1024*1024;
// Guardrail: at most a small, incremental public batch in one execution.
const MAX_PACKS=8, MAX_DENIED=2;
const PRIORITY_DEX=new Set(['0132','0133','0128','0196','0197','0282','0286','0480','0481','0482']);
const sha256=x=>createHash('sha256').update(x).digest('hex');
function safeClientRoot(p) {
  const root=path.resolve(p);
  if(!root.split(path.sep).includes('site-capture') ||
     root.split(path.sep).includes('_site') || root.split(path.sep).includes('.git'))
    throw Error('Public pack capture must use isolated site-capture workspace');
  return root;
}
export async function capturePublicMissingPacks(rootArg, options={}) {
  const root=safeClientRoot(rootArg);
  const fetcher=options.fetcher||fetch;
  const reportPath=path.resolve(options.reportPath ||
    path.join(root,'public-missing-packs-report.json'));
  if(!reportPath.startsWith(root+path.sep))
    throw Error('Public pack report must stay in quarantine');
  const original=await auditNativePacks(root);
  const version=JSON.parse(await fs.readFile(path.join(root,'version.json'),'utf8'));
  if(!/^0\.\d+(?:\.\d+)?$/.test(version.officialAlpha||'') ||
     !/^src-[a-f0-9]{10}$/.test(version.src||version.modules||''))
    throw Error('Candidate has no independently verified official Alpha');
  const candidates=[...original.gaps].sort((a,b)=>
    Number(PRIORITY_DEX.has(b.dex))-Number(PRIORITY_DEX.has(a.dex)) ||
    a.dex.localeCompare(b.dex));
  const missingIds=[...new Set(candidates.map(x=>x.pack))];
  const selected=missingIds.slice(0,MAX_PACKS);
  // Defer excess candidates rather than aborting before a useful coverage
  // report. The strict full-form audit below still blocks release.
  const deferred=missingIds.slice(MAX_PACKS);
  const report={
    officialAlpha:version.officialAlpha,sourceDir:version.src||version.modules,
    before:{missingForms:original.missingFormCount,missingPacks:missingIds.length},
    method:'plain-public-origin-GET-of-index-declared-packs',
    credentials:false,proxies:false,specialHeaders:false,retriesAfterDeny:0,
    quarantined:true,downloaded:[],denied:[],errors:[],after:null,
    selectedPacks:selected.length,deferredPacks:deferred.length,
    boundedBy:MAX_PACKS,stoppedAfterDenials:false
  };
  let total=0;
  for(const hash of selected){
    if(report.denied.length>=MAX_DENIED){
      report.stoppedAfterDenials=true;
      break;
    }
    if(!/^[a-f0-9]{20}$/.test(hash))throw Error('Invalid pack hash');
    const rel='assets/p/'+hash+'.bin';
    const dest=path.join(root,rel);
    const url=ORIGIN+'/'+rel;
    try{
      const response=await fetcher(url,{redirect:'error',
        signal:AbortSignal.timeout(16000)});
      if(response.status!==200){
        report.denied.push({path:rel,status:response.status});
        continue; // Never bypass/retry HTTP 403.
      }
      if(response.url && new URL(response.url).origin!==ORIGIN)
        throw Error('Off-origin response forbidden');
      const announced=Number(response.headers?.get?.('content-length')||0);
      if(announced>MAX_FILE_BYTES)throw Error('Declared public pack is too large');
      const mime=response.headers?.get?.('content-type')||'';
      if(/text\/html/i.test(mime))throw Error('HTML fallback rather than original binary');
      const data=Buffer.from(await response.arrayBuffer());
      if(data.length<64||data.length>MAX_FILE_BYTES||
         total+data.length>MAX_TOTAL_BYTES)
        throw Error('Invalid or oversized public binary pack');
      await fs.mkdir(path.dirname(dest),{recursive:true});
      await fs.writeFile(dest,data,{flag:'wx'}); // never replace any prior sprite
      total+=data.length;
      report.downloaded.push({path:rel,bytes:data.length,sha256:sha256(data),
        provenance:'HTTP 200 direct from official public path declared in #paq'});
    }catch(err){
      // Abort conditions such as HTTP 403 remain failures, not bypass triggers.
      report.errors.push({path:rel,error:String(err?.message||err).slice(0,180)});
    }
  }
  const current=await auditNativePacks(root);
  report.after={
    formCount:current.formCount,verifiedPacks:current.verifiedPacks,
    verifiedLoose:current.verifiedLoose,missingForms:current.missingFormCount,
    gaps:current.gaps.map(x=>({dex:x.dex,pack:x.pack,missingOriginalFiles:x.missing.length}))
  };
  report.complete=current.missingFormCount===0;
  await fs.writeFile(reportPath,JSON.stringify(report,null,2)+'\n');
  return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 capturePublicMissingPacks(process.argv[2]||'site-capture/pokearena-client').then(r=>{
   console.log('PUBLIC_NATIVE_MISSING_COVERAGE',JSON.stringify({
     alpha:r.officialAlpha,originallyMissing:r.before.missingForms,
     downloaded:r.downloaded.length,denied:r.denied.length,errors:r.errors.length,
    selected:r.selectedPacks,deferred:r.deferredPacks,stoppedAfterDenials:r.stoppedAfterDenials,
     remaining:r.after.missingForms,complete:r.complete
   }));
   if(!r.complete)process.exitCode=2;
 }).catch(e=>{console.error('PUBLIC_NATIVE_CAPTURE_ABORTED',e);process.exitCode=1});
}
