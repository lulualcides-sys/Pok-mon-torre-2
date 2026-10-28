'use strict';
// T12: after strategic trainer recall, the ORIGINAL Poké Arena CPU must be
// consulted again. Never inject an attack, win, HP loss, EXP, or switch event.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1');
 const file=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const bytes=await fsp.readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(bytes)}
 catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(ok=>server.listen(4442,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4442/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   window.t12Core=await import(new URL('./torre2/campaign-core.js',src));
   const state=t12Core.createCampaign('bulbasaur');
   t12Core.saveCampaign(state);
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'),null,{timeout:60000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const {prepareLaboratoryMatch}=await import(new URL('./torre2/laboratory.js',src));
   const {resolveLoadout}=await import(new URL('./torre2/move-pool.js',src));
   const scenario=prepareLaboratoryMatch({player:'squirtle',enemy:'charmander',level:50});
   scenario.torre2.stage=2;
   scenario.torre2.party.strategic=true;
   scenario.torre2.party.trainerItems={};
   scenario.torre2.party.foes[1]={id:'bulbasaur',hp:73,level:50,
    loadout:resolveLoadout({id:'bulbasaur',progression:{species:'bulbasaur',level:50}})};
   window.__pt2Game.scene.getScene('campanha').launchBattle(scenario,false);
  });
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.__torre2TrainerStrategy&&b.fase==='lucha'&&
    b.controles[1]?.leer&&b.luchadores?.[1]&&!b.__torre2Changing;
  },null,{timeout:65000});
  const before=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   const [player,enemy]=b.luchadores;
   player.inmortal=true;enemy.inmortal=true;
   player.energia=100;
   // Stop only the human's commands; preserve original CPU controls.
   b.controles[0].leer=()=>({mx:0,my:0,ax:enemy.x,ay:enemy.y});
   // Start trainer strategy at its legal 8s boundary. Neither attacks,
   // enemy types, nor the switching decision are directly modified.
   b.t=8;
   b.__torre2TrainerStrategy.nextCheck=8;
   b.__torre2TrainerStrategy.nextSwitch=8;
   const state=window.t12Core.readCampaign();
   return {enemy:enemy.def.id,player:player.def.id,strategic:b.__torre2TrainerStrategy.enabled,
    index:b.datos.torre2.party.enemyIndex,
    save:{wins:state.wins,losses:state.losses,stage:state.stage,
     trainer:state.trainer,money:state.money,party:state.team.map(m=>m.uid)}};
  });
  assert.equal(before.strategic,true);
  assert.equal(before.enemy,'charmander');
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.datos.torre2.party.enemyIndex===1&&!b.__torre2Changing&&
    b.fase==='lucha'&&b.luchadores[1]?.def.id==='bulbasaur';
  },null,{timeout:26000});
  const switched=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),foe=b.luchadores[1];
   const control=b.controles[1];
   if(typeof control?.leer!=='function')throw Error('Native trainer controller missing');
   const reader=control.leer;
   window.t12AIReads=0;
   window.t12AIInputs=[];
   control.leer=function(...args){
    const value=reader.apply(this,args);
    window.t12AIReads++;
    if(value&&window.t12AIInputs.length<32)window.t12AIInputs.push(Object.keys(value));
    return value;
   };
   foe.inmortal=true;
   b.luchadores[0].inmortal=true;
   return {id:foe.def.id,actualHp:foe.hp,maxHp:foe.hpMax,
    index:b.datos.torre2.party.enemyIndex,switches:b.__torre2TrainerStrategy.switches,
    nextCheck:b.__torre2TrainerStrategy.nextSwitch,sceneTime:b.t,
    loadout:Object.entries(foe.kit).filter(([key,m])=>['lmb','rmb','q','e'].includes(key)&&m?.forma)
      .map(([slot,m])=>({slot,id:m.nombre,form:m.forma,locked:m.pendiente}))};
  });
  assert.equal(switched.id,'bulbasaur');
  assert.equal(switched.index,1);
  assert.equal(switched.switches,1);
  assert.ok(Math.abs(switched.actualHp-switched.maxHp*.73)<2);
  assert.ok(switched.nextCheck>switched.sceneTime,'Trainer strategy cooldown must be active');
  assert.ok(switched.loadout.some(m=>!m.locked&&m.form),
   'Trainer reserve should have real usable installed attacks');
  await page.waitForFunction(()=>window.t12AIReads>=30,null,{timeout:15000});
  const active=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),foe=b.luchadores[1];
   return {reads:window.t12AIReads,inputs:window.t12AIInputs,
    index:b.datos.torre2.party.enemyIndex,id:foe.def.id,
    switches:b.__torre2TrainerStrategy.switches,
    actualHp:foe.hp,stage:b.datos.torre2.stage};
  });
  assert.ok(active.reads>=30,'The real native CPU controller must resume after strategic recall');
  assert.ok(active.inputs.length>0,'Original CPU must generate native input objects');
  assert.equal(active.index,1);
  assert.equal(active.id,'bulbasaur');
  assert.equal(active.switches,1,'AI must not repeat a recall inside 20s');
  const endSave=await page.evaluate(()=>{
   const s=window.t12Core.readCampaign();
   return {wins:s.wins,losses:s.losses,stage:s.stage,trainer:s.trainer,
    money:s.money,party:s.team.map(m=>m.uid)};
  });
  assert.deepEqual(endSave,before.save,'Trainer decision fixture cannot alter campaign save');
  assert.deepEqual(errors,[],'No native Phaser error');
  await page.screenshot({path:'test-evidence/t12-trainer-native-ai-after-switch.png'});
  const report={scope:'T12 real trainer CPU resumes native input after strategic recall',
   fixture:'Laboratory match, rival type matchup, trainer clock 8s, immortality; NO forced attack/win',
   before,switched,active,endSave};
  fs.writeFileSync('test-evidence/t12-trainer-native-ai.json',JSON.stringify(report,null,2));
  console.log('T12 TRAINER SWITCH/AI RESUME PASS',JSON.stringify({
   reserve:active.id,reads:active.reads,switches:active.switches,stage:active.stage
  }));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
