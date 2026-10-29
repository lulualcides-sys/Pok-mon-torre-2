'use strict';
// T08: native Phaser mobile touch equips a real earned move and reloads it.
// Level 11 Pidgey is a fixture; not an earned XP route or Android device.
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
 await new Promise(ok=>server.listen(4588,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:854,height:480},hasTouch:true,isMobile:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4588/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  const target=await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=await import(new URL('./torre2/campaign-core.js',src));
   const pool=await import(new URL('./torre2/move-pool.js',src));
   const s=core.createCampaign('bulbasaur');
   s.team[0]={...s.team[0],id:'pidgey',
    progression:{...s.team[0].progression,species:'pidgey',level:11},
    tmMoves:[],moves:null,movePlanSpecies:null};
   core.saveCampaign(s);
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
   const c=window.__pt2Game.scene.getScene('campanha');
   await new Promise(resolve=>setTimeout(resolve,800));
   c.summaryFilter='ALL';c.summarySearch='Quick Attack';
   c.__summaryState=s;c.showSummary(s,0,0,0);
   const row=c.children.list.find(o=>o.active&&o.input?.enabled&&
    o.getData?.('torre2-equip-move')==='quick-attack');
   if(!row)throw Error('Earned Quick Attack is not a tappable editor row');
   const canvas=document.querySelector('#juego canvas')||document.querySelector('canvas');
   const r=canvas.getBoundingClientRect();
   return {x:r.left+row.x*r.width/640,y:r.top+row.y*r.height/360};
  });
  await page.touchscreen.tap(target.x,target.y);
  await page.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return c.__summaryState?.team[0]?.moves?.[0]==='quick-attack';
  },null,{timeout:12000});
  const saved=await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=await import(new URL('./torre2/campaign-core.js',src));
   const pool=await import(new URL('./torre2/move-pool.js',src));
   const p=core.readCampaign().team[0];
   return {move:p.moves?.[0],battle:pool.resolveLoadout(p).lmb?.id};
  });
  assert.deepEqual(saved,{move:'quick-attack',battle:'quick-attack'});
  await page.screenshot({path:'test-evidence/t08-earned-quick-attack-mobile.png'});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('campanha'),null,{timeout:60000});
  const reloaded=await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=await import(new URL('./torre2/campaign-core.js',src));
   const pool=await import(new URL('./torre2/move-pool.js',src));
   const p=core.readCampaign().team[0];
   return {move:p.moves?.[0],battle:pool.resolveLoadout(p).lmb?.id};
  });
  assert.deepEqual(reloaded,{move:'quick-attack',battle:'quick-attack'});
  assert.deepEqual(errors,[],'Native Phaser runtime errors');
  console.log('T08 EARNED QUICK ATTACK MOBILE TOUCH AND RELOAD PASS (FIXTURE)');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
