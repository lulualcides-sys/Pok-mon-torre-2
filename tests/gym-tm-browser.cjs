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
 await new Promise(r=>server.listen(4278,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:4278/arena2d/');
 await page.waitForFunction(()=>window.__pt2Started&&window.__pt2Game?.scene.isActive('titulo'),null,{timeout:45000});
 await page.evaluate(async()=>{
  const src=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
  window.core=await import(new URL('./torre2/campaign-core.js',src));
  core.saveCampaign(core.createCampaign('bulbasaur'));
  window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
 });
 await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'));


 // Migration fixture: already defeated Misty. No simulated normal victory.
 await page.evaluate(()=>{const s=core.createCampaign('squirtle');s.stage=2;s.badges=['Rocha','Cascata'];delete s.gymTMClaims;core.saveCampaign(s);window.fixture=core.readCampaign();window.__pt2Game.scene.getScene('campanha').bagScreen(fixture)});
 const rect=await page.evaluate(()=>{const r=document.querySelector('canvas').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}});
 await page.screenshot({path:'test-evidence/gym-tm-bag.png'});
 await page.mouse.click(rect.x+rect.w*144/640,rect.y+rect.h*302/360);
 await page.waitForFunction(()=>core.readCampaign().team[0].tmMoves?.includes('Water Pulse'));
 const result=await page.evaluate(async()=>{
  const s=core.readCampaign();const src=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
  const moves=await import(new URL('./torre2/move-pool.js',src));
  const move=moves.availableMoves(s.team[0]).find(m=>m.nombre==='Water Pulse');
  return {tms:s.inventory.tms,claims:s.gymTMClaims,learned:s.team[0].tmMoves,money:s.money,stage:s.stage,move:move?.nombre};
 });
 assert.deepEqual(result.tms,[]);assert.ok(result.claims.includes('tm-water-pulse'));
 assert.equal(result.move,'Water Pulse');assert.equal(result.money,1400);assert.equal(result.stage,2);
 await page.screenshot({path:'test-evidence/gym-tm-taught.png'});
 await page.reload();await page.waitForFunction(()=>window.__pt2Started&&window.__pt2Game?.scene.isActive('titulo'),null,{timeout:45000});
 const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('pokemon-torre-2-kanto-campaign-v1')));
 assert.deepEqual(restored.inventory.tms,[]);assert.ok(restored.team[0].tmMoves.includes('Water Pulse'));
 assert.deepEqual(errors,[]);console.log('PASS actual bag click teaches gym Water Pulse; no reward respawn on reload',result);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
