'use strict';
/* Section 20: actual wild Pokeball menu and genuine rival defeat/Center retry.
 * No forced HP, KOs, capture RNG, battle wins, money, trainer progress or XP.
 * The rival starts at trainer 12 AS AN EXPLICIT FIXTURE: this is not a
 * substitute for the separate 12-battle natural-play evidence (PR #30).
 */
const assert=require('node:assert/strict'),fs=require('node:fs'),fsp=require('node:fs/promises');
const path=require('node:path'),http=require('node:http'),{chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg',
 '.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/', 'http://127.0.0.1');
 const p=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!p.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const data=await fsp.readFile(p);res.writeHead(200,{'content-type':mime[path.extname(p)]||'application/octet-stream'});res.end(data)}
 catch{res.writeHead(404);res.end('missing')}
});
async function setup(page,trainer=0){
 await page.goto('http://127.0.0.1:4326/arena2d/?original=1',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:45000});
 await page.evaluate(async(trainer)=>{
  const main=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
  const core=window.kanto=await import(new URL('./torre2/campaign-core.js',main));
  const s=core.createCampaign('bulbasaur');
  core.saveCampaign(s);core.storePokemon(s,1); // Mewtwo tester is in PC
  if(trainer) {s.trainer=trainer;core.saveCampaign(s);} // isolated fixture
  window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
 },trainer);
 await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
  !!window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,null,{timeout:45000});
}
async function tap(page,x,y){
 const point=await page.evaluate(([x,y])=>{
  const box=document.querySelector('#juego canvas').getBoundingClientRect();
  return {x:box.x+x*box.width/640,y:box.y+y*box.height/360};
 },[x,y]);
 await page.mouse.click(point.x,point.y);
}
async function sync(page){await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))}
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(r=>server.listen(4326,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
   '--use-gl=angle','--use-angle=swiftshader']});
 const output={capture:{},recovery:{},method:'Native Phaser + actual mouse clicks; no RNG override; rival stage fixture explicitly marked'};
 try{
 // Actual tall-grass wild game flow.
 {
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  try{
   await setup(page);
   await page.evaluate(()=>{
    const s=window.kanto.readCampaign();
    window.__pt2Game.scene.getScene('campanha').grassScreen(s);
   });
   await sync(page);await tap(page,465,292); // 'PROCURAR POKÉMON'
   await page.waitForFunction(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return b.scene.isActive()&&b.fase==='lucha'&&b.__torre2WildCapture;
   },null,{timeout:60000});
   const before=await page.evaluate(()=>{
    const c=window.kanto.readCampaign(),b=window.__pt2Game.scene.getScene('combate');
    return {species:c.pendingWild?.id,balls:c.inventory.pokeball,
     stage:c.stage,trainer:c.trainer,wins:c.wins,losses:c.losses,money:c.money,
     activeSpecies:b.datos.p1,enemySpecies:b.datos.p2,team:c.team.length,pc:c.box.map(m=>m.id)};
   });
   assert.equal(before.balls,5);assert.equal(before.team,1);
   assert.equal(before.activeSpecies,'bulbasaur');
   assert.equal(before.enemySpecies,before.species);
   await sync(page);await tap(page,470,61); // 'CAPTURAR' shown by wild Phaser HUD
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').fase==='torre2-aim',null,{timeout:7000});
   await page.screenshot({path:'test-evidence/section20-wild-pokeball-menu.png'});
   await sync(page);await tap(page,316,186); // normal Poké Ball x5 (not RNG override)
   await page.waitForFunction(()=>window.kanto.readCampaign()?.inventory?.pokeball===4,null,{timeout:12000});
   await page.waitForFunction(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return window.__pt2Game.scene.isActive('campanha')||
     (b.scene.isActive()&&b.fase==='lucha'&&!b.__torre2CaptureBusy);
   },null,{timeout:20000});
   const after=await page.evaluate(()=>{
    const s=window.kanto.readCampaign();
    return {balls:s.inventory.pokeball,team:s.team.map(m=>m.id),box:s.box.map(m=>m.id),
     stage:s.stage,trainer:s.trainer,wins:s.wins,losses:s.losses,money:s.money,
     stillWild:!!s.pendingWild,lastMessage:s.lastMessage};
   });
   assert.equal(after.balls,4,'One real throw consumes exactly one Poké Ball');
   assert.equal(after.trainer,before.trainer);assert.equal(after.stage,before.stage);
   assert.equal(after.money,before.money);
   assert.equal(after.team[0],'bulbasaur');
   assert.deepEqual(after.box,['mewtwo']);
   const caught=after.team.includes(before.species);
   if(caught){assert.equal(after.team.length,2);assert.equal(after.stillWild,false)}
   else{assert.equal(after.team.length,1);assert.equal(after.stillWild,true)}
   assert.deepEqual(errors,[]);
   output.capture={before,after,caught,probabilistic:true};
   await page.screenshot({path:'test-evidence/section20-wild-one-real-throw.png'});
   console.log('PASS REAL WILD POKEBALL',JSON.stringify(output.capture));
  }finally{await page.close()}
 }
 // Actual loss and recovery/retry route; no direct HP changes or forced loss.
 {
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  try{
   await setup(page,12); // fixture for rival, not real completed route
   const before=await page.evaluate(()=>{
    const s=window.kanto.readCampaign();
    return {stage:s.stage,trainer:s.trainer,money:s.money,wins:s.wins,losses:s.losses,
     hp:s.team[0].hp,level:s.team[0].progression.level,pc:s.box.map(x=>x.id)};
   });
   await sync(page);
   const point=await page.evaluate(()=>{
    const c=window.__pt2Game.scene.getScene('campanha'),z=c.children.list.find(o=>o.active&&o.getData?.('torre2-central-cta'));
    if(!z)throw Error('No route CTA');
    return [z.x,z.y];
   });
   await tap(page,point[0],point[1]);
   await page.waitForFunction(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return b.scene.isActive()&&b.fase==='lucha'&&b.__torre2AutoMode?.zone?.active;
   },null,{timeout:60000});
   const enemy=await page.evaluate(()=>window.__pt2Game.scene.getScene('combate').datos.p2);
   assert.equal(enemy,'charmander');
   const auto=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate'),r=document.querySelector('#juego canvas').getBoundingClientRect(),z=b.__torre2AutoMode.zone;
    return [z.x,z.y];
   });
   await tap(page,auto[0],auto[1]);
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').__torre2AutoMode?.enabled,null,{timeout:5000});
   await page.waitForFunction(()=>{
    const s=window.kanto.readCampaign();
    return window.__pt2Game.scene.isActive('campanha')&&(s.losses>0||s.wins>0);
   },null,{timeout:120000});
   const outcome=await page.evaluate(()=>{
    const s=window.kanto.readCampaign();
    return {wins:s.wins,losses:s.losses,stage:s.stage,trainer:s.trainer,
     money:s.money,hp:s.team[0].hp,pc:s.box.map(x=>x.id)};
   });
   if(outcome.losses!==1)throw Error('Rival fixture unexpectedly won; diagnostic '+JSON.stringify(outcome));
   assert.equal(outcome.wins,0);assert.equal(outcome.trainer,12);
   assert.equal(outcome.stage,0);assert.equal(outcome.money,before.money);
   assert.equal(outcome.hp,0);assert.deepEqual(outcome.pc,['mewtwo']);
   const startedHeal=Date.now();
   // Navigate into the genuine Center screen; click the actual native heal
   // control. Do not invoke healTeam or change member.hp from the test.
   await page.evaluate(()=>{
    const s=window.kanto.readCampaign();
    window.__pt2Game.scene.getScene('campanha').centerScreen(s);
   });
   await sync(page);await tap(page,320,154);
   await page.waitForFunction(()=>window.kanto.readCampaign()?.team?.every(m=>m.hp===100&&m.status===null),null,{timeout:12000});
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha').__torre2BattlePath&&
    !window.__pt2Game.scene.getScene('campanha').__torre2CenterBusy,null,{timeout:12000});
   const healed=await page.evaluate(()=>{
    const s=window.kanto.readCampaign();return {hp:s.team[0].hp,trainer:s.trainer,stage:s.stage,
     wins:s.wins,losses:s.losses,money:s.money,pc:s.box.map(x=>x.id)};
   });
   output.recovery={before,outcome,healed};
   fs.writeFileSync('test-evidence/section20-rival-healed-save.json',JSON.stringify(output.recovery,null,2));
   assert.equal(healed.hp,100);assert.equal(healed.trainer,12);
   assert.equal(healed.wins,0);assert.equal(healed.losses,1);
   assert.equal(healed.money,before.money);assert.deepEqual(healed.pc,['mewtwo']);
   // The same real Rival remains the next fight; continue the story on retry.
   await sync(page);
   const retry=await page.evaluate(()=>{
    const c=window.__pt2Game.scene.getScene('campanha'),z=c.children.list.find(o=>o.active&&o.getData?.('torre2-central-cta'));
    if(!z)throw Error('Retry CTA missing after healing');
    return [z.x,z.y];
   });
   await tap(page,retry[0],retry[1]);
   await page.waitForFunction(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return b.scene.isActive()&&b.fase==='lucha'&&b.datos.p2==='charmander';
   },null,{timeout:60000});
   const retried=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate'),s=window.kanto.readCampaign();
    return {player:b.datos.p1,enemy:b.datos.p2,trainer:s.trainer,
     hp:s.team[0].hp,losses:s.losses};
   });
   assert.equal(retried.player,'bulbasaur');
   assert.equal(retried.trainer,12);
   assert.equal(retried.hp,100);assert.equal(retried.losses,1);
   await page.screenshot({path:'test-evidence/section20-rival-retry-after-real-loss-and-center.png'});
   assert.deepEqual(errors,[]);
   output.recovery={before,outcome,healed,retried,healElapsedMs:Date.now()-startedHeal,
     fixture:'Rival checkpoint staged at trainer=12; battle damage and defeat are genuine'};
   console.log('PASS REAL RIVAL LOSS-CENTER-RETRY',JSON.stringify(output.recovery));
  }finally{await page.close()}
 }
 }finally{
  fs.writeFileSync('test-evidence/section20-wild-recovery-results.json',JSON.stringify(output,null,2));
  await browser.close();server.close();
 }
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
