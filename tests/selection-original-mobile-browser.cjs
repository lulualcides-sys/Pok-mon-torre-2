'use strict';
// End-to-end regression for screenshot: the 151+ Pokémon grid must not cover
// the duel panels or FIGHT buttons on landscape phones.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.png':'image/png','.jpg':'image/jpeg','.css':'text/css','.webp':'image/webp'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1');
 const p=path.resolve(root,'.'+url.pathname+(url.pathname.endsWith('/')?'index.html':''));
 if(!p.startsWith(root+path.sep)){res.writeHead(403).end();return}
 try{const b=await fs.readFile(p);res.writeHead(200,{'content-type':mime[path.extname(p)]||'application/octet-stream'}).end(b)}
 catch{res.writeHead(404).end('missing '+p)}
});
(async()=>{
 await new Promise(done=>server.listen(4298,'127.0.0.1',done));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  for(const mobile of [false,true]){
   const page=await browser.newPage({viewport:mobile?{width:740,height:414}:{width:980,height:650},isMobile:mobile,hasTouch:mobile});
   const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
   await page.goto('http://127.0.0.1:4298/arena2d/?original=1',{waitUntil:'domcontentloaded',timeout:30000});
   await page.waitForFunction(()=>window.__pt2Started===true&&window.__pt2Game,null,{timeout:50000});
   await page.evaluate(()=>window.__pt2Game.scene.start('seleccion',{previo:{modo:'cpu',p1:'rayquaza'}}));
   await page.waitForFunction(()=>{
    const game=window.__pt2Game;
    return game.scene.isActive('seleccion')&&game.scene.getScene('seleccion').casillas?.length>40;
   },null,{timeout:30000});
   const inspect=()=>page.evaluate(()=>{
    const s=window.__pt2Game.scene.getScene('seleccion');
    const alive=s.casillas.filter(c=>c.objects?.some(o=>o.visible));
    const hiddenClickable=s.casillas.filter(c=>c.page!==s.torre2Page&&c.objects?.some(o=>o.input?.enabled));
    return {
     count:s.casillas.length,
     totalPages:s.torre2Pages,
     page:s.torre2Page,
     visibleCards:alive.length,
     visiblePages:[...new Set(alive.map(c=>c.page))],
     hiddenClickable:hiddenClickable.length,
     label:s.torre2PageLabel?.text||'',
     fightButton:!!s.botonLuchar,
     rayquaza:s.casillas.some(c=>c.p.id==='rayquaza'&&!c.bloqueado),
     currentFocus:s.foco
    };
   });
   const initial=await inspect();
   const themedControls=await page.evaluate(()=>{
    const scene=window.__pt2Game.scene.getScene('seleccion');
    return scene.children.list.filter(obj=>obj?.getData?.('torre2-ui-theme')==='premium-noncombat').length;
   });
   assert.ok(themedControls>=3,'Original noncombat selection controls must use Pixel Art Premium');
   assert.equal(initial.visibleCards,8,'Only 8 Pokémon can be rendered on one page');
   assert.deepEqual(initial.visiblePages,[initial.page],'A hidden page has visible sprites');
   assert.equal(initial.hiddenClickable,0,'Hidden Pokémon cannot be touched');
   assert.ok(initial.label.startsWith('PÁG '+(initial.page+1)+'/'),'Page indicator must match the focused Pokémon');
   assert.ok(initial.fightButton,'Keep the native FIGHT button');
   assert.ok(initial.rayquaza,'Rayquaza must be selectable in the ORIGINAL game');
   const nextPage=initial.page===0?1:0;
   await page.evaluate((targetPage)=>{
    const s=window.__pt2Game.scene.getScene('seleccion');
    s.foco=targetPage*8;s.refrescar();
   },nextPage);
   const changed=await inspect();
   assert.equal(changed.visibleCards,8);
   assert.deepEqual(changed.visiblePages,[nextPage]);
   assert.equal(changed.hiddenClickable,0);
   assert.ok(changed.label.startsWith('PÁG '+(nextPage+1)+'/'));
   await fs.mkdir('test-evidence',{recursive:true});
   await page.screenshot({path:mobile?'test-evidence/selection-8-per-page-mobile.png':
    'test-evidence/selection-8-per-page-desktop.png',fullPage:true});
   assert.deepEqual(pageErrors,[],'Phaser selection errors');
   console.log('PHASER SELECTION RESPONSIVE PASS',JSON.stringify({mobile,initial,changed}));
   await page.close();
  }
 }finally{await browser.close();await new Promise(done=>server.close(done))}
})().catch(e=>{console.error(e);process.exitCode=1});
