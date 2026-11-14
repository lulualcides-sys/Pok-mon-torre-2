import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {COLLAB_19,classifyCredits,auditCollab19}
 from '../tools/pokearena/audit-collab-19-forms.mjs';
import {ALLOWED_VISUAL_SUBSTITUTES}
 from '../tools/pokearena/stage-licensed-visual-substitutes.mjs';
import {auditNativePacks} from '../tools/pokearena/audit-native-packs.mjs';
const SHA='a'.repeat(20),base='https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/';
const row=(artist,license,anims)=>
 '2026-11-01 01:00:00\t'+artist+'\tCUR\t'+license+'\t'+anims+'\n';
async function fixture(run){
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'collab19-'));
 const root=path.join(temp,'site-capture','pokearena-client');
 const out=path.join(temp,'site-capture','substitutes-quarantine');
 await fs.mkdir(path.join(root,'assets/pmd'),{recursive:true});
 await fs.writeFile(path.join(root,'version.json'),JSON.stringify({
  officialAlpha:'0.71.3',src:'src-5ccc174cb8'}));
 const forms=Object.fromEntries(COLLAB_19.map((f,i)=>[f.dex,
  (i+1).toString(16).padStart(20,'0')]));
 await fs.writeFile(path.join(root,'index.html'),
  '<script id="paq">'+JSON.stringify({comun:SHA,formas:forms})+'</script>');
 await fs.writeFile(path.join(root,'assets/pmd/manifest.json'),
  JSON.stringify(Object.fromEntries(COLLAB_19.map(f=>[f.dex,{
   anims:{Idle:{file:f.dex+'/Idle-Anim.png',fw:32,fh:32,durations:[1]}}
  }]))));
 try{return await run({temp,root,out})}finally{await fs.rm(temp,{recursive:true,force:true})}
}
test('maps every exact 19 unresolved costume forms, grouped without duplicate',()=>{
 assert.equal(COLLAB_19.length,19);
 assert.deepEqual(COLLAB_19.map(x=>x.dex).sort(),
  [...ALLOWED_VISUAL_SUBSTITUTES].sort());
 assert.equal(COLLAB_19.filter(x=>x.family==='squirtle-squad').length,3);
 assert.equal(COLLAB_19.filter(x=>x.family==='gengar-line').length,13);
 assert.equal(COLLAB_19.filter(x=>x.family==='moltres').length,3);
 assert.ok(COLLAB_19.every(x=>x.exactCostumeMatch===false&&!x.redistributionCleared));
});
test('CUR credit status requires ALL contributors for each animation to be CC',()=>{
 const good=row('ARTIST_A','CC_BY-NC_4','Idle,Attack');
 const mixed=good+row('ARTIST_B','PMDCollab_1','Idle,Attack');
 assert.equal(classifyCredits(good,['Idle','Attack']).status,'CC_BY_NC_CREDITED');
 assert.equal(classifyCredits(mixed,['Idle','Attack']).status,'MANUAL_RIGHTS_REVIEW');
 assert.equal(classifyCredits(row('CHUNSOFT','Unspecified','Idle,Attack'),['Idle']).status,
  'UNSPECIFIED_RIGHTS');
 assert.equal(classifyCredits(good,['Normal']).status,'MISSING_CURRENT_CREDIT');
 assert.throws(()=>classifyCredits('bad credits',['Idle']),/Malformed SpriteCollab credit row/);
});
test('audit creates revision-scoped reference folders, deduplicates GitHub credit reads',()=>
 fixture(async({root,out})=>{
  const requests=[];
  const fetcher=async(url)=>{
   requests.push(url);
   assert.ok(url.startsWith(base)&&url.endsWith('/credits.txt'));
   const isPortrait=url.includes('/portrait/');
   const isBlocked=url.includes('/0146/0002/');
   if(isBlocked)return new Response('missing',{status:404});
   const licence=url.includes('/0092/')?'Unspecified':
    url.includes('/0146/')?'PMDCollab_2':'CC_BY-NC_4';
   return new Response(row('ARTIST_A',licence,isPortrait?'Normal':'Idle,Attack'),
    {status:200});
  };
  const report=await auditCollab19(root,out,fetcher);
  assert.equal(report.count,19);
  assert.equal(report.creditRequests,18,'nine source pairs queried once, not 19 times');
  assert.equal(requests.length,18);
  assert.equal(report.officialGaps,19);
  assert.equal(report.assetInstallCount,0);
  assert.equal(report.releaseReady,false);
  assert.equal(report.summary.candidate,3+4+5);
  assert.equal(report.summary.review,2);
  assert.equal(report.summary.blocked,4+1);
  assert.equal((await auditNativePacks(root)).missingFormCount,19);
  const pathBase=path.join(out,'0.71.3','src-5ccc174cb8');
  const [key]=await fs.readdir(pathBase);
  const doc=JSON.parse(await fs.readFile(path.join(pathBase,key,'resumo.json'),'utf8'));
  assert.equal(doc.count,19);
  await assert.rejects(fs.access(path.join(root,'assets/pmd/0007-squad/Idle-Anim.png')),/ENOENT/);
  assert.equal(doc.releaseReady,false);
 }));
test('unreachable and missing credits stay blocked, no 403 bypass',()=>
 fixture(async({root,out})=>{
  const fetcher=async()=>new Response('Forbidden',{status:403});
  const result=await auditCollab19(root,out,fetcher);
  assert.equal(result.summary.blocked,19);
  assert.equal(result.assetInstallCount,0);
 }));
test('wrong official revision and non-quarantine output never run',()=>
 fixture(async({root,temp,out})=>{
  await assert.rejects(auditCollab19(root,path.join(temp,'_site'),async()=>new Response('')),
   /quarantine/);
  await fs.writeFile(path.join(root,'version.json'),
   JSON.stringify({officialAlpha:'0.71.4',src:'src-bbbbbbbbbb'}));
  await assert.rejects(auditCollab19(root,out,async()=>new Response('')),
   /exact verified Alpha 0.71.3/);
 }));
