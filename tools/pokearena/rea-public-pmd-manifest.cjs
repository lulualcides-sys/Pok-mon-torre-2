'use strict';
/* Normal public Chromium navigation ONLY for native sprite manifest.
 * No credentials, proxy, stealth, request interception, 403 retry or direct
 * asset retrieval. Identical official index/src before and after the read.
 * This file writes quarantine evidence, never a deployable release tag.
 */
const fs=require('node:fs/promises'),path=require('node:path');
const crypto=require('node:crypto');
const {chromium}=require('playwright-core');
const ORIGIN='https://www.pokearena2d.com';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function checkIndex(html,sourceDir){
 const match=String(html).match(/src=["'](src-[0-9a-f]{10})\/main\.js["']/);
 if(match?.[1]!==sourceDir)throw Error('Public origin source changed during capture');
}
function parsePublicManifest(body){
 if(!Buffer.isBuffer(body)||body.length<10000||body.length>8*1024*1024)
  throw Error('Public sprite manifest empty/oversized');
 const manifest=JSON.parse(body.toString('utf8'));
 const entries=Object.entries(manifest);
 if(entries.length<200||Array.isArray(manifest))throw Error('Unexpected PMD manifest size');
 let valid=0;
 for(const [dex,entry] of entries){
  if(!/^[0-9]{4}(?:-[a-z0-9]+)*$/.test(dex))throw Error('Invalid public dex key');
  const idle=entry?.anims?.Idle?.file;
  if(typeof idle==='string'&&idle.startsWith(dex+'/')&&idle.endsWith('.png'))
   valid++;
 }
 if(valid<150)throw Error('Public PMD Idle metadata is incomplete');
 return {manifest,forms:entries.length,validIdle:valid};
}
async function captureManifest(root,browserProvider){
 const base=path.resolve(root);
 const version=JSON.parse(await fs.readFile(path.join(base,'version.json'),'utf8'));
 if(!/^src-[a-f0-9]{10}$/.test(version.src||'')||
    !/^0\.\d+(?:\.\d+)?$/.test(version.officialAlpha||'')||
    version.verifiedBy!=='public-REA-CDP')
  throw Error('Current Alpha candidate not verified by official REA config.js');
 const report={sourceDir:version.src,alpha:version.officialAlpha,
  method:'unauthenticated-public-Chromium-navigation',status:'blocked',
  bypass:false,changed:false};
 const output=path.join(base,'public-manifest-recovery-report.json');
 let browser;
 try{
  browser=await browserProvider();
  const page=await browser.newPage();
  const index=await page.goto(ORIGIN+'/',{waitUntil:'domcontentloaded',timeout:30000});
  if(!index||index.status()!==200){report.reason='homepage HTTP '+index?.status();return 2}
  checkIndex(await index.text(),version.src);
  const response=await page.goto(ORIGIN+'/assets/pmd/manifest.json',
    {waitUntil:'domcontentloaded',timeout:30000});
  report.httpStatus=response?.status()??null;
  if(!response||response.status()!==200){
   report.reason='manifest HTTP '+response?.status();return 2;
  }
  const bytes=await response.body();
  const {forms,validIdle}=parsePublicManifest(bytes);
  const after=await page.goto(ORIGIN+'/',{waitUntil:'domcontentloaded',timeout:30000});
  if(!after||after.status()!==200){report.reason='homepage HTTP '+after?.status();return 2}
  checkIndex(await after.text(),version.src);
  const target=path.join(base,'assets/pmd/manifest.json');
  await fs.mkdir(path.dirname(target),{recursive:true});
  let older=null;
  try{older=hash(await fs.readFile(target))}catch{}
  if(older!==hash(bytes))await fs.writeFile(target,bytes);
  Object.assign(report,{status:'verified',forms,validIdle,sha256:hash(bytes),
   bytes:bytes.length,previousSha256:older,changed:older!==hash(bytes)});
  console.log('PUBLIC_PMD_MANIFEST_VERIFIED',JSON.stringify(report));
  return 0;
 }catch(e){report.reason=String(e?.message||e).slice(0,220);return 2}
 finally{
  try{await browser?.close()}catch{}
  await fs.writeFile(output,JSON.stringify(report,null,2)+'\n').catch(()=>{});
  if(report.status!=='verified')console.warn('PUBLIC_PMD_MANIFEST_UNAVAILABLE',JSON.stringify(report));
 }
}
module.exports={checkIndex,parsePublicManifest,captureManifest};
if(require.main===module){
 const base=process.argv[2]||'site-capture/pokearena-client';
 captureManifest(base,()=>chromium.launch({
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage']
 })).then(code=>{process.exitCode=code;}).catch(e=>{console.error(e);process.exitCode=1});
}
