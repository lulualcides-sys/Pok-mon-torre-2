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
 await new Promise(r=>server.listen(4279,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:4279/arena2d/');
 await page.waitForFunction(()=>window.__pt2Started&&window.__pt2Game?.scene.isActive('titulo'),null,{timeout:45000});
 await page.evaluate(async()=>{
  const src=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
  window.core=await import(new URL('./torre2/campaign-core.js',src));
  core.saveCampaign(core.createCampaign('bulbasaur'));
  window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
 });
 await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'));


 // T82: stage-one map now opens the approved Route 3 first. Use REAL
 // Phaser clicks to leave that map, open VS Seeker and select trainer #1.
 // Never synthesize a 'pointerdown' event or bypass the visible UI.
 await page.evaluate(()=>{const s=core.readCampaign();s.stage=1;s.trainer=3;s.badges=['Rocha'];s.rematches={charge:3,sequence:0,wins:0,pending:null};core.saveCampaign(s);window.__pt2Game.scene.getScene('campanha').scene.restart();});
 await page.waitForFunction(()=>{
  const c=window.__pt2Game.scene.getScene('campanha');
  return c.scene.isActive()&&c.__torre2ApprovedMapView?.id==='route-3';
 },null,{timeout:60000});
 const clickTagged=async(tag,value)=>{
  const pos=await page.evaluate(([tag,expected])=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   const zone=c.children.list.find(o=>o.active&&o.input?.enabled&&
    o.getData?.(tag)===expected);
   if(!zone)throw Error('T82 interactive Phaser control missing: '+tag+':'+expected);
   const canvas=document.querySelector('#juego canvas');
   if(!canvas)throw Error('T82 Phaser canvas missing');
   const r=canvas.getBoundingClientRect();
   const w=Math.min(r.width,r.height*640/360),h=Math.min(r.height,r.width*360/640);
   return {x:r.x+(r.width-w)/2+zone.x/640*w,
    y:r.y+(r.height-h)/2+zone.y/360*h};
  },[tag,value]);
  await page.mouse.click(pos.x,pos.y);
 };
 await clickTagged('torre2-approved-exit',true);
 await page.waitForFunction(()=>{
  const c=window.__pt2Game.scene.getScene('campanha');
  return c.__torre2BattlePath?.progress===3&&c.children.list.some(o=>
   o.active&&o.getData?.('torre2-open-rematch-atlas')===true);
 },null,{timeout:20000});
 await clickTagged('torre2-open-rematch-atlas',true);
 await page.waitForFunction(()=>{
  const c=window.__pt2Game.scene.getScene('campanha');
  return c.__torre2RematchAtlas?.mapStage===1&&c.children.list.some(o=>
   o.active&&o.getData?.('torre2-rematch-trainer')==='1:0');
 },null,{timeout:20000});
 await clickTagged('torre2-rematch-trainer','1:0');
 await page.waitForFunction(()=>{
  const c=window.__pt2Game.scene.getScene('campanha');
  return c.children.list.some(o=>o.active&&typeof o.text==='string'&&
   o.text.startsWith('REVANCHE ·'));
 },null,{timeout:12000});
 const before=await page.evaluate(()=>{const s=core.readCampaign();return {money:s.money,stage:s.stage,trainer:s.trainer,badges:s.badges,tms:s.inventory.tms}});
 await page.screenshot({path:'test-evidence/rematch-offer.png'});
 // Native REVANCHE button is centered at Phaser (320,235).
 const b=await page.evaluate(()=>document.querySelector('#juego canvas').getBoundingClientRect().toJSON());
 await page.mouse.click(b.x+b.width/2,b.y+b.height*235/360);
 await page.waitForFunction(()=>{const b=window.__pt2Game.scene.getScene('combate');return b.scene.isActive()&&b.__torre2PartyInstalled&&b.fase==='lucha'&&b.datos.torre2.kind==='rematch'},null,{timeout:30000});
 const battle=await page.evaluate(()=>{const b=window.__pt2Game.scene.getScene('combate');window.ticket=b.datos.torre2.ticket;return {level:b.datos.torre2.enemyLevel,cap:b.datos.torre2.hardCap,charge:core.readCampaign().rematches.charge}});
 assert.equal(battle.charge,0);assert.ok(battle.level<=battle.cap);
 await page.screenshot({path:'test-evidence/rematch-battle.png'});
 // Debug KO accelerates outcome validation; this is not a normal played win.
 await page.evaluate(()=>{const b=window.__pt2Game.scene.getScene('combate');b.luchadores[1].hp=0;b.alKO(b.luchadores[1]);});
 await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'),null,{timeout:30000});
 const after=await page.evaluate(()=>{const s=core.readCampaign(),money=s.money;const duplicate=core.resolveRematch(s,window.ticket,true);return {money,duplicate:duplicate.ok,stage:s.stage,trainer:s.trainer,badges:s.badges,tms:s.inventory.tms,charge:s.rematches.charge,message:s.lastMessage}});
 assert.equal(after.money,before.money+120);assert.equal(after.stage,before.stage);assert.equal(after.trainer,before.trainer);assert.deepEqual(after.badges,before.badges);assert.deepEqual(after.tms,before.tms);assert.equal(after.duplicate,false);assert.equal(after.charge,0);
 assert.deepEqual(errors,[]);console.log('PASS real rematch UI, battle, debug-KO result, money/XP and no duplicated progression',battle,after);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
