'use strict';
// T05: native mobile Phaser pointer on tall-grass modal. Save failure is
// injected; this is NOT a naturally played encounter or Android hardware.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url||'/','http://127.0.0.1');
 const file=path.resolve(root,'.'+(url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const bytes=await fsp.readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(bytes)}
 catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(ok=>server.listen(4589,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:854,height:480},hasTouch:true,isMobile:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4589/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  const before=await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=window.__t05Core=await import(new URL('./torre2/campaign-core.js',src));
   const state=window.__t05State=core.createCampaign('squirtle');
   core.saveCampaign(state);
   localStorage.setItem(core.SAVE_BACKUP_KEY,localStorage.getItem(core.SAVE_KEY));
   const saved={primary:localStorage.getItem(core.SAVE_KEY),
    backup:localStorage.getItem(core.SAVE_BACKUP_KEY),counter:state.wildEncountersStage,
    dex:[...state.dexSeen]};
   window.__nativeSetItem=Storage.prototype.setItem;
   window.__denyWildKey=core.SAVE_KEY;
   Storage.prototype.setItem=function(key,value){
    if(key===window.__denyWildKey)throw new DOMException('Denied','QuotaExceededError');
    return window.__nativeSetItem.call(this,key,value);
   };
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
   return saved;
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
   window.__pt2Game.scene.getScene('campanha').children.list.length>5,null,{timeout:60000});
  const pos=await page.evaluate(()=>{
   const scene=window.__pt2Game.scene.getScene('campanha');
   scene.grassScreen(window.__t05State);
   const button=scene.children.list.find(o=>o.active&&o.x===465&&o.y===292&&o.depth===630);
   if(!button)throw Error('Native grass-search pointer zone not found');
   const rect=document.querySelector('#juego canvas').getBoundingClientRect();
   return {x:rect.left+button.x*rect.width/640,y:rect.top+button.y*rect.height/360};
  });
  await page.touchscreen.tap(pos.x,pos.y);
  await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha').children.list.some(o=>
   o.active&&o.getData?.('torre2-wild-save-error')===true),null,{timeout:10000});
  const denied=await page.evaluate(()=>{
   const c=window.__t05Core,s=window.__t05State;
   return {primary:localStorage.getItem(c.SAVE_KEY),backup:localStorage.getItem(c.SAVE_BACKUP_KEY),
    counter:s.wildEncountersStage,dex:s.dexSeen,pendingWild:s.pendingWild,
    scene:window.__pt2Game.scene.isActive('campanha')};
  });
  assert.equal(denied.primary,before.primary);assert.equal(denied.backup,before.backup);
  assert.equal(denied.counter,before.counter);assert.deepEqual(denied.dex,before.dex);
  assert.equal(denied.pendingWild,null);assert.equal(denied.scene,true);
  await page.evaluate(()=>{window.__denyWildKey=null});
  await page.touchscreen.tap(pos.x,pos.y);
  await page.waitForFunction(()=>{
   const c=window.__t05Core,s=window.__t05State;
   return !!s.pendingWild&&s.wildEncountersStage===1&&
    JSON.parse(localStorage.getItem(c.SAVE_KEY)).pendingWild?.id===s.pendingWild.id;
  },null,{timeout:15000});
  const after=await page.evaluate(()=>{
   const c=window.__t05Core,s=window.__t05State;
   return {encounter:s.pendingWild?.id,counter:s.wildEncountersStage,
    dex:s.dexSeen,checkpoint:c.readCampaign().pendingWild?.id};
  });
  assert.equal(after.counter,1);assert.equal(after.encounter,after.checkpoint);
  assert.ok(after.dex.includes(after.encounter));assert.deepEqual(errors,[]);
  await page.screenshot({path:'test-evidence/t05-wild-atomic-mobile.png'});
  console.log('T05 native Phaser tall-grass touch: denied save, no phantom encounter, retry persisted PASS');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
