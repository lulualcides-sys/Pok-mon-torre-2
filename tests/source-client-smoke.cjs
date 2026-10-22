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
 await new Promise(resolve=>server.listen(4274,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
   '--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:980,height:650},deviceScaleFactor:1});
 const errors=[],notFound=[],consoleFailures=[],requestFailures=[];
 page.on('pageerror',e=>errors.push(e.stack||String(e)));
 page.on('console',m=>{if(m.type()==='error')consoleFailures.push(m.text())});
 page.on('requestfailed',r=>requestFailures.push({url:r.url(),error:r.failure()}));
 page.on('response',r=>{if(r.status()>=400)notFound.push({status:r.status(),url:r.url()})});
 await page.addInitScript(()=>{
  window.addEventListener('error',e=>{
   console.error('GAME-SCRIPT-ERROR',e.message,'@',e.filename+':'+e.lineno+':'+e.colno,
    e.error?.stack||'no stack');
  });
  window.addEventListener('unhandledrejection',e=>{
   console.error('GAME-ASYNC-ERROR',e.reason?.stack||String(e.reason));
  });
 });
 try{
  const response=await page.goto('http://127.0.0.1:4274/arena2d/?original=1',{waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(response.status(),200);
  assert.equal(await page.title(),'Pokémon Torre','The title must use the approved new game name');
  try {
   await page.waitForFunction(()=>!!window.Phaser&&!!document.querySelector('#juego canvas'),null,{timeout:35000});
  }catch(err){
   const diag=await page.evaluate(()=>({
    title:document.title,
    scriptSrcs:[...document.scripts].map(x=>x.src).filter(Boolean),
    gameDiv:!!document.querySelector('#juego'),
    errorText:document.body?.innerText?.slice(-1400),
    started:window.__pt2Started,phaser:typeof window.Phaser,
    moduleTags:[...document.querySelectorAll('script[type="module"]')].map(x=>x.src)
   }));
   console.error('PHASER FIRST BOOT DIAGNOSTIC',JSON.stringify({diag,errors,consoleFailures,notFound,requestFailures}));
   await page.screenshot({path:'test-evidence/kanto-phaser-boot-failure.png',fullPage:true}).catch(()=>{});
   throw err;
  }
  await page.waitForFunction(()=>window.__pt2Started===true,null,{timeout:45000,polling:250});
  await page.waitForTimeout(800);
  const canvas=await page.evaluate(()=>{
   const c=document.querySelector('#juego canvas');
   return {width:c.width,height:c.height,visible:c.getBoundingClientRect().width>0,
    renderer:!!window.Phaser?.WEBGL,html:document.title};
  });
  assert.ok(canvas.width>=700&&canvas.height>=400,'original Phaser arena must have real pixels');
  assert.ok(canvas.visible);
  const critical=errors.filter(e=>/module|SyntaxError|Unexpected token|imported module|does not provide an export|is not defined/i.test(e));
  assert.deepEqual(critical,[],'import graph must load without runtime crash');
  const missingModule=notFound.filter(o=>/\.js(\?|$)/.test(o.url));
  assert.deepEqual(missingModule,[],'missing source JS file(s)');
  const brand=await page.evaluate(()=>{
    const game=window.__pt2Game,title=game.scene.getScene('titulo');
    const logo=game.textures.get('ui-logo').getSourceImage();
    return {width:logo.width,height:logo.height,
      menu:title.menu,buttons:title.botones.map(b=>b.id),
      fixedButtons:title.botones.map(b=>({x:b.x,y:b.y,w:b.w,h:b.h}))};
  });
  assert.deepEqual([brand.width,brand.height],[240,80],
   'The approved pixel-art Pokémon Torre sprite replaces only the old menu title texture');
  assert.equal(brand.menu,'principal','Main menu unchanged');
  assert.deepEqual(brand.buttons,['jugar','pokedex','tutorial','ajustes','creditos'],
   'Keep every original menu button and its exact navigation');
  assert.deepEqual(brand.fixedButtons.map(b=>b.x),[320,320,320,320,320],
   'Keep original menu button positions');
  // Pokédex retains 26 native families and adds ten licensed PMD sprite families:
  // native layout and clickable evolution tabs must remain unchanged.
  const dexPage=await browser.newPage({viewport:{width:980,height:650}});
  const dexErr=[];dexPage.on('pageerror',e=>dexErr.push(String(e)));
  await dexPage.goto('http://127.0.0.1:4274/arena2d/?pantalla=pokedex',
   {waitUntil:'domcontentloaded',timeout:30000});
  await dexPage.waitForFunction(()=>window.__pt2Game?.scene?.isActive('pokedex'),
   null,{timeout:45000});
  const dexData=await dexPage.evaluate(()=>{
   const p=window.__pt2Game.scene.getScene('pokedex');
   const base=p.casillas.map(x=>x.p.dex);
   return {count:p.casillas.length,portraits:base.map(id=>({
    id,exists:p.textures.exists('retrato-'+id),
    idle:p.anims.exists(id+'-Idle-0')})),
    bottom:Math.max(...p.casillas.map(c=>c.y+c.h)),podium:p.peanaY,
    tabNames:p.etapas.map(x=>x.nombre)};
  });
  assert.ok(dexData.count>=36,
   'Pokédex should retain 26 native cards and add ten original early-Kanto species');
  assert.ok(dexData.bottom<=dexData.podium-22,
   'Expanded 36-family Pokédex cards cannot overlap the Pokémon pedestal');
  assert.ok(dexData.portraits.every(x=>x.exists&&x.idle),
   'Every base Pokédex Pokémon must have a real captured PMD portrait and Idle: '+
    JSON.stringify(dexData.portraits.filter(x=>!x.exists||!x.idle)));
  assert.deepEqual(dexData.tabNames.slice(0,3),['BULBASAUR','IVYSAUR','VENUSAUR'],
   'Original Bulbasaur family tabs must remain clickable');
  await dexPage.evaluate(()=>window.__pt2Game.scene.getScene('pokedex').irEtapa(1));
  await dexPage.waitForFunction(()=>{
   const p=window.__pt2Game.scene.getScene('pokedex');
   return p.etapa===1&&p.anims.exists('0002-Idle-0')&&p.sprite?.dex==='0002';
  },null,{timeout:16000});
  await dexPage.evaluate(()=>window.__pt2Game.scene.getScene('pokedex').irEtapa(2));
  await dexPage.waitForFunction(()=>{
   const p=window.__pt2Game.scene.getScene('pokedex');
   return p.etapa===2&&p.anims.exists('0003-Idle-0')&&p.sprite?.dex==='0003';
  },null,{timeout:16000});
  const newKantoDex=await dexPage.evaluate(()=>{
   const p=window.__pt2Game.scene.getScene('pokedex');
   return ['pidgey','caterpie','weedle','geodude','mankey'].map(id=>{
    const idx=p.casillas.findIndex(x=>x.p.id===id);
    p.elegir(idx);
    return {id,slots:Object.keys(p.etapas[0].kit),
     captions:p.movs.list.filter(x=>typeof x.text==='string').map(x=>x.text)};
   });
  });
  for(const dex of newKantoDex){
   for(const s of ['lmb','rmb','esp','q','e'])
    assert.ok(dex.slots.includes(s),'New Kanto Pokémon missing action '+dex.id+'/'+s);
   assert.ok(dex.captions.some(s=>s.includes('Dodge')),
    'Dodge must be visible in Pokédex '+dex.id);
   assert.ok(dex.captions.some(s=>s.includes('ULT')),
    'Ultimate must be visible in Pokédex '+dex.id);
  }
  assert.deepEqual(dexErr,[],'Pokedex and evolution buttons must not throw');
  await dexPage.screenshot({path:'test-evidence/pokedex-real-pmd-and-venusaur-evolution.png',fullPage:true});
  await dexPage.close();
  await page.screenshot({path:'test-evidence/pokearena-original-phaser-source.png',fullPage:true});
  // Exercise the real on-canvas Play button rather than stopping at the title.
  await page.mouse.click(490,275);
  await page.waitForTimeout(1100);
  await page.screenshot({path:'test-evidence/pokearena-play-menu.png',fullPage:true});
  // The original layout remains, but PLAY now contains only solo entries.
  await page.evaluate(()=>{
    const title=window.__pt2Game.scene.getScene('titulo');
    if(title.menu!=='jugar')title.abrirMenu('jugar');
    const choices=title.botones.map(b=>b.o?.id||b.id);
    if(choices.includes('versus'))throw Error('2 PLAYERS still available');
    const item=title.botones.findIndex(b=>b.o?.id==='entreno'||b.id==='entreno');
    if(item<0)throw Error('TRAINING disappeared from original menu');
    title.elegir(item);
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('seleccion'),null,{timeout:35000});
  const visiblePokemon=await page.evaluate(()=>{
    const game=window.__pt2Game,scene=game.scene.getScene('seleccion');
    const m=scene.registry.get('manifiesto');
    const expected=['0001','0004','0007','0025','0041','0042'];
    return expected.map(dex=>({dex,listed:!!m[dex],
      portrait:scene.textures.exists('retrato-'+dex),
      idle:scene.textures.exists('pmd-'+dex+'-Idle'),
      animated:scene.anims.exists(dex+'-Idle-2')}));
  });
  assert.ok(visiblePokemon.every(x=>x.portrait&&x.idle&&x.animated),
   'Selection cards must preload actual Pokémon portraits and animated sprites, including Zubat/Golbat: '+
   JSON.stringify(visiblePokemon));
  await page.screenshot({path:'test-evidence/pokearena-training-select-sprites-fixed.png',fullPage:true});
  await page.mouse.click(205,149); // Confirm Squirtle for Player 1.
  await page.waitForTimeout(300);
  await page.mouse.click(68,149); // Confirm Bulbasaur as Dummy after focus switches.
  await page.waitForTimeout(350);
  await page.mouse.click(864,544); // Fight! from original client.
  await page.waitForTimeout(2450);
  await page.screenshot({path:'test-evidence/pokearena-training-battle.png',fullPage:true});
  // Regression: League has its own scene and initially displayed green
  // MISSING textures, even while the selection screen loaded correctly.
  const league=await browser.newPage({viewport:{width:980,height:650}});
  const leagueErrors=[],leagueMisses=[];
  league.on('pageerror',err=>leagueErrors.push(String(err)));
  league.on('response',response=>{if(response.status()>=400)leagueMisses.push(response.url())});
  await league.goto('http://127.0.0.1:4274/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await league.waitForFunction(()=>window.__pt2Started===true&&window.__pt2Game?.scene.isActive('titulo'),null,{timeout:45000});
  await league.evaluate(()=>window.__pt2Game.scene.getScene('titulo').scene.start('liga'));
  await league.waitForFunction(()=>window.__pt2Game?.scene.isActive('liga')&&
    window.__pt2Game.scene.getScene('liga').celdas?.length>0,null,{timeout:35000});
  const leaguePortraits=await league.evaluate(()=>{
   const scene=window.__pt2Game.scene.getScene('liga');
   const missed=scene.celdas.filter(cell=>!scene.textures.exists('retrato-'+cell.p.dex))
      .map(cell=>({name:cell.p.nombre,dex:cell.p.dex}));
   return {cards:scene.celdas.length,missed};
  });
  assert.ok(leaguePortraits.cards>=15,'League scene must show opponent cards');
  assert.deepEqual(leaguePortraits.missed,[],
   'League map must not show empty/green Pokémon portraits');
  assert.deepEqual(leagueErrors.filter(x=>/ReferenceError|TypeError|SyntaxError/.test(x)),[]);
  assert.deepEqual(leagueMisses.filter(x=>/\/assets\/pmd\//.test(x)),[]);
  await league.screenshot({path:'test-evidence/pokearena-league-opponents-restored.png',fullPage:true});
  await league.close();

  // Android landscape: the real LOADING scene must complete before the
  // timeout; merely having a WebGL canvas is not enough.
  const mobile=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:2});
  const mobileErrors=[];const mobileMissing=[];
  mobile.on('pageerror',e=>mobileErrors.push(String(e)));
  mobile.on('response',r=>{if(r.status()>=400)mobileMissing.push({status:r.status(),url:r.url()})});
  const begin=Date.now();
  await mobile.goto('http://127.0.0.1:4274/arena2d/?original=1',{waitUntil:'domcontentloaded',timeout:35000});
  await mobile.waitForFunction(()=>window.__pt2Started===true&&!!document.querySelector('#juego canvas'),null,{timeout:55000,polling:250});
  await mobile.waitForTimeout(750);
  const mobileBootMs=Date.now()-begin;
  const mobileInfo=await mobile.evaluate(()=>({started:window.__pt2Started,
    canvasWidth:document.querySelector('#juego canvas')?.width,
    viewport:{width:innerWidth,height:innerHeight},
    rotateOverlay:getComputedStyle(document.getElementById('girar')).display}));
  assert.equal(mobileInfo.started,true,'Android must leave initial LOADING scene');
  assert.ok(mobileInfo.canvasWidth>500,'Android landscape WebGL game must render');
  assert.deepEqual(mobileErrors.filter(x=>/TypeError|ReferenceError|SyntaxError/i.test(x)),[]);
  await mobile.screenshot({path:'test-evidence/pokearena-android-landscape.png',fullPage:true});
  await mobile.close();
  // Default boot is the SOLO KANTO CAMPAIGN, not the old online menus.
  const offline=await browser.newPage({viewport:{width:980,height:650},deviceScaleFactor:1});
  const outRequests=[];
  offline.on('request',r=>{
   if(/wss?:|\/api\/|\/auth\/|\/socket/.test(r.url()))outRequests.push(r.url());
  });
  await offline.goto('http://127.0.0.1:4274/arena2d/',{waitUntil:'domcontentloaded',timeout:35000});
  await offline.waitForFunction(()=>window.__pt2Started&&window.__pt2Game?.scene.isActive('titulo'),
    null,{timeout:60000,polling:300});
  const opening=await offline.evaluate(()=>{
    const t=window.__pt2Game.scene.getScene('titulo');
    return {items:t.botones.map(b=>b.o?.id||b.id),
      counterHidden:!t.gente.visible&&(!t.puntoGente.visible),chat:!!document.querySelector('#chat-panel')};
  });
  assert.equal(opening.items.includes('online'),false,'ONLINE must not appear');
  assert.equal(opening.counterHidden,true,'connected users should remain hidden');
  await offline.screenshot({path:'test-evidence/pokemon-torre-2-original-title-offline.png',fullPage:true});
  await offline.evaluate(()=>{
    const t=window.__pt2Game.scene.getScene('titulo');
    t.abrirMenu('jugar');
    if(t.botones.some(b=>b.o?.id==='versus'||b.id==='versus'))
      throw Error('2 PLAYERS still on Play menu');
    const i=t.botones.findIndex(b=>b.o?.id==='kanto'||b.id==='kanto');
    if(i<0)throw Error('KANTO CAMPAIGN missing in original PLAY menu');
    t.elegir(i);
  });
  await offline.waitForFunction(()=>window.__pt2Game?.scene.isActive('campanha'),null,
    {timeout:15000,polling:250});
  const offlineInitial=await offline.evaluate(()=>window.__pt2Game.scene.getScene('campanha').children.list
   .filter(x=>typeof x.text==='string').map(x=>x.text).join(' | '));
  assert.ok(offlineInitial.includes('CHARMANDER'),'starter selection must be available');
  // Choose starter via campaign module and confirm launch into real Phaser combat.
  await offline.evaluate(async()=>{
    const entry=[...document.querySelectorAll('script[src]')].find(x=>x.src.includes('/main.js'));
    const base=new URL('./',entry.src).href;
    const m=await import(base+'torre2/campaign-core.js');
    m.saveCampaign(m.createCampaign('charmander'));
    window.__pt2Game.scene.getScene('campanha').scene.restart();
  });
  await offline.waitForFunction(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    return c.__campaignMap?.spec?.id==='pewter'&&
      c.__campaignMap?.spec?.customBrock===true&&
      c.__campaignMap.locations===13&&
      c.children.list.some(x=>x.type==='Image'&&
       x.texture?.key==='torre2-brock-custom');
  },null,{timeout:23000});
  await offline.screenshot({path:'test-evidence/torre2-brock-map-hires-direct.png'});
  // PATCH 1 / PATCH 2: one real Pewter world for all 13 encounters and boss.
  // No PALLET -> ROUTE -> FOREST pagination, no route-line screen changes.
  const mapState=await offline.evaluate(async()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    const script=[...document.scripts].find(x=>x.src?.includes('/main.js'));
    const core=await import(new URL('./torre2/campaign-core.js',script.src).href);
    const state=core.readCampaign();
    const labels=()=>c.children.list.filter(o=>typeof o.text==='string')
      .map(o=>o.text).join(' | ');
    const result={
      initial:labels(),stage:state.stage,trainer:state.trainer,
      world:c.__campaignMap?.spec?.id,points:c.__campaignMap?.locations,
      realScene:c.children.list.some(o=>o.type==='Image'&&
       o.texture?.key==='torre2-brock-custom'),
      realNPCs:c.children.list.filter(o=>o.type==='Image'&&
       String(o.texture?.key||'').startsWith('frlg-npc-')).length,
      portraits:c.children.list.filter(o=>o.type==='Image'&&
       String(o.texture?.key||'').startsWith('torre2-portrait-')).length,
      zones:c.children.list.filter(o=>o.type==='Zone'&&o.input?.enabled).length
    };
    const imageIsolation=(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   const base=c.textures.get('torre2-brock-custom');
   const mask=c.textures.get('torre2-brock-forest');
   const photo=c.children.list.find(x=>x.type==='Image'&&
    x.texture?.key==='torre2-brock-custom');
   const cut=c.children.list.find(x=>
    x.type==='TileSprite'&&x.active&&x.depth===2);
   return {baseWidth:base?.get('__BASE')?.width,
    baseHeight:base?.get('__BASE')?.height,
    isFullFrame:photo?.frame===base?.get('__BASE'),
    photoFrame:{name:photo?.frame?.name,width:photo?.frame?.width,
     height:photo?.frame?.height,cutX:photo?.frame?.cutX,cutY:photo?.frame?.cutY},
    rawFullFrame:{name:base?.get('__BASE')?.name,width:base?.get('__BASE')?.width,
     height:base?.get('__BASE')?.height},
    sourceWidth:photo?.frame?.width,
    independentMask:!!mask&&mask!==base&&
     c.__torre2WorldView?.separateForest===true,
    tileSpriteDetected:!!cut,
    baseFrames:base?.getFrameNames(),filter:base?.source?.[0]?.filter,
    mapId:c.__torre2WorldView?.id};
  })();
    result.imageIsolation=imageIsolation;
    c.gymScreen(state);
    result.lockedGym=labels();
    result.gymDidNotStartCombat=!window.__pt2Game.scene.isActive('combate');
    c.scene.restart();
    return result;
  });
  assert.equal(mapState.world,'pewter');
  assert.ok(mapState.realScene,'Brock must still use the original composite image');
  // gymScreen() removes the header; allow the queued Phaser scene restart
  // to finish before counting the new fullscreen button and cached textures.
  await offline.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return c.scene.isActive()&&c.__campaignMap?.spec?.id==='pewter'&&
    c.children.list.some(o=>o.getData?.('torre2-fullscreen')===true);
  },null,{timeout:18000});
  const imageIsolation=mapState.imageIsolation;
  assert.equal(imageIsolation.baseWidth,1200);
  assert.equal(imageIsolation.baseHeight,675);
  console.log('BROCK_HIRES_FRAME_DIAGNOSTIC',JSON.stringify(imageIsolation));
  assert.ok(imageIsolation.sourceWidth>=1000,
   'The actual rendered map sprite must use the full-resolution source: '+
    JSON.stringify(imageIsolation));
  assert.ok(imageIsolation.baseFrames.every(key=>key==='__BASE'),
   'Original Brock scene must not share texture frames with the forest patch');
  assert.equal(imageIsolation.tileSpriteDetected,false,
   'No additional cropped TileSprite may overlap the high-res map on Android');
  assert.ok(imageIsolation.isFullFrame&&
   imageIsolation.rawFullFrame.width===1200&&
   imageIsolation.rawFullFrame.height===675,
   'Map must use entire original base WebGL frame (Phaser omits __BASE from getFrameNames)');
  assert.equal(imageIsolation.mapId,'brock-hires-v5');
  // New mobile UI: down-arrow hides ONLY the sidebar, expanding the
  // map in place. Party moves to a narrow bottom strip and the battle/catch
  // call-to-action is centered at the bottom in both modes.
  const panelTest=await offline.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   const arrow=c.children.list.find(o=>o.getData?.('torre2-panel-toggle'));
   const cta=c.children.list.find(o=>o.getData?.('torre2-central-cta'));
   const map=c.__campaignMapObjects.find(x=>x.obj.type==='Image'&&
     x.obj.texture?.key==='torre2-brock-custom');
   const sideTitle=c.__campaignSidebarObjects.find(x=>x.text==='SUA EQUIPE');
   const start={arrow:!!arrow,ctaX:cta?.x,ctaY:cta?.y,
     width:map?.obj.displayWidth,sidebar:sideTitle?.visible};
   arrow?.emit('pointerdown');
   const collapsed={active:c.__campaignPanelCollapsed,
     width:map?.obj.displayWidth,
     arrow:c.__campaignArrowLabel?.text,
     sidebar:sideTitle?.visible,
     dock:c.__campaignDockObjects.filter(o=>o.visible&&o.type==='Image').length,
     zoneEnabled:c.__campaignSidebarObjects
      .filter(o=>o.type==='Zone'&&o.input?.enabled).length};
   arrow?.emit('pointerdown');
   const restored={active:c.__campaignPanelCollapsed,
     width:map?.obj.displayWidth,
     sidebar:sideTitle?.visible,
     zoneEnabled:c.__campaignSidebarObjects
      .filter(o=>o.type==='Zone'&&o.input?.enabled).length};
   return {start,collapsed,restored};
  });
  assert.equal(panelTest.start.arrow,true,
   'Collapse arrow must be clickable in the campaign');
  assert.equal(panelTest.start.ctaX,320,
   'Battle/capture starts at the bottom center, not inside sidebar');
  // Centered gold CTA occupies the footer beneath the compact party tray.
  assert.equal(panelTest.start.ctaY,335);
  assert.equal(panelTest.start.ctaX,320);
  assert.equal(panelTest.start.sidebar,true);
  assert.equal(panelTest.collapsed.active,true);
  assert.ok(panelTest.collapsed.width>panelTest.start.width*1.6,
   'Hiding the panel must expand the FireRed map to full screen width');
  assert.equal(panelTest.collapsed.arrow,'▲','Arrow shows expand option');
  assert.equal(panelTest.collapsed.sidebar,false,
   'Side menu must disappear from view');
  assert.ok(panelTest.collapsed.dock>=2,
   'Player party has a compact, touchable strip at bottom');
  const footer=await offline.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   const cta=c.children.list.find(o=>o.getData?.('torre2-central-cta'));
   // Hidden dock zones are intentionally input-disabled while the sidebar
   // is expanded. Verify their layout geometry, not temporary interactivity.
   const dock=c.__campaignDockObjects
    .filter(o=>o.type==='Zone');
   const caption=c.children.list.find(o=>o.type==='Text'&&
    /TREINADOR/.test(o.text||'')&&Math.abs(o.y-335)<3);
   return {ctaY:cta?.y,ctaX:cta?.x,ctaWidth:cta?.width,
    dockY:dock.map(x=>x.y),caption:!!caption,clickable:!!cta?.input?.enabled};
  });
  assert.equal(footer.ctaY,335);
  assert.equal(footer.ctaX,320);
  assert.ok(footer.ctaWidth>=240&&footer.caption&&footer.clickable,
   'Gold battle action must be centered, readable and clickable');
  // The smoke fixture can have only two Pokémon; unlike the real saved
  // party it must not be required to render four populated click targets.
  assert.ok(footer.dockY.length>=2&&footer.dockY.every(y=>y>=299),
   'Populated party cards must sit lower and above the centered CTA: '+
    JSON.stringify(footer));
  assert.equal(panelTest.collapsed.zoneEnabled,0,
   'Hidden buttons cannot intercept clicks intended for the map');
  assert.equal(panelTest.restored.active,false);
  assert.equal(panelTest.restored.width,panelTest.start.width,
   'Toggling back restores exact native pixel-art layout');
  assert.equal(panelTest.restored.sidebar,true);
  assert.ok(panelTest.restored.zoneEnabled>=6);
  // Re-enter campaign with a completed trainer battle on Android landscape:
  // the larger map must return (the screenshot complaint was a small blurry
  // map plus a wide sidebar after every win).
  const mapReturn=await offline.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   const was=c.__campaignPanelCollapsed;
   const oldResult=c.result;
   const registry=c.registry;
   const original=registry.get('torre2-panel-collapsed');
   // Restart with native lifecycle; no fake map drawing.
   registry.set('torre2-panel-collapsed',true);
   c.scene.restart();
   return {was,original,oldResult:!!oldResult};
  });
  await offline.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return c.scene.isActive()&&c.__campaignPanelCollapsed&&
    c.__campaignMapObjects?.some(x=>x.obj?.texture?.key==='torre2-brock-custom'&&
     x.obj.displayWidth>=600);
  },null,{timeout:18000});
  await offline.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   c.setCampaignPanelCollapsed(false);
  });
  // Grass opens as a modal and does not destroy/recreate the map image.
  const grassOverlay=await offline.evaluate(async()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   const image=c.__campaignMapObjects.find(x=>x.obj.type==='Image'&&
    x.obj.texture?.key==='torre2-brock-custom').obj;
   const script=[...document.scripts].find(x=>x.src?.includes('/main.js'));
   const core=await import(new URL('./torre2/campaign-core.js',script.src).href);
   c.grassScreen(core.readCampaign());
   const opened=image.active&&!!c.__torre2GrassOverlay?.active;
   const close=c.children.list.find(o=>o.type==='Zone'&&o.depth===630&&
    Math.abs(o.x-174)<2&&Math.abs(o.y-292)<2);
   close?.emit('pointerdown');
   return {opened,closed:image.active&&!c.__torre2GrassOverlay,close:!!close};
  });
  assert.ok(grassOverlay.opened&&grassOverlay.closed&&grassOverlay.close,
   'Grass modal must preserve the map image and restore click targets');
  const mobileResources=await offline.evaluate(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    return {
     maps:c.textures.getTextureKeys().filter(k=>k.startsWith('frlg-location-')),
     npcs:c.textures.getTextureKeys().filter(k=>k.startsWith('frlg-npc-')),
     fullscreen:c.children.list.filter(o=>o.type==='Zone'&&
      o.getData?.('torre2-fullscreen')).length,
     hoverGraphics:c.children.list.filter(o=>o.type==='Graphics'&&o.depth===25).length
    };
  });
  assert.ok(mobileResources.maps.length<=2,
   'Opening Brock must not upload all Kanto city sheets to mobile GPU');
  assert.ok(mobileResources.npcs.length<=12,
   'Opening Brock must not upload 41 trainer textures');
  assert.equal(mobileResources.fullscreen,1,
   'Mobile map offers a clickable fullscreen control');
  assert.equal(mobileResources.hoverGraphics,1,
   'Map uses one shared hover Graphics instead of per-trainer effects');
  // A wide phone should enlarge only the CSS canvas rectangle; gameplay
  // logical resolution and all trainer/menu positions remain 640x360.
  await offline.setViewportSize({width:980,height:420});
  await offline.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return c.scene.isActive()&&
    document.body.classList.contains('torre2-landscape-map')&&
    Math.abs(document.querySelector('#juego canvas').getBoundingClientRect().width-980)<2;
  },null,{timeout:18000});
  const wideDisplay=await offline.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   const rect=document.querySelector('#juego canvas').getBoundingClientRect();
   const cta=c.children.list.find(x=>x.getData?.('torre2-central-cta'));
   return {sizeX:c.scale.gameSize.width,rectX:rect.x,rectY:rect.y,
    rectW:rect.width,rectH:rect.height,ctaX:cta.x};
  });
  assert.ok(Math.abs(wideDisplay.rectW-980)<2&&
   Math.abs(wideDisplay.rectH-420)<2&&Math.abs(wideDisplay.rectX)<2,
   'Landscape canvas should extend to both screen edges');
  assert.equal(wideDisplay.ctaX,320,
   'Battle button keeps its original 640x360 world coordinates');
  await offline.setViewportSize({width:980,height:650});
  await offline.waitForFunction(()=>
   !document.body.classList.contains('torre2-landscape-map'),
   null,{timeout:18000});
  // Fullscreen APIs are browser gesture-restricted; stub the Phaser manager
  // here and exercise the real button's pointerup handler.
  const fullscreenClicks=await offline.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   const control=c.children.list.find(o=>o.getData?.('torre2-fullscreen'));
   const manager=c.scale;let count=0;
   const original=manager.startFullscreen;
   manager.startFullscreen=()=>{count++};
   try{control.emit('pointerup');}finally{manager.startFullscreen=original;}
   return count;
  });
  assert.equal(fullscreenClicks,1,
   'Fullscreen button invokes Phaser on pointerup for Android compatibility');
  assert.equal(mapState.points,13,'Brock shows all 13 trainers simultaneously');
  assert.equal(mapState.trainer,0);
  assert.ok(mapState.initial.includes('ROTA DE BROCK'));
  assert.ok(mapState.realScene,'Uploaded custom Brock route image must render as native Phaser sprite');
  assert.ok(mapState.realNPCs>=13,'Trainer markers must use real FireRed NPC sprites');
  assert.ok(mapState.portraits>=1,'Six-slot team uses real Pokémon portraits');
  assert.ok(mapState.zones>=19,'13 nodes, gym, grass, Center and Shop are interactive');
  assert.ok(mapState.lockedGym.includes('FALTAM 13')&&
   mapState.gymDidNotStartCombat,'Gym boss must be locked until 13 victories');
  await offline.waitForFunction(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    const captions=c.children.list.filter(o=>typeof o.text==='string').map(o=>o.text);
    return c.scene.isActive()&&c.__campaignMap?.spec?.id==='pewter'&&
      captions.includes('SUA EQUIPE')&&captions.some(x=>x.includes('INSÍGNIAS'));
  },null,{timeout:15000});
  // Existing UI actions still open native screens and return to the SAME map.
  const newMap=await offline.evaluate(async()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    const script=[...document.scripts].find(x=>x.src?.includes('/main.js'));
    const core=await import(new URL('./torre2/campaign-core.js',script.src).href);
    const state=core.readCampaign();
    const labels=()=>c.children.list.filter(o=>typeof o.text==='string')
      .map(o=>o.text).join(' | ');
    const map=labels();
    c.grassScreen(state);const grass=labels();
    c.centerScreen(state);const center=labels();
    c.martScreen(state);const mart=labels();
    c.bagScreen(state);const bag=labels();
    c.scene.restart();
    return {map,grass,center,mart,bag};
  });
  assert.ok(newMap.map.includes('INSÍGNIAS'),'Map shows saved badges');
  assert.ok(newMap.grass.includes('VIRIDIAN'),'Grass retains Kanto encounters');
  assert.ok(newMap.center.includes('CURAR'),'Center screen is functional');
  assert.ok(newMap.mart.includes('POKÉ MART'),'Shop opens actual inventory');
  assert.ok(newMap.bag.includes('POÇÃO'),'Bag retains potions');
  await offline.waitForFunction(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    return c.scene.isActive()&&c.__campaignMap?.spec?.id==='pewter'&&
      c.children.list.some(o=>o.text==='SUA EQUIPE');
  },null,{timeout:13000});
  await offline.screenshot({path:'test-evidence/torre2-pewter-single-map-13-trainers.png',
    fullPage:true});
  await offline.evaluate(async()=>{
    const script=[...document.scripts].find(x=>x.src?.includes('/main.js'));
    const core=await import(new URL('./torre2/campaign-core.js',script.src).href);
    window.__pt2Game.scene.getScene('campanha').mapScreen(core.readCampaign());
  });
  await offline.waitForFunction(()=>{
    const scene=window.__pt2Game.scene.getScene('campanha');
    return scene.scene.isActive()&&scene.__campaignMap?.spec?.id==='pewter'&&
     scene.children.list.some(o=>o.text==='SUA EQUIPE');
  },null,{timeout:15000});
  const mapScreen=await offline.evaluate(()=>{
    const scene=window.__pt2Game.scene.getScene('campanha');
    return {id:scene.__campaignMap?.spec?.id,
     points:scene.__campaignMap?.locations,
     label:scene.children.list.filter(x=>typeof x.text==='string')
      .map(x=>x.text).join(' | ')};
  });
  assert.equal(mapScreen.id,'pewter','MAPA returns to the same unified location');
  assert.equal(mapScreen.points,13,'MAPA never changes the number of markers');
  assert.ok(mapScreen.label.includes('ROTA DE BROCK'));
  await offline.screenshot({path:'test-evidence/torre2-brock-locked-gym-and-real-sprites.png',
   fullPage:true});
  await offline.evaluate(()=>window.__pt2Game.scene.getScene('campanha').scene.restart());
  await offline.waitForFunction(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    return c.scene.isActive()&&c.__campaignMap?.spec?.id==='pewter'&&
      c.children.list.some(o=>o.text==='SUA EQUIPE');
  },null,{timeout:12000});

  // Track client errors during transfer from world map to native battle.
  await offline.evaluate(()=>{
   window.__pt2PartyErrors=[];
   window.addEventListener('error',e=>window.__pt2PartyErrors.push(String(e.message||e.error?.stack||e.error)));
   window.addEventListener('unhandledrejection',e=>window.__pt2PartyErrors.push(String(e.reason?.stack||e.reason)));
  });
  // Campaign party regression: real in-arena switching preserves Kanto
  // checkpoint progress, and the opponent's HP does not reset on switch.
  await offline.evaluate(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    const script=[...document.scripts].find(x=>x.src?.includes('/main.js'));
    c.enterBattle(c.__campaignMap&&JSON.parse(
      localStorage.getItem('pokemon-torre-2-kanto-campaign-v1')));
  });
  try{
   await offline.waitForFunction(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return b.scene.isActive()&&b.__torre2PartyInstalled&&
      b.fase==='lucha'&&b.datos.torre2.party.friend.length===2;
   },null,{timeout:26000});
  }catch(error){
   const diag=await offline.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return {active:b.scene.isActive(),status:b.sys.settings.status,
     phase:b.fase,installed:b.__torre2PartyInstalled,
     fighters:b.luchadores?.map(l=>l.def?.id),
     hasParty:!!b.datos?.torre2?.party,
     loading:b.load?.isLoading(),pending:b.load?.totalToLoad,
     loadFailure:b.load?.totalFailed,
     textures:b.textures.getTextureKeys().filter(k=>k.startsWith('pmd-')).length,
     campaignStatus:window.__pt2Game.scene.getScene('campanha').sys.settings.status,
     sceneManager:window.__pt2Game.scene.scenes.map(s=>[s.sys.settings.key,s.sys.settings.status]),
     errors:window.__pt2PartyErrors};
   });
   console.error('PARTY_STARTUP_DIAGNOSTIC',JSON.stringify(diag));
   throw error;
  }
  const partyUi=await offline.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   const panel=b.children.list.filter(o=>typeof o.text==='string')
    .map(o=>o.text).join(' | ');
   const foes=b.datos.torre2.party.foes;
   const originalTexture=b.luchadores[0]?.spr?.texture?.key;
   window.__pt2PreviousDex=String(b.luchadores[0]?.dex||'');
   window.__pt2PreviousSprite=b.luchadores[0]?.spr;
   // Isolate the swap transition from an unrelated KO in the full
   // running CPU fight: Mewtwo LV50 can knock out a LV6 target before
   // the animation ends. We deliberately test damage separately.
   b.luchadores[0].inmortal=true;
   b.luchadores[1].inmortal=true;
   b.luchadores[1].hp=Math.round(b.luchadores[1].hpMax*.67);
   const control=b.children.list.find(o=>o.type==='Zone'&&
    Math.abs(o.x-320)<2&&Math.abs(o.y-88)<2&&o.input?.enabled);
   if(control)control.emit('pointerdown');
   const target=b.children.list.find(o=>o.type==='Zone'&&
    Math.abs(o.x-419)<2&&Math.abs(o.y-148)<2&&o.input?.enabled);
   if(target)target.emit('pointerdown');
   return {panel,foes:foes.length,control:!!control,target:!!target,
    originalTexture};
  });
  assert.ok(partyUi.panel.includes('TROCAR POKÉMON'),
   'Real Phaser combat exposes party selector');
  assert.ok(partyUi.panel.includes('SEUS POKÉMON')&&partyUi.panel.includes('RIVAL'),
   'Pokéball badges show both combat parties below their life HUDs');
  assert.ok(partyUi.control&&partyUi.target,'Switch must be clickable by touch');
  await offline.evaluate(x=>{window.__pt2FirstTexture=x},partyUi.originalTexture);
  await offline.waitForFunction(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    const l=b.luchadores?.[0];
    return b.scene.isActive()&&b.__torre2PartyInstalled&&
      b.datos?.torre2?.party?.playerIndex===1&&
      l?.def?.id==='mewtwo'&&b.fase==='lucha'&&
      l.spr?.texture?.key===('pmd-'+l.dex+'-Idle')&&
      l.spr?.texture?.key!==window.__pt2FirstTexture&&
      l.spr?.anims?.currentAnim?.key?.startsWith(l.dex+'-');
  },null,{timeout:24000});
  const afterSwitch=await offline.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   const e=b.luchadores[1];
   return {enemyPct:e.hp/e.hpMax,phase:b.fase,round:b.numRonda,
    remaining:b.datos.torre2.party.friend.filter(x=>x.hp>0).length,
    marker:b.datos.torre2.trainer};
  });
  assert.equal(afterSwitch.phase,'lucha','Swap resumes SAME battle scene');
  assert.equal(afterSwitch.round,1,'No new countdown after switching');
  const visibleSwapPokemon=await offline.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),l=b.luchadores[0];
   const orphans=b.children.list.filter(obj=>
    obj.active&&obj.type==='Sprite'&&
    String(obj.texture?.key||'').startsWith('pmd-'+window.__pt2PreviousDex+'-')&&
    !b.luchadores.some(a=>a.spr===obj));
   const old=window.__pt2PreviousSprite;
   const oldStillVisible=old!==l.spr&&old?.active&&old?.visible;
   const beam=b.__torre2BeamDebug;
   const debug=b.__torre2SwapDebug;
   return {dex:l.dex,texture:l.spr?.texture?.key,
    animation:l.spr?.anims?.currentAnim?.key,
    visible:l.spr?.visible,scale:l.spr?.scaleX,phase:b.fase,
    active:b.scene.isActive(),orphans:orphans.map(x=>x.texture.key),
    oldStillVisible,debug,beam};
  
  });
  assert.equal(visibleSwapPokemon.texture,'pmd-'+visibleSwapPokemon.dex+'-Idle',
   'The ACTUAL in-arena sprite texture must match Mewtwo numeric PMD dex');
  assert.notEqual(visibleSwapPokemon.texture,partyUi.originalTexture,
   'Switch must replace Bulbasaur sprite, not merely rename its HUD');
  assert.ok((visibleSwapPokemon.animation||'').startsWith(visibleSwapPokemon.dex+'-'),
   'PMD animations use numeric dex keys, not the English species name');
  assert.ok(visibleSwapPokemon.visible&&visibleSwapPokemon.scale>.2,
   'The replacement sprite must be visible, not miniaturized or transparent');
  assert.equal(visibleSwapPokemon.oldStillVisible,false,
   'No old Pokémon sprite may remain visible after the PMD switch: '+
    JSON.stringify(visibleSwapPokemon));
  assert.deepEqual(visibleSwapPokemon.orphans,[],
   'Orphan PMD sprite from the previous Pokémon must be destroyed');
  assert.equal(visibleSwapPokemon.debug?.activeTexture,
   visibleSwapPokemon.texture,'The cleaned animation matches the battle HUD');
  assert.equal(visibleSwapPokemon.beam?.phase,'release');
  assert.ok(Math.hypot(
   visibleSwapPokemon.beam.from.x-visibleSwapPokemon.beam.to.x,
   visibleSwapPokemon.beam.from.y-visibleSwapPokemon.beam.to.y)>70,
   'Pokéball red laser must visibly traverse the arena and touch the fighter');
  assert.ok(Math.hypot(
   visibleSwapPokemon.beam.currentBody.x-visibleSwapPokemon.beam.to.x,
   visibleSwapPokemon.beam.currentBody.y-visibleSwapPokemon.beam.to.y)<6,
   'Final laser endpoint must align with visible Pokémon body');
  const liveSpeciesGuard=await offline.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),a=b.luchadores[0];
   const idle='pmd-'+a.dex+'-Idle',wrong='pmd-0007-Idle';
   if(!b.textures.exists(wrong))throw Error('Missing test PMD atlas');
   a.spr.anims.stop();a.spr.setTexture(wrong);
   a.actualizarGraficos(0);
   return {dex:a.dex,texture:a.spr.texture.key,expected:idle,
    corrections:a.__torre2RenderCorrections||0};
  });
  assert.ok(liveSpeciesGuard.texture.startsWith('pmd-'+liveSpeciesGuard.dex+'-'),
   'NATIVE Phaser Luchador renderer must repair a stale species texture: '+
    JSON.stringify(liveSpeciesGuard));
  assert.ok(liveSpeciesGuard.corrections>=1,
   'The real Luchador renderer should detect and correct stale PMD atlases');
  assert.equal(visibleSwapPokemon.phase,'lucha',
   'No frozen KO phase or replayed FIGHT countdown after a manual switch');
  assert.ok(afterSwitch.enemyPct>.59&&afterSwitch.enemyPct<.74,
    'Switching Pokémon must preserve opponent damage');
  // Releasing/recollecting must use genuine authored pixel-cell sprite art,
  // and the exact same PMD bounds that are visible on the battlefield.
  const recallArt=await offline.evaluate(async()=>{
   const src=[...document.scripts].find(x=>x.src?.includes('/main.js'));
   const mod=await import(new URL('./torre2/capture-arena.js',src.src).href);
   const b=window.__pt2Game.scene.getScene('combate');
   const fake={clear(){},fillStyle(){},fillRect(...a){this.rects.push(a)},rects:[]};
   mod.drawCaptureBall(fake,120,210,'pokeball',1);
   const fighter=b.luchadores[0],bounds=fighter.spr.getBounds();
   return {cells:fake.rects.length,target:[bounds.centerX,bounds.centerY],
    width:bounds.width,height:bounds.height};
  });
  assert.ok(recallArt.cells>70,'Pokéball must use fully drawn pixel-cell sprite art');
  assert.ok(recallArt.target.every(Number.isFinite)&&recallArt.width>0,
   'The red beam must target an actual animated PMD Pokémon texture');
  assert.equal(afterSwitch.remaining,2,
    'Manual switching does not mark a Pokémon fainted');
  // Force one actual knockout event, then verify the red recall action
  // sends the original starter back out without finishing the trainer.
  await offline.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    b.fase='lucha';
    b.luchadores[0].hp=0;
    b.alKO(b.luchadores[0]);
  });
  try{
   await offline.waitForFunction(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return b.scene.isActive()&&b.__torre2PartyInstalled&&
      b.datos?.torre2?.party?.playerIndex===0&&
      b.datos?.torre2?.party?.friend?.[1]?.hp===0&&
      b.luchadores?.[0]?.def?.id==='charmander'&&
      b.luchadores?.[0]?.spr?.texture?.key===('pmd-'+b.luchadores[0].dex+'-Idle')&&
      b.fase==='lucha';
   },null,{timeout:14000});
  }catch(e){
   const info=await offline.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate'),p=b.datos?.torre2?.party;
    return {active:b.scene.isActive(),fase:b.fase,changing:b.__torre2Changing,
     installed:b.__torre2PartyInstalled,playerIndex:p?.playerIndex,
     changes:p?.changes,hp:p?.friend?.map(m=>m.hp),
     fighter:b.luchadores?.[0]?.def?.id,enemy:b.luchadores?.[1]?.def?.id,
     tweens:b.tweens?.getTweens?.().length,scene:b.sys?.settings?.status};
   });
   console.log('KO_PARTY_DIAGNOSTIC',JSON.stringify(info));
   throw e;
  }
  const afterFaint=await offline.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return {foe:b.luchadores[1].hp/b.luchadores[1].hpMax,
    faded:b.datos.torre2.party.friend[1].hp,
    player:b.luchadores[0].def.id};
  });
  assert.equal(afterFaint.faded,0,
    'Pokéball indicator marks fainted Mewtwo unavailable');
  assert.equal(afterFaint.player,'charmander',
    'After KO the actual replacement Pokémon controls the same arena');
  assert.ok(afterFaint.foe>.59&&afterFaint.foe<.74,
    'Red-beam replacement does not restore the rival HP: '+
     JSON.stringify({afterFaint,afterSwitch}));
  // Rival-side KO is important too. A report showed "Pidgey" at the top
  // while the old Squirtle remained walking in the arena below it. Verify
  // that the enemy actor swaps the actual native PMD sprite and cleans
  // every orphan of the previous species (not only the player's own swap).
  const rivalOld=await offline.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),p=b.datos.torre2.party;
   const e=b.luchadores[1];
   const oldDex=String(e.dex||'');
   p.foes.push({id:'charmander',hp:100,level:6,
    loadout:p.friend[0].loadout});
   e.inmortal=false;b.fase='lucha';e.hp=0;b.alKO(e);
   return {oldDex,oldTexture:e.spr?.texture?.key};
  });
  await offline.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),p=b.datos?.torre2?.party;
   return b.scene.isActive()&&p?.enemyIndex===1&&
    b.luchadores?.[1]?.def?.id==='charmander'&&b.fase==='lucha';
  },null,{timeout:18000});
  const rivalVisuals=await offline.evaluate(oldDex=>{
   const b=window.__pt2Game.scene.getScene('combate'),e=b.luchadores[1];
   const stale=b.children.list.filter(o=>
    o.active&&o.visible&&o.type==='Sprite'&&
    String(o.texture?.key||'').startsWith('pmd-'+oldDex+'-')&&
    !b.luchadores.some(a=>a.spr===o));
   return {dex:e.dex,texture:e.spr.texture.key,
    oldCount:stale.length,swap:b.__torre2SwapDebug,
    beam:b.__torre2BeamDebug};
  },rivalOld.oldDex);
  assert.equal(rivalVisuals.oldCount,0,
   'Enemy KO must remove the previous PMD enemy sprite: '+
    JSON.stringify(rivalVisuals));
  assert.ok(rivalVisuals.texture.startsWith('pmd-'+rivalVisuals.dex+'-'),
   'Enemy PMD body must match the actual species even during Walk/Idle/Attack: '+
    JSON.stringify(rivalVisuals));
  assert.equal(rivalVisuals.beam?.side,1,
   'Enemy KO uses its own red-beam recollection and release');
  await offline.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    // Exercise the same native finished-battle return path, but with an
    // invalid marker so this smoke test never advances the saved trainer.
    b.scene.start('campanha',{finished:true,won:false,marker:{stage:-777}});
  });
  await offline.waitForFunction(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    return c.scene.isActive()&&c.__campaignMap?.spec?.id==='pewter';
  },null,{timeout:16000});
  const returnedMap=await offline.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   const image=c.children.list.find(o=>o.type==='Image'&&
    o.texture?.key==='torre2-brock-custom');
   return {loaded:image?.active,refreshed:c.__torre2MapGpuRefreshed===true,
    source:image?.frame?.width,overlay:c.children.list.filter(o=>
      o.type==='TileSprite'&&o.active&&o.depth===2).length};
  });
  assert.ok(returnedMap.loaded&&returnedMap.refreshed&&
   returnedMap.source===1200&&returnedMap.overlay===0,
   'After KO, restore high-res world with a freshly uploaded GPU base frame: '+
   JSON.stringify(returnedMap));
  // Visual regression: checking a 1200px texture key is NOT enough. An
  // Android GPU can display that very source as huge blurry color blocks.
  // Measure real SCREENSHOT fine detail after KO, not DOM/texture metadata.
  const returnedPng=await offline.screenshot({
   path:'test-evidence/torre2-after-ko-real-webgl-pixels.png',
   fullPage:false
  });
  const mapVisual=await offline.evaluate(async encoded=>{
   const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
   const bitmap=await createImageBitmap(new Blob([bytes],{type:'image/png'}));
   const cv=document.createElement('canvas');cv.width=bitmap.width;cv.height=bitmap.height;
   const ctx=cv.getContext('2d',{willReadFrequently:true});
   ctx.drawImage(bitmap,0,0);
   const data=ctx.getImageData(0,0,cv.width,cv.height).data;
   const game=window.__pt2Game,c=game.scene.getScene('campanha');
   const image=c.children.list.find(o=>o.type==='Image'&&
    o.texture?.key==='torre2-brock-custom');
   const box=image.getBounds();
   const canvasBox=game.canvas.getBoundingClientRect();
   const ratioX=canvasBox.width/game.canvas.width;
   const ratioY=canvasBox.height/game.canvas.height;
   let total=0,count=0;
   // This area contains detailed trees and paths, not the UI labels/forest
   // watermark. A correct source averages ~20+ RGB edge units here; the
   // user-reported broken texture averages ~4.
   for(let v=.15;v<.37;v+=.007){
    const y=Math.round(canvasBox.top+(box.top+box.height*v)*ratioY);
    for(let u=.34;u<.56;u+=.004){
     const x=Math.round(canvasBox.left+(box.left+box.width*u)*ratioX);
     if(x<=1||x>=cv.width-1||y<0||y>=cv.height)continue;
     const k=4*(y*cv.width+x),prev=k-4;
     total+=(Math.abs(data[k]-data[prev])+
      Math.abs(data[k+1]-data[prev+1])+
      Math.abs(data[k+2]-data[prev+2]))/3;
     count++;
    }
   }
   return {horizontalContrast:count?total/count:0,samples:count,
    canvas:[game.canvas.width,game.canvas.height],
    map:[box.x,box.y,box.width,box.height]};
  },returnedPng.toString('base64'));
  console.log('BROCK_AFTER_KO_VISUAL_DETAIL',JSON.stringify(mapVisual));
  assert.ok(mapVisual.samples>400&&mapVisual.horizontalContrast>=10,
   'After a real KO the Kanto map must remain sharp on the rendered screen, not just in the source texture: '+
    JSON.stringify(mapVisual));
  const trainerAfterSwap=await offline.evaluate(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    return c.__campaignMap?.spec?.id;
  });
  assert.equal(trainerAfterSwap,'pewter',
   'Manual Pokémon switch must not progress to next trainer');

  // Regression: encounter in real native combat, click the capture HUD,
  // weaken the actual enemy HP, throw a sprite-ball, wait through three shakes,
  // and verify the captured Pokémon is persisted without advancing trainers.
  await offline.evaluate(async()=>{
    const script=[...document.scripts].find(x=>x.src?.includes('/main.js'));
    const core=await import(new URL('./torre2/campaign-core.js',script.src).href);
    const state=core.readCampaign();
    const found=core.startWildEncounter(state,()=>0);
    if(!found.ok)throw Error('Cannot create the first Kanto wild encounter');
    window.__pt2Game.scene.getScene('campanha').enterBattle(state,true);
  });
  await offline.waitForFunction(()=>window.__pt2Game?.scene.isActive('combate')&&
    window.__pt2Game.scene.getScene('combate').__torre2WildCapture===true,
    null,{timeout:24000});
  const captureHud=await offline.evaluate(()=>{
    const c=window.__pt2Game.scene.getScene('combate'),enemy=c.luchadores[1];
    enemy.hp=Math.max(1,enemy.hpMax*.12);
    const opener=c.children.list.find(o=>o.type==='Zone'&&
      Math.abs(o.x-539)<2&&Math.abs(o.y-61)<2&&o.input?.enabled);
    if(!opener)return {opener:false};
    opener.emit('pointerdown');
    const menu=c.children.list.filter(o=>typeof o.text==='string')
      .map(o=>o.text).join(' | ');
    const choice=c.children.list.find(o=>o.type==='Zone'&&
      Math.abs(o.x-316)<2&&Math.abs(o.y-187)<2&&o.input?.enabled);
    if(!choice)return {opener:true,menu,choice:false};
    const orig=Math.random;
    Math.random=()=>0;
    try{choice.emit('pointerdown')}finally{Math.random=orig}
    return {opener:true,choice:true,menu,phase:c.fase};
  });
  assert.ok(captureHud.opener&&captureHud.choice,
   'Wild battle must expose clickable Phaser Pokéball controls');
  assert.ok(captureHud.menu.includes('LANÇAR POKÉBOLA'),
   'Three selectable balls appear in the native capture HUD');
  assert.equal(captureHud.phase,'capturando',
   'Throwing a ball must pause real attacks while animation plays');
  await offline.waitForFunction(()=>{
    if(!window.__pt2Game?.scene.isActive('campanha'))return false;
    const s=JSON.parse(localStorage.getItem('pokemon-torre-2-kanto-campaign-v1')||'{}');
    return s.pendingWild===null&&s.dexCaught?.length>=2&&s.trainer===0;
  },null,{timeout:19000});
  await offline.screenshot({path:'test-evidence/torre2-wild-capture-result.png',fullPage:true});
  // Reset only the isolated browser test save, not any actual player save.
  await offline.evaluate(async()=>{
    const script=[...document.scripts].find(x=>x.src?.includes('/main.js'));
    const core=await import(new URL('./torre2/campaign-core.js',script.src).href);
    core.saveCampaign(core.createCampaign('charmander'));
    window.__pt2Game.scene.getScene('campanha').scene.restart();
  });
  await offline.waitForFunction(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    return c.__campaignMap?.spec?.id==='pewter'&&
     c.children.list.some(o=>o.text==='SUA EQUIPE');
  },null,{timeout:12000});

  await offline.evaluate(async()=>{
    const entry=[...document.querySelectorAll('script[src]')].find(x=>x.src.includes('/main.js'));
    const core=await import(new URL('./torre2/campaign-core.js',entry.src).href);
    const s=core.readCampaign();
    const match=core.startBattle(s);
    // Only this AI regression uses Onix, so its historic evolution scenario
    // remains identical while the real Kanto trainer ladder starts at Pidgey.
    match.p2='onix';
    window.__pt2Game.scene.getScene('campanha').scene.start('combate',match);
  });
  await offline.waitForFunction(()=>window.__pt2Game?.scene.isActive('combate')&&
    window.__pt2Game.scene.getScene('combate').luchadores?.length===2,
    null,{timeout:45000});
  // Regression: Onix reaches the original evolution EXP threshold mid-fight.
  // In Kanto the CPU must NOT keep issuing blocked EVO commands forever;
  // in standard CPU mode it still should dynamically request evolution.
  const aiRegression=await offline.evaluate(()=>{
    const scene=window.__pt2Game.scene.getScene('combate');
    const opponent=scene.luchadores[1],cpu=scene.controles[1];
    opponent.exp=opponent.expNecesaria+2;
    opponent.hp=Math.min(opponent.hp,opponent.hpMax*.33);
    const canEvolve=opponent.puedeEvolucionar;
    cpu.c.evoDist=0;
    let attacks=0,moveChoices=0,blockedEvo=0;
    for(let i=0;i<85;i++){
      cpu.espera=-1;
      const it=cpu.leer(.25);
      if(it.mega)blockedEvo++;
      if(it.lmb||it.rmb||it.q||it.e||it.esp)attacks++;
      if(Math.abs(it.mx)+Math.abs(it.my)>.08)moveChoices++;
    }
    // Temporarily emulate an ordinary VS CPU match to prove dynamic
    // evolution still works in other modes.
    const marker=scene.datos.torre2;
    scene.datos.torre2=null;
    cpu.espera=-1;
    const otherMode=cpu.leer(.25);
    scene.datos.torre2=marker;
    return {canEvolve,attacks,moveChoices,blockedEvo,otherModeEvo:otherMode.mega};
  });
  assert.equal(aiRegression.canEvolve,true,'Onix must be eligible to evolve for regression');
  assert.equal(aiRegression.blockedEvo,0,'Kanto CPU cannot request blocked EVO');
  assert.ok(aiRegression.attacks>0,'CPU must continue attacking after evolution becomes available');
  assert.equal(aiRegression.otherModeEvo,true,'VS CPU/Training/Arena retain original dynamic evolution decision');
  await offline.screenshot({path:'test-evidence/pokemon-torre-2-ai-evolution-no-stall.png',fullPage:true});
  const combatScene=await offline.evaluate(()=>({
    mode:window.__pt2Game.scene.getScene('combate').datos.modo,
    online:!!window.__pt2Game.scene.getScene('combate').red,
    species:window.__pt2Game.scene.getScene('combate').luchadores.map(x=>x.def.id)
  }));
  assert.equal(combatScene.mode,'cpu');
  assert.equal(combatScene.online,false,'campaign battle must not use online server');
  // Verify the winning result returns to campaign and persists an earned victory.
  await offline.evaluate(()=>{
    const battle=window.__pt2Game.scene.getScene('combate');
    battle.victorias=[2,0];battle.resultado();
  });
  await offline.waitForFunction(()=>window.__pt2Game?.scene.isActive('campanha')&&
    JSON.parse(localStorage.getItem('pokemon-torre-2-kanto-campaign-v1')||'{}').trainer===1,
    null,{timeout:16000});
  const offlineResult=await offline.evaluate(()=>JSON.parse(
    localStorage.getItem('pokemon-torre-2-kanto-campaign-v1')));
  assert.equal(offlineResult.trainer,1);
  assert.ok(offlineResult.team[0].progression.experience>125);
  assert.deepEqual(outRequests,[],'no external account or multiplayer endpoints in campaign');
  await offline.screenshot({path:'test-evidence/pokemon-torre-2-after-first-victory.png',fullPage:true});
  await offline.close();
  // Campaign entry stays at the approved title/menu; no forced test loadout.
  // Bite and Crunch remain available from the ordinary campaign summary.
  // Real Mewtwo summary and actual execution of all four newly drawn VFX.
  const tester=await browser.newPage({viewport:{width:980,height:650},deviceScaleFactor:1});
  const newErrors=[];
  tester.on('pageerror',e=>newErrors.push(String(e)));
  await tester.goto('http://127.0.0.1:4274/arena2d/',{waitUntil:'domcontentloaded'});
  await tester.waitForFunction(()=>window.__pt2Started&&window.__pt2Game?.scene.isActive('titulo'),null,{timeout:65000});
  const summaryState=await tester.evaluate(async()=>{
    const entry=[...document.querySelectorAll('script[src]')].find(x=>x.src.includes('/main.js'));
    const base=new URL('./',entry.src);
    const core=await import(new URL('torre2/campaign-core.js',base).href);
    const pool=await import(new URL('torre2/move-pool.js',base).href);
    const s=core.createCampaign('squirtle');
    core.saveCampaign(s);
    window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
    const p=pool.availableMoves(s.team[1]);
    return {level:s.team[1].progression.level,team:s.team.map(x=>x.id),
     count:p.length,signature:['Bonemerang','Bone Club','Tri Attack','Pay Day'].every(n=>p.some(m=>m.nombre===n))};
  });
  assert.equal(summaryState.level,50);
  assert.ok(summaryState.count>=8&&summaryState.signature,'Mewtwo has ALL captured/created moves unlocked for testing');
  await tester.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'),null,{timeout:14000});
  await tester.evaluate(()=>{
    const scene=window.__pt2Game.scene.getScene('campanha');
    const state=JSON.parse(localStorage.getItem('pokemon-torre-2-kanto-campaign-v1'));
    scene.showSummary(state,1);
  });
  await tester.waitForTimeout(900);
  await tester.screenshot({path:'test-evidence/torre2-mewtwo-lv50-summary-stat-moves.png',fullPage:true});
  const uiCheck=await tester.evaluate(()=>{
   const scene=window.__pt2Game.scene.getScene('campanha');
   const state=JSON.parse(localStorage.getItem('pokemon-torre-2-kanto-campaign-v1'));
   const labels=()=>scene.children.list.filter(x=>typeof x.text==='string').map(x=>x.text);
   const first=labels();
   if(!first.includes('GOLPES EQUIPADOS')||!first.includes('TIPO ▾')||
      !first.includes('BUSCAR'))throw Error('Polished summary controls missing');
   const root={equipped:true,search:true,paging:first.some(x=>x.includes('PÁGINAS'))};
   scene.showMoveTypePicker(state,1,0);
   if(!labels().includes('GROUND'))throw Error('Type picker is not populated');
   if(!labels().includes('NEW'))throw Error('NEW tab missing from TIPO picker');
   scene.summaryFilter='NEW';scene.summarySearch='';
   scene.showSummary(state,1,0,0);
   if(!labels().some(x=>x.includes('FILTRO: NEW')))throw Error('NEW filter label missing');
   // NEW rows are distinct from the equipped slots above them.
   const pendingRows=scene.children.list.filter(x=>typeof x.text==='string'&&
    x.x>=230&&x.y>=222&&x.y<315).map(x=>x.text);
   if(!labels().some(x=>x.includes('TODOS OS GOLPES APROVADOS')))
    throw Error('Empty NEW tab must confirm all moves have been approved');
   for(const name of ['Horn Attack','Rock Tomb','Metronome','Absorb','X-Scissor',
    'Metal Claw','Bind','Double Kick','Fury Attack'])
    if(pendingRows.some(x=>x.includes(name)))
     throw Error('Approved move leaked into empty NEW: '+name);
   // Equipped moves above the library are always visible; only inspect the
   // NEW-filtered library rows at y >= 223, not the four equipped slots.
   if(scene.children.list.some(x=>typeof x.text==='string'&&
     x.text.includes('Bonemerang')&&x.x>=230&&x.y>=222&&x.y<315))
    throw Error('Approved move leaked into NEW library rows');
   scene.showMoveTypePicker(state,1,0);
   if(!labels().includes('NEW'))throw Error('NEW not available on reopening types');
   scene.summaryFilter='GROUND';
   scene.showSummary(state,1,0,0);
   if(!labels().some(x=>x.includes('FILTRO: GROUND')))throw Error('GROUND filter label missing');
   if(!labels().some(x=>x.includes('Bonemerang')))throw Error('Ground attack filtered out');
   scene.summaryFilter='ALL';scene.summarySearch='PAY';
   scene.showSummary(state,1,0,0);
   if(!labels().some(x=>x.includes('Pay Day')))throw Error('Move search not working');
   scene.summarySearch='';scene.showSummary(state,1,0,0);
   return {...root,typePicker:true,typeFiltering:true,searchFiltering:true,newApprovalTab:true};
  });
  assert.equal(uiCheck.typePicker,true);
  assert.equal(uiCheck.newApprovalTab,true,'NEW should work in the existing TIPO picker');
  await tester.screenshot({path:'test-evidence/torre2-mewtwo-redesigned-moves.png',fullPage:true});

  await tester.evaluate(async()=>{
    const entry=[...document.querySelectorAll('script[src]')].find(x=>x.src.includes('/main.js'));
    const core=await import(new URL('./torre2/campaign-core.js',entry.src).href);
    const move=await import(new URL('./torre2/move-pool.js',entry.src).href);
    const s=core.readCampaign();s.active=1;core.saveCampaign(s);
    const d=core.startBattle(s);d.torre2Loadout=move.resolveLoadout(s.team[1]);
    d.mandos=['kbm','cpu'];
    window.__pt2Game.scene.getScene('campanha').scene.start('combate',d);
  });
  await tester.waitForFunction(()=>window.__pt2Game?.scene.isActive('combate')&&window.__pt2Game.scene.getScene('combate').luchadores?.length===2,
   null,{timeout:50000});
  await tester.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').fase==='lucha',
   null,{timeout:20000,polling:300});
  const moveSmoke={species:'mewtwo',level:50,enemy:'onix',forms:[]};
  for(const [slot,name,delay] of [
   ['lmb','bonemerang',300],['rmb','bone-club',260],
   ['q','tri-attack',380],['e','pay-day',360],
   ['rmb','swift',450],
   ['q','shadow-ball',490],['e','lovely-kiss',570],
   ['lmb','ice-beam',450],['rmb','rock-blast',610],
   ['q','confuse-ray',500],['lmb','soft-boiled',700]]){
   const result=await tester.evaluate(async ({sl,moveName})=>{
    const entry=[...document.querySelectorAll('script[src]')].find(x=>x.src.includes('/main.js'));
    const fx=await import(new URL('./habilidades.js',entry.src).href);
    const pool=await import(new URL('./torre2/move-pool.js',entry.src).href);
    const e=window.__pt2Game.scene.getScene('combate'),l=e.luchadores[0],r=e.luchadores[1];
    const attack=pool.SIGNATURE_MOVES.find(x=>x.id===moveName);
    if(!attack)throw Error('Missing attack in test catalog '+moveName);
    l.kit[sl]={...attack};
    l.x=300;l.y=215;l.hp=l.hpMax;l.energia=100;l.ulti=100;
    r.x=371;r.y=215;r.hp=r.hpMax;
    l.ax=r.x;l.ay=r.y;
    l.cd[sl]=0;l.accion=null;delete l.est.aturdido;
    const before=e.efectos.length,ok=fx.usarHabilidad(l,sl);
    return {slot:sl,ok,forma:l.kit[sl]?.forma,rendered:e.efectos.length>before,
      initialEnemyHp:r.hp};
   },{sl:slot,moveName:name});
   assert.equal(result.ok,true,'move rejected '+slot);
   assert.equal(result.rendered,true,'no new Phaser effect '+slot);
   assert.ok(name==='ice-beam'?result.forma==='chorro':result.forma?.startsWith('torre2_'),
    'new attack must use its authorized Phaser renderer: '+name);
   moveSmoke.forms.push(result);
   await tester.waitForTimeout(delay);
   await tester.screenshot({path:'test-evidence/torre2-'+name+'-active-battle.png',fullPage:true});
   await tester.waitForTimeout(850);
  }
  assert.equal(moveSmoke.forms.length,11);
  // Regress false contact: Shadow Ball must finish silently when the target is
  // outside range, without damage or an orphaned purple ring after expiration.
  const shadowMiss=await tester.evaluate(async()=>{
    const entry=[...document.querySelectorAll('script[src]')].find(x=>x.src.includes('/main.js'));
    const {shadowball}=await import(new URL('./torre2/next-batch-fx.js',entry.src).href);
    const e=window.__pt2Game.scene.getScene('combate');
    const l=e.luchadores[0],r=e.luchadores[1];
    l.x=200;l.y=200;r.x=570;r.y=200;
    l.ax=r.x;l.ay=r.y;r.hp=r.hpMax;
    const startHP=r.hp;
    const projectile=shadowball(l,{tipo:'GHOST',dano:11,alcance:120},{slot:'lmb'});
    let running=true;
    for(let i=0;i<50&&running;i++)running=projectile.update(.024);
    return {expired:!running,hpUnchanged:r.hp===startHP};
  });
  assert.equal(shadowMiss.expired,true,'Shadow Ball must self-dispose on miss');
  assert.equal(shadowMiss.hpUnchanged,true,'Shadow Ball must not cause ghost damage on miss');


  // Reset to a LIVE Phaser combat scene for later physics checks. The 11
  // preceding move previews may have finished the sparring match while their
  // particles were fading; standalone VFX collision tests must not call the
  // native particle emitter of a scene already shut down. This changes no
  // attack art or gameplay.
  await tester.evaluate(async()=>{
   const game=window.__pt2Game;
   const entry=[...document.querySelectorAll('script[src]')].find(x=>x.src.includes('/main.js'));
   const core=await import(new URL('./torre2/campaign-core.js',entry.src).href);
   const pool=await import(new URL('./torre2/move-pool.js',entry.src).href);
   const state=core.readCampaign();state.active=1;
   const duel=core.startBattle(state);
   duel.torre2Loadout=pool.resolveLoadout(state.team[1]);
   duel.mandos=['kbm','cpu'];
   game.scene.start('combate',duel);
  });
  await tester.waitForFunction(()=>{
   const e=window.__pt2Game.scene.getScene('combate');
   return e.scene.isActive()&&e.fase==='lucha'&&e.luchadores?.length===2;
  },null,{timeout:45000});
  // Actual 7-star Swift physics: fan trajectories; independent hits only on contact.
  // It is not enough to call "usarHabilidad": prove sequential multi-hit
  // against stationary target, absolute miss, and partial hit after dodge.
  const swiftCollision=await tester.evaluate(async()=>{
    const main=document.querySelector('script[src*="/main.js"]');
    const {swift}=await import(new URL('./torre2/next-batch-fx.js',main.src).href);
    const e=window.__pt2Game.scene.getScene('combate');
    const trials=[];
    const run=(movement)=>{
      const opponent={x:290,y:215,alto:38,ko:false,hp:100,
        hits:0,recibir(_l,d){this.hits++;this.hp-=d.dano;return 'golpe'}};
      const player={x:174,y:215,alto:38,ax:430,ay:215,rival:opponent,
        escena:e,t:0,animar(){},accion:null};
      const fx=swift(player,{tipo:'NORMAL',dano:10,alcance:260},{slot:'lmb'});
      let alive=true;
      for(let step=0;step<108&&alive;step++){
        if(movement==='dodge'&&step===20)opponent.y=360;
        if(movement==='miss'&&step===0)opponent.y=360;
        alive=fx.update(.016);
      }
      e.efectos=e.efectos.filter(item=>item!==fx);
      return {mode:movement,hits:opponent.hits,hp:opponent.hp,expired:!alive};
    };
    trials.push(run('still'));trials.push(run('miss'));trials.push(run('dodge'));
    return trials;
  });
  assert.ok(swiftCollision.every(t=>t.expired),'Swift projectiles must expire cleanly');
  assert.ok(swiftCollision[0].hits>=2,'Swift needs multiple separate successful star impacts');
  assert.ok(swiftCollision[0].hits<=7,'Swift must never hit more than its seven stars');
  assert.equal(swiftCollision[1].hits,0,'Swift must deal NO damage when all stars miss');
  assert.ok(swiftCollision[2].hits<swiftCollision[0].hits,
    'Dodging during flight must avoid later stars; no automatic full damage');
  assert.equal(swiftCollision[1].hp,100,'Swift miss must not reduce health');

  // Lovely Kiss: aiming is mandatory, status chance is applied only after
  // collision, and a blocked/missed projectile cannot put an opponent asleep.
  const kissPhysics=await tester.evaluate(async()=>{
    const main=document.querySelector('script[src*="/main.js"]');
    const {lovelykiss}=await import(new URL('./torre2/next-batch-fx.js',main.src).href);
    const e=window.__pt2Game.scene.getScene('combate');
    const originalRandom=Math.random,results=[];
    try{
      const run=(mode)=>{
        const enemy={x:285,y:mode==='miss'?375:215,alto:38,ko:false,
         statuses:[],ponerEstado(...args){this.statuses.push(args)}};
        const l={x:174,y:215,alto:38,ax:390,ay:215,rival:enemy,
         escena:e,t:0,animar(){},accion:null};
        const fx=lovelykiss(l,{tipo:'NORMAL',dano:0,alcance:225},{slot:'lmb'});
        let alive=true;
        for(let step=0;step<93&&alive;step++){
          if(mode==='dodge'&&step===12)enemy.y=375;
          alive=fx.update(.016);
        }
        fx.destroy();
        e.efectos=e.efectos.filter(item=>item!==fx);
        return{mode,applied:enemy.statuses.length,expired:!alive};
      };
      Math.random=()=>.12;
      results.push(run('hit'));results.push(run('miss'));
      results.push(run('dodge'));
      Math.random=()=>.96;
      results.push(run('rollfail'));
      return results;
    }finally{Math.random=originalRandom}
  });
  assert.deepEqual(kissPhysics.map(x=>x.applied),[1,0,0,0],
    'Lovely Kiss must require actual aimed contact AND pass accuracy check');
  assert.ok(kissPhysics.every(x=>x.expired),
    'Lovely Kiss must leave no lingering graphics after hit or miss');


  // Exercise actual Phaser Graphics: five pixels hearts visibly dispersed,
  // not a decorative array with no drawing or an automatic status hit.
  const kissHearts=await tester.evaluate(async()=>{
    const main=document.querySelector('script[src*="/main.js"]');
    const {lovelykiss}=await import(new URL('./torre2/next-batch-fx.js',main.src).href);
    const e=window.__pt2Game.scene.getScene('combate');
    const created=[],originalGraphics=e.add.graphics;
    let fx;
    try{
      e.add.graphics=function(...args){
        const graphic=originalGraphics.apply(this,args);
        created.push(graphic);return graphic;
      };
      const r={x:500,y:400,alto:38,ko:false,statuses:[],ponerEstado(...args){this.statuses.push(args)}};
      const l={x:174,y:215,alto:38,ax:420,ay:215,rival:r,escena:e,t:0,animar(){},accion:null};
      fx=lovelykiss(l,{tipo:'NORMAL',dano:0,alcance:225},{slot:'lmb'});
      const trail=created[1],rects=[],originalRect=trail.fillRect;
      trail.fillRect=function(x,y,w,h){rects.push({x,y});return originalRect.call(this,x,y,w,h)};
      fx.update(.016); // None of the hearts is drawn over the caster.
      const atLaunch=rects.length;
      fx.update(.404); // All five hearts are visible in their scattered paths.
      const perHeart=27; // Opaque pixels in the existing 7x6 heart stencil.
      const firstYs=Array.from({length:5},(_,i)=>rects[i*perHeart]?.y);
      return{atLaunch,drawnPixels:rects.length,
        hearts:rects.length/perHeart,firstYs,statuses:r.statuses.length};
    }finally{
      e.add.graphics=originalGraphics;
      if(fx){fx.destroy();e.efectos=e.efectos.filter(item=>item!==fx)}
    }
  });
  assert.equal(kissHearts.atLaunch,0,'Kiss hearts must not spawn over the caster');
  assert.equal(kissHearts.hearts,5,'Lovely Kiss must draw exactly five pixel hearts');
  assert.ok(Math.max(...kissHearts.firstYs)-Math.min(...kissHearts.firstYs)>=25,
    'Lovely Kiss hearts must scatter instead of forming a straight row');
  assert.equal(kissHearts.statuses,0,'Cosmetic hearts must not auto-apply sleep');

  // NEW pending approval: Hyper Fang, Guillotine, Petal Dance.
  // Renderer is isolated so native Poké Arena 2D moves stay byte-for-byte intact.
  const kantoSignaturePhysics=await tester.evaluate(async()=>{
    const main=document.querySelector('script[src*="/main.js"]');
    const moves=await import(new URL('./torre2/kanto-signatures-fx.js',main.src).href);
    const scene=window.__pt2Game.scene.getScene('combate');
    const saved=Math.random,results=[];
    const names=[
      {name:'hyperfang',distance:72,type:'NORMAL'},
      {name:'guillotine',distance:72,type:'NORMAL'},
      {name:'petaldance',distance:135,type:'GRASS'}
    ];
    try{
     for(const spec of names)for(const mode of ['hit','miss']){
      let spawned=0,cleared=0;
      const add=scene.add.graphics;
      scene.add.graphics=function(...args){
       spawned++;
       const g=add.apply(this,args),original=g.destroy;
       g.destroy=function(...a){cleared++;return original.apply(this,a)};
       return g;
      };
      const enemy={x:mode==='miss'&&spec.name==='petaldance'?174+600:174+spec.distance,
       y:mode==='miss'?370:215,
       hp:250,level:42,alto:38,ko:false,hits:0,status:[],
       recibir(_a,d){this.hits++;this.hp-=d.dano||0;return 'golpe'},
       ponerEstado(s){this.status.push(s)}};
      const player={x:174,y:215,alto:38,ax:480,ay:215,t:0,
       escena:scene,rival:enemy,ko:false,level:50,status:[],accion:null,
       animar(){},ponerEstado(s){this.status.push(s)}};
      Math.random=()=>.1;
      try{
       const effect=moves[spec.name](player,
        {dano:18,tipo:spec.type,alcance:spec.name==='petaldance'?230:84},{slot:'lmb'});
       let alive=true;
       for(let frame=0;frame<150&&alive;frame++)alive=effect.update(.016);
       effect.destroy();
       scene.efectos=scene.efectos.filter(x=>x!==effect);
       results.push({name:spec.name,mode,enemyHp:enemy.hp,hits:enemy.hits,
        statuses:player.status,cleared:spawned===cleared,done:!alive});
      }finally{scene.add.graphics=add}
     }
    }finally{Math.random=saved}
    return results;
  });
  assert.ok(kantoSignaturePhysics.every(x=>x.done&&x.cleared),
   'All 3 new WebGL attacks must terminate and clean up GPU Graphics');
  for(const name of ['hyperfang','guillotine','petaldance']){
   assert.ok(kantoSignaturePhysics.find(x=>x.name===name&&x.mode==='hit')?.hits>=1,
    name+' must hit with physical contact');
   assert.equal(kantoSignaturePhysics.find(x=>x.name===name&&x.mode==='miss')?.hits,0,
    name+' cannot hit a foe outside reach or actual collision');
  }
  assert.equal(kantoSignaturePhysics.find(x=>x.name==='hyperfang'&&x.mode==='hit')?.hits,1,
   'Hyper Fang is ONE bite, not multiple automatic damage ticks');
  assert.ok(kantoSignaturePhysics.find(x=>x.name==='guillotine'&&x.mode==='hit')?.enemyHp<0,
   'Guillotine hit can finish target, after chance and contact');
  assert.equal(kantoSignaturePhysics.find(x=>x.name==='petaldance'&&x.mode==='hit')?.hits,3,
   'Petal Dance has three independent impact windows');
  assert.ok(kantoSignaturePhysics.find(x=>x.name==='petaldance'&&x.mode==='hit')?.statuses.includes('confuso'),
   'Completed Petal Dance confuses its caster');
  // Note: a Guillotine high RNG outcome deliberately misses even on contact.
  const guillotineFail=await tester.evaluate(async()=>{
   const main=document.querySelector('script[src*="/main.js"]');
   const {guillotine}=await import(new URL('./torre2/kanto-signatures-fx.js',main.src).href);
   const scene=window.__pt2Game.scene.getScene('combate');
   const target={x:246,y:215,alto:38,hp:150,level:50,ko:false,
    hits:0,recibir(){this.hits++;return 'golpe'}};
   const attacker={x:174,y:215,alto:38,ax:480,ay:215,t:0,escena:scene,
    rival:target,ko:false,level:50,animar(){}};
   const saved=Math.random;Math.random=()=>.95;
   try{
    const fx=guillotine(attacker,{dano:20,alcance:84,tipo:'NORMAL'},{slot:'lmb'});
    for(let i=0;i<90;i++)if(fx.update(.016)===false)break;
    fx.destroy();scene.efectos=scene.efectos.filter(x=>x!==fx);
    return target.hits;
   }finally{Math.random=saved}
  });
  assert.equal(guillotineFail,0,'Guillotine does not hit 100% of close targets');

  // Newly implemented Phaser/WebGL attacks: real hit, miss, healing, RNG.
  // These new files never overwrite any native Arena 2D effect.
  const trioPhysics=await tester.evaluate(async()=>{
   const script=[...document.querySelectorAll('script[src]')]
    .find(x=>x.src.includes('/main.js'));
   const {absorb,xscissor,metronome}=await import(
    new URL('./torre2/next-specific-fx.js',script.src).href);
   const e=window.__pt2Game.scene.getScene('combate');
   const results={};
   function run(fn,kind,miss,aimAway=false){
    const enemy={x:kind==='xscissor'?246:309,y:miss?380:215,
     hp:160,alto:38,ko:false,hits:0,
     recibir(_l,data){this.hits++;this.hp-=data.dano||0;return 'golpe'}};
    const player={x:174,y:215,alto:38,ax:430,ay:aimAway?70:215,t:0,
     hp:40,hpMax:100,ko:false,escena:e,rival:enemy,accion:null,animar(){}};
    const effect=fn(player,{
     tipo:kind==='xscissor'?'BUG':'GRASS',dano:kind==='xscissor'?19:16,
     alcance:kind==='xscissor'?78:225
    },{slot:'lmb'});
    let alive=true;
    for(let k=0;k<135&&alive;k++)alive=effect.update(.016);
    effect.destroy();e.efectos=e.efectos.filter(x=>x!==effect);
    return {hp:enemy.hp,hits:enemy.hits,heal:player.hp,completed:!alive};
   }
   results.absorbHit=run(absorb,'absorb',false);
   results.absorbMiss=run(absorb,'absorb',true);
   results.absorbAimMiss=run(absorb,'absorb',false,true);
   results.xHit=run(xscissor,'xscissor',false);
   results.xMiss=run(xscissor,'xscissor',true);
   results.xAimMiss=run(xscissor,'xscissor',false,true);
   const cast= {x:174,y:215,alto:38,ax:450,ay:215,t:0,
    ko:false,escena:e,animar(){},accion:null};
   const drawn=[];
   const metFx=metronome(cast,{tipo:'NORMAL'},{slot:'lmb'},{
    torre2_payday(_p,h){drawn.push({id:h.id,forma:h.forma});}
   });
   let alive=true;
   for(let k=0;k<100&&alive;k++)alive=metFx.update(.016);
   metFx.destroy();e.efectos=e.efectos.filter(x=>x!==metFx);
   results.metronome={effects:drawn,completed:!alive};
   return results;
  });
  assert.ok(trioPhysics.absorbHit.hits===1&&trioPhysics.absorbHit.heal===48,
   'Absorb must hit once and heal 50% of actual 16 damage on returned particles');
  assert.ok(trioPhysics.absorbMiss.hits===0&&trioPhysics.absorbMiss.heal===40,
   'Absorb must not heal on a miss');
  assert.ok(trioPhysics.absorbAimMiss.hits===0&&trioPhysics.absorbAimMiss.heal===40,
   'Absorb can miss if the user aims away despite enemy being in range');
  assert.equal(trioPhysics.xHit.hits,1,'X-Scissor delivers exactly one actual melee contact');
  assert.equal(trioPhysics.xMiss.hits,0,'X-Scissor cannot hurt an off-axis foe');
  assert.equal(trioPhysics.xAimMiss.hits,0,'X-Scissor must obey the player aim');
  assert.equal(trioPhysics.metronome.effects.length,1,
   'Metronome must cast a real randomly selected move once');
  assert.equal(trioPhysics.metronome.effects[0].forma,'torre2_payday',
   'Metronome uses an actual move renderer, not an imitation');
  assert.ok(Object.entries(trioPhysics).every(([,result])=>result.completed),
   'All three attacks release their Phaser Graphics when completed');

  // New additive Mud-Slap / Seed Bomb / Super Fang use hand-drawn sprite
  // matrices, physical hit/miss and clear their graphics after battle.
  // Newly authored route moves: genuine aim/collision, two 30% status
  // rolls, rendering, renderer cleanup. Native Tackle is intentionally frozen.
  const earlyRoute=await tester.evaluate(async()=>{
   const moduleScript=[...document.querySelectorAll('script[src]')]
    .find(x=>x.src.includes('/main.js'));
   const {TORRE2_EARLY_ROUTE_FORMS}=await import(
    new URL('./torre2/early-route-fx.js',moduleScript.src).href);
   const results={};const oldRandom=Math.random;
   try{
    Math.random=()=>.01; // deterministic positive 30% status check
    for(const [id,forma,kind] of [
     ['gust','torre2_gust','FLYING'],
     ['poison-sting','torre2_poisonsting','POISON'],
     ['bite','torre2_bite','DARK']
    ])for(const mode of ['hit','aim-away','dodge','blocked','immune']){
     const drawings=[];
     const fake={efectos:[],add:{graphics(){
      const g={draws:0,deleted:false,setDepth(){return this},
       fillStyle(){return this},fillRect(){this.draws++;return this},
       clear(){return this},destroy(){this.deleted=true}};
      drawings.push(g);return g;
     }}};
     const enemy={x:id==='bite'?235:301,y:mode==='dodge'?350:215,
      hp:120,alto:36,ko:false,tipos:mode==='immune'?['POISON']:['NORMAL'],
      est:{},hits:0,status:[],
      recibir(_l,attack){
       if(mode==='blocked')return 'miss';
       this.hits++;this.hp-=attack.dano||0;
       if(attack.veneno)this.status.push('veneno');
       if(attack.aturde)this.status.push('aturde');
       return 'golpe';
      }};
     const user={x:174,y:215,alto:36,ko:false,est:{},t:0,
      ax:430,ay:mode==='aim-away'?60:215,rival:enemy,
      escena:fake,animar(){}};
     const attack=TORRE2_EARLY_ROUTE_FORMS[forma](user,{
      dano:id==='gust'?8:id==='poison-sting'?3:12,
      tipo:kind,alcance:id==='bite'?76:235
     },{slot:'lmb'});
     let active=true,frames=0;
     while(active&&frames++<110)active=attack.update(.016);
     attack.destroy();
     results[id+'-'+mode]={hits:enemy.hits,status:enemy.status,
      finished:!active,ink:drawings.reduce((n,g)=>n+g.draws,0),
      disposed:drawings.every(g=>g.deleted)};
    }
   }finally{Math.random=oldRandom}
   return results;
  });
  for(const id of ['gust','poison-sting','bite']){
   assert.equal(earlyRoute[id+'-hit'].hits,1,id+' hits only on actual contact');
   for(const mode of ['aim-away','dodge','blocked'])
    assert.equal(earlyRoute[id+'-'+mode].hits,0,
     id+' never hits when '+mode);
   for(const mode of ['hit','aim-away','dodge','blocked','immune']){
    assert.equal(earlyRoute[id+'-'+mode].finished,true,id+' effect must finish');
    assert.equal(earlyRoute[id+'-'+mode].disposed,true,id+' WebGL graphics must be released');
    assert.ok(earlyRoute[id+'-'+mode].ink>0,id+' renders real pixel matrices');
   }
  }
  assert.ok(earlyRoute['poison-sting-hit'].status.includes('veneno'),
   '30% poison check should apply only after a real damaging contact');
  assert.ok(!earlyRoute['poison-sting-immune'].status.includes('veneno'),
   'Poison Sting should not poison Poison immune defenders');
  assert.ok(earlyRoute['bite-hit'].status.includes('aturde'),
   'Bite can cause brief flinch after physical contact');
  assert.ok(!earlyRoute['bite-blocked'].status.includes('aturde'),
   'Blocked Bite cannot flinch a target');

  const adaptedCheck=await tester.evaluate(async()=>{
   const script=[...document.querySelectorAll('script[src]')]
    .find(x=>x.src.includes('/main.js'));
   const {TORRE2_ADAPTED_FORMS}=await import(
    new URL('./torre2/adapted-moves-fx.js',script.src).href);
   const results={};
   const randomBefore=Math.random;Math.random=()=>.05; // Reliable 90% Super Fang hit path.
   for(const [id,forma,type] of [
    ['mud-slap','torre2_mudslap','GROUND'],
    ['seed-bomb','torre2_seedbomb','GRASS'],
    ['super-fang','torre2_superfang','NORMAL']
   ])for(const mode of ['hit','aim-away','dodge','blocked']){
    const drawings=[];
    const fake={efectos:[],add:{graphics(){
      const g={count:0,max:0,deleted:false,setDepth(){return this},
       fillStyle(){return this},fillRect(){this.count++;this.max++;return this},
       clear(){this.count=0;return this},destroy(){this.deleted=true}};
      drawings.push(g);return g;
    }}};
    const foe={x:id==='super-fang'?244:301,y:mode==='dodge'?350:215,
     hp:111,alto:36,ko:false,est:{},invulnerable:mode==='blocked',
     tipos:['NORMAL'],hits:0,recibir(_p,v){
       if(mode==='blocked')return 'miss';
       this.hits++;this.hp-=v.dano||0;return 'golpe';
     }};
    const p={x:174,y:215,ax:430,ay:mode==='aim-away'?75:215,
     alto:36,ko:false,est:{},t:0,rival:foe,escena:fake,animar(){}};
    const fx=TORRE2_ADAPTED_FORMS[forma](p,{dano:16,tipo:type,
     alcance:id==='super-fang'?82:225},{slot:'lmb'});
    let active=true,frame=0;
    while(active&&frame++<140)active=fx.update(.016);
    fx.destroy();
    results[id+'-'+mode]={hits:foe.hits,hp:foe.hp,mudDebuff:foe.est.torre2MudAccuracy,finished:!active,
     drawn:drawings.reduce((n,g)=>n+g.max,0),
     disposed:drawings.every(g=>g.deleted)};
   }
   Math.random=randomBefore;
   return results;
  });
  for(const id of ['mud-slap','seed-bomb','super-fang']){
   const hit=adaptedCheck[id+'-hit'];
   assert.equal(hit.hits,1,id+' must hit at true physical contact only once');
   assert.ok(hit.drawn>20,id+' must render actual pixel rectangles, not invisible FX');
   for(const mode of ['aim-away','dodge','blocked']){
    const miss=adaptedCheck[id+'-'+mode];
    assert.equal(miss.hits,0,id+' must MISS if '+mode);
   }
   for(const mode of ['hit','aim-away','dodge','blocked']){
    const result=adaptedCheck[id+'-'+mode];
    assert.equal(result.finished,true,id+' VFX should terminate');
    assert.equal(result.disposed,true,id+' WebGL graphics must be cleaned');
   }
  }
  assert.equal(adaptedCheck['mud-slap-hit'].mudDebuff?.stacks,1,
   'Mud-Slap must apply an accuracy stage only after successful projectile hit');
  for(const mode of ['aim-away','dodge','blocked'])
   assert.equal(adaptedCheck['mud-slap-'+mode].mudDebuff,undefined,
    'Mud-Slap cannot blind without causing physical contact damage');
  assert.equal(adaptedCheck['super-fang-hit'].hp,56,
   'Super Fang must remove floor(111/2)=55 current HP, not a flat power value');

  // Projectile Clash regression: native/approved missiles retain their own
  // art, two new spells physically stop only on crossing *opposing* missiles.
  // This simulates the actual Phaser 'efectos.filter' lifecycle including
  // the next-tick scheduler required for visible 10-frame dissipation.
  const clashes=await tester.evaluate(async()=>{
   const main=document.querySelector('script[src*="/main.js"]');
   const {TORRE2_ADAPTED_FORMS}=await import(
    new URL('./torre2/adapted-moves-fx.js',main.src).href);
   const outcomes={};
   for(const scenario of ['native','mutual','ally','no-cross']){
    let t=0,particles=0,clashSprites=0,nativeStopped=false,foeHits=0;
    const objects=[],tasks=[];
    const scene={efectos:[],programar(seconds,fn){tasks.push({at:t+seconds,fn})},
     add:{graphics(){
      const g={pixels:0,deleted:false,setDepth(){return this},
       fillStyle(){return this},fillRect(){this.pixels++;particles++;return this},
       clear(){this.pixels=0;return this},destroy(){this.deleted=true}};
      objects.push(g);return g;
     }}};
    const owner=(x,ax,lado)=>({x,y:220,ax,ay:220,alto:36,lado,
     est:{},ko:false,hp:110,t:0,escena:scene,animar(){},
     recibir(_l,g){foeHits++;this.hp-=g.dano||0;return 'golpe'}});
    const left=owner(160,460,0),right=owner(335,-20,1);
    left.rival=right;right.rival=left;
    if(scenario==='no-cross')right.y=360;
    const start=()=>TORRE2_ADAPTED_FORMS.torre2_mudslap(
     left,{dano:4,tipo:'GROUND',alcance:240},{slot:'lmb'});
    if(['native','ally'].includes(scenario)){
     const native={dueno:scenario==='ally'?left:right,vivo:true,
      x:235,y:203,alt:0,h:{radio:9,tipo:'WATER'},
      terminar(){this.vivo=false;nativeStopped=true},
      // Native shots have finite range/lifetime; this mock must too,
      // including the allied (non-clashing) case.
      update(){return this.vivo&&t<.95}};
     scene.efectos.push(native);
    }
    const incoming=start();
    if(scenario==='mutual')TORRE2_ADAPTED_FORMS.torre2_seedbomb(
     right,{dano:16,tipo:'GRASS',alcance:240},{slot:'lmb'});
    for(let i=0;i<100;i++){
     t+=.016;left.t=right.t=t;
     const due=tasks.filter(x=>x.at<=t);
     for(const job of due)job.fn();
     for(let k=tasks.length-1;k>=0;k--)if(tasks[k].at<=t)tasks.splice(k,1);
     scene.efectos=scene.efectos.filter(o=>o.update?.(.016)!==false);
    }
    clashSprites=objects.length-(scenario==='mutual'?4:2);
    outcomes[scenario]={nativeStopped,foeHits,
     clashSprites,allFreed:objects.every(x=>x.deleted),
     noLiveEffects:scene.efectos.length===0,
     clashDisabled:incoming.clashBody.live===false,particles};
   }
   return outcomes;
  });
  assert.equal(clashes.native.nativeStopped,true,'Mud-Slap must Clash with an enemy native projectile');
  assert.equal(clashes.native.clashSprites,1,'Native clash triggers exactly one pixel dissipation');
  assert.equal(clashes.mutual.clashSprites,1,'Seed Bomb versus Mud-Slap triggers exactly one impact');
  assert.equal(clashes.mutual.foeHits,0,'Clashed projectiles cannot deal damage');
  assert.equal(clashes.ally.nativeStopped,false,'Do not collide with a friendly projectile');
  assert.equal(clashes.ally.clashSprites,0,'Friendly crossing must not render CLASH');
  assert.equal(clashes['no-cross'].clashSprites,0,'No collision must not make a CLASH effect');
  for(const [label,state] of Object.entries(clashes)){
   assert.equal(state.allFreed,true,label+' must release all WebGL graphics');
   assert.equal(state.noLiveEffects,true,label+' must clear scene effects');
  }

  // Three newly approved species-characteristic moves: real collision regression.
  const newSpeciesAttacks=await tester.evaluate(async()=>{
    const main=document.querySelector('script[src*="/main.js"]');
    const moves=await import(new URL('./torre2/species-fx.js',main.src).href);
    const e=window.__pt2Game.scene.getScene('combate'),old=Math.random,results=[];
    try{
      for(const cfg of [
       {key:'sing',dist:116,tipo:'NORMAL'},
       {key:'crabhammer',dist:63,tipo:'WATER'},
       {key:'smog',dist:116,tipo:'POISON'}
      ])for(const miss of [false,true]){
       const enemy={x:174+cfg.dist,y:miss?380:215,alto:38,ko:false,hp:150,
        hits:0,status:[],recibir(_l,d){this.hits++;this.hp-=d.dano||0;return 'golpe'},
        ponerEstado(name){this.status.push(name)}};
       const player={x:174,y:215,alto:38,ax:440,ay:215,escena:e,
        rival:enemy,t:0,animar(){},accion:null};
       Math.random=()=>.1;
       const fx=moves[cfg.key](player,{tipo:cfg.tipo,dano:12,alcance:250},{slot:'lmb'});
       let active=true;
       for(let frame=0;frame<140&&active;frame++)active=fx.update(.016);
       fx.destroy();e.efectos=e.efectos.filter(x=>x!==fx);
       results.push({key:cfg.key,miss,hits:enemy.hits,status:enemy.status,cleaned:!active});
      }
      return results;
    }finally{Math.random=old}
  });
  assert.ok(newSpeciesAttacks.every(x=>x.cleaned),'All 3 new species VFX free graphics');
  for(const key of ['sing','crabhammer','smog']){
   assert.ok(newSpeciesAttacks.find(x=>x.key===key&&!x.miss)?.hits>0,
    key+' should land only on actual trajectory');
   assert.equal(newSpeciesAttacks.find(x=>x.key===key&&x.miss)?.hits,0,
    key+' should MISS when opponent dodges');
  }
  assert.ok(newSpeciesAttacks.find(x=>x.key==='sing'&&!x.miss)?.status.includes('aturdido'),
   'Sing must only put rival to sleep if note hits and accuracy succeeds');
  assert.ok(newSpeciesAttacks.find(x=>x.key==='smog'&&!x.miss)?.status.includes('veneno'),
   'Smog only poisons after confirmed contact');
  assert.ok(newSpeciesAttacks.find(x=>x.key==='smog'&&!x.miss)?.hits>1,
   'Smog bubbles must hit individually rather than triggering one global impact');
  assert.equal(newSpeciesAttacks.find(x=>x.key==='smog'&&x.miss)?.hits,0,
   'No Smog bubble deals damage if all travel paths miss');
  assert.equal(newSpeciesAttacks.find(x=>x.key==='smog'&&!x.miss)?.status.filter(s=>s==='veneno').length,1,
   'Smog poison proc must not be rolled on every separate bubble');

  // Collision regression for the four NEW moves only.
  // Existing Pokémon Arena 2D effects are deliberately never touched.
  const megaLogic=await tester.evaluate(async()=>{
    const main=document.querySelector('script[src*="/main.js"]');
    const fx=await import(new URL('./torre2/mega-patch-fx.js',main.src).href);
    const e=window.__pt2Game.scene.getScene('combate');
    const run=(func,mode)=>{
      const enemy={x:290,y:mode==='miss'?380:215,alto:38,ko:false,hp:200,
       tipos:['NORMAL'],hits:0,statuses:[],
       recibir(_l,arg){this.hits++;this.hp-=arg.dano||0;return 'golpe'},
       ponerEstado(name){this.statuses.push(name)},escarchar(){this.statuses.push('frost')}};
      const player={x:174,y:215,alto:38,ax:420,ay:215,escena:e,
       rival:enemy,t:0,ko:false,hp:40,hpMax:200,animar(){},accion:null};
      const effect=func(player,{dano:12,alcance:260,tipo:'ROCK'},{slot:'lmb'});
      let active=true;
      for(let i=0;i<130&&active;i++)active=effect.update(.016);
      effect.destroy();e.efectos=e.efectos.filter(x=>x!==effect);
      return{hp:enemy.hp,hits:enemy.hits,statuses:enemy.statuses,ownHp:player.hp,done:!active};
    };
    const saved=Math.random;
    try{
      Math.random=()=>.8; // Rock Blast seven stones, no Ice Beam freeze; confusion passes at 85%.
      return{iceHit:run(fx.icebeam,'hit'),iceMiss:run(fx.icebeam,'miss'),
       rockHit:run(fx.rockblast,'hit'),rockMiss:run(fx.rockblast,'miss'),
       confuseHit:run(fx.confuseray,'hit'),confuseMiss:run(fx.confuseray,'miss'),
       heal:run(fx.softboiled,'miss')};
    }finally{Math.random=saved}
  });
  for(const value of Object.values(megaLogic))
   assert.equal(value.done,true,'new Phaser effect must clean up after completing');
  assert.ok(megaLogic.iceHit.hp<200&&megaLogic.iceMiss.hp===200,'Ice Beam must require physical collision');
  assert.ok(megaLogic.rockHit.hits>=2&&megaLogic.rockHit.hits<=7,
   'Rock Blast hits separately when multiple rocks reach the enemy');
  assert.equal(megaLogic.rockMiss.hits,0,'Rock Blast misses if the enemy dodges');
  assert.deepEqual(megaLogic.confuseHit.statuses,['confuso'],
   'Confuse Ray applies status once on contact');
  assert.deepEqual(megaLogic.confuseMiss.statuses,[],
   'Confuse Ray misses cleanly without auto applying status');
  assert.equal(megaLogic.heal.ownHp,100,'Soft-Boiled heals 30% max HP, without damaging rival');

  // Chance and casting regressions: moving projectiles cannot guarantee status,
  // self-healing must wait for the pixel egg to crack, and 7-stone blasts stay finite.
  const megaV2=await tester.evaluate(async()=>{
    const main=document.querySelector('script[src*="/main.js"]');
    const fx=await import(new URL('./torre2/mega-patch-fx.js',main.src).href);
    const e=window.__pt2Game.scene.getScene('combate');
    const savedRandom=Math.random;
    const run=(attack,seed,earlySteps=0)=>{
      Math.random=()=>seed;
      const enemy={x:290,y:215,alto:38,ko:false,hp:200,tipos:['NORMAL'],
       hits:0,statuses:[],recibir(_l,arg){this.hits++;this.hp-=arg.dano||0;return 'golpe'},
       ponerEstado(name){this.statuses.push(name)},escarchar(){this.statuses.push('frost')}};
      const player={x:174,y:215,alto:38,ax:420,ay:215,rival:enemy,escena:e,
       t:0,ko:false,hp:40,hpMax:200,animar(){},accion:null};
      const effect=attack(player,{dano:12,alcance:260,tipo:'GHOST'},{slot:'lmb'});
      let alive=true,earlyHp=null,earlyStatus=null;
      for(let i=0;i<135&&alive;i++){
       if(i===earlySteps){earlyHp=player.hp;earlyStatus=enemy.statuses.length}
       alive=effect.update(.016);
      }
      effect.destroy();e.efectos=e.efectos.filter(x=>x!==effect);
      return{hp:player.hp,earlyHp,earlyStatus,hits:enemy.hits,statuses:enemy.statuses,expired:!alive};
    };
    try{
     return {confuseFailed:run(fx.confuseray,.98,10),
      rockSix:run(fx.rockblast,.1,10),rockSeven:run(fx.rockblast,.8,10),
      delayedHeal:run(fx.softboiled,.2,40)};
    }finally{Math.random=savedRandom}
  });
  assert.deepEqual(megaV2.confuseFailed.statuses,[],
   'Confuse Ray can physically connect yet fail its status chance');
  assert.ok(megaV2.confuseFailed.hits>=1,
   'Confuse Ray resistance trial must still hit the target');
  assert.ok(megaV2.rockSix.hits<=6&&megaV2.rockSeven.hits<=7,
   'Rock Blast must have only six or seven independently resolved projectiles');
  assert.ok(megaV2.rockSix.hits>=2&&megaV2.rockSeven.hits>=2,
   'Both stone counts must allow multiple real collisions');
  assert.equal(megaV2.delayedHeal.earlyHp,40,
   'Soft-Boiled may not heal before the egg breaks');
  assert.equal(megaV2.delayedHeal.hp,100,
   'Soft-Boiled heals only 30% of maximum HP after its animation');
  assert.ok(Object.values(megaV2).every(x=>x.expired),
   'All four v2 regression trials must clean their Phaser graphics');

  // V3 visual/physics contract. Capture actual Phaser draw calls: Ice Beam
  // must form one LONG connected beam, never a single tiny glowing sphere.
  const specialV3=await tester.evaluate(async()=>{
    const main=document.querySelector('script[src*="/main.js"]');
    const {icebeam,confuseray,softboiled}=await import(
     new URL('./torre2/mega-patch-fx.js',main.src).href);
    const e=window.__pt2Game.scene.getScene('combate');
    const originalGraphics=e.add.graphics;
    const gfx=[];let oldRandom=Math.random;
    try{
     e.add.graphics=function(...args){
      const g=originalGraphics.apply(this,args),originalFill=g.fillPoints;
      g._v3Polygons=[];
      g.fillPoints=function(points,close){
       this._v3Polygons.push(points.map(pt=>({x:pt.x,y:pt.y})));
       return originalFill.call(this,points,close);
      };
      gfx.push(g);return g;
     };
     const setup=(y=375)=>({
      player:{x:174,y:215,alto:38,ax:450,ay:215,escena:e,t:0,
       ko:false,hp:40,hpMax:200,animar(){},accion:null},
      enemy:{x:292,y,alto:38,ko:false,hp:200,tipos:['NORMAL'],
       statuses:[],hits:0,recibir(){this.hits++;return 'golpe'},
       ponerEstado(name){this.statuses.push(name)},escarchar(){this.statuses.push('frost')}}
     });
     Math.random=()=>.95;
     const beam=setup(),beamFx=icebeam(beam.player,{dano:12,alcance:260,tipo:'ICE'},{slot:'lmb'});
     beam.player.rival=beam.enemy;
     for(let i=0;i<25;i++)beamFx.update(.016);
     const beamPolys=gfx[0]._v3Polygons;
     const longRibbon=beamPolys.some(poly=>poly.length>=10&&
      Math.max(...poly.map(p=>p.x))-Math.min(...poly.map(p=>p.x))>70&&
      Math.max(...poly.map(p=>p.y))-Math.min(...poly.map(p=>p.y))<25);
     for(let i=25;i<88;i++)if(beamFx.update(.016)===false)break;
     beamFx.destroy();e.efectos=e.efectos.filter(x=>x!==beamFx);
     const conf=setup(215);conf.player.rival=conf.enemy;
     const confFx=confuseray(conf.player,{dano:0,alcance:230,tipo:'GHOST'},{slot:'lmb'});
     for(let i=0;i<95;i++)if(confFx.update(.016)===false)break;
     confFx.destroy();e.efectos=e.efectos.filter(x=>x!==confFx);
     const egg=setup();egg.player.rival=egg.enemy;
     const eggFx=softboiled(egg.player,{dano:0,alcance:0,tipo:'NORMAL'},{slot:'lmb'});
     let before=0,after=0;
     for(let i=0;i<90;i++){
      if(i===40)before=egg.player.hp;
      if(eggFx.update(.016)===false)break;
     }
     after=egg.player.hp;
     eggFx.destroy();e.efectos=e.efectos.filter(x=>x!==eggFx);
     return {longRibbon,iceMissHits:beam.enemy.hits,
      confuseContact:conf.enemy.hits,confuseStatus:conf.enemy.statuses.length,
      healBefore:before,healAfter:after};
    }finally{e.add.graphics=originalGraphics;Math.random=oldRandom}
  });
  assert.equal(specialV3.longRibbon,true,
    'Ice Beam needs a long connected icy laser, not a spherical projectile');
  assert.equal(specialV3.iceMissHits,0,'Ice Beam must miss off-axis targets');
  assert.ok(specialV3.confuseContact>=1,'Confuse Ray needs real ray collision');
  assert.equal(specialV3.confuseStatus,0,'Confuse Ray must not guarantee confusion');
  assert.equal(specialV3.healBefore,40,'Egg animation must precede healing');
  assert.equal(specialV3.healAfter,100,'Soft-Boiled must heal only 30 percent');

  // V5: Player can steer the channel mid-flight. Ice Beam is not a
  // stationary one-shot beam; first Confuse Ray palette is now yellow.
  const steeringV5=await tester.evaluate(async()=>{
    const main=document.querySelector('script[src*="/main.js"]');
    const {icebeam,confuseray}=await import(
      new URL('./torre2/mega-patch-fx.js',main.src).href);
    const e=window.__pt2Game.scene.getScene('combate');
    const add=e.add.graphics,origRandom=Math.random,graphics=[];
    let iceFx,confuseFx;
    try{
     e.add.graphics=function(...args){
      const g=add.apply(this,args),base=g.fillPoints,baseClear=g.clear;
      g._v5Faces=[];
      // Phaser Graphics clears each rendered frame; reset our probe too.
      // Otherwise the test reads the *launch* shape on every later frame.
      g.clear=function(...params){
       this._v5Faces=[];
       return baseClear.apply(this,params);
      };
      g.fillPoints=function(points,closed){
       g._v5Faces.push(points.map(p=>({x:p.x,y:p.y})));
       return base.call(this,points,closed);
      };
      graphics.push(g);return g;
     };
     Math.random=()=>.2;
     const foe={x:350,y:380,alto:38,ko:false,hp:200,tipos:['NORMAL'],
      hits:0,statuses:[],recibir(){this.hits++;return 'golpe'},
      ponerEstado(name){this.statuses.push(name)},escarchar(){}};
     const p={x:174,y:215,alto:38,ax:420,ay:215,t:0,ko:false,
      rival:foe,escena:e,animar(){},accion:null};
     iceFx=icebeam(p,{dano:10,alcance:260,tipo:'ICE'}, {slot:'lmb'});
     for(let i=0;i<27;i++)iceFx.update(.016);
     const firstFace=graphics[0]._v5Faces[0],straightY=firstFace?.[Math.floor(firstFace.length/4)]?.y;
     // Change the cast input DURING beam firing, as in Aura Storm.
     p.ay=415;
     for(let i=0;i<32;i++)iceFx.update(.016);
     const laterFace=graphics[0]._v5Faces[0],steeredY=laterFace?.[Math.floor(laterFace.length/4)]?.y;
     const aliveAfterTurn=iceFx.update(.016);
     for(let i=0;i<110;i++)if(!iceFx.update(.016))break;
     iceFx.destroy();e.efectos=e.efectos.filter(x=>x!==iceFx);
     // Drawing must use the historical first-version 3-light stencil.
     graphics.length=0;
     const victim={x:380,y:390,alto:38,ko:false,statuses:[],
      recibir(){return 'golpe'},ponerEstado(name){this.statuses.push(name)}};
     const shooter={x:174,y:215,alto:38,ax:420,ay:215,t:0,
      rival:victim,escena:e,animar(){},accion:null};
     confuseFx=confuseray(shooter,{dano:0,alcance:230,tipo:'GHOST'},{slot:'lmb'});
     const ink=graphics[0],colors=[],fills=ink.fillStyle;
     ink.fillStyle=function(color,alpha){
      colors.push(color);return fills.call(this,color,alpha);
     };
     confuseFx.update(.22);
     const colorWasYellow=colors.some(c=>[0xe1a31b,0xffe47a,0xc98612].includes(c));
     const blockedPurple=!colors.some(c=>[0xa17eec,0xf3ccfa,0x7754b8].includes(c));
     confuseFx.destroy();e.efectos=e.efectos.filter(x=>x!==confuseFx);
     return{straightY,steeredY,aliveAfterTurn,enemyHits:foe.hits,
      colorWasYellow,blockedPurple};
    }finally{
     e.add.graphics=add;Math.random=origRandom;
     if(iceFx)iceFx.destroy();
     if(confuseFx)confuseFx.destroy();
    }
  });
  assert.ok(steeringV5.aliveAfterTurn,
   'Ice Beam must keep channeling while steering, not stop at first contact');
  assert.ok(Number.isFinite(steeringV5.straightY)&&Number.isFinite(steeringV5.steeredY) &&
   steeringV5.steeredY>steeringV5.straightY+20,
   'Ice Beam must rotate with new aim while being fired, like Aura Storm');
  assert.equal(steeringV5.enemyHits,0,
   'Ice Beam must not automatically hit an enemy outside the beam trajectory');
  assert.equal(steeringV5.colorWasYellow,true,
   'Historical Confuse Ray sparks must be yellow');
  assert.equal(steeringV5.blockedPurple,true,
   'Historical purple Confuse Ray palette must not remain');

  await tester.screenshot({path:'test-evidence/torre2-signature-fx-battle.png',fullPage:true});
  assert.deepEqual(newErrors,[],'Mewtwo summary + seven available custom Phaser moves must not crash');
  await tester.close();
  const summary={url:page.url(),title:await page.title(),canvas,errors:errors.slice(0,20),
   notFound:notFound.slice(0,40),mobile:{...mobileInfo,bootMs:mobileBootMs,errors:mobileErrors,missing:mobileMissing.slice(0,20)},source:'pokearena2d.com',offline:{initial:true,combat:combatScene,aiRegression,trainerAfterVictory:offlineResult.trainer},mewtwo:{summary:summaryState,ui:uiCheck,moves:moveSmoke,swiftCollision,kissPhysics,megaLogic},result:'Original Phaser + solo Kanto verified'};
  fs.writeFileSync('test-evidence/pokearena-original-source-smoke.json',JSON.stringify(summary,null,2));
  console.log(JSON.stringify(summary,null,2));
 }finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
