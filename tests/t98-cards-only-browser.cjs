'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.png':'image/png','.webp':'image/webp','.css':'text/css',
 '.jpg':'image/jpeg','.woff2':'font/woff2','.ogg':'audio/ogg'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1');
 const file=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const bytes=await fs.readFile(file);res.writeHead(200,
  {'content-type':mime[path.extname(file)]||'application/octet-stream'});
  res.end(bytes)}
 catch{res.writeHead(404);res.end('not found')}
});
(async()=>{
 await fs.mkdir('test-evidence/kanto-cards',{recursive:true});
 await new Promise(ok=>server.listen(4498,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1000,height:562},hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4498/arena2d/?original=1',
   {waitUntil:'domcontentloaded',timeout:40000});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:50000});
  await page.evaluate(async()=>{
   const entry=[...document.scripts].find(x=>x.src.includes('/main.js'));
   window.__core=await import(new URL('./torre2/campaign-core.js',entry.src));
   window.__cards=await import(new URL('./torre2/trainer-cards.js',entry.src));
   const s=window.__core.createCampaign('bulbasaur');
   s.stage=12;s.trainer=0;
   window.__core.saveCampaign(s);
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>{
   const scene=window.__pt2Game?.scene.getScene('campanha');
   return scene?.scene.isActive()&&scene.__torre2CardUI?.mode==='cards';
  },null,{timeout:35000});
  const expected=await page.evaluate(()=>{
   const scene=window.__pt2Game.scene.getScene('campanha'),
    state=window.__core.readCampaign();
   const cards=window.__cards.trainerCardEntries(state);
   return {types:cards[0].species,length:cards[0].species.length,
    legacyMap:scene.__torre2BattlePath,
    maps:scene.textures.getTextureKeys().filter(x=>x.startsWith('frlg-location-')),
    mode:scene.__torre2CardUI.mode,
    more:scene.children.list.find(o=>o.getData?.('torre2-trainer-cards-root'))
     ?.list.some(o=>o.getData?.('torre2-card-control')==='cards-more')};
  });
  assert.equal(expected.length,6,'Champion card must include all six Pokémon');
  assert.equal(expected.legacyMap,null,'No hidden Phaser world map is allowed');
  assert.deepEqual(expected.maps,[],'Card mode must not preload map textures');
  assert.equal(expected.mode,'cards');
  assert.equal(expected.more,true,'Campaign options remain accessible without maps');
  await page.waitForFunction(()=>{
   const s=window.__pt2Game.scene.getScene('campanha'),
    layer=s.children.list.find(o=>o.getData?.('torre2-trainer-cards-root'));
   return layer?.list.filter(x=>x.getData?.('torre2-opponent-sprite')).length===6;
  },null,{timeout:25000});
  const listSizes=await page.evaluate(()=>{
   const s=window.__pt2Game.scene.getScene('campanha'),
    layer=s.children.list.find(o=>o.getData?.('torre2-trainer-cards-root'));
   return layer.list.filter(x=>x.getData?.('torre2-opponent-sprite'))
    .map(x=>({id:x.getData('torre2-opponent-sprite'),w:x.displayWidth}));
  });
  assert.equal(listSizes.length,6);
  assert.ok(listSizes.every(x=>Math.abs(x.w-11)<.1),'Preview sprites must be 50% of 22px');
  await page.screenshot({path:'test-evidence/kanto-cards/01-six-trainer-party-small.png',fullPage:true});
  await page.evaluate(()=>{
   const s=window.__pt2Game.scene.getScene('campanha'),
    layer=s.children.list.find(o=>o.getData?.('torre2-trainer-cards-root'));
   const card=layer.list.find(o=>o.getData?.('torre2-trainer-card-index')===0);
   if(!card)throw Error('Cannot open champion card');
   card.emit('pointerdown');
  });
  await page.waitForFunction(()=>{
   const s=window.__pt2Game.scene.getScene('campanha'),
    layer=s.children.list.find(o=>o.getData?.('torre2-trainer-cards-root'));
   return s.__torre2CardUI?.mode==='detail'&&
    layer?.list.filter(x=>x.getData?.('torre2-opponent-sprite')).length===6;
  },null,{timeout:20000});
  const detail=await page.evaluate(()=>{
   const s=window.__pt2Game.scene.getScene('campanha'),
    layer=s.children.list.find(o=>o.getData?.('torre2-trainer-cards-root'));
   return {roster:s.__torre2CardUI.roster,
    sprites:layer.list.filter(x=>x.getData?.('torre2-opponent-sprite'))
     .map(x=>({id:x.getData('torre2-opponent-sprite'),w:x.displayWidth}))};
  });
  assert.deepEqual(detail.roster,expected.types,'Detail and battle roster match');
  assert.deepEqual(detail.sprites.map(x=>x.id),expected.types,'All six native sprites render');
  assert.ok(detail.sprites.every(x=>Math.abs(x.w-26.5)<.1),'Detail sprites must be 50% of 53px');
  await page.screenshot({path:'test-evidence/kanto-cards/02-six-opponents-half-scale.png',fullPage:true});
  assert.deepEqual(errors,[],'No uncaught Phaser exceptions');
  console.log('CARDS_ONLY_CHAMPION_6_SPRITES_PASS',JSON.stringify(detail));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
