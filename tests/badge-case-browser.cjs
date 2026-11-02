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



 // Isolated completed-gym fixture: exercises UI, never claims a normal playthrough.
 await page.evaluate(()=>{const s=core.createCampaign('squirtle');s.stage=8;s.badges=core.GYMS.map(g=>g.badge);core.saveCampaign(s);window.fixture=core.readCampaign();window.before=localStorage.getItem('pokemon-torre-2-kanto-campaign-v1');window.__pt2Game.scene.getScene('campanha').renderCampaign(fixture)});
 async function clickData(key,value){
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const p=await page.evaluate(([key,value])=>{
   const scene=window.__pt2Game.scene.getScene('campanha');const obj=scene.children.list.find(o=>o.getData?.(key)===value);
   if(!obj)throw new Error('Missing control '+key);
   const r=document.querySelector('canvas').getBoundingClientRect();return {x:r.x+r.width*obj.x/640,y:r.y+r.height*obj.y/360};
  },[key,value]);await page.mouse.click(p.x,p.y);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 }
 await clickData('torre2-badge-case-open',true);
 await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha').__torre2BadgeCase?.selected===0);
 const sprites=await page.evaluate(()=>window.__pt2Game.scene.getScene('campanha').children.list.filter(o=>o.getData?.('torre2-badge-sprite')!==undefined).map(o=>({index:o.getData('torre2-badge-sprite'),key:o.texture.key,frame:Number(o.frame.name),w:o.frame.width,h:o.frame.height})));
 assert.deepEqual(sprites,Array.from({length:8},(_,index)=>({index,key:'torre2-frlg-badges',frame:index,w:16,h:16})));
 for(let i=0;i<8;i++){
  await clickData('torre2-badge-index',i);
  const result=await page.evaluate(()=>{const scene=window.__pt2Game.scene.getScene('campanha');return {view:scene.__torre2BadgeCase,text:scene.children.list.filter(o=>typeof o.text==='string').map(o=>o.text).join(' | '),unchanged:before===localStorage.getItem('pokemon-torre-2-kanto-campaign-v1')};});
  assert.equal(result.view.selected,i);assert.equal(result.view.earned,true,JSON.stringify({i,result}));assert.equal(result.view.claimed,i!==4);assert.equal(result.unchanged,true);
  assert.ok(result.text.includes(['Brock','Misty','Lt. Surge','Erika','Koga','Sabrina','Blaine','Giovanni'][i]));
  assert.ok(result.text.includes(['ROCK TOMB','WATER PULSE','SHOCK WAVE','GIGA DRAIN','TOXIC','CALM MIND','FIRE BLAST','EARTHQUAKE'][i]));
  if(i===4)assert.ok(result.text.includes('INDISPONÍVEL NESTA VERSÃO'));
 }
 await page.screenshot({path:'test-evidence/badge-case-desktop.png'});
 await clickData('torre2-badge-case-back',true);
 assert.equal(await page.evaluate(()=>before===localStorage.getItem('pokemon-torre-2-kanto-campaign-v1')),true);
 await page.setViewportSize({width:854,height:480});
 await page.evaluate(()=>{fixture.badges=['Rocha'];fixture.gymTMClaims=['tm-rock-tomb'];window.__pt2Game.scene.getScene('campanha').renderCampaign(fixture)});
 await clickData('torre2-badge-case-open',true);
 await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha').children.list.some(o=>o.getData?.('torre2-badge-index')===7));
 await clickData('torre2-badge-index',7);
 assert.equal(await page.evaluate(()=>window.__pt2Game.scene.getScene('campanha').__torre2BadgeCase.earned),false);
 await page.screenshot({path:'test-evidence/badge-case-mobile.png'});
 await clickData('torre2-badge-case-back',true);
 assert.deepEqual(errors,[]);console.log('PASS eight selectable badges, reward details, mobile back, locked state, no save mutations');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
