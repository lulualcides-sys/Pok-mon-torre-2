'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const fsp=require('node:fs/promises');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg',
 '.webp':'image/webp','.ogg':'audio/ogg','.wav':'audio/wav'};
const server=http.createServer(async(req,res)=>{
 const raw=new URL(req.url||'/','http://127.0.0.1'),key=decodeURIComponent(raw.pathname);
 const file=path.resolve(root,'.'+(key.endsWith('/')?key+'index.html':key));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{const data=await fsp.readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(data);}
 catch{res.writeHead(404);res.end('missing '+key);}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(resolve=>server.listen(4292,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN,
  args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4292/arena2d/');
  await page.waitForFunction(()=>window.__pt2Started&&window.__pt2Game?.scene.isActive('titulo'),null,{timeout:45000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
   window.core=await import(new URL('./torre2/campaign-core.js',src));
   core.saveCampaign(core.createCampaign('bulbasaur'));
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'),null,{timeout:25000});
  const save=await page.evaluate(()=>localStorage.getItem(core.SAVE_KEY));
  await page.evaluate(()=>window.__pt2Game.scene.getScene('campanha').enterTraining(core.readCampaign()));
  await page.waitForFunction(()=>!!window.__pt2Game.scene.getScene('campanha').__labConfig,null,{timeout:25000});
  await page.evaluate(()=>{const c=window.__pt2Game.scene.getScene('campanha');Object.assign(c.__labConfig,{player:'bulbasaur',enemy:'onix',level:50,weather:'none'});c.enterTraining(core.readCampaign());});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const launch=await page.evaluate(()=>{const r=document.querySelector('canvas').getBoundingClientRect();return {x:r.x+r.width*.5,y:r.y+r.height*310/360}});
  await page.mouse.click(launch.x,launch.y);
  await page.waitForFunction(()=>{const b=window.__pt2Game.scene.getScene('combate');return b.scene.isActive()&&b.__torre2LabInstalled&&b.fase==='lucha'},null,{timeout:30000});
  await page.evaluate(()=>{const b=window.__pt2Game.scene.getScene('combate');b.controles.forEach(c=>c.leer=()=>null);});
  const ui=await page.evaluate(()=>{const r=document.querySelector('canvas').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}});
  await page.mouse.click(ui.x+ui.w*74/640,ui.y+ui.h*77/360);
  await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').__torre2ReaMathPreview?.active===true,null,{timeout:7000});
  await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').__torre2ReaMathPreview?.hitCount>=2,null,{timeout:16000});
  await page.screenshot({path:'test-evidence/rea-vetor-laboratorio-real.png'});
  const during=await page.evaluate(()=>{const b=window.__pt2Game.scene.getScene('combate');
   return {debug:{...b.__torre2ReaMathPreview},save:localStorage.getItem(core.SAVE_KEY),
    combatState:b.fase,frameErrors:b.erroresFotograma||0,renderer:window.__pt2Game.renderer.type};
  });
  assert.equal(during.save,save,'No campaign save writes allowed');
  assert.equal(during.debug.isolation,'LAB_VISUAL_ONLY');
  assert.ok(during.debug.hitCount>=2);
  assert.equal(during.frameErrors,0);
  await page.mouse.click(ui.x+ui.w*74/640,ui.y+ui.h*77/360);
  await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').__torre2ReaMathPreview?.active===false,null,{timeout:6000});
  assert.deepEqual(errors,[]);
  fs.writeFileSync('test-evidence/rea-vetor-laboratorio-metrics.json',JSON.stringify(during,null,2));
  console.log('PASS: opt-in vector lab impact, no save writes, real Phaser screenshot',during);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
