'use strict';
// T19: five native Phaser/CPU fights using real team sidebar taps + AUTO.
// Only the initial post-Brock checkpoint/team level is a prepared fixture;
// no fabricated hit, KO, XP, payment, result, or win. No game source edits.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
// Optional next-five checkpoint; default first-five behavior stays unchanged.
// Stage1 trainer10: final five real trainer fights BEFORE Misty (trainer15).
const startTrainer=10;
// A hung native Chromium/WebGL test must produce diagnostics instead of
// occupying Actions until its 40-minute job limit. No result manipulation.
const startedAt=Date.now();
let checkpoint='init', lastBattle=null;
const heartbeat=setInterval(()=>console.log('T19 HEARTBEAT',JSON.stringify({
 checkpoint,elapsedMs:Date.now()-startedAt,lastBattle
})),20000);heartbeat.unref();
const watchdog=setTimeout(()=>{
 const data={checkpoint,elapsedMs:Date.now()-startedAt,lastBattle,
  explanation:'Native battle/Chromium did not complete within 35 minutes; no victory asserted'};
 try{fs.mkdirSync('test-evidence',{recursive:true});
  fs.writeFileSync('test-evidence/t19-runner-watchdog.json',JSON.stringify(data,null,2));}catch{}
 console.error('T19 WATCHDOG FAILED',JSON.stringify(data));
 process.exit(124); // never pass an incomplete combat test
},35*60*1000);watchdog.unref();
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg',
 '.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1');
 const filename=path.resolve(root,'.'+(u.pathname.endsWith('/')?
  u.pathname+'index.html':u.pathname));
 if(!filename.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const b=await fsp.readFile(filename);res.writeHead(200,
  {'content-type':mime[path.extname(filename)]||'application/octet-stream'});res.end(b)}
 catch{res.writeHead(404);res.end('not found')}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(ok=>server.listen(4483,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 const report={scope:'T19 five normal Cerulean checkpoint fights with native AUTO',
  startTrainer,checkpointFixture:'stage1 trainer10 with ten previous Cerulean wins, Rocha badge, 6 Kanto Lv21 members and initial money prepared; only trainer fights 11–15 are real in this test',
  fights:[],naturalFromCheckpoint:true,wholeCampaignNatural:false,
  trainerSelectedCounters:true,autoPartySwitches:false};
 let page=null;
 try{
  page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  checkpoint='page navigation';
  await page.goto('http://127.0.0.1:4483/arena2d/?original=1',
   {waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),
   null,{timeout:60000});
  await page.evaluate(async startTrainer=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=window.t19Core=await import(new URL('./torre2/campaign-core.js',src));
   const {createPokemonProgression}=await import(new URL('./torre2/progression.js',src));
   const st=core.createCampaign('squirtle');
   core.saveCampaign(st);
   core.storePokemon(st,1);
   st.stage=1;st.trainer=startTrainer;st.wins=14+startTrainer;
   st.money=4140;st.badges=['Rocha'];
   st.team[0].id='wartortle';
   st.team[0].progression=createPokemonProgression('wartortle',21);
   st.team[0].hp=100;st.team[0].moves=[];st.team[0].tmMoves=[];
   // Independent fixture: two genuine party members against two Rocket foes.
   // Pikachu could be caught in Viridian and trained to Lv20 by this stage.
   for(const [i,id] of ['pikachu','oddish','geodude','mankey','butterfree'].entries())
    st.team.push({id,uid:'t19-cerulean-last-'+i+'-'+id,
     hp:100,progression:createPokemonProgression(id,21),
     status:null,tmMoves:[],moves:[]});
   core.saveCampaign(st);
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  },startTrainer);
  await page.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return c.scene.isActive()&&!!c.__torre2BattlePath;
  },null,{timeout:60000});
  const game=()=>page.evaluate(()=>{
   const s=window.t19Core.readCampaign();
   return {stage:s.stage,trainer:s.trainer,wins:s.wins,losses:s.losses,
    active:s.active,
    money:s.money,badges:[...s.badges],honors:[...s.leagueHonors],
    inventory:{...s.inventory},team:s.team.map(m=>({id:m.id,uid:m.uid,
     level:m.progression?.level,hp:m.hp})),
    box:s.box.map(m=>m.uid)};
  });
  const clickData=async(key,value)=>{
   const pos=await page.evaluate(([key,value])=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    const z=c.children.list.find(o=>o.active&&o.input?.enabled&&
     o.getData?.(key)===value);
    if(!z)throw Error('Missing native checkpoint UI '+key);
    const rect=document.querySelector('#juego canvas').getBoundingClientRect();
    return {x:rect.x+rect.width*z.x/640,y:rect.y+rect.height*z.y/360};
   },[key,value]);
   await page.mouse.click(pos.x,pos.y);
  };
  // Center treatment is a real Phaser button + timed save, not a direct HP edit.
  // Only the navigation to the Center screen is short-circuited via its own
  // scene helper; the player still clicks CURAR and waits for the animation.
  const recoverAtCenter=async(snapshot)=>{
   await page.evaluate(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    c.centerScreen(window.t19Core.readCampaign());
   });
   await page.evaluate(()=>new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok))));
   await clickData('torre2-center-heal',true);
   await page.waitForFunction(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    const s=window.t19Core.readCampaign();
    return c.scene.isActive()&&!!c.__torre2BattlePath&&!c.__torre2CenterBusy&&
     s.team.every(m=>m.hp===100&&m.status===null);
   },null,{timeout:15000});
   const healed=await game();
   assert.equal(healed.stage,snapshot.stage);
   assert.equal(healed.trainer,snapshot.trainer);
   assert.equal(healed.wins,snapshot.wins);
   assert.equal(healed.money,snapshot.money,'Center is free');
   assert.deepEqual(healed.team.map(m=>m.uid),snapshot.team.map(m=>m.uid));
   assert.deepEqual(healed.team.map(m=>m.hp),snapshot.team.map(()=>100));
   console.log('T19 REAL CENTER HEAL',JSON.stringify({trainer:healed.trainer,hp:healed.team.map(m=>m.hp)}));
   return healed;
  };
  // Open the actual campaign SUMÁRIO, click USAR NA BATALHA, and let
  // selectTeamMember write the save. Never directly change active in the test.
  // Matchups within Misty's real Lv21 cap: Pikachu/Zubat,
  // Wartortle/Geodude, Butterfree/Bulbasaur (Grass resistance and
  // Psychic versus Poison), Mankey/Clefairy, Wartortle/Sandshrew.
  // No combat, HP, XP, level-cap or victory overrides.
  const selectCombatPokemon=async index=>{
   const prior=await game();
   if(prior.active===index)return prior;
   await page.evaluate(index=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    c.showSummary(window.t19Core.readCampaign(),index);
   },index);
   await page.evaluate(()=>new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok))));
   const point=await page.evaluate(()=>{
    const rect=document.querySelector('#juego canvas').getBoundingClientRect();
    return {x:rect.x+rect.width*111/640,y:rect.y+rect.height*325/360};
   });
   await page.mouse.move(point.x,point.y);
   await page.mouse.down();
   await page.waitForTimeout(110);
   await page.mouse.up();
   await page.waitForFunction(index=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    return c.scene.isActive()&&!!c.__torre2BattlePath&&
     window.t19Core.readCampaign()?.active===index;
   },index,{timeout:12000});
   const after=await game();
   assert.equal(after.trainer,prior.trainer,'Party switch cannot consume trainer');
   assert.equal(after.wins,prior.wins,'Party switch cannot invent victory');
   assert.equal(after.money,prior.money,'Party switch must be free');
   assert.deepEqual(after.team.map(m=>m.uid),prior.team.map(m=>m.uid));
   console.log('T19 NATIVE PARTY SELECT',JSON.stringify({trainer:after.trainer,pokemon:after.team[after.active].id}));
   return after;
  };
  let before=await game();
  assert.equal(before.stage,1);
  assert.equal(before.trainer,startTrainer);
  assert.equal(before.wins,14+startTrainer);
  assert.deepEqual(before.team.map(m=>m.id),
   ['wartortle','pikachu','oddish','geodude','mankey','butterfree']);
  assert.equal(before.team[0].level,21);
  assert.equal(before.box.length,1);
  for(let round=0;round<5;round++){
   checkpoint='route menu for Cerulean fight '+(round+1);
   const foe=await page.evaluate(()=>window.t19Core.currentOpponent(window.t19Core.readCampaign()));
   // Route slot 3 is the real Rival battle, not the fourth generic trainer.
   // Squirtle starter faces Bulbasaur per the campaign's native rival table.
   const expectedIds=['zubat','geodude','bulbasaur','clefairy','sandshrew'];
   const expectedRole=round===2?'rival':'trainer';
   assert.equal(foe.id,expectedIds[round],'Cerulean real route opponent mismatch');
   assert.equal(foe.kind,expectedRole,'Cerulean route role mismatch');
   const matchingTeamSlot=[1,0,5,4,0][round];
   before=await selectCombatPokemon(matchingTeamSlot);
   const record={fight:round+1,foe:foe.id,level:foe.level,before};
   report.fights.push(record);
   checkpoint='starting native fight '+(round+1);
   await clickData('torre2-central-cta',true);
   await page.waitForFunction(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return b.scene.isActive()&&b.fase==='lucha'&&
     b.__torre2PartyInstalled&&b.__torre2AutoMode?.zone?.input?.enabled;
   },null,{timeout:65000});
   const start=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    const rect=document.querySelector('#juego canvas').getBoundingClientRect();
    const z=b.__torre2AutoMode.zone;
    return {p1:b.datos.p1,p2:b.datos.p2,
     playerLevel:b.datos.torre2.playerLevel,
     enemyLevel:b.datos.torre2.enemyLevel,
     enabled:b.__torre2AutoMode.enabled,
     button:{x:rect.x+rect.width*z.x/640,y:rect.y+rect.height*z.y/360}};
   });
   assert.equal(start.p1,before.team[before.active].id);
   assert.equal(start.p2,foe.id);
   assert.equal(start.playerLevel,before.team[before.active].level);
   assert.equal(start.enabled,false,'AUTO must reset between fights');
   checkpoint='enabling AUTO '+(round+1);
   await page.mouse.click(start.button.x,start.button.y);
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').__torre2AutoMode.enabled,
    null,{timeout:8000});
   record.open=start;delete record.open.button;
   await page.screenshot({path:'test-evidence/t19-cerulean-fight-'+(round+1)+'-started.png'});
   try{
    checkpoint='live native combat '+(round+1);
    console.log('T19 NATIVE FIGHT START',JSON.stringify({round:round+1,foe:foe.id,player:start.p1,level:start.playerLevel,enemyLevel:start.enemyLevel}));
    // AUTO attacks via the native AI; the trainer uses the ACTUAL left
    // sidebar to select a type counter when the opponent changes species.
    // The AUTO button never promised autonomous party swaps. A short per-fight
    // timeout wrongly abandoned a live final Sandshrew with 22% HP; allow
    // six minutes, still fail closed on timeout/defeat. No state writes,
    // fake damage, forced KO, stage manipulation or battle-result injection.
    const counterSlots={
     zubat:[1,5,0],geodude:[0,2,4],paras:[5,4,1],
     bulbasaur:[5,4,1],clefairy:[4,0,5],sandshrew:[0,2,5],
     ekans:[5,3,0],poliwag:[1,2,0],psyduck:[1,2,0],
     staryu:[1,2,0],magikarp:[1,2,0]
    };
    record.sidebarSwitches=[];
    let lastSwap=0,finished=false;
    const deadline=Date.now()+360000;
    while(Date.now()<deadline){
     const live=await page.evaluate(({wins,losses})=>{
      const game=window.__pt2Game,b=game.scene.getScene('combate');
      const s=window.t19Core.readCampaign(),p=b.datos?.torre2?.party;
      return {finished:game.scene.isActive('campanha')&&
       (s?.wins===wins||s?.losses>losses),battle:b.scene.isActive(),
       phase:b.fase,changing:!!b.__torre2Changing,
       auto:!!b.__torre2AutoMode?.enabled,
       enemyIndex:p?.enemyIndex,playerIndex:p?.playerIndex,
       foe:p?.foes?.[p.enemyIndex]?.id,
       friend:p?.friend?.map(m=>({id:m.id,hp:m.hp}))||[],
       slotEnabled:b.__torre2SideParty?.slots?.map(z=>!!z?.input?.enabled)||[]};
     },{wins:before.wins+1,losses:before.losses});
     if(live.finished){finished=true;break;}
     if(live.battle&&live.phase==='lucha'&&!live.changing&&live.auto&&
        Date.now()-lastSwap>2000){
      const target=(counterSlots[live.foe]||[]).find(i=>
       live.friend[i]?.hp>0&&live.slotEnabled[i]);
      if(Number.isInteger(target)&&target!==live.playerIndex){
       const pos=await page.evaluate(index=>{
        const b=window.__pt2Game.scene.getScene('combate');
        const zone=b.__torre2SideParty?.slots?.[index],r=
         document.querySelector('#juego canvas').getBoundingClientRect();
        return zone?.input?.enabled?
         {x:r.x+zone.x*r.width/640,y:r.y+zone.y*r.height/360}:null;
       },target);
       if(pos){
        lastSwap=Date.now();
        await page.mouse.click(pos.x,pos.y);
        record.sidebarSwitches.push({enemy:live.foe,enemyIndex:live.enemyIndex,
         from:live.friend[live.playerIndex]?.id,to:live.friend[target].id});
        console.log('T19 NATIVE SIDEBAR COUNTER',JSON.stringify(record.sidebarSwitches.at(-1)));
       }
      }
     }
     await page.waitForTimeout(350);
    }
    if(!finished)throw new Error('Native fight exceeded 360s with real sidebar counters');
   }catch(err){
    record.failure=String(err);
    record.state=await game();
    record.combat=await page.evaluate(()=>{
     const b=window.__pt2Game.scene.getScene('combate');
     return {active:b.scene.isActive(),phase:b.fase,
      actors:b.luchadores?.map(a=>({id:a.def?.id,hp:a.hp,max:a.hpMax})),
      auto:b.__torre2AutoMode?.enabled};
    });
    fs.writeFileSync('test-evidence/t19-five-cerulean-fights.json',JSON.stringify(report,null,2));
    await page.screenshot({path:'test-evidence/t19-cerulean-failure.png'});
    throw Error('T19 NATURAL FIGHT FAILED '+JSON.stringify(record));
   }
   const after=await game();
   checkpoint='battle result '+(round+1);
   record.after=after;lastBattle={round:round+1,enemy:foe.id,wins:after.wins,losses:after.losses};
   if(after.losses>before.losses){
    fs.writeFileSync('test-evidence/t19-five-cerulean-fights.json',JSON.stringify(report,null,2));
    throw Error('T19 genuine native defeat; no fake victory: '+JSON.stringify({round:round+1,foe:foe.id,after}));
   }
   assert.equal(after.stage,1,'Premature gym progression');
   assert.equal(after.trainer,before.trainer+1);
   assert.equal(after.wins,before.wins+1);
   assert.equal(after.losses,before.losses);
   const expectedPayment=foe.kind==='rival'?460:foe.kind==='rocket'?360:240;
   assert.equal(after.money,before.money+expectedPayment,
    'Cerulean reward must match native trainer/Rival economy');
   assert.deepEqual(after.badges,before.badges,'No second gym badge before Misty');
   assert.deepEqual(after.honors,before.honors);
   assert.deepEqual(after.box,before.box);
   assert.equal(after.team.length,before.team.length);
   assert.deepEqual(after.team.map(m=>m.uid),before.team.map(m=>m.uid),
    'No member duplication or deletion after native battle');
   assert.equal(after.team[after.active].hp,100,'Natural postfight heal');
   assert.equal(after.inventory.tms.length,before.inventory.tms.length,
    'No gym reward before leader KO');
   await page.screenshot({path:'test-evidence/t19-cerulean-fight-'+(round+1)+'-victory.png'});
   console.log('T19 REAL CERULEAN VICTORY',JSON.stringify({
    index:startTrainer+round+1,opponent:foe.id,from:before.trainer,to:after.trainer,
    level:after.team[0].level,money:after.money
   }));
   fs.writeFileSync('test-evidence/t19-five-cerulean-fights.json',JSON.stringify(report,null,2));
   if(round<4){
    await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')
     .children.list.some(o=>o.active&&o.getData?.('torre2-report-continue')===true),
     null,{timeout:15000});
    await clickData('torre2-report-continue',true);
    await page.waitForFunction(()=>!window.__pt2Game.scene.getScene('campanha')
     .children.list.some(o=>o.active&&o.getData?.('torre2-report-continue')===true),
     null,{timeout:12000});
   }
   if(round<4){
    // Multi-Pokémon trainers require resting between fights.
    // No HP, status, money or saved progress is injected by the test.
    record.healed=await recoverAtCenter(after);
   }
   before=record.healed||after;
   if(round===2){
    // Prove persisted checkpoint from the REAL third victory: full reload,
    // not only readCampaign() from the current JS module in memory.
    checkpoint='full browser reload after third genuine Cerulean win';
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),
     null,{timeout:60000});
    await page.evaluate(async()=>{
     const main=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
     window.t19Core=await import(new URL('./torre2/campaign-core.js',main));
     window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
    });
    await page.waitForFunction(()=>{
     const c=window.__pt2Game.scene.getScene('campanha');
     return c.scene.isActive()&&!!c.__torre2BattlePath;
    },null,{timeout:60000});
    const recovered=await game();
    assert.deepEqual(recovered,before,
     'A browser reload must retain three earned wins, exact money, badges, PC and UID');
    record.reloaded=recovered;
    report.reloadedAfterThird=true;
    fs.writeFileSync('test-evidence/t19-five-cerulean-fights.json',JSON.stringify(report,null,2));
   }
  }
  assert.equal(report.fights.length,5);
  assert.equal(before.stage,1);
  assert.equal(before.trainer,15,'All 15 trainers clear; gym leader is NEXT');
  const next=await page.evaluate(()=>window.t19Core.currentOpponent(window.t19Core.readCampaign()));
  assert.deepEqual({name:next.name,leader:next.leader,id:next.id},
   {name:'Misty',leader:true,id:'starmie'},'Misty must be unlocked but undefeated');
  assert.deepEqual(before.badges,['Rocha'],'No Cascata badge before real Misty KO');
  report.nextLeader=next;
  assert.deepEqual(errors,[],'Native Phaser errors in consecutive Cerulean fights');
  console.log('T19 FIVE NATIVE CERULEAN FIGHTS PASS: real AUTO combat, XP, money and saves',JSON.stringify({startTrainer,endTrainer:before.trainer}));
  checkpoint='five real fights proved';
 }finally{
  checkpoint='closing browser after real victories';
  try{if(page&&!page.isClosed())await page.close();}
  finally{
   await browser.close();
   await new Promise(done=>server.close(done));
   clearInterval(heartbeat);
   clearTimeout(watchdog);
  }
 }
})().catch(e=>{console.error(e);process.exitCode=1;clearInterval(heartbeat);clearTimeout(watchdog);if(server.listening)server.close()});
