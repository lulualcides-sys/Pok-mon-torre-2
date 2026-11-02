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
 await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&window.__pt2Game.scene.getScene('campanha').__torre2BattlePath);
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));



 async function clickData(key,value){
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const p=await page.evaluate(([key,value])=>{
   const scene=window.__pt2Game.scene.getScene('campanha');const obj=scene.children.list.find(o=>o.getData?.(key)===value);
   if(!obj)throw new Error('Missing control '+key);
   const r=document.querySelector('canvas').getBoundingClientRect();return {x:r.x+r.width*obj.x/640,y:r.y+r.height*obj.y/360};
  },[key,value]);await page.mouse.click(p.x,p.y);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 }

 // Fixtures isolate item UI from the main save; all item use uses real clicks.
 for(const viewport of [{width:1280,height:720},{width:854,height:480}]){
  await page.setViewportSize(viewport);
  await page.evaluate(()=>{const s=core.createCampaign('squirtle');s.team[0].hp=100;s.team[0].status={kind:'veneno',toxic:true,elapsed:2};s.inventory.antidote=0;core.saveCampaign(s);window.__pt2Game.scene.getScene('campanha').martScreen(s)});
  await clickData('torre2-mart-buy','antidote');
  await clickData('torre2-mart-bag',true);
  await clickData('torre2-status-medicine-open',true);
  await page.screenshot({path:'test-evidence/status-medicine-'+viewport.width+'-before.png'});
  await clickData('torre2-status-medicine','antidote');
  const result=await page.evaluate(()=>{const s=core.readCampaign();return {status:s.team[0].status,hp:s.team[0].hp,count:s.inventory.antidote,money:s.money}});
  assert.deepEqual(result,{status:null,hp:100,count:0,money:1300});
  await clickData('torre2-status-medicine','antidote');
  assert.equal(await page.evaluate(()=>core.readCampaign().inventory.antidote),0);
  await page.screenshot({path:'test-evidence/status-medicine-'+viewport.width+'-after.png'});
  await clickData('torre2-status-medicine-back',true);
 }
 assert.deepEqual(errors,[]);console.log('PASS actual medicine clicks desktop/mobile, persisted cure, no duplicate consumption, return to bag');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
