'use strict';
// Native Phaser/WebGL touchscreen regression. Denied storage is simulated;
// this does not claim an Android device or natural campaign progression.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1');
 const file=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const data=await fsp.readFile(file);
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});
  res.end(data);
 }catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(ok=>server.listen(4577,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:854,height:480},hasTouch:true,isMobile:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4577/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   window.__summaryCore=await import(new URL('./torre2/campaign-core.js',src));
   window.__summaryPool=await import(new URL('./torre2/move-pool.js',src));
   window.__summaryOriginalSet=Storage.prototype.setItem;
   window.__summaryDeniedKey=null;
   Storage.prototype.setItem=function(k,v){
    if(k===window.__summaryDeniedKey)throw new DOMException('Denied','QuotaExceededError');
    return window.__summaryOriginalSet.call(this,k,v);
   };
   const s=__summaryCore.createCampaign('squirtle');
   s.team[1].moves=__summaryPool.selectedMoves(s.team[1]);
   s.team[1].movePlanSpecies=s.team[1].id;
   __summaryCore.saveCampaign(s);
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'),null,{timeout:65000});
  const prepare=async()=>page.evaluate(()=>{
   const core=window.__summaryCore,pool=window.__summaryPool;
   const s=core.createCampaign('squirtle');
   s.team[1].moves=pool.selectedMoves(s.team[1]);
   s.team[1].movePlanSpecies=s.team[1].id;
   core.saveCampaign(s);
   const c=window.__pt2Game.scene.getScene('campanha');
   c.summaryFilter='ALL';c.summarySearch='';c.__summaryState=s;
   c.showSummary(s,1,1,0);
   const chosen=pool.selectedMoves(s.team[1]);
   const target=c.children.list.find(o=>o.active&&o.input?.enabled&&
    o.getData?.('torre2-equip-move')&&!chosen.includes(o.getData('torre2-equip-move')));
   if(!target)throw Error('No native selectable move on first page');
   const id=target.getData('torre2-equip-move');
   const canvas=document.querySelector('#juego canvas')||document.querySelector('canvas');
   const r=canvas.getBoundingClientRect();
   return {id,x:r.left+target.x*r.width/640,y:r.top+target.y*r.height/360,
    state:structuredClone(s),primary:localStorage.getItem(core.SAVE_KEY),
    backup:localStorage.getItem(core.SAVE_BACKUP_KEY)};
  });
  for(const key of ['primary','backup']){
   const before=await prepare();
   await page.evaluate(key=>{
    window.__summaryDeniedKey=key==='primary'?__summaryCore.SAVE_KEY:__summaryCore.SAVE_BACKUP_KEY;
   },key);
   await page.touchscreen.tap(before.x,before.y);
   await page.waitForFunction(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    return c.children.list.some(o=>o.active&&o.getData?.('torre2-active-save-error')===true);
   },null,{timeout:12000});
   const denied=await page.evaluate(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    return {state:structuredClone(c.__summaryState),
     primary:localStorage.getItem(__summaryCore.SAVE_KEY),
     backup:localStorage.getItem(__summaryCore.SAVE_BACKUP_KEY)};
   });
   assert.deepEqual(denied,before&&{state:before.state,primary:before.primary,backup:before.backup},
    key+' denied touch changed campaign or storage');
   await page.evaluate(()=>{window.__summaryDeniedKey=null;});
   const again=await page.evaluate(id=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    const target=c.children.list.find(o=>o.active&&o.input?.enabled&&
     o.getData?.('torre2-equip-move')===id);
    if(!target)throw Error('Retry move row missing');
    const canvas=document.querySelector('#juego canvas')||document.querySelector('canvas');
    const r=canvas.getBoundingClientRect();
    return {x:r.left+target.x*r.width/640,y:r.top+target.y*r.height/360};
   },before.id);
   await page.touchscreen.tap(again.x,again.y);
   await page.waitForFunction(id=>{
    const s=window.__pt2Game.scene.getScene('campanha').__summaryState;
    return s.team[1].moves?.[1]===id;
   },before.id,{timeout:12000});
   const saved=await page.evaluate(()=>{
    const s=window.__pt2Game.scene.getScene('campanha').__summaryState;
    return {state:structuredClone(s),reload:__summaryCore.readCampaign()};
   });
   assert.equal(saved.state.team[1].moves[1],before.id);
   assert.deepEqual(saved.reload,saved.state,key+' retry not durable');
  }
  assert.deepEqual(errors,[],'Phaser page errors');
  await page.screenshot({path:'test-evidence/t05-summary-equip-atomic-mobile.png'});
  console.log('T05 summary: primary+backup denial, native touch, retry and reload PASS');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
