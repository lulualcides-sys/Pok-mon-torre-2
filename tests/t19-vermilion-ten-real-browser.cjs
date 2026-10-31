'use strict';
/* T19 — trainer 5→10 of Vermilion, from authentic post-wild-exp checkpoint.
 * Real Phaser UI; when an actual defeat occurs heal, earn wild EXP, and retry.
 * No forced KO, XP, levels, victory, RNG, wild species, or trainer advances.
 */
const assert=require('node:assert/strict'),fs=require('node:fs');
const fsp=require('node:fs/promises'),path=require('node:path');
const http=require('node:http'),crypto=require('node:crypto');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const dir='test-evidence';fs.mkdirSync(dir,{recursive:true});
const proof=JSON.parse(fs.readFileSync(process.env.T19_EARNED_GRIND_SAVE||
  path.join(dir,'t19-vermilion-earned-grind-save.json'),'utf8'));
assert.equal(proof.format,'t19-vermilion-grind-native-save-v1');
assert.equal(proof.sourceSha,'b6f0f9af6c80db2221897238a0f9d235f2291237');
assert.equal(proof.provenance,'two actual wild victories after 5 natural Vermilion trainers');
assert.equal(crypto.createHash('sha256').update(proof.rawSave).digest('hex'),proof.sha256);
const origin=JSON.parse(proof.rawSave);
assert.equal(origin.stage,2);assert.equal(origin.trainer,5);
assert.equal(origin.wins,49);assert.equal(origin.losses,0);
assert.deepEqual(origin.badges,['Rocha','Cascata']);
assert.ok(origin.inventory.tms.includes('tm-rock-tomb')&&
 origin.inventory.tms.includes('tm-water-pulse'));
assert.ok(origin.team.length>=3&&origin.team.every(m=>m.id!=='mewtwo'));
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp',
 '.svg':'image/svg+xml','.mp3':'audio/mpeg','.ogg':'audio/ogg'};
const server=http.createServer(async(req,res)=>{
 const uri=new URL(req.url||'/','http://127.0.0.1');
 const fp=path.resolve(root,'.'+(uri.pathname.endsWith('/')?uri.pathname+'index.html':uri.pathname));
 if(!fp.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const data=await fsp.readFile(fp);
  res.writeHead(200,{'content-type':mime[path.extname(fp)]||'application/octet-stream'});
  res.end(data);
 }catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 await new Promise(ok=>server.listen(4384,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const report={source:'real after-Misty five Vermilion wins + 2 real wild exp wins',
  checkpointSha256:proof.sha256,seed:{stage:2,trainer:5,wins:49,losses:0},
  method:'Original Phaser UI, native AUTO, actual Center, real wild XP on defeat',
  rounds:[],recovery:[],caught:[],limits:{recoveryCyclesPerTrainer:2,grindWinsPerCycle:2}};
 const write=()=>fs.writeFileSync(dir+'/t19-vermilion-ten-report.json',
  JSON.stringify(report,null,2));
 const now=()=>page.evaluate(()=>{
  const s=window.kanto.readCampaign();
  return {stage:s.stage,trainer:s.trainer,wins:s.wins,losses:s.losses,
   money:s.money,balls:s.inventory.pokeball,active:s.active,
   badges:[...s.badges],tms:[...s.inventory.tms],
   team:s.team.map(m=>({id:m.id,uid:m.uid,hp:m.hp,
    lvl:m.progression.level,xp:m.progression.experience})),box:s.box.map(m=>m.uid),
   cap:window.kantoLevelCap(s.stage)};
 });
 const frames=()=>page.evaluate(()=>new Promise(ok=>
  requestAnimationFrame(()=>requestAnimationFrame(ok))));
 const tapXY=async(x,y)=>{
  await frames();
  const p=await page.evaluate(v=>{
   const r=document.querySelector('#juego canvas').getBoundingClientRect();
   return {x:r.x+v[0]*r.width/640,y:r.y+v[1]*r.height/360};
  },[x,y]);await page.mouse.move(p.x,p.y);await page.mouse.down();
  await page.waitForTimeout(90);await page.mouse.up();
 };
 const tapTag=async tag=>{
  await frames();
  const point=await page.evaluate(tag=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   const z=c.children.list.find(o=>o.active&&o.input?.enabled&&
    o.getData?.(tag)===true);
   if(!z)throw Error('Missing native input '+tag);
   const r=document.querySelector('#juego canvas').getBoundingClientRect();
   return {x:r.x+z.x*r.width/640,y:r.y+z.y*r.height/360};
  },tag);
  await page.mouse.click(point.x,point.y);
 };
 const map=async()=>{
  await page.evaluate(()=>window.__pt2Game.scene.getScene('campanha').scene.restart({}));
  await page.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return c.scene.isActive()&&c.__torre2BattlePath?.stage===2;
  },null,{timeout:45000});
 };
 const center=async()=>{
  await page.evaluate(()=>window.__pt2Game.scene.getScene('campanha')
   .centerScreen(window.kanto.readCampaign()));
  let begun=false;
  for(let attempt=0;attempt<2&&!begun;attempt++){
   await tapTag('torre2-center-heal');
   begun=await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha').__torre2CenterBusy,
    null,{timeout:4000}).then(()=>true).catch(()=>false);
   if(!begun)assert.ok(await page.evaluate(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    return c.scene.isActive()&&!c.__torre2CenterBusy&&
     c.children.list.some(o=>o.active&&o.input?.enabled&&
       o.getData?.('torre2-center-heal')===true);
   }),'Native Center click failed and no safe retry exists');
  }
  assert.equal(begun,true,'Native Phaser healing must start');
  await page.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return c.scene.isActive()&&c.__torre2BattlePath&&
    window.kanto.readCampaign().team.every(m=>m.hp===100)&&!c.__torre2CenterBusy;
  },null,{timeout:20000});
 };
 const startWild=async()=>{
  const before=await now();
  await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   c.grassScreen(window.kanto.readCampaign());
  });
  await tapXY(465,292);
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.fase==='lucha'&&
    b.__torre2WildCapture&&b.__torre2AutoMode?.enabled;
  },null,{timeout:60000});
  const wild=await page.evaluate(()=>window.kanto.readCampaign().pendingWild?.id);
  assert.ok(wild,'Native encounter must be durable');
  return {before,wild};
 };
 const outcome=async(before,timeoutMs=230000)=>{
  await page.waitForFunction(({wins,losses})=>{
   const s=window.kanto.readCampaign();
   return window.__pt2Game.scene.isActive('campanha')&&
    (s.wins>wins||s.losses>losses);
  },{wins:before.wins,losses:before.losses},
  {timeout:timeoutMs,polling:200});
  return now();
 };
 const checkpoint=async(state,label)=>{
  const raw=await page.evaluate(()=>localStorage.getItem(window.kanto.SAVE_KEY));
  assert.ok(raw);
  const s=JSON.parse(raw);
  assert.equal(s.stage,state.stage);assert.equal(s.trainer,state.trainer);
  assert.equal(s.wins,state.wins);assert.equal(s.losses,state.losses);
  assert.deepEqual(s.team.map(m=>m.uid),state.team.map(m=>m.uid));
  const saved={format:'t19-vermilion-ten-earned-native-save-v1',
   sourceSha:process.env.GITHUB_SHA||null,parentSeedSha256:proof.sha256,
   provenance:'real native trainers 5-10 with recovery from actual wild XP if needed',
   rawSave:raw,sha256:crypto.createHash('sha256').update(raw).digest('hex'),
   summary:{stage:s.stage,trainer:s.trainer,wins:s.wins,losses:s.losses,
    badges:s.badges,tms:s.inventory.tms,team:s.team.map(m=>
      ({id:m.id,uid:m.uid,level:m.progression.level,xp:m.progression.experience}))}};
  fs.writeFileSync(dir+'/t19-vermilion-ten-checkpoint.json',JSON.stringify(saved,null,2));
  report.lastCheckpoint={label,sha256:saved.sha256,...saved.summary};
  write();
 };
 const recover=async({trainer,attempt})=>{
  // The real loss already exists in the save and MUST NEVER be hidden.
  const events={trainer,attempt,encounters:[],captures:[],xpGained:0};
  const previous=await now();
  for(let k=0,wildWins=0;k<4&&wildWins<2;k++){
   await center();
   const before=await now();
   // If all members have hit the stage cap, more farming costs time
   // and cannot raise levels. Preserve status and retry strategy instead.
   if(before.team.every(m=>m.lvl>=before.cap)){
    events.capReached=true;break;
   }
   const started=await startWild();
   // One real capture attempt while grinding when balls and party slots permit.
   // A caught Pokemon joins the team; escaping does not count as success.
   if(k===0&&started.before.balls>0&&started.before.team.length<6){
    await tapXY(430,241);
    await page.waitForFunction(()=>{
     const b=window.__pt2Game.scene.getScene('combate');
     return b.scene.isActive()&&b.fase==='torre2-aim';
    },null,{timeout:10000});
    await tapXY(316,186);
    await page.waitForFunction(({balls})=>{
     const b=window.__pt2Game.scene.getScene('combate');
     return window.kanto.readCampaign().inventory.pokeball===balls-1&&(
      b.__torre2CaptureDebug?.state==='RESUME'||
      b.__torre2CaptureDebug?.state==='CAUGHT'||
      window.__pt2Game.scene.isActive('campanha'));
    },{balls:started.before.balls},{timeout:35000});
    const afterCatch=await now();
    const caught=afterCatch.team.length===started.before.team.length+1;
    events.captures.push({species:started.wild,caught,ballsUsed:1});
    report.caught.push({trainer,species:started.wild,caught});write();
    if(caught){
     assert.equal(afterCatch.trainer,trainer);
     assert.equal(afterCatch.wins,started.before.wins);
     assert.equal(afterCatch.balls,started.before.balls-1);
     continue;
    }
   }
   const end=await outcome(started.before);
   assert.equal(end.trainer,trainer);
   if(end.wins>started.before.wins){
    wildWins++;
    assert.ok(end.team.some((m,i)=>m.xp>(started.before.team[i]?.xp??0)),
     'Wild victory must award actual XP');
    events.xpGained+=end.team.slice(0,started.before.team.length).reduce((sum,m,i)=>
      sum+Math.max(0,m.xp-started.before.team[i].xp),0);
   }
   events.encounters.push({species:started.wild,won:end.wins>started.before.wins,
    wins:end.wins,losses:end.losses,levels:end.team.map(m=>m.lvl)});
   await checkpoint(end,'recovery trainer '+trainer+' encounter '+k);
  }
  report.recovery.push(events);write();
  return now();
 };
 try{
  await page.addInitScript(({key,raw})=>{
   if(!sessionStorage.getItem('t19-vermilion-ten-seeded')){
    localStorage.setItem(key,raw);sessionStorage.setItem('t19-vermilion-ten-seeded','1');
   }
  },{key:'pokemon-torre-2-kanto-campaign-v1',raw:proof.rawSave});
  await page.goto('http://127.0.0.1:4384/arena2d/?original=1',
   {waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),
   null,{timeout:60000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const base=new URL('./torre2/',src);
   window.kanto=await import(new URL('campaign-core.js',base));
   const level=await import(new URL('kanto-levels.js',base));
   window.kantoLevelCap=level.currentLevelCap;
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
   !!window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,
   null,{timeout:60000});
  let s=await now();
  assert.equal(s.stage,2);assert.equal(s.trainer,5);
  assert.equal(s.wins,49);assert.equal(s.losses,0);assert.equal(s.cap,24);
  assert.deepEqual(s.badges,['Rocha','Cascata']);
  assert.deepEqual(s.team.map(m=>m.uid),origin.team.map(m=>m.uid));
  report.initial=s;write();
  for(let trainer=5;trainer<10;trainer++){
   let won=false;
   for(let attempt=0;attempt<=2&&!won;attempt++){
    await center();
    s=await now();
    assert.equal(s.stage,2);assert.equal(s.trainer,trainer);
    await map();
    const foe=await page.evaluate(()=>window.kanto.currentOpponent(window.kanto.readCampaign()));
    assert.ok(foe&&!foe.leader,'Expected a real Vermilion trainer');
    await tapTag('torre2-central-cta');
    await page.waitForFunction(()=>{
     const b=window.__pt2Game.scene.getScene('combate');
     return b.scene.isActive()&&b.fase==='lucha'&&
      b.__torre2PartyInstalled&&b.__torre2AutoMode?.enabled;
    },null,{timeout:60000});
    const opened=await page.evaluate(()=>{
     const b=window.__pt2Game.scene.getScene('combate');
     return {enemy:b.datos.p2,auto:b.__torre2AutoMode.enabled};
    });
    assert.equal(opened.enemy,foe.id);assert.equal(opened.auto,true);
    const after=await outcome(s);
    const event={trainer,attempt,foe:foe.id,won:after.trainer===trainer+1,
     wins:after.wins,losses:after.losses,levels:after.team.map(m=>m.lvl)};
    report.rounds.push(event);write();
    assert.equal(after.stage,2);assert.ok(after.trainer===trainer||after.trainer===trainer+1);
    assert.deepEqual(after.badges,['Rocha','Cascata']);
    assert.deepEqual(after.tms,s.tms);
    if(event.won){
     assert.equal(after.wins,s.wins+1,'One genuine trainer win required');
     assert.ok(after.team.some((m,i)=>m.xp>(s.team[i]?.xp??0)),
      'Trainer must give earned XP');
     won=true;
     await checkpoint(after,'trainer '+(trainer+1)+' victory');
     console.log('PASS T19 NATIVE VERMILION TRAINER',JSON.stringify(event));
    }else{
     assert.equal(after.losses,s.losses+1,'Cannot hide a real trainer loss');
     assert.equal(attempt<2,true,'Two bounded recovery cycles exhausted');
     await checkpoint(after,'trainer '+trainer+' real loss');
     const recovered=await recover({trainer,attempt});
     assert.equal(recovered.stage,2);assert.equal(recovered.trainer,trainer);
    }
   }
   assert.ok(won,'Trainer '+trainer+' was not naturally beaten after bounded recovery');
  }
  const final=await now();
  assert.equal(final.stage,2);assert.equal(final.trainer,10);
  assert.ok(final.wins>=54,'Five real trainer wins plus any wild wins');
  assert.deepEqual(final.badges,['Rocha','Cascata']);
  assert.deepEqual(final.tms,['tm-rock-tomb','tm-water-pulse']);
  await page.screenshot({path:dir+'/t19-vermilion-ten-real-result.png'});
  const raw=await page.evaluate(()=>localStorage.getItem(window.kanto.SAVE_KEY));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),
   null,{timeout:60000});
  const restored=await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=await import(new URL('./torre2/campaign-core.js',src));
   const s=core.readCampaign();
   return {raw:localStorage.getItem(core.SAVE_KEY),trainer:s.trainer,
    stage:s.stage,wins:s.wins,losses:s.losses,
    badges:s.badges,tms:s.inventory.tms,team:s.team.map(m=>m.uid)};
  });
  assert.equal(restored.raw,raw);
  assert.equal(restored.stage,2);assert.equal(restored.trainer,10);
  assert.equal(restored.wins,final.wins);assert.equal(restored.losses,final.losses);
  assert.deepEqual(restored.badges,final.badges);
  assert.deepEqual(restored.tms,final.tms);
  assert.deepEqual(restored.team,final.team.map(m=>m.uid));
  assert.deepEqual(errors,[]);
  report.result={trainer:10,wins:final.wins,losses:final.losses,
   team:final.team,reloaded:true};write();
  console.log('PASS T19 VERMILION 10 NATIVE TRAINERS + BOUNDED RECOVERY',JSON.stringify(report.result));
 }catch(e){
  report.error=String(e);
  try{report.last=await now()}catch{}
  try{await page.screenshot({path:dir+'/t19-vermilion-ten-error.png'})}catch{}
  write();throw e;
 }finally{await page.close();await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
