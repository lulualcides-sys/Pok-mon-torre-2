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
 await new Promise(r=>server.listen(4280,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:4280/arena2d/');
 await page.waitForFunction(()=>window.__pt2Started&&window.__pt2Game?.scene.isActive('titulo'),null,{timeout:45000});
 await page.evaluate(async()=>{
  const src=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
  window.core=await import(new URL('./torre2/campaign-core.js',src));
  core.saveCampaign(core.createCampaign('bulbasaur'));
  window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
 });
 await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'));



 await page.evaluate(()=>window.__pt2Game.scene.getScene('campanha').scene.start('preparar',{previo:{jugadores:['bulbasaur','porygon','psyduck','doduo','lickitung','dratini'].map((id,i)=>({id,disp:i?'cpu':'kbm'}))}}));
 await page.waitForFunction(()=>{const s=window.__pt2Game.scene.getScene('preparar');return s.scene.isActive()&&s.tarjetas?.every(t=>t.contenido?.list.some(o=>o.type==='Sprite'&&o.texture?.key.startsWith('pmd-')&&o.anims?.currentAnim))},null,{timeout:60000});
 await page.screenshot({path:'test-evidence/arena-six-previews.png'});
 const click=await page.evaluate(()=>{const s=window.__pt2Game.scene.getScene('preparar'),r=document.querySelector('canvas').getBoundingClientRect();return {x:r.x+s.posLuchar.x*r.width/640,y:r.y+s.posLuchar.y*r.height/360}});
 await page.mouse.click(click.x,click.y);
 await page.waitForFunction(()=>{const s=window.__pt2Game.scene.getScene('batalla');return s.scene.isActive()&&s.luchadores?.length===6&&s.luchadores.every(a=>a.spr?.texture?.key.startsWith('pmd-')&&Number.isFinite(a.x)&&Number.isFinite(a.y))},null,{timeout:45000});
 await page.screenshot({path:'test-evidence/arena-six-battle.png'});
 assert.deepEqual(errors,[]);console.log('PASS six Arena previews loaded with native sprites; visible Fight starts six-fighter battle');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
