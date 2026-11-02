'use strict';
/* Master T03: an ACTUAL Phaser/WebGL campaign victory, with a prepared
 * pre-battle checkpoint. This does NOT prove natural Brock-to-Misty progress:
 * initial stage, party and XP are fixtures. During combat, neither KO,
 * XP, level, RNG, result nor evolution is overridden.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
const server=http.createServer(async(req,res)=>{
 const pathname=new URL(req.url,'http://127.0.0.1').pathname;
 const file=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const bytes=await fsp.readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(bytes)}
 catch{res.writeHead(404);res.end('not found')}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(resolve=>server.listen(4387,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
  '--use-gl=angle','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 const errors=[];
 const report={mode:'Prepared Stage 1 checkpoint; actual unforced trainer battle',setup:null,result:null};
 page.on('pageerror',e=>errors.push(String(e)));
 const snapshot=()=>page.evaluate(()=>{
  const s=window.kanto.readCampaign();
  return {wins:s.wins,losses:s.losses,stage:s.stage,trainer:s.trainer,
   team:s.team.map(m=>({uid:m.uid,id:m.id,level:m.progression.level,
    species:m.progression.species,experience:m.progression.experience,hp:m.hp})),
   badges:s.badges,money:s.money};
 });
 const clickMarked=async(id,value=true)=>{
  const point=await page.evaluate(([id,value])=>{
   const scene=window.__pt2Game.scene.getScene('campanha');
   const z=scene.children.list.find(o=>o.active&&o.input?.enabled&&o.getData?.(id)===value);
   if(!z)throw Error('Missing live Phaser button '+id);
   const rect=document.querySelector('#juego canvas').getBoundingClientRect();
   return {x:rect.x+z.x*rect.width/640,y:rect.y+z.y*rect.height/360};
  },[id,value]);
  await page.mouse.click(point.x,point.y);
 };
 try{
  await page.goto('http://127.0.0.1:4387/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:55000});
  report.setup=await page.evaluate(async()=>{
   const script=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const base=new URL('./',script);
   const core=window.kanto=await import(new URL('./torre2/campaign-core.js',base));
   const progression=await import(new URL('./torre2/progression.js',base));
   const s=core.createCampaign('bulbasaur');
   // Only an isolated test save. The Brock badge and checkpoint are NOT won.
   s.box.push(s.team.pop());
   s.stage=1;s.trainer=4;s.badges=['Rocha'];s.gymTMClaims=['tm-rock-tomb'];
   const evoXP=progression.totalExperienceForLevel(16);
   const bulba=s.team[0];
   bulba.progression=progression.createPokemonProgression('bulbasaur',15,{experience:evoXP-1});
   // Lv20 Squirtle is test setup only and must fight without HP/KO overrides.
   const helper={id:'squirtle',uid:'t03-helper-squirtle',hp:100,
    progression:progression.createPokemonProgression('squirtle',20)};
   s.team.push(helper);s.active=1;
   core.saveCampaign(s);
   const opponent=core.currentOpponent(s);
   if(!opponent||opponent.id!=='sandshrew'||opponent.leader)
    throw Error('Stage 1 chosen route enemy changed: '+JSON.stringify(opponent));
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
   return {fixture:true,stage:s.stage,trainer:s.trainer,
    starter:{uid:bulba.uid,id:bulba.id,level:bulba.progression.level,
      experience:bulba.progression.experience,threshold:evoXP},
    helper:{id:helper.id,level:helper.progression.level},
    opponent:{id:opponent.id,level:opponent.level}};
  });
  console.log('T03 CHECKPOINT',JSON.stringify(report.setup));
  assert.equal(report.setup.starter.experience,report.setup.starter.threshold-1);
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
   !!window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,null,{timeout:40000});
  const before=await snapshot();
  assert.equal(before.team.find(m=>m.id==='bulbasaur')?.level,15);
  await clickMarked('torre2-central-cta');
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.fase==='lucha'&&b.__torre2PartyInstalled&&b.__torre2AutoMode?.zone?.active;
  },null,{timeout:55000});
  const activeBattle=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return {player:b.datos.p1,foe:b.datos.p2,
    playerLevel:b.datos.torre2.playerLevel,enemyLevel:b.datos.torre2.enemyLevel,
    phase:b.fase,visible:b.luchadores[0]?.spr?.visible};
  });
  assert.equal(activeBattle.player,'squirtle');
  assert.equal(activeBattle.foe,'sandshrew');
  assert.ok(activeBattle.visible);
  // Poll observed species while actual Phaser combat runs. No game mutations.
  await page.evaluate(uid=>{
   window.__t03Observed=[];
   window.__t03Timer=setInterval(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    if(!b?.scene.isActive()||b.fase!=='lucha')return;
    const m=window.kanto.readCampaign()?.team.find(v=>v.uid===uid);
    if(m&&window.__t03Observed.length<6000)window.__t03Observed.push(m.id);
   },80);
  },report.setup.starter.uid);
  const autoButton=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),zone=b.__torre2AutoMode.zone;
   const rect=document.querySelector('#juego canvas').getBoundingClientRect();
   return {x:rect.x+zone.x*rect.width/640,y:rect.y+zone.y*rect.height/360};
  });
  await page.mouse.click(autoButton.x,autoButton.y);
  await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').__torre2AutoMode.enabled,
   null,{timeout:6000});
  await page.waitForFunction(({wins,losses})=>{
   const s=window.kanto.readCampaign();
   return window.__pt2Game.scene.isActive('campanha')&&
    (s.wins>wins||s.losses>losses);
  },{wins:before.wins,losses:before.losses},{timeout:180000,polling:250});
  const observed=await page.evaluate(()=>{
   clearInterval(window.__t03Timer);
   return window.__t03Observed;
  });
  assert.ok(observed.length>0,'No native fight snapshots captured');
  assert.ok(observed.every(id=>id==='bulbasaur'),'Species must never evolve mid-combat');
  const after=await snapshot();
  report.result={activeBattle,before,after,observedFrames:observed.length};
  assert.equal(after.losses,before.losses,'Squirtle lost real battle: test checkpoint needs review');
  assert.equal(after.wins,before.wins+1,'No artificial victory or XP');
  assert.equal(after.trainer,before.trainer+1,'Normal trainer progression');
  const evolved=after.team.find(m=>m.uid===report.setup.starter.uid);
  assert.ok(evolved,'Starter UID must survive');
  assert.equal(evolved.id,'ivysaur','After real victory Bulbasaur must evolve at 16');
  assert.equal(evolved.species,'ivysaur');
  assert.ok(evolved.level>=16);
  assert.ok(evolved.experience>=report.setup.starter.threshold);
  assert.ok(after.badges.includes('Rocha'));
  assert.equal(after.team.length,2);
  const raw=await page.evaluate(()=>localStorage.getItem(window.kanto.SAVE_KEY));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:55000});
  const persisted=await page.evaluate(async uid=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=window.kanto=await import(new URL('./torre2/campaign-core.js',src));
   const s=core.readCampaign(),m=s.team.find(x=>x.uid===uid);
   return {member:m,bytes:localStorage.getItem(core.SAVE_KEY),stage:s.stage,wins:s.wins};
  },report.setup.starter.uid);
  assert.equal(persisted.bytes,raw,'A valid save must not be rewritten on reload');
  assert.equal(persisted.member?.id,'ivysaur');
  assert.equal(persisted.member?.progression?.level,evolved.level);
  // A regular switch prepares the evolved Pokémon for its next battle.
  await page.evaluate(uid=>{
   const s=window.kanto.readCampaign();
   const idx=s.team.findIndex(m=>m.uid===uid);
   if(idx<0||!window.kanto.selectTeamMember(s,idx))throw Error('Could not select evolved Ivysaur');
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  },report.setup.starter.uid);
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
   !!window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,null,{timeout:40000});
  await clickMarked('torre2-central-cta');
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.fase==='lucha'&&b.__torre2PartyInstalled;
  },null,{timeout:55000});
  const live=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),m=b.luchadores[0];
   return {id:b.datos.p1,name:m.forma.nombre,texture:m.spr?.texture?.key,
    exists:b.textures.exists(m.spr?.texture?.key),visible:m.spr?.visible,
    frame:[m.spr?.frame?.width,m.spr?.frame?.height],
    moves:Object.fromEntries(['lmb','rmb','q','e'].map(k=>[k,m.kit[k]?.nombre||null]))};
  });
  assert.equal(live.id,'ivysaur');
  assert.equal(live.name.toLowerCase(),'ivysaur');
  assert.ok(live.texture?.startsWith('pmd-0002-'),'Wrong evolved PMD texture');
  assert.ok(live.visible&&live.exists&&live.frame.every(n=>n>0));
  assert.ok(Object.values(live.moves).filter(Boolean).length>=3);
  assert.deepEqual(errors,[],'Browser runtime exceptions');
  await page.screenshot({path:'test-evidence/t03-focused-ivysaur-webgl.png'});
  report.result.persisted={id:persisted.member.id,level:persisted.member.progression.level,
   uid:persisted.member.uid,saveUnchanged:true};
  report.result.live=live;
  console.log('PASS T03 FOCUSED PREPARED CHECKPOINT + REAL PHASER VICTORY + IVYSAUR SAVE + WEBGL',JSON.stringify(report.result));
 }finally{
  fs.writeFileSync('test-evidence/t03-focused-ivysaur.json',JSON.stringify(report,null,2));
  await browser.close();server.close();
 }
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
