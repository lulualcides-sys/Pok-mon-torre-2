'use strict';
// Browser-level evidence for the real native Phaser VS Seeker and item sprites.
// Fixture jumps to an earned-badge checkpoint; not a naturally played journey.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const fsp=require('node:fs/promises');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.png':'image/png','.webp':'image/webp','.css':'text/css','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url||'/','http://127.0.0.1:4591');
 const file=path.resolve(root,'.'+(url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const data=await fsp.readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(data)}
 catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 await new Promise(ok=>server.listen(4591,'127.0.0.1',ok));
 const browser=await chromium.launch({
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
   '--use-gl=angle','--use-angle=swiftshader']
 });
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4591/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  await page.evaluate(async()=>{
   const main=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   window.__qaCore=await import(new URL('./torre2/campaign-core.js',main));
   const s=__qaCore.createCampaign('bulbasaur');
   s.stage=3;s.trainer=5;s.money=20000;
   s.badges=__qaCore.GYMS.slice(0,3).map(g=>g.badge);
   s.rematches={charge:3,sequence:0,wins:0,pending:null};
   __qaCore.saveCampaign(s);
   __pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha').__torre2BattlePath?.stage===3,
   null,{timeout:60000});
  const click=async(x,y)=>{
   const pos=await page.evaluate(([x,y])=>{
    const canvas=document.querySelector('#juego canvas')||document.querySelector('canvas');
    const q=canvas.getBoundingClientRect();
    return {x:q.left+x*q.width/640,y:q.top+y*q.height/360};
   },[x,y]);
   await page.mouse.click(pos.x,pos.y);
  };
  assert.equal(await page.evaluate(()=>__pt2Game.scene.getScene('campanha').children.list.some(o=>
   o.active&&o.getData?.('torre2-open-rematch-atlas'))),true);
  await click(424,103);
  await page.waitForFunction(()=>!!__pt2Game.scene.getScene('campanha').__torre2RematchAtlas,
   null,{timeout:10000});
  let selection=await page.evaluate(()=>{
   const s=__pt2Game.scene.getScene('campanha');
   return {maps:s.__torre2RematchAtlas.maps,
    controls:s.children.list.filter(o=>o.active&&o.getData?.('torre2-rematch-map')!==undefined)
      .map(o=>o.getData('torre2-rematch-map'))};
  });
  assert.ok(selection.maps.includes(0)&&selection.maps.includes(1)&&selection.maps.includes(2),
   'Earlier cities missing from rematch atlas');
  assert.ok(selection.controls.includes(0),'Brock map must be clickable');
  const positions=await page.evaluate(()=>{
   const scene=__pt2Game.scene.getScene('campanha');
   return scene.children.list.filter(o=>o.active&&o.input?.enabled).map(o=>({
    tag:o.getData?.('torre2-rematch-map'),x:o.x,y:o.y,depth:o.depth,
    width:o.width,height:o.height
   })).filter(o=>o.tag!==undefined||Math.abs(o.x-112)<100&&Math.abs(o.y-81)<25);
  });
  console.log('VS SEEKeR MAP POSITION TRACE',JSON.stringify(positions));
  await click(112,81);
  try{
   await page.waitForFunction(()=>__pt2Game.scene.getScene('campanha').__torre2RematchAtlas?.mapStage===0,
    null,{timeout:2200});
  }catch(err){
   const info=await page.evaluate(()=>{
    const scene=__pt2Game.scene.getScene('campanha');
    return {selection:scene.__torre2RematchAtlas,
     pointer:__pt2Game.input.activePointer?{x:__pt2Game.input.activePointer.x,y:__pt2Game.input.activePointer.y}:null};
   });
   throw Error('Map0 pointer miss '+JSON.stringify(info)+' '+String(err));
  }
  assert.ok(await page.evaluate(()=>__pt2Game.scene.getScene('campanha').children.list.some(o=>
   o.active&&o.getData?.('torre2-rematch-trainer')==='0:0')));
  const mart=await page.evaluate(()=>{
   const scene=__pt2Game.scene.getScene('campanha');
   const s=__qaCore.readCampaign();
   scene.martScreen(s);
   const offer=scene.children.list.filter(o=>o.active&&o.getData?.('torre2-mart-buy'))
    .map(o=>o.getData('torre2-mart-buy'));
   const icons=scene.children.list.filter(o=>o.active&&o.getData?.('torre2-mart-item-sprite'))
    .map(o=>({id:o.getData('torre2-mart-item-sprite'),texture:o.texture?.key}));
   return {offer,icons};
  });
  assert.ok(mart.icons.length>0&&mart.icons.every(o=>o.texture==='torre2-mart-item-'+o.id),
   'Mart must render actual item texture sprites');
  assert.ok(!mart.offer.includes('tm-giga-drain')&&!mart.offer.includes('tm-fire-blast'),
   'Shop must not expose unearned leader TMs');
  assert.deepEqual(errors,[],'No Phaser runtime error in maps or shop');
  fs.mkdirSync('test-evidence',{recursive:true});
  fs.writeFileSync('test-evidence/surge-mart-rematch-browser.json',JSON.stringify({selection,mart},null,2));
  console.log('PASS Kanto rematch atlas pointer and cached Mart item sprites on native Phaser');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
