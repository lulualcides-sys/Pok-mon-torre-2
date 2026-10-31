'use strict';
/* T19 — recovery without shortcuts. Starts from a real earned stage-2
 * checkpoint, heals with Phaser controls, earns XP in two natural wild
 * victories, then performs an optional native random capture attempt.
 * Never alters HP, battle results, random, money, XP, stage or trainer.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site'),out='test-evidence';
fs.mkdirSync(out,{recursive:true});
const proof=JSON.parse(fs.readFileSync(process.env.EARNED_VERMILION_SAVE||
 path.join(out,'t19-earned-vermilion-five-save.json'),'utf8'));
assert.equal(proof.format,'t19-vermilion-five-earned-native-save-v1');
assert.equal(proof.sourceSha,'8e483ee7f6bd8ef743c14bd1d4e1b9402a18b93d');
assert.equal(proof.sourceRun,41194363962);
assert.equal(proof.provenance,'actual native Phaser battles after proven Misty save');
assert.equal(crypto.createHash('sha256').update(proof.rawSave).digest('hex'),proof.sha256);
const seed=JSON.parse(proof.rawSave);
assert.equal(seed.stage,2);assert.equal(seed.trainer,5);
assert.equal(seed.wins,47);assert.equal(seed.losses,0);
assert.deepEqual(seed.badges,['Rocha','Cascata']);
assert.ok(seed.inventory.tms.includes('tm-water-pulse'));
assert.ok(seed.inventory.pokeball>0,'A real capture requires earned ball inventory');
assert.ok(seed.team.every(m=>m.id!=='mewtwo'),'Never use the lab Mewtwo tester');
const contentTypes={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml',
 '.mp3':'audio/mpeg','.ogg':'audio/ogg'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1');
 const file=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const b=await fsp.readFile(file);
  res.writeHead(200,{'content-type':contentTypes[path.extname(file)]||'application/octet-stream'});res.end(b);
 }catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 await new Promise(ok=>server.listen(4383,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const report={source:'Misty→5 Vermilion original native saved bytes, SHA-256 verified',
  seedSha256:proof.sha256,method:'Phaser mouse clicks only; unmodified battle RNG',
  wildVictories:[],capture:null};
 const write=()=>fs.writeFileSync(out+'/t19-vermilion-grind-capture-report.json',
  JSON.stringify(report,null,2));
 const state=()=>page.evaluate(()=>{
  const s=window.kanto.readCampaign();
  return {stage:s.stage,trainer:s.trainer,wins:s.wins,losses:s.losses,
   balls:s.inventory.pokeball,money:s.money,encounters:s.wildEncountersStage,
   badges:[...s.badges],tms:[...s.inventory.tms],
   pendingWild:s.pendingWild?.id||null,active:s.active,
   team:s.team.map(m=>({id:m.id,uid:m.uid,hp:m.hp,
    level:m.progression.level,experience:m.progression.experience})),
   box:s.box.map(m=>m.uid)};
 });
 const frame=()=>page.evaluate(()=>new Promise(ok=>
  requestAnimationFrame(()=>requestAnimationFrame(ok))));
 const tap=async(x,y)=>{
  await frame();
  const pt=await page.evaluate(([x,y])=>{
   const r=document.querySelector('#juego canvas').getBoundingClientRect();
   return {x:r.x+x*r.width/640,y:r.y+y*r.height/360};
  },[x,y]);
  await page.mouse.move(pt.x,pt.y);
  await page.mouse.down();await page.waitForTimeout(85);await page.mouse.up();
 };
 const tag=async name=>{
  await frame();
  const pt=await page.evaluate(name=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   const zone=c.children.list.find(o=>o.active&&o.input?.enabled&&o.getData?.(name)===true);
   if(!zone)throw Error('Missing actual Phaser input '+name);
   const r=document.querySelector('#juego canvas').getBoundingClientRect();
   return {x:r.x+zone.x*r.width/640,y:r.y+zone.y*r.height/360};
  },name);
  await page.mouse.click(pt.x,pt.y);
 };
 const center=async()=>{
  await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   c.centerScreen(window.kanto.readCampaign());
  });
  await tag('torre2-center-heal');
  let started=await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha').__torre2CenterBusy,
   null,{timeout:4500}).then(()=>true).catch(()=>false);
  if(!started){
   // Mouse event can arrive before a newly mounted Phaser hit zone.
   // Retry only if the native Center button still exists and is idle.
   const possible=await page.evaluate(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    return c.scene.isActive()&&!c.__torre2CenterBusy&&
     c.children.list.some(o=>o.active&&o.input?.enabled&&
      o.getData?.('torre2-center-heal')===true);
   });
   assert.ok(possible,'Heal cannot proceed without a valid native button');
   await tag('torre2-center-heal');
   started=await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha').__torre2CenterBusy,
    null,{timeout:4500}).then(()=>true).catch(()=>false);
  }
  assert.ok(started,'Native Center must acknowledge the genuine click');
  await page.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return c.scene.isActive()&&c.__torre2BattlePath&&
    window.kanto.readCampaign().team.every(m=>m.hp===100)&&!c.__torre2CenterBusy;
  },null,{timeout:16000});
 };
 const wild=async()=>{
  const before=await state();
  await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   c.grassScreen(window.kanto.readCampaign());
  });
  await frame();await tap(465,292); // native PROCURAR POKÉMON
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.fase==='lucha'&&
    b.__torre2PartyInstalled&&b.__torre2WildCapture&&
    b.__torre2AutoMode?.enabled;
  },null,{timeout:60000});
  const started=await state();
  assert.ok(started.pendingWild,'Wild encounter must be saved before battle');
  assert.equal(started.trainer,before.trainer);
  assert.equal(started.wins,before.wins);
  return {before,started};
 };
 const exportCheckpoint=async name=>{
  const raw=await page.evaluate(()=>localStorage.getItem(window.kanto.SAVE_KEY));
  assert.ok(raw,'Native save must be durable');
  const s=JSON.parse(raw);
  const result={format:'t19-vermilion-grind-native-save-v1',
   parentSeedSha256:proof.sha256,sourceSha:process.env.GITHUB_SHA||null,
   provenance:'two actual wild victories after 5 natural Vermilion trainers',
   rawSave:raw,sha256:crypto.createHash('sha256').update(raw).digest('hex'),
   summary:{stage:s.stage,trainer:s.trainer,wins:s.wins,losses:s.losses,
    team:s.team.map(m=>({id:m.id,uid:m.uid,level:m.progression.level,
     xp:m.progression.experience})),badges:s.badges,tms:s.inventory.tms}};
  fs.writeFileSync(out+'/'+name,JSON.stringify(result,null,2));
  return result;
 };
 try{
  await page.addInitScript(({key,value})=>{
   if(!sessionStorage.getItem('t19-grind-seeded')){
    localStorage.setItem(key,value);
    sessionStorage.setItem('t19-grind-seeded','1');
   }
  },{key:'pokemon-torre-2-kanto-campaign-v1',value:proof.rawSave});
  await page.goto('http://127.0.0.1:4383/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),
   null,{timeout:60000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js'))?.src;
   window.kanto=await import(new URL('./torre2/campaign-core.js',src));
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return c.scene.isActive()&&c.__torre2BattlePath?.stage===2;
  },null,{timeout:60000});
  const initial=await state();
  assert.equal(initial.stage,2);assert.equal(initial.trainer,5);
  assert.equal(initial.wins,47);assert.equal(initial.losses,0);
  assert.equal(initial.team.length,3);
  assert.deepEqual(initial.team.map(m=>m.uid),seed.team.map(m=>m.uid));
  report.initial=initial;write();
  // Real Center healing BEFORE any new encounter; 2 fainted members.
  await center();
  let healed=await state();
  assert.ok(healed.team.every(m=>m.hp===100));
  assert.equal(healed.wins,47);assert.equal(healed.trainer,5);
  report.healed=healed;write();
  for(let i=0;i<2;i++){
   if(i>0)await center();
   const {before,started}=await wild();
   await page.waitForFunction(({wins,losses})=>{
    const s=window.kanto.readCampaign();
    return window.__pt2Game.scene.isActive('campanha')&&
     (s.wins>wins||s.losses>losses);
   },{wins:before.wins,losses:before.losses},{timeout:240000,polling:250});
   const after=await state();
   assert.equal(after.losses,0,'Real wild defeat requires another legitimate recovery');
   assert.equal(after.wins,before.wins+1,'Only real defeated wild yields XP');
   assert.equal(after.stage,2);assert.equal(after.trainer,5);
   assert.equal(after.money,before.money,'Wild battles must not invent money');
   assert.deepEqual(after.badges,before.badges);
   assert.deepEqual(after.tms,before.tms);
   assert.deepEqual(after.team.map(m=>m.uid),before.team.map(m=>m.uid));
   assert.ok(after.team.every((m,j)=>m.experience>=before.team[j].experience));
   assert.ok(after.team.some((m,j)=>m.experience>before.team[j].experience),
    'At least one legal owned Pokémon must gain actual battle XP');
   report.wildVictories.push({index:i+1,species:started.pendingWild,
    before:before.team.map(m=>({id:m.id,level:m.level,xp:m.experience})),
    after:after.team.map(m=>({id:m.id,level:m.level,xp:m.experience})),
    wins:after.wins,trainer:after.trainer});
   write();
   const proof=await exportCheckpoint('t19-vermilion-earned-grind-save.json');
   report.grindSha256=proof.sha256;write();
   console.log('PASS T19 REAL WILD GRIND + XP',JSON.stringify(report.wildVictories.at(-1)));
  }
  await center();
  const trained=await state();
  assert.equal(trained.wins,49);assert.equal(trained.losses,0);
  assert.equal(trained.trainer,5);
  // Native Pokéball attempt has TWO equally valid outputs: GOTCHA or escape.
  // Preserve its random result; do not seed Math.random or force success.
  const {before:captureBefore,started:encounter}=await wild();
  assert.ok(captureBefore.balls>0,'Real stocked Pokéball required');
  await tap(430,241);
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.fase==='torre2-aim';
  },null,{timeout:10000});
  await tap(316,186);
  await page.waitForFunction(({balls})=>{
   const s=window.kanto.readCampaign(),b=window.__pt2Game.scene.getScene('combate');
   return s.inventory.pokeball===balls-1&&(
    b.__torre2CaptureDebug?.state==='RESUME'||
    b.__torre2CaptureDebug?.state==='CAUGHT'||
    (window.__pt2Game.scene.isActive('campanha')&&!s.pendingWild));
  },{balls:captureBefore.balls},{timeout:35000,polling:100});
  const outcome=await state();
  assert.equal(outcome.balls,captureBefore.balls-1);
  assert.equal(outcome.stage,2);assert.equal(outcome.trainer,5);
  assert.equal(outcome.wins,49,'Capturing must not invent battle victories');
  assert.equal(outcome.losses,0);assert.equal(outcome.money,captureBefore.money);
  const caught=outcome.team.length===captureBefore.team.length+1;
  if(caught){
   assert.equal(outcome.team.at(-1).id,encounter.pendingWild);
   assert.equal(outcome.pendingWild,null);
  }else{
   assert.equal(outcome.team.length,captureBefore.team.length);
   assert.equal(outcome.pendingWild,encounter.pendingWild);
  }
  report.capture={species:encounter.pendingWild,caught,ballsConsumed:1,
   trainer:outcome.trainer,wins:outcome.wins,team:outcome.team.map(m=>m.id)};
  write();
  const saved=await page.evaluate(()=>localStorage.getItem(window.kanto.SAVE_KEY));
  await page.screenshot({path:out+'/t19-vermilion-earned-recovery.png'});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),
   null,{timeout:60000});
  const restored=await page.evaluate(()=>localStorage.getItem('pokemon-torre-2-kanto-campaign-v1'));
  assert.equal(restored,saved,'Real capture/grind save must survive native reload');
  assert.deepEqual(errors,[],'No uncaught JS exceptions');
  report.reloaded=true;write();
  console.log('PASS T19 EARNED VERMILION WILD RECOVERY 2 XP WINS + NATIVE CAPTURE RNG',JSON.stringify({
   wins:outcome.wins,trainer:outcome.trainer,team:outcome.team.map(m=>m.id),capture:report.capture}));
 }catch(error){
  report.error=String(error);
  try{report.last=await state()}catch{}
  try{await page.screenshot({path:out+'/t19-vermilion-earned-recovery-error.png'})}catch{}
  write();throw error;
 }finally{await page.close();await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
