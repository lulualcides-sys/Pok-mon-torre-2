'use strict';
/* Real progression: 12 native route fights, then natural captures and rival/Brock battles.
 * No forced KO, no fighter HP override, no instant-win, no arbitrary level.
 * Bulbasaur Lv5 and normal catches for a support team; Mewtwo stays in PC.
 * Native Phaser buttons, genuine capture RNG, money, XP and natural battle outcomes.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const path=require('node:path'),http=require('node:http'),{chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
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
 const out='test-evidence';fs.mkdirSync(out,{recursive:true});
 await new Promise(ok=>server.listen(4322,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
  '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const report={method:'Native Phaser live AUTO, no HP/KO/result cheats; Bulbasaur, Mewtwo in PC; 12 genuine fights, real wild capture, rival and Brock',steps:[]};
 const saveReport=()=>fs.writeFileSync(out+'/natural-through-brock.json',JSON.stringify(report,null,2));
 const game=()=>page.evaluate(()=>{
  const s=window.kanto.readCampaign();return {
   trainer:s?.trainer,wins:s?.wins,losses:s?.losses,stage:s?.stage,money:s?.money,
   team:s?.team?.map(m=>({id:m.id,hp:m.hp,level:m.progression?.level})),
   box:s?.box?.map(m=>m.id),active:s?.active,balls:s?.inventory?.pokeball, badges:s?.badges||[],tms:s?.inventory?.tms||[]
  };
 });
 const tagPoint=async id=>page.evaluate(id=>{
  const scene=window.__pt2Game.scene.getScene('campanha');
  const input=scene.children.list.find(o=>o.active&&o.input?.enabled&&o.getData?.(id)===true);
  if(!input)throw Error('Missing clickable Phaser UI '+id);
  const rect=document.querySelector('#juego canvas').getBoundingClientRect();
  return {x:rect.x+input.x*rect.width/640,y:rect.y+input.y*rect.height/360}
 },id);
 const clickTag=async id=>{
  await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
  const p=await tagPoint(id);
  await page.mouse.click(p.x,p.y);
 };

 // Prepare the team with NORMAL shop/capture screens. No RNG override,
 // HP mutation, free items, artificial victories, skipped trainer or level.
 const clickMarked=async (key,value)=>{
  const point=await page.evaluate(([key,value])=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   const z=c.children.list.find(o=>o.active&&o.input?.enabled&&o.getData?.(key)===value);
   if(!z)throw Error('No live Phaser control '+key+'='+value);
   const rect=document.querySelector('#juego canvas').getBoundingClientRect();
   return {x:rect.x+z.x*rect.width/640,y:rect.y+z.y*rect.height/360};
  },[key,value]);
  await page.mouse.click(point.x,point.y);
 };
 const sync=async()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const tap=async (x,y)=>{
  const p=await page.evaluate(([x,y])=>{
   const r=document.querySelector('#juego canvas').getBoundingClientRect();
   return {x:r.x+x*r.width/640,y:r.y+y*r.height/360}
  },[x,y]);
  await page.mouse.click(p.x,p.y);
 };
 const backToMap=async()=>{
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'),null,{timeout:30000});
  await page.evaluate(()=>window.__pt2Game.scene.getScene('campanha').scene.restart({}));
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
   !!window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,null,{timeout:35000});
 };
 const centerHeal=async()=>{
  await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   c.centerScreen(window.kanto.readCampaign());
  });
  await sync();
  await clickMarked('torre2-center-heal',true);
  await page.waitForFunction(()=>{
   const s=window.kanto.readCampaign();
   return s?.team?.every(m=>m.hp===100)&&
    window.__pt2Game.scene.isActive('campanha')&&
    !window.__pt2Game.scene.getScene('campanha').__torre2CenterBusy;
  },null,{timeout:20000});
  await backToMap();
 };
 const prepareNaturalTeam=async()=>{
  const before=await game();
  report.teamPreparation={before,throws:[],captures:[],shop:[]};
  await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   c.martScreen(window.kanto.readCampaign());
  });
  await sync();
  for(let i=0;i<12;i++){
   const old=await game();
   await clickMarked('torre2-mart-buy','pokeball');
   const now=await game();
   assert.equal(now.balls,old.balls+1,'One real Mart button purchases one ball');
   assert.equal(now.money,old.money-200,'Each ball costs exactly 200');
   report.teamPreparation.shop.push({before:old.money,after:now.money,balls:now.balls});
  }
  await backToMap();
  let encounters=0;
  while((await game()).team.length<3&&(await game()).balls>0&&encounters<12){
   encounters++;
   const old=await game();
   await page.evaluate(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    c.grassScreen(window.kanto.readCampaign());
   });
   await sync();await tap(465,292);
   await page.waitForFunction(()=>window.__pt2Game.scene.isActive('combate')&&
    window.__pt2Game.scene.getScene('combate').fase==='lucha'&&
    window.__pt2Game.scene.getScene('combate').__torre2WildCapture,null,{timeout:65000});
   let battle=true,attempts=0;
   while(battle&&(await game()).balls>0&&attempts++<20){
    const t0=await game();
    await sync();await tap(470,61);
    await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').fase==='torre2-aim',null,{timeout:12000});
    await sync();await tap(316,186);
    await page.waitForFunction(n=>window.kanto.readCampaign()?.inventory?.pokeball===n-1,
     t0.balls,{timeout:15000});
    await page.waitForFunction(()=>{
     const b=window.__pt2Game.scene.getScene('combate');
     return window.__pt2Game.scene.isActive('campanha')||
       (b.scene.isActive()&&b.fase==='lucha'&&!b.__torre2CaptureBusy);
    },null,{timeout:25000});
    const now=await game();
    report.teamPreparation.throws.push({encounter:encounters,beforeBalls:t0.balls,
     afterBalls:now.balls,team:now.team.map(m=>m.id),losses:now.losses});
    saveReport();
    if(now.team.length>t0.team.length){
     report.teamPreparation.captures.push(now.team.at(-1));
     battle=false;
    }else if(await page.evaluate(()=>window.__pt2Game.scene.isActive('campanha'))){
     battle=false;
    }
   }
   if(await page.evaluate(()=>window.__pt2Game.scene.isActive('campanha')))await centerHeal();
   else throw new Error('Wild capture sequence still in a live battle; '+JSON.stringify(await game()));
   assert.equal((await game()).trainer,old.trainer,'Wild encounters never advance trainer checkpoint');
  }
  report.teamPreparation.after=await game();
  saveReport();
  assert.ok(report.teamPreparation.after.team.length>=3,
   'At least two genuine RNG captures are required before Rival checkpoint');
  assert.equal(report.teamPreparation.after.trainer,12,'All 12 trainer wins are preserved');
  assert.equal(report.teamPreparation.after.box.join(','),'mewtwo');
  console.log('PASS REAL TEAM PREPARATION',JSON.stringify(report.teamPreparation.after));
 };

 try{
  await page.goto('http://127.0.0.1:4322/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:50000});
  await page.evaluate(async()=>{
   const main=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=window.kanto=await import(new URL('./torre2/campaign-core.js',main));
   const s=core.createCampaign('bulbasaur');
   core.saveCampaign(s);
   core.storePokemon(s,1);
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
   !!window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,null,{timeout:45000});
  let before=await game();
  assert.equal(before.stage,0);assert.equal(before.trainer,0);assert.equal(before.wins,0);
  assert.deepEqual(before.team.map(x=>x.id),['bulbasaur']);
  assert.equal(before.team[0].level,5);
  assert.deepEqual(before.box,['mewtwo']);
  const names=['pidgey','rattata','caterpie','charmander'];
 const total=14;
  for(let round=0;round<total;round++){
   if(round===12){await prepareNaturalTeam();before=await game();}
   const opponent=await page.evaluate(()=>window.kanto.currentOpponent(window.kanto.readCampaign()));
   const entry={round:round+1,expected:opponent.id,role:opponent.kind,before};report.steps.push(entry);
   if(round<names.length)assert.equal(opponent.id,names[round],
    'First four route species include the rival after Caterpie');
   assert.ok(opponent.id,'Every route checkpoint must expose actual species');
   const expectedKind=round===13?'leader':round===3||round===12?'rival':round===5?'rocket':'trainer';
   assert.equal(opponent.kind,expectedKind,'Early route trainer roles must stay canonical');
   await clickTag('torre2-central-cta');
   if(opponent.leader){
    // Gym leaders have a legitimate challenge confirmation scene between
    // route CTA and battle. Click its live Phaser challenge button.
    await page.waitForFunction(()=>{
     const c=window.__pt2Game.scene.getScene('campanha');
     return c.children.list.some(o=>typeof o.text==='string'&&
      o.text.includes('LÍDER DISPONÍVEL PARA BATALHA'));
    },null,{timeout:12000});
    await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
    const xy=await page.evaluate(()=>{
     const rect=document.querySelector('#juego canvas').getBoundingClientRect();
     return {x:rect.x+320*rect.width/640,y:rect.y+225*rect.height/360};
    });
    await page.mouse.click(xy.x,xy.y);
   }
   await page.waitForFunction(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return b.scene.isActive()&&b.fase==='lucha'&&b.__torre2PartyInstalled&&b.__torre2AutoMode?.zone?.active;
   },null,{timeout:60000});
   entry.open=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return {player:b.datos.p1,enemy:b.datos.p2,
      level:b.datos.torre2.playerLevel,enemyLevel:b.datos.torre2.enemyLevel,
      party:b.datos.torre2.party.foes.map(m=>m.id),auto:b.__torre2AutoMode.enabled};
   });
   assert.equal(entry.open.player,before.team[before.active].id);
   assert.equal(entry.open.enemy,opponent.leader?'geodude':opponent.id,
    'First real boss sprite is Geodude, not the unseen Onix ace');
   if(opponent.leader)assert.deepEqual(entry.open.party,['geodude','onix']);
   assert.equal(entry.open.auto,false,'AUTO resets between fights');
   const button=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    const zone=b.__torre2AutoMode.zone,rect=document.querySelector('#juego canvas').getBoundingClientRect();
    return {x:rect.x+zone.x*rect.width/640,y:rect.y+zone.y*rect.height/360};
   });
   await page.mouse.click(button.x,button.y);
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').__torre2AutoMode?.enabled,
    null,{timeout:5000});
   await page.screenshot({path:out+'/natural-route1-trainer-'+(round+1)+'-combat.png'});
   const started=Date.now();
   try{
    await page.waitForFunction(round=>{
     const s=window.kanto.readCampaign();
     return window.__pt2Game.scene.isActive('campanha')&&
      !!s&&(s.wins===round+1||s.losses>0);
    },round,{timeout:240000,polling:250});
   }catch(error){
    entry.failedReason=String(error);
    entry.game=await game();
    entry.battle=await page.evaluate(()=>{
     const b=window.__pt2Game.scene.getScene('combate');
     return {active:b.scene.isActive(),phase:b.fase,
      hp:b.luchadores?.map(m=>({hp:m.hp,hpMax:m.hpMax})),
      playerIndex:b.datos?.torre2?.party?.playerIndex,
      enemyIndex:b.datos?.torre2?.party?.enemyIndex};
    });
    await page.screenshot({path:out+'/natural-route1-trainer-'+(round+1)+'-failure.png'});
    saveReport();
    throw new Error('Natural training ladder failed at '+(round+1)+': '+JSON.stringify(entry));
   }
   entry.seconds=Math.round((Date.now()-started)/100)/10;
   entry.after=await game();
   assert.equal(entry.after.stage,opponent.leader?1:0);
   assert.equal(entry.after.trainer,opponent.leader?0:round+1);
   assert.equal(entry.after.wins,round+1);
   assert.equal(entry.after.losses,before.losses,'No loss fabricated during trainer victory');
   const payout=opponent.leader?1200:opponent.kind==='rival'?460:opponent.kind==='rocket'?360:180;
   assert.equal(entry.after.money,before.money+payout,'Real trainer/Rocket/Rival payout');
   assert.deepEqual(entry.after.box,['mewtwo']);
   assert.equal(entry.after.team.length,round<12?1:3);
   if(opponent.leader){
    assert.deepEqual(entry.after.badges,['Rocha'],'Brock grants first and only badge');
    assert.ok(entry.after.tms.includes('tm-rock-tomb'),'Brock grants unique FireRed TM39');
   }else{
    assert.deepEqual(entry.after.badges,[],'No early leader rewards');
   }
   // Game's normal reward routine restores active HP; no direct heal call.
   assert.ok(entry.after.team.some(m=>m.hp>0),'At least one party member remains conscious');
   saveReport();
   console.log('PASS NATURAL TRAINER',JSON.stringify({
    index:round+1,foe:entry.open.enemy,timeSeconds:entry.seconds,after:entry.after}));
   if(round<total-1){
    // Real postbattle report is modal; dismiss with the actual Phaser button.
    await page.waitForFunction(()=>!!window.__pt2Game.scene.getScene('campanha').children.list.find(
      o=>o.active&&o.getData?.('torre2-report-continue')===true),null,{timeout:12000});
    await clickTag('torre2-report-continue');
    await page.waitForFunction(()=>!window.__pt2Game.scene.getScene('campanha').children.list.find(
      o=>o.active&&o.getData?.('torre2-report-continue')===true),null,{timeout:12000});
   }
   before=entry.after;
  }
  await page.screenshot({path:out+'/natural-route1-through-brock-completed.png'});
  assert.deepEqual(errors,[],'No client JS exceptions through four consecutive native battles');
  console.log('PASS 12 REAL TRAINERS + NATURAL CAPTURES + RIVAL AND BROCK; no debug KOs, normal XP/rewards');
 }finally{saveReport();await page.close();await browser.close();server.close()}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
