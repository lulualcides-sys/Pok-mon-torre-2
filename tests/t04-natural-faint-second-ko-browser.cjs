'use strict';
// T04: genuine native Phaser CPU faint and automatic party switch. Low HP and
// a second Lv5 starter are fixtures, not natural route progression.
const assert=require('node:assert/strict'),fs=require('node:fs');
const fsp=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url||'/','http://127.0.0.1:4473');
 const file=path.resolve(root,'.'+(url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const data=await fsp.readFile(file);
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});
  res.end(data);
 }catch{res.writeHead(404);res.end('missing')}
});
fs.mkdirSync('test-evidence',{recursive:true});
const report={method:'T04 native Phaser CPU faint and automatic party switch. Only opening HP and party are fixtures; no injected KO, hit, win or loss',events:[]};
const persist=()=>fs.writeFileSync('test-evidence/t04-natural-faint-second-ko.json',JSON.stringify(report,null,2));
(async()=>{
 await new Promise(ok=>server.listen(4473,'127.0.0.1',ok));
 const browser=await chromium.launch({
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']
 });
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4473/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  const seeded=await page.evaluate(async()=>{
   const main=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=window.__t04core=await import(new URL('./torre2/campaign-core.js',main));
   const s=core.createCampaign('bulbasaur');
   core.storePokemon(s,1); // Mewtwo goes to PC, not the battle.
   s.team[0].hp=2; // CPU must land a real move; no poison/status damage.
   const progress=await import(new URL('./torre2/progression.js',main));
   s.team.push({id:'charmander',uid:'t04-natural-charmander',hp:100,
    progression:progress.createPokemonProgression('charmander',5)});
   s.team[1].hp=2; // second CPU KO must also be genuine.
   s.dexSeen.push('charmander');s.dexCaught.push('charmander');
   s.team.push({id:'squirtle',uid:'t04-natural-squirtle',hp:100,
    progression:progress.createPokemonProgression('squirtle',5)});
   s.dexSeen.push('squirtle');s.dexCaught.push('squirtle');
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
  // Observe the native KO callback; never replace it with a fake result.
  const tracked=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   const native=b.alKO;
   if(typeof native!=='function')throw Error('Native KO handler not installed');
   b.alKO=function(fainted){
    const before={side:fainted.lado,moveEffects:this.efectos.length,
      queuedTasks:this.tareas.length,hp:fainted.hp,phase:this.fase};
    const result=native.call(this,fainted);
    if(fainted.lado===0){
     this.__t04KoCount=(this.__t04KoCount||0)+1;
     this.__t04NaturalFaint={before,
      after:{moveEffects:this.efectos.length,queuedTasks:this.tareas.length,
       transitioning:this.__torre2Changing,phase:this.fase,
       oldMemberHp:this.datos.torre2.party.friend[0].hp}};
    }
    return result;
   };
   return {first:b.datos.p1,next:b.datos.torre2.party.friend[1]?.id,
    partySize:b.datos.torre2.party.friend.length};
  });
  assert.deepEqual(tracked,{first:'bulbasaur',next:'charmander',partySize:3});
  // Do not press an attack, change the opponent AI, set actor HP to zero,
  // or call alKO/resultado. The native Pidgey CPU must knock out Bulbasaur.
  try{
   await page.waitForFunction(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return b.scene.isActive()&&b.__t04NaturalFaint?.before.side===0&&
     b.datos.p1==='charmander'&&b.datos.torre2.party.playerIndex===1&&
     b.fase==='lucha'&&!b.__torre2Changing;
   },null,{timeout:65000,polling:40});
  }catch(err){
   const diagnostic=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    const s=window.__t04core.readCampaign();
    return {sceneActive:b.scene.isActive(),phase:b.fase,faint:b.__t04NaturalFaint,
      playerIndex:b.datos?.torre2?.party?.playerIndex,
      actor:b.luchadores?.map(x=>({id:x?.def?.id,hp:x?.hp,ko:x?.ko})),
      wins:s?.wins,losses:s?.losses};
   });
   report.events.push({error:String(err),diagnostic});persist();
   await page.screenshot({path:'test-evidence/t04-natural-faint-timeout.png'});
   throw err;
  }
  // Observe second KO without fabricating damage or changing enemy AI.
  const firstSwitch=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return {count:b.__t04KoCount,playerIndex:b.datos.torre2.party.playerIndex,
    hp:b.luchadores[0].hp,maxHp:b.luchadores[0].hpMax,
    enemyHp:b.luchadores[1].hp,phase:b.fase};
  });
  report.events.push({firstSwitch});persist();
  try{
   await page.waitForFunction(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return b.scene.isActive()&&b.__t04KoCount>=2&&
     b.datos.p1==='squirtle'&&b.datos.torre2.party.playerIndex===2&&
     b.fase==='lucha'&&!b.__torre2Changing;
   },null,{timeout:85000,polling:40});
  }catch(error){
   const diagnostic=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    const save=window.__t04core.readCampaign();
    return {active:b.scene.isActive(),phase:b.fase,
     changing:b.__torre2Changing,ballTransitions:b.__torre2BallTransitions,
     bagOpen:b.__torre2BattleBagOpen,koCount:b.__t04KoCount,
     faint:b.__t04NaturalFaint,playerIndex:b.datos?.torre2?.party?.playerIndex,
     party:b.datos?.torre2?.party?.friend?.map(m=>({id:m.id,hp:m.hp})),
     actors:b.luchadores?.map(a=>({id:a.def?.id,hp:a.hp,
      hpMax:a.hpMax,ko:a.ko,inmortal:a.inmortal,position:[a.x,a.y],
      accion:a.accion,cd:a.cd,status:a.est})),
     saved:{wins:save.wins,losses:save.losses,stage:save.stage,trainer:save.trainer}};
   });
   report.events.push({error:String(error),diagnostic});persist();
   await page.screenshot({path:'test-evidence/t04-natural-second-ko-timeout.png'});
   throw error;
  }
  const after=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   const active=b.luchadores[0],save=window.__t04core.readCampaign();
   const party=b.datos.torre2.party;
   return {faint:b.__t04NaturalFaint,playerIndex:party.playerIndex,
    oldHp:party.friend[0].hp,newId:active.def.id,
    newHp:active.hp,newMax:active.hpMax,newSprite:active.spr?.texture?.key,
    newDex:String(active.dex||''),wins:save.wins,losses:save.losses,
    stage:save.stage,trainer:save.trainer,money:save.money};
  });
  assert.equal(after.faint.before.side,0,'Only native player faint is relevant');
  assert.ok(after.faint.before.hp<=0,'No synthetic or early KO callback');
  assert.equal(after.faint.after.moveEffects,0,'Queued old attacks survived KO');
  assert.equal(after.faint.after.queuedTasks,0,'Queued old hit timers survived KO');
  assert.equal(after.faint.after.transitioning,true,'KO did not begin a native recall');
  assert.equal(after.faint.after.oldMemberHp,0);
  assert.equal(after.oldHp,0,'Fainted Pokémon cannot recover HP on recall');
  assert.equal(after.playerIndex,2);
  assert.equal(after.newId,'squirtle');
  assert.ok(after.newHp>0&&after.newHp<=after.newMax);
  assert.ok(after.newSprite?.startsWith('pmd-'+after.newDex+'-'),
    'New fighter must render its own PMD sprite');
  assert.equal(after.wins,seeded.wins);
  assert.equal(after.losses,seeded.losses);
  assert.equal(after.stage,seeded.stage);
  assert.equal(after.trainer,seeded.trainer);
  assert.equal(after.money,seeded.money);
  assert.deepEqual(errors,[],'Uncaught browser errors during native KO/recall');
  report.events.push({tracked,after});persist();
  await page.screenshot({path:'test-evidence/t04-natural-faint-second-ko.png'});
  console.log('T04 PASS: two real CPU KOs -> native recalls -> Squirtle; no old hits/tasks, no fabricated progression');
 }finally{persist();await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;persist();server.close();});
