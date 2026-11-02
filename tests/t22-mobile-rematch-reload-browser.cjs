'use strict';
// T22 mobile real VS Seeker UI, interrupted rematch, restart, no duplicate
// tickets, money, badge, TM or campaign progress. Fixture: unlocked trainer
// and three recharges, NOT naturally earned Brock journey or rematch victory.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url||'/','http://127.0.0.1');
 const file=path.resolve(root,'.'+(url.pathname.endsWith('/')?
  url.pathname+'index.html':url.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const bytes=await fsp.readFile(file);res.writeHead(200,
  {'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(bytes)}
 catch{res.writeHead(404);res.end('not found')}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(ok=>server.listen(4474,'127.0.0.1',ok));
 const browser=await chromium.launch({
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']
 });
 try{
  const page=await browser.newPage({
   viewport:{width:854,height:480},hasTouch:true,isMobile:true
  }),errors=[];
  page.on('pageerror',err=>errors.push(String(err)));
  const touch=async(x,y)=>{
   const p=await page.evaluate(([x,y])=>{
    const canvas=document.querySelector('#juego canvas')||document.querySelector('canvas');
    if(!canvas)throw Error('Phaser WebGL canvas missing');
    const q=canvas.getBoundingClientRect();
    return {x:q.left+x*q.width/640,y:q.top+y*q.height/360};
   },[x,y]);
   assert.ok(p.x>=0&&p.x<=854&&p.y>=0&&p.y<=480,
    'Real mobile control must be within viewport');
   await page.touchscreen.tap(p.x,p.y);
  };
  const snapshot=async()=>page.evaluate(()=>{
   const s=window.t22Core.readCampaign();
   return {stage:s.stage,trainer:s.trainer,wins:s.wins,losses:s.losses,
    money:s.money,badges:[...s.badges],honors:[...s.leagueHonors],
    tms:[...s.inventory.tms],team:s.team.map(x=>x.uid),
    box:s.box.map(x=>x.uid),rematches:{...s.rematches}};
  });
  await page.goto('http://127.0.0.1:4474/arena2d/?original=1',
   {waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),
   null,{timeout:60000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=window.t22Core=await import(new URL('./torre2/campaign-core.js',src));
   const s=core.createCampaign('bulbasaur');
   s.stage=1;s.trainer=3;s.badges=['Rocha'];
   s.rematches={charge:3,sequence:0,wins:0,pending:null};
   core.saveCampaign(s);
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return c.scene.isActive()&&c.__torre2BattlePath?.progress===3;
  },null,{timeout:60000});
  const before=await snapshot();
  assert.equal(before.rematches.charge,3);
  const locate=async(index)=>{
   return page.evaluate(i=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    const z=c.children.list.find(obj=>obj.active&&obj.input?.enabled&&
     obj.getData?.('torre2-path-node')===i);
    if(!z)throw Error('Previously defeated native trainer zone missing '+i);
    return {x:z.x,y:z.y};
   },index);
  };
  const point=await locate(0);
  await touch(point.x,point.y);
  await page.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return c.scene.isActive()&&c.children.list.some(o=>
    typeof o.text==='string'&&o.text.includes('REVANCHE'));
  },null,{timeout:9000});
  await page.screenshot({path:'test-evidence/t22-mobile-rematch-offer.png'});
  await touch(320,235);
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.__torre2PartyInstalled&&
    b.datos?.torre2?.kind==='rematch'&&b.fase==='lucha';
  },null,{timeout:65000});
  const inBattle=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return {ticket:{...b.datos.torre2.ticket},
    foe:b.datos.p2,level:b.datos.torre2.enemyLevel,
    cap:b.datos.torre2.hardCap};
  });
  const reserved=await snapshot();
  assert.equal(reserved.rematches.charge,0);
  assert.equal(reserved.rematches.sequence,1);
  assert.equal(reserved.rematches.pending.token,inBattle.ticket.token);
  assert.equal(inBattle.ticket.trainer,0);
  assert.ok(inBattle.level<=inBattle.cap);
  for(const field of ['stage','trainer','wins','losses','money',
   'badges','honors','tms','team','box'])
   assert.deepEqual(reserved[field],before[field],'VS Seeker changed '+field);
  await page.screenshot({path:'test-evidence/t22-mobile-native-rematch-started.png'});
  // Close/reload mid-fight. This is NOT a defeat or a win, and cannot
  // manufacture rewards, achievements, XP or a second rematch charge.
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),
   null,{timeout:60000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   window.t22Core=await import(new URL('./torre2/campaign-core.js',src));
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return c.scene.isActive()&&c.__torre2BattlePath?.progress===3;
  },null,{timeout:55000});
  const afterReload=await snapshot();
  assert.deepEqual(afterReload,reserved,'Reload must not refund/duplicate VS Seeker');
  const p=await locate(0);
  await touch(p.x,p.y);
  await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')
   .children.list.some(o=>typeof o.text==='string'&&o.text.includes('REVANCHE')),
   null,{timeout:9000});
  await touch(320,235);
  await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')
   .children.list.some(o=>typeof o.text==='string'&&
    o.text.includes('VS Seeker: 0/3')),
   null,{timeout:9000});
  const afterDenied=await snapshot();
  assert.deepEqual(afterDenied,reserved,
   'Repeated mobile rematch button must not create another ticket or charge');
  assert.equal(await page.evaluate(()=>window.__pt2Game.scene.isActive('combate')),false,
   'Failed rematch must stay in original campaign menu');
  assert.deepEqual(errors,[],'No Phaser runtime exceptions');
  await page.screenshot({path:'test-evidence/t22-mobile-rematch-replay-denied.png'});
  // The original denial remains; explicit resume of THIS saved ticket is
  // a separate control and never creates another reservation or payout.
  const hasResume=await page.evaluate(()=>window.__pt2Game.scene
   .getScene('campanha').children.list.some(obj=>obj.input?.enabled&&
    obj.getData?.('torre2-rematch-resume')===true));
  assert.equal(hasResume,true,'Interrupted VS Seeker battle needs resume control');
  await touch(320,286);
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.__torre2PartyInstalled&&
    b.datos?.torre2?.kind==='rematch'&&b.fase==='lucha';
  },null,{timeout:65000});
  const resumedTicket=await page.evaluate(()=>window.__pt2Game.scene
   .getScene('combate').datos.torre2.ticket);
  assert.deepEqual(resumedTicket,inBattle.ticket,'Resume must use original ticket, not replace it');
  const afterResume=await snapshot();
  assert.deepEqual(afterResume,reserved,
   'Native battle resume must not spend additional charge or grant rewards');
  await page.screenshot({path:'test-evidence/t22-mobile-rematch-resumed.png'});
  const report={scope:'T22 native mobile VS Seeker interrupted ticket resume and anti-duplicate',
   fixture:'Misty-stage trainer checkpoints/recharge prepared; start and resume real, no artificial victory',
   before,reserved,afterReload,afterDenied,afterResume,inBattle,resumedTicket};
  fs.writeFileSync('test-evidence/t22-mobile-rematch-reload.json',JSON.stringify(report,null,2));
  console.log('T22 MOBILE REAL REMATCH RELOAD PASS',JSON.stringify({
   foe:inBattle.foe,charge:reserved.rematches.charge,
   token:reserved.rematches.pending.token,unchanged:afterDenied.money===before.money
  }));
 }finally{await browser.close();server.close()}
})().catch(err=>{console.error(err);process.exitCode=1;server.close()});
