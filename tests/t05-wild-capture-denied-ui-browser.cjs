'use strict';
// T05/T06: native mobile Phaser/WebGL taps with simulated localStorage denial.
// Wild encounter is selected through the grass UI; catch RNG and storage denial
// are test fixtures. No win, XP, HP or party member is awarded by the test.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1');
 const file=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const data=await fsp.readFile(file);
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});
  res.end(data);
 }catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(ok=>server.listen(4567,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:854,height:480},hasTouch:true,isMobile:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const tap=async(x,y)=>{
   const p=await page.evaluate(([x,y])=>{
    const canvas=document.querySelector('#juego canvas')||document.querySelector('canvas');
    if(!canvas)throw Error('Missing Phaser canvas');
    const r=canvas.getBoundingClientRect();
    return {x:r.left+x*r.width/640,y:r.top+y*r.height/360};
   },[x,y]);
   assert.ok(p.x>=0&&p.x<=854&&p.y>=0&&p.y<=480);
   await page.touchscreen.tap(p.x,p.y);
  };
  await page.goto('http://127.0.0.1:4567/arena2d/?original=1',
   {waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   window.__atomicCaptureCore=await import(new URL('./torre2/campaign-core.js',src));
   const core=window.__atomicCaptureCore;
   core.saveCampaign(core.createCampaign('bulbasaur'));
   core.storePokemon(core.readCampaign(),1); // Keep Mewtwo in PC.
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'),null,{timeout:60000});
  await page.evaluate(()=>window.__pt2Game.scene.getScene('campanha')
   .grassScreen(window.__atomicCaptureCore.readCampaign()));
  await page.evaluate(()=>new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok))));
  await tap(465,292);
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.__torre2WildCapture&&b.fase==='lucha'&&
    !b.__torre2Changing&&!b.__torre2BallTransitions;
  },null,{timeout:70000});
  const before=await page.evaluate(()=>{
   const core=window.__atomicCaptureCore;
   const b=window.__pt2Game.scene.getScene('combate');
   b.luchadores.forEach(a=>a.inmortal=true); // Stable enemy fixture.
   b.__torre2CaptureRandom=()=>0; // Capture roll fixture, not forced runtime.
   window.__captureOriginalSet=Storage.prototype.setItem;
   window.__captureDeny=null;
   Storage.prototype.setItem=function(k,v){
    if(k===window.__captureDeny)throw new DOMException('Denied','QuotaExceededError');
    return window.__captureOriginalSet.call(this,k,v);
   };
   return {state:core.readCampaign(),primary:localStorage.getItem(core.SAVE_KEY),
    backup:localStorage.getItem(core.SAVE_BACKUP_KEY)};
  });
  assert.ok(before.state.pendingWild?.id,'No wild encounter before throw');
  for(const key of ['primary','backup']){
   await page.evaluate(key=>{
    const core=window.__atomicCaptureCore;
    window.__captureDeny=key==='primary'?core.SAVE_KEY:core.SAVE_BACKUP_KEY;
   },key);
   await tap(470,61);
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').fase==='torre2-aim',null,{timeout:8000});
   await tap(316,186);
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate')
    .__torre2CaptureDebug?.state==='SAVE_ERROR',null,{timeout:15000});
   const denied=await page.evaluate(()=>{
    const core=window.__atomicCaptureCore,b=window.__pt2Game.scene.getScene('combate');
    return {state:core.readCampaign(),primary:localStorage.getItem(core.SAVE_KEY),
     backup:localStorage.getItem(core.SAVE_BACKUP_KEY),phase:b.fase,
     busy:b.__torre2CaptureBusy,
     warning:b.children.list.some(o=>o.active&&o.getData?.('torre2-capture-save-error')===true)};
   });
   assert.deepEqual(denied.state,before.state,'Denied throw mutated saved campaign');
   assert.equal(denied.primary,before.primary,'Primary checkpoint changed');
   assert.equal(denied.backup,before.backup,'Backup checkpoint changed');
   assert.equal(denied.phase,'lucha','Combat remained stuck after storage error');
   assert.equal(denied.busy,false,'Capture lock remained after storage error');
   assert.equal(denied.warning,true,'Missing native Phaser storage warning');
   assert.deepEqual(errors,[],'Uncaught error in Phaser tween');
   await page.evaluate(()=>{window.__captureDeny=null});
  }
  await tap(470,61);
  await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').fase==='torre2-aim',null,{timeout:8000});
  await tap(316,186);
  await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate')
   .__torre2CaptureDebug?.state==='CAUGHT',null,{timeout:22000});
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'),null,{timeout:15000});
  const after=await page.evaluate(()=>{
   const core=window.__atomicCaptureCore;return core.readCampaign();
  });
  assert.equal(after.inventory.pokeball,before.state.inventory.pokeball-1,
   'Only the successful retry may consume a ball');
  assert.equal(after.pendingWild,null,'Successful retry did not clear encounter');
  assert.ok([...after.team,...after.box].some(m=>m.id===before.state.pendingWild.id));
  assert.equal(after.wins,before.state.wins,'Capture awarded a trainer victory');
  assert.deepEqual(errors,[]);
  await page.screenshot({path:'test-evidence/t05-wild-capture-atomic-mobile.png'});
  fs.writeFileSync('test-evidence/t05-wild-capture-atomic-mobile.json',
   JSON.stringify({denials:['primary','backup'],caught:after.dexCaught.at(-1),
    ballsBefore:before.state.inventory.pokeball,ballsAfter:after.inventory.pokeball,
    runtime:'Phaser/WebGL mobile touch',fixture:'RNG/storage/immortal actors'},null,2));
  console.log('T05 WILD CAPTURE MOBILE PHASER: two denied throws + one successful retry PASS');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
