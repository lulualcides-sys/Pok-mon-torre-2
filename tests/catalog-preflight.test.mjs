import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {captureDecision} from '../tools/pokearena/capture-gate.mjs';
import {publicPmdPreflight,requireCriticalPmd,PUBLIC_PMD_MANIFEST} from '../tools/pokearena/pmd-source-preflight.mjs';
import {catalogDecision,prepareCatalogProbe} from '../tools/pokearena/catalog-preflight.mjs';

const official={observed:'src-5ccc174cb8',alpha:'0.71.3',
 alphaProof:'https://www.pokearena2d.com/src-5ccc174cb8/config.js'};
const catalog={siteVersion:'src-43a0198bd6',sourceVersion:'src-2c69e32038',originalMoveCount:327};
const approved={approvedAlpha:'0.71.3',approvedSource:'src-5ccc174cb8',publishedCommit:'verified'};
const manifest=Object.fromEntries(Array.from({length:120},(_,i)=>[
 String(i).padStart(4,'0'),{anims:{Idle:{file:'0001/Idle-Anim.png'}}}
]));
const ok=(json=manifest)=>({ok:true,status:200,json:async()=>json});

test('critical official PMD manifest must be readable and structurally plausible',async()=>{
 const r=await publicPmdPreflight(async url=>{
  assert.equal(url,PUBLIC_PMD_MANIFEST);
  return ok();
 });
 assert.equal(r.ok,true);assert.equal(r.entries,120);
});
test('HTTP 403/404 or network errors never authorize a snapshot import',async()=>{
 for(const status of [403,404,503]){
  const r=await publicPmdPreflight(async()=>({ok:false,status}));
  assert.deepEqual({ok:r.ok,reason:r.reason,httpStatus:r.httpStatus},
   {ok:false,reason:'pmd-http-'+status,httpStatus:status});
  const d=requireCriticalPmd({capture:true,reason:'verified-change',attention:true},r);
  assert.deepEqual(d,{capture:false,attention:true,blocked:true,
   reason:'critical-native-pmd-unavailable'});
 }
 const timeout=await publicPmdPreflight(async()=>{throw Error('timeout')});
 assert.equal(timeout.ok,false);
 assert.equal(requireCriticalPmd({capture:true},timeout).capture,false);
});
test('empty or fabricated native manifest is rejected',async()=>{
 for(const partial of [{},Object.fromEntries(Object.entries(manifest).slice(0,20))]){
  const result=await publicPmdPreflight(async()=>ok(partial));
  assert.equal(result.ok,false);
  assert.equal(result.reason,'pmd-incomplete');
 }
});
test('already proven catalog does not recapture; older catalog requires full evidence',()=>{
 assert.deepEqual(catalogDecision(official,{...catalog,siteVersion:official.observed}),
  {capture:false,attention:false,reason:'catalog-already-current'});
 assert.deepEqual(catalogDecision(official,catalog),
  {capture:true,attention:true,reason:'verified-catalog-drift'});
 assert.equal(catalogDecision({...official,alpha:null},catalog).capture,false);
 assert.equal(catalogDecision({...official,alpha:'0.71.3',alphaProof:null},catalog).blocked,true);
});
test('same deployed game need not download assets; manual capture still requires PMD',()=>{
 const noNeed=captureDecision(official,approved,'schedule');
 assert.equal(requireCriticalPmd(noNeed,null).capture,false);
 const manual=captureDecision(official,approved,'workflow_dispatch');
 assert.equal(manual.capture,true);
 assert.equal(requireCriticalPmd(manual,{ok:false,reason:'pmd-http-403'}).capture,false);
});
test('catalog probe records BLOCKED distinctly from verified catalog sync',async()=>{
 const read=async filename=>filename.includes('source-moves')?JSON.stringify(catalog):JSON.stringify(approved);
 const blocked=await prepareCatalogProbe({
  read,probeFn:async()=>({...official,error:null}),
  preflightFn:async()=>({ok:false,reason:'pmd-http-403',httpStatus:403})
 });
 assert.equal(blocked.status,'blocked');
 assert.equal(blocked.decision.capture,false);
 assert.equal(blocked.criticalPmd.httpStatus,403);
 assert.equal(blocked.catalog.siteVersion,catalog.siteVersion);
 const ready=await prepareCatalogProbe({read,probeFn:async()=>({...official}),preflightFn:async()=>({ok:true,entries:484})});
 assert.equal(ready.status,'capture-ready');assert.equal(ready.decision.capture,true);
});
test('workflow never makes blind catalog updates or silently changes approved game',()=>{
 const workflow=readFileSync(new URL('../.github/workflows/pokearena-native-moves-watch.yml',import.meta.url),'utf8');
 assert.match(workflow,/node tools\/pokearena\/catalog-preflight\.mjs/);
 assert.match(workflow,/if: steps\.probe\.outputs\.capture == 'true'/);
 assert.match(workflow,/gh pr create --draft/);
 assert.doesNotMatch(workflow,/git push origin HEAD:main/);
 assert.match(workflow,/site-capture\/catalog-preflight\.json/);
 assert.match(workflow,/prepare-audited-qa\.sh/);
});
