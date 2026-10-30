'use strict';
// Real Phaser/Chromium regression for the reported Deoxys screenshot.
// Native Poké Arena Pokémon must never be rendered with Kanto Struggle
// practice previews; power-up stages and Form Change stay untouched.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.css':'text/css',
 '.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1');
 const file=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const data=await fsp.readFile(file);
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});
  res.end(data);
 }catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(done=>server.listen(4618,'127.0.0.1',done));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4618/arena2d/?pantalla=pokedex',
   {waitUntil:'domcontentloaded',timeout:40000});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('pokedex'),null,{timeout:60000});
  const before=await page.evaluate(()=>{
   const p=window.__pt2Game.scene.getScene('pokedex');
   const i=p.casillas.findIndex(c=>c?.p?.id==='deoxys');
   if(i<0)return{deoxysFound:false};
   p.elegir(i);
   const kit=p.etapas[p.etapa]?.kit||{};
   const names=Object.fromEntries(['lmb','rmb','esp','q','e'].map(slot=>
    [slot,kit[slot]?.nombre||null]));
   const drawn=p.movs?.list?.filter(o=>typeof o.text==='string').map(o=>o.text)||[];
   return{deoxysFound:true,stageCount:p.etapas.length,names,drawn};
  });
  assert.equal(before.deoxysFound,true,'Native Poké Arena roster has no Deoxys');
  assert.equal(before.names.lmb,'Confusion');
  assert.equal(before.names.rmb,'Psychic');
  assert.equal(before.names.esp,'Teleport');
  assert.equal(before.names.q,'Form Change');
  assert.equal(before.names.e,'Psycho Boost');
  assert.ok(!JSON.stringify(before).includes('Struggle'),
   'Deoxys Pokédex still shows generic Struggle: '+JSON.stringify(before));
  assert.ok(before.drawn.some(t=>t.includes('Psycho Boost')),
   'Pokédex UI is not showing native Psycho Boost: '+JSON.stringify(before.drawn));
  await page.screenshot({path:'test-evidence/pokedex-deoxys-native-kits.png'});
  const overlay=await page.evaluate(()=>{
   const p=window.__pt2Game.scene.getScene('pokedex');
   const btn=p.children.list.find(o=>o.active&&o.text==='VER GOLPES');
   if(!btn)return{found:false};
   btn.emit('pointerdown');
   return{found:true,open:!!p.__kantoMovesOverlay,
    texts:p.children.list.filter(o=>o.active&&typeof o.text==='string').map(o=>o.text)};
  });
  assert.ok(overlay.found&&overlay.open,'Native moves overlay failed to open');
  for(const move of ['Confusion','Psychic','Teleport','Form Change','Psycho Boost'])
   assert.ok(overlay.texts.some(t=>t.toUpperCase().includes(move.toUpperCase())),
    'Original Deoxys move missing from overlay: '+move);
  assert.ok(!overlay.texts.some(t=>t.includes('Struggle')),
   'Native moves overlay contains invented Kanto training moves');
  await page.evaluate(()=>{
   const p=window.__pt2Game.scene.getScene('pokedex');
   p.__kantoMovesOverlay?.close();
   p.irEtapa(1);
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.getScene('pokedex').etapa===1,
   null,{timeout:18000});
  const second=await page.evaluate(()=>{
   const p=window.__pt2Game.scene.getScene('pokedex');
   const kit=p.etapas[p.etapa]?.kit||{};
   return{e:kit.e?.nombre,damage:kit.e?.dano,drawn:p.movs?.list?.filter(o=>typeof o.text==='string').map(o=>o.text)||[]};
  });
  assert.equal(second.e,'Psycho Boost');
  assert.ok(Number(second.damage)>0,'Power-up stage lost real Psycho Boost damage');
  assert.ok(!second.drawn.join('|').includes('Struggle'));
  assert.deepEqual(errors,[],'Runtime errors in original Deoxys Pokédex');
  console.log('PASS_DEOXYS_NATIVE_POKEDEX',JSON.stringify({
   slots:before.names,powerUp1:second.e,overlay:true,noStruggle:true}));
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>server.close());
