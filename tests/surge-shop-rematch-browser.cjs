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
  // The source client renders a 640x360 UI via a 2x camera. The previous
  // browser gate clicked before the newly created Phaser zone was registered.
  // Wait for native input readiness, never invoke a button callback directly.
  const mapPoint=await page.evaluate(()=>{
   const scene=__pt2Game.scene.getScene('campanha');
   const zone=scene.children.list.find(o=>o.active&&o.input?.enabled&&
    o.getData?.('torre2-rematch-map')===0);
   if(!zone)throw Error('Brock map zone not interactive');
   const rect=(document.querySelector('#juego canvas')||document.querySelector('canvas')).getBoundingClientRect();
   return {x:rect.left+zone.x*rect.width/640,
    y:rect.top+zone.y*rect.height/360,
    zone:{x:zone.x,y:zone.y,width:zone.width,height:zone.height}};
  });
  await page.mouse.move(mapPoint.x,mapPoint.y);
  // Phaser queues freshly created interactive zones until the next input
  // update. Wait for the REAL native hit-test instead of racing its queue.
  await page.waitForFunction(()=>{
   const scene=__pt2Game.scene.getScene('campanha');
   return scene.input.hitTestPointer(__pt2Game.input.activePointer).some(o=>
    o.active&&o.getData?.('torre2-rematch-map')===0);
  },null,{timeout:8000});
  const pointerTrace=await page.evaluate(()=>{
   const scene=__pt2Game.scene.getScene('campanha'),pointer=__pt2Game.input.activePointer;
   const world=scene.cameras.main.getWorldPoint(pointer.x,pointer.y);
   const label=o=>({x:o.x,y:o.y,width:o.width,height:o.height,depth:o.depth,
    type:o.type,tag:o.getData?.('torre2-rematch-map'),
    scene:o.scene?.sys?.settings?.key,active:o.active});
   const hits=typeof scene.input.hitTestPointer==='function'?
    scene.input.hitTestPointer(pointer).map(label):[];
   const bounds=scene.children.list.filter(o=>o.active&&o.input?.enabled&&
    o.getBounds?.().contains(world.x,world.y)).map(label);
   return {pointer:{x:pointer.x,y:pointer.y,worldX:world.x,worldY:world.y},
    hits,bounds,topOnly:scene.input.topOnly,
    activeScenes:__pt2Game.scene.getScenes(true).map(s=>s.sys.settings.key)};
  });
  console.log('VS SEEKER MAP0 HIT TEST',JSON.stringify({mapPoint,pointerTrace}));
  await page.mouse.click(mapPoint.x,mapPoint.y);
  try{
   await page.waitForFunction(()=>__pt2Game.scene.getScene('campanha').__torre2RematchAtlas?.mapStage===0,
    null,{timeout:5000});
  }catch(err){
   const info=await page.evaluate(()=>{
    const scene=__pt2Game.scene.getScene('campanha'),pointer=__pt2Game.input.activePointer;
    const world=pointer&&scene.cameras.main.getWorldPoint(pointer.x,pointer.y);
    return {selection:scene.__torre2RematchAtlas,
     pointer:pointer?{x:pointer.x,y:pointer.y,worldX:world?.x,worldY:world?.y}:null};
   });
   fs.mkdirSync('test-evidence',{recursive:true});
   await page.screenshot({path:'test-evidence/surge-map0-pointer-failure.png'});
   throw Error('Map0 native pointer miss '+JSON.stringify({mapPoint,pointerTrace,info})+' '+String(err));
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
    .map(o=>({id:o.getData('torre2-mart-item-sprite'),
      texture:o.texture?.key,
      source:scene.textures.get(o.texture.key)?.getSourceImage()?.src}));
   return {offer,icons};
  });
  assert.ok(mart.icons.length>0&&mart.icons.every(o=>o.texture==='torre2-mart-item-'+o.id),
   'Mart must render actual item texture sprites');
  console.log('MART FRLG ORIGINAL SOURCES',JSON.stringify(mart.icons));
  await page.screenshot({path:'test-evidence/mart-frlg-original-icons.png'});
  assert.ok(mart.icons.every(o=>o.source?.includes('/assets/ui/frlg/items/'+o.id+'.png')),
   'Visible Mart must use original FireRed PNGs, not generic graphics stencils');
  assert.ok(!mart.offer.includes('tm-giga-drain')&&!mart.offer.includes('tm-fire-blast'),
   'Shop must not expose unearned leader TMs');
  assert.deepEqual(errors,[],'No Phaser runtime error in maps or shop');
  fs.mkdirSync('test-evidence',{recursive:true});
  fs.writeFileSync('test-evidence/surge-mart-rematch-browser.json',JSON.stringify({selection,mart},null,2));
  console.log('PASS Kanto rematch atlas pointer and cached Mart item sprites on native Phaser');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
