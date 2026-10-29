'use strict';
/* Real mobile Chromium tap checks: Arena-style slots, explicit invalid
 * selection, manual E equip, Equipe back without a Phaser scene restart.
 * Test save fixtures do not prove a naturally played campaign or Android.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1');
 const file=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const data=await fsp.readFile(file);
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});
  res.end(data);
 }catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(resolve=>server.listen(4587,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:854,height:480},hasTouch:true,isMobile:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4587/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   window.__roleCore=await import(new URL('./torre2/campaign-core.js',src));
   window.__rolePool=await import(new URL('./torre2/move-pool.js',src));
   const s=__roleCore.createCampaign('squirtle');
   s.team[1]={id:'ivysaur',uid:'role-ivysaur',hp:100,tmMoves:[],
    progression:{species:'ivysaur',level:16}};
   s.team[2]={id:'nidoran-f',uid:'role-nidoran-f',hp:100,tmMoves:[],
    progression:{species:'nidoran-f',level:13}};
   __roleCore.saveCampaign(s);
   window.__roleState=s;
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('campanha'),null,{timeout:60000});
  await page.evaluate(()=>{
   const game=__pt2Game,c=game.scene.getScene('campanha');
   // Recreate the exact old title-scene overlap on mobile before opening.
   c.scene.launch('titulo');
   c.showSummary(__roleState,1,1,0);
   window.__roleCanvas=document.querySelector('#juego canvas')||document.querySelector('canvas');
  });
  const base=await page.evaluate(()=>({
   titleStillActive:__pt2Game.scene.isActive('titulo'),
   available:__rolePool.availableMoves(__roleState.team[1]).map(m=>m.id),
   unapprovedNormal:['lmb','rmb','q'].some(slot=>
    __rolePool.isCampaignUltimateOnlyMove(
     __rolePool.resolveLoadout(__roleState.team[1])[slot])),
   fullscreen:!!document.fullscreenElement
  }));
  assert.equal(base.titleStillActive,false,'Underlying fullscreen scene was not stopped');
  assert.equal(base.unapprovedNormal,false,'An ULT-only move is still in LMB/HAB');
  const locate=async id=>page.evaluate(key=>{
   const c=__pt2Game.scene.getScene('campanha');
   const target=c.children.list.find(o=>o.active&&o.input?.enabled&&
    o.getData?.('torre2-equip-move')===key);
   if(!target)return null;
   const rect=__roleCanvas.getBoundingClientRect();
   return {x:rect.left+target.x*rect.width/640,
    y:rect.top+target.y*rect.height/360,
    reason:target.getData('torre2-equip-reason')};
  },id);
  const findPage=async(id,slot)=>{
   for(let p=0;p<15;p++){
    await page.evaluate(([nextSlot,nextPage])=>
     __pt2Game.scene.getScene('campanha').showSummary(__roleState,1,nextSlot,nextPage),
     [slot,p]);
    const found=await locate(id);
    if(found)return found;
   }
   return null;
  };
  const strong=base.available.find(x=>x.startsWith('torre2-intro-e-'));
  assert.ok(strong,'Ivysaur ULT preview unavailable in move library');
  const incompatible=await findPage(strong,1);
  assert.ok(incompatible?.reason?.includes('ULT'),
   'Strong preview appeared selectable on HAB2 '+JSON.stringify(incompatible));
  await page.touchscreen.tap(incompatible.x,incompatible.y);
  const redirected=await page.evaluate(()=>{
   const c=__pt2Game.scene.getScene('campanha');
   const texts=c.children.list.filter(o=>o.active&&o.type==='Text').map(o=>o.text);
   return {warning:texts.find(x=>x.includes('GOLPE FORTE'))||'',
    unchanged:__roleState.team[1].moves?.[3]||null};
  });
  assert.ok(redirected.warning.includes('ULT'),'No role guidance on wrong-slot tap');
  const compatible=await findPage(strong,3);
  assert.ok(compatible&&!compatible.reason,'ULT preview not selectable in E');
  await page.touchscreen.tap(compatible.x,compatible.y);
  const saved=await page.evaluate(()=>({
   equipped:__roleState.team[1].moves?.[3],
   persisted:__roleCore.readCampaign().team[1].moves?.[3]
  }));
  assert.equal(saved.equipped,strong);
  assert.equal(saved.persisted,strong);
  await page.evaluate(()=>__pt2Game.scene.getScene('campanha').showSummary(__roleState,1,3,0));
  const back=await page.evaluate(()=>{
   const c=__pt2Game.scene.getScene('campanha');
   const bg=c.children.list.find(o=>o.active&&o.input?.enabled&&
    o.getData?.('torre2-summary-back')===true);
   if(!bg)throw Error('No Equipe navigation control');
   const rect=__roleCanvas.getBoundingClientRect();
   return {x:rect.left+bg.x*rect.width/640,y:rect.top+bg.y*rect.height/360};
  });
  await page.touchscreen.tap(back.x,back.y);
  const after=await page.evaluate(()=>({
   sameCanvas:__roleCanvas.isConnected&&
    __roleCanvas===(document.querySelector('#juego canvas')||document.querySelector('canvas')),
   campaign:__pt2Game.scene.isActive('campanha'),
   title:__pt2Game.scene.isActive('titulo'),
   shield:__pt2Game.scene.getScene('campanha').children.list.some(o=>
    o.active&&o.getData?.('torre2-summary-input-shield')),
   fullscreen:!!document.fullscreenElement,
   persisted:__roleCore.readCampaign().team[1].moves?.[3]
  }));
  assert.equal(after.sameCanvas,true,'Equipe back replaced fullscreen canvas');
  assert.equal(after.shield,false,'Equipe back failed to return to map');
  assert.equal(after.campaign,true,'Campaign stopped on Equipe back');
  assert.equal(after.title,false,'Fullscreen title scene reopened on Equipe back');
  assert.equal(after.fullscreen,base.fullscreen,'Equipe back changed browser fullscreen');
  assert.equal(after.persisted,strong,'Equipe back lost selected ultimate');
  assert.deepEqual(errors,[],'Browser page errors');
  await page.screenshot({path:'test-evidence/t08-arena-roles-mobile-back.png'});
  console.log('PASS_T08_ARENA_ROLES_MOBILE',JSON.stringify({
   ivysaurLevel:16,forbiddenHAB:incompatible.reason,
   redirectedToUlt:true,saved:true,
   fullscreenPreserved:true,sameCanvas:true,pageErrors:errors.length
  }));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
