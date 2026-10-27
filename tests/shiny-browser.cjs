'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const fsp=require('node:fs/promises');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml',
 '.webmanifest':'application/manifest+json','.mp3':'audio/mpeg','.ogg':'audio/ogg'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1'),p=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!p.startsWith(root+path.sep)){res.writeHead(403);return res.end('blocked');}
 try{const data=await fsp.readFile(p);res.writeHead(200,{'content-type':types[path.extname(p)]||'application/octet-stream'});res.end(data);}
 catch{res.writeHead(404);res.end('missing');}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(r=>server.listen(4292,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true,
  args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
  page.on('pageerror',err=>errors.push(String(err)));
  await page.goto('http://127.0.0.1:4292/arena2d/');
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:45000});
  await page.evaluate(async()=>{
   const main=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
   window.shinyCore=await import(new URL('./torre2/campaign-core.js',main));
   const s=shinyCore.createCampaign('bulbasaur');
   const sequence=[.5,.001];const encounter=shinyCore.startWildEncounter(s,()=>sequence.shift());
   if(!encounter.ok||!encounter.encounter.shiny)throw Error('Expected deterministic 1% test Shiny');
   const battle=shinyCore.startWildBattle(s);
   if(!battle.torre2.shiny)throw Error('Wild shiny metadata not passed to Phaser battle');
   const captured=shinyCore.attemptCapture(s,()=>0,'pokeball',{duringBattle:true,hpPercent:1});
   if(!captured.ok||!captured.pokemon.shiny)throw Error('Shiny capture did not persist');
   shinyCore.saveCampaign(s);
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,{timeout:30000});
  const captured=await page.evaluate(()=>{
   const s=shinyCore.readCampaign();
   return {team:s.team.find(x=>x.shiny)?.id,seen:s.dexShinySeen,caught:s.dexShinyCaught};
  });
  assert.ok(captured.team);
  assert.ok(captured.caught.includes(captured.team));
  await page.evaluate(()=>{
   const s=shinyCore.readCampaign();const i=s.team.findIndex(x=>x.shiny);
   window.__pt2Game.scene.getScene('campanha').showSummary(s,i);
  });
  let text=await page.evaluate(()=>window.__pt2Game.scene.getScene('campanha').children.list.filter(x=>typeof x.text==='string').map(x=>x.text).join(' | '));
  assert.ok(text.includes('SHINY'),'Phaser Summary must mark Shiny');
  await page.screenshot({path:'test-evidence/shiny-summary-desktop.png'});
  await page.evaluate(()=>{
   const s=shinyCore.readCampaign(),i=s.team.findIndex(x=>x.shiny);
   shinyCore.storePokemon(s,i);
   window.__pt2Game.scene.getScene('campanha').pcScreen(s);
  });
  text=await page.evaluate(()=>window.__pt2Game.scene.getScene('campanha').children.list.filter(x=>typeof x.text==='string').map(x=>x.text).join(' | '));
  assert.ok(text.includes('✦'),'PC should identify the exact Shiny individual');
  await page.screenshot({path:'test-evidence/shiny-pc-desktop.png'});
  await page.evaluate(()=>{
   const s=shinyCore.readCampaign(),sc=window.__pt2Game.scene.getScene('campanha');
   sc.dexPage=0;sc.dexScreen(s);
  });
  // Every caught Pokemon exists somewhere on seven pages. Inspect the record page.
  const shinyRecord=await page.evaluate(()=>{
   const s=shinyCore.readCampaign(),sc=window.__pt2Game.scene.getScene('campanha');
   const index=shinyCore.KANTO_DEX.findIndex(x=>x.toLowerCase()===s.dexShinyCaught[0]);
   if(index<0)throw Error('Shiny caught species absent from Kanto Dex');
   sc.dexPage=Math.floor(index/22);sc.dexScreen(s);
   return sc.children.list.filter(x=>typeof x.text==='string').map(x=>x.text).join(' | ');
  });
  assert.ok(shinyRecord.includes('SHINY'),'Kanto Dex must distinguish Shiny caught');
  await page.setViewportSize({width:854,height:480});
  await page.screenshot({path:'test-evidence/shiny-pokedex-mobile.png'});
  await page.reload();
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:45000});
  const retained=await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
   const core=await import(new URL('./torre2/campaign-core.js',src));
   const s=core.readCampaign();
   return {box:s.box.filter(p=>p.shiny).length,records:s.dexShinyCaught.length};
  });
  assert.equal(retained.box,1);assert.ok(retained.records>=1);
  assert.deepEqual(errors,[],'No Phaser JS errors');
  console.log('PASS real Phaser shiny UI, 1% encounter, PC, Dex, mobile, save and reload');
 }finally{await browser.close();server.close();}
})().catch(err=>{console.error(err);server.close();process.exitCode=1});
