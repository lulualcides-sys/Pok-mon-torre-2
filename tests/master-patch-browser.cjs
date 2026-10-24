'use strict';
// Browser smoke-test of the authorized original Poké Arena Phaser client,
// isolated at /arena2d/ from the Kanto campaign. Does not contact online services.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const fsp=require('node:fs/promises');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg',
 '.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.mp3':'audio/mpeg',
 '.ogg':'audio/ogg','.wav':'audio/wav'};
const server=http.createServer(async(req,res)=>{
 const requested=new URL(req.url||'/', 'http://127.0.0.1');
 let key=decodeURIComponent(requested.pathname);
 if(key.endsWith('/'))key+='index.html';
 const absolute=path.resolve(root,'.'+key);
 if(!absolute.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{
  const data=await fsp.readFile(absolute);
  res.writeHead(200,{'content-type':types[path.extname(absolute)]||'application/octet-stream'});
  res.end(data);
 }catch{res.writeHead(404);res.end('missing '+key);}
});

(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(r=>server.listen(4276,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:4276/arena2d/');
 await page.waitForFunction(()=>window.__pt2Started&&window.__pt2Game?.scene.isActive('titulo'),null,{timeout:45000});
 await page.evaluate(async()=>{
  const src=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
  window.core=await import(new URL('./torre2/campaign-core.js',src));
  core.saveCampaign(core.createCampaign('bulbasaur'));
  window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
 });
 await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'));
 const battle=async(wild=false,full=false)=>{
  await page.evaluate(({wild,full})=>{
   const s=core.readCampaign();s.team.forEach(m=>m.hp=100);s.inventory.pokeball=15;
   if(full)while(s.team.length<6)s.team.push({...s.team[0],uid:'test-'+s.team.length});
   core.saveCampaign(s);
   if(wild){s.pendingWild=null;core.startWildEncounter(s,()=>0);}
   window.__pt2Game.scene.getScene('campanha').enterBattle(s,wild);
  },{wild,full});
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('combate')&&window.__pt2Game.scene.getScene('combate').__torre2PartyInstalled,null,{timeout:20000});
  await page.evaluate(()=>{const b=window.__pt2Game.scene.getScene('combate');b.luchadores.forEach(a=>a.inmortal=true);});
  await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').fase==='lucha',null,{timeout:12000});
 };

 for(const species of ['raticate','nidoking','clefable','charmeleon','charizard','ivysaur','venusaur','wartortle','blastoise']){
  await page.evaluate(species=>{const s=core.readCampaign();s.team[0].id=species;s.team[0].progression.species=species;s.team[0].progression.level=40;s.active=0;core.saveCampaign(s)},species);
  await battle();
  await page.waitForTimeout(800);
  const state=await page.evaluate(()=>{const b=window.__pt2Game.scene.getScene('combate');return {fighters:b.luchadores.map(a=>({id:a.def.id,dex:a.dex,hp:a.hp,max:a.hpMax,x:a.x,y:a.y,alto:a.alto,scale:a.escala,texture:a.spr.texture.key})),cameras:b.cameras.cameras.map(c=>({zoom:c.zoom,x:c.scrollX,y:c.scrollY})),phase:b.fase}});
  console.log(species,JSON.stringify(state));
  await page.screenshot({path:'test-evidence/master-'+species+'.png'});
  assert.ok(state.cameras.every(c=>Number.isFinite(c.zoom)&&Number.isFinite(c.x)&&Number.isFinite(c.y)),species+' camera finite');
  assert.ok(state.fighters.every(a=>Number.isFinite(a.hp)&&Number.isFinite(a.max)&&Number.isFinite(a.alto)),species+' actor finite');
  await page.evaluate(()=>window.__pt2Game.scene.getScene('combate').scene.start('campanha'));
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'));
 }
 await page.evaluate(()=>window.__pt2Game.scene.getScene('campanha').scene.start('seleccion',{modo:'cpu'}));
 await page.waitForFunction(()=>window.__pt2Game.scene.isActive('seleccion'));
 const selection=await page.evaluate(()=>{const s=window.__pt2Game.scene.getScene('seleccion');return {y:s.posLuchar.y,pages:s.torre2Pages,visible:s.casillas.filter(c=>c.objects.some(o=>o.visible)).length}});
 assert.ok(selection.y<340,'FIGHT remains inside viewport');assert.ok(selection.pages>1);assert.ok(selection.visible<=28);
 await page.screenshot({path:'test-evidence/master-selection.png'});
 console.log('selection',selection);
 assert.deepEqual(errors,[]);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
