'use strict';
/* T07: three REAL original Phaser battles earn Lv8 and its charged ULT.
 * No forced KO, no fighter HP override, no instant-win, no arbitrary level.
 * A brand-new single Bulbasaur starts at Lv5; no debug Mewtwo exists.
 * After native XP, training battle uses the game-approved full meter, NOT a
 * test-injected meter; native touchscreen E must execute the actual ULT.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const path=require('node:path'),http=require('node:http'),{chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg',
 '.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1');
 const p=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!p.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const b=await fsp.readFile(p);res.writeHead(200,{'content-type':types[path.extname(p)]||'application/octet-stream'});res.end(b)}
 catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 const out='test-evidence';fs.mkdirSync(out,{recursive:true});
 await new Promise(ok=>server.listen(4322,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
  '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const report={method:'Native Phaser live AUTO, no HP/KO/result cheats; fresh Lv5 starter, 3 trainers; native training meter to cast earned Lv8 E',steps:[]};
 const saveReport=()=>fs.writeFileSync(out+'/t07-natural-earned-lv8-ult.json',JSON.stringify(report,null,2));
 const game=()=>page.evaluate(()=>{
  const s=window.kanto.readCampaign();return {
   trainer:s?.trainer,wins:s?.wins,losses:s?.losses,stage:s?.stage,money:s?.money,
   team:s?.team?.map(m=>({id:m.id,uid:m.uid,hp:m.hp,level:m.progression?.level,experience:m.progression?.experience})), 
   box:s?.box?.map(m=>m.id)
  };
 });
 const tagPoint=async id=>page.evaluate(id=>{
  const scene=window.__pt2Game.scene.getScene('campanha');
  const input=scene.children.list.find(o=>o.active&&o.input?.enabled&&o.getData?.(id)===true);
  if(!input)throw Error('Missing clickable Phaser UI '+id);
  const rect=document.querySelector('#juego canvas').getBoundingClientRect();
  return {x:rect.x+input.x*rect.width/640,y:rect.y+input.y*rect.height/360}
 },id);
 const clickTag=async id=>{
  await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
  const p=await tagPoint(id);
  await page.mouse.click(p.x,p.y);
 };
 try{
  await page.goto('http://127.0.0.1:4322/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:50000});
  await page.evaluate(async()=>{
   const main=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=window.kanto=await import(new URL('./torre2/campaign-core.js',main));
   window.moves=await import(new URL('./torre2/move-pool.js',main));
   const s=core.createPlayerCampaign('bulbasaur');
   core.saveCampaign(s);
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
   !!window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,null,{timeout:45000});
  let before=await game();
  assert.equal(before.stage,0);assert.equal(before.trainer,0);assert.equal(before.wins,0);
  assert.deepEqual(before.team.map(x=>x.id),['bulbasaur']);
  assert.equal(before.team[0].level,5);
  assert.deepEqual(before.box,[],'A fresh game has no debug Mewtwo');
  const firstKit=await page.evaluate(()=>window.moves.resolveLoadout(window.kanto.readCampaign().team[0]));
  assert.ok(['lmb','rmb','q'].every(slot=>firstKit[slot]?.forma&&!firstKit[slot]?.pendiente),
   'Legitimate Lv5 starter must have three usable native attacks');
  assert.equal(firstKit.e,undefined,'Legitimate Lv5 starter cannot equip ULT');
  report.earnedUlt={initial:{level:5,experience:before.team[0].experience,ultLocked:true},unlockedAt:null};
  const names=['pidgey','rattata','caterpie'];
 const total=3;
  for(let round=0;round<total;round++){
   const opponent=await page.evaluate(()=>window.kanto.currentOpponent(window.kanto.readCampaign()));
   const entry={round:round+1,expected:opponent.id,role:opponent.kind,before};report.steps.push(entry);
   if(round<names.length)assert.equal(opponent.id,names[round],
    'First three route species must match Route 1');
   assert.ok(opponent.id,'Every route checkpoint must expose actual species');
   const expectedKind='trainer';
   assert.equal(opponent.kind,expectedKind,'Early route trainer roles must stay canonical');
   await clickTag('torre2-central-cta');
   await page.waitForFunction(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return b.scene.isActive()&&b.fase==='lucha'&&b.__torre2PartyInstalled&&b.__torre2AutoMode?.zone?.active;
   },null,{timeout:60000});
   entry.open=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return {player:b.datos.p1,enemy:b.datos.p2,
      level:b.datos.torre2.playerLevel,enemyLevel:b.datos.torre2.enemyLevel,
      party:b.datos.torre2.party.foes.map(m=>m.id),auto:b.__torre2AutoMode.enabled};
   });
   assert.equal(entry.open.player,before.team[0].id);
   assert.equal(entry.open.enemy,opponent.id,'Expected next real route trainer');
   // Campaign AUTO is deliberately ON by default. Clicking the toggle
   // here would turn it OFF and invalidate this natural-XP battle proof.
   // Leave the user's default untouched; only read the native Phaser state.
   assert.equal(entry.open.auto,true,'Campaign AUTO must start enabled');
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').__torre2AutoMode?.enabled,
    null,{timeout:5000});
   await page.screenshot({path:out+'/natural-route1-trainer-'+(round+1)+'-combat.png'});
   const started=Date.now();
   try{
    await page.waitForFunction(round=>{
     const s=window.kanto.readCampaign();
     return window.__pt2Game.scene.isActive('campanha')&&s?.wins===round+1;
    },round,{timeout:240000,polling:250});
   }catch(error){
    entry.failedReason=String(error);
    entry.game=await game();
    entry.battle=await page.evaluate(()=>{
     const b=window.__pt2Game.scene.getScene('combate');
     return {active:b.scene.isActive(),phase:b.fase,
      hp:b.luchadores?.map(m=>({hp:m.hp,hpMax:m.hpMax})),
      playerIndex:b.datos?.torre2?.party?.playerIndex,
      enemyIndex:b.datos?.torre2?.party?.enemyIndex};
    });
    await page.screenshot({path:out+'/natural-route1-trainer-'+(round+1)+'-failure.png'});
    saveReport();
    throw new Error('Natural training ladder failed at '+(round+1)+': '+JSON.stringify(entry));
   }
   entry.seconds=Math.round((Date.now()-started)/100)/10;
   entry.after=await game();
   assert.equal(entry.after.stage,0);
   assert.equal(entry.after.trainer,round+1);
   assert.equal(entry.after.wins,round+1);
   assert.equal(entry.after.losses,0);
   const payout=opponent.kind==='rival'?460:opponent.kind==='rocket'?360:180;
   assert.equal(entry.after.money,before.money+payout,'Real trainer/Rocket/Rival payout');
   assert.ok(entry.after.team[0].experience>before.team[0].experience,
    'Each genuine trainer victory must award starter XP');
   assert.ok(entry.after.team[0].level>=before.team[0].level,
    'Genuine XP must never reduce the starter level');
   const earnedKit=await page.evaluate(()=>{
    const member=window.kanto.readCampaign().team[0],kit=window.moves.resolveLoadout(member);
    return {level:member.progression.level,experience:member.progression.experience,
     slots:Object.fromEntries(['lmb','rmb','q','e'].map(slot=>[slot,kit[slot]?{
      id:kit[slot].id,name:kit[slot].nombre,ulti:kit[slot].ulti===true,
      pending:kit[slot].pendiente===true,practice:kit[slot].torre2IntroPractice===true,
      renderable:Boolean(kit[slot].forma)}:null]))};
   });
   entry.earnedKit=earnedKit;
   assert.ok(['lmb','rmb','q'].every(slot=>earnedKit.slots[slot]?.renderable&&!earnedKit.slots[slot]?.pending),
    'Natural XP cannot remove three starter attack controls');
   if(earnedKit.level<8)assert.equal(earnedKit.slots.e,null,'ULT unlocked before earned Lv8');
   else {
    assert.ok(earnedKit.slots.e?.ulti&&earnedKit.slots.e?.renderable&&!earnedKit.slots.e?.pending,
     'Earned Lv8+ did not unlock a renderable ULT');
    if(!report.earnedUlt.unlockedAt)report.earnedUlt.unlockedAt={round:round+1,...earnedKit};
   }
   assert.deepEqual(entry.after.box,[]);
   assert.equal(entry.after.team.length,1);
   // Game's normal reward routine restores active HP; no direct heal call.
   assert.equal(entry.after.team[0].hp,100);
   saveReport();
   console.log('PASS NATURAL TRAINER',JSON.stringify({
    index:round+1,foe:entry.open.enemy,timeSeconds:entry.seconds,after:entry.after}));
   if(round<total-1){
    // Real postbattle report is modal; dismiss with the actual Phaser button.
    await page.waitForFunction(()=>!!window.__pt2Game.scene.getScene('campanha').children.list.find(
      o=>o.active&&o.getData?.('torre2-report-continue')===true),null,{timeout:12000});
    await clickTag('torre2-report-continue');
    await page.waitForFunction(()=>!window.__pt2Game.scene.getScene('campanha').children.list.find(
      o=>o.active&&o.getData?.('torre2-report-continue')===true),null,{timeout:12000});
   }
   before=entry.after;
  }
  assert.ok(report.earnedUlt.unlockedAt,
   'Three natural route victories did not reach Lv8: inspect XP thresholds');
   const earned=await game();
   assert.equal(earned.wins,3,'Three actual battles must award their own wins');
   assert.ok(earned.team[0].level>=8,'ULT must be earned, not assigned as a test fixture');
   assert.ok(earned.team[0].experience>=512,'Real XP must reach Lv8 Cubic threshold');
   const rawBeforeReload=await page.evaluate(()=>localStorage.getItem(window.kanto.SAVE_KEY));
   assert.ok(rawBeforeReload,'Earned XP has no persisted save');
   // The three AUTO route fights use desktop controls, then the same
   // origin/page is reloaded with touchscreen support for native E.
   const cdp=await page.context().newCDPSession(page);
   await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
   const check=await page.evaluate(async()=>{
    const main=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
    window.kanto=await import(new URL('./torre2/campaign-core.js',main));
    window.moves=await import(new URL('./torre2/move-pool.js',main));
    const s=window.kanto.readCampaign(),ult=window.moves.resolveLoadout(s.team[0]).e;
    if(!ult?.forma||!ult.ulti||ult.pendiente)throw Error('Earned E is not a legal Phaser action');
    window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
    return {uid:s.team[0].uid,level:s.team[0].progression.level,
     experience:s.team[0].progression.experience,wins:s.wins,
     name:ult.nombre,moveId:ult.id,renderable:Boolean(ult.forma),
     raw:localStorage.getItem(window.kanto.SAVE_KEY),
     touch:navigator.maxTouchPoints};
   });
   assert.equal(check.raw,rawBeforeReload,'Reload changed committed XP/save');
   assert.equal(check.uid,earned.team[0].uid,'Reload replaced earned Pokémon');
   assert.equal(check.level,earned.team[0].level);
   assert.equal(check.experience,earned.team[0].experience);
   assert.equal(check.wins,3);
   assert.ok(check.touch>0,'Touch emulation missing after reload');
   await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
    !!window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,null,{timeout:45000});
   // Use the real menu's training path, not a fabricated L50 / altered kit.
   // Training has 100% ULT by design; no runtime property is injected.
   await page.evaluate(()=>{
    const s=window.kanto.readCampaign();
    window.__pt2Game.scene.getScene('campanha').enterMoveTraining(s);
   });
   await page.waitForFunction(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return b.scene.isActive()&&b.fase==='lucha'&&
     b.__torre2TrainingInstalled&&b.panelTactil?.botones?.some(x=>x.slot==='e')&&
     b.luchadores?.[0]?.ulti>=99;
   },null,{timeout:65000});
   const beforeUlt=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate'),a=b.luchadores[0];
    return {species:b.datos.p1,level:b.datos.torre2.playerLevel,
     training:b.datos.torre2.training,playerInput:b.datos.mandos?.[0],
     e:{id:a.kit.e?.id,name:a.kit.e?.nombre,ulti:a.kit.e?.ulti,
      cd:a.kit.e?.cd,pending:a.kit.e?.pendiente,forma:a.kit.e?.forma},
     energy:a.energia,meter:a.ulti,uses:a.stats.usosSlot?.e||0,
     saved:localStorage.getItem(window.kanto.SAVE_KEY),
     meterText:b.__torre2TrainingMeter?.text};
   });
   assert.equal(beforeUlt.species,'bulbasaur');
   assert.equal(beforeUlt.level,check.level);
   assert.equal(beforeUlt.training,true);
   assert.equal(beforeUlt.playerInput,'tactil');
   assert.equal(beforeUlt.e.id,check.moveId,'Trained ULT differs from genuine earned battle loadout');
   assert.equal(beforeUlt.e.ulti,true,'ULT no longer needs native E meter');
   assert.ok(beforeUlt.e.forma&&!beforeUlt.e.pending);
   assert.ok(beforeUlt.meter>=99,'Native training rules did not fill ULT meter');
   assert.equal(beforeUlt.saved,rawBeforeReload,'Entering training modified campaign checkpoint');
   // Native touchscreen panel input. No direct changes to HP, damage,
   // cooldown, energy, ULT meter, EXP or enemy AI.
   await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate'),panel=b.panelTactil,
     btn=panel.botones.find(x=>x.slot==='e');
    if(!btn)throw Error('Actual Phaser E touch button missing');
    const at=panel.pos(btn),origin=panel.punto({x:0,y:0}),unit=panel.punto({x:1,y:1});
    panel.abajo({id:97,x:(at.x-origin.x)/(unit.x-origin.x),
      y:(at.y-origin.y)/(unit.y-origin.y)});
    panel.leer(point=>({ax:point.x,ay:point.y}));
   });
   await page.waitForFunction(before=>{
    const b=window.__pt2Game.scene.getScene('combate'),a=b.luchadores?.[0];
    return b.scene.isActive()&&(a?.stats.usosSlot?.e||0)>before;
   },beforeUlt.uses,{timeout:17000,polling:100});
   await page.evaluate(()=>window.__pt2Game.scene.getScene('combate').panelTactil.arriba({id:97}));
   const afterUlt=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate'),a=b.luchadores[0];
    return {uses:a.stats.usosSlot?.e||0,meter:a.ulti,
     meterText:b.__torre2TrainingMeter?.text,
     damage:b.__torre2TrainingTotalDamage,hits:b.__torre2TrainingHits,
     active:b.scene.isActive(),saved:localStorage.getItem(window.kanto.SAVE_KEY)};
   });
   assert.ok(afterUlt.uses>beforeUlt.uses,
    'Native E did not cast after natural Lv8 XP with legitimate full training meter');
   assert.equal(afterUlt.saved,rawBeforeReload,
    'Real training cast must not change earned campaign save');
   report.earnedUlt={...report.earnedUlt,earned,reloaded:check,
    trainingBefore:beforeUlt,trainingAfter:afterUlt,cast:true,
    naturalLevel:true,nativeTouch:true,
    trainingMeterByGame:true,normalBattleMeterCharged:false,
    forcedExperience:false,forcedWin:false,forcedEnergy:false,
    forcedUltMeter:false,modifiedOriginalVfx:false};
   saveReport();
   await page.screenshot({path:out+'/t07-native-earned-lv8-ult-training-touch.png'});
   // Native return button restores normal route and the same earned save.
   const exit=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate'),zone=b.__torre2Training?.exitZone;
    if(!zone?.active)throw Error('Training mode has no native return button');
    const rect=document.querySelector('#juego canvas').getBoundingClientRect();
    return {x:rect.left+zone.x*rect.width/640,y:rect.top+zone.y*rect.height/360};
   });
   await page.mouse.click(exit.x,exit.y);
   await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'),null,{timeout:25000});
   const afterReturn=await game();
   assert.equal(afterReturn.wins,3);
   assert.equal(afterReturn.team[0].level,earned.team[0].level);
   assert.equal(await page.evaluate(()=>localStorage.getItem(window.kanto.SAVE_KEY)),
    rawBeforeReload,'Return from training rewrote natural campaign data');
   assert.deepEqual(errors,[],'Original Phaser client errors in earned ULT proof');
   console.log('PASS_T07_EARNED_LV8_REAL_TRAINING_ULT',JSON.stringify({
    wins:earned.wins,level:earned.team[0].level,
    experience:earned.team[0].experience,
    nativeUlt:beforeUlt.e.id,casts:afterUlt.uses-beforeUlt.uses,
    trainingFullMeter:true,savePreserved:true,normalBattleMeterUnproven:true
   }));
  }finally{saveReport();await page.close();await browser.close();server.close()}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
