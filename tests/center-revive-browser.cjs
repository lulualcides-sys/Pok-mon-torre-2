'use strict';
// Native Phaser Center healing animation, save authority and touch tests.
// Real browser; no fake screenshots, no external website interaction.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg',
 '.webmanifest':'application/manifest+json','.svg':'image/svg+xml',
 '.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1');
 const name=u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname;
 const f=path.resolve(root,'.'+name);
 if(!f.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const b=await fsp.readFile(f);res.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});res.end(b)}
 catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(ok=>server.listen(4304,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
 for(const [label,viewport]of [['desktop',{width:1280,height:720}],['mobile',{width:854,height:480}]]){
  const page=await browser.newPage({viewport,hasTouch:label==='mobile'});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  try{
   await page.goto('http://127.0.0.1:4304/arena2d/',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.__pt2Started&&window.__pt2Game?.scene.isActive('titulo'),null,{timeout:45000});
   await page.evaluate(async()=>{
    const src=[...document.scripts].find(x=>x.src?.includes('/main.js')).src;
    window.core=await import(new URL('./torre2/campaign-core.js',src));
    const s=core.createCampaign('bulbasaur');
    s.team[0].hp=0;s.team[0].status={kind:'veneno'};s.team[0].confusion={turns:2};
    s.team[1].hp=37;s.team[1].status={kind:'queimado'};
    core.saveCampaign(s);
    window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
   });
   await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
    window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,null,{timeout:45000});
   const entry=await page.evaluate(()=>{
    const c=window.__pt2Game.scene.getScene('campanha'),s=core.readCampaign();
    const initial={hp:s.team.map(p=>p.hp),stocks:s.inventory.potion,money:s.money,
     trainer:s.trainer,stage:s.stage,uid:s.team.map(p=>p.uid)};
    c.centerScreen(s);
    return initial;
   });
   async function hit(key){
    // Phaser refreshes its interactive hitlist only after the next game frame.
    // A click directly after centerScreen() races with that refresh.
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>
     requestAnimationFrame(r))));
    const point=await page.evaluate((key)=>{
     const c=window.__pt2Game.scene.getScene('campanha');
     const z=c.children.list.find(o=>o.input?.enabled&&o.getData?.(key)===true);
     if(!z)throw Error('Missing Centro Phaser UI '+key);
     const r=document.querySelector('canvas').getBoundingClientRect();
     return {x:r.x+z.x*r.width/640,y:r.y+z.y*r.height/360};
    },key);
    if(label==='mobile')await page.touchscreen.tap(point.x,point.y);
    else await page.mouse.click(point.x,point.y);
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>
     requestAnimationFrame(r))));
   }
   await hit('torre2-center-heal');
   const busy=await page.evaluate(()=>{
    const c=window.__pt2Game.scene.getScene('campanha'),s=core.readCampaign();
    return {busy:c.__torre2CenterBusy,locked:!!c.children.list.find(o=>o.getData?.('torre2-center-lock')===true),
      hp:s.team.map(p=>p.hp)};
   });
   assert.equal(busy.busy,true);assert.equal(busy.locked,true);
   assert.deepEqual(busy.hp,entry.hp,'center does not write save before healing animation');
   await page.screenshot({path:'test-evidence/center-heal-'+label+'-start.png',fullPage:true});
   // The confirmation zone exists only for 450ms. Screenshots/Chrome capture
   // may miss that narrow window. Inspect the durable save, not a transient UI.
   await page.waitForFunction(()=>{
    const s=window.core.readCampaign();
    return s?.team?.every(m=>m.hp===100&&m.status===null&&!m.confusion);
   },null,{timeout:12000});
   const healed=await page.evaluate(()=>{
    const s=core.readCampaign();
    return {hp:s.team.map(p=>p.hp),status:s.team.map(p=>p.status),
     confusion:s.team.map(p=>p.confusion),stocks:s.inventory.potion,money:s.money,
     trainer:s.trainer,stage:s.stage,uid:s.team.map(p=>p.uid)};
   });
   assert.deepEqual(healed.hp,[100,100]);
   assert.deepEqual(healed.status,[null,null]);
   assert.deepEqual(healed.confusion,[null,null]);
   assert.equal(healed.stocks,entry.stocks);
   assert.equal(healed.money,entry.money);
   assert.equal(healed.trainer,entry.trainer);
   assert.equal(healed.stage,entry.stage);
   assert.deepEqual(healed.uid,entry.uid);
   await page.screenshot({path:'test-evidence/center-heal-'+label+'-complete.png',fullPage:true});
   await page.waitForFunction(()=>{
    const s=window.__pt2Game.scene.getScene('campanha');
    return s.scene.isActive()&&!!s.__torre2BattlePath&&!s.__torre2CenterBusy;
   },null,{timeout:12000});
   const again=await page.evaluate(()=>{
    const s=core.readCampaign();
    return {hp:s.team.map(p=>p.hp),money:s.money,stocks:s.inventory.potion,uid:s.team.map(p=>p.uid)};
   });
   assert.deepEqual(again,{hp:healed.hp,money:healed.money,stocks:healed.stocks,uid:healed.uid});
   assert.deepEqual(errors,[],'no Phaser errors after center healing '+label);
   console.log('PASS CENTRO',label,'native treatment duration, actual KO/status cure, safe save and return');
  }finally{await page.close()}
 }
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
