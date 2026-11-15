'use strict';
// Real audited Alpha 0.71.3 browser: at most 25 Phaser card objects on
// screen, full logical roster preserved, mobile and desktop remain navigable.
// Record measurements; do not claim a performance gain without a baseline.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.css':'text/css','.woff2':'font/woff2'};
const server=http.createServer(async(req,res)=>{
 const name=new URL(req.url,'http://127.0.0.1:4418').pathname;
 const file=path.resolve(root,'.'+(name.endsWith('/')?name+'index.html':name));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end()}
 try{
  const data=await fs.readFile(file);
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});
  res.end(data);
 }catch{res.writeHead(404);res.end('not found')}
});
(async()=>{
 await fs.mkdir('test-evidence',{recursive:true});
 await new Promise(resolve=>server.listen(4418,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
   '--use-gl=angle','--use-angle=swiftshader']});
 const all=[];
 try{
  for(const mobile of [false,true]){
   const page=await browser.newPage({viewport:mobile?{width:740,height:414}:{width:1120,height:720},
    isMobile:mobile,hasTouch:mobile});
   const errors=[];page.on('pageerror',e=>errors.push(String(e)));
   await page.goto('http://127.0.0.1:4418/arena2d/?torre2-perf=1',
    {waitUntil:'domcontentloaded',timeout:45000});
   await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),
    null,{timeout:65000});
   await page.evaluate(()=>window.__pt2Game.scene.getScene('titulo').scene.start('pokedex'));
   await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('pokedex')&&
    window.__pt2Game.scene.getScene('pokedex')?.casillas?.length>25,
    null,{timeout:45000});
   const result=await page.evaluate(()=>{
    const s=window.__pt2Game.scene.getScene('pokedex');
    const report=()=>({total:s.casillas.length,objects:s.casillas.filter(c=>c.g&&c.img&&c.zone).length,
     mounted:s.__torre2MountedDexIndices?.length,page:s.dexPage,pages:Math.ceil(s.casillas.length/25),selected:s.foco,
     pendingIdle:s.__torre2DexIdleRequests?.size??0});
    const before=report();
    s.mover(30);
    const after=report();
    return {before,after};
   });
   assert.ok(result.before.total>25);
   for(const sample of [result.before,result.after]){
    assert.ok(sample.objects>0&&sample.objects<=25,'Too many live Phaser cards '+JSON.stringify(sample));
    assert.equal(sample.objects,sample.mounted);
    assert.ok(sample.pages>1);
   }
   assert.notEqual(result.before.page,result.after.page,'Page navigation did not virtualize');
   assert.equal(result.before.total,result.after.total,'Battle roster or logical card count changed');
   await page.waitForTimeout(1400);
   const metrics=await page.evaluate(()=>window.__torre2Perf?.snapshot()??null);
   assert.ok(metrics?.frames>0,'Real rAF telemetry must run when requested');
   assert.ok(metrics.resources>0);
   assert.deepEqual(errors,[],'Real native Pokédex or diagnostics raised JS exceptions');
   all.push({mobile,...result,metrics});
   await page.close();
  }
  await fs.writeFile('test-evidence/torre2-pokedex-performance-0713.json',
   JSON.stringify({release:'0.71.3',observations:all},null,2)+'\n');
  console.log('PASS_NATIVE_POKEDEX_25_CARD_WINDOW_AND_PERF',JSON.stringify(all));
 }finally{await browser.close();await new Promise(done=>server.close(done))}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
