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
 const errors=[],notFound=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('response',r=>{if(r.status()>=400)notFound.push({status:r.status(),url:r.url()})});
 try{
  const response=await page.goto('http://127.0.0.1:4274/arena2d/?original=1',{waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(response.status(),200);
  assert.equal(await page.title(),'Pokémon Torre','The title must use the approved new game name');
  await page.waitForFunction(()=>!!window.Phaser&&!!document.querySelector('#juego canvas'),null,{timeout:35000});
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
  await offline.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')
    .children.list.some(o=>typeof o.text==='string'&&o.text.toUpperCase().includes('PEWTER')),
    null,{timeout:15000});
  await offline.screenshot({path:'test-evidence/pokemon-torre-2-offline-kanto-menu.png',fullPage:true});
  const newMap=await offline.evaluate(async()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    const script=[...document.scripts].find(x=>x.src?.includes('/main.js'));
    const core=await import(new URL('./torre2/campaign-core.js',script.src).href);
    const state=core.readCampaign();
    const labels=()=>c.children.list.filter(x=>typeof x.text==='string').map(x=>x.text).join(' | ');
    const map=labels();
    const portraits=c.children.list.filter(o=>o.type==='Image'&&
      String(o.texture?.key||'').startsWith('torre2-portrait-')).length;
    c.grassScreen(state);const grass=labels();
    c.centerScreen(state);const center=labels();
    c.martScreen(state);const mart=labels();
    c.bagScreen(state);const bag=labels();
    c.scene.restart();
    return {map,grass,center,mart,bag,portraits};
  });
  assert.ok(newMap.map.includes('INICIAR BATALHA'),'Large readable start button must be visible');
   assert.ok(newMap.map.includes('MINHA EQUIPE'),'My team must be clearly labeled');
   assert.ok(newMap.map.includes('BOLSA'),'Visible backpack shortcut must exist');
   assert.ok(newMap.portraits>=1,'Campaign should show captured PMD team portraits');
  assert.ok(newMap.map.includes('INSÍGNIAS'),'Map shows progress');
  assert.ok(newMap.grass.includes('VIRIDIAN'),'Grass is regional, not random Kanto');
  assert.ok(newMap.center.includes('CURAR'),'Pokémon Center is interactive');
  assert.ok(newMap.mart.includes('POKÉ MART'),'Mart offers items');
  assert.ok(newMap.bag.includes('POÇÃO'),'Bag has potions and TM UI');
  await offline.screenshot({path:'test-evidence/torre2-kanto-path-map.png',fullPage:true});

  await offline.evaluate(async()=>{
    const entry=[...document.querySelectorAll('script[src]')].find(x=>x.src.includes('/main.js'));
    const core=await import(new URL('./torre2/campaign-core.js',entry.src).href);
    const s=core.readCampaign();
    window.__pt2Game.scene.getScene('campanha').scene.start('combate',core.startBattle(s));
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
   scene.summaryFilter='GROUND';
   scene.showSummary(state,1,0,0);
   if(!labels().some(x=>x.includes('FILTRO: GROUND')))throw Error('GROUND filter label missing');
   if(!labels().some(x=>x.includes('Bonemerang')))throw Error('Ground attack filtered out');
   scene.summaryFilter='ALL';scene.summarySearch='PAY';
   scene.showSummary(state,1,0,0);
   if(!labels().some(x=>x.includes('Pay Day')))throw Error('Move search not working');
   scene.summarySearch='';scene.showSummary(state,1,0,0);
   return {...root,typePicker:true,typeFiltering:true,searchFiltering:true};
  });
  assert.equal(uiCheck.typePicker,true);
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
  const adaptedCheck=await tester.evaluate(async()=>{
   const script=[...document.querySelectorAll('script[src]')]
    .find(x=>x.src.includes('/main.js'));
   const {TORRE2_ADAPTED_FORMS}=await import(
    new URL('./torre2/adapted-moves-fx.js',script.src).href);
   const results={};
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
    results[id+'-'+mode]={hits:foe.hits,hp:foe.hp,finished:!active,
     drawn:drawings.reduce((n,g)=>n+g.max,0),
     disposed:drawings.every(g=>g.deleted)};
   }
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
  assert.equal(adaptedCheck['super-fang-hit'].hp,56,
   'Super Fang must remove floor(111/2)=55 current HP, not a flat power value');

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
