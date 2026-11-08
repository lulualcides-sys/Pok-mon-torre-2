'use strict';
// Real captured Phaser scene regression: the League AUTO chooses native inputs
// and retains the original evolution/MEGA command in an offline League fight.
// This is NOT a claim of reaching an evolution naturally via real EXP.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1:4317');
 const file=path.resolve(root,'.'+(url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('blocked');}
 try{const buf=await fs.readFile(file);
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});
  return res.end(buf);
 }catch{res.writeHead(404);return res.end('not found');}
});
(async()=>{
 await new Promise(resolve=>server.listen(4317,'127.0.0.1',resolve));
 const browser=await chromium.launch({
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']
 });
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];page.on('pageerror',error=>errors.push(String(error)));
  await page.goto('http://127.0.0.1:4317/arena2d/?original=1');
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),
   null,{timeout:60000});
  await page.evaluate(()=>{
   window.__pt2Game.scene.getScene('titulo').scene.start('combate',{
    modo:'liga',p1:'squirtle',p2:'geodude',mandos:['tactil','pad0'],nivel:'normal'
   });
  });
  await page.waitForTimeout(2500);
  const diagnostic=await page.evaluate(()=>{
   const game=window.__pt2Game,scene=game?.scene?.getScene('combate');
   return {active:scene?.scene?.isActive?.(),fase:scene?.fase,
    mode:scene?.datos?.modo,controllers:(scene?.controles||[]).map(c=>({
     tipo:c?.tipo,hasFighter:!!c?.l,remote:!!c?.l?.remoto,reader:typeof c?.leer})),
    auto:!!scene?.__torre2AutoMode,
    events:scene?.game?.events?.eventNames?.().slice(0,8),
    scenes:game?.scene?.getScenes?.(true)?.map(s=>s.scene.key),
    errorCount:0};
  });
  console.log('LEAGUE_NATIVE_DIAGNOSTIC',JSON.stringify({diagnostic,errors}));
  await page.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('combate');
   return c.scene.isActive()&&c.fase==='lucha'&&!!c.__torre2AutoMode;
  },null,{timeout:12000});
  const observed=await page.evaluate(()=>{
   const scene=window.__pt2Game.scene.getScene('combate');
   const auto=scene.__torre2AutoMode;
   const actor=auto.control.l;
   const originalKit=actor.kit;
   // Override *only* the readiness getter on this in-memory test fighter.
   // This tests the real Phaser controller forwarding EVO to the engine; it
   // does not fabricate an evolved Pokémon or modify the original roster.
   Object.defineProperty(actor,'puedeEvolucionar',{value:true,configurable:true});
   const evo=auto.control.leer(.016);
   delete actor.puedeEvolucionar;
   const kitIntact=actor.kit===originalKit;
   const originalReader=auto.read;
   const data={mode:scene.datos.modo,enabled:auto.enabled,
    ai:auto.ai?.constructor?.name,hadNativeControl:auto.control===scene.controles[0],
    evolutionCommand:evo?.mega===true,kitIntact,autoSpecies:auto.autoSpecies,
    currentSpecies:String(actor.def?.id),buttonText:auto.label.text};
   auto.zone.emit('pointerdown',{id:3},0,0,{stopPropagation(){}});
   data.disabled=!auto.enabled;
   data.manualReaderRestored=auto.control.leer(.016)?.mega!==true;
   data.readerIsWrapped=auto.control.leer!==originalReader;
   return data;
  });
  assert.equal(observed.mode,'liga');
  assert.equal(observed.enabled,true,'League defaults to aggressive native AUTO');
  assert.ok(observed.ai,'Original Phaser IA must be constructed');
  assert.equal(observed.hadNativeControl,true);
  assert.equal(observed.evolutionCommand,true,'AUTO forwards native EVO when getter is ready');
  assert.equal(observed.kitIntact,true,'No original species kit may be replaced');
  assert.equal(observed.disabled,true,'User can disable AUTO');
  assert.equal(observed.manualReaderRestored,true);
  assert.equal(observed.readerIsWrapped,true);
  await page.evaluate(()=>window.__pt2Game.scene.getScene('combate').scene.start('titulo'));
  assert.deepEqual(errors,[],'No Phaser JS errors');
  console.log('PASS_LEAGUE_AUTO_NATIVE_PHASER',JSON.stringify(observed));
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;}).finally(()=>server.close());
