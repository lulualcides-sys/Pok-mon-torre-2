'use strict';
// Real Chromium/Phaser restart from a broken JSON save and intact rollback.
const assert=require('node:assert/strict'),fs=require('node:fs/promises');
const path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const MIME={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg',
 '.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/', 'http://127.0.0.1');
 const p=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!p.startsWith(root+path.sep)){res.writeHead(403);return res.end('blocked')}
 try{const f=await fs.readFile(p);res.writeHead(200,{'content-type':MIME[path.extname(p)]||'application/octet-stream'});res.end(f)}
 catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 await new Promise(r=>server.listen(4310,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
    '--use-gl=angle','--use-angle=swiftshader']});
 try{
  for(const [label,viewport] of [['desktop',{width:1280,height:720}],['mobile',{width:854,height:480}]]){
   const page=await browser.newPage({viewport,hasTouch:label==='mobile'}),errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   await page.goto('http://127.0.0.1:4310/arena2d/?original=1',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:45000});
   const init=await page.evaluate(async()=>{
    const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
    const core=window.testCore=await import(new URL('./torre2/campaign-core.js',src));
    const s=core.createCampaign('squirtle');
    s.stage=3;s.trainer=5;s.money=2199;s.team[0].hp=42;
    s.badges=['Rocha','Cascata','Trovao'];
    s.gymTMClaims=['tm-rock-tomb','tm-water-pulse','tm-shock-wave'];
    // Preserve a complete prior save with owned Pokemon, TMs and progress.
    const raw=JSON.stringify(s),uid=s.team[0].uid;
    localStorage.setItem(core.SAVE_BACKUP_KEY,raw);
    localStorage.setItem(core.SAVE_KEY,JSON.stringify({version:1,team:[{}],stage:3,trainer:5}));
    return {uid,raw,stage:s.stage,trainer:s.trainer,money:s.money,team:s.team.map(p=>p.id)};
   });
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:45000});
   await page.evaluate(()=>window.__pt2Game.scene.getScene('titulo').scene.start('campanha'));
   await page.waitForFunction(()=>{
    const scene=window.__pt2Game.scene.getScene('campanha');
    return scene.scene.isActive()&&scene.__torre2BattlePath?.stage===3;
   },null,{timeout:45000});
   const resumed=await page.evaluate(async()=>{
    const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
    const core=await import(new URL('./torre2/campaign-core.js',src));
    const s=core.readCampaign();
    return {stage:s.stage,trainer:s.trainer,money:s.money,uid:s.team[0].uid,
      hp:s.team[0].hp,team:s.team.map(p=>p.id),
      backup:localStorage.getItem(core.SAVE_BACKUP_KEY),
      primaryValid:!!JSON.parse(localStorage.getItem(core.SAVE_KEY)).team[0].id,
      mapVisible:!!window.__pt2Game.scene.getScene('campanha').__torre2BattlePath};
   });
   assert.equal(resumed.stage,init.stage);
   assert.equal(resumed.trainer,init.trainer);
   assert.equal(resumed.money,init.money);
   assert.equal(resumed.uid,init.uid);
   assert.equal(resumed.hp,42);
   assert.deepEqual(resumed.team,init.team);
   assert.equal(resumed.primaryValid,true);
   assert.equal(resumed.backup,init.raw);
   assert.equal(resumed.mapVisible,true);
   assert.deepEqual(errors,[]);
   console.log('PASS restored Kanto campaign from invalid JSON shape after physical browser reload:',label);
   await page.close();
  }
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
