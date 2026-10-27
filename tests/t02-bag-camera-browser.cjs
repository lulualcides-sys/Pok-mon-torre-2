'use strict';
// Real Phaser battle with live damage, finite Bag stock and mobile hit zones.
// Never changes an actual player's save; local HTTP browser owns its storage.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const fsp=require('node:fs/promises');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg',
 '.woff2':'font/woff2','.svg':'image/svg+xml','.ogg':'audio/ogg'};
const server=http.createServer(async(req,res)=>{
 const requested=new URL(req.url||'/', 'http://127.0.0.1');
 let key=decodeURIComponent(requested.pathname);
 if(key.endsWith('/'))key+='index.html';
 const absolute=path.resolve(root,'.'+key);
 if(!absolute.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 try{const data=await fsp.readFile(absolute);
  res.writeHead(200,{'content-type':types[path.extname(absolute)]||'application/octet-stream'});res.end(data)
 }catch{res.writeHead(404);res.end('missing '+key)}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(r=>server.listen(4380,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:854,height:480}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.goto('http://127.0.0.1:4380/arena2d/?original=1',
   {waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.__pt2Started&&
   window.__pt2Game?.scene.isActive('titulo'),null,{timeout:65000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(x=>x.src?.includes('/main.js')).src;
   window.__bagCore=await import(new URL('./torre2/campaign-core.js',src).href);
   const state=__bagCore.createCampaign('charmander');
   state.inventory.antidote=1;
   __bagCore.saveCampaign(state);
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
   window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,null,{timeout:35000});
  await page.evaluate(()=>{
   const state=__bagCore.readCampaign();
   window.__pt2Game.scene.getScene('campanha').enterBattle(state);
  });
  await page.waitForFunction(()=>{
   const g=window.__pt2Game,b=g?.scene.getScene('combate');
   return g?.scene.isActive('combate')&&b?.fase==='lucha'&&
    b?.__torre2BattleBag?.trigger?.active;
  },null,{timeout:65000});
  async function clickData(key,value){
   const point=await page.evaluate(([k,v])=>{
    const b=window.__pt2Game.scene.getScene('combate');
    const o=b.children.list.find(x=>x.getData?.(k)===v&&x.input?.enabled);
    if(!o)throw new Error('Missing battle Bag control '+k+'='+v);
    const rect=document.querySelector('#juego canvas').getBoundingClientRect();
    return {x:rect.left+rect.width*o.x/640,y:rect.top+rect.height*o.y/360};
   },[key,value]);
   await page.mouse.click(point.x,point.y);
  }
  await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   b.luchadores[0].hp=b.luchadores[0].hpMax*.32;
   b.luchadores[0].inmortal=true; // isolate UI from unrelated CPU KO
   // Regression: native camera follows world actors, but menu hitzones must
   // remain fixed on screen for the same UI click coordinates.
   b.cameras.main.stopFollow();
   b.cameras.main.setScroll(88,22);
  });
  const beforeCamera=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),cam=b.cameras.main;
   return {x:cam.scrollX,y:cam.scrollY,
    triggerX:b.__torre2BattleBag.trigger.scrollFactorX,
    triggerY:b.__torre2BattleBag.trigger.scrollFactorY};
  });
  assert.equal(beforeCamera.x,88,'Camera was deliberately panned during test');
  assert.equal(beforeCamera.triggerX,0,'BAG trigger must not pan with world');
  assert.equal(beforeCamera.triggerY,0,'BAG trigger must not pan with world');
  // Wait for the native recall/send-out locks; a premature click tests a
  // transition lock, not the camera panning bug.
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.fase==='lucha'&&!b.__torre2Changing&&
    !b.__torre2BallTransitions&&!b.__torre2CaptureBusy;
  },null,{timeout:25000});
  await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
  await clickData('torre2-battle-bag-open',true);
  try{
   await page.waitForFunction(()=>
    window.__pt2Game.scene.getScene('combate').__torre2BattleBagOpen===true,
    null,{timeout:5000});
  }catch(err){
   const diag=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate'),c=b.cameras.main,
     z=b.__torre2BattleBag?.trigger,p=b.input.activePointer;
    return {phase:b.fase,time:b.t,changing:b.__torre2Changing,
     capture:b.__torre2CaptureBusy,transition:b.__torre2BallTransitions,
     camera:{scrollX:c.scrollX,scrollY:c.scrollY,zoom:c.zoom},
     trigger:z?{x:z.x,y:z.y,active:z.active,visible:z.visible,
      depth:z.depth,scrollFactorX:z.scrollFactorX,
      scrollFactorY:z.scrollFactorY,enabled:z.input?.enabled}:null,
     pointer:p?{x:p.x,y:p.y,worldX:p.worldX,worldY:p.worldY}:null,
     hits:b.input.hitTestPointer?.(p)?.slice(0,8).map(o=>
      ({type:o.type,depth:o.depth,x:o.x,y:o.y,tag:o.data?.list}))};
   });console.error('T02 CAMERA BAG DIAGNOSTIC',JSON.stringify(diag));throw err;
  }
  const modalFactors=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.children.list.filter(o=>o.active&&o.getData?.('torre2-battle-bag-item'))
    .map(o=>({item:o.getData('torre2-battle-bag-item'),x:o.scrollFactorX,y:o.scrollFactorY}));
  });
  assert.ok(modalFactors.some(o=>o.item==='potion')&&modalFactors.some(o=>o.item==='antidote'));
  assert.ok(modalFactors.every(o=>o.x===0&&o.y===0),'Every modal action stays screen-anchored');
  await page.screenshot({path:'test-evidence/t02-bag-camera-open.png',fullPage:true});
  const frozen=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   const before=b.luchadores[0].hp;
   b.paso(.16);return {before,after:b.luchadores[0].hp};
  });
  assert.equal(frozen.after,frozen.before,'Opening Bag suspends native attacks/status ticks');
  await clickData('torre2-battle-bag-item','potion');
  const healed=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   const s=__bagCore.readCampaign();
   return {hp:b.luchadores[0].hp/b.luchadores[0].hpMax*100,
    stored:s.team[0].hp,count:s.inventory.potion,open:b.__torre2BattleBagOpen};
  });
  assert.ok(healed.hp>55&&healed.hp<59,'Live 32% HP + 25% Potion');
  assert.equal(healed.count,2);
  assert.equal(healed.open,false);
  await page.evaluate(async()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   b.t+=4;
   const src=[...document.scripts].find(x=>x.src?.includes('/main.js')).src;
   const {applyGen3Status}=await import(new URL('./torre2/gen3-status.js',src).href);
   applyGen3Status(b.luchadores[0],'toxic');
   if(!b.luchadores[0].est.veneno)throw Error('Status not applied');
  });
  await clickData('torre2-battle-bag-open',true);
  await clickData('torre2-battle-bag-item','antidote');
  const cured=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   const s=__bagCore.readCampaign();
   return {live:!!b.luchadores[0].est.veneno,stock:s.inventory.antidote,
    status:s.team[0].status,open:b.__torre2BattleBagOpen};
  });
  assert.deepEqual(cured,{live:false,stock:0,status:null,open:false});
  await page.screenshot({path:'test-evidence/t02-bag-camera-healed.png',fullPage:true});
  // No rollback or duplicate item after returning through normal campaign resolver.
  await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   b.victorias=[1,0];b.resultado();
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
   __bagCore.readCampaign()?.trainer===1,null,{timeout:20000});
  const persisted=await page.evaluate(()=>{
   const s=__bagCore.readCampaign();
   return {trainer:s.trainer,potion:s.inventory.potion,antidote:s.inventory.antidote};
  });
  assert.deepEqual(persisted,{trainer:1,potion:2,antidote:0});
  assert.deepEqual(errors,[],'No JS errors in real native Phaser battle');
  console.log('T02 PASS BATTLE BAG CAMERA OFFSET: potion + antidote clicked at 88px pan, preserved inventory, statuses, native inputs');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
