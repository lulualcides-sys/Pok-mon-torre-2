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
  const response=await page.goto('http://127.0.0.1:'+port+'/arena2d/?original=1&torre2-cards=1',
   {waitUntil:'domcontentloaded',timeout:45000});
  assert.equal(response?.status(),200);
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo')&&
   document.querySelector('#juego canvas'),null,{timeout:55000});
  const title=await page.evaluate(()=>{
   const game=window.__pt2Game,canvas=document.querySelector('#juego canvas');
   return {width:canvas.width,height:canvas.height,
    buttons:game.scene.getScene('titulo').botones.map(b=>b.id),
    logo:game.textures.exists('ui-logo'),
    mascots:game.scene.getScene('titulo').children.list
     .filter(x=>x.type==='Sprite'&&/^pmd-.+-Idle$/.test(x.texture?.key||''))
     .map(x=>({key:x.texture.key,x:x.x,y:x.y,
      playing:x.anims?.isPlaying===true}))};
  });
  assert.ok(title.width>=640&&title.height>=360,'Canvas is too small');
  assert.equal(title.logo,true,'Approved title texture missing');
  assert.ok(title.mascots.some(s=>Math.abs(s.x-110)<12&&s.playing),
   'Missing original animated Pokémon to LEFT of title logo: '+JSON.stringify(title.mascots));
  assert.ok(title.mascots.some(s=>Math.abs(s.x-530)<12&&s.playing),
   'Missing original animated Pokémon to RIGHT of title logo: '+JSON.stringify(title.mascots));
  assert.deepEqual(title.buttons.filter(id=>id!=='personalizar'),
   ['jugar','pokedex','tutorial','ajustes','creditos'],
   'Existing approved title actions must remain visible and ordered');
  if(title.buttons.includes('personalizar'))
   assert.equal(title.buttons.indexOf('personalizar'),1,
    'Native Personalizar action must follow Play');
  assert.equal(new Set(title.buttons).size,title.buttons.length,
   'No duplicate native menu actions');
  await shot('desktop-title',page);
  state.step='mobile-title';
  const mobile=await makePage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  await mobile.goto('http://127.0.0.1:'+port+'/arena2d/?original=1&torre2-cards=1',
   {waitUntil:'domcontentloaded',timeout:45000});
  await mobile.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo')&&
   document.querySelector('#juego canvas'),null,{timeout:55000});
  const mobileButtons=await mobile.evaluate(()=>window.__pt2Game.scene.getScene('titulo').botones.map(b=>b.id));
  assert.deepEqual(mobileButtons.filter(id=>id!=='personalizar'),
   ['jugar','pokedex','tutorial','ajustes','creditos'],
   'Mobile native title must retain every approved action');
  assert.equal(new Set(mobileButtons).size,mobileButtons.length,
   'No duplicate touch hitboxes on mobile');
  await shot('mobile-portrait-rotate',mobile);await mobile.close();
  state.step='mobile-landscape-title';
  const landscape=await makePage({viewport:{width:844,height:390},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  await landscape.goto('http://127.0.0.1:'+port+'/arena2d/?original=1&torre2-cards=1',
   {waitUntil:'domcontentloaded',timeout:45000});
  await landscape.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo')&&
   document.querySelector('#juego canvas'),null,{timeout:55000});
  const landscapeButtons=await landscape.evaluate(()=>window.__pt2Game.scene.getScene('titulo').botones.map(b=>b.id));
  assert.deepEqual(landscapeButtons.filter(id=>id!=='personalizar'),
   ['jugar','pokedex','tutorial','ajustes','creditos'],
   'Mobile native title must retain every approved action');
  assert.equal(new Set(landscapeButtons).size,landscapeButtons.length,
   'No duplicate touch hitboxes on mobile');
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
  const cardHub=await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return c.__torre2CardUI;
  });
  assert.equal(cardHub?.mode,'cards','Campaign must start in trainer card navigation');
  assert.equal(cardHub.total,14,'Brock stage needs 13 trainers and one leader');
  assert.ok(cardHub.visible.includes(0),'The first card must be visible');
  await shot('desktop-campaign-map',page);
  await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   const card=c.children.list.find(o=>o.active&&o.getData?.('torre2-trainer-cards-root'));
   const zone=card?.list?.find(o=>o.getData?.('torre2-trainer-card-index')===0);
   if(!zone)throw Error('Trainer card 1 missing interactive touch zone');
   zone.emit('pointerdown');
  });
  await page.waitForFunction(()=>window.__pt2Game.scene
   .getScene('campanha').__torre2CardUI?.mode==='detail',null,{timeout:7000});
  const trainerDetail=await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return c.__torre2CardUI;
  });
  assert.equal(trainerDetail.canBattle,true,'Current trainer must be challengeable');
  assert.deepEqual(trainerDetail.roster,
   [await page.evaluate(()=>window.kanto.currentOpponent(window.kanto.readCampaign()).id)],
   'Cards must show real saved campaign roster, not invented Pokémon');
  await shot('desktop-trainer-card-details',page);
  await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   const layer=c.children.list.find(o=>o.active&&o.getData?.('torre2-trainer-cards-root'));
   layer?.list?.find(o=>o.getData?.('torre2-card-control')==='cards-detail-back')?.emit('pointerdown');
  });
  await page.waitForFunction(()=>window.__pt2Game.scene
   .getScene('campanha').__torre2CardUI?.mode==='cards',null,{timeout:7000});
  // The former guard only captured stage 0. The user-rejected layout is the
  // Blaine/Cinnabar route at stage 6; test THAT actual native Phaser scene.
  // Use a disposable in-browser save fixture and restore the starter before
  // testing the rest of the campaign. Never mutate production player saves.
  state.step='cinnabar-layout-review';
  await page.evaluate(()=>{
   const core=window.kanto,scene=window.__pt2Game.scene.getScene('campanha');
   const fixture=core.createPlayerCampaign('bulbasaur');
   fixture.stage=6;fixture.trainer=6;
   fixture.badges=core.GYMS.slice(0,6).map(g=>g.badge);
   core.saveCampaign(fixture);
   scene.scene.restart();
  });
  await page.waitForFunction(()=>{
   const scene=window.__pt2Game?.scene.getScene('campanha');
   return scene?.scene.isActive()&&scene.__torre2BattlePath?.stage===6&&
    scene.children.list.some(o=>String(o.text||'').toUpperCase().includes('CINNABAR'));
  },null,{timeout:25000});
  assert.equal(await page.evaluate(()=>window.__pt2Game.scene
   .getScene('campanha').__torre2CardUI?.mode),'cards',
   'Cinnabar must also expose the trainer cards');
  // Switch to the existing walkable map by its actual Card UI action.
  await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   const panel=c.children.list.find(o=>o.active&&o.getData?.('torre2-trainer-cards-root'));
   const tab=panel?.list?.find(o=>o.getData?.('torre2-card-control')==='map');
   if(!tab)throw Error('Trainer cards MAPA control missing');
   tab.emit('pointerdown');
  });
  await page.waitForFunction(()=>window.__pt2Game.scene
   .getScene('campanha').__torre2CardsMapOnly===true,null,{timeout:7000});
  const mode=await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   const view=c.__torre2BattlePath;
   return {mode:view.mode,visibleTrainers:c.children.list
    .filter(o=>o.active&&Number.isInteger(o.getData?.('torre2-path-node'))).length,
    total:view.total,stage:view.stage};
  });
  assert.equal(mode.mode,'city','Cinnabar must start on the town, not a trainer-filled collage');
  assert.equal(mode.visibleTrainers,0,'No 14 NPCs may float over Cinnabar water or roofs');
  assert.equal(await page.evaluate(()=>window.__pt2Game.scene.getScene('campanha')
   .__torre2BattlePath.landmarks),3,'Town must have exactly Gym, Center and Mart doors');
  // Overworld must remain the focus: compact landmarks and both route tabs
  // inside the area ribbon. Regression from oversized map buttons/cards.
  const townControls=await page.evaluate(()=>{
   const scene=window.__pt2Game.scene.getScene('campanha');
   return {landmarks:scene.children.list.filter(o=>o.active&&o.input?.enabled&&
     o.getData?.('torre2-cinnabar-landmark')).map(o=>o.getData('torre2-cinnabar-landmark')),
    switcher:scene.children.list.find(o=>o.active&&o.getData?.('torre2-cinnabar-switch')==='routes')?.y,
    rematch:scene.children.list.find(o=>o.active&&o.getData?.('torre2-open-rematch-atlas'))?.y};
  });
  assert.deepEqual(townControls.landmarks.sort(),['center','gym','mart']);
  assert.ok(townControls.switcher<=85&&townControls.rematch<=85,
   'Cinnabar navigation belongs in header, not over the water/streets');
  await shot('desktop-cinnabar-map',page);
  // Test the ACTUAL Phaser touch target, not the callback in isolation.
  const switchPoint=await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   const zone=c.children.list.find(o=>o.active&&o.input?.enabled&&
    o.getData?.('torre2-cinnabar-switch')==='routes');
   if(!zone)throw Error('Cinnabar route switch missing');
   const rect=document.querySelector('#juego canvas').getBoundingClientRect();
   return {x:rect.left+zone.x*rect.width/640,y:rect.top+zone.y*rect.height/360};
  });
  await page.mouse.click(switchPoint.x,switchPoint.y);
  await page.waitForFunction(()=>{
   const view=window.__pt2Game.scene.getScene('campanha').__torre2BattlePath;
   return view?.stage===6&&view?.mode==='sea-routes'&&
    view.locations>0&&view.locations<=7;
  },null,{timeout:12000});
  // Hard gate: merely changing a menu to "Seafoam" is not a real map.
  // Verify the ORIGINAL cave artwork is loaded and rendered as a Phaser
  // image. This would have failed on the previously approved blank blue map.
  const seafoam=await page.evaluate(()=>{
   const scene=window.__pt2Game.scene.getScene('campanha');
   const art=scene.__torre2GymBackdrop;
   return {city:art?.city,realExterior:art?.realExterior,
    textures:scene.textures.exists('frlg-location-seafoam'),
    image:scene.children.list.some(o=>o.active&&o.texture?.key==='frlg-location-seafoam'),
    width:scene.__torre2ExteriorViewport?.w,height:scene.__torre2ExteriorViewport?.h};
  });
  assert.equal(seafoam.city,'seafoam','Route stage must use Seafoam cave art');
  assert.equal(seafoam.realExterior,true,'Blank fallback blue route is unacceptable');
  assert.equal(seafoam.textures,true,'Seafoam must be preloaded in campaign');
  assert.equal(seafoam.image,true,'Seafoam image must appear in native Phaser scene');
  assert.ok(seafoam.width>=160&&seafoam.height>=125,'Seafoam art crop must be nontrivial');
  // Fixed cave terraces, not arbitrary generic zigzag coordinates over rocks
  // and gym buildings. Test every visible opponent, not just the active one.
  const caveSpots=await page.evaluate(()=>window.__pt2Game.scene
   .getScene('campanha').__torre2BattlePath.spots);
  assert.equal(caveSpots.length,7,'Cinnabar routes should render seven spaced NPCs per page');
  for(let i=0;i<caveSpots.length;i++){
   const {x,y}=caveSpots[i];
   assert.ok(x>=40&&x<=452&&y>=125&&y<=275,
    'Seafoam NPC '+i+' must sit within the cave floor viewport');
   for(let j=0;j<i;j++){
    const distance=Math.hypot(x-caveSpots[j].x,y-caveSpots[j].y);
    assert.ok(distance>=46,'Cave NPC interaction zones overlap at '+i+'/'+j);
   }
  }
  assert.ok(caveSpots.slice(0,4).every(p=>p.y>=245),
   'First cave terrace must stay on the lower traversable path');
  assert.ok(caveSpots.slice(4).every(p=>p.y<=210),
   'Second cave terrace must stay on the upper walkable path');
  const seaNav=await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return {back:c.children.list.find(o=>o.active&&
    o.getData?.('torre2-cinnabar-switch')==='city')?.y,
    rematch:c.children.list.find(o=>o.active&&
    o.getData?.('torre2-open-rematch-atlas'))?.y};
  });
  assert.ok(seaNav.back<=85&&seaNav.rematch<=85,
   'Seafoam route buttons cannot cover trainers or the floor');
  await shot('desktop-cinnabar-sea-routes',page);
  await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   const back=c.children.list.find(o=>o.active&&o.input?.enabled&&
    o.getData?.('torre2-cinnabar-switch')==='city');
   if(!back)throw Error('Back to Cinnabar city button missing');
   back.emit('pointerdown');
  });
  await page.waitForFunction(()=>{
   const view=window.__pt2Game.scene.getScene('campanha').__torre2BattlePath;
   return view?.stage===6&&view?.mode==='city';
  },null,{timeout:10000});
  await page.evaluate(()=>{
   const core=window.kanto,scene=window.__pt2Game.scene.getScene('campanha');
   core.saveCampaign(core.createPlayerCampaign('bulbasaur'));
   scene.scene.restart();
  });
  await page.waitForFunction(()=>window.__pt2Game?.scene.getScene('campanha')
    .__torre2BattlePath?.stage===0,null,{timeout:25000});
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
