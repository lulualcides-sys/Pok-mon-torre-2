'use strict';
// Genuine compiled Phaser wild scene with deterministic Shiny encounter data.
// Not a statistical 1% test, naturally earned capture, or physical Android QA.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const http=require('node:http'),path=require('node:path'),{chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css',
 '.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1');
 const file=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const data=await fsp.readFile(file);res.writeHead(200,
  {'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(data)}
 catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(ok=>server.listen(4482,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:854,height:480},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',x=>errors.push(String(x)));
  await page.goto('http://127.0.0.1:4482/arena2d/?original=1',
   {waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=window.__t17Core=await import(new URL('./torre2/campaign-core.js',src));
   const s=core.createPlayerCampaign('bulbasaur');
   s.team[0].shiny=true;
   core.saveCampaign(s);
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'),null,{timeout:60000});
  await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   const s=window.__t17Core.readCampaign();
   const rng=[.2,.004];let used=0;
   const encounter=window.__t17Core.startWildEncounter(s,()=>{
    used++;return rng.shift()??.5;
   });
   if(!encounter.ok||!encounter.encounter.shiny||used!==2)
    throw Error('Could not create real saved Shiny encounter');
   window.__t17Before={
    wins:s.wins,losses:s.losses,stage:s.stage,trainer:s.trainer,
    starter:s.team[0].id,shiny:s.team[0].shiny,
    wild:encounter.encounter.id};
   c.enterBattle(s,true);
  });
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.__torre2ShinyDebug?.entrances?.length>=2&&
    b.__torre2PartyInstalled===true;
  },null,{timeout:70000});
  const evidence=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   const j=b.__torre2ShinyDebug;
   const gfx=b.children.list.filter(x=>x.active&&x.getData?.('torre2-shiny-stars')===true);
   const core=window.__t17Core,s=core.readCampaign();
   return {sideEvents:j.entrances,activeStars:j.active.length,gfx:gfx.length,
    nativePhaser:b.scene.isActive(),captureShiny:s.pendingWild?.shiny===true,
    save:{wins:s.wins,losses:s.losses,stage:s.stage,trainer:s.trainer,shiny:s.team[0].shiny},
    before:window.__t17Before};
  });
  assert.deepEqual(evidence.sideEvents.map(e=>e.side).sort(),[0,1],
   'Both genuinely Shiny fighters must sparkle on visible sendout');
  assert.ok(evidence.activeStars>=1&&evidence.gfx>=1,
   'At least the latest real Phaser star Graphics must still be visible');
  assert.equal(evidence.captureShiny,true);
  assert.equal(evidence.save.shiny,true);
  for(const field of ['wins','losses','stage','trainer'])
   assert.equal(evidence.save[field],evidence.before[field],
    'Entrance VFX must never grant battle progress: '+field);
  await page.screenshot({path:'test-evidence/t17-shiny-entrance-mobile.png'});
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),d=b.__torre2ShinyDebug;
   return b.scene.isActive()&&d?.active?.length===0&&
    !b.children.list.some(x=>x.active&&x.getData?.('torre2-shiny-stars')===true);
  },null,{timeout:7000});
  assert.deepEqual(errors,[],'No native Phaser page error');
  console.log('PASS REAL PHASER 1.5S SHINY ENTRANCE',JSON.stringify(evidence));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
