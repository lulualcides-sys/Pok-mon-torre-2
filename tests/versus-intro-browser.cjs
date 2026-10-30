'use strict';
// Validate the VS animation in actual 640x360 Phaser/Chromium before publishing.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const path=require('node:path'),http=require('node:http'),{chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg',
 '.woff2':'font/woff2','.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url||'/','http://127.0.0.1');
 const file=path.resolve(root,'.'+(url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{
  const body=await fsp.readFile(file);
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});
  res.end(body);
 }catch{res.writeHead(404);res.end('not found')}
});
(async()=>{
 fs.mkdirSync('test-evidence/versus-intro',{recursive:true});
 await new Promise(done=>server.listen(4327,'127.0.0.1',done));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4327/arena2d/?original=1',
   {waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),
   null,{timeout:45000});
  await page.evaluate(async()=>{
   const main=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=await import(new URL('./torre2/campaign-core.js',main));
   const state=core.createPlayerCampaign('bulbasaur');
   core.saveCampaign(state);
   window.__vsTestCore=core;
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>{
   const s=window.__pt2Game.scene.getScene('campanha');
   return s.scene.isActive()&&s.__torre2BattlePath?.stage===0;
  },null,{timeout:45000});
  const button=await page.evaluate(()=>{
   const scene=window.__pt2Game.scene.getScene('campanha');
   const cta=scene.children.list.find(o=>o.input?.enabled&&
    o.getData?.('torre2-central-cta'));
   if(!cta)throw Error('Campaign CTA missing');
   const r=document.querySelector('#juego canvas').getBoundingClientRect();
   return{x:r.x+cta.x*r.width/640,y:r.y+cta.y*r.height/360};
  });
  await page.mouse.click(button.x,button.y);
  await page.waitForFunction(()=>{
   const s=window.__pt2Game.scene.getScene('campanha');
   return !!s.children.list.find(o=>o.getData?.('torre2-versus-intro')&&o.active);
  },null,{timeout:8000});
  const vs=await page.evaluate(()=>{
   const scene=window.__pt2Game.scene.getScene('campanha');
   const overlay=scene.children.list.find(o=>o.getData?.('torre2-versus-intro'));
   const titles=overlay.list.filter(o=>typeof o.text==='string').map(o=>o.text);
   const balls=overlay.list.filter(o=>o.getData?.('torre2-original-ball-sprite'));
   const state=window.__vsTestCore.readCampaign();
   return{titles,balls:balls.length,trainer:state.trainer,
    sprites:overlay.list.filter(o=>o.texture?.key?.startsWith('frlg-npc-'))
     .map(o=>o.texture.key)};
  });
  assert.ok(vs.titles.includes('VOCÊ'),'Player label');
  assert.ok(vs.titles.includes('TREINADOR 1'),'Opponent label');
  assert.ok(vs.titles.includes('VS'),'VS visible');
  assert.ok(vs.sprites.includes('frlg-npc-red_normal'),'Player art');
  assert.ok(vs.sprites.length===2,'Opponent art');
  assert.equal(vs.balls,2,'One ball per actual member on each team');
  assert.equal(vs.trainer,0,'Animation does not advance campaign save');
  await page.screenshot({path:'test-evidence/versus-intro/versus-first-trainer.png'});
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.datos?.torre2?.kind==='trainer';
  },null,{timeout:45000});
  const combat=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return{p1:b.datos.p1,p2:b.datos.p2,
    trainer:window.__vsTestCore.readCampaign().trainer};
  });
  assert.equal(combat.p1,'bulbasaur');
  assert.equal(combat.p2,'pidgey');
  assert.equal(combat.trainer,0);
  assert.deepEqual(errors,[],'No runtime page errors');
  fs.writeFileSync('test-evidence/versus-intro/result.json',
   JSON.stringify({vs,combat,errors,method:'Real browser CTA → visible VS → native battle'},null,2));
  console.log('Phaser VS intro validated:',JSON.stringify({vs,combat}));
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>server.close());
