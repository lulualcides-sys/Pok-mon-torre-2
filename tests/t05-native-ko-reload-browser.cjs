'use strict';
// T05: genuine native Phaser CPU KO and full browser reload. Low HP and
// pre-existing poison are fixtures, not natural route progression.
const assert=require('node:assert/strict'),fs=require('node:fs');
const fsp=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url||'/','http://127.0.0.1:4435');
 const file=path.resolve(root,'.'+(url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const data=await fsp.readFile(file);
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});
  res.end(data);
 }catch{res.writeHead(404);res.end('missing')}
});
fs.mkdirSync('test-evidence',{recursive:true});
const report={method:'Native Phaser CPU KO with low-HP and status fixtures; no forced KO, damage, XP, win or loss',events:[]};
const persist=()=>fs.writeFileSync('test-evidence/t05-native-ko-reload.json',JSON.stringify(report,null,2));
(async()=>{
 await new Promise(ok=>server.listen(4435,'127.0.0.1',ok));
 const browser=await chromium.launch({
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']
 });
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4435/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  const seeded=await page.evaluate(async()=>{
   const main=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=window.__t05core=await import(new URL('./torre2/campaign-core.js',main));
   const s=core.createCampaign('bulbasaur');
   core.storePokemon(s,1); // Mewtwo goes to PC, not the battle.
   s.team[0].hp=2;s.team[0].status={kind:'veneno',elapsed:2};
   core.saveCampaign(s);
   const b=core.readCampaign();
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
   return {uid:b.team[0].uid,stage:b.stage,trainer:b.trainer,
    wins:b.wins,losses:b.losses,money:b.money,
    box:b.box.map(x=>({id:x.id,uid:x.uid}))};
  });
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('campanha')&&
   !!window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,
   null,{timeout:60000});
  const p=await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   const o=c.children.list.find(x=>x.active&&x.input?.enabled&&
    x.getData?.('torre2-central-cta')===true);
   if(!o)throw Error('Missing native trainer CTA');
   const r=document.querySelector('#juego canvas').getBoundingClientRect();
   return {x:r.left+o.x*r.width/640,y:r.top+o.y*r.height/360};
  });
  await page.mouse.move(p.x,p.y);await page.mouse.down();
  await page.waitForTimeout(95);await page.mouse.up();
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.fase==='lucha'&&b.__torre2PartyInstalled;
  },null,{timeout:65000});
  const fight=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return {p1:b.datos.p1,p2:b.datos.p2,initialHp:b.luchadores[0].hp};
  });
  assert.equal(fight.p1,'bulbasaur');assert.equal(fight.p2,'pidgey');
  assert.ok(fight.initialHp>0);
  report.events.push({seeded,fight});persist();
  // No attack input, forced KO, or direct result API call.
  await page.waitForFunction(losses=>{
   const s=window.__t05core.readCampaign();
   return window.__pt2Game.scene.isActive('campanha')&&s.losses>losses;
  },seeded.losses,{timeout:180000,polling:300});
  const lost=await page.evaluate(()=>{
   const core=window.__t05core,s=core.readCampaign();
   return {raw:localStorage.getItem(core.SAVE_KEY),uid:s.team[0].uid,
    hp:s.team[0].hp,status:s.team[0].status,stage:s.stage,trainer:s.trainer,
    wins:s.wins,losses:s.losses,money:s.money,
    box:s.box.map(x=>({id:x.id,uid:x.uid})),active:s.active};
  });
  assert.equal(lost.losses,seeded.losses+1);
  assert.equal(lost.wins,seeded.wins);
  assert.equal(lost.trainer,seeded.trainer);
  assert.equal(lost.stage,seeded.stage);
  assert.equal(lost.money,seeded.money);
  assert.equal(lost.uid,seeded.uid);
  assert.ok(lost.hp<=35,'Defeat cannot restore full HP');
  assert.deepEqual(lost.box,seeded.box);
  report.events.push({lost});persist();
  await page.screenshot({path:'test-evidence/t05-native-ko-after-loss.png'});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  const loaded=await page.evaluate(async()=>{
   const main=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=await import(new URL('./torre2/campaign-core.js',main));
   const s=core.readCampaign();
   return {raw:localStorage.getItem(core.SAVE_KEY),uid:s.team[0].uid,
    hp:s.team[0].hp,status:s.team[0].status,stage:s.stage,trainer:s.trainer,
    wins:s.wins,losses:s.losses,money:s.money,
    box:s.box.map(x=>({id:x.id,uid:x.uid})),active:s.active};
  });
  assert.deepEqual(loaded,lost,'Native defeat must survive full Phaser reload');
  assert.deepEqual(errors,[]);
  report.events.push({loaded});persist();
  console.log('T05 NATIVE KO + RELOAD PASS',JSON.stringify({
   loss:{hp:lost.hp,status:lost.status,losses:lost.losses},
   sameBytes:loaded.raw===lost.raw}));
 }finally{persist();await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;persist();server.close();});
