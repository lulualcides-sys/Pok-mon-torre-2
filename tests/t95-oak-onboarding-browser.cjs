'use strict';
/* Browser gate: real Oak -> four dialogue pages -> native Kanto starter ->
 * save checkpoint. This is separate from the broad source-client-smoke.
 * Mobile double-tap protection must not freeze scripted or human dialogue.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.png':'image/png','.webp':'image/webp','.css':'text/css','.woff2':'font/woff2'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url||'/','http://127.0.0.1');
 const file=path.resolve(root,'.'+(url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{
  const body=await fs.readFile(file);
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});
  res.end(body);
 }catch{res.writeHead(404);res.end('not found')}
});
(async()=>{
 await new Promise(done=>server.listen(4332,'127.0.0.1',done));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1024,height:576}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4332/arena2d/?original=1',
   {waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:50000});
  await page.evaluate(()=>window.__pt2Game.scene.getScene('titulo').scene.start('campanha'));
  await page.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return c.scene.isActive()&&c.children.list.some(x=>
    x.getData?.('torre2-oak-continue')&&x.input?.enabled);
  },null,{timeout:40000});
  for(let i=0;i<4;i++){
   await page.evaluate(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    const next=c.children.list.find(x=>x.getData?.('torre2-oak-continue')&&x.input?.enabled);
    if(!next)throw Error('Oak continue is not interactive');
    next.emit('pointerdown');
   });
   await page.waitForTimeout(235);
  }
  const opening=await page.evaluate(async()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   const main=[...document.scripts].find(x=>x.src?.includes('/main.js')).src;
   const core=await import(new URL('./torre2/campaign-core.js',main));
   return{seen:c.__torre2OakIntroSeen,
    choices:c.children.list.filter(x=>x.input?.enabled&&x.getData?.('torre2-starter-select'))
     .map(x=>x.getData('torre2-starter-select')).sort(),
    saved:core.readCampaign()};
  });
  assert.equal(opening.seen,true,'All four Oak dialogue pages complete');
  assert.deepEqual(opening.choices,['bulbasaur','charmander','squirtle']);
  assert.equal(opening.saved,null,'No save is written before starter selection');
  await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   const starter=c.children.list.find(x=>x.getData?.('torre2-starter-select')==='squirtle');
   starter.emit('pointerdown');
  });
  await page.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return c.scene.isActive()&&c.__torre2CardUI?.stage===0&&
     c.__torre2CardUI.mode==='cards'&&c.__torre2BattlePath===null;
  },null,{timeout:35000});
  const saved=await page.evaluate(async()=>{
   const main=[...document.scripts].find(x=>x.src?.includes('/main.js')).src;
   const core=await import(new URL('./torre2/campaign-core.js',main));
   const state=core.readCampaign();
   return{starter:state?.starter,team:state?.team?.map(m=>m.id),stage:state?.stage,trainer:state?.trainer};
  });
  assert.deepEqual(saved,{starter:'squirtle',team:['squirtle'],stage:0,trainer:0});
  assert.deepEqual(errors,[],'No runtime errors during Oak dialogue or first save');
  console.log('T95 Oak native browser PASS',JSON.stringify(saved));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
