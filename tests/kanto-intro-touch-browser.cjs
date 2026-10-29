'use strict';
// Touch the REAL controls in the ACTUAL Kanto campaign, from the normal Lv5
// starter save (not a test arena with levels or moves pre-unlocked).
const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.ogg':'audio/ogg','.wav':'audio/wav','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1:4298'),abs=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!abs.startsWith(root+path.sep)){res.writeHead(403);return res.end('denied');}
 try{const buf=await fs.readFile(abs);res.writeHead(200,{'content-type':mime[path.extname(abs)]||'application/octet-stream'});res.end(buf)}
 catch{res.writeHead(404);res.end('not found')}
});
(async()=>{
 await new Promise(ok=>server.listen(4298,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720},hasTouch:true,isMobile:true}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4298/arena2d/');
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:45000});
  await page.evaluate(async()=>{
   const main=[...document.scripts].find(x=>x.src.includes('/main.js')).src;
   window.core=await import(new URL('./torre2/campaign-core.js',main));
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  // In a new game, first select a real Kanto starter and enter first battle.
  const results=[];
  for(const species of ['bulbasaur','charmander','squirtle','ponyta']){
   for(const level of [5,7,8]){
    await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'),null,{timeout:18000});
    await page.evaluate(({species,level})=>{
     const s=window.core.createCampaign(species==='ponyta'?'squirtle':species);
     // Ponyta is a controlled Lv5 party fixture, not a fourth canonical
     // starter. The battle and touch inputs remain real Phaser/WebGL.
     if(species==='ponyta'){
      s.team[0].id='ponyta';
      s.team[0].progression.species='ponyta';
     }
     s.team[0].progression.level=level;
     window.core.saveCampaign(s);
     window.__pt2Game.scene.getScene('campanha').enterBattle(s,false);
    },{species,level});
    await page.waitForFunction(()=>{const g=window.__pt2Game,b=g.scene.getScene('combate');return g.scene.isActive('combate')&&b.__torre2PartyInstalled&&b.fase==='lucha'&&b.panelTactil},null,{timeout:25000});
    const snap=await page.evaluate(()=>{
     const b=window.__pt2Game.scene.getScene('combate'),me=b.luchadores[0];
     me.inmortal=true;b.luchadores[1].inmortal=true;
     b.controles[1].leer=()=>({mx:0,my:0,ax:me.x,ay:me.y});
     return {level:b.datos.torre2.playerLevel,slots:Object.fromEntries(['lmb','rmb','q','e'].map(k=>[k,{name:me.kit[k]?.nombre,dano:me.kit[k]?.dano,locked:me.kit[k]?.pendiente,ulti:me.kit[k]?.ulti}])),buttons:b.panelTactil.botones.map(x=>x.slot)};
    });
    console.log('KANTO_REAL_START',species,level,JSON.stringify(snap));
    assert.equal(snap.level,level);
    for(const slot of ['lmb','rmb','q']){
     assert.ok(snap.slots[slot].name&&snap.slots[slot].name!=='LOCKED',species+' '+level+' missing '+slot);
     assert.equal(snap.slots[slot].locked,false,species+' '+level+' pending '+slot);
    }
    if(species==='ponyta'&&level===5){
     const names=['lmb','rmb','q'].map(slot=>snap.slots[slot].name);
     assert.ok(names.includes('Tackle'),'Verified Ponyta Tackle not present in real Phaser battle');
     assert.ok(names.includes('Ember'),'Existing weak Ponyta Ember preview lost');
     assert.ok(names.includes('Quick Attack'),'Existing Ponyta Quick Attack lost');
     assert.ok(!names.some(name=>/^Struggle/.test(name)),'Ponyta still has a Struggle filler');
    }
    if(level<8)assert.ok(!snap.slots.e.name||snap.slots.e.locked||snap.slots.e.name==='LOCKED',species+' ULT active before 8');
    else assert.ok(snap.slots.e.ulti,species+' Lv8 ULT missing');
    if(level===5||level===8)for(const slot of level===5?['lmb','rmb','q']:['e']){
     const before=await page.evaluate(k=>{
      const b=window.__pt2Game.scene.getScene('combate'),a=b.luchadores[0];
      a.energia=100;a.ulti=100;a.cd[k]=0;a.accion=null;a.animAccion=null;a.dash=null;
      a.est={};a.dolorHasta=-1;a.ko=false;b.fase='lucha';
      return a.stats.usosSlot?.[k]||0;
     },slot);
     await page.evaluate(k=>{
      const panel=window.__pt2Game.scene.getScene('combate').panelTactil,button=panel.botones.find(x=>x.slot===k);
      if(!button)throw Error('No touch button for '+k);
      const xy=panel.pos(button),zero=panel.punto({x:0,y:0}),one=panel.punto({x:1,y:1});
      panel.abajo({id:77,x:(xy.x-zero.x)/(one.x-zero.x),y:(xy.y-zero.y)/(one.y-zero.y)});
      panel.leer(p=>({ax:p.x,ay:p.y}));
     },slot);
     await page.waitForTimeout(360);
     const after=await page.evaluate(k=>{
      const b=window.__pt2Game.scene.getScene('combate');
      b.panelTactil.arriba({id:77});
      return b.luchadores[0].stats.usosSlot?.[k]||0;
     },slot);
     assert.ok(after>before,species+' '+level+' '+slot+' did not execute using mobile button');
     results.push({species,level,slot,cast:true});
    }
    await page.evaluate(()=>window.__pt2Game.scene.getScene('combate').scene.start('campanha'));
   }
  }
  assert.deepEqual(errors,[],'Phaser uncaught exceptions');
  assert.equal(results.length,16);
  console.log('PASS_KANTO_REAL_TOUCH',JSON.stringify(results));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
