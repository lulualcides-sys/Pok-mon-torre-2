'use strict';
// Native mobile Phaser Eevee choice. Storage denial and Lv29 checkpoint are
// fixtures; one real campaign resolver awards XP, not a natural full route.
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
 await new Promise(ok=>server.listen(4574,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:854,height:480},hasTouch:true,isMobile:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4574/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=window.__eeveeCore=await import(new URL('./torre2/campaign-core.js',src));
   const progression=await import(new URL('./torre2/progression.js',src));
   const s=core.createCampaign('bulbasaur');s.stage=4;s.box.push(s.team.pop());
   s.team.push({id:'eevee',uid:'t05-eevee-ui',hp:63,
    progression:progression.createPokemonProgression('eevee',29,{
     experience:progression.totalExperienceForLevel(30)-1}),
    nickname:'Eevee Retry',tmMoves:['Protect'],moves:['Tackle'],movePlanSpecies:'eevee'});
   core.saveCampaign(s);
   const state=core.readCampaign();
   const result=core.resolveBattle(state,true);
   if(!result.won||core.pendingEeveeEvolution(state)?.uid!=='t05-eevee-ui')
    throw Error('Pending Eevee fixture failed');
   window.__eeveeSetItem=Storage.prototype.setItem;
   window.__eeveeDeny=null;
   Storage.prototype.setItem=function(key,value){
    if(key===window.__eeveeDeny)throw new DOMException('Denied','QuotaExceededError');
    return window.__eeveeSetItem.call(this,key,value);
   };
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return c.scene.isActive()&&c.__torre2EeveeChoice?.active;
  },null,{timeout:60000});
  const tap=async()=>{
   const pos=await page.evaluate(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    const button=c.children.list.find(o=>o.active&&o.getData?.('torre2-eevee-choice')==='jolteon');
    if(!button)throw Error('Native Jolteon choice missing');
    const rect=document.querySelector('#juego canvas').getBoundingClientRect();
    return {x:rect.left+button.x*rect.width/640,y:rect.top+button.y*rect.height/360};
   });
   await page.touchscreen.tap(pos.x,pos.y);
  };
  const before=await page.evaluate(()=>{
   const c=window.__eeveeCore;
   return {primary:localStorage.getItem(c.SAVE_KEY),
    backup:localStorage.getItem(c.SAVE_BACKUP_KEY)};
  });
  for(const denied of ['backup','primary']){
   await page.evaluate(which=>{
    const c=window.__eeveeCore;
    window.__eeveeDeny=which==='primary'?c.SAVE_KEY:c.SAVE_BACKUP_KEY;
   },denied);
   await tap();
   await page.waitForFunction(()=>{
    const scene=window.__pt2Game.scene.getScene('campanha');
    return scene.scene.isActive()&&scene.__torre2EeveeChoice?.active&&
     scene.children.list.some(o=>o.active&&o.getData?.('torre2-eevee-save-error')&&
      o.text?.includes('TENTE NOVAMENTE'));
   },null,{timeout:10000});
   const after=await page.evaluate(()=>{
    const c=window.__eeveeCore;
    return {primary:localStorage.getItem(c.SAVE_KEY),
     backup:localStorage.getItem(c.SAVE_BACKUP_KEY),
     pending:c.pendingEeveeEvolution(c.readCampaign())?.uid};
   });
   assert.equal(after.primary,before.primary);
   assert.equal(after.backup,before.backup);
   assert.equal(after.pending,'t05-eevee-ui');
   assert.deepEqual(errors,[]);
  }
  await page.evaluate(()=>{window.__eeveeDeny=null});
  await tap();
  await page.waitForFunction(()=>window.__eeveeCore.readCampaign()?.team?.some(m=>m.uid==='t05-eevee-ui'&&m.id==='jolteon'),
   null,{timeout:15000});
  const final=await page.evaluate(()=>{
   const c=window.__eeveeCore,s=c.readCampaign();
   return {member:s.team.find(m=>m.uid==='t05-eevee-ui'),pending:c.pendingEeveeEvolution(s)};
  });
  assert.equal(final.member.id,'jolteon');
  assert.equal(final.member.nickname,'Eevee Retry');
  assert.equal(final.pending,null);
  assert.deepEqual(errors,[]);
  await page.screenshot({path:'test-evidence/t05-eevee-atomic-mobile.png'});
  console.log('T05 EEVEE MOBILE PHASER: backup/primary denial and native retry PASS');
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
