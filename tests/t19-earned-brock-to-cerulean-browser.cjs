'use strict';
/* T19: resume the exact production save earned by T20 native Pallet→Brock.
 * The seed is exported by the original Chromium run, never synthesized.
 * One real Cerulean trainer battle, native Center, AUTO, XP and reload.
 * This is NOT a full Misty clear or proof of a physical Android device.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const out='test-evidence';
fs.mkdirSync(out,{recursive:true});
const proof=JSON.parse(fs.readFileSync(
 process.env.T19_EARNED_SAVE||path.join(out,'t19-earned-brock-save.json'),'utf8'));
assert.equal(proof.format,'t19-earned-brock-native-save-v1');
assert.equal(proof.productionStarter,true);
assert.equal(proof.provenance,'same Chromium page after T20 production Pallet-to-Brock');
assert.equal(crypto.createHash('sha256').update(proof.rawSave).digest('hex'),proof.sha256);
const original=JSON.parse(proof.rawSave);
assert.equal(original.stage,1);
assert.equal(original.trainer,0);
assert.deepEqual(original.badges,['Rocha']);
assert.ok(original.inventory?.tms?.includes('tm-rock-tomb'));
assert.ok(original.team.length>=3&&original.team.every(m=>m.id!=='mewtwo'));
assert.equal(original.wins,proof.summary.wins);
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
 await new Promise(ok=>server.listen(4323,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const report={method:'Genuine T20 exported save; native Center and first Cerulean trainer in Phaser',
  sourceSha:proof.githubSha,seedSha256:proof.sha256,seed:proof.summary};
 const saveReport=()=>fs.writeFileSync(out+'/t19-earned-cerulean-first-trainer.json',JSON.stringify(report,null,2));
 const game=()=>page.evaluate(()=>{
  const s=window.kanto.readCampaign();
  return {stage:s.stage,trainer:s.trainer,wins:s.wins,losses:s.losses,
   money:s.money,badges:s.badges,tms:s.inventory.tms,active:s.active,
   team:s.team.map(m=>({uid:m.uid,id:m.id,hp:m.hp,
    level:m.progression?.level,xp:m.progression?.experience}))};
 });
 const sync=()=>page.evaluate(()=>new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok))));
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
  await page.goto('http://127.0.0.1:4323/arena2d/?original=1',{waitUntil:'domcontentloaded'});
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
  assert.equal(before.stage,1);assert.equal(before.trainer,0);
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
  const after=await game();
  report.result=after;saveReport();
  assert.equal(after.losses,healed.losses,'Real defeat; do not claim a victory');
  assert.equal(after.wins,healed.wins+1,'First Cerulean trainer must be defeated naturally');
  assert.equal(after.stage,1);assert.equal(after.trainer,1);
  assert.deepEqual(after.badges,['Rocha'],'Misty badge cannot appear before Misty');
  assert.deepEqual(after.tms,healed.tms,'No TM reward before the leader');
  assert.deepEqual(after.team.map(m=>m.uid),healed.team.map(m=>m.uid));
  assert.ok(after.team.some((m,i)=>m.xp>healed.team[i].xp),
   'Real trainer victory must award actual party XP');
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
  assert.equal(reloaded.stage,1);assert.equal(reloaded.trainer,1);
  assert.equal(reloaded.wins,after.wins);assert.equal(reloaded.losses,after.losses);
  assert.deepEqual(reloaded.badges,after.badges);
  assert.deepEqual(reloaded.tms,after.tms);
  assert.deepEqual(reloaded.team,after.team.map(m=>m.uid));
  assert.deepEqual(errors,[],'No uncaught JS exceptions in genuine Cerulean battle');
  report.reload={saveUnchanged:true,stage:reloaded.stage,trainer:reloaded.trainer,
   wins:reloaded.wins,losses:reloaded.losses};saveReport();
  console.log('PASS T19 NATIVE POST-BROCK FIRST CERULEAN TRAINER + XP + RELOAD',JSON.stringify(report.reload));
 }catch(error){
  report.failure=String(error);
  try{report.diagnostic=await game()}catch{}
  try{await page.screenshot({path:out+'/t19-native-cerulean-failure.png'})}catch{}
  saveReport();throw error;
 }finally{await page.close();await browser.close();server.close()}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
