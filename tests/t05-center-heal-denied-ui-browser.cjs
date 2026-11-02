'use strict';
// T05: actual Phaser mobile Center tap; HP/status and storage denials are
// fixtures, not a naturally played campaign or physical Android test.
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
 await new Promise(ok=>server.listen(4568,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:854,height:480},hasTouch:true,isMobile:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4568/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   window.__centerCore=await import(new URL('./torre2/campaign-core.js',src));
   const s=__centerCore.createCampaign('squirtle');
   s.team[0].hp=18;s.team[0].status={kind:'burn',elapsed:2};
   s.team[1].hp=0;s.team[1].status={kind:'poison',elapsed:1};
   __centerCore.saveCampaign(s);
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'),null,{timeout:65000});
  await page.evaluate(()=>{
   const core=window.__centerCore,c=window.__pt2Game.scene.getScene('campanha');
   c.__centerState=core.readCampaign();
   c.centerScreen(c.__centerState);
   window.__centerOriginalSet=Storage.prototype.setItem;
   window.__centerDeny=null;
   Storage.prototype.setItem=function(k,v){
    if(k===window.__centerDeny)throw new DOMException('Denied','QuotaExceededError');
    return window.__centerOriginalSet.call(this,k,v);
   };
  });
  const tap=async()=>{
   const p=await page.evaluate(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    const button=c.children.list.find(o=>o.active&&o.input?.enabled&&
     o.getData?.('torre2-center-heal')===true);
    if(!button)throw Error('Missing native Center heal control');
    const canvas=document.querySelector('#juego canvas')||document.querySelector('canvas');
    const r=canvas.getBoundingClientRect();
    return {x:r.left+button.x*r.width/640,y:r.top+button.y*r.height/360};
   });
   assert.ok(p.x>=0&&p.x<=854&&p.y>=0&&p.y<=480);
   await page.touchscreen.tap(p.x,p.y);
  };
  const before=await page.evaluate(()=>{
   const core=window.__centerCore,c=window.__pt2Game.scene.getScene('campanha');
   return {state:structuredClone(c.__centerState),primary:localStorage.getItem(core.SAVE_KEY),
    backup:localStorage.getItem(core.SAVE_BACKUP_KEY)};
  });
  for(const denied of ['primary','backup']){
   await page.evaluate(denied=>{
    const core=window.__centerCore;
    window.__centerDeny=denied==='primary'?core.SAVE_KEY:core.SAVE_BACKUP_KEY;
   },denied);
   await tap();
   await page.waitForFunction(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    return c.children.list.some(o=>o.active&&o.getData?.('torre2-center-save-error')===true);
   },null,{timeout:6000});
   const blocked=await page.evaluate(()=>{
    const core=window.__centerCore,c=window.__pt2Game.scene.getScene('campanha');
    return {state:structuredClone(c.__centerState),primary:localStorage.getItem(core.SAVE_KEY),
     backup:localStorage.getItem(core.SAVE_BACKUP_KEY)};
   });
   assert.deepEqual(blocked,before,'Denied Center healing changed session or checkpoint');
   assert.deepEqual(errors,[],'Phaser threw during denied Center heal');
   await page.evaluate(()=>{window.__centerDeny=null});
   await page.waitForFunction(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    return c.scene.isActive()&&c.__torre2CenterBusy===false&&
     c.children.list.some(o=>o.active&&o.getData?.('torre2-center-heal')===true);
   },null,{timeout:7000});
  }
  await tap();
  await page.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return c.children.list.some(o=>o.active&&o.getData?.('torre2-center-heal-done')===true);
  },null,{timeout:6000});
  const after=await page.evaluate(()=>{
   const core=window.__centerCore,c=window.__pt2Game.scene.getScene('campanha');
   return {live:structuredClone(c.__centerState),stored:core.readCampaign()};
  });
  assert.deepEqual(after.live,after.stored,'Center retry was not persisted');
  for(const member of after.stored.team){
   assert.equal(member.hp,100);
   assert.equal(member.status,null);
  }
  assert.deepEqual(errors,[]);
  await page.screenshot({path:'test-evidence/t05-center-heal-atomic-mobile.png'});
  console.log('T05 CENTER MOBILE PHASER: two denied heals + successful retry PASS');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
