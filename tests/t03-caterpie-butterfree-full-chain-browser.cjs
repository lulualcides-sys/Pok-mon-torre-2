'use strict';
/* T03: Caterpie -> Metapod -> Butterfree from genuine battle rewards.
 * Species of the wild encounter is controlled via the documented API RNG
 * solely so the test is repeatable. No XP, level, HP, KO, capture roll,
 * trainer result, battle timer or player combat resources are overridden.
 * Genuine shop purchases, Pokeballs, capture, route CTA, AUTO and saves.
 */
const assert=require('node:assert/strict'),fs=require('node:fs');
const fsp=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const MIME={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg',
 '.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const uri=new URL(req.url||'/','http://127.0.0.1:4423');
 const file=path.resolve(root,'.'+(uri.pathname.endsWith('/')?uri.pathname+'index.html':uri.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const data=await fsp.readFile(file);
  res.writeHead(200,{'content-type':MIME[path.extname(file)]||'application/octet-stream'});
  res.end(data);
 }catch{res.writeHead(404);res.end('missing')}
});
const evidence='test-evidence';
const report={scope:'T03 two sequential EXP-earned evolutions in the actual Kanto campaign',
 encounter:'Wild species Caterpie selected by seeded encounter RNG; native capture RNG NOT overridden',
 battles:'Consecutive genuine trainer wins until Butterfree Lv10, native AUTO, no forced KO/HP/XP/level',
 attempts:[],victories:[],save:null};
fs.mkdirSync(evidence,{recursive:true});
const persist=()=>fs.writeFileSync(evidence+'/t03-caterpie-chain-earned-evolution.json',JSON.stringify(report,null,2));
(async()=>{
 await new Promise(ok=>server.listen(4423,'127.0.0.1',ok));
 const browser=await chromium.launch({
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']
 });
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const snapshot=()=>page.evaluate(()=>{
   const s=window.kanto.readCampaign();
   return {stage:s.stage,trainer:s.trainer,wins:s.wins,losses:s.losses,money:s.money,
    balls:s.inventory.pokeball,active:s.active,
    team:s.team.map(m=>({uid:m.uid,id:m.id,hp:m.hp,level:m.progression.level,
     species:m.progression.species,experience:m.progression.experience})),
    box:s.box.map(m=>m.id),caught:s.dexCaught.slice()};
  });
  const coord=async(x,y)=>page.evaluate(([x,y])=>{
   const rect=document.querySelector('#juego canvas').getBoundingClientRect();
   return {x:rect.left+x*rect.width/640,y:rect.top+y*rect.height/360};
  },[x,y]);
  const tap=async(x,y)=>{
   // Same native touch/pointer as Mart. Wait for Phantom Phaser zones to be
   // created before pressing; hold down through several original game ticks.
   await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
   const p=await coord(x,y);
   await page.mouse.move(p.x,p.y);
   await page.mouse.down();await page.waitForTimeout(85);
   await page.mouse.up();await page.waitForTimeout(110);
  };
  const clickMarked=async(key,value)=>page.evaluate(([key,value])=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   const o=c.children.list.find(x=>x.active&&x.input?.enabled&&x.getData?.(key)===value);
   if(!o)throw Error('Missing native campaign button '+key+'='+value);
   const rect=document.querySelector('#juego canvas').getBoundingClientRect();
   return {x:rect.left+o.x*rect.width/640,y:rect.top+o.y*rect.height/360};
  },[key,value]).then(async p=>{
   // Phaser polls pointer input on animation frames. Avoid losing an
   // instantaneous down/up on CI's software-rendered Chromium.
   await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
   await page.mouse.move(p.x,p.y);
   await page.mouse.down();
   await page.waitForTimeout(90);
   await page.mouse.up();
   await page.waitForTimeout(100);
  });
  const mapReady=()=>page.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return c.scene.isActive()&&!!c.__torre2BattlePath;
  },null,{timeout:50000});
  const restartMap=async()=>{
   await page.evaluate(()=>window.__pt2Game.scene.getScene('campanha').scene.restart({}));
   await mapReady();
  };

  await page.goto('http://127.0.0.1:4423/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  const setup=await page.evaluate(async()=>{
   const main=[...document.scripts].find(x=>x.src?.includes('/main.js')).src;
   const core=window.kanto=await import(new URL('./torre2/campaign-core.js',main));
   const progression=await import(new URL('./torre2/progression.js',main));
   const s=core.createCampaign('bulbasaur');
   core.storePokemon(s,1); // Legal deposit of the permanent test Mewtwo.
   core.saveCampaign(s);
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
   return {initial:s.team.map(x=>({id:x.id,level:x.progression.level})),
    box:s.box.map(x=>x.id),threshold7:progression.totalExperienceForLevel(7),
    threshold10:progression.totalExperienceForLevel(10)};
  });
  assert.deepEqual(setup.initial,[{id:'bulbasaur',level:5}]);
  assert.deepEqual(setup.box,['mewtwo']);
  assert.equal(setup.threshold7,343);
  assert.equal(setup.threshold10,1000);
  await mapReady();

  // Acquire seven extra Pokeballs with REAL Mart UI and money deduction;
  // no free inventory. Caterpie at full HP catches with normal RNG ~34%.
  await page.evaluate(()=>{
   const scene=window.__pt2Game.scene.getScene('campanha');
   scene.martScreen(window.kanto.readCampaign());
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')
   .children.list.some(o=>o.active&&o.getData?.('torre2-mart-buy')==='pokeball'));
  for(let i=0;i<7;i++){
   const old=await snapshot();
   await clickMarked('torre2-mart-buy','pokeball');
   await page.waitForFunction(prev=>{
    const now=window.kanto.readCampaign();
    return now.inventory.pokeball===prev+1;
   },old.balls,{timeout:4500});
   const next=await snapshot();
   assert.equal(next.balls,old.balls+1,'Mart must charge for each genuine Pokeball');
   assert.equal(next.money,old.money-200,'Pokeballs cannot be granted for free');
  }
  await restartMap();
  report.start=await snapshot();

  // Preselect a legal Caterpie encounter using ONLY the native encounter RNG
  // parameter. Crucially: do NOT alter the real capture roll, wild HP or level.
  report.encounter=await page.evaluate(()=>{
   const core=window.kanto,s=core.readCampaign(),available=core.wildAvailability(0).available;
   const index=available.indexOf('caterpie');
   if(index<0)throw Error('Caterpie unavailable from real stage-0 grass');
   const got=core.startWildEncounter(s,()=>((index+.5)/available.length));
   if(!got.ok||got.encounter.id!=='caterpie')throw Error('Wrong encounter '+JSON.stringify(got));
   const scene=window.__pt2Game.scene.getScene('campanha');
   scene.enterBattle(s,true);
   return {...got.encounter,available,selectionMethod:'native seeded encounter RNG'};
  });
  assert.equal(report.encounter.level,3);
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.fase==='lucha'&&!!b.__torre2WildCapture;
  },null,{timeout:65000});
  await page.screenshot({path:evidence+'/t03-caterpie-chain-wild-before-capture.png'});
  let captured=false;
  for(let attempt=0;attempt<12&&!captured;attempt++){
   const old=await snapshot();
   assert.ok(old.balls>0,'Normal balls exhausted without capture');
   // Native ball button => native aim => real capture probability.
   await tap(470,61);
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').fase==='torre2-aim',
    null,{timeout:15000});
   await tap(316,186);
   try{
    await page.waitForFunction(balls=>window.kanto.readCampaign().inventory.pokeball===balls-1,
     old.balls,{timeout:20000});
   }catch(error){
    const diag=await page.evaluate(()=>{
     const b=window.__pt2Game.scene.getScene('combate');
     return {phase:b.fase,active:b.scene.isActive(),
      busy:b.__torre2CaptureBusy,
      capture:b.__torre2CaptureDebug||null,
      zones:b.children.list.filter(o=>o.type==='Zone'&&o.active&&o.input?.enabled)
       .slice(-9).map(o=>({x:o.x,y:o.y,width:o.width,height:o.height,depth:o.depth})),
      state:window.kanto.readCampaign()?.inventory?.pokeball};
    });
    console.error('T03 CAPTURE CLICK DIAGNOSTICS',JSON.stringify(diag));
    await page.screenshot({path:evidence+'/t03-caterpie-chain-capture-pointer-failure.png'});
    throw error;
   }
   await page.waitForFunction(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return window.__pt2Game.scene.isActive('campanha')||
     (b.scene.isActive()&&b.fase==='lucha'&&!b.__torre2CaptureBusy);
   },null,{timeout:28000});
   const next=await snapshot();
   captured=next.team.some(m=>m.id==='caterpie');
   report.attempts.push({number:attempt+1,ballsBefore:old.balls,
    ballsAfter:next.balls,captured,stage:next.stage,trainer:next.trainer,wins:next.wins});
   persist();
   if(!captured&&await page.evaluate(()=>window.__pt2Game.scene.isActive('campanha')))
    throw Error('Wild encounter escaped without capture');
  }
  assert.ok(captured,'Caterpie failed native capture after 12 genuine throws');
  await mapReady();
  const capturedState=await snapshot();
  const caterpie=capturedState.team.find(x=>x.id==='caterpie');
  assert.ok(caterpie?.uid);
  assert.equal(caterpie.level,3);
  assert.equal(caterpie.experience,27);
  assert.equal(capturedState.trainer,0);
  assert.equal(capturedState.wins,0);
  assert.equal(capturedState.losses,0);
  assert.equal(capturedState.team.length,2);
  assert.ok(capturedState.caught.includes('caterpie'));
  report.captured={uid:caterpie.uid,state:capturedState};
  persist();

  // Continue genuine trainer fights after Caterpie -> Metapod until Butterfree.
  // No trainer level, EXP, HP, actor invulnerability, damage or victory override.
  // 10 wins are a conservative cap, never a synthetic level-up.
  for(let round=0;round<10;round++){
   const before=await snapshot();
   const opponent=await page.evaluate(()=>window.kanto.currentOpponent(window.kanto.readCampaign()));
   const expected=opponent.id;
   if(round===0)assert.equal(expected,'pidgey','First real trainer changed unexpectedly');
   if(round===1)assert.equal(expected,'rattata','Second real trainer changed unexpectedly');
   await clickMarked('torre2-central-cta',true);
   await page.waitForFunction(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return b.scene.isActive()&&b.fase==='lucha'&&b.__torre2PartyInstalled&&
     b.__torre2AutoMode?.zone?.active;
   },null,{timeout:65000});
   const battle=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return {p1:b.datos.p1,p2:b.datos.p2,enemyLevel:b.datos.torre2.enemyLevel,
     playerLevel:b.datos.torre2.playerLevel,
     party:b.datos.torre2.party.friend.map(m=>m.id)};
   });
   assert.equal(battle.p1,'bulbasaur');
   assert.equal(battle.p2,expected);
   assert.deepEqual(battle.party,['bulbasaur',
    before.team.find(m=>m.uid===caterpie.uid).id]);
   // Poll the saved species during ACTIVE battle: no mid-battle evolution.
   await page.evaluate(uid=>{
    window.__t03AliveSpecies=[];
    window.__t03Poll=setInterval(()=>{
     const b=window.__pt2Game.scene.getScene('combate');
     if(!b.scene.isActive()||b.fase!=='lucha')return;
     const m=window.kanto.readCampaign().team.find(x=>x.uid===uid);
     if(m)window.__t03AliveSpecies.push(m.id);
    },90);
   },caterpie.uid);
   const zone=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate'),zone=b.__torre2AutoMode.zone;
    const r=document.querySelector('#juego canvas').getBoundingClientRect();
    return {x:r.left+zone.x*r.width/640,y:r.top+zone.y*r.height/360};
   });
   await page.mouse.click(zone.x,zone.y);
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').__torre2AutoMode.enabled,
    null,{timeout:7000});
   await page.screenshot({path:evidence+'/t03-caterpie-chain-trainer-'+(round+1)+'-combat.png'});
   try{
    await page.waitForFunction(({wins,losses})=>{
     const s=window.kanto.readCampaign();
     return window.__pt2Game.scene.isActive('campanha')&&
      (s.wins>wins||s.losses>losses);
    },{wins:before.wins,losses:before.losses},{timeout:240000,polling:250});
   }finally{
    const seen=await page.evaluate(()=>{
     clearInterval(window.__t03Poll);
     const found=window.__t03AliveSpecies||[];
     window.__t03Poll=null;return found;
    });
    assert.ok(seen.length,'Actual battle species not observed');
    const beforeSpecies=before.team.find(m=>m.uid===caterpie.uid).id;
    assert.ok(seen.every(id=>id===beforeSpecies),
     'Evolution cannot occur before the battle finishes: '+beforeSpecies);
   }
   const after=await snapshot();
   const current=after.team.find(m=>m.uid===caterpie.uid);
   assert.ok(current,'Captured creature UID must survive real battle');
   assert.equal(after.wins,before.wins+1,'Truly won original trainer battle required');
   assert.equal(after.losses,before.losses,'No staged KO or false victory');
   assert.equal(after.stage,0);
   assert.equal(after.trainer,round+1);
   assert.equal(after.money,before.money+180);
   assert.equal(after.team.length,2);
   assert.equal(after.box.join(','),'mewtwo');
   assert.ok(current.experience>before.team.find(m=>m.uid===caterpie.uid).experience,
    'EXP must actually be awarded by the native trainer battle');
   if(round===0){
    assert.equal(current.id,'caterpie','First real trainer must not evolve prematurely');
    assert.ok(current.level<7,'Level 7 must not be granted early');
   }else{
    assert.equal(current.id,'metapod','Second real victory must evolve Caterpie');
    assert.equal(current.species,'metapod');
    assert.ok(current.level>=7);
    assert.ok(current.experience>=setup.threshold7);
   }else if(current.level<10){
    assert.equal(current.id,'metapod','No Butterfree before real Lv10 EXP threshold');
   }else{
    assert.equal(current.id,'butterfree','Metapod must evolve at real level 10');
    assert.ok(current.experience>=setup.threshold10);
   }
   report.victories.push({opponent:expected,battle,before,after});
   persist();
   console.log('PASS T03 NATURAL XP TRAINER',JSON.stringify({
    round:round+1,foe:expected,from:before.team.find(x=>x.uid===caterpie.uid),
    evolved:current,win:after.wins,money:after.money}));
   await page.screenshot({path:evidence+'/t03-caterpie-chain-trainer-'+(round+1)+'-after.png'});
   if(current.id!=='butterfree'){
    await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')
     .children.list.some(x=>x.active&&x.getData?.('torre2-report-continue')===true),
     null,{timeout:15000});
    await clickMarked('torre2-report-continue',true);
    await page.waitForFunction(()=>!window.__pt2Game.scene.getScene('campanha')
     .children.list.some(x=>x.active&&x.getData?.('torre2-report-continue')===true),
     null,{timeout:15000});
   }
   if(current.id==='butterfree')break;
  }
  assert.ok(report.victories.length>=3&&report.victories.length<=10,
   'All natural EXP fights for a two-step evolution must finish');
  assert.equal(report.victories.at(-1).after.team.find(m=>m.uid===caterpie.uid).id,
   'butterfree','The complete Caterpie family must evolve after real wins');

  // Save/reload is genuine and idempotent. Do not fix the save from the test.
  const beforeReload=await snapshot();
  const raw=await page.evaluate(()=>localStorage.getItem(window.kanto.SAVE_KEY));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),
   null,{timeout:60000});
  const restored=await page.evaluate(async uid=>{
   const main=[...document.scripts].find(x=>x.src?.includes('/main.js')).src;
   const core=window.kanto=await import(new URL('./torre2/campaign-core.js',main));
   const s=core.readCampaign();
   return {save:localStorage.getItem(core.SAVE_KEY),
    member:s.team.find(x=>x.uid===uid),wins:s.wins,trainer:s.trainer,
    stage:s.stage,teamSize:s.team.length,box:s.box.map(x=>x.id)};
  },caterpie.uid);
  assert.equal(restored.save,raw,'Reload must not rewrite a valid save');
  assert.equal(restored.member?.id,'butterfree');
  assert.equal(restored.member?.progression?.level,
   beforeReload.team.find(x=>x.uid===caterpie.uid).level);
  assert.equal(restored.wins,report.victories.length);
  assert.equal(restored.trainer,report.victories.length);
  assert.equal(restored.teamSize,2);
  assert.deepEqual(restored.box,['mewtwo']);

  // Enter next real route fight as the newly evolved Butterfree, to prove
  // that Phaser renders the actual evolved PMD sprite and live move slots.
  await page.evaluate(uid=>{
   const s=window.kanto.readCampaign();
   const index=s.team.findIndex(x=>x.uid===uid);
   if(index<0||!window.kanto.selectTeamMember(s,index))
    throw Error('Cannot select naturally evolved Metapod');
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  },caterpie.uid);
  await mapReady();
  await clickMarked('torre2-central-cta',true);
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.fase==='lucha'&&
    b.__torre2PartyInstalled&&b.luchadores?.[0]?.spr?.texture?.key?.startsWith('pmd-0012-');
  },null,{timeout:65000});
  const live=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),m=b.luchadores[0];
   return {species:b.datos.p1,form:m.forma.nombre,sprite:m.spr.texture.key,
    frame:[m.spr.frame.width,m.spr.frame.height],visible:m.spr.visible,
    active:m.spr.active,loaded:b.textures.exists(m.spr.texture.key),
    moves:Object.fromEntries(['lmb','rmb','q','e'].map(k=>[k,{
     name:m.kit[k]?.nombre,pending:m.kit[k]?.pendiente===true
    }]))};
  });
  assert.equal(live.species,'butterfree');
  assert.equal(live.form.toLowerCase(),'butterfree');
  assert.ok(live.sprite.startsWith('pmd-0011-'));
  assert.ok(live.visible&&live.active&&live.loaded&&live.frame.every(n=>n>0));
  assert.ok(Object.values(live.moves).filter(m=>m.name&&!m.pending).length>=3);
  assert.deepEqual(errors,[]);
  await page.screenshot({path:evidence+'/t03-caterpie-chain-metapod-next-battle.png'});
  report.save={uid:caterpie.uid,restore:restored.member.id,level:restored.member.progression.level,
   sameBytes:raw===restored.save,wins:restored.wins,trainer:restored.trainer};
  report.nextBattle=live;
  persist();
  console.log('PASS T03 CAPTURED CATERPIE -> METAPOD -> BUTTERFREE BY NATURAL TRAINER WINS + SAVE RELOAD + PMD WEBGL',
   JSON.stringify({attempts:report.attempts.length,
    after:report.victories.at(-1).after,save:report.save,nextBattle:live}));
 }finally{persist();await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
