'use strict';
// T20: one naturally resolved Elite Four fight in Phaser/WebGL using the real
// Kanto leader challenge and AUTO UI. Prepared Indigo checkpoint/team ONLY;
// never fake an attack, AI action, KO, victory, stage, reward or EXP.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg',
 '.svg':'image/svg+xml','.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1');
 const filename=path.resolve(root,'.'+(u.pathname.endsWith('/')?
  u.pathname+'index.html':u.pathname));
 if(!filename.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const data=await fsp.readFile(filename);res.writeHead(200,
  {'content-type':mime[path.extname(filename)]||'application/octet-stream'});res.end(data)}
 catch{res.writeHead(404);res.end('missing')}
});
const report={scope:'T20 one normal Lance Elite Four battle in original Phaser',
 fixture:'Lance stage11 after three PREPARED League victories; six legal Lv60 including electric/water/ice counters, not sequential League play',
 naturalCombat:true,forcedKO:false,forcedWin:false,status:'not-started'};
const save=()=>{fs.mkdirSync('test-evidence',{recursive:true});
 fs.writeFileSync('test-evidence/t20-natural-lance.json',JSON.stringify(report,null,2))};
(async()=>{
 save();
 await new Promise(done=>server.listen(4495,'127.0.0.1',done));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 let page;
 try{
  page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4495/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:65000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=window.t20Core=await import(new URL('./torre2/campaign-core.js',src));
   window.t20Levels=await import(new URL('./torre2/kanto-levels.js',src));
   const {createPokemonProgression}=await import(new URL('./torre2/progression.js',src));
   const st=core.createCampaign('bulbasaur');
   core.saveCampaign(st);
   if(!core.storePokemon(st,1))throw Error('Could not deposit QA Mewtwo before League test');
   st.stage=11;st.trainer=0;st.wins=175;st.losses=0;
   st.badges=core.GYMS.map(g=>g.badge);
   st.leagueHonors=['Elite 1','Elite 2','Elite 3'];
   st.team=[];
   for(const [i,id] of ['jolteon','lapras','starmie','cloyster','jynx','dragonite'].entries())
    st.team.push({id,uid:'t20-lance-'+i+'-'+id,hp:100,
     progression:createPokemonProgression(id,60),
     status:null,tmMoves:[],moves:[]});
   st.active=0;st.money=24000;
   core.saveCampaign(st);
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return c.scene.isActive()&&c.__torre2BattlePath?.stage===11;
  },null,{timeout:60000});
  const before=await page.evaluate(()=>{
   const s=t20Core.readCampaign(),foe=t20Core.currentOpponent(s);
   return {stage:s.stage,trainer:s.trainer,wins:s.wins,losses:s.losses,
    money:s.money,honors:[...s.leagueHonors],badges:[...s.badges],
    team:s.team.map(m=>({id:m.id,uid:m.uid,level:m.progression.level,hp:m.hp})),
    box:s.box.map(m=>({id:m.id,uid:m.uid})),
    foe:{id:foe.id,leader:foe.leader,name:foe.name,level:foe.level},
    cap:t20Levels.currentLevelCap(s.stage)};
  });
  report.before=before;save();
  assert.equal(before.foe.name,'Lance');
  assert.equal(before.foe.leader,true);
  assert.equal(before.stage,11);
  assert.equal(before.cap,60);
  assert.equal(before.team.length,6);
  assert.equal(before.box.length,1);
  assert.deepEqual(before.box.map(x=>x.id),['mewtwo']);
  assert.ok(before.team.every(x=>x.level===60));
  const tap=async(x,y)=>{
   const pt=await page.evaluate(([x,y])=>{
    const c=document.querySelector('#juego canvas')||document.querySelector('canvas');
    const rect=c.getBoundingClientRect();
    return {x:rect.left+x*rect.width/640,y:rect.top+y*rect.height/360};
   },[x,y]);
   // Phaser pointerdown is processed on a rendered frame, not reliably
   // by an immediate down/up pair during a freshly replaced modal.
   await page.mouse.move(pt.x,pt.y);
   await page.mouse.down();
   await page.waitForTimeout(110);
   await page.mouse.up();
  };
  // Real map button -> real Leader challenge confirmation -> native battle.
  const cta=await page.evaluate(()=>{
   const scene=window.__pt2Game.scene.getScene('campanha');
   const z=scene.children.list.find(o=>o.input?.enabled&&o.active&&
    o.getData?.('torre2-central-cta')===true);
   if(!z)throw Error('Indigo leader challenge route CTA missing');
   return {x:z.x,y:z.y};
  });
  await tap(cta.x,cta.y);
  await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')
   .children.list.some(o=>typeof o.text==='string'&&
    o.text.includes('LÍDER DISPONÍVEL PARA BATALHA')),null,{timeout:15000});
  await tap(320,225);
  try{
   await page.waitForFunction(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return b.scene.isActive()&&b.fase==='lucha'&&
     b.__torre2PartyInstalled&&b.__torre2AutoMode?.zone?.input?.enabled;
   },null,{timeout:70000});
  }catch(error){
   const diagnostic=await page.evaluate(()=>{
    const g=window.__pt2Game;
    const c=g?.scene?.getScene('campanha');
    const b=g?.scene?.getScene('combate');
    return {campaignActive:c?.scene?.isActive(),
     campaignTexts:c?.children?.list?.filter(x=>x.active&&typeof x.text==='string')
      .map(x=>({text:x.text,x:x.x,y:x.y})).slice(0,22),
     combatActive:b?.scene?.isActive(),combatPhase:b?.fase,
     partyInstalled:!!b?.__torre2PartyInstalled,
     autoReady:!!b?.__torre2AutoMode?.zone?.input?.enabled};
   }).catch(e=>({diagnosticError:String(e)}));
   report.status='lance-entry-not-ready';report.entryDiagnostic=diagnostic;
   console.error('T20 LANCE ENTRY DIAGNOSTIC',JSON.stringify(diagnostic));
   save();
   await page.screenshot({path:'test-evidence/t20-lance-entry-failure.png'}).catch(()=>{});
   throw error;
  }
  const initial=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return {p1:b.datos.p1,p2:b.datos.p2,level:b.datos.torre2.playerLevel,
    foes:b.datos.torre2.party.foes.map(x=>({id:x.id,level:x.level})),
    auto:b.__torre2AutoMode.enabled,
    button:{x:b.__torre2AutoMode.zone.x,y:b.__torre2AutoMode.zone.y}};
  });
  report.initial=initial;save();
  assert.deepEqual(initial.foes.map(x=>x.id),
   ['gyarados','dragonair','dragonair','aerodactyl','dragonite']);
  assert.deepEqual(initial.foes.map(x=>x.level),[56,54,54,58,60]);
  assert.equal(initial.p1,'jolteon');
  assert.equal(initial.p2,'gyarados');
  assert.equal(initial.auto,false);
  await tap(initial.button.x,initial.button.y);
  await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').__torre2AutoMode.enabled,
   null,{timeout:8000});
  report.status='natural-battle-running';
  await page.screenshot({path:'test-evidence/t20-real-lance-start.png'});
  save();
  const begun=Date.now();
  // A five-opponent Elite Four battle can outlast a single arcade duel.
  // Observe actual party/fighter state every 60s; never fast-forward frames,
  // inject health/damage or invent a match result to satisfy the watchdog.
  const getProgress=()=>page.evaluate(()=>{
   const battle=window.__pt2Game.scene.getScene('combate');
   const state=window.t20Core.readCampaign();
   const party=battle.datos?.torre2?.party;
   return {elapsedSeconds:Math.round((Date.now()-window.__t20Start)/1000),
    phase:battle.fase,combatActive:battle.scene.isActive(),
    autoEnabled:!!battle.__torre2AutoMode?.enabled,
    friendIndex:party?.playerIndex,foeIndex:party?.enemyIndex,
    actors:battle.luchadores?.map(a=>({id:a.def?.id,
     hp:Math.round(a.hp),max:Math.round(a.hpMax),x:Math.round(a.x),y:Math.round(a.y)})),
    wins:state.wins,losses:state.losses,stage:state.stage};
  });
  await page.evaluate(()=>{window.__t20Start=Date.now()});
  report.progress=[];
  let busy=false;
  const probe=setInterval(async()=>{
   if(busy||page.isClosed())return;
   busy=true;
   try{const snapshot=await getProgress();report.progress.push(snapshot);
    console.log('T20 LANCE LIVE PROGRESS',JSON.stringify(snapshot));save();}
   catch(error){console.error('T20 progress probe',String(error));}
   finally{busy=false;}
  },60000);
  probe.unref();
  try{
   await page.waitForFunction(winCount=>{
    const s=window.t20Core.readCampaign();
    return window.__pt2Game.scene.isActive('campanha')&&
     (s.wins>winCount||s.losses>0);
   },before.wins,{timeout:780000,polling:350});
  }catch(e){
   report.timeout=String(e);
   report.combat=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate'),s=window.t20Core.readCampaign();
    return {active:b.scene.isActive(),phase:b.fase,
     player:b.luchadores?.[0]&&{hp:b.luchadores[0].hp,id:b.luchadores[0].def.id},
     enemy:b.luchadores?.[1]&&{hp:b.luchadores[1].hp,id:b.luchadores[1].def.id},
     stage:s.stage,wins:s.wins,losses:s.losses};
   });
   report.status='timeout-or-blocked';save();
   await page.screenshot({path:'test-evidence/t20-real-lance-timeout.png'});
   throw e;
  }finally{
   clearInterval(probe);
  }
  const after=await page.evaluate(()=>{
   const s=t20Core.readCampaign();
   return {stage:s.stage,trainer:s.trainer,wins:s.wins,losses:s.losses,
    money:s.money,honors:[...s.leagueHonors],badges:[...s.badges],
    team:s.team.map(x=>({id:x.id,uid:x.uid,level:x.progression.level,hp:x.hp})),
    box:s.box.map(x=>({id:x.id,uid:x.uid})),champion:s.champion};
  });
  report.after=after;
  report.elapsedSeconds=Number(((Date.now()-begun)/1000).toFixed(1));
  report.status=after.wins===before.wins+1?'victory':'defeat';
  save();
  assert.equal(after.losses,before.losses,'Lance genuine battle was lost');
  assert.equal(after.wins,before.wins+1,'Lance must be defeated by native combat');
  assert.equal(after.stage,12,'Lance win must advance to Champion stage');
  assert.equal(after.trainer,0);
  assert.equal(after.money,before.money+1200);
  assert.deepEqual(after.honors,['Elite 1','Elite 2','Elite 3','Elite 4'],'Only Lance honor should be awarded');
  assert.deepEqual(after.badges,before.badges,'Elite cannot award 9th gym badge');
  assert.deepEqual(after.box,before.box,'Mewtwo QA box must remain unmodified');
  assert.deepEqual(after.team.map(x=>x.uid),before.team.map(x=>x.uid),
   'Elite cannot change team membership');
  assert.equal(after.champion,false,'Lance is not Champion');
  assert.ok(report.elapsedSeconds>0);
  assert.deepEqual(errors,[],'No native Phaser exception');
  await page.screenshot({path:'test-evidence/t20-real-lance-victory.png'});
  console.log('T20 REAL LANCE NATURAL FIGHT PASS',JSON.stringify({
   durationSeconds:report.elapsedSeconds,from:before.stage,to:after.stage,
   wins:after.wins,honors:after.honors,
   team:after.team.map(x=>({id:x.id,hp:x.hp}))
  }));
 }finally{
  try{if(page&&!page.isClosed())await page.close();}
  finally{await browser.close();await new Promise(done=>server.close(done));}
 }
})().catch(err=>{console.error(err);process.exitCode=1;if(server.listening)server.close()});
