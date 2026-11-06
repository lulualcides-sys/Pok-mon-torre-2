'use strict';
/* Actual Phaser six-player ARENA overlay, not VS CPU "seleccion".
 * Regress the screenshot of 13 overflowing columns + green missing portraits.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg',
 '.woff2':'font/woff2','.svg':'image/svg+xml','.ogg':'audio/ogg'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url||'/','http://127.0.0.1');
 const pathname=url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname;
 const file=path.resolve(root,'.'+pathname);
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const bytes=await fsp.readFile(file);
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(bytes);
 }catch{res.writeHead(404);res.end('not found')}
});
(async()=>{
 await new Promise(resolve=>server.listen(4388,'127.0.0.1',resolve));
 fs.mkdirSync('test-evidence',{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  for(const mobile of [false,true]){
   const page=await browser.newPage({viewport:mobile?{width:740,height:414}:
    {width:1280,height:720},isMobile:mobile,hasTouch:mobile});
   const errors=[];page.on('pageerror',e=>errors.push(String(e)));
   await page.goto('http://127.0.0.1:4388/arena2d/?original=1',
    {waitUntil:'domcontentloaded',timeout:45000});
   await page.waitForFunction(()=>window.__pt2Game?.scene?.isActive('titulo'),
    null,{timeout:70000});
   await page.evaluate(()=>window.__pt2Game.scene.start('preparar',{previo:{}}));
   await page.waitForFunction(()=>window.__pt2Game?.scene?.isActive('preparar')&&
    window.__pt2Game.scene.getScene('preparar').plazas?.length===6,
    null,{timeout:45000});
   await page.evaluate(()=>window.__pt2Game.scene.getScene('preparar').abrirSelector(0));
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('preparar')
    .selector?.abierto===true,null,{timeout:15000});
   const first=await page.evaluate(async()=>{
    const scene=window.__pt2Game.scene.getScene('preparar'),
     sel=scene.selector;
    const src=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
    const {ROSTER}=await import(new URL('./datos.js',src));
    return{total:ROSTER.length,families:sel.order.length,
     visible:sel.celdas.length,page:sel.page,columns:4,
     gridWidth:408,gridHeight:336,
     clickable:sel.celdas.filter(c=>c.zone.input.enabled).length,
     brokenVisible:sel.celdas.filter(c=>c.img.visible&&
      /__MISSING|__DEFAULT|_MISSING/.test(c.img.texture?.key||'')).length};
   });
   assert.ok(first.total>first.families,'Only 1 card per family, not every evolution');
   assert.equal(first.visible,8,'Arena must show 8 family cards, never 13 columns');
   assert.equal(first.clickable,8,'All eight cards must have touch targets');
   assert.equal(first.brokenVisible,0,'Never show green missing-portrait placeholders');
   // Loading PMD textures can temporarily suspend Phaser scene input.
   // Wait for the first real portrait before checking physical touch targets.
   await page.waitForFunction(()=>{
    const sel=window.__pt2Game.scene.getScene('preparar').selector;
    return sel?.celdas?.some(c=>c.img.visible);
   },null,{timeout:30000});
   await page.screenshot({path:mobile?
    'test-evidence/arena-family-before-nav-mobile.png':
    'test-evidence/arena-family-before-nav-desktop.png'});
   const canvasClick=async(x,y)=>{
    const pt=await page.evaluate(({x,y})=>{
     const r=document.querySelector('#juego canvas').getBoundingClientRect();
     return{x:r.left+x*r.width/640,y:r.top+y*r.height/360};
    },{x,y});
    await page.mouse.click(pt.x,pt.y);
   };
   await canvasClick(498,167);
   const afterClick=await page.evaluate(()=>{
    const sel=window.__pt2Game.scene.getScene('preparar').selector,
     scene=window.__pt2Game.scene.getScene('preparar');
    return{page:sel?.page,opened:sel?.abierto,
     buttons:sel?.botones?.length,
     zones:scene.children.list.filter(o=>o.type==='Zone'&&o.depth>=sel.capa+4)
      .slice(0,12).map(z=>({x:z.x,y:z.y,depth:z.depth,
       input:z.input?.enabled,width:z.width,height:z.height}))};
   });
   console.log('ARENA_FAMILY_AFTER_PHYSICAL_CLICK',JSON.stringify(afterClick));
   assert.equal(afterClick.page,1,
    'Physical next-page arrow failed: '+JSON.stringify(afterClick));
   const second=await page.evaluate(()=>{
    const s=window.__pt2Game.scene.getScene('preparar').selector;
    return{page:s.page,visible:s.celdas.length,root:s.root,
     previewImages:s.celdas.filter(c=>c.img.visible).length,
     label:s.pageLabel.text};
   });
   assert.equal(second.visible,8);
   assert.ok(second.label.includes('2/'));
   const family=await page.evaluate(async()=>{
    const s=window.__pt2Game.scene.getScene('preparar').selector;
    const src=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
    const {ROSTER}=await import(new URL('./datos.js',src));
    const inspect=name=>{
     const i=ROSTER.findIndex(p=>p.id===name);
     if(i<0)return {error:'not in native ROSTER'};
     const root=s.families.rootIndexForIndex[i];
     s.selectFamily(root);
     return{root:ROSTER[root]?.id,
      names:s.forms(root).map(x=>x.name.toLowerCase()),
      page:s.page,visible:s.celdas.length};
    };
    return{smoochum:inspect('smoochum'),elekid:inspect('elekid'),
     magby:inspect('magby'),torchic:inspect('torchic')};
   });
   for(const [name,required] of Object.entries({
    smoochum:['smoochum','jynx'],elekid:['elekid','electabuzz'],
    magby:['magby','magmar'],torchic:['torchic','combusken','blaziken']
   })){
    assert.ok(!family[name].error,name+' family root absent');
    for(const child of required)assert.ok(family[name].names.includes(child),
     name+' family missing '+child);
    assert.ok(family[name].visible<=8,'Family selection overflow');
   }
   await page.waitForFunction(()=>{
    const s=window.__pt2Game.scene.getScene('preparar').selector;
    return s?.celdas?.some(c=>c.img.visible===true);
   },null,{timeout:30000});
   await page.screenshot({path:mobile?
    'test-evidence/arena-family-selector-mobile.png':
    'test-evidence/arena-family-selector-desktop.png'});
   const chosen=await page.evaluate(async()=>{
    const prep=window.__pt2Game.scene.getScene('preparar'),sel=prep.selector;
    const src=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
    const {ROSTER}=await import(new URL('./datos.js',src));
    const i=ROSTER.findIndex(p=>p.id==='torchic');
    sel.bloqueado=null;sel.elegir(i);
    return{expected:ROSTER[i].id,actual:prep.plazas[0].id,closed:prep.selector===null};
   });
   assert.equal(chosen.actual,chosen.expected,'Original Arena choose callback lost');
   assert.ok(chosen.closed,'Selector did not close after choosing');
   assert.deepEqual(errors,[],'Arena family selector generated JS exceptions');
   console.log('PASS_ARENA_FAMILY_SELECTOR',JSON.stringify({mobile,first,second,family,chosen}));
   await page.close();
  }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
