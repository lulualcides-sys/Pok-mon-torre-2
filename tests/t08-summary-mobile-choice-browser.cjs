'use strict';
// Native Phaser touch test at Nidoran-m Lv11. Imported levels/save are test
// fixtures, not a claimed natural XP or a physical Android playthrough.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const http=require('node:http'),path=require('node:path');
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
 await new Promise(resolve=>server.listen(4579,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:854,height:480},hasTouch:true,isMobile:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4579/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   window.__sumCore=await import(new URL('./torre2/campaign-core.js',src));
   window.__sumMoves=await import(new URL('./torre2/move-pool.js',src));
   const s=__sumCore.createCampaign('squirtle');
   s.team[1]={id:'nidoran-m',progression:{species:'nidoran-m',level:11},
    uid:'mobile-summary-nidoran-m',hp:100,tmMoves:[]};
   __sumCore.saveCampaign(s);
   window.__sumState=s;
   __pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('campanha'),null,{timeout:60000});
  await page.evaluate(()=>{
   const c=__pt2Game.scene.getScene('campanha');
   c.summaryFilter='ALL';c.summarySearch='';c.showSummary(__sumState,1,0,0);
  });
  const snapshot=await page.evaluate(()=>{
   const c=__pt2Game.scene.getScene('campanha');
   const all=c.children.list.filter(o=>o.active&&o.type==='Text').map(o=>o.text);
   const label=all.find(t=>t.includes('BIBLIOTECA'))||'';
   return {shield:!!c.children.list.find(o=>o.active&&
    o.getData?.('torre2-summary-input-shield')),label,
    hasTraining:all.some(t=>/Treino/i.test(t)),
    hasMove:!!c.children.list.find(o=>o.active&&o.input?.enabled&&
     o.getData?.('torre2-equip-move')==='poison-sting')};
  });
  assert.ok(snapshot.shield,'Summary has no pointer shield');
  assert.equal(snapshot.hasTraining,false,'Training clones still shown to user');
  assert.ok(snapshot.hasMove,'Genuine Nidoran-m Poison Sting missing from mobile summary');
  const locate=async(key)=>page.evaluate(id=>{
   const c=__pt2Game.scene.getScene('campanha');
   const target=c.children.list.find(o=>o.active&&o.input?.enabled&&
    o.getData?.('torre2-equip-move')===id);
   if(!target)throw Error('Touch target missing '+id);
   const canvas=document.querySelector('#juego canvas')||document.querySelector('canvas');
   const r=canvas.getBoundingClientRect();
   return {x:r.left+target.x*r.width/640,y:r.top+target.y*r.height/360};
  },key);
  const pos=await locate('poison-sting');
  await page.touchscreen.tap(pos.x,pos.y);
  await page.waitForFunction(()=>{
   const s=window.__sumCore.readCampaign();
   return s?.team?.[1]?.moves?.[0]==='poison-sting';
  },null,{timeout:13000});
  const saved=await page.evaluate(()=>({
   selected:__sumState.team[1].moves[0],
   persisted:__sumCore.readCampaign().team[1].moves[0],
   active:__pt2Game.scene.isActive('campanha')
  }));
  assert.equal(saved.selected,'poison-sting');
  assert.equal(saved.persisted,'poison-sting');
  assert.equal(saved.active,true);
  // Simulate an accidentally active title scene below the mobile summary.
  // Its original fullscreen zone overlaps the old Back region near x=615.
  await page.evaluate(()=>{
   const game=__pt2Game;
   game.scene.launch('titulo');
  });
  await page.waitForFunction(()=>__pt2Game.scene.isActive('titulo'),null,{timeout:10000});
  await page.evaluate(()=>{
   const c=__pt2Game.scene.getScene('campanha');
   const title=__pt2Game.scene.getScene('titulo');
   const fullscreen=title.children.list.find(o=>o.input?.enabled&&
    Math.abs(o.x-624)<1&&Math.abs(o.y-16)<1);
   if(!fullscreen)throw Error('Original underlying fullscreen hitbox missing');
   window.__underlyingFullscreenHits=0;
   fullscreen.removeAllListeners('pointerdown');
   fullscreen.on('pointerdown',()=>window.__underlyingFullscreenHits++);
   c.showSummary(__sumState,1,0,0);
  });
  const tap=async(x,y)=>page.evaluate(([xx,yy])=>{
   const canvas=document.querySelector('#juego canvas')||document.querySelector('canvas');
   const r=canvas.getBoundingClientRect();
   return {x:r.left+xx*r.width/640,y:r.top+yy*r.height/360};
  },[x,y]);
  const over=await tap(615,22); // exactly the old fullscreen touch zone
  await page.touchscreen.tap(over.x,over.y);
  assert.equal(await page.evaluate(()=>window.__underlyingFullscreenHits),0,
   'Summary leaked a pointer to the underlying fullscreen button');
  const back=await tap(550,24);
  await page.touchscreen.tap(back.x,back.y);
  await page.waitForFunction(()=>{
   const c=__pt2Game.scene.getScene('campanha');
   return c.scene.isActive()&&!c.children.list.some(o=>o.active&&
    o.getData?.('torre2-summary-input-shield')===true);
  },null,{timeout:13000});
  assert.equal(await page.evaluate(()=>window.__underlyingFullscreenHits),0,
   'Summary Back triggered the original fullscreen action underneath');
  assert.deepEqual(errors,[],'Native Phaser errors during real mobile touch');
  await page.screenshot({path:'test-evidence/t08-mobile-summary-real-nidoran-touch.png'});
  console.log('PASS_T08_REAL_SUMMARY_TOUCH',JSON.stringify({
   species:'nidoran-m',level:11,equipped:'poison-sting',
   saved:true,fullscreenLeaks:0,trainingLabels:false
  }));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
