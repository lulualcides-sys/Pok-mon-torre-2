'use strict';
// T17 visual markers in actual compiled Phaser. Prepared Shiny save fixture;
// NOT evidence of a randomly encountered Shiny, native Shiny VFX or Android.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const http=require('node:http'),path=require('node:path'),{chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css',
 '.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml',
 '.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1');
 const p=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!p.startsWith(root+path.sep)){res.writeHead(403);return res.end('blocked')}
 try{const data=await fsp.readFile(p);res.writeHead(200,{'content-type':mime[path.extname(p)]||'application/octet-stream'});res.end(data)}
 catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(ok=>server.listen(4493,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:854,height:480},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4493/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  await page.evaluate(async()=>{
   const script=[...document.scripts].find(s=>s.src?.includes('/main.js'))?.src;
   if(!script)throw Error('Missing original compiled Phaser main.js');
   const core=window.__t17Core=await import(new URL('./torre2/campaign-core.js',script));
   const state=core.createPlayerCampaign('bulbasaur');
   state.team[0].shiny=true;
   state.dexShinySeen=['bulbasaur','pikachu'];
   state.dexShinyCaught=['bulbasaur'];
   state.dexSeen=['bulbasaur','pikachu'];
   core.saveCampaign(state);
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'),
   null,{timeout:60000});
  const snapshot=()=>page.evaluate(()=>{
   const core=window.__t17Core;const state=core.readCampaign();
   return {state,raw:localStorage.getItem(core.SAVE_KEY)};
  });
  const before=await snapshot();
  const screen=async(callback)=>page.evaluate(fn=>{
   const c=window.__pt2Game.scene.getScene('campanha'),s=window.__t17Core.readCampaign();
   if(fn==='summary')c.showSummary(s,0);
   if(fn==='dex')c.dexScreen(s);
   if(fn==='second-page'){c.dexPage=1;c.dexScreen(s)}
   return {text:c.children.list.filter(o=>typeof o.text==='string').map(o=>o.text),
    labeled:c.children.list.filter(o=>o.active&&o.getData?.('torre2-shiny-summary-label')===true)
     .map(o=>o.text)};
  },callback);
  let view=await screen('summary');
  assert.deepEqual(view.labeled,['✦ SHINY'],'Shiny individual must have unique summary marker');
  await page.screenshot({path:'test-evidence/t17-shiny-summary-mobile.png'});
  view=await screen('dex');
  assert.ok(view.text.some(t=>t.includes('001. Bulbasaur ✦ SHINY')),
   'Captured Shiny must be distinct from normal caught star');
  assert.ok(view.text.some(t=>t.includes('SHINY AVISTADOS 2 · CAPTURADOS 1')),
   'Dex summary must not count sightings as captures');
  await page.screenshot({path:'test-evidence/t17-shiny-dex-mobile.png'});
  view=await screen('second-page');
  assert.ok(view.text.some(t=>t.includes('025. Pikachu ✦')&&!t.includes('SHINY')),
   'Shiny sighting must not claim Shiny capture');
  const after=await snapshot();
  assert.equal(after.raw,before.raw,'Summary and Pokédex must never rewrite a save');
  assert.equal(after.state.team[0].shiny,true);
  assert.deepEqual(errors,[],'No Phaser page errors');
  console.log('PASS T17 REAL PHASER SHINY SUMMARY AND DEX',JSON.stringify({
   mobile:{width:854,height:480},caught:'bulbasaur',sighted:'pikachu',
   saveUntouched:true,errors:errors.length}));
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>server.close());
