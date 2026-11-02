'use strict';
// T05 browser: actual Chromium + Phaser/WebGL page, with isolated campaign
// API event fixtures. This is NOT a naturally played route or gym victory.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const fsp=require('node:fs/promises');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url||'/','http://127.0.0.1:4371');
 const file=path.resolve(root,'.'+(url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const data=await fsp.readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(data)}
 catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(resolve=>server.listen(4371,'127.0.0.1',resolve));
 const browser=await chromium.launch({
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']
 });
 try{
  const page=await browser.newPage({viewport:{width:854,height:480}});
  const errors=[];
  page.on('pageerror',err=>errors.push(String(err)));
  const url='http://127.0.0.1:4371/arena2d/?original=1';
  const waitTitle=()=>page.waitForFunction(()=>
   window.__pt2Game?.scene.isActive('titulo')&&!!document.querySelector('canvas'),
   null,{timeout:60000});
  const evalCore=async fn=>page.evaluate(async body=>{
   const src=[...document.scripts].find(x=>x.src?.includes('/main.js')).src;
   const core=await import(new URL('./torre2/campaign-core.js',src).href);
   return Function('core',body)(core);
  },fn);
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await waitTitle();
  const initial=await evalCore(`
   const s=core.createCampaign('charmander');
   s.box.push(s.team.pop());
   core.saveCampaign(s);
   const state=core.readCampaign();
   if(!core.purchaseItem(state,'pokeball').ok)throw Error('Purchase failed');
   const encounter=core.startWildEncounter(state,()=>0);
   if(!encounter.ok)throw Error('Encounter failed');
   const catchResult=core.attemptCapture(state,()=>0,'pokeball',{duringBattle:true,hpPercent:23});
   if(!catchResult.ok)throw Error('Capture failed');
   return {bytes:localStorage.getItem(core.SAVE_KEY),money:state.money,
    balls:state.inventory.pokeball,wins:state.wins,trainer:state.trainer,
    team:state.team.map(x=>x.uid),box:state.box.map(x=>x.uid),
    caught:catchResult.pokemon.uid};
  `);
  await page.reload({waitUntil:'domcontentloaded'});
  await waitTitle();
  const recovered=await evalCore(`
   const s=core.readCampaign();
   return {bytes:localStorage.getItem(core.SAVE_KEY),money:s.money,
    balls:s.inventory.pokeball,wins:s.wins,trainer:s.trainer,
    team:s.team.map(x=>x.uid),box:s.box.map(x=>x.uid),
    caught:s.team.at(-1).uid,pendingWild:s.pendingWild};
  `);
  for(const key of ['bytes','money','balls','wins','trainer','caught'])
   assert.deepEqual(recovered[key],initial[key],key+' changed on reload');
  assert.deepEqual(recovered.team,initial.team);
  assert.deepEqual(recovered.box,initial.box);
  assert.equal(recovered.pendingWild,null);
  const victory=await evalCore(`
   const s=core.readCampaign();
   if(!core.resolveBattle(s,true).won)throw Error('Trainer victory failed');
   return {bytes:localStorage.getItem(core.SAVE_KEY),money:s.money,
    wins:s.wins,trainer:s.trainer,team:s.team.map(x=>x.uid),
    box:s.box.map(x=>x.uid)};
  `);
  await page.reload({waitUntil:'domcontentloaded'});
  await waitTitle();
  const after=await evalCore(`
   const s=core.readCampaign();
   return {bytes:localStorage.getItem(core.SAVE_KEY),money:s.money,
    wins:s.wins,trainer:s.trainer,team:s.team.map(x=>x.uid),
    box:s.box.map(x=>x.uid)};
  `);
  assert.deepEqual(after,victory,'Post-victory save must survive a real Phaser reload');
  assert.equal(after.wins,initial.wins+1);
  assert.equal(after.trainer,initial.trainer+1);
  assert.equal(new Set([...after.team,...after.box]).size,after.team.length+after.box.length);
  // Simulated backup-key SecurityError, on real Chromium localStorage. A failed
  // reset must not delete the only primary copy or resurrect an old checkpoint.
  const deniedReset=await evalCore(`
   const before=localStorage.getItem(core.SAVE_KEY);
   localStorage.setItem(core.SAVE_BACKUP_KEY,before);
   let error='';
   try{
    core.resetCampaign({
     removeItem(key){
      if(key===core.SAVE_BACKUP_KEY)throw Error('SecurityError: backup deletion denied');
      localStorage.removeItem(key);
     }
    });
   }catch(e){error=String(e.message);}
   return {error,before,primary:localStorage.getItem(core.SAVE_KEY),
    backup:localStorage.getItem(core.SAVE_BACKUP_KEY)};
  `);
  assert.match(deniedReset.error,/backup deletion denied/);
  assert.equal(deniedReset.primary,deniedReset.before,
   'denied backup deletion must preserve the live primary');
  assert.equal(deniedReset.backup,deniedReset.before);
  await page.reload({waitUntil:'domcontentloaded'});
  await waitTitle();
  const afterDeniedReset=await evalCore(`
   const s=core.readCampaign();
   return {bytes:localStorage.getItem(core.SAVE_KEY),money:s.money,
    wins:s.wins,trainer:s.trainer,team:s.team.map(x=>x.uid),
    box:s.box.map(x=>x.uid)};
  `);
  assert.deepEqual(afterDeniedReset,after,
   'Chromium reload after denied reset must retain the latest campaign');
  await page.screenshot({path:'test-evidence/t05-events-after-reload.png'});
  assert.deepEqual(errors,[]);
  console.log('T05 PASS Chromium/Phaser: purchase, wild capture, trainer victory and reload preserve unique party/PC members');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
