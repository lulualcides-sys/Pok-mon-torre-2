'use strict';
// Real built Phaser Pokédex, actual family tabs, 25 cards/page.
// Source P2 Pokémon remain untouched; only UI family relations are grouped.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const fsp=require('node:fs/promises');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.png':'image/png','.webp':'image/webp','.css':'text/css','.svg':'image/svg+xml',
 '.woff2':'font/woff2','.ogg':'audio/ogg'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1');
 const filename=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!filename.startsWith(root+path.sep)){res.writeHead(403);return res.end('denied')}
 try{const data=await fsp.readFile(filename);
  res.writeHead(200,{'content-type':mime[path.extname(filename)]||'application/octet-stream'});
  res.end(data);
 }catch{res.writeHead(404);res.end('not found')}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(done=>server.listen(4384,'127.0.0.1',done));
 const browser=await chromium.launch({
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',error=>errors.push(String(error)));
  await page.goto('http://127.0.0.1:4384/arena2d/?pantalla=pokedex',
   {waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('pokedex'),
   null,{timeout:70000});
  const checked=await page.evaluate(()=>{
   const s=window.__pt2Game.scene.getScene('pokedex');
   const groups={},counts={cardCount:s.casillas.length,pages:s.dexPages};
   for(const baby of ['smoochum','elekid','magby','tyrogue']){
    const i=s.casillas.findIndex(c=>c.p?.id===baby);
    if(i<0){groups[baby]={error:'root not found'};continue}
    s.elegir(i);
    const visible=s.casillas.filter(c=>c.zone?.visible&&c.zone?.input?.enabled);
    groups[baby]={stages:(s.etapas||[]).map(x=>String(x.nombre||'').toLowerCase()),
     familyDescription:s.lema?.text||'',visibleCards:visible.length,
     selected:s.casillas[s.foco]?.p?.id||null,pages:s.dexPages};
   }
   return {counts,groups};
  });
  for(const [baby,members] of Object.entries({
   smoochum:['smoochum','jynx'],
   elekid:['elekid','electabuzz'],
   magby:['magby','magmar'],
   tyrogue:['tyrogue','hitmonlee','hitmonchan','hitmontop']
  })){
   const group=checked.groups[baby];
   assert.ok(group&&!group.error,'Missing family root '+baby);
   for(const id of members)
    assert.ok(group.stages.includes(id),baby+' must show '+id+' in evolution tabs');
   assert.ok(group.familyDescription.startsWith('FAMÍLIA · '),
    baby+' still says "Does not evolve"');
   assert.ok(group.visibleCards<=25&&group.visibleCards>0,
    baby+' shows duplicate or inaccessible family cards');
   assert.equal(group.selected,baby,'Dex did not switch to the family root');
  }
  assert.deepEqual(errors,[],'Original Phaser Pokédex generated JS exceptions');
  await page.screenshot({path:'test-evidence/pokedex-crossgen-families-mobile.png'});
  console.log('PASS_POKEDEX_REAL_FAMILY_TABS',JSON.stringify(checked));
 }finally{await browser.close();await new Promise(done=>server.close(done))}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
