'use strict';
// T19: two NORMAL Phaser/CPU fights in Cerulean, using real menu taps + AUTO.
// Only the initial post-Brock checkpoint/team level is a prepared fixture;
// no fabricated hit, KO, XP, payment, result, or win. No game source edits.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
// A hung native Chromium/WebGL test must produce diagnostics instead of
// occupying Actions until its 40-minute job limit. No result manipulation.
const startedAt=Date.now();
let checkpoint='init', lastBattle=null;
const heartbeat=setInterval(()=>console.log('T19 HEARTBEAT',JSON.stringify({
 checkpoint,elapsedMs:Date.now()-startedAt,lastBattle
})),20000);heartbeat.unref();
const watchdog=setTimeout(()=>{
 const data={checkpoint,elapsedMs:Date.now()-startedAt,lastBattle,
  explanation:'Native battle/Chromium did not complete within 11 minutes; no victory asserted'};
 try{fs.mkdirSync('test-evidence',{recursive:true});
  fs.writeFileSync('test-evidence/t19-runner-watchdog.json',JSON.stringify(data,null,2));}catch{}
 console.error('T19 WATCHDOG FAILED',JSON.stringify(data));
 process.exit(124); // never pass an incomplete combat test
},11*60*1000);watchdog.unref();
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg',
 '.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1');
 const filename=path.resolve(root,'.'+(u.pathname.endsWith('/')?
  u.pathname+'index.html':u.pathname));
 if(!filename.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const b=await fsp.readFile(filename);res.writeHead(200,
  {'content-type':mime[path.extname(filename)]||'application/octet-stream'});res.end(b)}
 catch{res.writeHead(404);res.end('not found')}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(ok=>server.listen(4481,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 const report={scope:'T19 two normal Cerulean checkpoint fights with native AUTO',
  checkpointFixture:'post-Brock stage1 with Lv20 Wartortle; earlier wins/badge prepared, not earned in this test',
  fights:[],naturalFromCheckpoint:true,wholeCampaignNatural:false};
 let page=null;
 try{
  page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  checkpoint='page navigation';
  await page.goto('http://127.0.0.1:4481/arena2d/?original=1',
   {waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),
   null,{timeout:60000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=window.t19Core=await import(new URL('./torre2/campaign-core.js',src));
   const {createPokemonProgression}=await import(new URL('./torre2/progression.js',src));
   const st=core.createCampaign('squirtle');
   core.saveCampaign(st);
   core.storePokemon(st,1);
   st.stage=1;st.trainer=0;st.wins=14;st.badges=['Rocha'];
   st.team[0].id='wartortle';
   st.team[0].progression=createPokemonProgression('wartortle',20);
   st.team[0].hp=100;st.team[0].moves=[];st.team[0].tmMoves=[];
   core.saveCampaign(st);
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return c.scene.isActive()&&!!c.__torre2BattlePath;
  },null,{timeout:60000});
  const game=()=>page.evaluate(()=>{
   const s=window.t19Core.readCampaign();
   return {stage:s.stage,trainer:s.trainer,wins:s.wins,losses:s.losses,
    money:s.money,badges:[...s.badges],honors:[...s.leagueHonors],
    inventory:{...s.inventory},team:s.team.map(m=>({id:m.id,uid:m.uid,
     level:m.progression?.level,hp:m.hp})),
    box:s.box.map(m=>m.uid)};
  });
  const clickData=async(key,value)=>{
   const pos=await page.evaluate(([key,value])=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    const z=c.children.list.find(o=>o.active&&o.input?.enabled&&
     o.getData?.(key)===value);
    if(!z)throw Error('Missing native checkpoint UI '+key);
    const rect=document.querySelector('#juego canvas').getBoundingClientRect();
    return {x:rect.x+rect.width*z.x/640,y:rect.y+rect.height*z.y/360};
   },[key,value]);
   await page.mouse.click(pos.x,pos.y);
  };
  let before=await game();
  assert.equal(before.stage,1);
  assert.equal(before.trainer,0);
  assert.equal(before.wins,14);
  assert.deepEqual(before.team.map(m=>m.id),['wartortle']);
  assert.equal(before.team[0].level,20);
  assert.equal(before.box.length,1);
  for(let round=0;round<2;round++){
   checkpoint='route menu for Cerulean fight '+(round+1);
   const foe=await page.evaluate(()=>window.t19Core.currentOpponent(window.t19Core.readCampaign()));
   assert.equal(foe.id,['zubat','geodude'][round],
    'Cerulean early route opponent mismatch');
   assert.equal(foe.kind,'trainer');
   const record={fight:round+1,foe:foe.id,level:foe.level,before};
   report.fights.push(record);
   checkpoint='starting native fight '+(round+1);
   await clickData('torre2-central-cta',true);
   await page.waitForFunction(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return b.scene.isActive()&&b.fase==='lucha'&&
     b.__torre2PartyInstalled&&b.__torre2AutoMode?.zone?.input?.enabled;
   },null,{timeout:65000});
   const start=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    const rect=document.querySelector('#juego canvas').getBoundingClientRect();
    const z=b.__torre2AutoMode.zone;
    return {p1:b.datos.p1,p2:b.datos.p2,
     playerLevel:b.datos.torre2.playerLevel,
     enemyLevel:b.datos.torre2.enemyLevel,
     enabled:b.__torre2AutoMode.enabled,
     button:{x:rect.x+rect.width*z.x/640,y:rect.y+rect.height*z.y/360}};
   });
   assert.equal(start.p1,'wartortle');assert.equal(start.p2,foe.id);
   assert.equal(start.playerLevel,before.team[0].level);
   assert.equal(start.enabled,false,'AUTO must reset between fights');
   checkpoint='enabling AUTO '+(round+1);
   await page.mouse.click(start.button.x,start.button.y);
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').__torre2AutoMode.enabled,
    null,{timeout:8000});
   record.open=start;delete record.open.button;
   await page.screenshot({path:'test-evidence/t19-cerulean-fight-'+(round+1)+'-started.png'});
   try{
    checkpoint='live native combat '+(round+1);
    console.log('T19 NATIVE FIGHT START',JSON.stringify({round:round+1,foe:foe.id,player:'wartortle',level:start.playerLevel,enemyLevel:start.enemyLevel}));
    await page.waitForFunction(expected=>{
     const s=window.t19Core.readCampaign();
     return window.__pt2Game.scene.isActive('campanha')&&s?.wins===expected;
    },before.wins+1,{timeout:240000,polling:250});
   }catch(err){
    record.failure=String(err);
    record.state=await game();
    record.combat=await page.evaluate(()=>{
     const b=window.__pt2Game.scene.getScene('combate');
     return {active:b.scene.isActive(),phase:b.fase,
      actors:b.luchadores?.map(a=>({id:a.def?.id,hp:a.hp,max:a.hpMax})),
      auto:b.__torre2AutoMode?.enabled};
    });
    fs.writeFileSync('test-evidence/t19-two-cerulean-fights.json',JSON.stringify(report,null,2));
    await page.screenshot({path:'test-evidence/t19-cerulean-failure.png'});
    throw Error('T19 NATURAL FIGHT FAILED '+JSON.stringify(record));
   }
   const after=await game();
   checkpoint='battle result '+(round+1);
   record.after=after;lastBattle={round:round+1,enemy:foe.id,wins:after.wins,losses:after.losses};
   assert.equal(after.stage,1,'Premature gym progression');
   assert.equal(after.trainer,before.trainer+1);
   assert.equal(after.wins,before.wins+1);
   assert.equal(after.losses,before.losses);
   assert.equal(after.money,before.money+240,'Cerulean trainer standard reward');
   assert.deepEqual(after.badges,before.badges,'No second gym badge before Misty');
   assert.deepEqual(after.honors,before.honors);
   assert.deepEqual(after.box,before.box);
   assert.equal(after.team.length,1);
   assert.equal(after.team[0].uid,before.team[0].uid);
   assert.equal(after.team[0].hp,100,'Natural postfight heal');
   assert.equal(after.inventory.tms.length,before.inventory.tms.length,
    'No gym reward before leader KO');
   await page.screenshot({path:'test-evidence/t19-cerulean-fight-'+(round+1)+'-victory.png'});
   console.log('T19 REAL CERULEAN VICTORY',JSON.stringify({
    index:round+1,opponent:foe.id,from:before.trainer,to:after.trainer,
    level:after.team[0].level,money:after.money
   }));
   fs.writeFileSync('test-evidence/t19-two-cerulean-fights.json',JSON.stringify(report,null,2));
   if(round===0){
    await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')
     .children.list.some(o=>o.active&&o.getData?.('torre2-report-continue')===true),
     null,{timeout:15000});
    await clickData('torre2-report-continue',true);
    await page.waitForFunction(()=>!window.__pt2Game.scene.getScene('campanha')
     .children.list.some(o=>o.active&&o.getData?.('torre2-report-continue')===true),
     null,{timeout:12000});
   }
   before=after;
  }
  assert.equal(report.fights.length,2);
  assert.deepEqual(errors,[],'Native Phaser errors in consecutive Cerulean fights');
  console.log('T19 TWO NATIVE CERULEAN FIGHTS PASS: real AUTO combat, XP, money and saves');
  checkpoint='both real fights proved';
 }finally{
  checkpoint='closing browser after real victories';
  try{if(page&&!page.isClosed())await page.close();}
  finally{
   await browser.close();
   await new Promise(done=>server.close(done));
   clearInterval(heartbeat);
   clearTimeout(watchdog);
  }
 }
})().catch(e=>{console.error(e);process.exitCode=1;clearInterval(heartbeat);clearTimeout(watchdog);if(server.listening)server.close()});
