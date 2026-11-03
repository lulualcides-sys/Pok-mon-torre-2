'use strict';
/* T60: actual native Phaser screenshot proof of original user-saved Kanto
 * reference sheets, without altering saves or enabling incomplete maps.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const out=path.resolve('test-evidence/visual-guard');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.png':'image/png','.webp':'image/webp','.css':'text/css'};
const server=http.createServer(async(req,res)=>{
 const uri=new URL(req.url||'/','http://127.0.0.1');
 const name=uri.pathname.endsWith('/')?uri.pathname+'index.html':uri.pathname;
 const filename=path.resolve(root,'.'+decodeURIComponent(name));
 if(!filename.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{
  const data=await fs.readFile(filename);
  res.writeHead(200,{'content-type':mime[path.extname(filename)]||'application/octet-stream'});
  res.end(data);
 }catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const evidence={ok:false,source:'native-Phaser-reference-only',captures:[],errors:[]};
 let browser;
 try{
  await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
  browser=await chromium.launch({headless:true,
   executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
   args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
  for(const mode of [
   {name:'desktop',w:1280,h:720,mobile:false},
   {name:'mobile',w:844,h:390,mobile:true}
  ]){
   const page=await browser.newPage({viewport:{width:mode.w,height:mode.h},
    isMobile:mode.mobile,hasTouch:mode.mobile,deviceScaleFactor:1});
   page.on('pageerror',e=>evidence.errors.push(String(e).slice(0,500)));
   await page.goto('http://127.0.0.1:'+server.address().port+'/arena2d/?original=1',
    {waitUntil:'domcontentloaded',timeout:45000});
   await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo')&&
    document.querySelector('#juego canvas'),null,{timeout:55000});
   await page.evaluate(async()=>{
    const main=[...document.scripts].find(s=>s.src?.includes('/main.js'))?.src;
    const core=await import(new URL('./torre2/campaign-core.js',main));
    window.__t60core=core;
    core.saveCampaign(core.createPlayerCampaign('bulbasaur'));
    window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
   });
   await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('campanha'),
    null,{timeout:35000});
   for(const id of ['pallet-town','viridian-city','viridian-forest']){
    const res=await page.evaluate(async id=>{
     const main=[...document.scripts].find(s=>s.src?.includes('/main.js'))?.src;
     const ref=await import(new URL('./torre2/torre2-prologue-source-preview.js',main));
     const scene=window.__pt2Game.scene.getScene('campanha'),key=ref.prologueReferenceKey(id);
     if(!scene.textures.exists(key)){
      await new Promise((ok,no)=>{
       let broken=false;
       const onError=file=>{if(file?.key===key)broken=true};
       scene.load.on('loaderror',onError);
       scene.load.once('complete',()=>{
        scene.load.off('loaderror',onError);
        if(broken||!scene.textures.exists(key))no(Error('Original PNG not loaded: '+id));
        else ok();
       });
       ref.preloadSourceSheet(scene,id);
       scene.load.start();
      });
     }
     const before=JSON.stringify(window.__t60core.readCampaign());
     scene.children.removeAll(true);
     const drawn=ref.showSourceSheetPhaser(scene,id);
     if(!drawn.ok)throw Error(JSON.stringify(drawn));
     const after=JSON.stringify(window.__t60core.readCampaign());
     return {id,texture:drawn.picture.texture.key,
      frame:[drawn.picture.frame.width,drawn.picture.frame.height],
      w:drawn.rect.width,h:drawn.rect.height,
      aspect:drawn.rect.proportionsPreserved,savesUnchanged:before===after};
    },id);
    assert.equal(res.texture,'torre2-original-reference-'+id);
    assert.equal(res.aspect,true);
    assert.equal(res.savesUnchanged,true);
    assert.ok(res.w<=640&&res.h<=360);
    const filename='t60-original-'+id+'-'+mode.name+'.png';
    await page.screenshot({path:path.join(out,filename),fullPage:true,animations:'disabled'});
    evidence.captures.push({...res,mode:mode.name,filename});
   }
   await page.close();
  }
  assert.deepEqual(evidence.errors,[]);
  assert.equal(evidence.captures.length,6);
  evidence.ok=true;
  console.log('T60 actual Phaser source screenshot OK: six desktop/mobile captures');
 }catch(error){
  evidence.error=String(error.stack||error).slice(0,2500);
  console.error('T60 browser failed',evidence.error);
  process.exitCode=1;
 }finally{
  await fs.writeFile(path.join(out,'t60-original-phaser-result.json'),JSON.stringify(evidence,null,2));
  await browser?.close().catch(()=>{});
  await new Promise(done=>server.close(done));
 }
})();
