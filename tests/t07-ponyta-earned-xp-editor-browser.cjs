'use strict';
/* T07/T08: a prepared Lv20 Ponyta earns Lv21 in an actual native Phaser
 * trainer victory, unlocks installed Flame Charge, equips it via mobile
 * summary, survives a full reload and uses the installed battle renderer.
 * The Stage 1 save, helper Squirtle and 1-XP-to-level checkpoint are FIXTURES.
 * No KO, XP award, damage, battle clock, invulnerability or result is forced.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg',
 '.svg':'image/svg+xml','.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1:4582');
 const file=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const data=await fsp.readFile(file);
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});
  res.end(data);
 }catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(ok=>server.listen(4582,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:854,height:480},hasTouch:true,isMobile:true});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const report={setup:'Stage1 Lv20 Ponyta threshold-minus-one and Lv20 Squirtle fixture',
  combat:'Native trainer win and actual XP; no KO/HP/XP/result overrides',
  proof:{}};
 const snapshot=()=>page.evaluate(()=>{
  const s=window.__core.readCampaign();
  return {stage:s.stage,trainer:s.trainer,wins:s.wins,losses:s.losses,money:s.money,
   active:s.active,team:s.team.map(m=>({id:m.id,uid:m.uid,level:m.progression.level,
    experience:m.progression.experience,moves:m.moves||null,plan:m.movePlanSpecies||null}))};
 });
 const canvasPoint=(x,y)=>page.evaluate(([x,y])=>{
  const r=document.querySelector('#juego canvas').getBoundingClientRect();
  return {x:r.left+x*r.width/640,y:r.top+y*r.height/360};
 },[x,y]);
 const tap=async(x,y)=>{
  const p=await canvasPoint(x,y);
  await page.touchscreen.tap(p.x,p.y);
 };
 const marked=async(key,value)=>{
  const p=await page.evaluate(([key,value])=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   const o=c.children.list.find(o=>o.active&&o.input?.enabled&&o.getData?.(key)===value);
   if(!o)throw Error('Missing native Phaser hitbox '+key+' '+value);
   return {x:o.x,y:o.y};
  },[key,value]);
  await tap(p.x,p.y);
 };
 const ready=()=>page.waitForFunction(()=>{
  const c=window.__pt2Game.scene.getScene('campanha');
  return c.scene.isActive()&&!!c.__torre2BattlePath;
 },null,{timeout:50000});
 try{
  await page.goto('http://127.0.0.1:4582/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  const fixture=await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=window.__core=await import(new URL('./torre2/campaign-core.js',src));
   const progression=await import(new URL('./torre2/progression.js',src));
   const moves=window.__moves=await import(new URL('./torre2/move-pool.js',src));
   const s=core.createCampaign('squirtle');
   s.stage=1;s.trainer=4;s.badges=['Rocha'];s.gymTMClaims=['tm-rock-tomb'];
   s.team[0].progression=progression.createPokemonProgression('squirtle',20);
   s.team[0].hp=100;
   const threshold=progression.totalExperienceForLevel(21);
   s.team[1]={id:'ponyta',uid:'t07-pony-xp-uid',hp:100,
    progression:progression.createPokemonProgression('ponyta',20,{experience:threshold-1}),
    tmMoves:[]};
   s.active=0;s.dexSeen.push('ponyta');s.dexCaught.push('ponyta');
   if(moves.availableMoves(s.team[1]).some(m=>m.id==='flame-charge'))
    throw Error('Flame Charge leaked at Lv20');
   if(moves.moveUnlockLevel(s.team[1],'flame-charge')!==21)
    throw Error('Ponyta Flame Charge gate drifted from Lv21');
   const foe=core.currentOpponent(s);
   if(foe?.id!=='sandshrew')throw Error('Expected Stage1 Sandshrew '+JSON.stringify(foe));
   core.saveCampaign(s);
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
   return {threshold,foe:foe.id,ponyUid:s.team[1].uid};
  });
  await ready();
  const before=await snapshot();
  assert.equal(before.team[1].experience,fixture.threshold-1);
  assert.equal(before.team[1].level,20);
  await marked('torre2-central-cta',true);
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.fase==='lucha'&&b.__torre2PartyInstalled&&
    b.__torre2AutoMode?.zone?.active;
  },null,{timeout:65000});
  const battle=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return {player:b.datos.p1,foe:b.datos.p2,level:b.datos.torre2.playerLevel};
  });
  assert.equal(battle.player,'squirtle');
  assert.equal(battle.foe,'sandshrew');
  const auto=await page.evaluate(()=>{
   const z=window.__pt2Game.scene.getScene('combate').__torre2AutoMode.zone;
   return {x:z.x,y:z.y};
  });
  await tap(auto.x,auto.y);
  await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').__torre2AutoMode.enabled,
   null,{timeout:8000});
  await page.waitForFunction(({wins,losses})=>{
   const s=window.__core.readCampaign();
   return window.__pt2Game.scene.isActive('campanha')&&
    (s.wins>wins||s.losses>losses);
  },{wins:before.wins,losses:before.losses},{timeout:240000,polling:250});
  const after=await snapshot();
  assert.equal(after.wins,before.wins+1,'Native victory did not happen');
  assert.equal(after.losses,before.losses,'Real battle lost');
  assert.equal(after.trainer,before.trainer+1,'Trainer progress not earned');
  const pony=after.team.find(m=>m.uid===fixture.ponyUid);
  assert.ok(pony,'Ponyta identity lost');
  assert.ok(pony.experience>=fixture.threshold,'No native XP award to party member');
  assert.ok(pony.level>=21,'Native XP did not unlock Lv21');
  const unlocked=await page.evaluate(()=>{
   const s=window.__core.readCampaign();
   return window.__moves.availableMoves(s.team[1]).some(m=>m.id==='flame-charge');
  });
  assert.ok(unlocked,'Ponyta Flame Charge not available after native XP');
  const raw=await page.evaluate(()=>localStorage.getItem(window.__core.SAVE_KEY));
  report.proof={fixture,battle,before,after,unlocked};
  await page.screenshot({path:'test-evidence/t07-ponyta-earned-lv21.png'});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  const restored=await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   window.__core=await import(new URL('./torre2/campaign-core.js',src));
   window.__moves=await import(new URL('./torre2/move-pool.js',src));
   const s=window.__core.readCampaign();
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
   return {pony:s.team[1],raw:localStorage.getItem(window.__core.SAVE_KEY),wins:s.wins};
  });
  assert.equal(restored.raw,raw,'Reload unexpectedly rewrote earned XP');
  assert.equal(restored.pony.uid,fixture.ponyUid);
  assert.equal(restored.pony.progression.experience,pony.experience);
  assert.equal(restored.wins,after.wins);
  await ready();
  // Real touchscreen on the actual summary move row; no direct equipMove.
  await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   c.summaryFilter='ALL';c.summarySearch='Flame Charge';
   c.showSummary(window.__core.readCampaign(),1,1,0);
  });
  await page.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return c.children.list.some(o=>o.active&&o.input?.enabled&&
    o.getData?.('torre2-equip-move')==='flame-charge');
  },null,{timeout:10000});
  await marked('torre2-equip-move','flame-charge');
  await page.waitForFunction(()=>{
   const m=window.__core.readCampaign().team[1];
   return m.moves?.[1]==='flame-charge'&&m.movePlanSpecies==='ponyta';
  },null,{timeout:10000});
  const edited=await snapshot();
  assert.equal(edited.team[1].moves[1],'flame-charge');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   window.__core=await import(new URL('./torre2/campaign-core.js',src));
   const s=window.__core.readCampaign();
   if(s.team[1].moves?.[1]!=='flame-charge')throw Error('Move lost on reload');
   if(!window.__core.selectTeamMember(s,1))throw Error('Ponyta selection failed');
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await ready();
  await marked('torre2-central-cta',true);
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.fase==='lucha'&&b.__torre2PartyInstalled&&b.panelTactil;
  },null,{timeout:65000});
  const native=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),a=b.luchadores[0];
   const slot=['lmb','rmb','q','e'].find(k=>a.kit[k]?.id==='flame-charge');
   if(!slot)throw Error('Earned and equipped Flame Charge missing from native battle');
   const move=a.kit[slot],p=b.panelTactil,button=p.botones.find(x=>x.slot===slot);
   if(!button)throw Error('Native touch controller missing Flame Charge');
   const at=p.pos(button),zero=p.punto({x:0,y:0}),one=p.punto({x:1,y:1});
   const before=a.stats.usosSlot?.[slot]||0;
   p.abajo({id:71,x:(at.x-zero.x)/(one.x-zero.x),y:(at.y-zero.y)/(one.y-zero.y)});
   p.leer(x=>({ax:x.x,ay:x.y}));
   return {player:b.datos.p1,slot,before,move:{id:move.id,forma:move.forma,cd:move.cd}};
  });
  assert.equal(native.player,'ponyta');
  assert.ok(native.move.forma);
  await page.waitForTimeout(550);
  const casts=await page.evaluate(slot=>{
   const b=window.__pt2Game.scene.getScene('combate');
   b.panelTactil.arriba({id:71});
   return b.luchadores[0].stats.usosSlot?.[slot]||0;
  },native.slot);
  assert.ok(casts>native.before,'Native Flame Charge was not cast');
  assert.deepEqual(errors,[],'Browser runtime errors');
  report.proof={...report.proof,reloaded:true,edited,cast:{...native,casts}};
  fs.writeFileSync('test-evidence/t07-ponyta-earned-xp-editor-battle.json',
   JSON.stringify(report,null,2));
  await page.screenshot({path:'test-evidence/t07-ponyta-earned-flame-charge-cast.png'});
  console.log('PASS_T07_T08_PONYTA_XP_UNLOCK_TOUCH_SAVE_NATIVE_CAST',
   JSON.stringify({xp:pony.experience,level:pony.level,move:native.move,
    casts,wins:after.wins,fixture:true}));
 }finally{await page.close();await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
