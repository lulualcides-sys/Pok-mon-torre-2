'use strict';
/* Real progression: 5 native fights, early legal captures, then Rocket, Rival and Brock.
 * No forced KO, no fighter HP override, no instant-win, no arbitrary level.
 * Bulbasaur Lv5 and normal catches for a support team; Mewtwo stays in PC.
 * Native Phaser buttons, genuine capture RNG, money, XP and natural battle outcomes.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const path=require('node:path'),http=require('node:http'),{chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
// Optional strict production route: NO test-factory level 50 Mewtwo.
// The default old QA replay remains byte-for-byte equivalent in behavior.
const useProductionStart=process.env.T20_PRODUCTION_START==='1';
const expectedBox=useProductionStart?[]:['mewtwo'];
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
 const report={productionStarter:useProductionStart,method:'Real Phaser AUTO; catch wild teammates BEFORE Rocket, no forced HP/KO/wins; 13 trainers and Brock',steps:[],realDefeats:[]};
 const saveReport=()=>fs.writeFileSync(out+'/natural-through-brock.json',JSON.stringify(report,null,2));
 const game=()=>page.evaluate(()=>{
  const s=window.kanto.readCampaign();return {
   trainer:s?.trainer,wins:s?.wins,losses:s?.losses,stage:s?.stage,money:s?.money,
   team:s?.team?.map(m=>({id:m.id,hp:m.hp,level:m.progression?.level})),
   box:s?.box?.map(m=>m.id),active:s?.active,balls:s?.inventory?.pokeball, badges:s?.badges||[],tms:s?.inventory?.tms||[]
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

 // Prepare the team with NORMAL shop/capture screens. No RNG override,
 // HP mutation, free items, artificial victories, skipped trainer or level.
 const clickMarked=async (key,value)=>{
  const point=await page.evaluate(([key,value])=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   const z=c.children.list.find(o=>o.active&&o.input?.enabled&&o.getData?.(key)===value);
   if(!z)throw Error('No live Phaser control '+key+'='+value);
   const rect=document.querySelector('#juego canvas').getBoundingClientRect();
   return {x:rect.x+z.x*rect.width/640,y:rect.y+z.y*rect.height/360};
  },[key,value]);
  await page.mouse.click(point.x,point.y);
 };
 const sync=async()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const tap=async (x,y)=>{
  const p=await page.evaluate(([x,y])=>{
   const r=document.querySelector('#juego canvas').getBoundingClientRect();
   return {x:r.x+x*r.width/640,y:r.y+y*r.height/360}
  },[x,y]);
  await page.mouse.click(p.x,p.y);
 };
 const backToMap=async()=>{
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'),null,{timeout:30000});
  await page.evaluate(()=>window.__pt2Game.scene.getScene('campanha').scene.restart({}));
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
   !!window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,null,{timeout:35000});
 };
 const centerHeal=async()=>{
  await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   c.centerScreen(window.kanto.readCampaign());
  });
  await sync();
  await clickMarked('torre2-center-heal',true);
  await page.waitForFunction(()=>{
   const s=window.kanto.readCampaign();
   return s?.team?.every(m=>m.hp===100)&&
    window.__pt2Game.scene.isActive('campanha')&&
    !window.__pt2Game.scene.getScene('campanha').__torre2CenterBusy;
  },null,{timeout:20000});
  await backToMap();
 };
 const prepareNaturalTeam=async()=>{
  const before=await game();
  report.teamPreparation={before,throws:[],captures:[],shop:[]};
  await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   c.martScreen(window.kanto.readCampaign());
  });
  await sync();
  for(let i=0;i<12;i++){
   const old=await game();
   await clickMarked('torre2-mart-buy','pokeball');
   const now=await game();
   assert.equal(now.balls,old.balls+1,'One real Mart button purchases one ball');
   assert.equal(now.money,old.money-200,'Each ball costs exactly 200');
   report.teamPreparation.shop.push({before:old.money,after:now.money,balls:now.balls});
  }
  await backToMap();
  let encounters=0;
  while((await game()).team.length<3&&(await game()).balls>0&&encounters<12){
   encounters++;
   const old=await game();
   await page.evaluate(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    c.grassScreen(window.kanto.readCampaign());
   });
   await sync();await tap(465,292);
   await page.waitForFunction(()=>window.__pt2Game.scene.isActive('combate')&&
    window.__pt2Game.scene.getScene('combate').fase==='lucha'&&
    window.__pt2Game.scene.getScene('combate').__torre2WildCapture,null,{timeout:65000});
   let battle=true,attempts=0;
   while(battle&&(await game()).balls>0&&attempts++<20){
    const t0=await game();
    await sync();await tap(470,61);
    await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').fase==='torre2-aim',null,{timeout:12000});
    await sync();await tap(316,186);
    await page.waitForFunction(n=>window.kanto.readCampaign()?.inventory?.pokeball===n-1,
     t0.balls,{timeout:15000});
    await page.waitForFunction(()=>{
     const b=window.__pt2Game.scene.getScene('combate');
     return window.__pt2Game.scene.isActive('campanha')||
       (b.scene.isActive()&&b.fase==='lucha'&&!b.__torre2CaptureBusy);
    },null,{timeout:25000});
    const now=await game();
    report.teamPreparation.throws.push({encounter:encounters,beforeBalls:t0.balls,
     afterBalls:now.balls,team:now.team.map(m=>m.id),losses:now.losses});
    saveReport();
    if(now.team.length>t0.team.length){
     report.teamPreparation.captures.push(now.team.at(-1));
     battle=false;
    }else if(await page.evaluate(()=>window.__pt2Game.scene.isActive('campanha'))){
     battle=false;
    }
   }
   if(await page.evaluate(()=>window.__pt2Game.scene.isActive('campanha')))await centerHeal();
   else throw new Error('Wild capture sequence still in a live battle; '+JSON.stringify(await game()));
   assert.equal((await game()).trainer,old.trainer,'Wild encounters never advance trainer checkpoint');
  }
  report.teamPreparation.after=await game();
  saveReport();
  assert.ok(report.teamPreparation.after.team.length>=3,
   'At least two genuine RNG captures are required before Rival checkpoint');
  assert.equal(report.teamPreparation.after.trainer,5,'Five earned wins precede early Rocket-team preparation');
  assert.deepEqual(report.teamPreparation.after.box,expectedBox,
   'No QA Mewtwo or unexpected PC Pokémon in production beginning');
  console.log('PASS REAL TEAM PREPARATION',JSON.stringify(report.teamPreparation.after));
 };
 // Actual wild encounters are part of a playable Kanto route. Training here
 // earns XP and recorded wild victories in native Phaser fights; it never injects levels, wins, HP or meter.
 // The sixth trainer (Rocket) has beaten untrained teams repeatedly.
 const trainNaturalTeam=async()=>{
  report.wildTraining={before:await game(),rounds:[]};
  for(let n=0;n<8;n++){
   const before=await game();
   if(before.team[0].level>=12)break;
   const beforeXp=await page.evaluate(()=>window.kanto.readCampaign().team.map(
    m=>Number(m.progression?.experience)||0));
   await page.evaluate(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    c.grassScreen(window.kanto.readCampaign());
   });
   await sync();await tap(465,292);
   await page.waitForFunction(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return b.scene.isActive()&&b.fase==='lucha'&&b.__torre2WildCapture&&
     b.__torre2AutoMode?.zone?.active;
   },null,{timeout:65000});
   const encounter=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return {foe:b.datos?.p2,foeLevel:b.datos?.torre2?.enemyLevel};
   });
   const autoButton=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate'),z=b.__torre2AutoMode.zone,
     rect=document.querySelector('#juego canvas').getBoundingClientRect();
    return {x:rect.x+z.x*rect.width/640,y:rect.y+z.y*rect.height/360};
   });
   await page.mouse.click(autoButton.x,autoButton.y);
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').__torre2AutoMode?.enabled,
    null,{timeout:7000});
   await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'),
    null,{timeout:180000,polling:250});
   const after=await game();
   const afterXp=await page.evaluate(()=>window.kanto.readCampaign().team.map(
    m=>Number(m.progression?.experience)||0));
   const gained=afterXp.map((v,i)=>v-(beforeXp[i]||0));
   const event={attempt:n+1,encounter,before,after,gained};
   report.wildTraining.rounds.push(event);saveReport();
   assert.equal(after.trainer,before.trainer,'Wild training cannot skip a route trainer');
   assert.equal(after.wins,before.wins+1,'Wild battle must earn exactly one native victory');
   assert.equal(after.losses,before.losses,'Wild training must not conceal a defeat');
   assert.equal(after.stage,before.stage,'Wild training cannot skip a badge');
   if(!(gained.some(v=>v>0)))
    throw Error('No natural XP gained in wild encounter: '+JSON.stringify(event));
   console.log('PASS NATURAL WILD TRAINING',JSON.stringify(event));
   await centerHeal();
  }
  report.wildTraining.after=await game();saveReport();
  assert.equal(report.wildTraining.after.trainer,5,
   'Training must leave Rocket as the sixth trainer');
  assert.ok(report.wildTraining.after.team[0].level>=10,
   'Starter still underlevelled after genuine wild training; do not inject XP');
 };

 try{
  await page.goto('http://127.0.0.1:4322/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:50000});
  await page.evaluate(async production=>{
   const main=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=window.kanto=await import(new URL('./torre2/campaign-core.js',main));
   const s=production?core.createPlayerCampaign('bulbasaur'):
     core.createCampaign('bulbasaur');
   core.saveCampaign(s);
   if(!production)core.storePokemon(s,1);
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  },useProductionStart);
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
   !!window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,null,{timeout:45000});
  let before=await game();
  assert.equal(before.stage,0);assert.equal(before.trainer,0);assert.equal(before.wins,0);
  assert.deepEqual(before.team.map(x=>x.id),['bulbasaur']);
  assert.equal(before.team[0].level,5);
  assert.deepEqual(before.box,expectedBox);
  // The third trainer starts as Caterpie but legally evolves at Lv7/10.
  // Assert its independent FRLG evolution thresholds, not a stale base sprite.
  const names=['pidgey','rattata','caterpie','charmander'];
 const total=14;
 const validateNaturalIvysaur=process.env.T03_NATURAL_EVOLUTION==='1';
  let earlyTeamReady=false;
  let naturalRetries=0;
  for(let round=0;round<total;round++){
   if(round===5&&!earlyTeamReady){await prepareNaturalTeam();await trainNaturalTeam();before=await game();earlyTeamReady=true;}
   const opponent=await page.evaluate(()=>window.kanto.currentOpponent(window.kanto.readCampaign()));
   const entry={round:round+1,expected:opponent.id,role:opponent.kind,before};report.steps.push(entry);
   if(round<names.length){
    const expectedSpecies=round===2
     ?(opponent.level>=10?'butterfree':opponent.level>=7?'metapod':'caterpie')
     :names[round];
    assert.equal(opponent.id,expectedSpecies,
     'Early route species must follow canonical Kanto evolution levels');
   }
   assert.ok(opponent.id,'Every route checkpoint must expose actual species');
   const expectedKind=round===13?'leader':round===3||round===12?'rival':round===5?'rocket':'trainer';
   assert.equal(opponent.kind,expectedKind,'Early route trainer roles must stay canonical');
   await clickTag('torre2-central-cta');
   if(opponent.leader){
    // Gym leaders have a legitimate challenge confirmation scene between
    // route CTA and battle. Click its live Phaser challenge button.
    await page.waitForFunction(()=>{
     const c=window.__pt2Game.scene.getScene('campanha');
     return c.children.list.some(o=>typeof o.text==='string'&&
      o.text.includes('LÍDER DISPONÍVEL PARA BATALHA'));
    },null,{timeout:12000});
    await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
    const xy=await page.evaluate(()=>{
     const rect=document.querySelector('#juego canvas').getBoundingClientRect();
     return {x:rect.x+320*rect.width/640,y:rect.y+225*rect.height/360};
    });
    await page.mouse.click(xy.x,xy.y);
   }
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
   assert.equal(entry.open.player,before.team[before.active].id);
   assert.equal(entry.open.enemy,opponent.leader?'geodude':opponent.id,
    'First real boss sprite is Geodude, not the unseen Onix ace');
   if(opponent.leader)assert.deepEqual(entry.open.party,['geodude','onix']);
   assert.equal(entry.open.auto,false,'AUTO resets between fights');
   const button=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    const zone=b.__torre2AutoMode.zone,rect=document.querySelector('#juego canvas').getBoundingClientRect();
    return {x:rect.x+zone.x*rect.width/640,y:rect.y+zone.y*rect.height/360};
   });
   await page.mouse.click(button.x,button.y);
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').__torre2AutoMode?.enabled,
    null,{timeout:5000});
   await page.screenshot({path:out+'/natural-route1-trainer-'+(round+1)+'-combat.png'});
   const started=Date.now();
   try{
    // Native combat sometimes reaches fase='fin' after the final KO but
    // never returns to campanha. Diagnose that deadlock promptly instead
    // of burning four minutes and mistaking a 0-HP foe for a saved win.
    // This watchdog only observes Phaser; it NEVER changes HP, wins,
    // the native clock, or the campaign's scene transition.
    const terminal=await page.waitForFunction(({previousWins,previousLosses})=>{
     const s=window.kanto.readCampaign();
     if(window.__pt2Game.scene.isActive('campanha')&&
       !!s&&(s.wins===previousWins+1||s.losses>previousLosses))return 'saved-result';
     const b=window.__pt2Game.scene.getScene('combate');
     if(b.scene.isActive()&&b.fase==='fin'){
      window.__t20FinSince??=performance.now();
      if(performance.now()-window.__t20FinSince>12000)return 'stuck-native-fin';
     }else window.__t20FinSince=null;
     return false;
    },{previousWins:before.wins,previousLosses:before.losses},{timeout:240000,polling:250});
    const outcome=await terminal.jsonValue();
    if(outcome!=='saved-result')throw Error('Native Phaser combat stuck in fin after KO; no durable campaign result');
   }catch(error){
    entry.failedReason=String(error);
    entry.game=await game();
    entry.battle=await page.evaluate(()=>{
     const b=window.__pt2Game.scene.getScene('combate');
     const party=b.datos?.torre2?.party;
     return {active:b.scene.isActive(),phase:b.fase,
      hp:b.luchadores?.map(m=>({hp:m.hp,hpMax:m.hpMax,ko:m.ko})),
      playerIndex:party?.playerIndex,enemyIndex:party?.enemyIndex,
      friend:party?.friend?.map(m=>({id:m.id,hp:m.hp})),
      foes:party?.foes?.map(m=>({id:m.id,hp:m.hp})),
      victories:b.victorias,round:b.numRonda,required:b.paraGanar,
      installed:b.__torre2PartyInstalled,changing:b.__torre2Changing,
      bagOpen:b.__torre2BattleBagOpen,ballTransitions:b.__torre2BallTransitions,
      paused:b.pausado,clockPaused:b.time?.paused,
      clockScale:b.time?.timeScale,gameTimeScale:b.game?.loop?.timeScale};
    });
    await page.screenshot({path:out+'/natural-route1-trainer-'+(round+1)+'-failure.png'});
    saveReport();
    throw new Error('Natural training ladder failed at '+(round+1)+': '+JSON.stringify(entry));
   }
   entry.seconds=Math.round((Date.now()-started)/100)/10;
   entry.after=await game();
   // Native trainer victory is NOT guaranteed. Respect genuine losses:
   // no editing winner/HP/EXP/RNG. Heal at the Center and retry legally,
   // limited to three losses so a genuine balance defect surfaces.
   if(entry.after.losses>before.losses){
    assert.equal(entry.after.losses,before.losses+1);
    assert.equal(entry.after.wins,before.wins,'Defeat cannot grant XP/victory');
    assert.equal(entry.after.trainer,before.trainer,'Defeat cannot skip checkpoint');
    assert.equal(entry.after.stage,before.stage);
    const defeat={trainer:round+1,foe:opponent.id,
     team:entry.after.team,losses:entry.after.losses};
    report.realDefeats.push(defeat);
    console.log('T20 GENUINE ROUTE DEFEAT',JSON.stringify(defeat));
    saveReport();
    if(++naturalRetries>3)
     throw Error('Too many genuine losses; review balance, never forge results: '+
      JSON.stringify(report.realDefeats));
    await centerHeal();
    before=await game();
    --round;
    continue;
   }
   assert.equal(entry.after.stage,opponent.leader?1:0);
   assert.equal(entry.after.trainer,opponent.leader?0:round+1);
   assert.equal(entry.after.wins,before.wins+1,'Trainer must earn exactly one native win, regardless of prior wild battles');
   assert.equal(entry.after.losses,before.losses,'No loss fabricated during trainer victory');
   const payout=opponent.leader?1200:opponent.kind==='rival'?460:opponent.kind==='rocket'?360:180;
   assert.equal(entry.after.money,before.money+payout,'Real trainer/Rocket/Rival payout');
   assert.deepEqual(entry.after.box,expectedBox);
   assert.equal(entry.after.team.length,round<5?1:3);
   if(opponent.leader){
    assert.deepEqual(entry.after.badges,['Rocha'],'Brock grants first and only badge');
    assert.ok(entry.after.tms.includes('tm-rock-tomb'),'Brock grants unique FireRed TM39');
   }else{
    assert.deepEqual(entry.after.badges,[],'No early leader rewards');
   }
   // Game's normal reward routine restores active HP; no direct heal call.
   assert.ok(entry.after.team.some(m=>m.hp>0),'At least one party member remains conscious');
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
    // Natural route strategy: revive the entire team after a battle when
    // anyone is fainted or injured. Round 11 previously began with Bulbasaur
    // and Pikachu at 0 HP, because a victory only restored the active fighter.
    // Use the actual Phaser Center heal button and ordinary persistent save:
    // NEVER set fighter HP or edit XP, trainer indexes or victory counters.
    if(entry.after.team.some(m=>m.hp<100)){
     const prev=await game();
     await centerHeal();
     const healed=await game();
     assert.ok(healed.team.every(m=>m.hp===100),'Real Center must revive party');
     assert.equal(healed.trainer,prev.trainer,'Center must not skip trainers');
     assert.equal(healed.wins,prev.wins,'Center must not grant victories');
     assert.equal(healed.losses,prev.losses,'Center must not erase real defeats');
     assert.equal(healed.money,prev.money,'Center must not mint rewards');
     assert.equal(healed.balls,prev.balls,'Center must preserve capture inventory');
     entry.center={before:prev.team,after:healed.team};
     saveReport();
     console.log('PASS NATURAL CENTER BETWEEN TRAINERS',JSON.stringify({
      nextTrainer:round+2,before:prev.team,after:healed.team}));
    }
   }
   before=await game();
  }
  // Optional T03 extension: win ACTUAL native battles after Brock, with
  // absolutely no XP/level/result/HP fixture and no EVO during battle.
  if(validateNaturalIvysaur){
   assert.equal((await game()).stage,1,'Brock must be beaten normally first');
   await clickTag('torre2-report-continue');
   await page.waitForFunction(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    return c.scene.isActive()&&!!c.__torre2BattlePath&&
     !c.children.list.some(o=>o.active&&o.getData?.('torre2-report-continue')===true);
   },null,{timeout:15000});
   const starter=await page.evaluate(()=>{
    const s=window.kanto.readCampaign();
    const m=s.team.find(x=>x.progression?.species==='bulbasaur');
    return m?{uid:m.uid,id:m.id,level:m.progression.level,
      experience:m.progression.experience}:null;
   });
   assert.ok(starter,'The naturally trained Bulbasaur must still be present');
   assert.equal(starter.id,'bulbasaur','Brock stage must not evolve Bulbasaur prematurely');
   assert.ok(starter.level<16,'Level 16 must be earned in stage 1, not injected');
   report.t03={mode:'real stage 1 battles after real Brock; XP naturally earned',starter,events:[]};
   let evolution=null;
   for(let step=0;step<15&&!evolution;step++){
    const previous=await game();
    assert.equal(previous.stage,1,'Misty route must remain stage 1');
    const current=await page.evaluate(uid=>{
     const s=window.kanto.readCampaign();return s.team.find(m=>m.uid===uid);
    },starter.uid);
    assert.ok(current,'Starter UID must never disappear');
    assert.equal(current.id,'bulbasaur','Species must change only after battle');
    const opponent=await page.evaluate(()=>
      window.kanto.currentOpponent(window.kanto.readCampaign()));
    assert.ok(opponent&&!opponent.leader,'Only legitimate stage 1 route fights can grant XP');
    await clickTag('torre2-central-cta');
    await page.waitForFunction(()=>{
     const scene=window.__pt2Game.scene.getScene('combate');
     return scene.scene.isActive()&&scene.fase==='lucha'&&
       scene.__torre2PartyInstalled&&scene.__torre2AutoMode?.zone?.active;
    },null,{timeout:60000});
    const opening=await page.evaluate(()=>{
     const scene=window.__pt2Game.scene.getScene('combate');
     const me=scene.luchadores?.[0];
     return {species:scene.datos.p1,level:scene.datos.torre2.playerLevel,
       fighter:me?.forma?.nombre||'',sprite:me?.spr?.texture?.key||''};
    });
    assert.equal(opening.species,previous.team[previous.active].id);
    // Poll ONLY the campaign's saved species during active combat; the
    // Phaser actor can change from a normal in-battle party switch.
    await page.evaluate(uid=>{
     window.__t03SpeciesDuringCombat=[];
     window.__t03SpeciesPoll=setInterval(()=>{
      const scene=window.__pt2Game.scene.getScene('combate');
      if(!scene?.scene.isActive()||scene.fase!=='lucha')return;
      const member=window.kanto.readCampaign()?.team?.find(m=>m.uid===uid);
      if(member&&window.__t03SpeciesDuringCombat.length<5000)
       window.__t03SpeciesDuringCombat.push(member.id);
     },90);
    },starter.uid);
    const autoButton=await page.evaluate(()=>{
     const b=window.__pt2Game.scene.getScene('combate'),zone=b.__torre2AutoMode.zone;
     const rect=document.querySelector('#juego canvas').getBoundingClientRect();
     return {x:rect.x+zone.x*rect.width/640,y:rect.y+zone.y*rect.height/360};
    });
    await page.mouse.click(autoButton.x,autoButton.y);
    await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').__torre2AutoMode.enabled,
     null,{timeout:7000});
    try{
     await page.waitForFunction(({wins,losses})=>{
      const s=window.kanto.readCampaign();
      return window.__pt2Game.scene.isActive('campanha')&&
       (s?.wins>wins||s?.losses>losses);
     },{wins:previous.wins,losses:previous.losses},{timeout:240000,polling:250});
    }finally{
     const inFight=await page.evaluate(()=>{
      clearInterval(window.__t03SpeciesPoll);
      const items=window.__t03SpeciesDuringCombat||[];
      delete window.__t03SpeciesPoll;
      return items;
     });
     assert.ok(inFight.length,'Must observe saved species while native battle is active');
     assert.ok(inFight.every(id=>id==='bulbasaur'),
      'The campaign must NOT change the starter species during the fight');
    }
    const after=await page.evaluate(uid=>{
     const s=window.kanto.readCampaign();
     const member=s.team.find(m=>m.uid===uid);
     return {wins:s.wins,losses:s.losses,stage:s.stage,trainer:s.trainer,
       member:member?{uid:member.uid,id:member.id,level:member.progression.level,
        experience:member.progression.experience,progressSpecies:member.progression.species,
        moves:member.moves,movePlanSpecies:member.movePlanSpecies}:null};
    },starter.uid);
    assert.equal(after.wins,previous.wins+1,'No trainer win may be faked');
    assert.equal(after.losses,previous.losses,'Unexpected real defeat: no result override allowed');
    assert.equal(after.trainer,previous.trainer+1);
    assert.equal(after.member.uid,starter.uid,'Evolution must preserve the member UID');
    assert.ok(after.member.level>=current.progression.level,'No XP rollback');
    if(after.member.id!=='bulbasaur'){
     assert.equal(after.member.id,'ivysaur','Level 16 must evolve into Ivysaur');
     assert.equal(after.member.progressSpecies,'ivysaur','Progression must match species');
     assert.ok(after.member.level>=16,'No premature evolution before Lv16');
     assert.deepEqual(after.member.moves,[],
      'Species-specific kit must be resolved anew after evolution');
     evolution={step:step+1,previous:current.progression.level,after};
    }
    report.t03.events.push({step:step+1,opponent:opponent.id,opening,
     fromLevel:current.progression.level,toLevel:after.member.level,
     beforeSpecies:current.id,afterSpecies:after.member.id,wins:after.wins});
    saveReport();
    console.log('T03 NATURAL STAGE1',JSON.stringify(report.t03.events.at(-1)));
    await clickTag('torre2-report-continue');
    await page.waitForFunction(()=>
     !window.__pt2Game.scene.getScene('campanha').children.list.some(
      o=>o.active&&o.getData?.('torre2-report-continue')===true),
     null,{timeout:15000});
   }
   assert.ok(evolution,'Bulbasaur never evolved naturally by stage 1 route wins');
   report.t03.evolution=evolution;
   const rawBeforeReload=await page.evaluate(()=>localStorage.getItem(window.kanto.SAVE_KEY));
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
   const afterReload=await page.evaluate(async uid=>{
    const main=[...document.scripts].find(o=>o.src?.includes('/main.js')).src;
    const core=window.kanto=await import(new URL('./torre2/campaign-core.js',main));
    const s=core.readCampaign();
    return {uid:s.team.find(m=>m.uid===uid)?.uid,
      member:s.team.find(m=>m.uid===uid),
      bytes:localStorage.getItem(core.SAVE_KEY),wins:s.wins,stage:s.stage};
   },starter.uid);
   assert.equal(afterReload.bytes,rawBeforeReload,'Reload must not rewrite a valid campaign save');
   assert.equal(afterReload.member?.id,'ivysaur','Evolved species must persist after page reload');
   assert.equal(afterReload.uid,starter.uid,'Reload must retain the original member identity');
   assert.equal(afterReload.member?.progression?.level,evolution.after.member.level);
   assert.equal(afterReload.stage,1);
   await page.evaluate(()=>window.__pt2Game.scene.getScene('titulo').scene.start('campanha'));
   await page.waitForFunction(()=>
    window.__pt2Game.scene.isActive('campanha')&&
    !!window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,null,{timeout:45000});
   // Start the NEXT normal battle, checking the evolved form really loads in
   // the battle renderer instead of yielding a black screen / missing kit.
   await clickTag('torre2-central-cta');
   await page.waitForFunction(()=>
    window.__pt2Game.scene.isActive('combate')&&
    window.__pt2Game.scene.getScene('combate').fase==='lucha'&&
    window.__pt2Game.scene.getScene('combate').__torre2PartyInstalled,
    null,{timeout:60000});
   const live=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate'),me=b.luchadores[0];
    return {p1:b.datos.p1,form:me.forma.nombre,sprite:me.spr?.texture?.key,
      frame:[me.spr?.frame?.width,me.spr?.frame?.height],
      visible:me.spr?.visible,textureExists:b.textures.exists(me.spr.texture.key),
      slots:Object.fromEntries(['lmb','rmb','q','e'].map(k=>[k,me.kit[k]?.nombre||'']))};
   });
   assert.equal(live.p1,'ivysaur');
   assert.equal(live.form.toLowerCase(),'ivysaur');
   assert.ok(live.sprite?.startsWith('pmd-0002-'),'Ivysaur must show its own PMD sprite');
   assert.ok(live.textureExists&&live.visible&&live.frame.every(n=>n>0),
    'Live WebGL renderer must retain a visible nonempty sprite');
   assert.ok(Object.values(live.slots).filter(Boolean).length>=3,
    'Evolution must not erase active attack slots');
   await page.screenshot({path:out+'/t03-natural-ivysaur-after-reload-webgl.png'});
   report.t03.reload={uid:afterReload.uid,level:afterReload.member.progression.level,
    id:afterReload.member.id,saveUnchanged:true,live};
   saveReport();
   console.log('T03 PASS NATURAL LV16 IVYSAUR, POSTBATTLE EVOLUTION + RELOAD + LIVE WEBGL',JSON.stringify(report.t03.reload));
  }
  await page.screenshot({path:out+'/natural-route1-through-brock-completed.png'});
  assert.deepEqual(errors,[],'No client JS exceptions through four consecutive native battles');
  console.log('PASS 13 REAL ROUTE TRAINERS + NATURAL CAPTURES + BROCK; no debug KOs, normal XP/rewards');
 }finally{saveReport();await page.close();await browser.close();server.close()}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
