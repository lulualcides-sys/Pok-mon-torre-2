'use strict';
// T15 live Phaser Thunder hit confirmation under sunlight / rain.
// No edits to approved renderer or move. Lab match and RNG are test-only
// fixtures; real Luchador.recibir, type damage and weather state are used.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 const uri=new URL(req.url||'/','http://127.0.0.1');
 const file=path.resolve(root,'.'+(uri.pathname.endsWith('/')?uri.pathname+'index.html':uri.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const bytes=await fsp.readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(bytes)}
 catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(ok=>server.listen(4483,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4483/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   window.t15Core=await import(new URL('./torre2/campaign-core.js',src));
   window.t15Core.saveCampaign(window.t15Core.createCampaign('bulbasaur'));
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'),null,{timeout:60000});
  const original=await page.evaluate(()=>localStorage.getItem(window.t15Core.SAVE_KEY));
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const lab=await import(new URL('./torre2/laboratory.js',src));
   const match=lab.prepareLaboratoryMatch({player:'pikachu',enemy:'squirtle',level:50});
   match.torre2.weather='sun';
   window.__pt2Game.scene.getScene('campanha').launchBattle(match,false);
  });
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.__torre2Weather&&b.__torre2LabInstalled&&b.fase==='lucha'&&
    b.luchadores?.length===2&&!b.__torre2Changing&&!b.__torre2BallTransitions;
  },null,{timeout:70000});
  const observations=await page.evaluate(async()=>{
   const b=window.__pt2Game.scene.getScene('combate'),[p,e]=b.luchadores;
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const weather=await import(new URL('./torre2/weather.js',src));
   b.controles.forEach(c=>{c.leer=()=>null});
   p.inmortal=true;e.inmortal=true;
   b.__torre2BattleBagOpen=true; // Freeze native time between deterministic probes.
   const pairs=[];
   const hit=(kind,name,roll)=>{
    weather.setWeather(b.__torre2Weather,kind);
    e.hp=e.hpMax;e.ko=false;e.est={};e.dolorHasta=-Infinity;
    e.accion=null;e.dash=null;
    const before=e.hp;
    const nativeRandom=Math.random;
    let result;
    try{
     Math.random=()=>roll;
     try{result=e.recibir(p,{dano:10,tipo:'ELECTRIC',nombre:name,slot:'q'});}
     catch(error){throw new Error('Native recipient diagnostic: '+JSON.stringify({
      kind,name,roll,error:String(error),nativeTraining:String(b.anotarEntreno).slice(0,1900),
      nativePlayerStats:p.stats,nativeEnemyStats:e.stats,
      gameMode:b.datos?.modo,labReady:b.__torre2LabInstalled,
      sceneProperties:Object.keys(b).filter(key=>/entren|estad|registro|hist|dato/i.test(key))
     }));}
    }finally{Math.random=nativeRandom}
    const measure={kind,name,roll,before,after:e.hp,result,weather:b.__torre2Weather.kind};
    pairs.push(measure);
    return measure;
   };
   const sunMiss=hit('sun','Thunder',.99);
   const sunHit=hit('sun','Thunder',.01);
   const rain=hit('rain','Thunder',.99);
   const other=hit('sun','Thunderbolt',.99);
   return {renderer:b.game.renderer.type,species:[p.def.id,e.def.id],
    pairs,sunMiss,sunHit,rain,other,
    weatherHelper:weather.weatherAccuracy(b.__torre2Weather,'Thunder',70),
    activeKit:Object.entries(p.kit).filter(([key])=>['lmb','rmb','q','e'].includes(key))
      .map(([slot,m])=>({slot,name:m.nombre,renderer:m.forma}))};
  });
  assert.deepEqual(observations.species,['pikachu','squirtle']);
  assert.equal(observations.sunMiss.result,'miss','Sunny weather must reject Thunder high RNG');
  assert.equal(observations.sunMiss.after,observations.sunMiss.before);
  assert.ok(observations.sunHit.after<observations.sunHit.before,
   'Low RNG in sun should permit original Phaser damage');
  assert.ok(observations.rain.after<observations.rain.before,
   'Rain should not add a weather-miss roll after native collision');
  assert.ok(observations.other.after<observations.other.before,
   'Thunderbolt should not inherit special Thunder sunlight accuracy');
  assert.equal(await page.evaluate(()=>localStorage.getItem(window.t15Core.SAVE_KEY)),original,
   'Laboratory weather tests must never change the main campaign save');
  assert.deepEqual(errors,[],'No native Phaser error');
  await page.screenshot({path:'test-evidence/t15-live-sun-thunder.png'});
  fs.writeFileSync('test-evidence/t15-live-sun-thunder.json',JSON.stringify(observations,null,2));
  console.log('T15 THUNDER SUNLIGHT PHASER PASS',JSON.stringify(observations));
 }finally{await browser.close();server.close()}
})().catch(err=>{console.error(err);process.exitCode=1;server.close()});
