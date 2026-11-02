'use strict';
// Native Phaser mobile result retry. Victory event and storage denial are
// prepared fixtures, not a natural battle or physical Android test.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url||'/','http://127.0.0.1');
 const file=path.resolve(root,'.'+(url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden');}
 try{const bytes=await fsp.readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(bytes);}
 catch{res.writeHead(404);res.end('missing');}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(ok=>server.listen(4581,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:854,height:480},hasTouch:true,isMobile:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4581/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   window.__atomicCore=await import(new URL('./torre2/campaign-core.js',src));
   window.__originalSetItem=Storage.prototype.setItem;
   window.__deniedBattleKey=null;
   Storage.prototype.setItem=function(key,value){
    if(key===window.__deniedBattleKey)throw new DOMException('Denied','QuotaExceededError');
    return window.__originalSetItem.call(this,key,value);
   };
  });
  for(const denied of ['backup','primary']){
   const before=await page.evaluate(which=>{
    const core=window.__atomicCore;
    window.__deniedBattleKey=null;
    core.saveCampaign(core.createCampaign('bulbasaur'));
    localStorage.setItem(core.SAVE_BACKUP_KEY,localStorage.getItem(core.SAVE_KEY));
    const saved={primary:localStorage.getItem(core.SAVE_KEY),backup:localStorage.getItem(core.SAVE_BACKUP_KEY)};
    window.__deniedBattleKey=which==='primary'?core.SAVE_KEY:core.SAVE_BACKUP_KEY;
    const event={finished:true,won:true,marker:{kind:'trainer',stage:0,trainer:0}};
    const active=window.__pt2Game.scene.isActive('campanha');
    if(active)window.__pt2Game.scene.getScene('campanha').scene.restart(event);
    else window.__pt2Game.scene.getScene('titulo').scene.start('campanha',event);
    return saved;
   },denied);
   await page.waitForFunction(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    return c.scene.isActive()&&c.children.list.some(o=>
     o.active&&o.getData?.('torre2-battle-save-retry')===true);
   },null,{timeout:60000});
   const failed=await page.evaluate(()=>{
    const c=window.__atomicCore;
    return {primary:localStorage.getItem(c.SAVE_KEY),
     backup:localStorage.getItem(c.SAVE_BACKUP_KEY),
     wins:c.readCampaign().wins,trainer:c.readCampaign().trainer};
   });
   assert.equal(failed.primary,before.primary);
   assert.equal(failed.backup,before.backup);
   assert.equal(failed.wins,0);assert.equal(failed.trainer,0);
   await page.evaluate(()=>{window.__deniedBattleKey=null});
   const pos=await page.evaluate(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    const button=c.children.list.find(o=>o.active&&o.getData?.('torre2-battle-save-retry')===true);
    if(!button)throw Error('Phaser retry button missing');
    const rect=document.querySelector('#juego canvas').getBoundingClientRect();
    return {x:rect.left+button.x*rect.width/640,y:rect.top+button.y*rect.height/360};
   });
   await page.touchscreen.tap(pos.x,pos.y);
   await page.waitForFunction(()=>{
    const c=window.__atomicCore,s=c.readCampaign();
    return s?.wins===1&&s.trainer===1&&window.__pt2Game.scene.isActive('campanha');
   },null,{timeout:60000});
   const final=await page.evaluate(()=>{
    const s=window.__atomicCore.readCampaign();
    return {wins:s.wins,trainer:s.trainer,money:s.money};
   });
   assert.equal(final.wins,1);assert.equal(final.trainer,1);assert.ok(final.money>1400);
   assert.deepEqual(errors,[]);
  }
  await page.screenshot({path:'test-evidence/t05-battle-result-atomic-mobile.png'});
  console.log('T05 BATTLE RESULT PHASER: primary/backup denial, native retry, single award PASS');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
