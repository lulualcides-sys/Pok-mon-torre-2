'use strict';
const assert=require('node:assert/strict'), fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve('_site');
const MIME={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1:4287'),target=path.resolve(root,'.'+(url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname));
 if(!target.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden');}
 try{const d=await fsp.readFile(target);res.writeHead(200,{'content-type':MIME[path.extname(target)]||'application/octet-stream'});res.end(d);}catch{res.writeHead(404);res.end('missing');}
});
(async()=>{
 await new Promise(ok=>server.listen(4287,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4287/arena2d/');
  await page.waitForFunction(()=>window.__pt2Started&&window.__pt2Game?.scene.isActive('titulo'),null,{timeout:45000});
  await page.evaluate(()=>window.__pt2Game.scene.getScene('titulo').scene.start('combate',{
   modo:'cpu',p1:'koffing',p2:'buneary',mandos:['tactil','pad0'],nivel:'normal'
  }));
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('combate')&&window.__pt2Game.scene.getScene('combate').panelTactil,null,{timeout:20000});
  await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').fase==='lucha',null,{timeout:15000});
  const before=await page.evaluate(()=>{
   const s=window.__pt2Game.scene.getScene('combate'),l=s.luchadores[0];
   l.inmortal=true;s.luchadores[1].inmortal=true;
   s.controles[1].leer=()=>({mx:0,my:0,ax:l.x,ay:l.y});
   return {mode:s.datos.modo,kit:Object.fromEntries(['lmb','rmb','q','e'].map(k=>[k,{name:l.kit[k]?.nombre,pending:l.kit[k]?.pendiente,cost:l.kit[k]?.coste}])),energy:l.energia,buttons:s.panelTactil.botones.map(b=>b.slot)};
  });
  console.log('ARENA_INITIAL',JSON.stringify(before));
  assert.equal(before.mode,'cpu');assert.ok(before.buttons.includes('rmb')&&before.buttons.includes('q'));
  assert.equal(before.kit.rmb.pending,false);assert.equal(before.kit.q.pending,false);
  for(const slot of ['rmb','q']){
   const beforeUses=await page.evaluate(slot=>{
    const scene=window.__pt2Game.scene.getScene('combate'),p=scene.luchadores[0];
    p.energia=100;p.cd[slot]=0;p.accion=null;p.dash=null;p.est={};p.dolorHasta=-1;p.ko=false;
    scene.pausado=false;scene.pausaGolpe=0;scene.fase='lucha';
    return p.stats.usosSlot?.[slot]||0;
   },slot);
   await page.evaluate(slot=>{
    const p=window.__pt2Game.scene.getScene('combate').panelTactil;
    const b=p.botones.find(x=>x.slot===slot),at=p.pos(b);
    // Convert UI-world button center back to the real screen-pointer space.
    const origin=p.punto({x:0,y:0}),unit=p.punto({x:1,y:1});
    const pointer={id:91,x:(at.x-origin.x)/(unit.x-origin.x),y:(at.y-origin.y)/(unit.y-origin.y)};
    p.abajo(pointer);
    const read=p.controle?null:p.leer(x=>({ax:x.x,ay:x.y}));
    console.log('TOUCH_POINTER',JSON.stringify({slot,at,origin,unit,pointer,mapped:p.punto(pointer),pressed:[...p.pulsados],readKeys:{rmb:read.rmb,q:read.q}}));
   },slot);
   await page.waitForTimeout(400);
   const after=await page.evaluate(slot=>{
    const s=window.__pt2Game.scene.getScene('combate'),l=s.luchadores[0];
    s.panelTactil.arriba({id:91});
    return {uses:l.stats.usosSlot?.[slot]||0,energy:l.energia,cd:l.cd[slot],phase:s.fase};
   },slot);
   console.log('ARENA_BUTTON',slot,JSON.stringify({beforeUses,after}));
   assert.ok(after.uses>beforeUses,slot+' real touch must execute its real attack');
  }
  assert.deepEqual(errors,[]);
  console.log('PASS native Koffing Acid and Sludge Bomb mobile touch in VS CPU');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
