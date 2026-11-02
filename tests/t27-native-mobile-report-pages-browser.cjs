'use strict';
// T27 native Phaser battle-report UI with MANY rewards. Input and presentation
// only: reward snapshots are synthetic fixtures; NO wins, money, badge or TM
// are granted to a player or written to the real campaign save.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1');
 const file=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const bytes=await fsp.readFile(file);res.writeHead(200,
  {'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(bytes)}
 catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(ok=>server.listen(4489,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 let page;
 try{
  page=await browser.newPage({viewport:{width:854,height:480},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const touch=async(x,y)=>{
   const pos=await page.evaluate(([x,y])=>{
    const c=document.querySelector('#juego canvas')||document.querySelector('canvas');
    const q=c.getBoundingClientRect();
    return {x:q.left+x*q.width/640,y:q.top+y*q.height/360};
   },[x,y]);
   assert.ok(pos.x>=0&&pos.x<=854&&pos.y>=0&&pos.y<=480);
   await page.touchscreen.tap(pos.x,pos.y);
  };
  await page.goto('http://127.0.0.1:4489/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  await page.evaluate(async()=>{
   const main=[...document.scripts].find(x=>x.src?.includes('/main.js')).src;
   window.t27Core=await import(new URL('./torre2/campaign-core.js',main));
   window.t27Reports=await import(new URL('./torre2/battle-report.js',main));
   t27Core.saveCampaign(t27Core.createCampaign('bulbasaur'));
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
   !!window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,null,{timeout:60000});
  const beforeSave=await page.evaluate(()=>localStorage.getItem(window.t27Core.SAVE_KEY));
  const fixture=await page.evaluate(()=>{
   const base=t27Core.readCampaign();
   const before=structuredClone(base),after=structuredClone(base);
   after.team[0].id='ivysaur';after.team[0].progression.species='ivysaur';
   after.team[0].progression.level=16;
   after.money=before.money+1200;
   after.wins=before.wins+1;
   after.badges=[...before.badges,'Rocha'];
   after.gymTMClaims=[...(before.gymTMClaims||[]),'tm-rock-tomb'];
   const reward=t27Reports.makeBattleReport(before,after,{
    won:true,message:'Vitória de teste — resultados não salvos',
    sharedExp:[{uid:before.team[0].uid,reward:275,index:0},
     {uid:before.team[1].uid,reward:0,index:1,tester:true}]
   },{
    tmNames:{'tm-rock-tomb':'TM39 Rock Tomb'},
    listMoves:m=>m.id==='ivysaur'?['Vine Whip','Razor Leaf']:['Vine Whip']
   });
   const scene=window.__pt2Game.scene.getScene('campanha');
   window.t27Overlay=t27Reports.showBattleReport(scene,reward);
   if(!window.t27Overlay)throw Error('Native battle report overlay missing');
   const info=()=>scene.children.list.filter(x=>x.active&&typeof x.text==='string')
    .map(x=>x.text);
   return {title:reward.title,money:reward.money,extras:{
    evolves:reward.evolutions,moves:reward.moves,badges:reward.badges,
    tms:reward.tms},lines:info()};
  });
  assert.equal(fixture.title,'VITÓRIA!');
  assert.equal(fixture.money,1200);
  assert.equal(fixture.extras.evolves.length,1);
  assert.equal(fixture.extras.moves.length,1);
  assert.equal(fixture.extras.badges.length,1);
  assert.equal(fixture.extras.tms.length,1);
  assert.ok(fixture.lines.some(s=>s.includes('IVYSAUR')));
  assert.ok(fixture.lines.some(s=>s.includes('IVYSAUR: NOVO GOLPE · RAZOR LEAF')),
   'The native mobile report must name the move recipient, not just the attack');
  const beforeReportPage=fixture.lines.join(' | ');
  await page.screenshot({path:'test-evidence/t27-mobile-battle-report-page1.png'});
  await touch(570,280);
  const nextLines=await page.evaluate(()=>window.__pt2Game.scene.getScene('campanha')
   .children.list.filter(x=>x.active&&typeof x.text==='string').map(x=>x.text));
  const afterReportPage=nextLines.join(' | ');
  assert.ok(afterReportPage.includes('INSÍGNIA: ROCHA'),'Badge hidden behind first report page');
  assert.ok(afterReportPage.includes('TM: TM39 ROCK TOMB'),'TM hidden behind first report page');
  assert.notEqual(afterReportPage,beforeReportPage,'Report page-next did nothing');
  assert.equal(await page.evaluate(()=>localStorage.getItem(t27Core.SAVE_KEY)),beforeSave,
   'Reading battle rewards changed actual campaign save');
  await page.screenshot({path:'test-evidence/t27-mobile-battle-report-page2.png'});
  await touch(320,319);
  const closed=await page.evaluate(()=>{
   const scene=window.__pt2Game.scene.getScene('campanha');
   return {stillCampaign:scene.scene.isActive(),
    combat:window.__pt2Game.scene.isActive('combate'),
    reportButton:window.t27Overlay.button.active,
    blocker:window.t27Overlay.blocker.active,
    remaining:scene.children.list.filter(x=>x.active&&
     (x.getData?.('torre2-report-continue')===true||
      x.getData?.('torre2-report-blocker')===true)).length,
    save:localStorage.getItem(t27Core.SAVE_KEY)};
  });
  assert.equal(closed.stillCampaign,true);
  assert.equal(closed.combat,false,'Underlying battle CTA triggered through report');
  assert.equal(closed.reportButton,false);
  assert.equal(closed.blocker,false);
  assert.equal(closed.remaining,0,'Orphan report controls after dismissal');
  assert.equal(closed.save,beforeSave);
  assert.deepEqual(errors,[],'Phaser JS errors while paging through results');
  fs.writeFileSync('test-evidence/t27-native-report-pages.json',JSON.stringify({
   scope:'T27 read-only Phaser mobile report pagination and touch capture',
   fixture:'Invented before/after reward snapshots for UI inspection only; never saved',
   beforeReportPage,afterReportPage,closed:{...closed,saveUnchanged:true,save:undefined}
  },null,2));
  console.log('T27 NATIVE MOBILE REPORT PAGING PASS',
   JSON.stringify({pages:2,extras:4,underlyingBattleBlocked:true,
    saveUnchanged:true,orphans:closed.remaining}));
 }finally{
  try{if(page&&!page.isClosed())await page.close();}
  finally{await browser.close();await new Promise(done=>server.close(done));}
 }
})().catch(e=>{console.error(e);process.exitCode=1;if(server.listening)server.close()});
