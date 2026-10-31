'use strict';
const assert=require('node:assert/strict');
const http=require('node:http'),path=require('node:path'),fs=require('node:fs'),fsp=require('node:fs/promises');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url||'/','http://127.0.0.1');
 const f=path.resolve(root,'.'+(url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname));
 if(!f.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 try{const bytes=await fsp.readFile(f);res.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});res.end(bytes)}
 catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 await new Promise(ok=>server.listen(4478,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
   '--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:854,height:480},hasTouch:true,isMobile:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4478/arena2d/');
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
   const core=window.t24Core=await import(new URL('./torre2/campaign-core.js',src));
   const s=core.createCampaign('bulbasaur');s.stage=0;s.trainer=2;
   core.saveCampaign(s);window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha').__torre2BattlePath?.progress===2,
   null,{timeout:60000});
  const screen=async()=>page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   const node=c.children.list.find(o=>o.active&&o.getData?.('torre2-path-node')===2);
   const catchBadge=c.children.list.find(o=>o.active&&o.getData?.('torre2-path-capture')===2);
   if(!node||!catchBadge)throw Error('Native separate trainer/catch zones missing');
   return {node:{x:node.x,y:node.y,type:node.getData('torre2-path-type')},
    badge:{x:catchBadge.x,y:catchBadge.y},progress:c.__torre2BattlePath.progress};
  });
  const touch=async({x,y})=>{
   const p=await page.evaluate(({x,y})=>{
    const canvas=document.querySelector('#juego canvas')||document.querySelector('canvas');
    if(!canvas)throw Error('WebGL canvas missing');
    const q=canvas.getBoundingClientRect();
    return {x:q.left+x*q.width/640,y:q.top+y*q.height/360};
   },{x,y});
   await page.touchscreen.tap(p.x,p.y);
  };
  const before=await page.evaluate(()=>JSON.stringify(window.t24Core.readCampaign()));
  let ui=await screen();
  assert.equal(ui.node.type,'trainer');
  await touch(ui.badge);
  await page.waitForFunction(()=>!!window.__pt2Game.scene.getScene('campanha').__torre2GrassOverlay,
   null,{timeout:6000});
  assert.equal(await page.evaluate(()=>JSON.stringify(window.t24Core.readCampaign())),before,
   'Opening optional capture does not alter story/save');
  await touch({x:174,y:292});
  await page.waitForFunction(()=>!window.__pt2Game.scene.getScene('campanha').__torre2GrassOverlay);
  ui=await screen();
  await touch(ui.node);
  await page.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   const b=window.__pt2Game.scene.getScene('combate');
   return !!c.children.list.find(o=>o.active&&o.getData?.('torre2-versus-intro'))||
    b.scene.isActive();
  },null,{timeout:12000});
  assert.equal(window===undefined,false);
  assert.deepEqual(errors,[]);
  fs.mkdirSync('test-evidence',{recursive:true});
  await page.screenshot({path:'test-evidence/t24-native-route-mobile.png'});
  console.log('PASS native touch: optional catch opens without save mutation; trainer 3 starts VS/battle independently');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
