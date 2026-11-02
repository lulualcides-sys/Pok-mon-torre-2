'use strict';
/* T02: actual desktop Phaser clicks for the campaign battle menu and RUN.
 * No debug victory, direct catch, free item, HP override or server-side save.
 * Two browser contexts isolate trainer restrictions and wild fleeing.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg',
 '.ogg':'audio/ogg','.svg':'image/svg+xml'};
const srv=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/', 'http://127.0.0.1');
 const file=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const bytes=await fsp.readFile(file);res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream'});res.end(bytes)}
 catch{res.writeHead(404);res.end('missing')}
});
const report={context:'Chromium desktop 1280x720 native Phaser mouse events',trainer:{},wild:{}};
const save=()=>fs.writeFileSync('test-evidence/t02-desktop-run.json',JSON.stringify(report,null,2));
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(ok=>srv.listen(4357,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 async function open(){
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  await page.goto('http://127.0.0.1:4357/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:50000});
  return page;
 }
 const click=async(page,x,y)=>{
  const p=await page.evaluate(([x,y])=>{
   const rect=document.querySelector('#juego canvas').getBoundingClientRect();
   return {x:rect.left+x*rect.width/640,y:rect.top+y*rect.height/360};
  },[x,y]);
  await page.mouse.click(p.x,p.y);
 };
 const clickData=async(page,key,value,sceneName='combate')=>{
  const target=await page.evaluate(([sceneName,key,value])=>{
   const scene=window.__pt2Game.scene.getScene(sceneName);
   const zone=scene.children.list.find(o=>o.active&&o.input?.enabled&&o.getData?.(key)===value);
   if(!zone)throw Error('Missing native control: '+sceneName+' '+key+'='+value);
   return {x:zone.getData?.('torre2-bag-hud-x')??zone.x,
     y:zone.getData?.('torre2-bag-hud-y')??zone.y};
  },[sceneName,key,value]);
  await click(page,target.x,target.y);
 };
 const boot=async(page,withReserve=false)=>{
  await page.evaluate(async withReserve=>{
   const src=[...document.scripts].find(x=>x.src?.includes('/main.js')).src;
   const core=window.t02=await import(new URL('./torre2/campaign-core.js',src));
   const st=core.createCampaign('bulbasaur');
   core.saveCampaign(st);
   core.storePokemon(st,1); // Mewtwo stays in PC.
   if(withReserve){
    st.team.push(core.createCampaign('squirtle').team[0]);core.saveCampaign(st);
   }
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  },withReserve);
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
   !!window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,null,{timeout:48000});
 };
 const battleReady=page=>page.waitForFunction(()=>{
  const scene=window.__pt2Game.scene.getScene('combate');
  return scene.scene.isActive()&&scene.fase==='lucha'&&scene.__torre2PartyInstalled;
 },null,{timeout:65000});
 try{
  {const page=await open(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
   try{
    await boot(page,true);
    await clickData(page,'torre2-central-cta',true,'campanha');
    await battleReady(page);
    const initial=await page.evaluate(()=>{
     const b=window.__pt2Game.scene.getScene('combate'),s=window.t02.readCampaign();
     return {kind:b.datos.torre2.kind,team:b.datos.torre2.party.friend.map(m=>m.id),
      runButtons:b.children.list.filter(o=>o.active&&o.getData?.('torre2-wild-run')===true).length,
      bag:!!b.__torre2BattleBag?.trigger?.active,
      money:s.money,balls:s.inventory.pokeball,inventory:s.inventory,
      wins:s.wins,losses:s.losses,stage:s.stage,trainer:s.trainer};
    });
    assert.equal(initial.kind,'trainer');
    assert.deepEqual(initial.team,['bulbasaur','squirtle']);
    assert.equal(initial.runButtons,0,'RUN cannot escape a trainer battle');
    assert.equal(initial.bag,true);
    report.trainer.initial=initial;
    await clickData(page,'torre2-battle-bag-open',true);
    await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').__torre2BattleBagOpen===true);
    await page.screenshot({path:'test-evidence/t02-desktop-bag-open.png'});
    await clickData(page,'torre2-battle-bag-back',true);
    await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').__torre2BattleBagOpen===false);
    await clickData(page,'torre2-party-slot',1);
    await page.waitForFunction(()=>{
     const b=window.__pt2Game.scene.getScene('combate');
     return b.datos.p1==='squirtle'&&b.datos.torre2.party.playerIndex===1&&!b.__torre2Changing;
    },null,{timeout:24000});
    const after=await page.evaluate(()=>{
     const b=window.__pt2Game.scene.getScene('combate'),s=window.t02.readCampaign();
     return {player:b.datos.p1,index:b.datos.torre2.party.playerIndex,
      inventory:s.inventory,wins:s.wins,losses:s.losses,stage:s.stage,trainer:s.trainer};
    });
    assert.deepEqual(after.inventory,initial.inventory);
    for(const key of ['wins','losses','stage','trainer'])assert.equal(after[key],initial[key]);
    assert.equal(after.player,'squirtle');report.trainer.after=after;
    await page.screenshot({path:'test-evidence/t02-desktop-party-switch.png'});
    assert.deepEqual(errors,[]);
    console.log('T02 PASS DESKTOP TRAINER BAG + PARTY + NO RUN',JSON.stringify(report.trainer));
   }finally{await page.close()}
  }
  {const page=await open(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
   try{
    await boot(page);
    await page.evaluate(()=>{
     const c=window.__pt2Game.scene.getScene('campanha');
     c.grassScreen(window.t02.readCampaign());
    });
    // Phaser creates/depth-sorts its modal hitzones on the next render.
    // Give the genuine pointer listener two animation frames to activate.
    await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>
     requestAnimationFrame(done))));
    await click(page,465,292);
    try{await battleReady(page);}
    catch(error){
     report.wild.diagnostic=await page.evaluate(()=>{
      const g=window.__pt2Game,c=g.scene.getScene('campanha'),
       b=g.scene.getScene('combate'),s=window.t02.readCampaign();
      return {scenes:g.scene.scenes.filter(x=>x.scene.isActive()).map(x=>x.scene.key),
       phase:b.fase,party:!!b.__torre2PartyInstalled,
       wildOverlay:!!b.__torre2WildCapture,campaignOverlay:!!c.__torre2GrassOverlay,
       pending:s?.pendingWild,history:s?.wildEncountersStage,lastMessage:s?.lastMessage};
     });
     throw new Error('Wild Phaser battle did not open: '+JSON.stringify(report.wild.diagnostic)+
      ' / '+String(error));
    }
    await page.waitForFunction(()=>{
     const b=window.__pt2Game.scene.getScene('combate');
     return b.__torre2WildCapture&&b.children.list.some(
      o=>o.active&&o.input?.enabled&&o.getData?.('torre2-wild-run')===true);
    },null,{timeout:12000});
    const before=await page.evaluate(()=>{
     const b=window.__pt2Game.scene.getScene('combate'),s=window.t02.readCampaign(),
     fighter=b.luchadores[0];
     return {kind:b.datos.torre2.kind,encounter:s.pendingWild?.id,
      hpBefore:s.team[0].hp,liveHp:fighter.hp/fighter.hpMax*100,
      money:s.money,inventory:s.inventory,wins:s.wins,losses:s.losses,
      trainer:s.trainer,stage:s.stage,searches:s.wildEncountersStage};
    });
    assert.equal(before.kind,'wild');
    assert.ok(before.encounter,'Encounter created by actual UI');
    assert.equal(before.searches,1);
    report.wild.before=before;
    // A wild send-out animation can keep native transition locks active
    // for a few frames after the HUD announces the phase as 'lucha'.
    // A real player cannot use a menu until that animation finishes.
    await page.waitForFunction(()=>{
     const b=window.__pt2Game.scene.getScene('combate');
     return b.fase==='lucha'&&!b.__torre2Changing&&
      !b.__torre2BallTransitions&&!b.__torre2CaptureBusy;
    },null,{timeout:20000});
    await page.screenshot({path:'test-evidence/t02-desktop-run-visible.png'});
    const runBefore=await page.evaluate(()=>{
     const b=window.__pt2Game.scene.getScene('combate'),p=b.datos?.torre2,
      saved=window.t02.readCampaign(),z=b.children.list.find(x=>x.getData?.('torre2-wild-run')===true);
     return {phase:b.fase,kind:p?.kind,stage:p?.stage,trainer:p?.trainer,id:p?.id,
      pendingWild:saved?.pendingWild,playerIndex:p?.party?.playerIndex,
      fromUid:p?.party?.friend?.[p?.party?.playerIndex]?.uid,
      saveUid:saved?.team?.[p?.party?.playerIndex]?.uid,
      activeHp:b.luchadores?.[0]?.hp,
      locks:{capture:b.__torre2CaptureBusy,changing:b.__torre2Changing,
       transition:b.__torre2BallTransitions,bag:b.__torre2BattleBagOpen},
      zone:{x:z?.x,y:z?.y,enabled:z?.input?.enabled,depth:z?.depth}};
    });
    await clickData(page,'torre2-wild-run',true);
    await page.waitForTimeout(450);
    const runAfter=await page.evaluate(()=>{
     const b=window.__pt2Game.scene.getScene('combate'),s=window.t02.readCampaign();
     const p=b.input.activePointer,hitObjects=b.input.hitTestPointer?.(p)||[];
     const describe=o=>({type:o.type,depth:o.depth,x:o.x,y:o.y,
      width:o.width,height:o.height,visible:o.visible,
      tags:o.data?.list||null});
     return {phase:b.fase,active:b.scene.isActive(),runClicks:b.__torre2RunPointerSeen||0,
      canvasPointer:p?{x:p.x,y:p.y,worldX:p.worldX,worldY:p.worldY}:null,
      hits:hitObjects.slice(0,12).map(describe),
      campaign:window.__pt2Game.scene.isActive('campanha'),
      pending:s?.pendingWild,activeHp:s?.team?.[s?.active]?.hp,lastMessage:s?.lastMessage};
    });
    console.log('T02 RUN CLICK DIAGNOSTIC',JSON.stringify({runBefore,runAfter}));
    if(runAfter.pending!==null)
     throw Error('RUN ignored: '+JSON.stringify({runBefore,runAfter}));
    await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
     window.t02.readCampaign()?.pendingWild===null,null,{timeout:8000});
    const after=await page.evaluate(()=>{
     const s=window.t02.readCampaign();
     return {hp:s.team[0].hp,active:s.active,team:s.team.map(m=>m.id),
      money:s.money,inventory:s.inventory,wins:s.wins,losses:s.losses,
      trainer:s.trainer,stage:s.stage,searches:s.wildEncountersStage,
      pendingWild:s.pendingWild,lastMessage:s.lastMessage};
    });
    assert.equal(after.pendingWild,null);
    assert.match(after.lastMessage,/fugiu/);
    assert.ok(after.hp>0&&after.hp<=before.hpBefore,'RUN must preserve damage and never heal');
    assert.deepEqual(after.inventory,before.inventory,'RUN consumes no Pokeballs or items');
    for(const key of ['money','wins','losses','trainer','stage','searches'])
     assert.equal(after[key],before[key],key+' cannot be awarded on escape');
    assert.deepEqual(after.team,['bulbasaur']);
    report.wild.after=after;
    await page.screenshot({path:'test-evidence/t02-desktop-after-run.png'});
    assert.deepEqual(errors,[]);
    console.log('T02 PASS DESKTOP RUN FROM WILD WITHOUT REWARDS',JSON.stringify(report.wild));
   }finally{await page.close()}
  }
 }finally{save();await browser.close();srv.close()}
})().catch(e=>{console.error(e);srv.close();process.exitCode=1});
