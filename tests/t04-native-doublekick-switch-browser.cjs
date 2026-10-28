'use strict';
// T04: a native touch-cast approved multi-hit attack, followed by a real
// Phaser pointer switch before the second impact. Only the test fighter's
// move slot, aim, positions and combat resources are prepared. This is NOT
// a natural campaign battle, nor a change to the approved move catalog.
const assert=require('node:assert/strict'),fs=require('node:fs');
const fsp=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg'};
const server=http.createServer(async(req,res)=>{
 const uri=new URL(req.url||'/','http://127.0.0.1:4428');
 const file=path.resolve(root,'.'+(uri.pathname.endsWith('/')?uri.pathname+'index.html':uri.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const data=await fsp.readFile(file);
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(data)}
 catch{res.writeHead(404);res.end('missing')}
});
const report={scope:'T04 native multi-hit Double Kick cancelled by real party switch',
 fixture:'Bulbasaur given existing Double Kick only in isolated browser state; position, resources and enemy control prepared; no XP or victories',
 observations:[]};
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(resolve=>server.listen(4428,'127.0.0.1',resolve));
 const browser=await chromium.launch({
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']
 });
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4428/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=window.t04Core=await import(new URL('./torre2/campaign-core.js',src));
   const state=core.createCampaign('bulbasaur');
   core.storePokemon(state,1);
   state.team.push(core.createCampaign('squirtle').team[0]);
   core.saveCampaign(state);
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return c.scene.isActive()&&!!c.__torre2BattlePath;
  },null,{timeout:50000});
  await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   c.enterBattle(window.t04Core.readCampaign(),false);
  });
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.fase==='lucha'&&b.__torre2PartyInstalled&&
    b.__torre2SideParty?.slots?.[1]?.input?.enabled&&
    b.panelTactil?.botones?.some(x=>x.slot==='q');
  },null,{timeout:70000});
  const before=await page.evaluate(async()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   const [p,e]=b.luchadores;
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const pool=await import(new URL('./torre2/move-pool.js',src));
   const move=pool.TEST_LIBRARY.find(m=>m.nombre==='Double Kick');
   if(!move||move.forma!=='torre2_doublekick')throw Error('Approved native Double Kick unavailable');
   // Fixture ONLY: choose an existing approved move to exercise real native
   // rendering, damage and transition. Never modify the source or user save.
   p.kit.q={...move};p.cd.q=0;p.energia=100;p.ulti=100;
   p.ultimoAtaque=-100;p.ultimoBasico=-100;p.sobrecargaHasta=0;
   p.accion=null;p.animAccion=null;p.est={};p.dolorHasta=-1;p.ko=false;
   p.inmortal=true;e.inmortal=false;e.ko=false;e.hp=e.hpMax;e.est={};
   e.accion=null;e.dash=null;e.dolorHasta=-1;
   const dir=e.x>=p.x?1:-1;
   e.x=p.x+dir*82;e.y=p.y;
   e.spr?.setPosition(e.x,e.y);
   p.ax=e.x;p.ay=e.y;
   b.controles[1].leer=()=>({mx:0,my:0,ax:p.x,ay:p.y});
   b.__t04Contacts=[];
   const original=e.recibir;
   e.recibir=function(...args){
    const hp=this.hp;
    const result=original.apply(this,args);
    b.__t04Contacts.push({before:hp,after:this.hp,result,source:args[0]?.forma?.nombre||null});
    return result;
   };
   return {hp:e.hp,player:p.def.id,peer:e.def.id,
    slot:p.kit.q.nombre,renderer:p.kit.q.forma,
    save:window.t04Core.readCampaign()};
  });
  assert.equal(before.slot,'Double Kick');
  // Actual native touch control; do not call the move renderer or recibir().
  await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),panel=b.panelTactil;
   const button=panel.botones.find(x=>x.slot==='q');
   const pos=panel.pos(button),z=panel.punto({x:0,y:0}),one=panel.punto({x:1,y:1});
   panel.abajo({id:97,x:(pos.x-z.x)/(one.x-z.x),y:(pos.y-z.y)/(one.y-z.y)});
   panel.leer(x=>({ax:x.x,ay:x.y}));
  });
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.__t04Contacts?.some(x=>x.result==='golpe'&&x.after<x.before);
  },null,{timeout:9000,polling:20});
  await page.evaluate(()=>window.__pt2Game.scene.getScene('combate').panelTactil.arriba({id:97}));
  const first=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return {contacts:b.__t04Contacts.slice(),hp:b.luchadores[1].hp,
    effects:b.efectos.length,uses:b.luchadores[0].stats.usosSlot?.q||0};
  });
  assert.equal(first.contacts.filter(x=>x.result==='golpe'&&x.after<x.before).length,1,
   'Switch must occur between native kicks, not after the second hit');
  assert.ok(first.effects>0,'Multi-hit renderer must still be active');
  const slot=await page.evaluate(()=>{
   const z=window.__pt2Game.scene.getScene('combate').__torre2SideParty.slots[1];
   const rect=document.querySelector('#juego canvas').getBoundingClientRect();
   return {x:rect.left+z.x*rect.width/640,y:rect.top+z.y*rect.height/360};
  });
  await page.mouse.click(slot.x,slot.y);
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.datos.p1==='squirtle'&&b.datos.torre2.party.playerIndex===1&&
    b.fase==='lucha'&&!b.__torre2Changing;
  },null,{timeout:30000});
  await page.waitForTimeout(1300); // More than the remaining Double Kick duration.
  const after=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return {species:b.luchadores[0].def.id,texture:b.luchadores[0].spr.texture.key,
    contacts:b.__t04Contacts.slice(),hp:b.luchadores[1].hp,
    effects:b.efectos.length,tasks:b.tareas.length,
    saved:window.t04Core.readCampaign()};
  });
  assert.equal(after.species,'squirtle');
  assert.ok(after.texture.startsWith('pmd-'));
  assert.equal(after.contacts.length,1,'Second native kick leaked across party switch');
  assert.equal(after.hp,first.hp,'Departed actor must not cause a second impact');
  assert.deepEqual(after.saved.inventory,before.save.inventory);
  assert.equal(after.saved.wins,before.save.wins);
  assert.equal(after.saved.losses,before.save.losses);
  assert.deepEqual(errors,[]);
  report.observations.push({before,first,after});
  fs.writeFileSync('test-evidence/t04-native-doublekick-switch.json',JSON.stringify(report,null,2));
  await page.screenshot({path:'test-evidence/t04-native-doublekick-switch.png'});
  console.log('T04 PASS: native Double Kick contact followed by real pointer switch; no second hit (prepared fixture, not natural campaign)');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>server.close());
