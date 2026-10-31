'use strict';
/* T19: resume the exact production save earned by T20 native Pallet→Brock.
 * The seed is exported by the original Chromium run, never synthesized.
 * Fifteen genuine Cerulean trainers and Misty, native Center, AUTO, XP and reload.
 * Misty is only proven if the real battle, Cascata, TM03 and reload pass.
 * This is NOT evidence of a physical Android device.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const out='test-evidence';
fs.mkdirSync(out,{recursive:true});
const proof=JSON.parse(fs.readFileSync(
 process.env.T19_EARNED_SAVE||path.join(out,'t19-earned-cerulean-ten-save.json'),'utf8'));
assert.equal(proof.format,'t19-earned-cerulean-ten-native-save-v1');
assert.equal(proof.sourceSha,'e0a63cd33f39c03a6a83f54791bd99899ff7038d',
 'Seed must be the verified output of green T19 run #41178359400');
assert.equal(proof.provenance,'ten consecutive native Cerulean trainers after verified T20 Brock save');
assert.equal(crypto.createHash('sha256').update(proof.rawSave).digest('hex'),proof.sha256);
const original=JSON.parse(proof.rawSave);
assert.equal(original.stage,1);
assert.equal(original.trainer,10);
assert.deepEqual(original.badges,['Rocha']);
assert.ok(original.inventory?.tms?.includes('tm-rock-tomb'));
assert.ok(original.team.length>=3&&original.team.every(m=>m.id!=='mewtwo'));
assert.equal(original.wins,36);
assert.equal(original.wins,proof.summary.wins);
assert.equal(original.losses,0);
assert.ok(!original.badges.includes('Cascata'));
assert.ok(!original.inventory.tms.includes('tm-water-pulse'));
assert.equal(original.losses,proof.summary.losses);
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
 await new Promise(ok=>server.listen(4325,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const report={method:'Genuine T20 exported save; fifteen native Cerulean trainers and Misty in Phaser',
  sourceSha:proof.sourceSha,seedSha256:proof.sha256,seed:proof.summary};
 const saveReport=()=>fs.writeFileSync(out+'/t19-earned-cerulean-misty-report.json',JSON.stringify(report,null,2));
 // Store only victory EARNED and persisted by the real native Phaser route.
 // The file survives an unrelated later timeout so the next continuation
 // can verify its SHA and resume without replaying proven trainers.
 const saveEarnedCheckpoint=async after=>{
  assert.equal(after.stage,1);assert.ok(after.trainer>=11&&after.trainer<=15);
  assert.equal(after.wins,36+after.trainer-10,
   'Checkpoint must have exactly one natural victory per Cerulean trainer');
  assert.equal(after.losses,0);assert.deepEqual(after.badges,['Rocha']);
  assert.ok(after.tms.includes('tm-rock-tomb')&&!after.tms.includes('tm-water-pulse'));
  const raw=await page.evaluate(()=>localStorage.getItem(window.kanto.SAVE_KEY));
  assert.ok(raw,'Native battle must persist an actual campaign save');
  const durable=JSON.parse(raw);
  assert.equal(durable.stage,after.stage);
  assert.equal(durable.trainer,after.trainer);
  assert.equal(durable.wins,after.wins);
  assert.equal(durable.losses,after.losses);
  assert.deepEqual(durable.team.map(m=>m.uid),after.team.map(m=>m.uid));
  const checkpoint={format:'t19-cerulean-genuine-intermediate-save-v1',
   sourceSha:process.env.GITHUB_SHA||null,
   parentSeedSha256:proof.sha256,
   provenance:'earned via actual native Phaser battle in T19 Cerulean continuation',
   rawSave:raw,sha256:crypto.createHash('sha256').update(raw).digest('hex'),
   summary:{stage:after.stage,trainer:after.trainer,wins:after.wins,
    losses:after.losses,badges:after.badges,team:after.team.map(m=>m.uid)}};
  fs.writeFileSync(out+'/t19-native-cerulean-earned-checkpoint.json',
   JSON.stringify(checkpoint,null,2));
  report.lastEarnedCheckpoint={sha256:checkpoint.sha256,...checkpoint.summary};
  saveReport();
 };
 const game=()=>page.evaluate(()=>{
  const s=window.kanto.readCampaign();
  return {stage:s.stage,trainer:s.trainer,wins:s.wins,losses:s.losses,
   money:s.money,badges:s.badges,tms:s.inventory.tms,active:s.active,
   team:s.team.map(m=>({uid:m.uid,id:m.id,hp:m.hp,
    level:m.progression?.level,xp:m.progression?.experience}))};
 });
 const sync=()=>page.evaluate(()=>new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok))));
 const selectHealthyStarter=async()=>{
  const before=await game();
  if(before.active===0)return before;
  assert.ok(before.team[0]?.hp>0,'Starter must be conscious after native Center heal');
  // Same native summary action used in the proven T20 journey: real Phaser click,
  // not an edited save, a synthetic victory or a direct active-slot mutation.
  await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   c.showSummary(window.kanto.readCampaign(),0);
  });
  await clickTag('torre2-active-select');
  await page.waitForFunction(()=>window.kanto.readCampaign()?.active===0,
   null,{timeout:10000});
  const after=await game();
  for(const key of ['stage','trainer','wins','losses','money'])
   assert.equal(after[key],before[key],'Native starter selection cannot alter '+key);
  assert.deepEqual(after.team,before.team,'Native selection cannot modify HP, XP or UID');
  assert.deepEqual(after.badges,before.badges);
  assert.deepEqual(after.tms,before.tms);
  report.starterSelections??=[];
  report.starterSelections.push({before:before.active,after:after.active,
   trainer:after.trainer});
  saveReport();
  return after;
 };
 const clickTag=async id=>{
  await sync();
  const p=await page.evaluate(id=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   const z=c.children.list.find(o=>o.active&&o.input?.enabled&&o.getData?.(id)===true);
   if(!z)throw Error('Missing native clickable Phaser control '+id);
   const r=document.querySelector('#juego canvas').getBoundingClientRect();
   return {x:r.x+z.x*r.width/640,y:r.y+z.y*r.height/360};
  },id);
  await page.mouse.click(p.x,p.y);
 };
 try{
  // Install the saved bytes exactly once. On reload, sessionStorage prevents
  // re-seeding and allows verification of the NEW durable postbattle save.
  await page.addInitScript(({key,value})=>{
   if(!sessionStorage.getItem('t19-earned-seed-installed')){
    localStorage.setItem(key,value);
    sessionStorage.setItem('t19-earned-seed-installed','1');
   }
  },{key:'pokemon-torre-2-kanto-campaign-v1',value:proof.rawSave});
  await page.goto('http://127.0.0.1:4325/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  await page.evaluate(async()=>{
   const main=[...document.scripts].find(s=>s.src?.includes('/main.js'))?.src;
   if(!main)throw Error('Native Phaser main.js missing');
   window.kanto=await import(new URL('./torre2/campaign-core.js',main));
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
   !!window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,null,{timeout:45000});
  const before=await game();
  assert.equal(before.stage,1);assert.equal(before.trainer,10);
  assert.equal(before.wins,original.wins);assert.equal(before.losses,original.losses);
  assert.deepEqual(before.badges,['Rocha']);
  assert.ok(before.tms.includes('tm-rock-tomb'));
  assert.deepEqual(before.team.map(m=>m.uid),original.team.map(m=>m.uid));
  report.loaded=before;saveReport();
  // Use the actual Center heal control. No direct HP/EXP, item or state edits.
  await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   c.centerScreen(window.kanto.readCampaign());
  });
  await clickTag('torre2-center-heal');
  await page.waitForFunction(()=>window.kanto.readCampaign()?.team?.every(m=>m.hp===100)&&
   !window.__pt2Game.scene.getScene('campanha').__torre2CenterBusy,
   null,{timeout:20000});
  const healed=await game();
  for(const key of ['stage','trainer','wins','losses','money'])
   assert.equal(healed[key],before[key],'Native Center cannot alter '+key);
  assert.deepEqual(healed.badges,before.badges);
  assert.deepEqual(healed.tms,before.tms);
  assert.ok(healed.team.every(m=>m.hp===100));
  report.center=healed;
  await page.evaluate(()=>window.__pt2Game.scene.getScene('campanha').scene.restart({}));
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
   !!window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,null,{timeout:45000});
  const opponent=await page.evaluate(()=>window.kanto.currentOpponent(window.kanto.readCampaign()));
  assert.ok(opponent&&!opponent.leader,'First Cerulean opponent must be an ordinary trainer');
  assert.equal(opponent.id,'zubat','Stage 1 first route trainer must remain authentic');
  report.opponent=opponent;
  await clickTag('torre2-central-cta');
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.fase==='lucha'&&b.__torre2PartyInstalled&&
    b.__torre2AutoMode?.zone?.active;
  },null,{timeout:60000});
  const open=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return {player:b.datos.p1,enemy:b.datos.p2,
    level:b.datos.torre2.playerLevel,auto:b.__torre2AutoMode?.enabled};
  });
  assert.equal(open.enemy,opponent.id);
  assert.equal(open.player,healed.team[healed.active].id);
  assert.equal(open.auto,true,'Campaign AUTO must be enabled on real stage-1 battle');
  report.open=open;saveReport();
  await page.screenshot({path:out+'/t19-native-cerulean-first-trainer-combat.png'});
  await page.waitForFunction(({wins,losses})=>{
   const s=window.kanto.readCampaign();
   return window.__pt2Game.scene.isActive('campanha')&&
    (s?.wins>wins||s?.losses>losses);
  },{wins:healed.wins,losses:healed.losses},{timeout:240000,polling:250});
  let after=await game();
  report.result=after;saveReport();
  assert.equal(after.losses,healed.losses,'Real defeat; do not claim a victory');
  assert.equal(after.wins,healed.wins+1,'First Cerulean trainer must be defeated naturally');
  assert.equal(after.stage,1);assert.equal(after.trainer,11);
  assert.deepEqual(after.badges,['Rocha'],'Misty badge cannot appear before Misty');
  assert.deepEqual(after.tms,healed.tms,'No TM reward before the leader');
  assert.deepEqual(after.team.map(m=>m.uid),healed.team.map(m=>m.uid));
  assert.ok(after.team.some((m,i)=>m.xp>healed.team[i].xp),
   'Real trainer victory must award actual party XP');
  await saveEarnedCheckpoint(after);
  // Continue beyond the already-proven first trainer using ONLY native
  // Phaser controls and the same earned durable save. No direct state edits,
  // forced KOs, invented experience, enemy manipulation or RNG overrides.
  const rounds=[{trainer:after.trainer,opponent:opponent.id,wins:after.wins}];
  for(let next=after.trainer;next<15;next++){
   const previous=after;
   await page.evaluate(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    c.centerScreen(window.kanto.readCampaign());
   });
   await clickTag('torre2-center-heal');
   await page.waitForFunction(()=>window.kanto.readCampaign()?.team?.every(m=>m.hp===100)&&
    !window.__pt2Game.scene.getScene('campanha').__torre2CenterBusy,
    null,{timeout:20000});
   const restored=await selectHealthyStarter();
   assert.equal(restored.wins,previous.wins,'Center cannot grant a win');
   assert.equal(restored.losses,previous.losses,'Center cannot conceal a defeat');
   assert.equal(restored.trainer,previous.trainer);
   assert.deepEqual(restored.badges,previous.badges);
   assert.deepEqual(restored.tms,previous.tms);
   await page.evaluate(()=>window.__pt2Game.scene.getScene('campanha').scene.restart({}));
   await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
    !!window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,
    null,{timeout:45000});
   const nextOpponent=await page.evaluate(()=>window.kanto.currentOpponent(window.kanto.readCampaign()));
   assert.ok(nextOpponent?.id&&!nextOpponent.leader,
    'Cerulean trainer '+next+' must not be Misty or a fabricated encounter');
   await clickTag('torre2-central-cta');
   await page.waitForFunction(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return b.scene.isActive()&&b.fase==='lucha'&&b.__torre2PartyInstalled&&
     b.__torre2AutoMode?.zone?.active;
   },null,{timeout:60000});
   const opening=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return {enemy:b.datos.p2,auto:b.__torre2AutoMode.enabled};
   });
   assert.equal(opening.enemy,nextOpponent.id,'The actual native foe must match route data');
   assert.equal(opening.auto,true,'AUTO must stay on without a synthetic click');
   await page.waitForFunction(({wins,losses})=>{
    const s=window.kanto.readCampaign();
    return window.__pt2Game.scene.isActive('campanha')&&
     (s?.wins>wins||s?.losses>losses);
   },{wins:restored.wins,losses:restored.losses},{timeout:240000,polling:250});
   after=await game();
   rounds.push({trainer:after.trainer,opponent:nextOpponent.id,
    role:nextOpponent.kind,wins:after.wins,losses:after.losses,
    levels:after.team.map(m=>m.level)});
   report.rounds=rounds;report.result=after;saveReport();
   assert.equal(after.losses,restored.losses,
    'A real loss cannot be recorded as a successful trainer clear');
   assert.equal(after.wins,restored.wins+1,'Native battle must award one genuine victory');
   assert.equal(after.stage,1);
   assert.equal(after.trainer,next+1);
   assert.deepEqual(after.badges,['Rocha'],'Misty badge is not yet earned');
   assert.deepEqual(after.tms,restored.tms,'No early TM rewards');
   assert.deepEqual(after.team.map(m=>m.uid),restored.team.map(m=>m.uid));
   assert.ok(after.team.every((m,i)=>m.xp>=restored.team[i].xp),
    'No earned XP may be removed');
   await saveEarnedCheckpoint(after);
   console.log('PASS T19 REAL CERULEAN TRAINER',JSON.stringify(rounds.at(-1)));
  }
  assert.equal(after.trainer,15,'Exactly fifteen native Cerulean trainers must be beaten');
  await page.screenshot({path:out+'/t19-native-cerulean-ten-trainers-result.png'});

  // At trainer 15 the genuine route reaches Misty. No fake stage, badges,
  // XP, enemy HP, battle result or RNG manipulation is permitted.
  await page.screenshot({path:out+'/t19-before-misty-native.png'});
  const preMisty=after;
  await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   c.centerScreen(window.kanto.readCampaign());
  });
  await clickTag('torre2-center-heal');
  await page.waitForFunction(()=>window.kanto.readCampaign()?.team?.every(m=>m.hp===100)&&
   !window.__pt2Game.scene.getScene('campanha').__torre2CenterBusy,
   null,{timeout:20000});
  const healedMisty=await selectHealthyStarter();
  assert.equal(healedMisty.wins,preMisty.wins);
  assert.equal(healedMisty.losses,preMisty.losses);
  assert.equal(healedMisty.trainer,15);
  assert.deepEqual(healedMisty.badges,['Rocha']);
  await page.evaluate(()=>window.__pt2Game.scene.getScene('campanha').scene.restart({}));
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
   !!window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,
   null,{timeout:45000});
  const leader=await page.evaluate(()=>window.kanto.currentOpponent(window.kanto.readCampaign()));
  assert.equal(leader.leader,true);
  assert.equal(leader.name,'Misty');
  assert.equal(leader.id,'starmie');
  await clickTag('torre2-central-cta');
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.fase==='lucha'&&b.__torre2PartyInstalled&&
    b.__torre2AutoMode?.zone?.active;
  },null,{timeout:60000});
  const leaderOpening=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return {enemy:b.datos.p2,auto:b.__torre2AutoMode.enabled};
  });
  assert.equal(leaderOpening.enemy,'staryu','Misty must send first roster member');
  assert.equal(leaderOpening.auto,true);
  await page.screenshot({path:out+'/t19-misty-native-combat.png'});
  await page.waitForFunction(({wins,losses})=>{
   const st=window.kanto.readCampaign();
   return window.__pt2Game.scene.isActive('campanha')&&
    (st?.wins>wins||st?.losses>losses);
  },{wins:healedMisty.wins,losses:healedMisty.losses},
  {timeout:420000,polling:250});
  after=await game();
  report.misty={before:healedMisty,after,leader,opening:leaderOpening};
  saveReport();
  assert.equal(after.losses,healedMisty.losses,'Misty defeat cannot count as a win');
  assert.equal(after.wins,healedMisty.wins+1);
  assert.equal(after.stage,2,'Misty victory must advance to next city');
  assert.equal(after.trainer,0);
  assert.deepEqual(after.badges,['Rocha','Cascata']);
  assert.ok(after.tms.includes('tm-water-pulse'),'TM03 must be earned from Misty');
  assert.ok(after.tms.includes('tm-rock-tomb'),'TM39 must remain');
  assert.deepEqual(after.team.map(m=>m.uid),healedMisty.team.map(m=>m.uid));
  assert.ok(after.team.every((m,i)=>m.xp>=healedMisty.team[i].xp));
  await page.screenshot({path:out+'/t19-misty-cascata-native.png'});

  const saved=await page.evaluate(()=>localStorage.getItem(window.kanto.SAVE_KEY));
  assert.ok(saved&&saved!==proof.rawSave,'Native battle must commit a new save');
  await page.screenshot({path:out+'/t19-native-cerulean-first-trainer-result.png'});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  const reloaded=await page.evaluate(async()=>{
   const main=[...document.scripts].find(s=>s.src?.includes('/main.js'))?.src;
   const core=await import(new URL('./torre2/campaign-core.js',main));
   const s=core.readCampaign();
   return {bytes:localStorage.getItem(core.SAVE_KEY),stage:s.stage,
    trainer:s.trainer,wins:s.wins,losses:s.losses,
    badges:s.badges,tms:s.inventory.tms,team:s.team.map(m=>m.uid)};
  });
  assert.equal(reloaded.bytes,saved,'Reload must not rewrite genuine saved progress');
  assert.equal(reloaded.stage,2);assert.equal(reloaded.trainer,0);
  assert.equal(reloaded.wins,after.wins);assert.equal(reloaded.losses,after.losses);
  assert.deepEqual(reloaded.badges,after.badges);
  assert.ok(reloaded.badges.includes('Cascata'));
  assert.ok(reloaded.tms.includes('tm-water-pulse'));
  assert.deepEqual(reloaded.tms,after.tms);
  assert.deepEqual(reloaded.team,after.team.map(m=>m.uid));
  assert.deepEqual(errors,[],'No uncaught JS exceptions in genuine Cerulean battle');
  report.reload={saveUnchanged:true,stage:reloaded.stage,trainer:reloaded.trainer,
   wins:reloaded.wins,losses:reloaded.losses};saveReport();
  // Export exact durable bytes earned by native Misty victory + reload, not a fixture.
  const exported={format:'t19-earned-misty-native-save-v1',
   sourceSha:process.env.GITHUB_SHA||null,parentSeedSha256:proof.sha256,
   provenance:'fifteen native Cerulean trainers and Misty, real Cascata and TM03',
   rawSave:saved,sha256:crypto.createHash('sha256').update(saved).digest('hex'),
   summary:report.reload};
  fs.writeFileSync(out+'/t19-earned-misty-save.json',JSON.stringify(exported,null,2));
  console.log('PASS T19 FIFTEEN CERULEAN TRAINERS + MISTY CASCATA TM03 XP RELOAD',JSON.stringify(report.reload));
 }catch(error){
  report.failure=String(error);
  try{report.diagnostic=await game()}catch{}
  try{report.combatDiagnostic=await page.evaluate(()=>{
   const b=window.__pt2Game?.scene?.getScene('combate');
   if(!b)return {scene:'missing'};
   return {active:b.scene.isActive(),fase:b.fase,time:b.t,
    round:b.ronda,auto:b.__torre2AutoMode?.enabled,
    playerIndex:b.datos?.torre2?.party?.playerIndex,
    enemy:b.datos?.p2,
    fighters:(b.luchadores||[]).map(m=>({id:m.id,hp:m.hp,hpMax:m.hpMax,
     status:m.est?.status||null}))};
  })}catch{}
  try{await page.screenshot({path:out+'/t19-native-cerulean-failure.png'})}catch{}
  saveReport();throw error;
 }finally{await page.close();await browser.close();server.close()}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
