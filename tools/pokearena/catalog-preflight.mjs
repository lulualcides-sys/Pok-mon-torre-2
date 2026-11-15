/**
 * Catalogs native move METADATA only. Current upstream versions must be proved
 * by public config.js and readable critical PMD manifest before full capture.
 * Never interpret a completed probe or blocked import as a synced catalog.
 */
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {probe} from './watch-upstream.mjs';
import {publicPmdPreflight,requireCriticalPmd} from './pmd-source-preflight.mjs';

export function catalogDecision(observed,catalog){
 if(!observed?.observed||!/^src-[0-9a-f]{10}$/.test(observed.observed)||
    !/^0\.\\d+(?:\.\\d+)?$/.test(observed.alpha||'')||!observed.alphaProof)
  return {capture:false,attention:true,blocked:true,reason:'upstream-version-unverified'};
 if(observed.observed===catalog?.siteVersion)
  return {capture:false,attention:false,reason:'catalog-already-current'};
 return {capture:true,attention:true,reason:'verified-catalog-drift'};
}

export async function prepareCatalogProbe({read=fs.readFile,probeFn=probe,preflightFn=publicPmdPreflight}={}){
 const [catalog,approved,observed]=await Promise.all([
  read('data/pokearena2d-source-moves.json','utf8').then(JSON.parse),
  read('data/pokearena-approved-alpha.json','utf8').then(JSON.parse),
  probeFn()
 ]);
 const candidate=catalogDecision(observed,catalog);
 const pmd=candidate.capture?await preflightFn():null;
 const decision=requireCriticalPmd(candidate,pmd);
 return {
  type:'catalog-source-preflight',
  status:decision.capture?'capture-ready':decision.blocked?'blocked':'unchanged',
  decision,criticalPmd:pmd,
  observed:{source:observed.observed,alpha:observed.alpha,
    alphaProof:observed.alphaProof,alphaError:observed.alphaError,error:observed.error},
  catalog:{siteVersion:catalog.siteVersion,moduleVersion:catalog.sourceVersion,
    moveCount:catalog.originalMoveCount},
  approved:{source:approved.approvedSource,alpha:approved.approvedAlpha},
  note:'Blocked means the live upstream metadata is NOT synchronized. No placeholder native kits or sprite files are allowed.'
 };
}

async function main(){
 const report=await prepareCatalogProbe();
 await fs.mkdir('site-capture',{recursive:true});
 await fs.writeFile('site-capture/catalog-preflight.json',JSON.stringify(report,null,2)+'\n');
 if(process.env.GITHUB_OUTPUT)
  await fs.appendFile(process.env.GITHUB_OUTPUT,'capture='+report.decision.capture+'\n');
 if(process.env.GITHUB_STEP_SUMMARY)
  await fs.appendFile(process.env.GITHUB_STEP_SUMMARY,[
   '## Poké Arena native move catalog',
   '- Source metadata status: **'+report.status+'**',
   '- Reason: '+report.decision.reason,
   '- Official source: '+(report.observed.source||'unverified'),
   '- Official Alpha (config.js): '+(report.observed.alpha||'unverified'),
   '- Current catalog source: '+(report.catalog.siteVersion||'none'),
   '- Critical PMD: '+JSON.stringify(report.criticalPmd||'not requested'),
   '- Unavailable upstream does not invalidate the previously audited installed game.',
   '- A green probe is NOT proof that a newer upstream catalog was captured.'
  ].join('\n')+'\n');
 if(report.status==='blocked')
  console.warn('::warning::Upstream native catalog blocked; no capture or catalog change performed');
 console.log('POKEARENA_CATALOG_PREFLIGHT',JSON.stringify(report));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
 main().catch(error=>{console.error(error);process.exitCode=1});
