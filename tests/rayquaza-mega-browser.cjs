'use strict';
// Actual Chromium battle: choose Rayquaza, start offline fight and Mega-evolve.
// Requires a completed capture/build in _site/arena2d; never contacts online play.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.png':'image/png','.jpg':'image/jpeg','.css':'text/css','.webp':'image/webp'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1');
 const f=path.resolve(root,'.'+url.pathname+(url.pathname.endsWith('/')?'index.html':''));
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{const b=await fs.readFile(f);res.writeHead(200,{'content-type':mime[path.extname(f)]||'application/octet-stream'}).end(b)}
 catch{res.writeHead(404).end('not found')}
});
(async()=>{
 await new Promise(done=>server.listen(4287,'127.0.0.1',done));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:1000,height:700}});
 const errors=[],missing=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('response',r=>{if(r.status()>=400&&/0384|\\.js/.test(r.url()))missing.push(r.url())});
 try{
  await page.goto('http://127.0.0.1:4287/arena2d/?original=1',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>window.__pt2Started===true&&!!window.__pt2Game,null,{timeout:60000});
  await page.evaluate(()=>window.__pt2Game.scene.start('seleccion',{previo:{modo:'cpu',p1:'rayquaza'}}));
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('seleccion')&&
   window.__pt2Game.scene.getScene('seleccion').casillas?.some(c=>c.p.id==='rayquaza'),
   null,{timeout:30000});
  const selected=await page.evaluate(()=>{
   const scene=window.__pt2Game.scene.getScene('seleccion');
   const rayIndex=scene.casillas.findIndex(c=>c.p.id==='rayquaza');
   const ray=scene.casillas[rayIndex];
   if(ray.bloqueado)throw Error('Rayquaza shows as locked in the playable selection');
   scene.elegir(rayIndex);
   const foe=scene.casillas.findIndex(c=>c.p.id==='charmander');
   if(foe<0)throw Error('Training opponent missing');
   scene.elegir(foe);
   const choice=[...scene.eleccion];scene.empezar();
   return{ray:ray.p.id,choice};
  });
  assert.equal(selected.ray,'rayquaza');
  assert.equal(selected.choice[0],'rayquaza');
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('combate')&&
   window.__pt2Game.scene.getScene('combate').luchadores?.length===2,
   null,{timeout:45000});
  const normal=await page.evaluate(()=>{
   const l=window.__pt2Game.scene.getScene('combate').luchadores[0];
   return{id:l.def.id,dex:l.dex,skills:[l.kit.lmb?.nombre,l.kit.rmb?.nombre,l.kit.e?.nombre]};
  });
  assert.equal(normal.id,'rayquaza');
  assert.ok(normal.dex.startsWith('0384'));
  assert.deepEqual(normal.skills,['Dragon Claw','Twister','Dragon Ascent']);
  await page.evaluate(async()=>{
   const game=window.__pt2Game,scene=game.scene.getScene('combate'),l=scene.luchadores[0];
   l.etapa=l.def.evoluciones.length;
   l.cambiarForma(l.dexActual);
   l.kit=l.kitActual();
   const v=await fetch('arena2d/version.json').then(r=>r.json());
   const {megaevolucionar}=await import('/arena2d/'+v.modules+'/habilidades.js');
   if(!l.forma.mega||l.forma.mega.dex!=='0384-0001')throw Error('Mega definition absent');
   megaevolucionar(l);
  });
  await page.waitForFunction(()=>{
   const l=window.__pt2Game?.scene?.getScene('combate')?.luchadores?.[0];
   return l?.mega&&l.dex.startsWith('0384-0001')&&l.kit.rmb?.nombre==='Hurricane';
  },null,{timeout:12000});
  const mega=await page.evaluate(()=>{
   const l=window.__pt2Game.scene.getScene('combate').luchadores[0];
   return{mega:l.mega,dex:l.dex,skill:l.kit.rmb?.nombre,spriteReady:!!l.spr?.visible};
  });
  await fs.mkdir('test-evidence',{recursive:true});
  await page.screenshot({path:'test-evidence/rayquaza-mega-real-phaser.png',fullPage:true});
  assert.equal(mega.mega,true);
  assert.equal(mega.skill,'Hurricane');
  assert.deepEqual(missing,[],'Missing game assets: '+JSON.stringify(missing));
  assert.deepEqual(errors,[],'Runtime errors: '+JSON.stringify(errors));
  console.log('REAL PHASER RAYQUAZA + MEGA BATTLE PASS',JSON.stringify({selected,normal,mega}));
 }finally{
  await browser.close();await new Promise(done=>server.close(done));
 }
})().catch(err=>{console.error(err);process.exitCode=1});
