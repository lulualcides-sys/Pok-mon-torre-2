'use strict';
/* Real built Phaser/WebGL audit of all eight gym leader rosters/learned
 * attacks, plus a native Brock battle control sample. Stage 0 Brock is an
 * explicit non-natural entry fixture; NO win, damage, KO or XP injection.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site'),port=4456;
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg',
 '.svg':'image/svg+xml','.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1:'+port);
 const file=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const data=await fsp.readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(data)}
 catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 await new Promise(done=>server.listen(port,'127.0.0.1',done));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
   '--use-gl=angle','--use-angle=swiftshader']});
 let page;const report={scope:'8 real compiled gym teams + native Brock leader IA',
  status:'starting',preparedEntry:true,naturalFullRoute:false};
 const store=()=>{fs.mkdirSync('test-evidence',{recursive:true});
  fs.writeFileSync('test-evidence/t19-gym-leader-challenge.json',JSON.stringify(report,null,2))};
 try{
  store();page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:'+port+'/arena2d/?original=1',
   {waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:65000});
  const rosters=await page.evaluate(async()=>{
   const main=[...document.scripts].find(s=>s.src?.includes('/main.js'))?.src;
   if(!main)throw Error('Native Phaser main.js unavailable');
   const core=window.t19Core=await import(new URL('./torre2/campaign-core.js',main));
   const teams=await import(new URL('./torre2/party-battle.js',main));
   const moves=await import(new URL('./torre2/move-pool.js',main));
   const result=[];
   for(let stage=0;stage<8;stage++){
    const save=core.createCampaign('bulbasaur');
    save.stage=stage;save.trainer=core.TRAINERS_PER_GYM(stage);
    const opponent=core.currentOpponent(save);
    const party=teams.createPartyMatch(save,opponent);
    const pokemon=party.foes.map(m=>{
     const member={id:m.id,progression:{species:m.id,level:m.level}};
     const baseline=moves.resolveLoadout(member);
     const legal=new Set(moves.availableMoves(member).map(x=>x.id));
     const upgrades=[];
     for(const [slot,idx]of [['rmb',1],['q',2],['e',3]]){
      const a=m.loadout[slot],original=baseline[slot];
      if(a?.id===original?.id)continue;
      upgrades.push({slot,move:a?.nombre,id:a?.id,
       legal:!!a?.forma&&legal.has(a.id)&&
        !moves.campaignMoveSlotReason(member,idx,a)});
     }
     return {id:m.id,level:m.level,originalLmb:baseline.lmb?.id,
      chosenLmb:m.loadout.lmb?.id,originalDodge:baseline.esp?.forma,
      chosenDodge:m.loadout.esp?.forma,upgrades};
    });
    result.push({stage,leader:core.GYMS[stage].leader,
     expectedIds:core.GYMS[stage].leaderTeam,
     expectedLevels:core.GYMS[stage].leaderLevels,
     gymLeader:party.gymLeader,party:pokemon});
   }
   // This save is a deliberate Brock-entry fixture, not earned progression.
   const s=core.createCampaign('bulbasaur');
   core.saveCampaign(s);core.storePokemon(s,1);
   s.stage=0;s.trainer=core.TRAINERS_PER_GYM(0);
   core.saveCampaign(s);
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
   return result;
  });
  report.rosters=rosters;store();
  assert.equal(rosters.length,8);
  let improvements=0;
  for(const g of rosters){
   assert.equal(g.gymLeader,true);
   assert.deepEqual(g.party.map(m=>m.id),g.expectedIds);
   assert.deepEqual(g.party.map(m=>m.level),g.expectedLevels);
   for(const m of g.party){
    assert.equal(m.chosenLmb,m.originalLmb,'Do not change approved basic attack');
    assert.equal(m.chosenDodge,m.originalDodge,'Do not change approved dodge');
    assert.ok(m.upgrades.length<=2,'At most two learned upgrades per gym fighter');
    assert.ok(m.upgrades.every(u=>u.legal),'No unapproved, locked or incompatible move');
    if(g.stage===2)assert.deepEqual(m.upgrades,[],
     'Lt. Surge approved authored kit is left untouched');
    improvements+=m.upgrades.length;
   }
  }
  report.improvements=improvements;
  assert.ok(improvements>0,'No gym leader received a more competitive learned move');
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
   !!window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,null,{timeout:65000});
  const cta=await page.evaluate(()=>{
   const scene=window.__pt2Game.scene.getScene('campanha');
   const zone=scene.children.list.find(o=>o.active&&o.input?.enabled&&
    o.getData?.('torre2-central-cta')===true);
   if(!zone)throw Error('Native Brock leader challenge missing');
   return {x:zone.x,y:zone.y};
  });
  const click=async(x,y)=>{
   const p=await page.evaluate(([x,y])=>{
    const rect=document.querySelector('#juego canvas').getBoundingClientRect();
    return {x:rect.left+x*rect.width/640,y:rect.top+y*rect.height/360};
   },[x,y]);
   await page.mouse.move(p.x,p.y);await page.mouse.down();
   await page.waitForTimeout(110);await page.mouse.up();
  };
  await click(cta.x,cta.y);
  await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')
   .children.list.some(o=>typeof o.text==='string'&&
    o.text.includes('LÍDER DISPONÍVEL PARA BATALHA')),null,{timeout:15000});
  await click(320,225);
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.fase==='lucha'&&b.__torre2PartyInstalled&&
    b.__torre2TrainerStrategy?.gymLeader&&!!b.__torre2GymPressure;
  },null,{timeout:70000});
  const first=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return {gymLeader:b.datos.torre2.party.gymLeader,
    cpuReader:typeof b.controles[1].leer,
    strategy:{...b.__torre2TrainerStrategy},
    opponent:b.datos.p2,foes:b.datos.torre2.party.foes.map(x=>x.id),
    items:{...b.__torre2TrainerItems.inventory}};
  });
  assert.equal(first.gymLeader,true);
  assert.equal(first.cpuReader,'function');
  assert.equal(first.strategy.nextCheck,5);
  assert.deepEqual(first.foes,['geodude','onix']);
  assert.deepEqual(first.items,{potion:1},'No extra potions for gym leaders');
  // Observe the ORIGINAL native CPU input for a few seconds, never press
  // its controls or alter combat stats/energy to manufacture an attack.
  await page.waitForTimeout(6000);
  const live=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),s=window.t19Core.readCampaign();
   return {active:b.scene.isActive(),phase:b.fase,
    assisted:b.__torre2GymPressure?.assisted??0,
    nativeUses:{...b.luchadores[1]?.stats?.usosSlot},
    playerHp:b.luchadores[0]?.hp,enemyHp:b.luchadores[1]?.hp,
    wins:s.wins,losses:s.losses,badges:[...s.badges]};
  });
  report.brock={first,live};store();
  assert.ok(live.active||live.wins>0||live.losses>0,
   'Native battle must remain active or finish with a real outcome');
  assert.deepEqual(errors,[],'No Phaser runtime exceptions');
  await page.screenshot({path:'test-evidence/t19-gym-leader-brock-native.png'});
  report.status='success';store();
  console.log('PASS T19 EIGHT GYMS LEGAL LEARNED MOVES + BROCK NATIVE CPU',JSON.stringify({
   gyms:rosters.length,improvements,brock:first,live}));
 }finally{
  store();
  if(page&&!page.isClosed())await page.close();
  await browser.close();await new Promise(done=>server.close(done));
 }
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
