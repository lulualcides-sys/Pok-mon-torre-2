'use strict';
/* Captures native Phaser/WebGL, without changing game files or inventing battle outcomes.
 * The campaign state comes from the actual starter factory but remains a test fixture.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const out=path.resolve('test-evidence/visual-guard');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css',
 '.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml',
 '.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 let name;try{name=decodeURIComponent(new URL(req.url||'/','http://127.0.0.1').pathname)}
 catch{res.writeHead(400);return res.end('bad url')}
 const abs=path.resolve(root,'.'+(name.endsWith('/')?name+'index.html':name));
 if(!abs.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const bytes=await fs.readFile(abs);res.writeHead(200,{'content-type':mime[path.extname(abs)]||'application/octet-stream'});res.end(bytes)}
 catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const state={ok:false,source:'real-Phaser-Chromium',
  fixture:'production starter factory; no natural campaign claim',
  step:'setup',scene:null,screenshots:[],errors:[],missingJs:[]};
 let browser,page;
 try{
  await new Promise((yes,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',yes)});
  const port=server.address().port;
  browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
   headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
   '--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist']});
  const makePage=async opts=>{
   const p=await browser.newPage(opts);
   p.on('pageerror',e=>state.errors.push(String(e).slice(0,500)));
   p.on('response',r=>{if(r.status()>=400&&/\.js(?:\?|$)/.test(r.url()))state.missingJs.push(r.url().slice(0,250))});
   return p;
  };
  const shot=async(name,p)=>{
   await p.screenshot({path:path.join(out,name+'.png'),fullPage:true,animations:'disabled'});
   state.screenshots.push('test-evidence/visual-guard/'+name+'.png');
  };
  page=await makePage({viewport:{width:1280,height:720},deviceScaleFactor:1});
  state.step='desktop-title';
  const response=await page.goto('http://127.0.0.1:'+port+'/arena2d/?original=1',
   {waitUntil:'domcontentloaded',timeout:45000});
  assert.equal(response?.status(),200);
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo')&&
   document.querySelector('#juego canvas'),null,{timeout:55000});
  const title=await page.evaluate(()=>{
   const game=window.__pt2Game,canvas=document.querySelector('#juego canvas');
   return {width:canvas.width,height:canvas.height,
    buttons:game.scene.getScene('titulo').botones.map(b=>b.id),
    logo:game.textures.exists('ui-logo')};
  });
  assert.ok(title.width>=640&&title.height>=360,'Canvas is too small');
  assert.equal(title.logo,true,'Approved title texture missing');
  assert.deepEqual(title.buttons,['jugar','pokedex','tutorial','ajustes','creditos']);
  await shot('desktop-title',page);
  state.step='mobile-title';
  const mobile=await makePage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  await mobile.goto('http://127.0.0.1:'+port+'/arena2d/?original=1',
   {waitUntil:'domcontentloaded',timeout:45000});
  await mobile.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo')&&
   document.querySelector('#juego canvas'),null,{timeout:55000});
  assert.equal(await mobile.evaluate(()=>window.__pt2Game.scene.getScene('titulo').botones.length),5);
  await shot('mobile-portrait-rotate',mobile);await mobile.close();
  state.step='mobile-landscape-title';
  const landscape=await makePage({viewport:{width:844,height:390},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  await landscape.goto('http://127.0.0.1:'+port+'/arena2d/?original=1',
   {waitUntil:'domcontentloaded',timeout:45000});
  await landscape.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo')&&
   document.querySelector('#juego canvas'),null,{timeout:55000});
  assert.equal(await landscape.evaluate(()=>window.__pt2Game.scene.getScene('titulo').botones.length),5);
  await shot('mobile-landscape-title',landscape);await landscape.close();
  state.step='campaign-map';
  await page.evaluate(async()=>{
   const main=[...document.scripts].find(s=>s.src?.includes('/main.js'))?.src;
   if(!main)throw Error('Missing native Phaser main module');
   const core=await import(new URL('./torre2/campaign-core.js',main));
   window.kanto=core;
   core.saveCampaign(core.createPlayerCampaign('bulbasaur'));
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('campanha')&&
   !!window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,
   null,{timeout:50000});
  state.scene='campanha';
  assert.equal(await page.evaluate(()=>window.kanto.readCampaign().team[0].id),'bulbasaur');
  await shot('desktop-campaign-map',page);
  state.step='wild-grass-sprites';
  const grass=await page.evaluate(()=>{
   const scene=window.__pt2Game.scene.getScene('campanha');
   const save=window.kanto.readCampaign();
   const listed=[...new Set(window.kanto.wildAvailability(save.stage).wild)].slice(0,12);
   scene.grassScreen(save);
   const sprites=scene.children.list.filter(o=>o.active&&o.getData?.('torre2-grass-sprite'))
    .map(o=>({species:o.getData('torre2-grass-sprite'),texture:o.texture?.key,width:o.displayWidth,height:o.displayHeight}));
   const labels=scene.children.list.filter(o=>o.active&&o.getData?.('torre2-grass-name'))
    .map(o=>o.getData('torre2-grass-name'));
   return {listed,sprites,labels,overlayActive:scene.__torre2GrassOverlay?.active};
  });
  assert.equal(grass.overlayActive,true,'Grass modal did not appear');
  assert.deepEqual(grass.sprites.map(o=>o.species),grass.listed,'Each wild entry needs its own PMD sprite');
  assert.deepEqual(grass.labels,grass.listed,'Each sprite must keep its correct species name');
  assert.ok(grass.sprites.length>0,'No wild sprites found');
  for(const entry of grass.sprites){
   assert.match(entry.texture,/^torre2-portrait-\d{4}$/,'A Pokémon must use its actual PMD portrait');
   assert.equal(entry.width,22);
   assert.equal(entry.height,22);
  }
  await shot('desktop-grass-pokemon-sprites',page);
  // Exit the live Phaser overlay using the same mouse control as a player.
  const grassBack=await page.evaluate(()=>{
   const r=document.querySelector('#juego canvas').getBoundingClientRect();
   return {x:r.x+174*r.width/640,y:r.y+292*r.height/360};
  });
  await page.mouse.click(grassBack.x,grassBack.y);
  await page.waitForFunction(()=>!window.__pt2Game.scene.getScene('campanha').__torre2GrassOverlay,
   null,{timeout:10000});
  state.step='first-battle';
  await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   c.enterBattle(window.kanto.readCampaign(),false);
  });
  await page.waitForFunction(()=>{
   const game=window.__pt2Game,b=game?.scene.getScene('combate');
   return game.scene.isActive('combate')&&b.fase==='lucha'&&b.__torre2PartyInstalled;
  },null,{timeout:55000});
  state.scene='combate';
  const battle=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return {player:b.datos.p1,enemy:b.datos.p2,controlsPresent:!!b.controles?.length,
    moves:Object.fromEntries(['lmb','rmb','q'].map(k=>[k,b.luchadores[0]?.kit?.[k]?.nombre||null]))};
  });
  assert.equal(battle.player,'bulbasaur','Player sprite identity changed');
  for(const slot of ['lmb','rmb','q'])
   assert.ok(battle.moves[slot],'Missing native move '+slot);
  assert.ok(battle.controlsPresent,'Desktop battle controls missing');
  await shot('desktop-first-battle',page);
  assert.deepEqual(state.errors,[],'Uncaught scene errors');
  const criticalMissing=state.missingJs.filter(u=>/\/torre2\/|\/main\.js(?:\?|$)|\/lib\/phaser\.min\.js(?:\?|$)/.test(u));
  assert.deepEqual(criticalMissing,[],'Missing critical native JavaScript modules');
  state.step='done';state.ok=true;
  console.log('VISUAL GUARD CHROMIUM OK',JSON.stringify({title,player:battle.player,screenshots:state.screenshots}));
 }catch(e){
  state.error=String(e.message||e).slice(0,750);
  state.stack=String(e.stack||'').slice(0,2000);
  console.error('VISUAL GUARD CHROMIUM FAIL',state.step,state.error);
  if(page){
   try{state.scene=await page.evaluate(()=>window.__pt2Game?.scene?.getScenes(true)?.map(s=>s.scene.key).join(',')||null)}catch{}
   try{await page.screenshot({path:path.join(out,'failure-'+state.step+'.png'),fullPage:true});
    state.screenshots.push('test-evidence/visual-guard/failure-'+state.step+'.png')}catch{}
  }
  process.exitCode=1;
 }finally{
  await fs.writeFile(path.join(out,'browser-result.json'),JSON.stringify(state,null,2)+'\n');
  await browser?.close().catch(()=>{});
  await new Promise(resolve=>{if(server.listening)server.close(resolve);else resolve()});
 }
})().catch(e=>{console.error('VISUAL GUARD FATAL',e);process.exitCode=1;server.close()});
