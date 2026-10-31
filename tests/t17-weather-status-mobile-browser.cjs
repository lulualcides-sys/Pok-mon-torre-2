'use strict';
// Actual original compiled Phaser WebGL, touch viewport, isolated laboratory.
// Uses a prepared climate fixture, not fabricated wild captures or wins.
const assert=require('node:assert/strict'),fs=require('node:fs');
const fsp=require('node:fs/promises'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url||'/','http://127.0.0.1');
 const file=path.resolve(root,'.'+(url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const bytes=await fsp.readFile(file);
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(bytes)
 }catch{res.writeHead(404);res.end('not found')}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(ok=>server.listen(4497,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:854,height:480},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4497/arena2d/?original=1',
   {waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js'))?.src;
   if(!src)throw Error('Missing original Phaser');
   const core=window.__weatherTestCore=await import(new URL('./torre2/campaign-core.js',src));
   const lab=await import(new URL('./torre2/laboratory.js',src));
   window.__weatherTestModule=await import(new URL('./torre2/weather.js',src));
   const state=core.createPlayerCampaign('bulbasaur');
   core.saveCampaign(state);
   window.__weatherTestSave=localStorage.getItem(core.SAVE_KEY);
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
   window.__weatherTestMatch=lab.prepareLaboratoryMatch({
    player:'bulbasaur',enemy:'squirtle',level:35,weather:'sun'
   });
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'),
   null,{timeout:60000});
  await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   c.launchBattle(window.__weatherTestMatch,false);
  });
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.__torre2WeatherStatus?.shown.length>=2&&
    b.fase==='lucha';
  },null,{timeout:70000});
  const first=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return {weather:b.__torre2Weather.kind,
    statuses:b.__torre2WeatherStatus.shown,
    onScreen:b.children.list.filter(o=>o.active&&
     o.getData?.('torre2-weather-status')!==undefined).map(o=>({
      text:o.text,side:o.getData('torre2-weather-status'),x:o.x,y:o.y
     }))};
  });
  assert.equal(first.weather,'sun');
  assert.deepEqual(first.statuses.map(x=>({side:x.side,text:x.text})),
   [{side:0,text:'ATK +20%'},{side:1,text:'ATK -20%'}]);
  assert.ok(first.onScreen.length>=1,'Native Text must be visible beside actor');
  await page.screenshot({path:'test-evidence/t17-weather-status-mobile.png'});
  await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   window.__weatherTestModule.setWeather(b.__torre2Weather,'rain');
  });
  await page.waitForFunction(()=>{
   const s=window.__pt2Game.scene.getScene('combate').__torre2WeatherStatus?.shown;
   return s?.length===3&&s.at(-1).side===1&&s.at(-1).text==='ATK +20%';
  },null,{timeout:8000});
  const second=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return {shown:b.__torre2WeatherStatus.shown,
    weather:b.__torre2Weather.kind,
    save:localStorage.getItem(window.__weatherTestCore.SAVE_KEY)};
  });
  assert.equal(second.weather,'rain');
  assert.equal(second.save,await page.evaluate(()=>window.__weatherTestSave),
   'Cosmetic feedback must not modify campaign save');
  assert.deepEqual(errors,[],'No original Phaser errors');
  console.log('PASS NATIVE PHASER WEATHER STATUS FLOAT',JSON.stringify({
   mode:'isolated laboratory',climates:['sun','rain'],
   first:first.statuses,second:second.shown,saved:false,errors:errors.length}));
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>server.close());
