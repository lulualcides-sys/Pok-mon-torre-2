'use strict';
// Browser smoke-test of the authorized original Poké Arena Phaser client,
// isolated at /arena2d/ from the Kanto campaign. Does not contact online services.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const fsp=require('node:fs/promises');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg',
 '.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.mp3':'audio/mpeg',
 '.ogg':'audio/ogg','.wav':'audio/wav'};
const server=http.createServer(async(req,res)=>{
 const requested=new URL(req.url||'/', 'http://127.0.0.1');
 let key=decodeURIComponent(requested.pathname);
 if(key.endsWith('/'))key+='index.html';
 const absolute=path.resolve(root,'.'+key);
 if(!absolute.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{
  const data=await fsp.readFile(absolute);
  res.writeHead(200,{'content-type':types[path.extname(absolute)]||'application/octet-stream'});
  res.end(data);
 }catch{res.writeHead(404);res.end('missing '+key);}
});

(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(r=>server.listen(4278,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:4278/arena2d/');
 await page.waitForFunction(()=>window.__pt2Started&&window.__pt2Game?.scene.isActive('titulo'),null,{timeout:45000});
 await page.evaluate(async()=>{
  const src=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
  window.core=await import(new URL('./torre2/campaign-core.js',src));
  core.saveCampaign(core.createCampaign('bulbasaur'));
  window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
 });
 await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'));

 const snapshot=await page.evaluate(()=>localStorage.getItem(core.SAVE_KEY));
 await page.evaluate(()=>window.__pt2Game.scene.getScene('campanha').enterTraining(core.readCampaign()));
 await page.screenshot({path:'test-evidence/laboratory-menu.png'});
 await page.evaluate(()=>{const c=window.__pt2Game.scene.getScene('campanha');Object.assign(c.__labConfig,{player:'blastoise',enemy:'onix',level:50,weather:'sand'});c.enterTraining(core.readCampaign());});
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const launch=await page.evaluate(()=>{const r=document.querySelector('canvas').getBoundingClientRect();return {x:r.x+r.width*.5,y:r.y+r.height*310/360}});
 await page.mouse.click(launch.x,launch.y);
 await page.waitForFunction(()=>{const b=window.__pt2Game.scene.getScene('combate');return b.scene.isActive()&&b.__torre2LabInstalled},null,{timeout:30000});
 await page.evaluate(()=>{const b=window.__pt2Game.scene.getScene('combate');b.controles.forEach(c=>c.leer=()=>null)});
 await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').fase==='lucha',null,{timeout:30000});
 // Exercise visible native-camera controls, not just installed flags.
 const ui=await page.evaluate(()=>{const r=document.querySelector('canvas').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}});
 await page.mouse.click(ui.x+ui.w*252/640,ui.y+ui.h*77/360);
 await page.waitForFunction(()=>!!window.__pt2Game.scene.getScene('combate').luchadores[0].est.veneno);
 await page.mouse.click(ui.x+ui.w*170/640,ui.y+ui.h*77/360);
 await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').__torre2Weather.kind==='hail');
 await page.screenshot({path:'test-evidence/laboratory-controls-visible.png'});
 const result=await page.evaluate(async()=>{
  const b=window.__pt2Game.scene.getScene('combate'),[p,e]=b.luchadores;
  const src=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
  const weather=await import(new URL('./torre2/weather.js',src));window.weather=weather;
  const lab=await import(new URL('./torre2/laboratory.js',src));
  const all=lab.KANTO_151_IDS.map(id=>lab.prepareLaboratoryMatch({player:id,enemy:id,level:50}));
  if(b.datos.torre2.weather!=='sand')throw Error('Laboratory must launch with configured sand');
  weather.setWeather(b.__torre2Weather,'sand');
  p.est={};e.est={};p.hp=p.hpMax;e.hp=e.hpMax;
  const before=[p.hp,e.hp];weather.tickWeather(b.__torre2Weather,4,[p,e]);
  const losses=[before[0]-p.hp,before[1]-e.hp];
  const damage=kind=>{weather.setWeather(b.__torre2Weather,kind);e.est={};e.hp=e.hpMax;const hp=e.hp;const hit=e.recibir(p,{dano:5,tipo:'WATER',slot:'q'});return {lost:hp-e.hp,hit};};
  // A real Water-type source is required for the requested +20% species
  // affinity. Use a modest hit to avoid saturating the target's HP at 4x.
  const normal=damage('none'),rain=damage('rain'),sun=damage('sun');
  weather.setWeather(b.__torre2Weather,'sun');p.est={};p.ponerEstado('congelado',10,{});
  const freezeImmune=!p.est.congelado;
  weather.setWeather(b.__torre2Weather,'hail');b.__torre2Weather.remaining=.05;
  return {count:all.length,ids:all.every((m,i)=>m.p1===lab.KANTO_151_IDS[i]),losses,normal,rain,sun,freezeImmune};
 });
 console.log('WEATHER_MEASUREMENT',result);
 assert.equal(result.count,151);assert.equal(result.ids,true);assert.ok(result.losses[0]>0);assert.equal(result.losses[1],0);
 assert.ok(result.rain.lost>result.normal.lost,'Blastoise must gain the live Water affinity +20%');assert.ok(result.sun.lost<result.normal.lost);assert.equal(result.freezeImmune,true);
 await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').__torre2Weather.kind==='none');
 await page.screenshot({path:'test-evidence/laboratory-battle.png'});
 await page.evaluate(()=>{const b=window.__pt2Game.scene.getScene('combate');b.scene.start('campanha',{finished:true,won:true,marker:b.datos.torre2});});
 await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'));
 assert.equal(await page.evaluate(()=>localStorage.getItem(core.SAVE_KEY)),snapshot,'Lab victory must leave save byte-identical');
 assert.deepEqual(errors,[]);console.log('PASS laboratory 151 options, weather damage/expiry, sun freeze immunity and isolated result',result);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
