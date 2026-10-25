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
 await new Promise(r=>server.listen(4275,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:4275/arena2d/');
 await page.waitForFunction(()=>window.__pt2Started&&window.__pt2Game?.scene.isActive('titulo'),null,{timeout:45000});
 await page.evaluate(async()=>{
  const src=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
  window.core=await import(new URL('./torre2/campaign-core.js',src));
  core.saveCampaign(core.createCampaign('bulbasaur'));
  window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
 });
 await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'));
 const battle=async(wild=false,full=false)=>{
  await page.evaluate(({wild,full})=>{
   const s=core.readCampaign();s.team.forEach(m=>m.hp=100);s.inventory.pokeball=15;
   if(full)while(s.team.length<6)s.team.push({...s.team[0],uid:'test-'+s.team.length});
   core.saveCampaign(s);
   if(wild){s.pendingWild=null;core.startWildEncounter(s,()=>0);}
   window.__pt2Game.scene.getScene('campanha').enterBattle(s,wild);
  },{wild,full});
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('combate')&&window.__pt2Game.scene.getScene('combate').__torre2PartyInstalled,null,{timeout:20000});
  await page.evaluate(()=>{const b=window.__pt2Game.scene.getScene('combate');b.luchadores.forEach(a=>a.inmortal=true);});
  await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').fase==='lucha',null,{timeout:12000});
 };
 await battle();
 for(let i=0;i<5;i++){
  await page.evaluate(i=>{
   const b=window.__pt2Game.scene.getScene('combate');b.__testBallTrace=[];b.__torre2BeamDebug=null;
   const collect=()=>{
    const d=b.__torre2BeamDebug;if(!d||d.side!==0||b.__testBallTrace.some(x=>x.phase===d.phase))return;
    const a=b.luchadores[0],g=b.children.list.find(o=>o.__torre2BallWorld);
    const offset=((a.manif.head??-16)+(a.manif.feet??5))/2;
    b.__testBallTrace.push({phase:d.phase,visible:d.visible,spriteCamera:a.spr.cameraFilter,beamCamera:g?.cameraFilter,
     error:Math.hypot(a.spr.x-d.to.x,a.spr.y+offset*a.spr.scaleY-d.to.y)});
   };
   b.__testBallCollect=collect;b.game.events.on('poststep',collect);
   b.__torre2SideParty.slots[i%2?0:1].emit('pointerdown');
  },i);
  await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').__testBallTrace.some(x=>x.phase==='absorb'));
  if(i===0)await page.screenshot({path:'test-evidence/ball-recall.png'});
  await page.waitForFunction(()=>!window.__pt2Game.scene.getScene('combate').__torre2Changing);
  const trace=await page.evaluate(()=>{const b=window.__pt2Game.scene.getScene('combate');b.game.events.off('poststep',b.__testBallCollect);return b.__testBallTrace});
  const alignment=trace.find(x=>x.phase==='absorb');
  assert.equal(alignment.spriteCamera,alignment.beamCamera,'Beam and sprite use the same world camera');
  assert.ok(alignment.error<2,'Beam endpoint touches the rendered body');
  assert.equal(trace.find(x=>x.phase==='throw')?.visible,false,'Incoming body stays hidden during throw');
  assert.ok(trace.some(x=>x.phase==='release'),'Native release phase was rendered');
  if(i===0)await page.screenshot({path:'test-evidence/ball-release.png'});
  assert.equal(await page.evaluate(()=>window.__pt2Game.scene.getScene('combate').luchadores[0].sombra.visible),true,'Replacement restores its own ground shadow');
  const identity=await page.evaluate(()=>{const b=window.__pt2Game.scene.getScene('combate'),a=b.luchadores[0],h=b.hud.lados[0];return {name:a.nombre,hudName:h.identidad[0].text,dex:a.dex,portrait:h.retrato.texture.key}});
  assert.equal(identity.hudName,identity.name,'HUD name follows the incoming Pokemon');
  assert.equal(identity.portrait,'retrato-'+identity.dex,'HUD portrait follows the incoming Pokemon');
  console.log('swap',i+1);
 }
 await page.evaluate(()=>window.__pt2Game.scene.getScene('combate').scene.start('campanha'));
 await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'));
 await battle(true,true);
 const throwBall=async(mode)=>{
  await page.evaluate(mode=>{
   const b=window.__pt2Game.scene.getScene('combate');b.__torre2CaptureRandom=()=>mode==='caught'?0:.999999;
   const zone=(x,y)=>b.children.list.find(o=>o.type==='Zone'&&Math.abs(o.x-x)<2&&Math.abs(o.y-y)<2&&o.input?.enabled);
   zone(470,61).emit('pointerdown');
   const assertNoManualAim = !zone(522,184);
   if(!assertNoManualAim)throw Error('Manual capture aim must not exist');

   zone(316,186).emit('pointerdown');zone(316,186)?.emit('pointerdown');
  },mode);
 };
 await throwBall('breakout');
 await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').__torre2CaptureDebug?.state==='ABSORB');
 await page.screenshot({path:'test-evidence/ball-capture-absorb.png'});
 await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').__torre2CaptureDebug?.state==='RESUME',null,{timeout:15000});
 assert.equal(await page.evaluate(()=>core.readCampaign().inventory.pokeball),14);
 // Re-enter for a successful capture into a full party.
 await page.evaluate(()=>window.__pt2Game.scene.getScene('combate').scene.start('campanha'));
 await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'));
 await battle(true,true);
 await page.evaluate(()=>{const b=window.__pt2Game.scene.getScene('combate');b.__torre2CaptureRandom=()=>0;const z=(x,y)=>b.children.list.find(o=>o.type==='Zone'&&Math.abs(o.x-x)<2&&Math.abs(o.y-y)<2&&o.input?.enabled);z(470,61).emit('pointerdown');z(316,186).emit('pointerdown');});
 await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').__torre2CaptureDebug?.state==='CAUGHT',null,{timeout:15000});
 await page.screenshot({path:'test-evidence/ball-gotcha.png'});
 assert.equal(await page.evaluate(()=>core.readCampaign().box.length),1);
 assert.equal(await page.evaluate(()=>core.readCampaign().inventory.pokeball),14);
 await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'));
 await page.reload();
 await page.waitForFunction(()=>window.__pt2Game);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('pokemon-torre-2-kanto-campaign-v1')).box.length),1);
 await page.setViewportSize({width:390,height:844});
 await page.waitForFunction(()=>window.__pt2Started&&window.__pt2Game?.scene.isActive('titulo'));
 await page.evaluate(async()=>{
  const src=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
  window.core=await import(new URL('./torre2/campaign-core.js',src));
  window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
 });
 await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'));
 await battle();
 await page.evaluate(()=>{const b=window.__pt2Game.scene.getScene('combate');b.__torre2SideParty.slots[b.datos.torre2.party.playerIndex===0?1:0].emit('pointerdown');});
 await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').__torre2BeamDebug?.phase==='release');
 await page.screenshot({path:'test-evidence/ball-release-mobile.png'});
 await page.waitForFunction(()=>!window.__pt2Game.scene.getScene('combate').__torre2Changing);
 const metrics=await page.evaluate(()=>({fps:window.__pt2Game.loop.actualFps,renderer:window.__pt2Game.renderer.type,
  frameErrors:window.__pt2Game.scene.getScene('combate').erroresFotograma||0}));
 assert.equal(metrics.frameErrors,0);
 fs.writeFileSync('test-evidence/ball-metrics.json',JSON.stringify(metrics));
 console.log('PASS: 5 swaps, hidden throw, breakout, automatic target, caught full party/PC, single consumption, reload, mobile',metrics,errors);
 assert.deepEqual(errors,[]);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
