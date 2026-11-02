'use strict';
// T05 — real Chromium/Phaser reload with a duplicate UID and NO backup.
// The corrupted save is a deliberate fixture; no natural battle is claimed.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1:4389');
 const f=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!f.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden');}
 try{const data=await fsp.readFile(f);
  res.writeHead(200,{'content-type':mime[path.extname(f)]||'application/octet-stream'});
  res.end(data);
 }catch{res.writeHead(404);res.end('missing');}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(resolve=>server.listen(4389,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:854,height:480}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4389/arena2d/?original=1',
   {waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),
   null,{timeout:60000});
  const prepared=await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=await import(new URL('./torre2/campaign-core.js',src).href);
   const s=core.createCampaign('charmander');
   s.box.push(s.team.pop());s.team[0].hp=39;s.money=2934;s.wins=5;
   core.saveCampaign(s);core.readCampaign(); // Finish additive migration.
   const bad=JSON.parse(localStorage.getItem(core.SAVE_KEY));
   bad.box[0].uid=bad.team[0].uid;
   const raw=JSON.stringify(bad);
   localStorage.removeItem(core.SAVE_BACKUP_KEY);
   localStorage.setItem(core.SAVE_KEY,raw);
   return {raw,uid:bad.team[0].uid};
  });
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),
   null,{timeout:60000});
  const recovered=await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=await import(new URL('./torre2/campaign-core.js',src).href);
   const s=core.readCampaign();
   const scene=window.__pt2Game.scene.getScene('titulo');
   scene.scene.start('campanha');
   return {team:s.team.map(m=>({id:m.id,uid:m.uid,hp:m.hp})),
    box:s.box.map(m=>({id:m.id,uid:m.uid,hp:m.hp})),
    money:s.money,wins:s.wins,raw:localStorage.getItem(core.SAVE_BACKUP_KEY),
    primary:localStorage.getItem(core.SAVE_KEY),
    renderer:window.__pt2Game.config.type};
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
   !!window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,
   null,{timeout:45000});
  assert.deepEqual(recovered.team.map(x=>x.id),['charmander']);
  assert.deepEqual(recovered.box.map(x=>x.id),['mewtwo']);
  assert.equal(recovered.team[0].uid,prepared.uid);
  assert.notEqual(recovered.team[0].uid,recovered.box[0].uid);
  assert.equal(recovered.team[0].hp,39);
  assert.equal(recovered.money,2934);assert.equal(recovered.wins,5);
  assert.equal(recovered.raw,prepared.raw,'original bytes archived before repair');
  assert.equal(JSON.parse(recovered.primary).box[0].uid,recovered.box[0].uid);
  await page.screenshot({path:'test-evidence/t05-uid-repaired-phaser.png'});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),
   null,{timeout:60000});
  const second=await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=await import(new URL('./torre2/campaign-core.js',src).href);
   const s=core.readCampaign();
   return {primary:localStorage.getItem(core.SAVE_KEY),
    backup:localStorage.getItem(core.SAVE_BACKUP_KEY),
    ids:[...s.team,...s.box].map(m=>m.uid),money:s.money};
  });
  assert.equal(second.primary,recovered.primary,'reloading is byte-idempotent');
  assert.equal(second.backup,prepared.raw,'original damaged bytes retained');
  assert.deepEqual(second.ids,[recovered.team[0].uid,recovered.box[0].uid]);
  assert.equal(second.money,2934);
  assert.deepEqual(errors,[],'no Phaser page errors');
  console.log('T05 DUPLICATE UID NO BACKUP PASS',JSON.stringify({
   originalArchived:true,team:recovered.team,box:recovered.box,
   money:second.money,renderer:recovered.renderer,errors:errors.length}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;})
 .finally(()=>server.close());
