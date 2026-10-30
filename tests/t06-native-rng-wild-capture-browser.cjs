'use strict';
// T06 — a real wild capture using the production RNG, unmodified fighter HP,
// native Phaser pointer events, ball trajectory and persistent campaign save.
// Unlike deterministic tests, either GOTCHA or a breakout is a valid outcome.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const fsp=require('node:fs/promises');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1:4392');
 const file=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden');}
 try{const data=await fsp.readFile(file);
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(data);
 }catch{res.writeHead(404);res.end('missing');}
});
const report={scope:'T06 desktop wild encounter and native probabilistic capture',
 fixtures:'Fresh campaign only; no capture RNG/Math.random override, no immortal fighters, no forced species/HP/catch/result',
 outcomes:[],renderer:'Phaser/WebGL'};
fs.mkdirSync('test-evidence',{recursive:true});
const saveReport=()=>fs.writeFileSync('test-evidence/t06-native-rng-capture.json',JSON.stringify(report,null,2));
(async()=>{
 await new Promise(ok=>server.listen(4392,'127.0.0.1',ok));
 const browser=await chromium.launch({
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']
 });
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const click=async(x,y)=>{
   const pt=await page.evaluate(([x,y])=>{
    const canvas=document.querySelector('#juego canvas')||document.querySelector('canvas');
    if(!canvas)throw Error('Phaser canvas missing');
    const box=canvas.getBoundingClientRect();
    return {x:box.left+x*box.width/640,y:box.top+y*box.height/360};
   },[x,y]);
   assert.ok(pt.x>=0&&pt.y>=0&&pt.x<=1280&&pt.y<=720,'Outside desktop viewport');
   await page.mouse.move(pt.x,pt.y);
   await page.mouse.down();await page.waitForTimeout(95);await page.mouse.up();
  };
  await page.goto('http://127.0.0.1:4392/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  await page.evaluate(async()=>{
   const main=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   window.__t06Core=await import(new URL('./torre2/campaign-core.js',main));
   const state=__t06Core.createCampaign('bulbasaur');
   __t06Core.storePokemon(state,1); // Only one natural starter; Mewtwo stored in PC.
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'),null,{timeout:60000});
  await page.evaluate(()=>window.__pt2Game.scene.getScene('campanha').grassScreen(__t06Core.readCampaign()));
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await click(465,292); // Actual tall-grass encounter click.
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.__torre2WildCapture&&b.__torre2PartyInstalled&&
    b.fase==='lucha'&&!b.__torre2Changing&&!b.__torre2BallTransitions;
  },null,{timeout:70000});
  const original=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),s=__t06Core.readCampaign();
   return {species:s.pendingWild?.id,stock:s.inventory.pokeball,
    team:s.team.map(m=>({id:m.id,uid:m.uid})),box:s.box.map(m=>({id:m.id,uid:m.uid})),
    stage:s.stage,trainer:s.trainer,wins:s.wins,losses:s.losses,
    randomOverride:typeof b.__torre2CaptureRandom,
    player:{hp:b.luchadores[0].hp,hpMax:b.luchadores[0].hpMax,inmortal:b.luchadores[0].inmortal},
    enemy:{hp:b.luchadores[1].hp,hpMax:b.luchadores[1].hpMax,inmortal:b.luchadores[1].inmortal}};
  });
  report.original=original;saveReport();
  assert.ok(original.species,'Grass UI must select a genuine wild species');
  assert.ok(original.stock>=2,'Need original inventory; no stock injection');
  assert.equal(original.randomOverride,'undefined','Production RNG must be used');
  assert.ok(original.player.hp>0&&original.enemy.hp>0);
  assert.notEqual(original.player.inmortal,true,'No invulnerability fixture');
  assert.notEqual(original.enemy.inmortal,true,'No invulnerability fixture');
  let result;
  for(let attempt=1;attempt<=2;attempt++){
   await click(466,237);
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').fase==='torre2-aim',
    null,{timeout:7000});
   await click(316,186);
   // Poll for one of the TWO authentic RNG outcomes, not a predefined success.
   await page.waitForFunction(()=>{
    const game=window.__pt2Game,b=game.scene.getScene('combate'),s=__t06Core.readCampaign();
    return b.__torre2CaptureDebug?.state==='RESUME'||
     b.__torre2CaptureDebug?.state==='CAUGHT'||
     (game.scene.isActive('campanha')&&!s.pendingWild);
   },null,{timeout:32000,polling:30});
   result=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate'),s=__t06Core.readCampaign();
    return {state:b.__torre2CaptureDebug?.state,
     hits:b.__torre2CaptureDebug?.hits,
     stock:s.inventory.pokeball,pending:s.pendingWild?.id??null,
     team:s.team.map(m=>({id:m.id,uid:m.uid})),
     box:s.box.map(m=>({id:m.id,uid:m.uid})),
     stage:s.stage,trainer:s.trainer,wins:s.wins,losses:s.losses,
     campaign:window.__pt2Game.scene.isActive('campanha')};
   });
   assert.equal(result.stock,original.stock-attempt,'Each real throw consumes one ball');
   assert.equal(result.stage,original.stage);
   assert.equal(result.trainer,original.trainer);
   assert.equal(result.wins,original.wins,'Capture does not fabricate trainer victory');
   assert.equal(result.losses,original.losses,'Capture cannot fabricate a defeat');
   assert.equal(result.team[0].uid,original.team[0].uid,'Starter must persist');
   assert.deepEqual(result.box,original.box,'PC must stay unchanged while party has space');
   assert.ok(result.state==='RESUME'||result.state==='CAUGHT'||result.campaign,
    'Unknown native capture result');
   if(result.state==='RESUME'){
    assert.equal(result.hits,true,'Ball must hit before breakout');
    assert.equal(result.pending,original.species,'Breakout preserves wild encounter');
    assert.deepEqual(result.team,original.team);
   }else{
    assert.equal(result.pending,null,'Successful capture clears pending encounter');
    assert.equal(result.team.length,2,'Captured species must join original starter');
    assert.equal(result.team[1].id,original.species);
    assert.ok(result.team[1].uid&&!original.team.some(m=>m.uid===result.team[1].uid));
   }
   report.outcomes.push({attempt,...result});saveReport();
   if(result.state!=='RESUME')break;
   // A second naturally random throw, only if the first genuinely escaped.
  }
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  const saved=await page.evaluate(()=>{
   const s=JSON.parse(localStorage.getItem('pokemon-torre-2-kanto-campaign-v1'));
   return {stock:s.inventory.pokeball,pending:s.pendingWild?.id??null,
    team:s.team.map(m=>({id:m.id,uid:m.uid})),
    box:s.box.map(m=>({id:m.id,uid:m.uid})),
    stage:s.stage,trainer:s.trainer,wins:s.wins,losses:s.losses};
  });
  for(const key of ['stock','pending','team','box','stage','trainer','wins','losses']){
   assert.deepEqual(saved[key],result[key],'Reload changed '+key);
  }
  assert.deepEqual(errors,[],'Unexpected browser JS exception');
  report.saved=saved;saveReport();
  console.log('T06 NATIVE RANDOM CAPTURE PASS',JSON.stringify({species:original.species,
   outcomes:report.outcomes.map(x=>({attempt:x.attempt,state:x.state,stock:x.stock})),saved:true}));
 }catch(error){
  report.error=String(error);saveReport();throw error;
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});