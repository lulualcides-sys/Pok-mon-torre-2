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
 await new Promise(r=>server.listen(4290,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:854,height:480}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.goto('http://127.0.0.1:4290/arena2d/?original=1',
   {waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.__pt2Started&&
   window.__pt2Game?.scene.isActive('titulo'),null,{timeout:65000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(x=>x.src?.includes('/main.js')).src;
   window.__bagCore=await import(new URL('./torre2/campaign-core.js',src).href);
   const state=__bagCore.createCampaign('charmander');
   state.inventory.antidote=1;
   state.inventory.potion=5; // fourth use must remain blocked by battle quota
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
    return {x:rect.left+rect.width*(o.getData?.('torre2-bag-hud-x')??o.x)/640,
     y:rect.top+rect.height*(o.getData?.('torre2-bag-hud-y')??o.y)/360};
   },[key,value]);
   await page.mouse.click(point.x,point.y);
  }
  await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   b.luchadores[0].hp=b.luchadores[0].hpMax*.32;
   b.luchadores[0].inmortal=true; // isolate UI from unrelated CPU KO
  });
  await clickData('torre2-battle-bag-open',true);
  assert.equal(await page.evaluate(()=>window.__pt2Game.scene.getScene('combate').__torre2BattleBagOpen),true);
  await page.screenshot({path:'test-evidence/battle-bag-open-mobile.png',fullPage:true});
  const frozen=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   const before=b.luchadores[0].hp;
   b.paso(.16);return {before,after:b.luchadores[0].hp};
  });
  assert.equal(frozen.after,frozen.before,'Opening Bag suspends native attacks/status ticks');
  // Real storage refusal on primary and backup must leave BOTH in-memory
  // battle members, live HP, potion counter, and on-disk save intact.
  await page.evaluate(()=>{
   const core=window.__bagCore;
   localStorage.setItem(core.SAVE_BACKUP_KEY,localStorage.getItem(core.SAVE_KEY));
   window.__bagOriginalSet=Storage.prototype.setItem;
   window.__bagDeny=null;
   Storage.prototype.setItem=function(k,v){
    if(k===window.__bagDeny)throw new DOMException('Storage refused','QuotaExceededError');
    return window.__bagOriginalSet.call(this,k,v);
   };
  });
  const beforeSave=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),core=window.__bagCore;
   return {hp:b.luchadores[0].hp,party:b.datos.torre2.party.friend[0].hp,
    primary:localStorage.getItem(core.SAVE_KEY),
    backup:localStorage.getItem(core.SAVE_BACKUP_KEY),
    count:core.readCampaign().inventory.potion};
  });
  for(const denied of ['primary','backup']){
   await page.evaluate(d=>{
    const core=window.__bagCore;
    window.__bagDeny=d==='primary'?core.SAVE_KEY:core.SAVE_BACKUP_KEY;
   },denied);
   await clickData('torre2-battle-bag-item','potion');
   const blocked=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate'),core=window.__bagCore;
    return {hp:b.luchadores[0].hp,party:b.datos.torre2.party.friend[0].hp,
     primary:localStorage.getItem(core.SAVE_KEY),
     backup:localStorage.getItem(core.SAVE_BACKUP_KEY),
     count:core.readCampaign().inventory.potion,
     open:b.__torre2BattleBagOpen,error:b.__torre2BattleBagSaveError};
   });
   for(const key of ['hp','party','primary','backup','count'])
    assert.equal(blocked[key],beforeSave[key],denied+' altered '+key);
   assert.equal(blocked.open,true,'Bag stays open after denied save');
   assert.equal(blocked.error,true,'Player must see the save failure');
   assert.deepEqual(errors,[],'No uncaught UI handler errors');
   await page.evaluate(()=>new Promise(done=>
    requestAnimationFrame(()=>requestAnimationFrame(done))));
  }
  await page.evaluate(()=>{window.__bagDeny=null;});
  await clickData('torre2-battle-bag-item','potion');
  const healed=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   const s=__bagCore.readCampaign();
   return {hp:b.luchadores[0].hp/b.luchadores[0].hpMax*100,
    stored:s.team[0].hp,count:s.inventory.potion,open:b.__torre2BattleBagOpen};
  });
  assert.ok(healed.hp>55&&healed.hp<59,'Live 32% HP + 25% Potion');
  assert.equal(healed.count,4);
  assert.equal(await page.evaluate(()=>
   __pt2Game.scene.getScene('combate').datos.torre2.party.torre2PotionUses),1);
  assert.equal(healed.open,false);
  assert.equal(await page.evaluate(()=>window.__pt2Game.scene.getScene('combate').__torre2BattleBagSaveError),false);
  await page.evaluate(async()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   b.t+=4;
   const src=[...document.scripts].find(x=>x.src?.includes('/main.js')).src;
   const {applyGen3Status}=await import(new URL('./torre2/gen3-status.js',src).href);
   applyGen3Status(b.luchadores[0],'toxic');
   if(!b.luchadores[0].est.veneno)throw Error('Status not applied');
  });
  await clickData('torre2-battle-bag-open',true);
  await page.waitForFunction(()=>
   window.__pt2Game.scene.getScene('combate').__torre2BattleBagOpen===true,
   null,{timeout:7000});
  // Phaser registers newly drawn modal hitzones on the next rendered frame.
  await page.evaluate(()=>new Promise(done=>
   requestAnimationFrame(()=>requestAnimationFrame(done))));
  await clickData('torre2-battle-bag-item','antidote');
  const cured=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   const s=__bagCore.readCampaign();
   return {live:!!b.luchadores[0].est.veneno,stock:s.inventory.antidote,
    status:s.team[0].status,open:b.__torre2BattleBagOpen};
  });
  assert.deepEqual(cured,{live:false,stock:0,status:null,open:false});
  // Reopen and heal with two more NORMAL native Bag clicks. The fourth
  // must stay unavailable despite inventory remaining and modal reopening.
  for(let use=2;use<=3;use++){
   await page.evaluate(()=>{
    const b=__pt2Game.scene.getScene('combate');
    b.t+=4;
    b.luchadores[0].hp=b.luchadores[0].hpMax*.25;
   });
   await clickData('torre2-battle-bag-open',true);
   await page.evaluate(()=>new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok))));
   await clickData('torre2-battle-bag-item','potion');
   assert.equal(await page.evaluate(()=>
    __pt2Game.scene.getScene('combate').datos.torre2.party.torre2PotionUses),use,
    'Potion usage is stored on encounter payload, not modal lifetime');
  }
  await page.evaluate(()=>{__pt2Game.scene.getScene('combate').t+=4});
  await clickData('torre2-battle-bag-open',true);
  await page.evaluate(()=>new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok))));
  const fourth=await page.evaluate(()=>{
   const b=__pt2Game.scene.getScene('combate');
   const remaining=__bagCore.readCampaign().inventory.potion;
   const active=b.children.list.some(x=>x.active&&x.input?.enabled&&
    x.getData?.('torre2-battle-bag-item')==='potion');
   const quotaText=b.children.list.filter(x=>x.active&&x.type==='Text')
    .some(x=>String(x.text).includes('POÇÕES 3/3'));
   return{remaining,uses:b.datos.torre2.party.torre2PotionUses,
    enabled:active,quotaText};
  });
  assert.deepEqual(fourth,{remaining:2,uses:3,enabled:false,quotaText:true},
   'A fourth Potion must remain unavailable with two physical items left');
  await page.screenshot({path:'test-evidence/battle-bag-three-potions-limit.png',fullPage:true});
  await clickData('torre2-battle-bag-back',true);
  await page.screenshot({path:'test-evidence/battle-bag-healed-mobile.png',fullPage:true});
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
