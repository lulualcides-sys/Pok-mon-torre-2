'use strict';
/* Native Phaser/WebGL smoke: tactical AUTO really casts an equipped weather
 * status move. A purpose-built Lv25 stage-3 fixture is not natural XP proof.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site'),port=4509;
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css',
 '.json':'application/json','.png':'image/png','.webp':'image/webp',
 '.jpg':'image/jpeg','.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1:'+port);
 const file=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('blocked')}
 try{const bytes=await fs.readFile(file);res.writeHead(200,
  {'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(bytes)}
 catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 let page;
 try{
  page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];page.on('pageerror',error=>errors.push(String(error)));
  await page.goto('http://127.0.0.1:'+port+'/arena2d/?original=1',
   {waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),
   null,{timeout:60000});
  const configured=await page.evaluate(async()=>{
   const main=[...document.scripts].find(s=>s.src?.includes('/main.js'))?.src;
   if(!main)throw Error('Missing original Phaser main module');
   const core=window.__t16Core=await import(new URL('./torre2/campaign-core.js',main));
   const pool=await import(new URL('./torre2/move-pool.js',main));
   // Isolated fixture starts at the legitimate stage-3 level cap. We are
   // NOT claiming this is an earned save or a completed trainer journey.
   const save=core.createPlayerCampaign('squirtle');
   save.stage=3;save.trainer=0;save.team[0].progression.level=25;
   if(!pool.equipMove(save.team[0],1,'rain-dance'))
    throw Error('Cannot equip real Rain Dance on Squirtle Lv25 in HAB2');
   const slots=pool.selectedMoves(save.team[0]),kit=pool.resolveLoadout(save.team[0]);
   if(slots[1]!=='rain-dance'||kit.rmb?.forma!=='torre2_finale_raindance')
    throw Error('Saved equipped move differs from live Phaser loadout');
   core.saveCampaign(save);
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
   return {species:save.team[0].id,stage:save.stage,level:25,slots};
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
   window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,
   null,{timeout:45000});
  const point=await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   const btn=c.children.list.find(o=>o.active&&o.input?.enabled&&
    o.getData?.('torre2-central-cta')===true);
   if(!btn)throw Error('Missing native battle CTA');
   const r=document.querySelector('#juego canvas').getBoundingClientRect();
   return {x:r.x+btn.x*r.width/640,y:r.y+btn.y*r.height/360};
  });
  await page.mouse.click(point.x,point.y);
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.fase==='lucha'&&
    b.__torre2PartyInstalled&&b.__torre2AutoMode?.enabled;
  },null,{timeout:60000});
  const start=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return {move:b.luchadores[0].kit?.rmb?.nombre,
    weather:b.__torre2Weather?.kind,
    auto:b.__torre2AutoMode?.enabled,
    opponent:b.datos?.p2};
  });
  assert.equal(start.move,'Rain Dance','Live Squirtle must have the approved status move');
  assert.equal(start.auto,true);
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.__torre2Weather?.kind==='rain';
  },null,{timeout:45000,polling:100});
  const cast=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   const actor=b.luchadores[0];
   return {weather:b.__torre2Weather.kind,
    remaining:b.__torre2Weather.remaining,
    casts:actor.stats?.usosSlot?.rmb??null,
    cooldown:actor.cd?.rmb??null,
    auto:b.__torre2AutoMode?.enabled,energy:actor.energia};
  });
  assert.equal(cast.weather,'rain','Rain Dance must change the live battle state');
  assert.ok(cast.remaining>0&&cast.remaining<=20);
  assert.equal(cast.auto,true);
  assert.ok(cast.casts===null||cast.casts>0,
   'Native renderer should register a real RMB cast');
  assert.deepEqual(errors,[],'No native Phaser uncaught errors before rain activates');
  await fs.mkdir('test-evidence',{recursive:true});
  await page.screenshot({path:'test-evidence/t16-auto-weather-native.png'});
  const evidence={mode:'fixture Lv25 stage 3; no synthetic XP claim',
   configured,start,cast,clientErrors:errors};
  await fs.writeFile('test-evidence/t16-auto-weather-native.json',
   JSON.stringify(evidence,null,2));
  console.log('PASS_T16_AUTO_CASTS_NATIVE_RAIN',JSON.stringify(evidence));
 }finally{
  if(page&&!page.isClosed())await page.close();
  await browser.close();await new Promise(ok=>server.close(ok));
 }
})().catch(err=>{console.error(err);process.exitCode=1;if(server.listening)server.close()});
