'use strict';
const fs=require('node:fs'),fsp=require('node:fs/promises'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png','.avif':'image/avif','.webp':'image/webp','.css':'text/css'};
const server=http.createServer(async(req,res)=>{const key=new URL(req.url,'http://localhost').pathname;const file=path.resolve(root,'.'+(key.endsWith('/')?key+'index.html':key));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}try{const data=await fsp.readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(data)}catch{res.writeHead(404).end()}});
(async()=>{
 fs.mkdirSync('test-evidence/batch24',{recursive:true});await new Promise(r=>server.listen(4283,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
 const page=await browser.newPage({viewport:{width:980,height:650}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4283/arena2d/?original=1');
 await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
 const ids=await page.evaluate(async()=>{
  const entry=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
  const core=await import(new URL('./torre2/campaign-core.js',entry));
  const pool=await import(new URL('./torre2/move-pool.js',entry));
  window.batchRng=await import(new URL('./azar.js',entry));window.batchRng.sembrar(42);
  window.batch=await import(new URL('./torre2/batch24/catalog.js',entry));
  window.batchFX=await import(new URL('./torre2/batch24/runtime.js',entry));
  const dragon=pool.TEST_LIBRARY.filter(h=>h.nombre==='Dragon Pulse');
  if(dragon.length!==1||dragon[0].source!=='arena2d-original')
   throw Error('Dragon Pulse must reuse the original approved Poké Arena 2D move');
  if(window.batch.BATCH24_MOVES.length!==23)throw Error('Expected 23 new FX plus native Dragon Pulse');
  const state=core.createCampaign('bulbasaur');state.active=1;
  const duel=core.startBattle(state);duel.torre2Loadout=pool.resolveLoadout(state.team[1]);duel.mandos=['kbm','cpu'];
  window.__pt2Game.scene.getScene('titulo').scene.start('combate',duel);
  return window.batch.BATCH24_MOVES.map(h=>h.id);
 });
 await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').fase==='lucha',null,{timeout:45000});
 await page.waitForTimeout(1500); // Let the round title finish before freezing the fixture.
 await page.evaluate(()=>{const scene=window.__pt2Game.scene.getScene('combate');scene.scene.pause();window.batchBaseChildren=new Set(scene.children.list);});
 const report=[];
 for(const id of ids){
  const begin=await page.evaluate(id=>{
   const e=window.__pt2Game.scene.getScene('combate'),l=e.luchadores[0],r=e.luchadores[1];
   for(const effect of e.efectos)effect.destroy?.();e.efectos=[];
   for(const child of [...e.children.list]){
    if(!window.batchBaseChildren.has(child)&&child.type==='Text')child.destroy();
    child.killAll?.();
   }
   e.t+=4;
   l.x=270;l.y=240;l.hp=l.hpMax*.5;l.ko=false;l.est={};l.accion=null;
   // Isolate contact rendering from probability; metadata accuracy is tested separately.
   const h={...window.batch.BATCH24_MOVES.find(h=>h.id===id),precisao:100};
   Object.defineProperty(r,'tipos',{configurable:true,value:['NORMAL']});
   r.x=h.fazContato?345:405;r.y=240;r.hp=100000;r.ko=false;r.est={};r.accion=null;
   l.ax=r.x;l.ay=r.y;l.rival=r;r.rival=l;
   l.actualizarGraficos(0);r.actualizarGraficos(0);
   window.liveFX=window.batchFX.BATCH24_FORMS[h.forma](l,h,{slot:'q'});
   const n=h.fazContato?15:h.style==='earth'?28:17;
   for(let i=0;i<n;i++)window.liveFX.update(1/60);
   l.actualizarGraficos(0);r.actualizarGraficos(0);
   const label=e.add.text(22,35,h.nombre+'  ·  PIXEL ART / NEW',{fontSize:'13px',color:'#fff0ce',backgroundColor:'#172433',padding:{x:8,y:5}}).setDepth(99999);window.batchLabel=label;
   return {id,renderer:window.__pt2Game.renderer.type,children:e.children.list.length};
  },id);
  await page.waitForTimeout(90);
  await page.screenshot({path:'test-evidence/batch24/'+id+'.png'});
  const end=await page.evaluate(()=>{
   const e=window.__pt2Game.scene.getScene('combate'),l=e.luchadores[0],r=e.luchadores[1];
   for(let i=0;i<180;i++)window.liveFX.update(1/60);
   const result={damage:100000-r.hp,returned:Math.abs(l.x-270)<.001,disposed:!window.liveFX.g.scene};
   window.batchLabel.destroy();return result;
  });
  assert.equal(begin.renderer,2,'WebGL required');assert.ok(end.damage>0,id+' no real actor damage');assert.ok(end.returned,id+' failed retreat');assert.ok(end.disposed,id+' graphics leaked');
  report.push({...begin,...end});
 }
 assert.deepEqual(errors,[]);
 fs.writeFileSync('test-evidence/batch24/report.json',JSON.stringify({moves:report,errors},null,2));
 console.log('23 NEW Phaser/WebGL animations passed + 1 original Dragon Pulse preserved (24 requested moves).');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
