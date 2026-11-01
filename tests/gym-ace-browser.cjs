/* T35 — REAL Chromium/Phaser WebGL screenshots: Brock+Onix and Misty+Starmie.
 * Visual fixture stages only. NO fabricated victories or campaign progress.
 */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost'),p=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!p.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 fs.readFile(p,(err,b)=>{res.writeHead(err?404:200,{'Content-Type':({'.js':'text/javascript','.html':'text/html','.json':'application/json','.png':'image/png','.webp':'image/webp','.css':'text/css'})[path.extname(p)]||'application/octet-stream'});res.end(err?'missing':b)});
});
(async()=>{
 await new Promise(r=>server.listen(4496,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 fs.mkdirSync('test-evidence/gym-ace',{recursive:true});
 const reports=[];
 try{
  for(const [device,viewport] of [['desktop',{width:1280,height:720}],['mobile',{width:854,height:480}]]){
   for(const [stage,leader,ace] of [[0,'Brock','onix'],[1,'Misty','starmie']]){
    const page=await browser.newPage({viewport,hasTouch:device==='mobile'}),errors=[],failedRequests=[];
    page.on('pageerror',e=>errors.push(String(e)));
    page.on('requestfailed',r=>failedRequests.push(r.url()+' '+r.failure()?.errorText));
    try{
     await page.goto('http://127.0.0.1:4496/arena2d/?original=1',{waitUntil:'domcontentloaded'});
     await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
     await page.evaluate(async stage=>{
      const main=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
      const core=await import(new URL('./torre2/campaign-core.js',main));
      const state=core.createPlayerCampaign('bulbasaur');
      state.stage=stage;state.trainer=core.TRAINERS_PER_GYM(stage);
      core.saveCampaign(state);
      window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
     },stage);
     await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'),null,{timeout:60000});
     const saveBefore=await page.evaluate(()=>localStorage.getItem('pokemon-torre-2-kanto-campaign-v1'));
     await page.evaluate(async()=>{
      const main=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
      const core=await import(new URL('./torre2/campaign-core.js',main));
      window.__pt2Game.scene.getScene('campanha').gymScreen(core.readCampaign());
     });
     await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')?.__torre2GymAce?.ready===true,null,{timeout:60000});
     await page.waitForTimeout(800);
     const info=await page.evaluate(()=>{
      const scene=window.__pt2Game.scene.getScene('campanha');
      const a=scene.__torre2GymAce,object=scene.children.list.find(o=>o.getData?.('torre2-gym-ace')===a.species);
      const leader=scene.children.list.find(o=>o.getData?.('torre2-gym-leader')===a.leader);
      const btn=scene.children.list.find(o=>o.input?.enabled&&o.x===320&&o.y===231);
      const spriteBounds=object?.getBounds?.(),btnBounds=btn?.getBounds?.();
      return {stage:a.stage,species:a.species,leader:a.leader,ready:a.ready,renderer:scene.game.renderer.type,
       spriteKey:object?.texture?.key,hasLeader:!!leader,frame:object?.frame?.name,
       spriteBounds:spriteBounds?{x:spriteBounds.x,y:spriteBounds.y,right:spriteBounds.right,bottom:spriteBounds.bottom}:null,
       buttonBounds:btnBounds?{x:btnBounds.x,y:btnBounds.y,right:btnBounds.right,top:btnBounds.top}:null,
       fps:scene.game.loop.actualFps,hasGymInterior:scene.children.list.some(o=>o.texture?.key==='frlg-location-'+(a.stage?'cerulean':'pewter')),
       hasGymFloor:scene.children.list.some(o=>o.getData?.('torre2-gym-floor')===(a.stage?'cerulean':'pewter')),
       visualFixture:true};
     });
     assert.equal(info.renderer,2,'must use real Phaser/WebGL');
     assert.equal(info.species,ace);assert.equal(info.leader,leader);assert.equal(info.hasLeader,true);
     assert.equal(info.spriteKey,'torre2-gym-ace-'+(stage?'0121':'0095'));
     assert.equal(info.hasGymInterior,true,'original FireRed gym interior required');
     assert.equal(info.hasGymFloor,true,'authentic tiled FireRed floor required');
     assert.ok(info.spriteBounds&&info.buttonBounds,'native sprite and button must exist');
     assert.ok(info.spriteBounds.bottom<info.buttonBounds.top,'ace must not block challenge button');
     assert.equal(await page.evaluate(()=>localStorage.getItem('pokemon-torre-2-kanto-campaign-v1')),saveBefore,'gym decorations must never mutate save');
     assert.deepEqual(errors,[]);assert.deepEqual(failedRequests.filter(x=>x.includes('/assets/pmd/')),[]);
     const name='gym-'+leader.toLowerCase()+'-'+ace+'-'+device+'.png';
     await page.screenshot({path:'test-evidence/gym-ace/'+name});
     reports.push({...info,device,file:name,errors});
     // Exit through native return control; the idle sheet must not be drawn in the route/city.
     const back=await page.evaluate(()=>{
      const s=window.__pt2Game.scene.getScene('campanha');
      const z=s.children.list.find(o=>o.input?.enabled&&o.x===320&&o.y===306);
      if(!z)throw Error('Gym back button missing');
      const r=document.querySelector('#juego canvas').getBoundingClientRect();
      return{x:r.x+z.x*r.width/640,y:r.y+z.y*r.height/360};
     });
     if(device==='mobile')await page.touchscreen.tap(back.x,back.y);
     else await page.mouse.click(back.x,back.y,{delay:100});
     await page.waitForFunction(stage=>{
      const s=window.__pt2Game.scene.getScene('campanha');
      // Old route metadata can match before scene.restart() finishes.
      // Wait for the actual gym objects to disappear, not just stage ID.
      const aceCount=s?.children.list.filter(o=>o.getData?.('torre2-gym-ace')).length??1;
      const floorCount=s?.children.list.filter(o=>o.getData?.('torre2-gym-floor')).length??1;
      return s?.scene.isActive()&&aceCount===0&&floorCount===0&&
       (s.__torre2BattlePath?.stage===stage||s.__torre2CityHub?.stage===stage);
     },stage,{timeout:15000});
     assert.equal(await page.evaluate(()=>window.__pt2Game.scene.getScene('campanha').children.list
      .filter(o=>o.getData?.('torre2-gym-ace')).length),0,'ace must not leak into city or route');
     assert.equal(await page.evaluate(()=>localStorage.getItem('pokemon-torre-2-kanto-campaign-v1')),saveBefore,'return must preserve save');
    }catch(error){
     await page.screenshot({path:'test-evidence/gym-ace/failure-'+stage+'-'+device+'.png'}).catch(()=>{});
     const debug=await page.evaluate(()=>{const s=window.__pt2Game?.scene.getScene('campanha');return{ace:s?.__torre2GymAce&&{ready:s.__torre2GymAce.ready,reason:s.__torre2GymAce.reason,species:s.__torre2GymAce.species},textureKeys:s?.textures?.getTextureKeys?.().filter(k=>k.includes('gym-ace')),manifest:!!s?.registry?.get('manifiesto')}}).catch(()=>null);
     fs.writeFileSync('test-evidence/gym-ace/failure-'+stage+'-'+device+'.json',JSON.stringify({error:String(error),errors,failedRequests,debug},null,2));
     throw error;
    }finally{await page.close()}
   }
  }
  fs.writeFileSync('test-evidence/gym-ace/report.json',JSON.stringify(reports,null,2));
  console.log('PASS 4 REAL native Phaser/WebGL screenshots Brock+Onix and Misty+Starmie; save unchanged');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
