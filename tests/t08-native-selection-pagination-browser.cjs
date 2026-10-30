'use strict';
/* Real Phaser selection: all roster cards stay navigable after October
 * upstream changed the FILAS/POR_FILA definitions. No gameplay changes.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml',
 '.jpg':'image/jpeg','.jpeg':'image/jpeg','.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1');
 const file=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const data=await fs.readFile(file);
  res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream'});
  res.end(data);
 }catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 await new Promise(done=>server.listen(4378,'127.0.0.1',done));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
  '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4378/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  await page.evaluate(()=>window.__pt2Game.scene.getScene('titulo')
   .scene.start('seleccion',{previo:{modo:'cpu',p1:'bulbasaur'}}));
  await page.waitForFunction(()=>{
   const s=window.__pt2Game.scene.getScene('seleccion');
   return s.scene.isActive()&&s.casillas?.length>24&&s.torre2Pages>1;
  },null,{timeout:45000});
  const measure=()=>page.evaluate(()=>{
   const s=window.__pt2Game.scene.getScene('seleccion'),cards=s.casillas;
   return {page:s.torre2Page,pages:s.torre2Pages,focus:s.foco,total:cards.length,
    visible:cards.filter(c=>c.objects?.some(o=>o.visible)).length,
    misplaced:cards.filter(c=>c.objects?.some(o=>o.visible)!==(c.page===s.torre2Page))
     .map(c=>({id:c.p?.id,page:c.page})).slice(0,6),
    inputLeaks:cards.filter(c=>c.page!==s.torre2Page&&
     c.objects?.some(o=>o.input?.enabled)).map(c=>c.p?.id).slice(0,6)};
  });
  const initial=await measure();
  assert.equal(initial.page,0);
  assert.equal(initial.pages,Math.ceil(initial.total/24));
  assert.equal(initial.visible,24,'First page must expose 24 Pokémon, not 76 clipped columns');
  assert.deepEqual(initial.misplaced,[]);
  assert.deepEqual(initial.inputLeaks,[],'Off-page cards still accept touch/click');
  // Use the REAL native previous/next page button, not a direct scene mutation.
  const click=async(x,y)=>{
   const p=await page.evaluate(([x,y])=>{
    const r=document.querySelector('#juego canvas').getBoundingClientRect();
    return {x:r.left+x*r.width/640,y:r.top+y*r.height/360};
   },[x,y]);await page.mouse.click(p.x,p.y);
  };
  await click(568,26);
  await page.waitForFunction(()=>window.__pt2Game.scene.getScene('seleccion').torre2Page===1,
   null,{timeout:9000});
  const second=await measure();
  assert.equal(second.page,1);
  assert.equal(second.visible,24);
  assert.equal(second.focus,24);
  assert.deepEqual(second.misplaced,[]);
  assert.deepEqual(second.inputLeaks,[]);
  for(let i=2;i<initial.pages;i++){
   await click(568,26);
   await page.waitForFunction(i=>window.__pt2Game.scene.getScene('seleccion').torre2Page===i,
    i,{timeout:9000});
  }
  const last=await measure();
  assert.equal(last.page,initial.pages-1);
  assert.equal(last.visible,last.total-(initial.pages-1)*24,
   'Last page must expose EVERY remaining Pokémon');
  assert.deepEqual(last.inputLeaks,[]);
  assert.deepEqual(last.misplaced,[]);
  await click(568,26);
  await page.waitForFunction(()=>window.__pt2Game.scene.getScene('seleccion').torre2Page===0,
   null,{timeout:9000});
  assert.deepEqual(errors,[],'Pagination generated native Phaser exceptions');
  await fs.mkdir('test-evidence',{recursive:true});
  await page.screenshot({path:'test-evidence/t08-native-151-selection-page-zero.png'});
  console.log('PASS_T08_NATIVE_UPSTREAM_SELECTION_PAGES',JSON.stringify({
   total:initial.total,pages:initial.pages,first:initial.visible,
   second:second.visible,last:last.visible,clicks:initial.pages+1,offscreenInputLeaks:0
  }));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
