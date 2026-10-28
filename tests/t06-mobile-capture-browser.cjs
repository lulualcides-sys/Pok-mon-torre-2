'use strict';
// T06 regression: real mobile touchscreen Pokeball controls, not synthetic
// Zone.emit calls. Encounter selected by native grass UI, capture RNG is a
// deterministic test fixture; no wins, items, levels or HP are injected.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const fsp=require('node:fs/promises');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/', 'http://127.0.0.1');
 const file=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden');}
 try{const data=await fsp.readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(data);}
 catch{res.writeHead(404);res.end('missing');}
});
const report={scope:'T06 native mobile Pokeball HUD, breakout, GOTCHA, save/reload',
 viewport:'854x480 with hasTouch/isMobile',fixture:'Only catch RNG and immortal actors; no automatic win or reward'};
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(resolve=>server.listen(4389,'127.0.0.1',resolve));
 const browser=await chromium.launch({
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']
 });
 try{
  const page=await browser.newPage({viewport:{width:854,height:480},hasTouch:true,isMobile:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const tap=async(x,y)=>{
   const point=await page.evaluate(([x,y])=>{
    const canvas=document.querySelector('#juego canvas')||document.querySelector('canvas');
    if(!canvas)throw Error('Phaser canvas missing');
    const box=canvas.getBoundingClientRect();
    return {x:box.left+x*box.width/640,y:box.top+y*box.height/360};
   },[x,y]);
   assert.ok(point.x>=0&&point.x<=854&&point.y>=0&&point.y<=480,
    'Touch control must remain visible in mobile landscape');
   await page.touchscreen.tap(point.x,point.y);
  };
  await page.goto('http://127.0.0.1:4389/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   window.t06=await import(new URL('./torre2/campaign-core.js',src));
   const st=t06.createCampaign('bulbasaur');
   t06.saveCampaign(st);
   t06.storePokemon(st,1); // Mewtwo remains in PC, never deleted.
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'),null,{timeout:60000});
  await page.evaluate(()=>{
   window.__pt2Game.scene.getScene('campanha').grassScreen(t06.readCampaign());
  });
  await page.evaluate(()=>new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok))));
  await tap(465,292); // Actual tall-grass encounter choice.
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.__torre2WildCapture&&b.__torre2PartyInstalled&&
    b.fase==='lucha'&&!b.__torre2Changing&&!b.__torre2BallTransitions;
  },null,{timeout:70000});
  const before=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),s=t06.readCampaign();
   b.luchadores.forEach(a=>a.inmortal=true); // Stable UI fixture only.
   b.__torre2CaptureRandom=()=>.999999; // Guaranteed failed shake for test.
   return {id:s.pendingWild?.id,stock:s.inventory.pokeball,
    wins:s.wins,stage:s.stage,trainer:s.trainer,party:s.team.map(x=>x.uid)};
  });
  assert.ok(before.id);
  assert.ok(before.stock>=2);
  await tap(470,61);
  await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').fase==='torre2-aim',null,{timeout:6000});
  await page.screenshot({path:'test-evidence/t06-mobile-pokeball-menu.png'});
  await tap(316,186);
  await page.waitForFunction(()=>{
   const d=window.__pt2Game.scene.getScene('combate').__torre2CaptureDebug;
   return d?.state==='RESUME';
  },null,{timeout:24000});
  const failed=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),s=t06.readCampaign();
   return {stock:s.inventory.pokeball,uid:s.team[0].uid,
    pending:s.pendingWild?.id,phase:b.fase,wins:s.wins,stage:s.stage,trainer:s.trainer};
  });
  assert.equal(failed.stock,before.stock-1,'Breakout consumes exactly one Pokeball');
  assert.equal(failed.pending,before.id,'Breakout must not erase the encounter');
  assert.equal(failed.uid,before.party[0],'Breakout cannot replace the starter');
  assert.equal(failed.wins,before.wins);
  await page.evaluate(()=>{window.__pt2Game.scene.getScene('combate').__torre2CaptureRandom=()=>0;});
  await tap(470,61);
  await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').fase==='torre2-aim',null,{timeout:6000});
  await tap(316,186);
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.__torre2CaptureDebug?.state==='CAUGHT';
  },null,{timeout:24000});
  await page.screenshot({path:'test-evidence/t06-mobile-gotcha.png'});
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'),null,{timeout:15000});
  const after=await page.evaluate(()=>{
   const s=t06.readCampaign();return {stock:s.inventory.pokeball,
    party:s.team.map(x=>({id:x.id,uid:x.uid})),box:s.box.map(x=>x.uid),
    pending:s.pendingWild,wins:s.wins,stage:s.stage,trainer:s.trainer};
  });
  assert.equal(after.stock,before.stock-2,'Two real mobile throws consume two balls only');
  assert.equal(after.pending,null);
  assert.equal(after.wins,before.wins,'Capture must not force trainer victory');
  assert.equal(after.stage,before.stage);
  assert.equal(after.trainer,before.trainer);
  assert.ok(after.party.some(x=>x.id===before.id)||after.box.length>0,'Captured Pokemon must persist');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  const persisted=await page.evaluate(()=>{
   const s=JSON.parse(localStorage.getItem('pokemon-torre-2-kanto-campaign-v1'));
   return {stock:s.inventory.pokeball,party:s.team.map(x=>({id:x.id,uid:x.uid})),
    box:s.box.map(x=>x.uid),pending:s.pendingWild,wins:s.wins,stage:s.stage,trainer:s.trainer};
  });
  assert.deepEqual(persisted,after,'Capture state must survive mobile reload byte-equivalently');
  assert.deepEqual(errors,[],'No browser errors in native touch captures');
  report.before=before;report.failed=failed;report.after=after;
  report.renderer='Phaser/WebGL';
  fs.writeFileSync('test-evidence/t06-mobile-capture.json',JSON.stringify(report,null,2));
  console.log('T06 MOBILE CAPTURE TOUCH PASS',JSON.stringify(report));
  await page.close();
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
