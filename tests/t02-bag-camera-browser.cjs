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
 await new Promise(r=>server.listen(4361,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:854,height:480}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.goto('http://127.0.0.1:4361/arena2d/?original=1',
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
   await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>
    requestAnimationFrame(done))));
   await page.mouse.click(point.x,point.y);
  }
  await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   // Reproduce nonzero Arena camera scroll. Stationary UI must ignore
   // it, while the native fighter and entire battle continue normally.
   b.cameras.main.setScroll(150,18);
   if(b.__torre2BattleBag.trigger.scrollFactorX!==0)
    throw Error('BAG trigger still tracks world camera');
   b.luchadores[0].hp=b.luchadores[0].hpMax*.32;
   b.luchadores[0].inmortal=true; // isolate UI from unrelated CPU KO
  });
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.fase==='lucha'&&!b.__torre2Changing&&
     !b.__torre2CaptureBusy&&!b.__torre2BallTransitions;
  },null,{timeout:25000});
  await clickData('torre2-battle-bag-open',true);
  const opened=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),z=b.__torre2BattleBag.trigger;
   return {open:b.__torre2BattleBagOpen,phase:b.fase,changing:b.__torre2Changing,
    capture:b.__torre2CaptureBusy,transition:b.__torre2BallTransitions,
    scroll:[b.cameras.main.scrollX,b.cameras.main.scrollY],
    trigger:[z.x,z.y,z.scrollFactorX,z.scrollFactorY],
    ptr:[b.input.activePointer.x,b.input.activePointer.y]};
  });
  console.log('T02_CAMERA_OPEN_DIAG',JSON.stringify(opened));
  assert.equal(opened.open,true,'Bag must open under camera movement');
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
  console.log('PASS actual mobile Battle Bag clicks, live HP, status cure, paused ticks, no duplicate consumables');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
