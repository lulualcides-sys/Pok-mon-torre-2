'use strict';
/* Read-only native Phaser instrumentation. No gameplay implementation changes,
 * network login, altered VFX, damage overrides, or production save writes.
 * Mobile case is Chromium TOUCH EMULATION, never a physical Android measurement.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const fsp=require('node:fs/promises');
const path=require('node:path');
const http=require('node:http');
const {performance}=require('node:perf_hooks');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const MIME={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.ogg':'audio/ogg',
 '.wav':'audio/wav','.svg':'image/svg+xml','.css':'text/css'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url||'/','http://127.0.0.1');
 const f=path.resolve(root,'.'+(url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname));
 if(!f.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const bytes=await fsp.readFile(f);res.writeHead(200,{'content-type':MIME[path.extname(f)]||'application/octet-stream'});res.end(bytes)}
 catch{res.writeHead(404);res.end('missing')}
});
async function readFrames(page,millis){
 return page.evaluate(duration=>new Promise(resolve=>{
  const deltas=[];let t0=null,prev=null;
  function step(t){
   if(t0===null)t0=t;
   if(prev!==null)deltas.push(t-prev);
   prev=t;
   if(t-t0<duration)requestAnimationFrame(step);
   else{
    const sorted=[...deltas].sort((a,b)=>a-b);
    const p=q=>sorted[Math.floor(Math.max(0,sorted.length-1)*q)]??null;
    const elapsed=t-t0;
    resolve({frames:deltas.length,elapsedMs:elapsed,
     fps:elapsed>0?deltas.length*1000/elapsed:0,
     p50FrameMs:p(.5),p95FrameMs:p(.95),
     longFramesOver100Ms:deltas.filter(n=>n>100).length});
   }
  }
  requestAnimationFrame(step);
 }),millis);
}
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(ok=>server.listen(4317,'127.0.0.1',ok));
 const browser=await chromium.launch({
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 const report={date:new Date().toISOString(),renderer:'Chromium headless SwiftShader (software)',
  limitations:['not physical hardware','cannot extrapolate measured FPS to player phones'],
  cases:[]};
 try{
  for(const mode of [
   {id:'desktop',width:1280,height:720,touch:false},
   {id:'mobile-emulated',width:854,height:480,touch:true}
  ]){
   const page=await browser.newPage({
    viewport:{width:mode.width,height:mode.height},
    isMobile:mode.touch,hasTouch:mode.touch,
    deviceScaleFactor:1
   });
   const errors=[],consoleErrors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   page.on('console',e=>{if(e.type()==='error')consoleErrors.push(e.text().slice(0,300))});
   try{
    const firstLoad=performance.now();
    await page.goto('http://127.0.0.1:4317/arena2d/',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:45000});
    const menuMs=performance.now()-firstLoad;
    const campaignStart=performance.now();
    await page.evaluate(async()=>{
     const game=window.__pt2Game;
     const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
     const core=window.__battlePerfCore=await import(new URL('./torre2/campaign-core.js',src));
     core.saveCampaign(core.createCampaign('bulbasaur'));
     game.scene.getScene('titulo').scene.start('campanha');
    });
    await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
     !!window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,null,{timeout:50000});
    const campaignMs=performance.now()-campaignStart;
    const initial=await page.evaluate(()=>{
     const g=window.__pt2Game,c=g.scene.getScene('campanha');
     return {textures:g.textures.getTextureKeys().length,
      renderer:g.renderer.type,
      portraitCount:g.textures.getTextureKeys().filter(k=>k.startsWith('torre2-portrait-')).length,
      npcCount:g.textures.getTextureKeys().filter(k=>k.startsWith('frlg-npc-')).length,
      locationCount:g.textures.getTextureKeys().filter(k=>k.startsWith('frlg-location-')).length,
      initialSave:localStorage.getItem(window.__battlePerfCore.SAVE_KEY),
      campaignPage:c.__torre2BattlePath?.offset};
    });
    const t=performance.now();
    const pos=await page.evaluate(()=>{
     const scene=window.__pt2Game.scene.getScene('campanha');
     const node=scene.children.list.find(x=>x.active&&x.getData?.('torre2-central-cta')===true);
     if(!node)throw Error('Native central campaign battle button is not present');
     const r=document.querySelector('canvas').getBoundingClientRect();
     return {x:r.left+node.x*r.width/640,y:r.top+node.y*r.height/360};
    });
    if(mode.touch)await page.touchscreen.tap(pos.x,pos.y);
    else await page.mouse.click(pos.x,pos.y);
    await page.waitForFunction(()=>{
     const g=window.__pt2Game,b=g.scene.getScene('combate');
     return b.scene.isActive()&&b.fase==='lucha'&&b.__torre2PartyInstalled===true;
    },null,{timeout:70000});
    const battleEntryMs=performance.now()-t;
    const battle=await page.evaluate(()=>{
     const g=window.__pt2Game,b=g.scene.getScene('combate'),s=window.__battlePerfCore.readCampaign();
     return {kind:b.datos?.torre2?.kind,phase:b.fase,
      player:b.datos?.p1,enemy:b.datos?.p2,
      prewarm:g.__torre2BattlePrewarm??null,
      textures:g.textures.getTextureKeys().length,
      controls:b.controles?.length,renderer:g.renderer.type,
      frameErrors:b.erroresFotograma||0,
      save:localStorage.getItem(window.__battlePerfCore.SAVE_KEY),
      badges:s?.badges?.length||0,stage:s?.stage,trainer:s?.trainer};
    });
    const frames=await readFrames(page,3400);
    const end=await page.evaluate(()=>({
     save:localStorage.getItem(window.__battlePerfCore.SAVE_KEY),
     frameErrors:window.__pt2Game.scene.getScene('combate').erroresFotograma||0
    }));
    // A live trainer battle may legitimately mutate HP or save after real
    // combat begins. Verify no unauthorized progress or instant win instead.
    assert.equal(battle.kind,'trainer');
    assert.equal(battle.renderer,2,'Expected WebGL renderer, not HTML canvas fallback');
    assert.equal(battle.frameErrors,0);
    assert.equal(end.frameErrors,0);
    assert.equal(battle.stage,0);assert.equal(battle.trainer,0);
    assert.deepEqual(errors,[]);
    await page.screenshot({path:'test-evidence/native-battle-'+mode.id+'.png'});
    report.cases.push({mode:mode.id,menuMs,campaignMs,battleEntryMs,initial:{
     textures:initial.textures,portraitCount:initial.portraitCount,
     npcCount:initial.npcCount,locationCount:initial.locationCount
    },battle:{...battle,save:undefined},frames,errors,consoleErrors});
    console.log('PERF_NATIVE_BATTLE',JSON.stringify(report.cases.at(-1)));
   }finally{await page.close();}
  }
  fs.writeFileSync('test-evidence/native-battle-perf-report.json',JSON.stringify(report,null,2));
  console.log('PASS real native trainer battle desktop+touch-emulated: menu/campaign/start and frametime sampled');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error('NATIVE_BATTLE_PROFILE_ERROR',String(e?.stack||e));server.close();process.exitCode=1});
