import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {capturePublicMissingPacks} from '../tools/pokearena/capture-public-missing-packs.mjs';
const common='a'.repeat(20), missing='b'.repeat(20);
async function fixture(cb){
 const base=await fs.mkdtemp(path.join(os.tmpdir(),'rea-public-pack-test-'));
 const root=path.join(base,'site-capture','pokearena-client');
 await fs.mkdir(path.join(root,'assets/p'),{recursive:true});
 await fs.mkdir(path.join(root,'assets/pmd'),{recursive:true});
 await fs.writeFile(path.join(root,'version.json'),JSON.stringify({officialAlpha:'0.69.3',src:'src-5ffaa7f73e'}));
 await fs.writeFile(path.join(root,'index.html'),'<script id="paq">'+JSON.stringify({
   comun:common,formas:{'0146':missing}})+'</script>');
 await fs.writeFile(path.join(root,'assets/p',common+'.bin'),Buffer.alloc(90,1));
 await fs.writeFile(path.join(root,'assets/pmd/manifest.json'),JSON.stringify({'0146':{anims:{Idle:{file:'0146/Idle-Anim.png'}}}}));
 try{return await cb(root)}finally{await fs.rm(base,{recursive:true,force:true})}
}
test('copy exactly declared public pack with SHA-256 and no source mutation',()=>fixture(async root=>{
 const touched=[];
 const fetcher=async (url,opts)=>{
   touched.push({url,opts});
   return new Response(Buffer.alloc(100,33),{status:200,headers:{'content-type':'application/octet-stream'}});
 };
 const report=await capturePublicMissingPacks(root,{fetcher});
 assert.equal(report.complete,true);
 assert.equal(report.after.missingForms,0);
 assert.equal(report.downloaded.length,1);
 assert.match(report.downloaded[0].sha256,/^[a-f0-9]{64}$/);
 assert.deepEqual(await fs.readFile(path.join(root,'assets/p',missing+'.bin')),Buffer.alloc(100,33));
 assert.deepEqual(touched.map(x=>x.url),['https://www.pokearena2d.com/assets/p/'+missing+'.bin']);
 assert.equal(touched[0].opts.redirect,'error');
 assert.equal(touched[0].opts.headers,undefined);
 assert.equal(touched[0].opts.credentials,undefined);
}));
test('never retry or circumvent an HTTP 403',()=>fixture(async root=>{
 let hits=0;
 const report=await capturePublicMissingPacks(root,{fetcher:async ()=>{
   hits++;
   return new Response('Access denied',{status:403});
 }});
 assert.equal(hits,1);
 assert.equal(report.complete,false);
 assert.equal(report.after.missingForms,1);
 assert.deepEqual(report.denied,[{path:'assets/p/'+missing+'.bin',status:403}]);
 await assert.rejects(fs.access(path.join(root,'assets/p',missing+'.bin')),/ENOENT/);
}));
test('refuse a fake HTML payload even with HTTP 200',()=>fixture(async root=>{
 const report=await capturePublicMissingPacks(root,{fetcher:async ()=>
  new Response('<html>blocked</html>',{status:200,headers:{'content-type':'text/html'}})});
 assert.equal(report.complete,false);
 assert.ok(report.errors[0].error.includes('HTML fallback'));
}));
test('do not refetch existing valid public native package',()=>fixture(async root=>{
 await fs.writeFile(path.join(root,'assets/p',missing+'.bin'),Buffer.alloc(100,40));
 const report=await capturePublicMissingPacks(root,{fetcher:async()=>{throw Error('unnecessary request')}});
 assert.equal(report.before.missingForms,0);
 assert.equal(report.downloaded.length,0);
 assert.equal(report.complete,true);
}));
test('reject writing to the published site or unknown workspace',async()=>{
 await assert.rejects(capturePublicMissingPacks('_site/arena2d',{fetcher:async()=>{}}),/site-capture/);
});

test('more than 24 missing native packs creates a bounded report, not an early abort',()=>fixture(async root=>{
 const forms=Object.fromEntries(Array.from({length:29},(_,i)=>[
  String(i+1).padStart(4,'0'),(i+1).toString(16).padStart(20,'0')]));
 forms['0132']=missing;
 await fs.writeFile(path.join(root,'index.html'),
  '<script id="paq">'+JSON.stringify({comun:common,formas:forms})+'</script>');
 const manifest=Object.fromEntries(Object.keys(forms).map(dex=>[
  dex,{anims:{Idle:{file:dex+'/Idle-Anim.png'}}}]));
 await fs.writeFile(path.join(root,'assets/pmd/manifest.json'),JSON.stringify(manifest));
 const touched=[];
 const report=await capturePublicMissingPacks(root,{fetcher:async url=>{
  touched.push(url);return new Response('Forbidden',{status:403});
 }});
 assert.equal(report.before.missingForms,30);
 assert.equal(report.selectedPacks,8);
 assert.equal(report.deferredPacks,22);
 assert.equal(report.stoppedAfterDenials,true);
 assert.equal(touched.length,2,'stop after two direct 403s; never mass-query denied files');
 assert.equal(touched[0],'https://www.pokearena2d.com/assets/p/'+missing+'.bin',
  'new Ditto pack gets priority over old gaps');
 assert.equal(report.after.missingForms,30);
 assert.equal(report.complete,false);
 const persisted=JSON.parse(await fs.readFile(
  path.join(root,'public-missing-packs-report.json'),'utf8'));
 assert.equal(persisted.deferredPacks,22);
 assert.equal(persisted.complete,false);
}));
