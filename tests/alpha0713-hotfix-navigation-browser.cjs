'use strict';
// Verifies the actual audited 0.71.3 menu, not the obsolete 0.65.8
// family selector internals. Native Phaser must boot, and PLAY/League/Local/
// Arena/Kanto remain navigable after deleting only NEWS.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.css':'text/css',
 '.woff2':'font/woff2','.ogg':'audio/ogg'};
const server=http.createServer(async(req,res)=>{
 const name=new URL(req.url,'http://127.0.0.1:4417').pathname;
 const file=path.resolve(root,'.'+(name.endsWith('/')?name+'index.html':name));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end()}
 try{const data=await fs.readFile(file);
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});
  res.end(data);
 }catch{res.writeHead(404);res.end('not found')}
});
(async()=>{
 await new Promise(resolve=>server.listen(4417,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
   '--use-gl=angle','--use-angle=swiftshader']});
 try{
  const v=JSON.parse(await fs.readFile(path.join(root,'arena2d/version.json'),'utf8'));
  assert.equal(v.src,'src-5ccc174cb8');
  for(const mobile of [false,true]){
   const page=await browser.newPage({viewport:mobile?{width:740,height:414}:{width:1000,height:650},
    isMobile:mobile,hasTouch:mobile});
   const errors=[];page.on('pageerror',error=>errors.push(String(error)));
   await page.goto('http://127.0.0.1:4417/arena2d/?original=1',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),
    null,{timeout:55000});
   const result=await page.evaluate(()=>{
    const scene=window.__pt2Game.scene.getScene('titulo');
    const read=()=>scene.botones.map(b=>({
     id:String(b.o?.id??b.id??'').toLowerCase(),
     name:String(b.o?.txt??b.txt??'').toUpperCase()}));
    const main=read();
    scene.abrirMenu('jugar');
    const play=read();
    scene.abrirMenu('principal');
    return {main,play,restored:scene.menu,
     manifest:!!scene.registry.get('manifiesto')};
   });
   assert.equal(result.restored,'principal');
   assert.equal(result.manifest,true);
   for(const id of ['jugar','pokedex','ajustes'])
    assert.ok(result.main.some(x=>x.id===id),'Missing approved main action '+id);
   for(const id of ['kanto','liga','cpu','arena'])
    assert.ok(result.play.some(x=>x.id===id),'Missing approved 0.71.3 PLAY action '+id);
   assert.ok(!result.main.concat(result.play).some(x=>
    x.id==='news'||x.name==='NEWS'||x.id==='versus'||x.id==='entreno'),
    'Deleted NEWS, old TRAINING or unavailable multiplayer unexpectedly present');
   assert.deepEqual(errors,[],'Real native Phaser menu generated JavaScript exceptions');
   console.log('PASS_ALPHA0713_NAVIGATION',JSON.stringify({mobile,
    main:result.main.map(x=>x.id),play:result.play.map(x=>x.id)}));
   await page.close();
  }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
