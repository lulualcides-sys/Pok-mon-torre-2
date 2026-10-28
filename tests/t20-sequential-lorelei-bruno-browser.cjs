'use strict';
// T20: TWO successive native Indigo League victories from ONE prepared checkpoint.
// Only the initial Victory Road checkpoint and Lv54 team are fixtures. No
// stage, honor, HP, EXP, damage, KO, victory or AI state is injected afterwards.
// This is not a naturally played Pallet -> Indigo campaign.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg',
 '.svg':'image/svg+xml','.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1');
 const file=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const bytes=await fsp.readFile(file);
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('missing')}
});
const report={scope:'T20 native Lorelei then Bruno without fabricated intermediate checkpoint',
 fixture:'Only initial stage8/trainer17, eight badges, 172 wins, six legal Lv54 Pokemon and money are prepared',
 afterFixture:'No further direct save edits; actual Phaser pointer CTA, AUTO, sidebar, battle and full reload',
 battles:[],status:'not-started'};
const evidence='test-evidence/t20-sequential-lorelei-bruno.json';
function persist(){fs.mkdirSync('test-evidence',{recursive:true});
 fs.writeFileSync(evidence,JSON.stringify(report,null,2))}
(async()=>{
 persist();
 await new Promise(done=>server.listen(4497,'127.0.0.1',done));
 const browser=await chromium.launch({
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']
 });
 let page;
 try{
  page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4497/arena2d/?original=1',
   {waitUntil:'domcontentloaded'});
  const waitTitle=()=>page.waitForFunction(()=>
   window.__pt2Game?.scene.isActive('titulo'),null,{timeout:65000});
  const waitMap=()=>page.waitForFunction(()=>{
   const c=window.__pt2Game?.scene.getScene('campanha');
   return c?.scene.isActive()&&!!c.__torre2BattlePath;
  },null,{timeout:65000});
  const snapshot=()=>page.evaluate(()=>{
   const core=window.t20Core,s=core.readCampaign();
   return {stage:s.stage,trainer:s.trainer,wins:s.wins,losses:s.losses,
    money:s.money,champion:s.champion,active:s.active,
    badges:[...s.badges],honors:[...(s.leagueHonors||[])],
    inventory:JSON.parse(JSON.stringify(s.inventory)),
    team:s.team.map(m=>({id:m.id,uid:m.uid,hp:m.hp,
     level:m.progression.level,status:m.status||null})),
    box:s.box.map(m=>({id:m.id,uid:m.uid})),
    next:core.currentOpponent(s)?.name||null};
  });
  const tap=async(x,y)=>{
   const pos=await page.evaluate(([x,y])=>{
    const rect=document.querySelector('#juego canvas').getBoundingClientRect();
    return {x:rect.left+x*rect.width/640,y:rect.top+y*rect.height/360};
   },[x,y]);
   await page.mouse.move(pos.x,pos.y);
   await page.mouse.down();await page.waitForTimeout(110);await page.mouse.up();
   await page.waitForTimeout(120);
  };
  await waitTitle();
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=window.t20Core=await import(new URL('./torre2/campaign-core.js',src));
   const {createPokemonProgression}=await import(new URL('./torre2/progression.js',src));
   const s=core.createCampaign('bulbasaur');core.saveCampaign(s);
   if(!core.storePokemon(s,1))throw Error('Could not deposit permanent QA Mewtwo');
   s.stage=8;s.trainer=core.TRAINERS_PER_GYM(8);s.wins=172;s.losses=0;
   s.badges=core.GYMS.map(g=>g.badge);s.leagueHonors=[];
   s.team=['jolteon','zapdos','raichu','blastoise','alakazam','slowbro']
    .map((id,i)=>({id,uid:'t20-sequential-'+i+'-'+id,hp:100,
     progression:createPokemonProgression(id,54),
     status:null,tmMoves:[],moves:[]}));
   s.active=0;s.money=24000;core.saveCampaign(s);
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await waitMap();
  const initial=await snapshot();
  report.initial=initial;persist();
  assert.equal(initial.stage,8);
  assert.equal(initial.trainer,17);
  assert.equal(initial.next,'Lorelei');
  assert.equal(initial.team.length,6);
  assert.ok(initial.team.every(x=>x.level===54&&x.hp===100));
  assert.deepEqual(initial.box.map(x=>x.id),['mewtwo']);
  const originalUids=initial.team.map(x=>x.uid);
  const originalBox=initial.box;
  const originalBadges=initial.badges;
  let before=initial;
  for(const [round,leader] of ['Lorelei','Bruno'].entries()){
   report.status='starting-'+leader;persist();
   assert.equal(before.next,leader,'Next League boss must be earned naturally');
   const cta=await page.evaluate(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    const z=c.children.list.find(o=>o.active&&o.input?.enabled&&
     o.getData?.('torre2-central-cta')===true);
    if(!z)throw Error('Missing native League CTA');
    return {x:z.x,y:z.y};
   });
   await tap(cta.x,cta.y);
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')
    .children.list.some(o=>typeof o.text==='string'&&
     o.text.includes('LÍDER DISPONÍVEL PARA BATALHA')),
    null,{timeout:15000});
   await tap(320,225);
   await page.waitForFunction(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return b.scene.isActive()&&b.fase==='lucha'&&
     b.__torre2PartyInstalled&&b.__torre2AutoMode?.zone?.input?.enabled;
   },null,{timeout:70000});
   const opened=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return {p1:b.datos.p1,p2:b.datos.p2,
     foes:b.datos.torre2.party.foes.map(x=>x.id),
     auto:b.__torre2AutoMode.enabled,
     sideSlots:b.__torre2SideParty?.slots?.length||0};
   });
   assert.equal(opened.auto,false,'AUTO must start disabled on each battle');
   assert.equal(opened.foes.length,5);
   if(round===0){
    assert.deepEqual(opened.foes,['dewgong','cloyster','slowbro','jynx','lapras']);
    assert.equal(opened.p1,'jolteon');
   }else{
    assert.deepEqual(opened.foes,['onix','hitmonchan','hitmonlee','onix','machamp']);
    // A surviving fighter is selected by the ORIGINAL sidebar pointer, not
    // by editing the campaign save or forcing the player fighter.
    // Keep counters on the bench during Lorelei, but never resurrect a KO.
    // If the first counter fainted, choose another surviving legal member.
    const counterIndex=[3,4,5].find(i=>before.team[i].hp>0);
    assert.ok(Number.isInteger(counterIndex),
     'No surviving Water/Psychic counter after Lorelei: '+JSON.stringify(before.team));
    const slot=await page.evaluate(index=>{
     const b=window.__pt2Game.scene.getScene('combate');
     const z=b.__torre2SideParty?.slots?.[index];
     if(!z?.active||!z?.input?.enabled)throw Error('Native sidebar counter unavailable '+index);
     return {x:z.x,y:z.y};
    },counterIndex);
    await tap(slot.x,slot.y);
    await page.waitForFunction(index=>{
     const b=window.__pt2Game.scene.getScene('combate');
     return b.datos.torre2.party.playerIndex===index&&!b.__torre2Changing;
    },counterIndex,{timeout:30000});
    const selected=await page.evaluate(()=>{
     const b=window.__pt2Game.scene.getScene('combate');
     return {index:b.datos.torre2.party.playerIndex,
      baseSpecies:b.luchadores[0]?.def?.id,
      evolvedForm:String(b.luchadores[0]?.forma?.nombre||'').toLowerCase()};
    });
    assert.equal(selected.index,counterIndex);
    assert.equal(selected.evolvedForm,before.team[counterIndex].id,
     'Native actor base species is not the displayed evolution form');
    report.brunoCounter=selected;persist();
   }
   const auto=await page.evaluate(()=>{
    const z=window.__pt2Game.scene.getScene('combate').__torre2AutoMode.zone;
    return {x:z.x,y:z.y};
   });
   await tap(auto.x,auto.y);
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate')
    .__torre2AutoMode.enabled===true,null,{timeout:10000});
   const record={leader,opened,started:Date.now(),status:'native-AUTO-running'};
   report.battles.push(record);persist();
   await page.screenshot({path:'test-evidence/t20-sequential-'+leader+'-start.png'});
   const monitor=setInterval(async()=>{
    try{
     const status=await page.evaluate(()=>{
      const b=window.__pt2Game.scene.getScene('combate'),s=window.t20Core.readCampaign();
      return {stage:s.stage,wins:s.wins,losses:s.losses,
       fight:b.scene.isActive(),phase:b.fase,
       foeIndex:b.datos?.torre2?.party?.enemyIndex,
       playerIndex:b.datos?.torre2?.party?.playerIndex};
     });
     console.log('T20 SEQUENTIAL PROGRESS',leader,JSON.stringify(status));
    }catch(e){console.log('T20 monitor',String(e))}
   },45000);monitor.unref();
   try{
    await page.waitForFunction(({wins,losses})=>{
     const s=window.t20Core.readCampaign();
     return window.__pt2Game.scene.isActive('campanha')&&
      (s.wins>wins||s.losses>losses);
    },{wins:before.wins,losses:before.losses},
    {timeout:780000,polling:350});
   }finally{clearInterval(monitor)}
   const after=await snapshot();
   record.after=after;record.elapsedSeconds=Math.round((Date.now()-record.started)/1000);
   record.status=after.wins===before.wins+1?'victory':'defeat';
   persist();
   assert.equal(after.losses,before.losses,leader+' was lost, not won');
   assert.equal(after.wins,before.wins+1,'No fabricated League victory');
   assert.equal(after.stage,before.stage+1,'Only real win advances League stage');
   assert.equal(after.trainer,0);
   assert.equal(after.money,before.money+1200);
   assert.deepEqual(after.honors,
    Array.from({length:round+1},(_,i)=>'Elite '+(i+1)));
   assert.deepEqual(after.badges,originalBadges);
   assert.deepEqual(after.team.map(x=>x.uid),originalUids);
   assert.deepEqual(after.box,originalBox);
   assert.equal(after.champion,false);
   assert.equal(after.next,round===0?'Bruno':'Agatha');
   await page.screenshot({path:'test-evidence/t20-sequential-'+leader+'-victory.png'});
   // Full reload after a real win. Verify byte-for-byte checkpoint and
   // resumed next boss, without ever rewriting the campaign from the test.
   const bytes=await page.evaluate(()=>localStorage.getItem(window.t20Core.SAVE_KEY));
   await page.reload({waitUntil:'domcontentloaded'});await waitTitle();
   await page.evaluate(async()=>{
    const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
    window.t20Core=await import(new URL('./torre2/campaign-core.js',src));
    window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
   });
   await waitMap();
   const restored=await snapshot();
   const restoredBytes=await page.evaluate(()=>
    localStorage.getItem(window.t20Core.SAVE_KEY));
   assert.deepEqual(restored,after,'Reload altered earned League state');
   assert.equal(restoredBytes,bytes,'Reload rewrote a valid checkpoint');
   record.reload={sameBytes:true,next:restored.next,stage:restored.stage};
   before=restored;persist();
   console.log('T20 SEQUENTIAL NATIVE WIN',JSON.stringify({
    leader,stage:after.stage,wins:after.wins,elapsedSeconds:record.elapsedSeconds,
    next:restored.next,saveIdentical:true}));
  }
  assert.deepEqual(errors,[],'Phaser JS errors during successive League fights');
  report.status='two-native-victories-confirmed';persist();
  console.log('T20 LORELEI -> BRUNO TWO NATIVE BATTLES PASS',
   JSON.stringify({fights:report.battles.map(b=>({leader:b.leader,
    status:b.status,elapsedSeconds:b.elapsedSeconds})),final:before}));
 }catch(error){
  report.status='failed';report.error=String(error);persist();
  if(page&&!page.isClosed()){
   await page.screenshot({path:'test-evidence/t20-sequential-failure.png'}).catch(()=>{});
  }
  throw error;
 }finally{
  if(page&&!page.isClosed())await page.close();
  await browser.close();
  await new Promise(done=>server.close(done));
 }
})().catch(error=>{console.error(error);process.exitCode=1;if(server.listening)server.close()});
