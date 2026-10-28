'use strict';
// T26 leader presentation: native mobile pointer to all 8 gyms + 5 League rooms.
// Check correct challenge lock/leader signage, all eight pixel badges and zero
// save changes. All stages/badges are UI fixtures, NOT natural trainer wins.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
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
 await new Promise(ok=>server.listen(4493,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 let page;
 try{
  page=await browser.newPage({viewport:{width:854,height:480},hasTouch:true,isMobile:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const tap=async(x,y)=>{
   const pt=await page.evaluate(([x,y])=>{
    const c=document.querySelector('#juego canvas')||document.querySelector('canvas');
    if(!c)throw Error('Native Phaser game canvas not found');
    const b=c.getBoundingClientRect();
    return {x:b.left+x*b.width/640,y:b.top+y*b.height/360};
   },[x,y]);
   assert.ok(pt.x>=0&&pt.x<=854&&pt.y>=0&&pt.y<=480);
   await page.touchscreen.tap(pt.x,pt.y);
  };
  await page.goto('http://127.0.0.1:4493/arena2d/?original=1',
   {waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:65000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   window.t26Core=await import(new URL('./torre2/campaign-core.js',src));
   t26Core.saveCampaign(t26Core.createCampaign('bulbasaur'));
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return c.scene.isActive()&&!!c.__torre2BattlePath;
  },null,{timeout:65000});
  const snapshot=async()=>page.evaluate(()=>localStorage.getItem(t26Core.SAVE_KEY));
  const render=async(stage,ready)=>{
   await page.evaluate(([stage,ready])=>{
    const core=window.t26Core,sc=window.__pt2Game.scene.getScene('campanha');
    const s=core.createCampaign('bulbasaur');
    s.stage=stage;
    s.trainer=ready?core.TRAINERS_PER_GYM(stage):
     Math.max(0,core.TRAINERS_PER_GYM(stage)-1);
    s.badges=core.GYMS.slice(0,Math.min(stage,8)).map(x=>x.badge);
    core.saveCampaign(s);
    sc.renderCampaign(core.readCampaign());
   },[stage,ready]);
   return snapshot();
  };
  const summary=async()=>page.evaluate(()=>{
   const sc=window.__pt2Game.scene.getScene('campanha'),p=sc.__torre2BattlePath;
   const labels=sc.children.list.filter(x=>x.active&&typeof x.text==='string')
    .map(x=>x.text);
   return {stage:p?.stage,progress:p?.progress,total:p?.total,
    leader:window.t26Core.STAGES[p.stage]?.leader,
    label:labels.join(' | '),cta:sc.children.list.find(x=>x.active&&x.input?.enabled&&
     x.getData?.('torre2-central-cta')===true)&&{x:359,y:335},
    enemy:window.t26Core.currentOpponent(window.t26Core.readCampaign())?.name};
  });
  const report={scope:'T26 13 Kanto leaders and all 8 FRLG badge sprites in real mobile Phaser UI',
   fixture:'stages and badges prepared for UI inspection, no natural wins or league completion',
   bosses:[],badges:null,errors:[]};
  for(let stage=0;stage<13;stage++){
   // Stage 8 is Victory Road with 17 trainers; stages 9-12 are league
   // leader-only. For each stage, enter the real leader challenge by touch.
   const before=await render(stage,true);
   const ui=await summary();
   assert.equal(ui.stage,stage);
   assert.equal(ui.progress,ui.total);
   assert.ok(ui.cta,'Main boss CTA missing at '+stage);
   assert.equal(ui.enemy,ui.leader,'Wrong boss identity on route '+stage);
   assert.ok(ui.label.includes(ui.leader.toUpperCase()),'Boss title absent '+ui.leader);
   await tap(ui.cta.x,ui.cta.y);
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')
    .children.list.some(o=>o.active&&typeof o.text==='string'&&
     o.text.includes('LÍDER DISPONÍVEL PARA BATALHA')),null,{timeout:12000});
   const visible=await page.evaluate(()=>{
    const sc=window.__pt2Game.scene.getScene('campanha');
    return sc.children.list.filter(x=>x.active&&typeof x.text==='string').map(x=>x.text);
   });
   assert.ok(visible.some(s=>s.includes('▶ DESAFIAR LÍDER')),
    'Real challenge button missing '+ui.leader);
   assert.equal(await snapshot(),before,'Opening challenge mutated save '+stage);
   assert.equal(await page.evaluate(()=>window.__pt2Game.scene.isActive('combate')),
    false,'Challenge should not launch battle until explicit confirmation');
   await tap(320,306);
   await page.waitForFunction(()=>!!window.__pt2Game.scene.getScene('campanha')
    .__torre2BattlePath,null,{timeout:15000});
   const after=await snapshot();
   assert.equal(after,before,'Back button changed save '+stage);
   report.bosses.push({stage,leader:ui.leader,challenge:true,readonly:true});
   if(stage===0||stage===7||stage===12){
    await page.screenshot({path:'test-evidence/t26-kanto-leader-'+stage+'.png'});
   }
  }
  // All eight badges are actual 16x16 FRLG sprites, with no arbitrary icons.
  const beforeBadges=await render(7,true);
  const badge=await page.evaluate(()=>{
   const sc=window.__pt2Game.scene.getScene('campanha');
   const z=sc.children.list.find(x=>x.active&&x.input?.enabled&&
    x.getData?.('torre2-badge-case-open')===true);
   if(!z)throw Error('Native badge case open zone missing');
   return {x:z.x,y:z.y};
  });
  await tap(badge.x,badge.y);
  await page.waitForFunction(()=>!!window.__pt2Game.scene.getScene('campanha')
   .__torre2BadgeCase,null,{timeout:10000});
  const badges=await page.evaluate(()=>{
   const sc=window.__pt2Game.scene.getScene('campanha');
   return sc.children.list.filter(x=>x.active&&
    x.getData?.('torre2-badge-sprite')!==undefined).map(x=>({
    index:x.getData('torre2-badge-sprite'),key:x.texture?.key,
    frame:Number(x.frame?.name),w:x.frame?.width,h:x.frame?.height
   }));
  });
  assert.equal(badges.length,8);
  assert.deepEqual(badges,Array.from({length:8},(_,i)=>({
   index:i,key:'torre2-frlg-badges',frame:i,w:16,h:16
  })));
  for(let i=0;i<8;i++){
   const pos=await page.evaluate(i=>{
    const sc=window.__pt2Game.scene.getScene('campanha');
    const z=sc.children.list.find(x=>x.active&&x.input?.enabled&&
     x.getData?.('torre2-badge-index')===i);
    if(!z)throw Error('Badge slot missing '+i);
    return {x:z.x,y:z.y};
   },i);
   await tap(pos.x,pos.y);
   const selected=await page.evaluate(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    return {selected:c.__torre2BadgeCase?.selected,earned:c.__torre2BadgeCase?.earned};
   });
   assert.equal(selected.selected,i,'Badge selection incorrect '+i);
   assert.equal(selected.earned,i<7,'Badge must correspond to synthetic earned progress '+i);
   assert.equal(await snapshot(),beforeBadges,'Inspecting badge altered original save');
  }
  await page.screenshot({path:'test-evidence/t26-eight-native-frlg-badges-mobile.png'});
  const back=await page.evaluate(()=>{
   const sc=window.__pt2Game.scene.getScene('campanha');
   const z=sc.children.list.find(x=>x.active&&x.input?.enabled&&
    x.getData?.('torre2-badge-case-back')===true);
   if(!z)throw Error('Badge back button missing');
   return {x:z.x,y:z.y};
  });
  await tap(back.x,back.y);
  assert.equal(await snapshot(),beforeBadges,'Badge exit modified save');
  assert.deepEqual(errors,[],'No Phaser rendering errors on all thirteen leader UI routes');
  report.badges=badges;report.errors=errors;
  fs.writeFileSync('test-evidence/t26-kanto-native-leader-badges.json',
   JSON.stringify(report,null,2));
  console.log('T26 NATIVE KANTO 13 LEADERS + EIGHT BADGES MOBILE PASS',
   JSON.stringify({bosses:report.bosses.length,badges:report.badges.length,saved:true}));
 }finally{
  try{if(page&&!page.isClosed())await page.close();}
  finally{await browser.close();await new Promise(done=>server.close(done));}
 }
})().catch(e=>{console.error(e);process.exitCode=1;if(server.listening)server.close()});
