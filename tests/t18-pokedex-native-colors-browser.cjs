'use strict';
/* T18: open the REAL Phaser Pokédex after upstream removed TIPOS.
 * A failing load is a runtime regression, not a screenshot substitute.
 */
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
 await new Promise(done=>server.listen(4595,'127.0.0.1',done));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:980,height:650},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4595/arena2d/?pantalla=pokedex',
   {waitUntil:'domcontentloaded',timeout:40000});
  try{
   await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('pokedex'),null,{timeout:60000});
  }catch(error){
   const diag=await page.evaluate(()=>({
    started:window.__pt2Started,phaser:typeof Phaser,
    active:window.__pt2Game?.scene.getScenes(true)?.map(s=>s.scene.key),
    hasCanvas:!!document.querySelector('#juego canvas')}));
   console.error('T18_POKEDEX_RUNTIME_DIAG',JSON.stringify({diag,errors}));
   await page.screenshot({path:'test-evidence/t18-pokedex-open-failure.png'});
   throw error;
  }
  const state=await page.evaluate(()=>{
   const scene=window.__pt2Game.scene.getScene('pokedex');
   return {cardCount:scene.casillas?.length??0,
    painted:scene.casillas?.filter(c=>c?.g?.active&&c?.img?.active).length??0,
    baseDex:scene.casillas?.[0]?.p?.dex,
    types:scene.casillas?.[0]?.p?.tipos,
    active:scene.scene.isActive()};
  });
  assert.equal(state.active,true);
  assert.ok(state.cardCount>=36&&state.painted>=36,
   'Native Pokédex must draw 36+ type-striped animated cards: '+JSON.stringify(state));
  assert.ok(state.types?.length,'Original dex type metadata was lost');
  assert.ok(!errors.some(x=>/TIPOS is not defined/.test(x)),
   'Native upstream removed TIPOS and crashed card painting: '+errors.join('; '));
  await page.screenshot({path:'test-evidence/t18-pokedex-native-type-cards.png'});
  await page.evaluate(()=>{
   const p=window.__pt2Game.scene.getScene('pokedex');
   p.irEtapa(1);
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.getScene('pokedex').etapa===1,
   null,{timeout:20000});
  assert.deepEqual(errors,[],'Native Phaser errors while navigating Pokédex');
  console.log('PASS_T18_POKEDEX_NATIVE_TYPE_PALETTE',JSON.stringify({
   cards:state.cardCount,painted:state.painted,
   nativeScene:true,evolutionTab:true,noMissingTIPOS:true
  }));
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>server.close());
