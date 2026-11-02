'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const fsp=require('node:fs/promises');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg',
 '.webp':'image/webp','.ogg':'audio/ogg','.wav':'audio/wav'};
const server=http.createServer(async(req,res)=>{
 const raw=new URL(req.url||'/','http://127.0.0.1'),key=decodeURIComponent(raw.pathname);
 const file=path.resolve(root,'.'+(key.endsWith('/')?key+'index.html':key));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{const data=await fsp.readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(data);}
 catch{res.writeHead(404);res.end('missing '+key);}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(resolve=>server.listen(4292,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN,
  args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4292/arena2d/');
  await page.waitForFunction(()=>window.__pt2Started&&window.__pt2Game?.scene.isActive('titulo'),null,{timeout:45000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
   window.core=await import(new URL('./torre2/campaign-core.js',src));
   core.saveCampaign(core.createCampaign('bulbasaur'));
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'),null,{timeout:25000});
  const save=await page.evaluate(()=>localStorage.getItem(core.SAVE_KEY));
  await page.evaluate(()=>window.__pt2Game.scene.getScene('campanha').enterTraining(core.readCampaign()));
  await page.waitForFunction(()=>!!window.__pt2Game.scene.getScene('campanha').__labConfig,null,{timeout:25000});
  await page.evaluate(()=>{const c=window.__pt2Game.scene.getScene('campanha');Object.assign(c.__labConfig,{player:'bulbasaur',enemy:'onix',level:50,weather:'none'});c.enterTraining(core.readCampaign());});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const launch=await page.evaluate(()=>{const r=document.querySelector('canvas').getBoundingClientRect();return {x:r.x+r.width*.5,y:r.y+r.height*310/360}});
  await page.mouse.click(launch.x,launch.y);
  await page.waitForFunction(()=>{const b=window.__pt2Game.scene.getScene('combate');return b.scene.isActive()&&b.__torre2LabInstalled&&b.fase==='lucha'},null,{timeout:30000});
  await page.evaluate(()=>{const b=window.__pt2Game.scene.getScene('combate');b.controles.forEach(c=>c.leer=()=>null);});
  const ui=await page.evaluate(()=>{const r=document.querySelector('canvas').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}});
  // Compare the SAME running battle in the SAME Chromium session.
  // Headless SwiftShader is CPU-bound: these are comparative metrics, not
  // device-specific 60 FPS validation or claims about production.
  const sampleFrames=async label=>page.evaluate(({label,durationMs})=>new Promise(resolve=>{
   const frameDeltas=[];let first=null,last=null;
   const tick=timestamp=>{
    if(first===null)first=timestamp;
    if(last!==null)frameDeltas.push(timestamp-last);
    last=timestamp;
    if(timestamp-first<durationMs)requestAnimationFrame(tick);
    else{
     const sorted=frameDeltas.slice().sort((a,b)=>a-b);
     const pct=q=>sorted.length?sorted[Math.min(sorted.length-1,Math.floor((sorted.length-1)*q))]:null;
     resolve({label,frames:frameDeltas.length,elapsedMs:timestamp-first,
      fps:frameDeltas.length*1000/Math.max(1,timestamp-first),
      p50FrameMs:pct(.5),p95FrameMs:pct(.95),
      renderer:window.__pt2Game.renderer.type});
    }
   };
   requestAnimationFrame(tick);
  }),{label,durationMs:2600});
  const fpsSamples=[];
  fpsSamples.push(await sampleFrames('battle_without_vector_overlay'));
  await page.mouse.click(ui.x+ui.w*74/640,ui.y+ui.h*77/360);
  await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').__torre2ReaMathPreview?.active===true,null,{timeout:7000});
  // Prove each individual real projected collision, not just two early hits.
  const waitMode=mode=>page.waitForFunction(m=>{
   const d=window.__pt2Game.scene.getScene('combate').__torre2ReaMathPreview;
   return d?.active===true&&d.mode===m&&d.byMode?.[m]===1;
  },mode,{timeout:16000});
  await waitMode('beam');
  await page.screenshot({path:'test-evidence/rea-vetor-laboratorio-beam.png'});
  await waitMode('dash');
  await page.screenshot({path:'test-evidence/rea-vetor-laboratorio-dash.png'});
  await waitMode('arc');
  await page.screenshot({path:'test-evidence/rea-vetor-laboratorio-arc.png'});
  await page.screenshot({path:'test-evidence/rea-vetor-laboratorio-real.png'});
  const during=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),d=b.__torre2ReaMathPreview;
   const zones=b.children.list.filter(x=>x.type==='Zone'&&x.depth===90002);
   return {debug:{...d,byMode:{...d.byMode}},save:localStorage.getItem(core.SAVE_KEY),
    shield:{count:zones.length,inputEnabled:zones[0]?.input?.enabled},
    combatState:b.fase,frameErrors:b.erroresFotograma||0,
    renderer:window.__pt2Game.renderer.type,fps:window.__pt2Game.loop.actualFps};
  });
  assert.equal(during.save,save,'No campaign save writes allowed');
  assert.equal(during.debug.isolation,'LAB_VISUAL_ONLY');
  assert.deepEqual(during.debug.byMode,{beam:1,dash:1,arc:1});
  assert.equal(during.debug.hitCount,3,'must have exactly 1 impact per mode');
  assert.equal(during.shield.count,1,'one click blocker prevents underlying HUD input');
  assert.equal(during.shield.inputEnabled,true);
  assert.equal(during.frameErrors,0);
  fpsSamples.push(await sampleFrames('same_battle_with_overlay'));

  // Press the visible close control and verify no hidden interaction blocker.
  await page.mouse.click(ui.x+ui.w*74/640,ui.y+ui.h*77/360);
  await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').__torre2ReaMathPreview?.active===false,null,{timeout:6000});
  const afterClose=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return {shieldEnabled:b.children.list.find(x=>x.type==='Zone'&&x.depth===90002)?.input?.enabled,
    save:localStorage.getItem(core.SAVE_KEY)};
  });
  assert.equal(afterClose.shieldEnabled,false);
  assert.equal(afterClose.save,save);
  fpsSamples.push(await sampleFrames('battle_after_overlay_closed'));

  // Reopen on the actual Phaser canvas, confirm new counters and all 3 hits.
  await page.mouse.click(ui.x+ui.w*74/640,ui.y+ui.h*77/360);
  await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').__torre2ReaMathPreview?.active===true,null,{timeout:6000});
  await page.waitForFunction(()=>{
   const d=window.__pt2Game.scene.getScene('combate').__torre2ReaMathPreview;
   return d?.byMode?.arc>=1&&d?.byMode?.dash>=1&&d?.byMode?.beam>=1;
  },null,{timeout:17000});
  const reopening=await page.evaluate(()=>({
   ...window.__pt2Game.scene.getScene('combate').__torre2ReaMathPreview,
   save:localStorage.getItem(core.SAVE_KEY)
  }));
  assert.equal(reopening.hitCount,3);
  assert.deepEqual(reopening.byMode,{beam:1,dash:1,arc:1});
  assert.equal(reopening.save,save);
  // Check a compact landscape viewport without creating a separate player.
  await page.setViewportSize({width:960,height:540});
  await page.waitForTimeout(400);
  await page.screenshot({path:'test-evidence/rea-vetor-laboratorio-compacto.png'});
  const compact=await page.evaluate(()=>({
   phase:window.__pt2Game.scene.getScene('combate').fase,
   enabled:window.__pt2Game.scene.getScene('combate').__torre2ReaMathPreview?.active,
   frameErrors:window.__pt2Game.scene.getScene('combate').erroresFotograma||0,
   save:localStorage.getItem(core.SAVE_KEY)
  }));
  assert.equal(compact.enabled,true);
  assert.equal(compact.save,save);
  assert.equal(compact.frameErrors,0);
  // Use the ACTUAL visible SAIR LAB control, rather than forcing a
  // programmatic scene change from outside Phaser's input/update event.
  const leaveUi=await page.evaluate(()=>{
   const r=document.querySelector('canvas').getBoundingClientRect();
   return {x:r.x+r.width*502/640,y:r.y+r.height*77/360};
  });
  await page.mouse.click(leaveUi.x,leaveUi.y);
  try{
   await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'),null,{timeout:40000});
  }catch(error){
   const diagnostic=await page.evaluate(()=>{
    const game=window.__pt2Game,b=game.scene.getScene('combate'),
     c=game.scene.getScene('campanha');
    return {battleActive:b.scene.isActive(),battlePhase:b.fase,
     battleChanging:b.__torre2Changing,labInstalled:b.__torre2LabInstalled,
     campaignActive:c.scene.isActive(),campaignState:c.sys.settings.status,
     activeScenes:game.scene.getScenes(true).map(s=>s.sys.settings.key)};
   });
   console.error('LAB_EXIT_DIAGNOSTIC',JSON.stringify({diagnostic,errors}));
   await page.screenshot({path:'test-evidence/rea-vetor-laboratorio-saida-diagnostico.png'});
   throw error;
  }
  const afterExit=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return {gone:b.__torre2ReaMathPreview===undefined,
    save:localStorage.getItem(core.SAVE_KEY)};
  });
  assert.equal(afterExit.gone,true,'preview must clean up its instance on scene shutdown');
  assert.equal(afterExit.save,save,'Lab scene exit must not change save');
  assert.deepEqual(errors,[]);
  const results={run:'REAL_CHROMIUM_PHASES',during:{
   debug:during.debug,shield:during.shield,frameErrors:during.frameErrors,
   renderer:during.renderer,fpsSample:during.fps},reopening:{
   hitCount:reopening.hitCount,byMode:reopening.byMode},compact:{
   phase:compact.phase,enabled:compact.enabled,frameErrors:compact.frameErrors},
   afterExit:{instanceRemoved:afterExit.gone,saveByteIdentical:afterExit.save===save},
   frameSamples:fpsSamples,
   comparison:{baselineFps:fpsSamples[0].fps,overlayFps:fpsSamples[1].fps,
    afterCloseFps:fpsSamples[2].fps,
    relativeFpsChangePercent:+((fpsSamples[1].fps/fpsSamples[0].fps-1)*100).toFixed(2)},
   errors};
  fs.writeFileSync('test-evidence/rea-vetor-laboratorio-regressao.json',JSON.stringify(results,null,2));
  console.log('PASS real Chromium: 3 modes, click shield, reopen, compact viewport, scene shutdown and byte-identical save',results);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
