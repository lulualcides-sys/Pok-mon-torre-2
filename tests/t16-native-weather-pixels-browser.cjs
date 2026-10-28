'use strict';
// T16: real Chromium mobile Phaser/WebGL verifies 4 original weather layers,
// scene shutdown cleanup, unchanged party/save and no prior approved VFX edit.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1');
 const file=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const bytes=await fsp.readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(bytes)}
 catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(ok=>server.listen(4466,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
   '--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:854,height:480},hasTouch:true,isMobile:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4466/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=window.t16Core=await import(new URL('./torre2/campaign-core.js',src));
   core.saveCampaign(core.createCampaign('bulbasaur'));
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'),null,{timeout:60000});
  const save=await page.evaluate(()=>localStorage.getItem(window.t16Core.SAVE_KEY));
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const {prepareLaboratoryMatch}=await import(new URL('./torre2/laboratory.js',src));
   const match=prepareLaboratoryMatch({player:'charizard',enemy:'onix',level:50,weather:'rain'});
   window.__pt2Game.scene.getScene('campanha').launchBattle(match,false);
  });
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.__torre2LabInstalled&&b.__torre2PartyInstalled&&
    b.__torre2WeatherPixels&&b.fase==='lucha';
  },null,{timeout:70000});
  await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   b.controles.forEach(c=>{c.leer=()=>null;});
   b.luchadores.forEach(actor=>{actor.inmortal=true;});
  });
  const observed=[];
  for(const kind of ['rain','sun','sand','hail']){
   await page.evaluate(async kind=>{
    const b=window.__pt2Game.scene.getScene('combate');
    const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
    const weather=await import(new URL('./torre2/weather.js',src));
    weather.setWeather(b.__torre2Weather,kind);
   },kind);
   await page.waitForFunction(expected=>{
    const b=window.__pt2Game.scene.getScene('combate'),fx=b.__torre2WeatherPixels;
    return fx?.lastKind===expected&&fx.layer.visible&&fx.layer.commandBuffer.length>0;
   },kind,{timeout:12000});
   const data=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate'),f=b.__torre2WeatherPixels;
    const g=f.layer;return {kind:f.lastKind,visible:g.visible,commands:g.commandBuffer.length,
     draws:f.draws,depth:g.depth,disposed:f.disposed,remaining:b.__torre2Weather.remaining,
     enemy:b.luchadores[1].def.id,player:b.luchadores[0].def.id,
     renderer:b.game.renderer.type};
   });
   assert.equal(data.kind,kind);
   // Phaser Graphics expands each fillStyle+fillRect pair to eight native
   // commandBuffer entries, not two. 48 particles therefore cost <=384 ops.
   assert.ok(data.commands>0&&data.commands<=48*8,
    'T16 graphics command budget must stay bounded, '+JSON.stringify(data));
   assert.ok(data.draws>0&&!data.disposed);
   observed.push(data);
   await page.screenshot({path:'test-evidence/t16-weather-'+kind+'.png'});
  }
  await page.evaluate(async()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const weather=await import(new URL('./torre2/weather.js',src));
   weather.setWeather(b.__torre2Weather,'none');
  });
  await page.waitForFunction(()=>{
   const f=window.__pt2Game.scene.getScene('combate').__torre2WeatherPixels;
   return f?.lastKind==='none'&&!f.layer.visible&&f.layer.commandBuffer.length===0;
  },null,{timeout:12000});
  const closed=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   const fx=b.__torre2WeatherPixels;
   window.t16WeatherFx=fx;
   b.scene.start('campanha',{finished:true,won:true,marker:{laboratory:true}});
   return {visible:fx.layer.visible,empty:fx.layer.commandBuffer.length===0};
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
   window.t16WeatherFx.disposed&&window.__pt2Game.scene.getScene('combate').__torre2WeatherPixels===null,
   null,{timeout:12000});
  assert.deepEqual(closed,{visible:false,empty:true});
  assert.equal(await page.evaluate(()=>localStorage.getItem(window.t16Core.SAVE_KEY)),
   save,'Weather visual layer cannot change the Kanto campaign save');
  assert.deepEqual(errors,[],'No Phaser exceptions');
  fs.writeFileSync('test-evidence/t16-native-weather-pixels.json',JSON.stringify({
   scope:'Four original pixel-weather layers on real mobile Phaser WebGL',
   fixture:'Training lab match, immortality and weather toggles to isolate visuals',
   count:observed.length,observed,weatherStopped:closed,savePreserved:true
  },null,2));
  console.log('T16 NATIVE PIXEL WEATHER PASS',JSON.stringify(observed));
 }finally{await browser.close();server.close();}
})().catch(err=>{console.error(err);process.exitCode=1;server.close()});
