'use strict';
// T05 - Chromium reload recovery test against the actual generated Phaser game.
// Does not modify any player's save, only an isolated browser localStorage.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg',
 '.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url||'/','http://127.0.0.1:4367');
 const file=path.resolve(root,'.'+(url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const data=await fsp.readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(data)}
 catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(resolve=>server.listen(4367,'127.0.0.1',resolve));
 const browser=await chromium.launch({
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']
 });
 try{
  const page=await browser.newPage({viewport:{width:854,height:480}}),errors=[];
  page.on('pageerror',err=>errors.push(String(err)));
  const url='http://127.0.0.1:4367/arena2d/?original=1';
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  const before=await page.evaluate(async()=>{
   const src=[...document.scripts].find(x=>x.src?.includes('/main.js')).src;
   const core=await import(new URL('./torre2/campaign-core.js',src).href);
   const s=core.createCampaign('charmander');
   s.stage=1;s.trainer=3;s.money=4510;s.team[0].hp=63;
   s.wins=17;s.badges=['Rocha'];s.gymTMClaims=['tm-rock-tomb'];
   s.inventory.tms=['tm-rock-tomb'];s.inventory.pokeball=11;
   s.box.push(s.team.pop()); // The permanent Mewtwo stays in PC.
   core.saveCampaign(s);
   // Prime additive defaults via native migration before capturing the exact
   // last-known-good serialized byte sequence.
   const migrated=core.readCampaign();
   const valid=localStorage.getItem(core.SAVE_KEY);
   localStorage.setItem(core.SAVE_BACKUP_KEY,valid);
   localStorage.setItem(core.SAVE_KEY,JSON.stringify({...migrated,team:[]}));
   return {valid,corruptValidJson:true,stage:migrated.stage,wins:migrated.wins,
    money:migrated.money,box:migrated.box.map(x=>x.id),balls:migrated.inventory.pokeball,
    team:migrated.team.map(x=>x.id),hp:migrated.team[0].hp};
  });
  // True page reload: global JS, Phaser scene and ES module references reset.
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  const after=await page.evaluate(async()=>{
   const src=[...document.scripts].find(x=>x.src?.includes('/main.js')).src;
   const core=await import(new URL('./torre2/campaign-core.js',src).href);
   const restored=core.readCampaign();
   if(!restored)throw Error('Native save load failed after browser reload');
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
   return {primary:localStorage.getItem(core.SAVE_KEY),backup:localStorage.getItem(core.SAVE_BACKUP_KEY),
    stage:restored.stage,wins:restored.wins,money:restored.money,team:restored.team.map(x=>x.id),
    box:restored.box.map(x=>x.id),hp:restored.team[0].hp,balls:restored.inventory.pokeball,
    claims:restored.gymTMClaims,items:restored.inventory.tms};
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
   !!window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,null,{timeout:45000});
  assert.equal(after.primary,before.valid);
  assert.equal(after.backup,before.valid);
  for(const k of ['stage','wins','money','balls','hp'])assert.equal(after[k],before[k],k);
  assert.deepEqual(after.box,['mewtwo']);
  assert.deepEqual(after.team,['charmander']);
  assert.deepEqual(after.claims,['tm-rock-tomb']);
  assert.deepEqual(after.items,['tm-rock-tomb']);
  await page.screenshot({path:'test-evidence/t05-browser-restored-campaign.png'});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  const second=await page.evaluate(async()=>{
   const src=[...document.scripts].find(x=>x.src?.includes('/main.js')).src;
   const core=await import(new URL('./torre2/campaign-core.js',src).href);
   const s=core.readCampaign();
   return {team:s.team.map(x=>x.id),box:s.box.map(x=>x.id),money:s.money,
    saved:localStorage.getItem(core.SAVE_KEY),backup:localStorage.getItem(core.SAVE_BACKUP_KEY)};
  });
  assert.deepEqual(second.team,['charmander']);
  assert.deepEqual(second.box,['mewtwo']);
  assert.equal(second.money,4510);
  assert.equal(second.saved,before.valid);
  assert.equal(second.backup,before.valid);
  assert.deepEqual(errors,[]);
  console.log('T05 PASS REAL RELOAD: recovered valid backup from invalid structured save, kept PC/cash/items/HP/badges without duplication');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
