'use strict';
// True Phaser campaign battle regression: live AUTO UI and Arena movement parity.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const MIME={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg',
 '.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/', 'http://127.0.0.1');
 const name=u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname;
 const f=path.resolve(root,'.'+name);
 if(!f.startsWith(root+path.sep)){res.writeHead(403);return res.end('blocked')}
 try{const data=await fs.readFile(f);res.writeHead(200,{'content-type':MIME[path.extname(f)]||'application/octet-stream'});res.end(data)}
 catch{res.writeHead(404);res.end('missing '+name)}
});
(async()=>{
 await new Promise(r=>server.listen(4299,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
   '--use-gl=angle','--use-angle=swiftshader']});
 try{
  for(const viewport of [{width:1280,height:720},{width:854,height:480}]){
   const mobile=viewport.width===854;
   const page=await browser.newPage({viewport,hasTouch:mobile}),errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   await page.goto('http://127.0.0.1:4299/arena2d/?original=1',
    {waitUntil:'domcontentloaded',timeout:45000});
   await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:45000});
   await page.evaluate(async()=>{
    const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
    const core=await import(new URL('./torre2/campaign-core.js',src));
    core.saveCampaign(core.createCampaign('charmander'));
    const title=window.__pt2Game.scene.getScene('titulo');
    title.scene.start('campanha');
   });
   await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
    window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,
    null,{timeout:45000});
   await page.evaluate(async()=>{
    const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
    const core=await import(new URL('./torre2/campaign-core.js',src));
    window.__pt2Game.scene.getScene('campanha').enterBattle(core.readCampaign());
   });
   await page.waitForFunction(()=>{
    const s=window.__pt2Game?.scene.getScene('combate');
    return s?.scene.isActive()&&s.fase==='lucha'&&!!s.__torre2AutoMode?.zone?.active;
   },null,{timeout:60000});
   const first=await page.evaluate(async()=>{
    const scene=window.__pt2Game.scene.getScene('combate'),auto=scene.__torre2AutoMode;
    const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
    const {synchronizedArenaSpeed}=await import(new URL('./torre2/arena-tempo.js',src));
    const actors=scene.luchadores.map(a=>{
     const raw=a.forma.vel+(a.mega?a.forma.mega.vel:0);
     return {id:a.def.id,raw,added:!!a.def.torre2ArenaAdded,
      extended:!!a.def.torre2Kanto151,campaign:a.velBase,
      arena:synchronizedArenaSpeed(raw,{added:!!a.def.torre2ArenaAdded,
       kanto151:!!a.def.torre2Kanto151})*(a.jefe?.vel??1)};
    });
    const zone=auto.zone,canvas=document.querySelector('#juego canvas');
    const rect=canvas.getBoundingClientRect();
    return {mode:scene.datos?.modo,buttonVisible:auto.button.visible,
     label:auto.label.text,enabled:auto.enabled,
     zone:{x:zone.x,y:zone.y,w:zone.width,h:zone.height},
     canvas:{w:rect.width,h:rect.height,x:rect.x,y:rect.y},
     actors,inside:zone.x>0&&zone.x<640&&zone.y>0&&zone.y<360,
     controlIsHuman:scene.controles.includes(auto.control)};
   });
   console.log('CAMPAIGN_AUTO_TEMPO',JSON.stringify({viewport,first}));
   assert.equal(first.mode,'cpu');
   assert.equal(first.label,'AUTO');assert.equal(first.enabled,false);
   assert.equal(first.buttonVisible,true);
   assert.equal(first.inside,true,'AUTO button must be ON the logical canvas');
   assert.equal(first.controlIsHuman,true);
   assert.ok(first.actors.length===2);
   for(const actor of first.actors)assert.equal(actor.campaign,actor.arena,
    'Kanto movement must equal Arena for '+actor.id);
   await fs.mkdir('test-evidence',{recursive:true});
   await page.screenshot({path:'test-evidence/kanto-auto-speed-'+(mobile?'mobile':'desktop')+'-before.png'});
   const px=first.canvas.x+first.zone.x*first.canvas.w/640,
     py=first.canvas.y+first.zone.y*first.canvas.h/360;
   if(mobile)await page.touchscreen.tap(px,py);else await page.mouse.click(px,py);
   const enabled=await page.evaluate(()=>{
    const a=window.__pt2Game.scene.getScene('combate').__torre2AutoMode;
    return {enabled:a.enabled,label:a.label.text};
   });
   assert.equal(enabled.enabled,true,'AUTO must activate on actual '+(mobile?'touch':'mouse'));
   assert.ok(enabled.label.includes('AUTO'));
   if(mobile)await page.touchscreen.tap(px,py);else await page.mouse.click(px,py);
   assert.equal(await page.evaluate(()=>window.__pt2Game.scene.getScene('combate').__torre2AutoMode.enabled),
    false,'Second touch returns manual control');
   assert.deepEqual(errors,[],'No JS runtime errors during campaign AUTO');
   await page.screenshot({path:'test-evidence/kanto-auto-speed-'+(mobile?'mobile':'desktop')+'-after.png'});
   await page.close();
  }
  console.log('PASS campaign real AUTO button desktop/mobile touches and exact Arena speed parity');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
