'use strict';
/* Native Phaser touchscreen: future move LEVELS are readable, paginated and
 * read-only, with no click-through, wrong-slots or save mutation.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises'),http=require('node:http'),path=require('node:path');
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
 await new Promise(resolve=>server.listen(4598,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:854,height:480},hasTouch:true,isMobile:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4598/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   window.__futureCore=await import(new URL('./torre2/campaign-core.js',src));
   window.__futureMoves=await import(new URL('./torre2/move-pool.js',src));
   window.__futureState=__futureCore.createPlayerCampaign('squirtle');
   __futureCore.saveCampaign(__futureState);
   __pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('campanha'),null,{timeout:60000});
  await page.evaluate(()=>{
   const c=__pt2Game.scene.getScene('campanha');
   c.summaryView='moves';c.summaryFilter='ALL';c.summarySearch='';
   c.showSummary(__futureState,0,3,0);
   window.__futureSaveBefore=JSON.stringify(__futureCore.readCampaign());
  });
  const tap=async(x,y)=>{const target=await page.evaluate(([xx,yy])=>{
   const canvas=document.querySelector('#juego canvas')||document.querySelector('canvas');
   const r=canvas.getBoundingClientRect();
   return {x:r.left+xx*r.width/640,y:r.top+yy*r.height/360};
  },[x,y]);await page.touchscreen.tap(target.x,target.y);};
  const getRows=()=>page.evaluate(()=>{
   const c=__pt2Game.scene.getScene('campanha');
   return c.children.list.filter(o=>o.active&&o.getData?.('torre2-summary-upcoming-move'))
    .map(o=>({id:o.getData('torre2-summary-upcoming-move'),
      level:o.getData('torre2-summary-upcoming-level')}));
  });
  const toggle=async()=>{const point=await page.evaluate(()=>{
   const c=__pt2Game.scene.getScene('campanha');
   const o=c.children.list.find(o=>o.active&&o.input?.enabled&&
    o.getData?.('torre2-summary-future-toggle'));
   if(!o)throw Error('No level toggle in actual Phaser summary');
   return [o.x,o.y];
  });await tap(...point)};
  await toggle();
  let first=await getRows();
  assert.equal(first.length,6,'First future level page must list six rows');
  const expected=await page.evaluate(()=>__futureMoves.upcomingCampaignMoves(__futureState.team[0])
   .map(row=>({id:row.id,level:row.level})));
  assert.deepEqual(first,expected.slice(0,6),'Future page differs from actual battle unlocks');
  assert.ok(expected.some(row=>row.id==='hydro-pump'&&row.level===47),
   'Late Hydro Pump missing from future list');
  const texts=await page.evaluate(()=>__pt2Game.scene.getScene('campanha').children.list
   .filter(o=>o.active&&o.type==='Text').map(o=>o.text));
  assert.ok(texts.includes('PRÓXIMOS'),'Missing visible future header');
  assert.ok(texts.some(t=>t.includes('NV 08')&&t.includes('HYDRO PUMP')),
   'Lv8 energy-gated ULT not visible');
  assert.ok(!texts.some(t=>t.includes('ENSINAR TM')),'Future view must not advertise TM as XP unlock');
  await tap(328,237); // read-only future row, must not equip anything
  await tap(470,329); // next built-in pagination button
  const second=await getRows();
  assert.deepEqual(second,expected.slice(6,12),'Next future page lost levels/order');
  assert.notDeepEqual(second,first,'Next page still shows first six entries');
  const after=await page.evaluate(()=>JSON.stringify(__futureCore.readCampaign()));
  assert.equal(after,await page.evaluate(()=>__futureSaveBefore),
   'Viewing or tapping the future list unexpectedly saved/changed campaign');
  await toggle();
  const returned=await page.evaluate(()=>{
   const c=__pt2Game.scene.getScene('campanha');
   return {hasMovePicker:c.children.list.some(o=>o.active&&o.type==='Text'&&o.text==='BIBLIOTECA'),
    futureRows:c.children.list.filter(o=>o.active&&o.getData?.('torre2-summary-upcoming-move')).length,
    hasEquipped:c.children.list.some(o=>o.active&&o.getData?.('torre2-equip-move'))};
  });
  assert.ok(returned.hasMovePicker&&returned.hasEquipped,'Could not return to the real move editor');
  assert.equal(returned.futureRows,0,'Read-only upcoming rows leaked into editor');
  assert.deepEqual(errors,[],'Browser error during future toggle/page touch');
  await page.screenshot({path:'test-evidence/t08-mobile-upcoming-levels-squirtle.png'});
  console.log('PASS_T08_SUMMARY_UPCOMING_MOBILE',JSON.stringify({
   species:'squirtle',level:5,expectedRows:expected.length,
   firstPage:first,secondPage:second,paginated:true,readonly:true,returnedToEquip:true
  }));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
