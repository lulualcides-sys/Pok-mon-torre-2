'use strict';
/* True original Phaser campaign fight for the first EIGHT route trainers.
 * No forced KO, no fighter HP override, no instant-win, no arbitrary level.
 * A single Bulbasaur starts at Lv5; Uses the production starter factory with no test-only Mewtwo in team or PC.
 * Every battle uses actual UI button + AUTO native controller and XP rewards.
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
 await new Promise(ok=>server.listen(4548,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
  '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const report={method:'Native Phaser live AUTO, no HP/KO/result cheats; one starter, production starter (no Mewtwo); consecutive route trainers 1-8',steps:[]};
 const saveReport=()=>fs.writeFileSync(out+'/t20-pallet-eight-real-production-starter.json',JSON.stringify(report,null,2));
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
  await page.goto('http://127.0.0.1:4548/arena2d/?original=1',{waitUntil:'domcontentloaded'});
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
  assert.deepEqual(before.box,[],'Production fresh start must have no hidden test-only Pokémon');
  const firstKit=await page.evaluate(()=>window.moves.resolveLoadout(window.kanto.readCampaign().team[0]));
  assert.ok(['lmb','rmb','q'].every(slot=>firstKit[slot]?.forma&&!firstKit[slot]?.pendiente),
   'Legitimate Lv5 starter must have three usable native attacks');
  assert.equal(firstKit.e,undefined,'Legitimate Lv5 starter cannot equip ULT');
  report.earnedUlt={initial:{level:5,experience:before.team[0].experience,ultLocked:true},unlockedAt:null};
  const names=['pidgey','rattata','caterpie','charmander'];
 const total=8;
  for(let round=0;round<total;round++){
   const opponent=await page.evaluate(()=>window.kanto.currentOpponent(window.kanto.readCampaign()));
   const entry={round:round+1,expected:opponent.id,role:opponent.kind,before};report.steps.push(entry);
   if(round<names.length)assert.equal(opponent.id,names[round],
    'First four route species include the rival after Caterpie');
   assert.ok(opponent.id,'Every route checkpoint must expose actual species');
   const expectedKind=round===3?'rival':round===5?'rocket':'trainer';
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
   // Campaign AUTO starts ON in production. The legacy test clicked the
   // enabled button, switching it OFF before fighting the first trainer.
   // Keep native AUTO active without synthetic controls, XP, damage or KO.
   assert.equal(entry.open.auto,true,
    'Kanto AUTO must start ON for each genuine route battle');
   await page.screenshot({path:out+'/t20-pallet-eight-trainer-'+(round+1)+'-combat.png'});
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
    await page.screenshot({path:out+'/t20-pallet-eight-trainer-'+(round+1)+'-failure.png'});
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
   assert.deepEqual(entry.after.box,[],'No debug Pokémon or fabricated team member during progression');
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
   'Eight unmodified early-route victories did not reach an earned Lv8 ULT; inspect XP evidence');
  const earned=await game();
  const rawBeforeReload=await page.evaluate(()=>localStorage.getItem(window.kanto.SAVE_KEY));
  assert.ok(rawBeforeReload,'No persisted native campaign save after earned Lv8');
  // Keep the eight battles on the unchanged desktop controller. Enabling
  // touch from the start changes AUTO match dynamics (Rocket double battle).
  // Switch Chromium input capability only for the saved next-battle check;
  // the SAME page/origin/localStorage is reloaded, not a copied fixture.
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  assert.ok(await page.evaluate(()=>navigator.maxTouchPoints>0),
   'Chromium touch emulation was not enabled for the earned ULT check');
  await page.evaluate(async()=>{
   const main=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   window.kanto=await import(new URL('./torre2/campaign-core.js',main));
   window.moves=await import(new URL('./torre2/move-pool.js',main));
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
   !!window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,null,{timeout:45000});
  const reloaded=await game();
  const rawAfterReload=await page.evaluate(()=>localStorage.getItem(window.kanto.SAVE_KEY));
  assert.equal(rawAfterReload,rawBeforeReload,'Reload must not rewrite genuine earned XP');
  assert.equal(reloaded.team[0].uid,earned.team[0].uid,'Starter identity changed after reload');
  assert.equal(reloaded.team[0].level,earned.team[0].level,'Earned level lost on reload');
  assert.equal(reloaded.team[0].experience,earned.team[0].experience,'Earned XP lost on reload');
  assert.equal(reloaded.wins,8,'Eight natural victories did not persist');
  await clickTag('torre2-central-cta');
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.fase==='lucha'&&b.__torre2PartyInstalled&&b.panelTactil;
  },null,{timeout:60000});
  const nextBattle=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),a=b.luchadores[0];
   return {species:b.datos.p1,level:b.datos.torre2.playerLevel,
    ult:{id:a.kit.e?.id,name:a.kit.e?.nombre,ulti:a.kit.e?.ulti===true,
     pending:a.kit.e?.pendiente===true,renderable:Boolean(a.kit.e?.forma)},
    nativeTouchSlots:b.panelTactil.botones.map(x=>x.slot)};
  });
  assert.equal(nextBattle.species,'bulbasaur');
  assert.equal(nextBattle.level,earned.team[0].level);
  assert.ok(nextBattle.ult.ulti&&nextBattle.ult.renderable&&!nextBattle.ult.pending,
   'Earned ULT not present in actual next Phaser battle');
  assert.ok(nextBattle.nativeTouchSlots.includes('e'),'Native battle lost ULT touch control');
  report.earnedUlt={...report.earnedUlt,earned,reloaded,nextBattle,
   persistedIdentically:true,fromFreshLv5:true,forcedXp:false,forcedWin:false};
  saveReport();
  await page.screenshot({path:out+'/t20-pallet-eight-earned-ult.png'});
  await page.screenshot({path:out+'/t20-pallet-eight-production-completed.png'});
  assert.deepEqual(errors,[],'No client JS exceptions through eight consecutive native battles');
  console.log('PASS EIGHT NATURAL KANTO OPENING FIGHTS INCLUDING RIVAL; no debug KOs, natural XP, real rewards');
 }finally{saveReport();await page.close();await browser.close();server.close()}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
