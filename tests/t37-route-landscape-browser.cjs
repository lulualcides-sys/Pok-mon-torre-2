'use strict';
// T37 visual fixtures: real Phaser/WebGL native FireRed routes.
// Fixture stage/trainer data selects scenes ONLY. It does NOT grant badges,
// earn XP, bypass opponents or prove a natural journey to the Champion.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const fsp=require('node:fs/promises');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const dest=path.resolve('test-evidence/t37-route-landscape');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.ogg':'audio/ogg'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1');
 const abs=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!abs.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const bytes=await fsp.readFile(abs);res.writeHead(200,
  {'content-type':mime[path.extname(abs)]||'application/octet-stream'});res.end(bytes)}
 catch{res.writeHead(404);res.end('missing')}
});
const views=[
 {id:'pallet',stage:0,trainer:0},
 {id:'mtmoon',stage:1,trainer:5},
 {id:'route24',stage:2,trainer:0},
 {id:'seafoam',stage:6,trainer:6},
 {id:'victory',stage:8,trainer:0},
 {id:'elite-bruno',stage:9,trainer:0},
];
(async()=>{
 fs.mkdirSync(dest,{recursive:true});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 const port=server.address().port;
 let browser;const report={kind:'real-Phaser-WebGL',fixture:'stages and trainer counters only',views:[],errors:[]};
 try{
  browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
   headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
    '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
  for(const [device,opts]of [
   ['desktop',{viewport:{width:1280,height:720}}],
   ['mobile',{viewport:{width:854,height:480},hasTouch:true,isMobile:true}]
  ]){
   const page=await browser.newPage(opts);page.on('pageerror',e=>report.errors.push(String(e)));
   try{
    await page.goto('http://127.0.0.1:'+port+'/arena2d/?original=1',
     {waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
    await page.evaluate(async()=>{
     const src=[...document.scripts].find(s=>s.src?.includes('/main.js'))?.src;
     if(!src)throw Error('native main.js missing');
     window.t37Core=await import(new URL('./torre2/campaign-core.js',src));
    });
    for(const view of views){
     await page.evaluate(({stage,trainer})=>{
      const core=window.t37Core,game=window.__pt2Game;
      const state=core.createCampaign('bulbasaur');
      state.stage=stage;state.trainer=trainer;
      core.saveCampaign(state);
      const c=game.scene.getScene('campanha');
      if(c.scene.isActive())c.scene.restart();
      else game.scene.start('campanha');
     },view);
     await page.waitForFunction(({stage,trainer})=>{
      const c=window.__pt2Game.scene.getScene('campanha');
      return c.scene.isActive()&&c.__torre2BattlePath?.stage===stage&&
       c.__torre2BattlePath.progress===trainer&&
       c.__torre2BattlePath?.gym?.crop;
     },view,{timeout:60000});
     await page.waitForTimeout(180);
     const info=await page.evaluate(()=>{
      const c=window.__pt2Game.scene.getScene('campanha'),p=c.__torre2BattlePath;
      const actors=c.__torre2RouteActors;
      const hitBoxes=p.nodes.map(n=>({id:n.getData('torre2-path-node'),x:n.x,y:n.y,
       w:n.width,h:n.height,enabled:n.input?.enabled}));
      const atlas=c.children.list.filter(o=>o.getData?.('torre2-native-route-scenery'))
       .map(o=>({key:o.getData('torre2-native-route-scenery'),width:o.displayWidth,height:o.displayHeight}));
      const cards=c.children.list.filter(o=>o.getData?.('torre2-path-card'));
      return {atlas,actors,hitBoxes,oldCards:cards.length,locale:p.gym.locale,
       nativeBackdrop:p.gym.nativeBackdrop,stage:p.stage,progress:p.progress,
       sceneActive:c.scene.isActive()};
     });
     assert.equal(info.stage,view.stage);
     assert.equal(info.progress,view.trainer);
     assert.ok(info.atlas.length===1,'one actual terrain, never repeated city: '+view.id);
     assert.ok(info.atlas[0].width>=468&&info.atlas[0].height>=240);
     assert.equal(info.oldCards,0);
     assert.equal(info.actors.player,true);
     assert.equal(info.actors.trainer,view.trainer<(view.stage===9?1:50)&&view.stage!==9);
     assert.ok(info.hitBoxes.length>=1&&info.hitBoxes.length<=14);
     assert.ok(info.hitBoxes.every(h=>h.enabled&&h.x>=0&&h.x<=640&&h.y>=0&&h.y<=360));
     assert.ok(info.hitBoxes.every(h=>h.y===291),'compact map rail below landscape');
     const name=view.id+'-'+device+'.png';
     await page.screenshot({path:path.join(dest,name),fullPage:true});
     report.views.push({...view,device,file:name,...info});
    }
    // Emulate ONLY a saved trainer-index change, without awarding victory.
    // The native scene must fetch Viridian's real terrain without requiring
    // the user to restart the campaign or discard its current save.
    await page.evaluate(()=>{
     const core=window.t37Core,c=window.__pt2Game.scene.getScene('campanha');
     const s=core.createCampaign('bulbasaur');s.stage=0;s.trainer=0;
     core.saveCampaign(s);c.scene.restart();
    });
    await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')
     .__torre2BattlePath?.stage===0,null,{timeout:60000});
    await page.evaluate(()=>{
     const core=window.t37Core,c=window.__pt2Game.scene.getScene('campanha');
     const s=core.readCampaign();s.trainer=7;core.saveCampaign(s);
     c.renderCampaign(core.readCampaign());
    });
    await page.waitForFunction(()=>{
     const c=window.__pt2Game.scene.getScene('campanha'),p=c.__torre2BattlePath;
     return p?.stage===0&&p.progress===7&&p.gym?.locale==='viridian'
      &&p.gym?.realExterior===true;
    },null,{timeout:60000});
    const file='viridian-after-progress-'+device+'.png';
    await page.screenshot({path:path.join(dest,file),fullPage:true});
    report.views.push({id:'viridian-after-progress',device,file,
     stage:0,trainer:7,fixtureOnly:true,dynamicTerrainLoaded:true});
   }finally{await page.close()}
  }
  assert.deepEqual(report.errors,[],'unexpected Phaser runtime exception');
  assert.equal(report.views.length,14);
  fs.writeFileSync(path.join(dest,'report.json'),JSON.stringify(report,null,2));
  console.log('PASS T37 ROUTE LANDSCAPE REAL WEBGL '+JSON.stringify({
   views:report.views.length,locales:[...new Set(report.views.map(v=>v.locale))],
   native:report.views.filter(v=>v.nativeBackdrop).length,screenshots:report.views.map(v=>v.file)
  }));
 }catch(e){
  report.error=String(e?.stack||e);
  fs.writeFileSync(path.join(dest,'report.json'),JSON.stringify(report,null,2));
  throw e;
 }finally{await browser?.close();await new Promise(ok=>server.close(ok))}
})().catch(e=>{console.error(e);process.exitCode=1});
