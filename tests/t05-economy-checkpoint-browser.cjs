'use strict';
// T05: real Chromium/Phaser/WebGL reload; only the storage corruption is a fixture.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg'};
const server=http.createServer(async(req,res)=>{
 const pathname=new URL(req.url||'/','http://127.0.0.1').pathname;
 const file=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const bytes=await fsp.readFile(file);
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('not found')}
});
(async()=>{
 await new Promise(ok=>server.listen(4467,'127.0.0.1',ok));
 const browser=await chromium.launch({
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']
 });
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4467/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  const before=await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=await import(new URL('./torre2/campaign-core.js',src));
   const s=core.createCampaign('squirtle');
   core.storePokemon(s,1); // Preserve Mewtwo in PC.
   s.money=8765;s.inventory.pokeball=19;s.team[0].hp=58;
   core.saveCampaign(s);
   const stable=core.readCampaign(); // Apply any additive migrations.
   const bytes=localStorage.getItem(core.SAVE_KEY);
   localStorage.setItem(core.SAVE_BACKUP_KEY,bytes);
   const damaged=structuredClone(stable);
   damaged.money=-100;
   damaged.inventory.pokeball=-4;
   localStorage.setItem(core.SAVE_KEY,JSON.stringify(damaged));
   return {bytes,team:stable.team,box:stable.box,money:stable.money,
    balls:stable.inventory.pokeball,wins:stable.wins,stage:stable.stage};
  });
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  const after=await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=await import(new URL('./torre2/campaign-core.js',src));
   const s=core.readCampaign();
   return {bytes:localStorage.getItem(core.SAVE_KEY),
    backup:localStorage.getItem(core.SAVE_BACKUP_KEY),
    team:s.team,box:s.box,money:s.money,balls:s.inventory.pokeball,
    wins:s.wins,stage:s.stage};
  });
  for(const key of ['bytes','team','box','money','balls','wins','stage'])
   assert.deepEqual(after[key],before[key],key+' changed on native browser reload');
  assert.equal(after.backup,before.bytes,'good backup must survive recovery');
  assert.equal(new Set([...after.team,...after.box].map(m=>m.uid)).size,
   after.team.length+after.box.length,'duplicate Pokémon UID');
  assert.deepEqual(errors,[],'Phaser runtime exception');
  fs.mkdirSync('test-evidence',{recursive:true});
  fs.writeFileSync('test-evidence/t05-economy-checkpoint-browser.json',
   JSON.stringify({fixture:'corrupted primary money and balls',result:'recovered backup on full reload',
    before:{money:before.money,balls:before.balls,stage:before.stage},
    after:{money:after.money,balls:after.balls,stage:after.stage},sameBytes:after.bytes===before.bytes},null,2));
  console.log('T05 ECONOMY CHECKPOINT CHROMIUM PASS');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
