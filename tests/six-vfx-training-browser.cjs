'use strict';
/* Actual desktop/mobile Chromium in the ORIGINAL Phaser game; never mock battle.
 * Navigates to the six-attack visual training scene and captures real VFX frames.
 * This test cannot infer official move damage/status from visual effects alone.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const fsp=require('node:fs/promises');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.woff2':'font/woff2','.webp':'image/webp',
 '.jpg':'image/jpeg','.svg':'image/svg+xml','.ogg':'audio/ogg'};
const server=http.createServer(async(req,res)=>{
 const pathname=new URL(req.url||'/','http://127.0.0.1').pathname;
 const file=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const bytes=await fsp.readFile(file);
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'}).end(bytes);
 }catch{res.writeHead(404).end('not found')}
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const port=server.address().port;
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
   '--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist']});
 try{
  for(const mobile of [false,true]){
   const page=await browser.newPage({viewport:mobile?{width:740,height:414}:{width:1280,height:720},
    deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile});
   const errors=[],missing=[];
   page.on('pageerror',e=>errors.push(String(e)));
   page.on('response',r=>{if(r.status()>=400&&r.url().includes('127.0.0.1'))missing.push(r.url())});
   await page.goto('http://127.0.0.1:'+port+'/arena2d/?original=1',
    {waitUntil:'domcontentloaded',timeout:45000});
   await page.waitForFunction(()=>window.__pt2Game?.scene?.isActive('titulo'),
    null,{timeout:70000});
   const nav=await page.evaluate(()=>{
    const game=window.__pt2Game, title=game.scene.getScene('titulo');
    title.abrirMenu('jugar');
    const btn=title.botones.find(b=>b.id==='vfx-six');
    return {found:!!btn,menu:title.botones.map(b=>({id:b.id,bottom:b.y+b.h/2})),
      sceneRegistered:!!game.scene.getScene('vfx-six-lab')};
   });
   assert.ok(nav.found&&nav.sceneRegistered,'New training entry registered in real game');
   assert.ok(nav.menu.every(b=>b.bottom<312),'No menu overlap: '+JSON.stringify(nav.menu));
   await page.evaluate(()=>window.__pt2Game.scene.start('vfx-six-lab'));
   await page.waitForFunction(()=>window.__pt2Game?.scene?.isActive('vfx-six-lab'),
    null,{timeout:20000});
   const before=await page.evaluate(()=>{
    const game=window.__pt2Game,s=game.scene.getScene('vfx-six-lab');
    const t=game.textures.get('torre2-six-original-vfx-20261108');
    return {loaded:t?.frameTotal,selector:s.cards?.length,selected:s.selected,
      asset:s.fx?.texture?.key,visible:s.fx?.visible,
      nativeActors:(s.visualActors||[]).map(a=>a.texture?.key)};
   });
   assert.ok(before.loaded>=96&&before.selector===6&&before.visible,
    'Actual spritesheet and six controls visible: '+JSON.stringify(before));
   assert.deepEqual(before.nativeActors,['pmd-0103-Idle','pmd-0143-Idle'],
    'Use original loaded P2 Pokémon sprites, never plain P1/CPU placeholders');
   fs.mkdirSync('test-evidence/six-vfx-lab',{recursive:true});
   for(const id of ['gunk-shot','magnet-bomb','ominous-wind','drill-run','freeze-dry','head-smash']){
    assert.equal(await page.evaluate(id=>window.__pt2Game.scene.getScene('vfx-six-lab').cast(id),id),true);
    await page.waitForFunction(id=>{
     const s=window.__pt2Game.scene.getScene('vfx-six-lab');
     return s.selected===id&&s.frame>=9&&s.frame<15&&s.fx.visible;
    },id,{timeout:12000,polling:40});
    const hit=await page.evaluate(()=>{
     const s=window.__pt2Game.scene.getScene('vfx-six-lab');
     return {id:s.selected,frame:s.fx.frame?.name,x:s.fx.x,y:s.fx.y,
       playing:s.casting,active:s.fx.visible};
    });
    assert.ok(hit.playing&&hit.active&&hit.x>350,'VFX should reach visible enemy impact '+JSON.stringify(hit));
    await page.screenshot({path:'test-evidence/six-vfx-lab/'+id+(mobile?'-mobile':'-desktop')+'.png'});
   }
   assert.deepEqual(missing.filter(u=>/vfx-six|\.js/.test(u)),[],'Missing Phaser module/PNG');
   assert.deepEqual(errors,[],'Real Phaser JS errors');
   console.log('PASS SIX VFX IN ORIGINAL PHASER',JSON.stringify({mobile,before,nav:nav.menu}));
   await page.close();
  }
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
