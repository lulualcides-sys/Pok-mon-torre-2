'use strict';
// T04: real Phaser/WebGL campaign switch input while delayed impacts are queued.
// Queued impacts and KO are explicit isolated fixtures, NOT a naturally cast
// multi-hit attack or a naturally played campaign victory.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg',
 '.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const uri=new URL(req.url||'/','http://127.0.0.1:4414');
 const dest=path.resolve(root,'.'+(uri.pathname.endsWith('/')?uri.pathname+'index.html':uri.pathname));
 if(!dest.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const bytes=await fsp.readFile(dest);res.writeHead(200,{'content-type':mime[path.extname(dest)]||'application/octet-stream'});res.end(bytes)}
 catch{res.writeHead(404);res.end('missing')}
});
const report={scope:'T04 delayed-impact boundary during real native Phaser switches',
 fixture:'queued synthetic impacts and forced KO; NOT actual multi-hit VFX or natural campaign',
 transitions:[]};
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(ok=>server.listen(4414,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4414/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=window.t04Core=await import(new URL('./torre2/campaign-core.js',src));
   const state=core.createCampaign('bulbasaur');
   core.storePokemon(state,1); // Permanent Mewtwo remains in PC.
   state.team.push(core.createCampaign('squirtle').team[0]);
   core.saveCampaign(state);
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
   !!window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,null,{timeout:50000});
  await page.evaluate(()=>{
   const g=window.__pt2Game,c=g.scene.getScene('campanha');
   c.enterBattle(window.t04Core.readCampaign(),false);
  });
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.__torre2PartyInstalled&&b.fase==='lucha'&&
    !b.__torre2Changing&&!b.__torre2BallTransitions&&
    b.__torre2SideParty?.slots?.[1]?.input?.enabled;
  },null,{timeout:70000});
  const initial=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   const [player,peer]=b.luchadores;
   player.inmortal=true;peer.inmortal=true;
   b.controles[1].leer=()=>({mx:0,my:0,ax:player.x,ay:player.y});
   b.__t04Hits=0;b.__t04Destroyed=0;
   b.__torre2BattleBagOpen=true; // Pause native ticks while fixture is installed.
   const vfx=b.add.graphics();
   const originalDestroy=vfx.destroy.bind(vfx);
   vfx.destroy=function(){b.__t04Destroyed++;originalDestroy()};
   b.efectos.push(vfx,null,vfx);
   // If these survived recall, they could hit the new fighter or its peer.
   b.tareas.push({t:Infinity,tiempo:Infinity,fn:()=>{b.__t04Hits++;player.hp-=12;}});
   b.tareas.push({t:Infinity,tiempo:Infinity,fn:()=>{b.__t04Hits++;peer.hp-=12;}});
   return {playerHp:player.hp,peerHp:peer.hp,team:b.datos.torre2.party.friend.map(x=>x.id),
    queued:b.tareas.length,effects:b.efectos.length,
    save:window.t04Core.readCampaign()};
  });
  assert.deepEqual(initial.team,['bulbasaur','squirtle']);
  assert.ok(initial.queued>=2&&initial.effects>=3);
  const tap=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),z=b.__torre2SideParty.slots[1];
   const rect=document.querySelector('#juego canvas').getBoundingClientRect();
   return {x:rect.left+z.x*rect.width/640,y:rect.top+z.y*rect.height/360};
  });
  await page.mouse.click(tap.x,tap.y); // Real Phaser pointerdown on party sprite.
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.datos.p1==='squirtle'&&b.datos.torre2.party.playerIndex===1&&
    b.fase==='lucha'&&!b.__torre2Changing;
  },null,{timeout:30000});
  const switched=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),[player,peer]=b.luchadores;
   b.__torre2BattleBagOpen=false;
   return {species:player.def.id,texture:player.spr.texture.key,
    hits:b.__t04Hits,destroyed:b.__t04Destroyed,
    tasks:b.tareas.length,effects:b.efectos.length,
    peerHp:peer.hp,playerHp:player.hp,
    saved:window.t04Core.readCampaign()};
  });
  assert.equal(switched.species,'squirtle');
  assert.ok(switched.texture.startsWith('pmd-'),'Native replacement sprite missing');
  assert.equal(switched.hits,0,'Delayed impact was executed across switch');
  assert.equal(switched.destroyed,1,'Duplicate VFX must be destroyed exactly once');
  assert.equal(switched.tasks,0,'Queued hits must be discarded');
  assert.equal(switched.effects,0,'Old projectiles must be discarded');
  assert.equal(switched.peerHp,initial.peerHp,'Switch must not damage/heal the peer');
  assert.equal(switched.saved.wins,initial.save.wins);
  assert.equal(switched.saved.losses,initial.save.losses);
  assert.deepEqual(switched.saved.inventory,initial.save.inventory);
  report.transitions.push({kind:'manual real pointer switch',initial:{queued:initial.queued,effects:initial.effects},switched});
  await page.screenshot({path:'test-evidence/t04-native-switch-cleared.png'});
  // Explicit KO fixture, then genuine campaign recall/sendout handler.
  await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   const [player,peer]=b.luchadores;
   b.__t04Hits=0;b.__t04Destroyed=0;
   b.__torre2BattleBagOpen=true;
   const fx=b.add.graphics();const destroy=fx.destroy.bind(fx);
   fx.destroy=function(){b.__t04Destroyed++;destroy()};
   b.efectos.push(fx,fx,null);
   b.tareas.push({t:Infinity,fn:()=>{b.__t04Hits++;peer.hp-=20;}});
   player.hp=0;player.ko=true;
   b.alKO(player);
  });
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.datos.p1==='bulbasaur'&&b.datos.torre2.party.playerIndex===0&&
    b.fase==='lucha'&&!b.__torre2Changing;
  },null,{timeout:30000});
  const ko=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),[p,e]=b.luchadores;
   b.__torre2BattleBagOpen=false;
   return {species:p.def.id,texture:p.spr.texture.key,
    hits:b.__t04Hits,destroyed:b.__t04Destroyed,
    tasks:b.tareas.length,effects:b.efectos.length,
    peerHp:e.hp,friend:b.datos.torre2.party.friend.map(m=>({id:m.id,hp:m.hp}))};
  });
  assert.equal(ko.species,'bulbasaur');
  assert.equal(ko.hits,0,'KO queued impact leaked to incoming fighter');
  assert.equal(ko.destroyed,1);
  assert.equal(ko.tasks,0);assert.equal(ko.effects,0);
  assert.equal(ko.peerHp,switched.peerHp);
  assert.equal(ko.friend[1].hp,0,'Outgoing fainted member must stay fainted');
  assert.ok(ko.friend[0].hp>0,'Incoming member must remain alive');
  report.transitions.push({kind:'fixture KO with native recall/sendout',ko});
  await page.screenshot({path:'test-evidence/t04-native-ko-cleared.png'});
  assert.deepEqual(errors,[],'No uncaught browser errors');
  fs.writeFileSync('test-evidence/t04-native-boundary.json',JSON.stringify(report,null,2));
  console.log('T04 PASS native Phaser pointer switch + fixture KO, pending hits cleared; not a natural multi-hit attack');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
