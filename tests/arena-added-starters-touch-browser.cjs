'use strict';
// Browser regression: the original touch UI must execute all three secondary
// slots for every early-route Kanto starter/added species. Does not touch saves.
const assert=require('node:assert/strict'),fsp=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve('_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const pathname=new URL(req.url||'/', 'http://127.0.0.1:4289').pathname;
 const file=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('no');}
 try{const bytes=await fsp.readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(bytes);}catch{res.writeHead(404);res.end('missing');}
});
const starters=['bulbasaur','charmander','squirtle','pidgey','rattata','caterpie','weedle','pikachu','spearow','nidoran-f','nidoran-m','mankey','geodude'];
(async()=>{
 await new Promise(ok=>server.listen(4289,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
  page.on('pageerror',x=>errors.push(String(x)));
  await page.goto('http://127.0.0.1:4289/arena2d/');
  await page.waitForFunction(()=>window.__pt2Started&&window.__pt2Game?.scene.isActive('titulo'),null,{timeout:45000});
  let total=0;
  for(const species of starters){
   await page.evaluate(id=>{
    const game=window.__pt2Game;
    game.scene.getScene('titulo').scene.start('combate',{modo:'cpu',p1:id,p2:'lapras',mandos:['tactil','pad0'],nivel:'normal'});
   },species);
   await page.waitForFunction(id=>{
    const game=window.__pt2Game,scene=game.scene.getScene('combate');
    return game.scene.isActive('combate')&&scene.panelTactil&&scene.fase==='lucha'&&scene.luchadores[0]?.def?.id===id;
   },species,{timeout:25000});
   const initial=await page.evaluate(()=>{
    const s=window.__pt2Game.scene.getScene('combate'),me=s.luchadores[0];
    me.inmortal=true;s.luchadores[1].inmortal=true;
    s.controles[1].leer=()=>({mx:0,my:0,ax:me.x,ay:me.y});
    return {id:me.def.id,slots:Object.fromEntries(['lmb','rmb','q','e'].map(slot=>[slot,{name:me.kit[slot]?.nombre,form:me.kit[slot]?.forma,pending:me.kit[slot]?.pendiente}]))};
   });
   for(const slot of ['rmb','q','e']){
    assert.ok(initial.slots[slot]?.form,species+' '+slot+' lacks renderer');
    assert.notEqual(initial.slots[slot]?.pending,true,species+' '+slot+' still level-gated');
    const before=await page.evaluate(slot=>{
     const s=window.__pt2Game.scene.getScene('combate'),me=s.luchadores[0];
     me.energia=100;me.ulti=100;me.cd[slot]=0;me.accion=null;me.animAccion=null;me.dash=null;
     me.est={};me.ko=false;me.dolorHasta=-1;me.ultimoAtaque=-999;me.ultimoBasico=-999;me.calor=0;
     s.pausado=false;s.pausaGolpe=0;s.fase='lucha';
     return me.stats.usosSlot?.[slot]||0;
    },slot);
    await page.evaluate(slot=>{
     const panel=window.__pt2Game.scene.getScene('combate').panelTactil;
     const button=panel.botones.find(b=>b.slot===slot),target=panel.pos(button);
     const origin=panel.punto({x:0,y:0}),unit=panel.punto({x:1,y:1});
     const p={id:66,x:(target.x-origin.x)/(unit.x-origin.x),y:(target.y-origin.y)/(unit.y-origin.y)};
     panel.abajo(p);panel.leer(x=>({ax:x.x,ay:x.y}));
    },slot);
    await page.waitForTimeout(270);
    const after=await page.evaluate(slot=>{
     const s=window.__pt2Game.scene.getScene('combate'),me=s.luchadores[0];
     s.panelTactil.arriba({id:66});
     return {uses:me.stats.usosSlot?.[slot]||0,cd:me.cd[slot],energy:me.energia,ult:me.ulti};
    },slot);
    assert.ok(after.uses>before,species+' '+slot+' ('+initial.slots[slot].name+') did not fire: '+JSON.stringify(after));
    total++;
   }
   console.log('PASS_STARTER_TOUCH',species,JSON.stringify(initial.slots));
   await page.evaluate(()=>window.__pt2Game.scene.getScene('combate').scene.start('titulo'));
   await page.waitForFunction(()=>window.__pt2Game.scene.isActive('titulo'),null,{timeout:10000});
  }
  assert.equal(total,starters.length*3);
  assert.deepEqual(errors,[],'Phaser errors');
  console.log('PASS: '+total+' real Android-style skill button casts for '+starters.length+' Kanto starting species');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
