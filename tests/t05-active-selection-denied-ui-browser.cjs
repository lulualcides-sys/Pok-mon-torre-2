'use strict';
// T05: native Phaser summary button with touch. Storage denial and party
// composition are fixtures; this is not Android hardware or natural gameplay.
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
 await new Promise(ok=>server.listen(4569,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:854,height:480},hasTouch:true,isMobile:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4569/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   window.__activeCore=await import(new URL('./torre2/campaign-core.js',src));
   const s=__activeCore.createCampaign('squirtle');
   if(s.team.length<2)throw Error('No reserve Pokémon');
   __activeCore.saveCampaign(s);
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'),null,{timeout:65000});
  await page.evaluate(()=>{
   const core=window.__activeCore,c=window.__pt2Game.scene.getScene('campanha');
   c.__activeState=core.readCampaign();
   c.showSummary(c.__activeState,1);
   window.__activeOriginalSet=Storage.prototype.setItem;
   window.__activeDeny=null;
   Storage.prototype.setItem=function(k,v){
    if(k===window.__activeDeny)throw new DOMException('Denied','QuotaExceededError');
    return window.__activeOriginalSet.call(this,k,v);
   };
  });
  const tap=async()=>{
   const p=await page.evaluate(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    const button=c.children.list.find(o=>o.active&&o.input?.enabled&&
     o.getData?.('torre2-active-select')===true);
    if(!button)throw Error('Native summary selection button missing');
    const canvas=document.querySelector('#juego canvas')||document.querySelector('canvas');
    const r=canvas.getBoundingClientRect();
    return {x:r.left+button.x*r.width/640,y:r.top+button.y*r.height/360};
   });
   assert.ok(p.x>=0&&p.x<=854&&p.y>=0&&p.y<=480);
   await page.touchscreen.tap(p.x,p.y);
  };
  const before=await page.evaluate(()=>{
   const core=window.__activeCore,c=window.__pt2Game.scene.getScene('campanha');
   return {state:structuredClone(c.__activeState),
    primary:localStorage.getItem(core.SAVE_KEY),
    backup:localStorage.getItem(core.SAVE_BACKUP_KEY)};
  });
  assert.equal(before.state.active,0);
  for(const denied of ['primary','backup']){
   await page.evaluate(denied=>{
    const core=window.__activeCore;
    window.__activeDeny=denied==='primary'?core.SAVE_KEY:core.SAVE_BACKUP_KEY;
   },denied);
   await tap();
   await page.waitForFunction(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    return c.children.list.some(o=>o.active&&o.getData?.('torre2-active-save-error')===true);
   },null,{timeout:7000});
   const blocked=await page.evaluate(()=>{
    const core=window.__activeCore,c=window.__pt2Game.scene.getScene('campanha');
    return {state:structuredClone(c.__activeState),
     primary:localStorage.getItem(core.SAVE_KEY),
     backup:localStorage.getItem(core.SAVE_BACKUP_KEY)};
   });
   assert.deepEqual(blocked,before,'Denied selection changed session or save');
   assert.deepEqual(errors,[],'Phaser threw during denied selection');
  }
  await page.evaluate(()=>{window.__activeDeny=null});
  await tap();
  await page.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return c.scene.isActive()&&window.__activeCore.readCampaign()?.active===1;
  },null,{timeout:9000});
  const after=await page.evaluate(()=>{
   const core=window.__activeCore;
   return {stored:core.readCampaign(),primary:localStorage.getItem(core.SAVE_KEY)};
  });
  assert.equal(after.stored.active,1);
  assert.equal(JSON.parse(after.primary).active,1);
  assert.deepEqual(errors,[]);
  await page.screenshot({path:'test-evidence/t05-active-selection-mobile.png'});
  console.log('T05 ACTIVE SELECTION PHASER: two denied taps + successful retry PASS');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
