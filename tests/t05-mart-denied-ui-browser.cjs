'use strict';
// Native Phaser Mart button click, real Chromium localStorage rejection and
// retry. The stage and wallet are prepared fixtures, not earned victories.
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
 await new Promise(ok=>server.listen(4526,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:854,height:480},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const tap=async(id)=>{
   const p=await page.evaluate(id=>{
    const scene=window.__pt2Game.scene.getScene('campanha');
    const button=scene.children.list.find(o=>o.active&&o.input?.enabled&&
     o.getData?.('torre2-mart-buy')===id);
    if(!button)throw Error('Native Mart button missing: '+id);
    const canvas=document.querySelector('#juego canvas')||document.querySelector('canvas');
    const r=canvas.getBoundingClientRect();
    return {x:r.left+button.x*r.width/640,y:r.top+button.y*r.height/360};
   },id);
   assert.ok(p.x>=0&&p.x<=854&&p.y>=0&&p.y<=480,'Mart button outside viewport');
   await page.touchscreen.tap(p.x,p.y);
  };
  await page.goto('http://127.0.0.1:4526/arena2d/?original=1',
   {waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=window.__martCore=await import(new URL('./torre2/campaign-core.js',src));
   const s=core.createCampaign('bulbasaur');s.stage=1;s.money=5000;
   core.saveCampaign(s);
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return c.scene.isActive()&&!!c.__torre2BattlePath;
  },null,{timeout:65000});
  await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   c.__martState=window.__martCore.readCampaign();
   c.martScreen(c.__martState,0);
   window.__martOriginalSet=Storage.prototype.setItem;
   window.__martDeny=null;
   Storage.prototype.setItem=function(k,v){
    if(k===window.__martDeny)throw new DOMException('Storage denied','QuotaExceededError');
    return window.__martOriginalSet.call(this,k,v);
   };
  });
  for(const key of ['primary','backup']){
   const before=await page.evaluate(()=>{
    const core=window.__martCore,c=window.__pt2Game.scene.getScene('campanha');
    return {state:structuredClone(c.__martState),
     primary:localStorage.getItem(core.SAVE_KEY),
     backup:localStorage.getItem(core.SAVE_BACKUP_KEY)};
   });
   await page.evaluate(kind=>{
    const core=window.__martCore;
    window.__martDeny=kind==='primary'?core.SAVE_KEY:core.SAVE_BACKUP_KEY;
   },key);
   await tap('antidote');
   const blocked=await page.evaluate(()=>{
    const core=window.__martCore,c=window.__pt2Game.scene.getScene('campanha');
    return {state:structuredClone(c.__martState),
     primary:localStorage.getItem(core.SAVE_KEY),
     backup:localStorage.getItem(core.SAVE_BACKUP_KEY),
     error:c.children.list.some(o=>o.active&&o.getData?.('torre2-mart-save-error')===true)};
   });
   assert.deepEqual(blocked.state,before.state,'denied Mart click changed live state');
   assert.equal(blocked.primary,before.primary,'denied Mart click altered save');
   assert.equal(blocked.backup,before.backup,'denied Mart click altered backup');
   assert.equal(blocked.error,true,'denied Mart click lacks visible Phaser error');
   assert.deepEqual(errors,[],'uncaught Phaser pointer exception');
   await page.screenshot({path:'test-evidence/t05-mart-'+key+'-denied.png'});
   await page.evaluate(()=>{window.__martDeny=null});
   await tap('antidote');
   const after=await page.evaluate(()=>{
    const core=window.__martCore,c=window.__pt2Game.scene.getScene('campanha');
    return {state:structuredClone(c.__martState),loaded:core.readCampaign(),
     error:c.children.list.some(o=>o.active&&o.getData?.('torre2-mart-save-error')===true)};
   });
   assert.equal(after.state.money,before.state.money-100,'successful retry price');
   assert.equal(after.state.inventory.antidote,before.state.inventory.antidote+1);
   assert.deepEqual(after.loaded,after.state,'retry not persisted');
   assert.equal(after.error,false,'old error survived successful retry');
  }
  assert.deepEqual(errors,[]);
  console.log('T05 NATIVE PHASER MART DENIAL AND RETRY PASS');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
