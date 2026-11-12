'use strict';
/**
 * Capture only resources delivered by the official public site to a normal,
 * unauthenticated Chromium page, and the public JavaScript that REA/CDP
 * observes in that very browser. No stealth, login, proxy, request replay,
 * response interception, signed URLs or 403 bypass. A denied resource fails
 * closed. This is an isolated source-audit artifact, NOT an automatic deploy.
 */
const fs=require('node:fs');
const fsp=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const crypto=require('node:crypto');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright-core');

const ORIGIN='https://www.pokearena2d.com';
const CDP='http://127.0.0.1:9235';
const OUT=path.resolve(process.argv[2]||'site-capture/rea-public-0658');
const CLIENT=path.join(OUT,'pokearena-client');
const CHROME=process.env.CHROME_BIN||'/usr/bin/google-chrome';
const REQUIRED_ALPHA=process.env.POKEARENA_EXPECTED_ALPHA||'0.65.8';
const MAX_FILE=12*1024*1024;
const MAX_TOTAL=280*1024*1024;
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'rea-alpha-public-'));

function safeResource(url){
 let u;try{u=new URL(url)}catch{return null}
 if(u.origin!==ORIGIN||u.search||u.hash)return null;
 const p=decodeURIComponent(u.pathname).replace(/^\/+/,'')||'index.html';
 if(p.length>260||p.includes('\\')||p.split('/').includes('..'))return null;
 if(!(/^(?:assets|iconos|lib|src-[a-f0-9]{10})\//.test(p)||
  ['index.html','favicon.png','favicon.ico','safari.js','manifest.webmanifest'].includes(p)))return null;
 if(/(^|\/)(\.env|secret|token|password|credentials|private)(\/|\.|$)/i.test(p))return null;
 return p;
}
async function runREA(pageId){
 const args=['-y','rea-agents@6.8.0','inspect-web-page',CDP,pageId,
  '--observation-ms','900','--include-script-sources','--json'];
 const p=spawn('npx',args,{stdio:['ignore','pipe','pipe']});
 const stdout=[],stderr=[];
 p.stdout.on('data',x=>stdout.push(Buffer.from(x)));
 p.stderr.on('data',x=>{if(Buffer.concat(stderr).length<16000)stderr.push(Buffer.from(x))});
 const result=await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{p.kill('SIGTERM');reject(Error('REA timed out'))},80000);
  p.on('error',e=>{clearTimeout(timer);reject(e)});
  p.on('close',(code,signal)=>{clearTimeout(timer);resolve({code,signal})});
 });
 if(result.code!==0)throw Error('REA CLI '+result.code+' '+Buffer.concat(stderr).toString('utf8').slice(0,1000));
 const all=Buffer.concat(stdout).toString('utf8');
 const report=JSON.parse(all);
 if(report.isError||report.error)throw Error('REA analysis failed');
 return report;
}
function sourceOf(entry){
 const v=entry?.source;
 if(typeof v==='string')return v;
 if(typeof v?.artifact?.text==='string')return v.artifact.text;
 for(const key of ['text','sourceText','source_text','code','content'])
  if(typeof v?.[key]==='string')return v[key];
 return null;
}
async function main(){
 await fsp.mkdir(CLIENT,{recursive:true});
 const chrome=spawn(CHROME,[
  '--headless=new','--no-sandbox','--disable-dev-shm-usage','--no-first-run',
  '--no-default-browser-check','--remote-debugging-address=127.0.0.1',
  '--remote-debugging-port=9235','--user-data-dir='+profile,'about:blank'
 ],{stdio:'ignore'});
 let browser;
 const report={generatedAt:new Date().toISOString(),source:ORIGIN,expectedAlpha:REQUIRED_ALPHA,
  observedAlpha:null,sourceDir:null,rea:true,noLogin:true,noStealth:true,noBypass:true,
  saved:[],errors:[],blocked:[],loadedScripts:0,selectedFromOfficialConfig:false};
 const collected=new Map();
 let bytes=0;
 const pending=new Set();
 const keep=async(p,data,method)=>{
  if(!p||!Buffer.isBuffer(data)||!data.length||data.length>MAX_FILE)return false;
  if(bytes+data.length>MAX_TOTAL)throw Error('Public capture too large');
  const earlier=collected.get(p);
  if(earlier){
   if(sha256(earlier.data)!==sha256(data))report.errors.push({path:p,error:'source changed during capture'});
   return true;
  }
  bytes+=data.length;
  collected.set(p,{data,method});
  return true;
 };
 try{
  for(let n=0;n<40;n++){
   try{const x=await fetch(CDP+'/json/version',{signal:AbortSignal.timeout(2000)});if(x.ok)break}
   catch{}
   if(n===39)throw Error('Chrome public CDP port unavailable');
   await sleep(300);
  }
  browser=await chromium.connectOverCDP(CDP);
  const context=browser.contexts()[0];
  const page=await context.newPage();
  page.on('response',resp=>{
   const key=safeResource(resp.url());
   if(!key)return;
   if(resp.status()!==200){
    if(resp.status()>=400)report.blocked.push({path:key,status:resp.status()});
    return;
   }
   const promise=(async()=>{try{
    const body=await resp.body();
    await keep(key,body,'browser-network');
   }catch(e){report.errors.push({path:key,error:String(e.message).slice(0,150)})}})();
   pending.add(promise);
   promise.finally(()=>pending.delete(promise));
  });
  const nav=await page.goto(ORIGIN+'/',{waitUntil:'domcontentloaded',timeout:40000});
  if(!nav||nav.status()!==200)throw Error('Public homepage blocked '+nav?.status());
  // Passive load: do not click online/ranked battles, log in, or load private API.
  await page.waitForTimeout(6500);
  const targets=await (await fetch(CDP+'/json/list')).json();
  const active=targets.find(x=>x.type==='page'&&x.url.startsWith(ORIGIN+'/'));
  if(!active)throw Error('Public site tab not found in CDP');
  const rea=await runREA(active.id);
  report.reaEvidenceId=rea.evidence_id??null;
  const items=rea.normalized_result?.scripts?.items||[];
  report.loadedScripts=items.length;
  if(items.length<50)throw Error('Public script graph incomplete: '+items.length);
  for(const item of items){
   const p=safeResource(item.url);
   if(!p||!/^src-[a-f0-9]{10}\/.+\.js$/.test(p))continue;
   const js=sourceOf(item);
   if(typeof js==='string'&&js.length>0)await keep(p,Buffer.from(js,'utf8'),'REA-CDP-visible-source');
  }
  await Promise.allSettled([...pending]);
  const versions=[...new Set([...collected.keys()].map(x=>x.match(/^(src-[a-f0-9]{10})\//)?.[1]).filter(Boolean))];
  const index=collected.get('index.html')?.data.toString('utf8');
  if(!index)throw Error('Missing publicly served index.html');
  const declared=index.match(/src="(src-[a-f0-9]{10})\/main\.js"/)?.[1];
  if(!declared)throw Error('Official index does not identify versioned main.js');
  report.sourceDir=declared;
  const conf=collected.get(declared+'/config.js')?.data.toString('utf8');
  const raw=conf?.match(/\b(?:const|let)\s+VERSION\s*=\s*["'](0\.\d+(?:\.\d+)?)["']/);
  report.observedAlpha=raw?.[1]??null;
  report.selectedFromOfficialConfig=!!raw;
  if(!report.observedAlpha)throw Error('Missing official Alpha version from native config.js');
  if(REQUIRED_ALPHA!=='auto'&&report.observedAlpha!==REQUIRED_ALPHA)
   throw Error('Actual published client Alpha '+report.observedAlpha+' != requested '+REQUIRED_ALPHA);
  if(!collected.has(declared+'/main.js'))throw Error('Missing real main.js');
  for(const required of [
   'config.js','notas.js','datos.js','sprites.js','habilidades.js','luchador.js',
   'escenas/titulo.js','escenas/seleccion.js','escenas/combate.js',
   'escenas/carga.js','escenas/pokedex.js','escenas/jefe.js'
  ])if(!collected.has(declared+'/'+required))
   throw Error('Incomplete public module: '+declared+'/'+required);
  let files=0;
  for(const [p,{data,method}] of collected){
   // Scripts unrelated to selected version are never added to release.
   if(/^src-[a-f0-9]{10}\//.test(p)&&!p.startsWith(declared+'/'))continue;
   const full=path.join(CLIENT,p);
   await fsp.mkdir(path.dirname(full),{recursive:true});
   await fsp.writeFile(full,data);
   report.saved.push({path:p,bytes:data.length,sha256:sha256(data),method});
   files++;
  }
  await fsp.writeFile(path.join(OUT,'rea-capture-summary.json'),JSON.stringify({
   ...report,fileCount:files,totalBytes:bytes,otherSourceHashesSeen:versions.filter(x=>x!==declared),
   missing:[],stage:'PUBLIC_SCRIPT_CAPTURE_ONLY_NOT_FULL_NATIVE_CLIENT'
  },null,2)+'\n');
  console.log('REA_PUBLIC_ALPHA_CAPTURE',JSON.stringify({
   alpha:report.observedAlpha,sourceDir:declared,scriptCount:items.length,
   files,totalBytes:bytes,blocked:report.blocked.slice(0,12),errors:report.errors.slice(0,12),
   stage:'public modules captured; assets and full build NOT YET VALIDATED'
  }));
 }finally{
  try{await browser?.close()}catch{}
  chrome.kill('SIGTERM');
  await sleep(350);
  fs.rmSync(profile,{recursive:true,force:true});
 }
}
main().catch(async error=>{
 const msg=String(error?.stack||error);
 console.error('REA_CAPTURE_FAILED',msg);
 await fsp.mkdir(OUT,{recursive:true});
 await fsp.writeFile(path.join(OUT,'rea-capture-failure.json'),
  JSON.stringify({error:msg,source:ORIGIN,expectedAlpha:REQUIRED_ALPHA,
   stage:'no-native-source-upgrade-committed'},null,2));
 process.exitCode=1;
});
