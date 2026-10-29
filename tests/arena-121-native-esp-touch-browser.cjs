'use strict';
/* Native ESP cast check on the actual generated Phaser game.
 * This verifies a player can press a move-based dodge, NOT just inspect metadata.
 */
const assert=require('node:assert/strict'),fsp=require('node:fs/promises');
const path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site'),port=4599;
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg',
 '.ogg':'audio/ogg','.mp3':'audio/mpeg','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1:'+port);
 const target=path.resolve(root,'.'+(url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname));
 if(!target.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const bytes=await fsp.readFile(target);
 res.writeHead(200,{'content-type':mime[path.extname(target)]||'application/octet-stream'});
 res.end(bytes)}catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 await new Promise(r=>server.listen(port,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1024,height:630},hasTouch:true,isMobile:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:'+port+'/arena2d/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  const cases=['abra','butterfree','geodude','poliwrath','scyther','lapras'];
  const results=[];
  for(const id of cases){
   await page.evaluate(species=>window.__pt2Game.scene.getScene('titulo').scene.start('combate',{
    modo:'cpu',p1:species,p2:'mewtwo',mandos:['tactil','pad0'],nivel:'facil'
   }),id);
   await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('combate')&&
    window.__pt2Game.scene.getScene('combate')?.fase==='lucha'&&
    window.__pt2Game.scene.getScene('combate')?.panelTactil,null,{timeout:28000});
   const before=await page.evaluate(()=>{
    const s=__pt2Game.scene.getScene('combate'),me=s.luchadores[0];
    me.inmortal=true;s.luchadores[1].inmortal=true;
    s.controles[1].leer=()=>({mx:0,my:0,ax:me.x,ay:me.y});
    me.cd.esp=0;me.energia=100;me.ulti=100;me.accion=null;me.dash=null;
    me.est={};me.dolorHasta=-1;me.ultimoAtaque=-100;me.ultimoBasico=-100;
    s.pausado=false;s.pausaGolpe=0;s.fase='lucha';
    return {name:me.kit.esp?.nombre,form:me.kit.esp?.forma,
     native:me.kit.esp?.torre2ArenaNativeEvasion===true,
     before:me.stats.usosSlot?.esp||0,buttons:s.panelTactil.botones.map(b=>b.slot)};
   });
   assert.equal(before.native,true,id+' did not receive native Poké Arena 2D dodge move');
   assert.ok(['dash','vuelo'].includes(before.form),id+' ESP is not original dash or flight');
   assert.ok(before.buttons.includes('esp'),id+' ESP button missing');
   await page.evaluate(()=>{
    const s=__pt2Game.scene.getScene('combate'),p=s.panelTactil,b=p.botones.find(v=>v.slot==='esp');
    const pos=p.pos(b),origin=p.punto({x:0,y:0}),unit=p.punto({x:1,y:1});
    const touch={id:87,x:(pos.x-origin.x)/(unit.x-origin.x),
      y:(pos.y-origin.y)/(unit.y-origin.y)};
    p.abajo(touch);p.leer(x=>({ax:x.x,ay:x.y}));
   });
   await page.waitForTimeout(460);
   const after=await page.evaluate(()=>{
    const s=__pt2Game.scene.getScene('combate'),me=s.luchadores[0];
    s.panelTactil.arriba({id:87});
    return {casts:me.stats.usosSlot?.esp||0,cd:me.cd.esp,
     inDash:!!me.dash,inAction:!!me.accion};
   });
   results.push({species:id,before,after,used:after.casts>before.before||after.cd>0});
   await page.evaluate(()=>__pt2Game.scene.getScene('combate').scene.start('titulo'));
   await page.waitForFunction(()=>__pt2Game.scene.isActive('titulo'),null,{timeout:12000});
  }
  const failed=results.filter(r=>!r.used);
  console.log('ARENA_121_ESP_REAL_TOUCH',JSON.stringify({results,errors}));
  assert.deepEqual(failed,[],'Original P2 ESP moves could not be cast from real mobile buttons');
  assert.deepEqual(errors,[],'Phaser runtime errors during ESP casts');
  console.log('PASS_ARENA_121_NATIVE_ESP_TOUCH',results.length);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
