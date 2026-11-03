'use strict';
/* T46: real Phaser/WebGL screenshots of approved maps; controlled starter fixture,
 * never proof of naturally completed gyms, saves or trainer wins.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const out=path.resolve('test-evidence/visual-guard');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 let name;
 try{name=decodeURIComponent(new URL(req.url||'/','http://127.0.0.1').pathname)}
 catch{res.writeHead(400);return res.end('bad url')}
 const file=path.resolve(root,'.'+(name.endsWith('/')?name+'index.html':name));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const b=await fs.readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(b)}
 catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const evidence={ok:false,source:'real-Phaser-Chromium',
  fixture:'starter factory; direct read-only map preview, NOT natural story progress',
  maps:[],errors:[]};
 let browser;
 try{
  await new Promise((yes,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',yes)});
  browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
   headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
    '--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist']});
  for(const mode of [{name:'desktop',width:1280,height:720,isMobile:false},
                     {name:'mobile',width:844,height:390,isMobile:true}]){
   const page=await browser.newPage({viewport:{width:mode.width,height:mode.height},
    deviceScaleFactor:1,isMobile:mode.isMobile,hasTouch:mode.isMobile});
   page.on('pageerror',e=>evidence.errors.push(String(e).slice(0,500)));
   await page.goto('http://127.0.0.1:'+server.address().port+'/arena2d/?original=1',
    {waitUntil:'domcontentloaded',timeout:45000});
   await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo')&&
    document.querySelector('#juego canvas'),null,{timeout:55000});
   await page.evaluate(async()=>{
    const main=[...document.scripts].find(s=>s.src?.includes('/main.js'))?.src;
    if(!main)throw Error('Native main module absent');
    const core=await import(new URL('./torre2/campaign-core.js',main));
    window.kanto=core;
    core.saveCampaign(core.createPlayerCampaign('bulbasaur'));
    window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
   });
   await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('campanha')&&
    !!window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,
    null,{timeout:50000});
   for(const id of ['pewter-city','gym-brock','cerulean-city','gym-misty']){
    const info=await page.evaluate(async id=>{
     const game=window.__pt2Game,scene=game.scene.getScene('campanha');
     const main=[...document.scripts].find(s=>s.src?.includes('/main.js'))?.src;
     const atlas=await import(new URL('./torre2/torre2-approved-maps-atlas.js',main));
     const entry=atlas.approvedMap(id);
     if(!entry)throw Error('Approved map not registered: '+id);
     const key='torre2-approved-map-'+id;
     if(!game.textures.exists(key)){
      await new Promise((resolve,reject)=>{
       let failed=false;
       const onError=file=>{if(file?.key===key)failed=true};
       scene.load.on('loaderror',onError);
       scene.load.once('complete',()=>{
        scene.load.off('loaderror',onError);
        if(failed||!game.textures.exists(key))reject(Error('Approved map texture missing: '+id));
        else resolve();
       });
       scene.load.image(key,entry.image);
       scene.load.start();
      });
     }
     const state=window.kanto.readCampaign();
     if(!scene.approvedMapPreview(state,id))throw Error('Phaser rejected approved preview: '+id);
     const view=scene.__torre2ApprovedMapView;
     const aces=scene.children.list.filter(x=>x.active&&x.getData?.('torre2-gym-ace')===id)
      .map(x=>({texture:x.texture?.key,w:x.displayWidth,h:x.displayHeight}));
     return {id,texture:view.image.texture.key,hotspots:view.zones.length,
      rect:view.rect,aces,fps:game.loop.actualFps,stage:state.stage};
    },id);
    assert.equal(info.texture,'torre2-approved-map-'+id);
    assert.ok(info.rect.width>=639.9&&info.rect.height>=359.9,id+' must be 16:9');
    if(id==='gym-brock'||id==='gym-misty')
     assert.equal(info.aces.length,1,id+' must show the real ace portrait');
    const filename='approved-'+id+'-'+mode.name+'.png';
    await page.screenshot({path:path.join(out,filename),fullPage:true,animations:'disabled'});
    evidence.maps.push({...info,mode:mode.name,screenshot:filename});
   }
   await page.close();
  }
  assert.deepEqual(evidence.errors,[],'Phaser page errors');
  evidence.ok=true;
 }catch(e){evidence.error=String(e?.stack||e).slice(0,2500);process.exitCode=1}
 finally{
  await fs.writeFile(path.join(out,'approved-map-real-browser-result.json'),JSON.stringify(evidence,null,2));
  if(browser)await browser.close();
  await new Promise(done=>server.close(done));
 }
})();
