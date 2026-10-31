'use strict';
/* T19: first five Vermilion trainers starting from a real Misty-earned save.
 * No fabricated KO, XP, stage, RNG, badges or money. Native Phaser controls,
 * AUTO, Center, persistence and actual trainer victories only.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const dir='test-evidence';fs.mkdirSync(dir,{recursive:true});
const evidence=JSON.parse(fs.readFileSync(process.env.T19_EARNED_MISTY_SAVE||
 path.join(dir,'t19-earned-misty-save.json'),'utf8'));
assert.equal(evidence.format,'t19-earned-misty-native-save-v1');
assert.equal(evidence.sourceSha,'04f9e1842b0a244b6ee3b3101cbb34f6585993e9',
 'Only the proven #41194363962 native Misty run may seed Vermilion');
assert.equal(evidence.provenance,
 'fifteen native Cerulean trainers and Misty, real Cascata and TM03');
assert.equal(crypto.createHash('sha256').update(evidence.rawSave).digest('hex'),evidence.sha256);
const original=JSON.parse(evidence.rawSave);
assert.equal(original.stage,2);assert.equal(original.trainer,0);
assert.equal(original.wins,42);assert.equal(original.losses,0);
assert.deepEqual(original.badges,['Rocha','Cascata']);
assert.ok(original.inventory.tms.includes('tm-water-pulse'));
assert.ok(original.inventory.tms.includes('tm-rock-tomb'));
assert.ok(!original.inventory.tms.includes('tm-shock-wave'));
assert.ok(original.team.length>=3&&original.team.every(m=>m.id!=='mewtwo'));
assert.equal(new Set(original.team.map(m=>m.uid)).size,original.team.length);
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp',
 '.svg':'image/svg+xml','.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url||'/','http://127.0.0.1');
 const key=url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname;
 const file=path.resolve(root,'.'+key);
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const bytes=await fsp.readFile(file);
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});
  res.end(bytes)}
 catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 await new Promise(ok=>server.listen(4377,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const report={method:'Five natural Vermilion trainer victories in original Phaser',
  seedArtifactRun:41194363962,seedSource:evidence.sourceSha,
  seedSha256:evidence.sha256,expectedWins:47,rounds:[]};
 const write=()=>fs.writeFileSync(dir+'/t19-earned-vermilion-five-report.json',
  JSON.stringify(report,null,2));
 const state=()=>page.evaluate(()=>{
  const s=window.kanto.readCampaign();
  return {stage:s.stage,trainer:s.trainer,wins:s.wins,losses:s.losses,
   money:s.money,badges:[...s.badges],tms:[...s.inventory.tms],active:s.active,
   team:s.team.map(m=>({uid:m.uid,id:m.id,hp:m.hp,
    level:m.progression?.level,xp:m.progression?.experience}))};
 });
 const click=async tag=>{
  // A newly rendered native input Zone becomes hittable only after the
  // Phaser display/input list has advanced; immediate mouse clicks in the
  // same JS frame can be silently ignored without a page error.
  await page.evaluate(()=>new Promise(ok=>
   requestAnimationFrame(()=>requestAnimationFrame(ok))));
  const point=await page.evaluate(tag=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   const zone=c.children.list.find(x=>x.active&&x.input?.enabled&&x.getData?.(tag)===true);
   if(!zone)throw Error('Missing real Phaser input '+tag);
   const rect=document.querySelector('#juego canvas').getBoundingClientRect();
   return {x:rect.x+zone.x*rect.width/640,y:rect.y+zone.y*rect.height/360};
  },tag);
  await page.mouse.click(point.x,point.y);
 };
 const reloadMap=async()=>{
  await page.evaluate(()=>window.__pt2Game.scene.getScene('campanha').scene.restart({}));
  await page.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return c.scene.isActive()&&c.__torre2BattlePath?.stage===2;
  },null,{timeout:45000});
 };
 const saveCheckpoint=async after=>{
  const raw=await page.evaluate(()=>localStorage.getItem(window.kanto.SAVE_KEY));
  assert.ok(raw,'Native battle must save durable bytes');
  const s=JSON.parse(raw);
  assert.equal(s.stage,2);assert.equal(s.trainer,after.trainer);
  assert.equal(s.wins,after.wins);assert.equal(s.losses,0);
  assert.deepEqual(s.team.map(m=>m.uid),after.team.map(m=>m.uid));
  const checkpoint={format:'t19-vermilion-five-earned-native-save-v1',
   sourceSha:process.env.GITHUB_SHA||null,sourceRun:41194363962,
   parentSeedSha256:evidence.sha256,
   provenance:'actual native Phaser battles after proven Misty save',
   rawSave:raw,sha256:crypto.createHash('sha256').update(raw).digest('hex'),
   summary:{stage:s.stage,trainer:s.trainer,wins:s.wins,losses:s.losses,
    badges:s.badges,tms:s.inventory.tms,team:s.team.map(m=>m.uid)}};
  fs.writeFileSync(dir+'/t19-earned-vermilion-five-save.json',
   JSON.stringify(checkpoint,null,2));
  return checkpoint;
 };
 try{
  await page.addInitScript(({key,value})=>{
   if(!sessionStorage.getItem('t19-vermilion-seed-installed')){
    localStorage.setItem(key,value);
    sessionStorage.setItem('t19-vermilion-seed-installed','1');
   }
  },{key:'pokemon-torre-2-kanto-campaign-v1',value:evidence.rawSave});
  await page.goto('http://127.0.0.1:4377/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),
   null,{timeout:60000});
  await page.evaluate(async()=>{
   const main=[...document.scripts].find(s=>s.src?.includes('/main.js'))?.src;
   if(!main)throw Error('Original Phaser main.js unavailable');
   window.kanto=await import(new URL('./torre2/campaign-core.js',main));
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return c.scene.isActive()&&c.__torre2BattlePath?.stage===2;
  },null,{timeout:60000});
  const initial=await state();
  assert.equal(initial.stage,2);assert.equal(initial.trainer,0);
  assert.equal(initial.wins,42);assert.equal(initial.losses,0);
  assert.deepEqual(initial.badges,['Rocha','Cascata']);
  assert.ok(initial.tms.includes('tm-water-pulse'));
  assert.deepEqual(initial.team.map(m=>m.uid),original.team.map(m=>m.uid));
  report.initial=initial;write();
  let after=initial;
  for(let index=0;index<5;index++){
   const before=after;
   await page.evaluate(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    c.centerScreen(window.kanto.readCampaign());
   });
   await click('torre2-center-heal');
   // Prove the Phaser button actually accepted a pointer event. The first
   // click can be missed on a busy WebGL frame; a second *physical click*
   // is allowed only if the native button remains visible and no healing
   // began. Never call healTeam, alter HP, or force the outcome.
   let acknowledged=await page.waitForFunction(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    return c.__torre2CenterBusy===true||
     window.kanto.readCampaign()?.team?.every(m=>m.hp===100);
   },null,{timeout:5000}).then(()=>true).catch(()=>false);
   if(!acknowledged){
    const retryable=await page.evaluate(()=>{
     const c=window.__pt2Game.scene.getScene('campanha');
     return c.scene.isActive()&&!c.__torre2CenterBusy&&
      c.children.list.some(o=>o.active&&o.input?.enabled&&
       o.getData?.('torre2-center-heal')===true);
    });
    assert.equal(retryable,true,
     'Center cannot silently proceed after a missed Phaser pointer event');
    await click('torre2-center-heal');
    acknowledged=await page.waitForFunction(()=>
     window.__pt2Game.scene.getScene('campanha').__torre2CenterBusy===true,
     null,{timeout:5000}).then(()=>true).catch(()=>false);
    assert.equal(acknowledged,true,'Real healing must start before checkpoint');
   }
   try{
    await page.waitForFunction(()=>window.kanto.readCampaign()?.team?.every(m=>m.hp===100)&&
     !window.__pt2Game.scene.getScene('campanha').__torre2CenterBusy,
     null,{timeout:20000});
   }catch(error){
    report.centerFailure=await page.evaluate(()=>{
     const c=window.__pt2Game.scene.getScene('campanha');
     const s=window.kanto.readCampaign();
     return {busy:c.__torre2CenterBusy,active:c.scene.isActive(),
      hp:s.team.map(m=>m.hp),errors:c.children.list.filter(o=>
       o.getData?.('torre2-center-save-error')).map(o=>o.text)};
    });write();throw error;
   }
   const healed=await state();
   assert.equal(healed.wins,before.wins);
   assert.equal(healed.trainer,before.trainer);
   assert.equal(healed.losses,0);
   assert.deepEqual(healed.badges,before.badges);
   assert.deepEqual(healed.tms,before.tms);
   if(healed.active!==0){
    await page.evaluate(()=>{
     const c=window.__pt2Game.scene.getScene('campanha');
     c.showSummary(window.kanto.readCampaign(),0);
    });
    await click('torre2-active-select');
    await page.waitForFunction(()=>window.kanto.readCampaign().active===0,
     null,{timeout:10000});
   }
   await reloadMap();
   const opponent=await page.evaluate(()=>window.kanto.currentOpponent(window.kanto.readCampaign()));
   assert.ok(opponent&&!opponent.leader,'Vermilion '+index+' must be an actual trainer');
   await click('torre2-central-cta');
   await page.waitForFunction(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return b.scene.isActive()&&b.fase==='lucha'&&b.__torre2PartyInstalled&&
     b.__torre2AutoMode?.zone?.active;
   },null,{timeout:60000});
   const fighter=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return {enemy:b.datos.p2,auto:b.__torre2AutoMode.enabled,
     player:b.datos.p1,level:b.datos.torre2.enemyLevel};
   });
   assert.equal(fighter.auto,true,'AUTO must remain active without code editing');
   assert.equal(fighter.enemy,opponent.id,'The real route opponent is required');
   await page.waitForFunction(({wins,losses})=>{
    const s=window.kanto.readCampaign();
    return window.__pt2Game.scene.isActive('campanha')&&
     (s?.wins>wins||s?.losses>losses);
   },{wins:healed.wins,losses:healed.losses},
   {timeout:240000,polling:250});
   after=await state();
   report.rounds.push({index,opponent:opponent.id,kind:opponent.kind,
    enemyLevel:fighter.level,wins:after.wins,losses:after.losses,
    trainer:after.trainer,levels:after.team.map(m=>m.level)});
   report.last=after;write();
   assert.equal(after.losses,0,'Real defeat must fail CI');
   assert.equal(after.wins,healed.wins+1,'Exactly one native win per trainer');
   assert.equal(after.stage,2);assert.equal(after.trainer,index+1);
   assert.deepEqual(after.badges,['Rocha','Cascata']);
   assert.deepEqual(after.tms,initial.tms,'No early Lt Surge TM');
   assert.deepEqual(after.team.map(m=>m.uid),initial.team.map(m=>m.uid));
   assert.ok(after.team.every((m,i)=>m.xp>=healed.team[i].xp),
    'XP cannot decrease after natural battle');
   assert.ok(after.team.some((m,i)=>m.xp>healed.team[i].xp),
    'At least one member must gain earned EXP');
   const checkpoint=await saveCheckpoint(after);
   report.lastCheckpointSha256=checkpoint.sha256;write();
   console.log('PASS T19 NATURAL VERMILION TRAINER',JSON.stringify(report.rounds.at(-1)));
  }
  assert.equal(after.stage,2);assert.equal(after.trainer,5);
  assert.equal(after.wins,47);assert.equal(after.losses,0);
  await page.screenshot({path:dir+'/t19-vermilion-five-native.png'});
  const durable=await page.evaluate(()=>localStorage.getItem(window.kanto.SAVE_KEY));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),
   null,{timeout:60000});
  const restored=await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js'))?.src;
   const core=await import(new URL('./torre2/campaign-core.js',src));
   const s=core.readCampaign();
   return {raw:localStorage.getItem(core.SAVE_KEY),stage:s.stage,trainer:s.trainer,
    wins:s.wins,losses:s.losses,badges:s.badges,tms:s.inventory.tms,
    team:s.team.map(m=>m.uid)};
  });
  assert.equal(restored.raw,durable,'Reload cannot silently rewrite saved checkpoint');
  assert.equal(restored.stage,2);assert.equal(restored.trainer,5);
  assert.equal(restored.wins,47);assert.equal(restored.losses,0);
  assert.deepEqual(restored.badges,['Rocha','Cascata']);
  assert.deepEqual(restored.tms,initial.tms);
  assert.deepEqual(restored.team,initial.team.map(m=>m.uid));
  assert.deepEqual(errors,[],'No uncaught Phaser errors');
  report.reloaded={stage:restored.stage,trainer:restored.trainer,
   wins:restored.wins,losses:restored.losses,durable:true};write();
  console.log('PASS T19 GENUINE VERMILION FIRST FIVE + XP + SAVE RELOAD',
   JSON.stringify(report.reloaded));
 }catch(error){
  report.failure=String(error);
  try{report.lastObserved=await state()}catch{}
  try{await page.screenshot({path:dir+'/t19-vermilion-five-failure.png'})}catch{}
  write();throw error;
 }finally{await page.close();await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
