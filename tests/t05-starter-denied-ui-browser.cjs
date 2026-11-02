'use strict';
// T05: real mobile Phaser starter tap with simulated browser storage denial.
// No battle, XP, capture or natural campaign progress is claimed.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const path=require('node:path'),http=require('node:http');
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
 await new Promise(ok=>server.listen(4596,'127.0.0.1',ok));
 const browser=await chromium.launch({
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']
 });
 let page;
 try{
  page=await browser.newPage({viewport:{width:854,height:480},hasTouch:true,isMobile:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4596/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:65000});
  await page.evaluate(async()=>{
   const main=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   window.__starterCore=await import(new URL('./torre2/campaign-core.js',main));
   if(localStorage.getItem(__starterCore.SAVE_KEY)!==null)
    throw Error('Test must start with no existing campaign');
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return c.scene.isActive()&&c.children.list.some(o=>o.active&&o.input?.enabled&&
    o.getData?.('torre2-starter-select')==='bulbasaur');
  },null,{timeout:65000});
  const initial=await page.evaluate(()=>{
   const core=window.__starterCore;
   return {primary:localStorage.getItem(core.SAVE_KEY),
    backup:localStorage.getItem(core.SAVE_BACKUP_KEY),save:core.readCampaign()};
  });
  assert.deepEqual(initial,{primary:null,backup:null,save:null});
  await page.evaluate(()=>{
   window.__starterSet=Storage.prototype.setItem;
   window.__starterDenied=true;
   Storage.prototype.setItem=function(k,v){
    if(window.__starterDenied&&k===window.__starterCore.SAVE_KEY)
     throw new DOMException('Simulated storage refusal','QuotaExceededError');
    return window.__starterSet.call(this,k,v);
   };
  });
  const tapStarter=async()=>{
   const p=await page.evaluate(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    const zone=c.children.list.find(o=>o.active&&o.input?.enabled&&
     o.getData?.('torre2-starter-select')==='bulbasaur');
    if(!zone)throw Error('Starter control missing');
    const r=document.querySelector('#juego canvas').getBoundingClientRect();
    return {x:r.left+zone.x*r.width/640,y:r.top+zone.y*r.height/360};
   });
   await page.touchscreen.tap(p.x,p.y);
  };
  await tapStarter();
  await page.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return c.scene.isActive()&&c.children.list.some(o=>o.active&&o.visible&&
    o.getData?.('torre2-starter-save-error')===true);
  },null,{timeout:12000});
  const denied=await page.evaluate(()=>{
   const core=window.__starterCore,c=window.__pt2Game.scene.getScene('campanha');
   return {primary:localStorage.getItem(core.SAVE_KEY),
    backup:localStorage.getItem(core.SAVE_BACKUP_KEY),save:core.readCampaign(),
    retry:c.children.list.some(o=>o.active&&o.input?.enabled&&
     o.getData?.('torre2-starter-select')==='bulbasaur')};
  });
  assert.deepEqual(denied,{primary:null,backup:null,save:null,retry:true});
  assert.deepEqual(errors,[],'Starter denial leaked an uncaught Phaser exception');
  await page.screenshot({path:'test-evidence/t05-starter-denied-mobile.png'});
  await page.evaluate(()=>{window.__starterDenied=false});
  await tapStarter();
  await page.waitForFunction(()=>{
   const core=window.__starterCore;
   const saved=core.readCampaign();
   return saved?.starter==='bulbasaur'&&
    window.__pt2Game.scene.getScene('campanha').scene.isActive()&&
    !!window.__pt2Game.scene.getScene('campanha').__torre2BattlePath;
  },null,{timeout:20000});
  const saved=await page.evaluate(()=>{
   const core=window.__starterCore,s=core.readCampaign();
   return {starter:s.starter,stage:s.stage,trainer:s.trainer,wins:s.wins,
    primary:!!localStorage.getItem(core.SAVE_KEY),
    team:s.team.map(m=>m.id),box:s.box.map(m=>m.id),
    dexSeen:s.dexSeen,dexCaught:s.dexCaught};
  });
  assert.equal(saved.starter,'bulbasaur');
  assert.equal(saved.stage,0);assert.equal(saved.trainer,0);
  assert.equal(saved.wins,0);assert.equal(saved.primary,true);
  assert.deepEqual(saved.team,['bulbasaur'],
   'Native starter tap must not grant the debug Mewtwo to the Kanto party');
  assert.deepEqual(saved.box,[],
   'New campaign must not hide a free laboratory Mewtwo in the PC');
  assert.deepEqual(saved.dexSeen,['bulbasaur']);
  assert.deepEqual(saved.dexCaught,['bulbasaur']);
  assert.deepEqual(errors,[]);
  fs.writeFileSync('test-evidence/t05-starter-denied-retry.json',JSON.stringify({
   source:'native Phaser mobile touch; simulated first-save storage denial',
   denied:{checkpointUnchanged:true,errorVisible:true,retryAvailable:true},
   saved,uncaughtPageErrors:errors
  },null,2));
  console.log('T05 STARTER FIRST SAVE DENIAL + NATIVE MOBILE RETRY PASS');
 }finally{
  if(page&&!page.isClosed())await page.close();
  await browser.close();
  await new Promise(done=>server.close(done));
 }
})().catch(e=>{console.error(e);process.exitCode=1;if(server.listening)server.close()});
