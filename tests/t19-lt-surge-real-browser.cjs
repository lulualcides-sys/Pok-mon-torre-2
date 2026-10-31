'use strict';
/* T19 — Lt. Surge from the authentic 17-trainer Vermilion checkpoint.
 * Real Phaser UI; after genuine defeat heal, earn wild EXP, and retry.
 * No forced KO, XP, levels, victory, RNG, wild species, or trainer advances.
 */
const assert=require('node:assert/strict'),fs=require('node:fs');
const fsp=require('node:fs/promises'),path=require('node:path');
const http=require('node:http'),crypto=require('node:crypto');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const dir='test-evidence';fs.mkdirSync(dir,{recursive:true});
const proof=JSON.parse(fs.readFileSync(process.env.T19_EARNED_GRIND_SAVE||
  path.join(dir,'t19-vermilion-three-checkpoint.json'),'utf8'));
assert.equal(proof.format,'t19-vermilion-three-earned-native-save-v1');
assert.equal(proof.sourceSha,'244d41ca4c5fe1dcb5c3b3ab8b78c75af11bc7c9');
assert.match(proof.sha256,/^[a-f0-9]{64}$/);
assert.match(proof.parentSeedSha256,/^[a-f0-9]{64}$/);
assert.equal(proof.provenance,
 'real native trainer14 to trainer17 with bounded recovery in original Phaser');
assert.equal(crypto.createHash('sha256').update(proof.rawSave).digest('hex'),proof.sha256);
const origin=JSON.parse(proof.rawSave);
assert.equal(origin.stage,2);assert.equal(origin.trainer,17);
assert.ok(origin.wins>=64);assert.equal(origin.losses,0);
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
 const report={source:'stage2 trainer17 checkpoint from proven 17 Vermilion trainers and natural XP',
  checkpointSha256:proof.sha256,seed:{stage:2,trainer:17,wins:origin.wins,losses:origin.losses},
  warmupWild:[],stalls:[],
  method:'Original Phaser UI, native AUTO, actual Center, real wild XP on defeat',
  rounds:[],recovery:[],caught:[],limits:{recoveryCyclesPerTrainer:2,grindWinsPerCycle:2}};
 const write=()=>fs.writeFileSync(dir+'/t19-lt-surge-report.json',
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
   // Center can finish a legitimate native heal before the browser samples
   // its short-lived busy flag. The route plus full-HP persisted save is
   // stronger completion evidence than observing the transient animation.
   begun=await page.waitForFunction(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    const s=window.kanto.readCampaign();
    return c.__torre2CenterBusy||
     (c.scene.isActive()&&!!c.__torre2BattlePath&&
      s.team.every(m=>m.hp===100)&&!c.__torre2CenterBusy);
   },null,{timeout:4000}).then(()=>true).catch(()=>false);
   if(!begun)assert.ok(await page.evaluate(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    return c.scene.isActive()&&!c.__torre2CenterBusy&&
     c.children.list.some(o=>o.active&&o.input?.enabled&&
       o.getData?.('torre2-center-heal')===true);
   }),'Native Center click failed and no safe retry exists');
  }
  assert.equal(begun,true,'Native Center must start or complete healing');
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
 const outcome=async(before,timeoutMs=360000)=>{
  // First window lets native AUTO fight. If still active after 145 seconds,
  // use ONLY a real sidebar switch via Phaser mouse. This is not a win,
  // defeat, direct input injection, HP edit, XP edit or battle reset.
  const finished=()=>page.waitForFunction(({wins,losses})=>{
   const s=window.kanto.readCampaign();
   return window.__pt2Game.scene.isActive('campanha')&&
    (s.wins>wins||s.losses>losses);
  },{wins:before.wins,losses:before.losses},
  {timeout:145000,polling:200}).then(()=>true).catch(()=>false);
  if(await finished())return now();
  const battle=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   const party=b.datos?.torre2?.party;
   const slots=b.__torre2SideParty?.slots||[];
   const actors=b.luchadores||[];
   const target=party&&party.friend.findIndex((m,i)=>
    i!==party.playerIndex&&m.hp>0&&m.id==='geodude');
   const next=target>=0?target:party?.friend.findIndex((m,i)=>
    i!==party.playerIndex&&m.hp>0)??-1;
   const zone=next>=0?slots[next]:null;
   return {scene:b.scene.isActive(),phase:b.fase,auto:b.__torre2AutoMode?.enabled,
    active:party?.playerIndex,next,canSwitch:!!(zone?.active&&zone?.input?.enabled),
    zone:zone?{x:zone.x,y:zone.y}:null,
    changes:b.__torre2PlayerSwitches??0,
    player:actors[0]?{hp:actors[0].hp,max:actors[0].hpMax}:null,
    enemy:actors[1]?{hp:actors[1].hp,max:actors[1].hpMax,id:b.datos.p2}:null};
  });
  report.stalls.push(battle);write();
  if(battle.scene&&battle.phase==='lucha'&&battle.canSwitch&&
     battle.changes<3&&battle.zone){
   await tapXY(battle.zone.x,battle.zone.y);
   // The actual native party index must change; a missed hit is not a swap.
   const swapped=await page.waitForFunction(next=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return b.scene.isActive()&&b.datos?.torre2?.party?.playerIndex===next;
   },battle.next,{timeout:18000}).then(()=>true).catch(()=>false);
   report.stalls.at(-1).nativeSwitchAcknowledged=swapped;write();
  }
  // Keep playing the same original fight after the genuinely selected
  // teammate arrives. Failure leaves the honest checkpoint and screenshot.
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
  const saved={format:'t19-lt-surge-earned-native-save-v1',
   sourceSha:process.env.GITHUB_SHA||null,parentSeedSha256:proof.sha256,
   provenance:'real native Lt. Surge battle with bounded recovery in original Phaser',
   rawSave:raw,sha256:crypto.createHash('sha256').update(raw).digest('hex'),
   summary:{stage:s.stage,trainer:s.trainer,wins:s.wins,losses:s.losses,
    badges:s.badges,tms:s.inventory.tms,team:s.team.map(m=>
      ({id:m.id,uid:m.uid,level:m.progression.level,xp:m.progression.experience}))}};
  fs.writeFileSync(dir+'/t19-lt-surge-checkpoint.json',JSON.stringify(saved,null,2));
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
   if(!sessionStorage.getItem('t19-lt-surge-seeded')){
    localStorage.setItem(key,raw);sessionStorage.setItem('t19-lt-surge-seeded','1');
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
  assert.equal(s.stage,2);assert.equal(s.trainer,17);
  assert.ok(s.wins>=64);assert.equal(s.losses,0);assert.equal(s.cap,24);
  assert.deepEqual(s.badges,['Rocha','Cascata']);
  assert.deepEqual(s.team.map(m=>m.uid),origin.team.map(m=>m.uid));
  report.initial=s;write();
  // The original checkpoint contains 17 genuine Vermilion trainer wins.
  // Use the native gym confirmation and AUTO; no direct battle-result calls.
  let won=false;
  for(let attempt=0;attempt<=2&&!won;attempt++){
   await center();
   s=await now();
   assert.equal(s.stage,2);assert.equal(s.trainer,17);
   await map();
   const foe=await page.evaluate(()=>window.kanto.currentOpponent(window.kanto.readCampaign()));
   assert.equal(foe?.leader,true,'Lt. Surge must be the real gym leader');
   assert.equal(foe.name,'Lt. Surge');
   assert.equal(foe.id,'raichu');
   await tapTag('torre2-central-cta');
   await page.waitForFunction(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    return c.scene.isActive()&&c.children.list.some(o=>
     o.active&&o.input?.enabled&&o.x===320&&o.y===225)&&
     c.children.list.some(o=>o.active&&String(o.text||'').includes('DESAFIAR LÍDER'));
   },null,{timeout:15000});
   await tapXY(320,225);
   await page.waitForFunction(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return b.scene.isActive()&&b.fase==='lucha'&&
     b.__torre2PartyInstalled&&b.__torre2AutoMode?.enabled;
   },null,{timeout:60000});
   const opening=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return {enemy:b.datos.p2,auto:b.__torre2AutoMode?.enabled,
     gymLeader:b.datos?.torre2?.party?.gymLeader===true};
   });
   assert.equal(opening.enemy,'voltorb','Surge must lead with native Voltorb');
   assert.equal(opening.auto,true);
   assert.equal(opening.gymLeader,true);
   const after=await outcome(s,420000);
   const event={attempt,foe:foe.name,opening,won:after.stage===3,
    stage:after.stage,trainer:after.trainer,wins:after.wins,losses:after.losses,
    levels:after.team.map(m=>m.lvl)};
   report.rounds.push(event);write();
   if(event.won){
    assert.equal(after.trainer,0);
    assert.equal(after.wins,s.wins+1,'Only native leader win can advance campaign');
    assert.equal(after.losses,s.losses);
    assert.deepEqual(after.badges,['Rocha','Cascata','Trovao']);
    assert.ok(after.tms.includes('tm-shock-wave'),'TM34 earned only on genuine victory');
    assert.ok(after.team.some((m,i)=>m.xp>(s.team[i]?.xp??0)),
     'Leader must award real XP');
    won=true;
    await checkpoint(after,'Lt. Surge native victory');
    console.log('PASS T19 NATIVE LT SURGE',JSON.stringify(event));
   }else{
    assert.equal(after.stage,2);assert.equal(after.trainer,17);
    assert.equal(after.wins,s.wins,'Defeat must never create a win');
    assert.equal(after.losses,s.losses+1,'Record every genuine defeat');
    await checkpoint(after,'Lt. Surge real loss '+attempt);
    assert.ok(attempt<2,'Bounded recovery exhausted: report genuine defeat');
    const recovered=await recover({trainer:17,attempt});
    assert.equal(recovered.stage,2);assert.equal(recovered.trainer,17);
   }
  }
  assert.ok(won,'Lt. Surge was not naturally beaten within recovery limit');
  const final=await now();
  assert.equal(final.stage,3);assert.equal(final.trainer,0);
  assert.ok(final.wins>=65,'Lt. Surge victory must follow 17 real trainers');
  assert.deepEqual(final.badges,['Rocha','Cascata','Trovao']);
  assert.ok(final.tms.includes('tm-rock-tomb'));
  assert.ok(final.tms.includes('tm-water-pulse'));
  assert.ok(final.tms.includes('tm-shock-wave'));
  await page.screenshot({path:dir+'/t19-lt-surge-real-result.png'});
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
  assert.equal(restored.stage,3);assert.equal(restored.trainer,0);
  assert.equal(restored.wins,final.wins);assert.equal(restored.losses,final.losses);
  assert.deepEqual(restored.badges,final.badges);
  assert.deepEqual(restored.tms,final.tms);
  assert.deepEqual(restored.team,final.team.map(m=>m.uid));
  assert.deepEqual(errors,[]);
  report.result={stage:final.stage,trainer:final.trainer,wins:final.wins,losses:final.losses,
   team:final.team,reloaded:true};write();
  console.log('PASS T19 LT SURGE THUNDER BADGE TM34 XP RELOAD',JSON.stringify(report.result));
 }catch(e){
  report.error=String(e);
  try{report.last=await now()}catch{}
  try{await page.screenshot({path:dir+'/t19-lt-surge-error.png'})}catch{}
  write();throw e;
 }finally{await page.close();await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
