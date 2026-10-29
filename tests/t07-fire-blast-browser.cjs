'use strict';
// T07 Fire Blast: actual Phaser campaign touch cast in a prepared Charizard fixture.
// Party/species/level/stage are FIXTURES, not natural XP or won battles.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.ogg':'audio/ogg','.wav':'audio/wav','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1:4297');
 const file=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden');}
 try{const data=await fs.readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(data);}
 catch{res.writeHead(404);res.end('not found')}
});
(async()=>{
 await new Promise(ok=>server.listen(4297,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true,
  args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720},hasTouch:true,isMobile:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4297/arena2d/');
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:45000});
  await page.evaluate(async()=>{
   const url=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
   window.__core=await import(new URL('./torre2/campaign-core.js',url));
   window.__moves=await import(new URL('./torre2/move-pool.js',url));
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'),null,{timeout:20000});
  const checks=[];
  for(const {level,stage,move} of [
   {level:50,stage:7,move:'Fire Blast'}
  ]){
   await page.evaluate(({level,stage})=>{
    const state=window.__core.createCampaign('charmander');
    state.stage=stage;state.trainer=0;
    state.team[0].id='charizard';
    state.team[0].uid='fixture-charizard-'+level;
    state.team[0].progression.species='charizard';
    state.team[0].progression.level=level;
    state.dexSeen.push('charizard');state.dexCaught.push('charizard');
    if(!window.__moves.equipMove(state.team[0],2,'fire-blast'))
     throw Error('Charizard Lv50 could not equip native Fire Blast');
    window.__core.saveCampaign(state);
    window.__pt2Game.scene.getScene('campanha').enterBattle(state,false);
   },{level,stage});
   await page.waitForFunction(()=>{
    const g=window.__pt2Game,s=g.scene.getScene('combate');
    return g.scene.isActive('combate')&&s.__torre2PartyInstalled&&s.fase==='lucha'&&s.panelTactil;
   },null,{timeout:30000});
   const before=await page.evaluate(name=>{
    const s=window.__pt2Game.scene.getScene('combate'),a=s.luchadores[0];
    const slot=['lmb','rmb','q','e'].find(k=>a.kit[k]?.nombre===name);
    const entry=a.kit[slot];
    a.inmortal=true;s.luchadores[1].inmortal=true;
    s.controles[1].leer=()=>({mx:0,my:0,ax:a.x,ay:a.y});
    a.energia=100;a.ulti=100;a.cd[slot]=0;a.accion=null;a.animAccion=null;a.dash=null;
    a.est={};a.dolorHasta=-1;a.ko=false;
    return {name:entry?.nombre,forma:entry?.forma,locked:entry?.pendiente===true,
     slot,uses:a.stats.usosSlot?.[slot]||0,level:s.datos.torre2.playerLevel};
   },move);
   assert.equal(before.name,move,'Campaign not equipping native move at '+level);
   assert.ok(before.forma,'Missing native VFX for '+move);
   assert.equal(before.locked,false);
   assert.equal(before.level,level);
   await page.evaluate(slot=>{
    const p=window.__pt2Game.scene.getScene('combate').panelTactil,b=p.botones.find(x=>x.slot===slot);
    assertBrowser(Boolean(b),'No native touch control for '+slot);
    function assertBrowser(cond,message){if(!cond)throw Error(message)}
    const at=p.pos(b),zero=p.punto({x:0,y:0}),one=p.punto({x:1,y:1});
    p.abajo({id:71,x:(at.x-zero.x)/(one.x-zero.x),y:(at.y-zero.y)/(one.y-zero.y)});
    p.leer(x=>({ax:x.x,ay:x.y}));
   },before.slot);
   await page.waitForTimeout(430);
   const after=await page.evaluate(slot=>{
    const s=window.__pt2Game.scene.getScene('combate');
    s.panelTactil.arriba({id:71});
    return s.luchadores[0].stats.usosSlot?.[slot]||0;
   },before.slot);
   assert.ok(after>before.uses,move+' did not fire via real touch input');
   checks.push({species:'charizard',level,move,renderer:before.forma,touchCast:true});
   await page.evaluate(()=>window.__pt2Game.scene.getScene('combate').scene.start('campanha'));
   await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'),null,{timeout:20000});
  }
  assert.deepEqual(errors,[],'No uncaught Phaser errors');
  console.log('PASS_T07_CHARIZARD_FIRE_BLAST_NATIVE_TOUCH_FIXTURE',JSON.stringify(checks));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
