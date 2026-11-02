'use strict';
/* Real Phaser/Chromium smoke for the exact installed approved WebP scenes.
 * Do not run until the pinned ZIP installer enables the renderer.
 */
const {chromium}=require('playwright-core');
const {createServer}=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const out=path.resolve('test-evidence/approved-maps');
const mime={'.html':'text/html','.js':'text/javascript','.webp':'image/webp',
 '.png':'image/png','.css':'text/css','.json':'application/json','.ogg':'audio/ogg'};
const server=createServer(async(req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
 const file=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 try{let data=await fs.readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(data)}
 catch{res.writeHead(404);res.end('not found')}
});
(async()=>{
 await fs.mkdir(out,{recursive:true});
 let browser,desktop,phone;
 const result={ok:false,steps:[],errors:[],missingAssets:[]};
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
   headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
    '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
  async function runPage(options,label){
   const page=await browser.newPage(options);
   page.on('pageerror',e=>result.errors.push(label+':'+String(e).slice(0,250)));
   page.on('response',r=>{if(r.status()>=400&&/kanto-approved-maps/.test(r.url()))
    result.missingAssets.push(r.url())});
   let response=await page.goto('http://127.0.0.1:'+port+'/arena2d/?original=1',
    {waitUntil:'domcontentloaded',timeout:45000});
   assert.equal(response?.status(),200);
   await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:55000});
   await page.evaluate(async()=>{
    const main=[...document.scripts].find(s=>s.src?.includes('/main.js'))?.src;
    if(!main)throw Error('Native Phaser entry module missing');
    const core=await import(new URL('./torre2/campaign-core.js',main));
    window.__mapFixture=core;
    core.saveCampaign(core.createPlayerCampaign('bulbasaur'));
    window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
   });
   await page.waitForFunction(()=>{
    let game=window.__pt2Game,s=game?.scene.getScene('campanha');
    return game?.scene.isActive('campanha')&&s?.__torre2ApprovedMapView?.id==='pewter-city';
   },null,{timeout:55000});
   const initial=await page.evaluate(()=>{
    const scene=window.__pt2Game.scene.getScene('campanha'),view=scene.__torre2ApprovedMapView;
    return {id:view.id,source:{
     width:view.image.texture.getSourceImage().width,
     height:view.image.texture.getSourceImage().height},
     gym:scene.children.list.filter(x=>x.getData?.('torre2-approved-hotspot')==='pewter-city:gym')
      .map(x=>({x:x.x,y:x.y})),before:JSON.stringify(window.__mapFixture.readCampaign())};
   });
   assert.equal(initial.id,'pewter-city');
   assert.equal(initial.source.width,1280);
   assert.equal(initial.source.height,720);
   assert.equal(initial.gym.length,1);
   await page.screenshot({path:path.join(out,label+'-pewter.png'),fullPage:true});
   result.steps.push(label+':approved-city');
   // Actual touchscreen or mouse event through the Phaser canvas.
   const button=initial.gym[0],coords=await page.evaluate(p=>{
    const rect=document.querySelector('#juego canvas').getBoundingClientRect();
    return {x:rect.x+(p.x/640)*rect.width,y:rect.y+(p.y/360)*rect.height};
   },button);
   if(label==='mobile')await page.touchscreen.tap(coords.x,coords.y);
   else await page.mouse.click(coords.x,coords.y);
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')?.__torre2ApprovedMapView?.id==='gym-brock',
    null,{timeout:20000});
   const gym=await page.evaluate(()=>{
    const scene=window.__pt2Game.scene.getScene('campanha');
    return {count:scene.children.list.filter(x=>
       String(x.getData?.('torre2-approved-gym-trainer')||'').startsWith('gym-brock:')).length,
     image:scene.__torre2ApprovedMapView.image.texture.getSourceImage().width,
     after:JSON.stringify(window.__mapFixture.readCampaign())};
   });
   assert.equal(gym.count,3,'Brock keeps exactly three checkpoint trainers');
   assert.equal(gym.image,1280);
   assert.equal(gym.after,initial.before,'Navigation cannot modify team/progress/saves');
   await page.screenshot({path:path.join(out,label+'-brock.png'),fullPage:true});
   result.steps.push(label+':gym-navigation-saves-unchanged');
   return page;
  }
  desktop=await runPage({viewport:{width:1280,height:720},deviceScaleFactor:1},'desktop');
  phone=await runPage({viewport:{width:844,height:390},deviceScaleFactor:1,
    isMobile:true,hasTouch:true},'mobile');
  assert.deepEqual(result.missingAssets,[],'Missing approved WebP assets');
  assert.deepEqual(result.errors,[],'Uncaught native Phaser errors');
  result.ok=true;
  console.log('APPROVED PHASER MAPS PASS',JSON.stringify(result.steps));
 }catch(error){result.error=String(error.stack||error).slice(0,2000);
  console.error('APPROVED PHASER MAPS FAIL',result.error);
  process.exitCode=1;
 }finally{
  await fs.writeFile(path.join(out,'approved-map-browser-result.json'),JSON.stringify(result,null,2));
  await phone?.close().catch(()=>{});await desktop?.close().catch(()=>{});
  await browser?.close().catch(()=>{});
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
