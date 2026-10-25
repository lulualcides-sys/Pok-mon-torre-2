'use strict';
// Pre-evolution-only test: intentionally NO evolution during the combat.
// Exercises the actual mobile SKL/Q/ULT input and verifies roster base kits.
const assert=require('node:assert/strict'),fsp=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve('_site'),port=4296,mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1:'+port),target=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!target.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden');}
 try{const bytes=await fsp.readFile(target);res.writeHead(200,{'content-type':mime[path.extname(target)]||'application/octet-stream'});res.end(bytes)}catch{res.writeHead(404);res.end('missing')}
});
const species=['oddish','koffing','pidgey','rattata','magikarp','joltik'];
(async()=>{
 await new Promise(ok=>server.listen(port,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),pageErrors=[];
 page.on('pageerror',e=>pageErrors.push(String(e)));
 await page.goto('http://127.0.0.1:'+port+'/arena2d/');
 await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:50000});
 const audit=await page.evaluate(async()=>{
  const src=[...document.scripts].find(e=>e.src?.includes('/main.js')).src,dir=new URL('./',src);
  const [{ROSTER},{Luchador}]=await Promise.all([import(new URL('./datos.js',dir)),import(new URL('./luchador.js',dir))]);
  return ROSTER.map(def=>{
   const f=Object.create(Luchador.prototype);f.def=def;f.etapa=0;f.mega=false;f.jefe=null;f.aspecto=null;f.lado=0;f.escena={datos:{modo:'cpu'}};const kit=f.kitActual();
   return {id:def.id,evolutions:def.evoluciones?.map(x=>x.nombre)||[],slots:Object.fromEntries(['lmb','rmb','q','e'].map(slot=>[slot,{name:kit[slot]?.nombre||'',form:kit[slot]?.forma||'',pending:kit[slot]?.pendiente===true,cost:kit[slot]?.coste??0}]))};
  });
 });
 const missing=audit.filter(x=>['lmb','rmb','q','e'].some(k=>!x.slots[k].form));
 const locked=audit.filter(x=>['lmb','rmb','q','e'].some(k=>x.slots[k].pending));
 console.log('BASE_ROSTER_AUDIT',JSON.stringify({total:audit.length,missing,locked,examples:audit.filter(x=>species.includes(x.id)).map(x=>({id:x.id,slots:x.slots}))}));
 const results=[];
 for(const id of species){
  const info=audit.find(x=>x.id===id);
  if(!info){results.push({id,error:'MISSING_FROM_ROSTER'});continue}
  if(['lmb','rmb','q','e'].some(k=>!info.slots[k].form)){results.push({id,error:'MISSING_KIT_SLOT',slots:info.slots});continue}
  try{
   await page.evaluate(x=>window.__pt2Game.scene.getScene('titulo').scene.start('combate',{modo:'cpu',p1:x,p2:'lapras',mandos:['tactil','pad0'],nivel:'facil'}),id);
   await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('combate')&&window.__pt2Game.scene.getScene('combate').fase==='lucha'&&window.__pt2Game.scene.getScene('combate').panelTactil,null,{timeout:18000});
   await page.evaluate(()=>{
    const s=window.__pt2Game.scene.getScene('combate'),me=s.luchadores[0];
    me.inmortal=true;s.luchadores[1].inmortal=true;
    s.controles[1].leer=()=>({mx:0,my:0,ax:me.x,ay:me.y});
   });
   for(const slot of ['rmb','q','e']){
    const initial=await page.evaluate(k=>{
     const scene=window.__pt2Game.scene.getScene('combate'),me=scene.luchadores[0];
     me.energia=100;me.ulti=100;me.cd[k]=0;me.accion=null;me.animAccion=null;me.dash=null;me.ko=false;me.est={};me.dolorHasta=-1;me.ultimoAtaque=-100;me.ultimoBasico=-100;me.sobrecargaHasta=0;scene.pausado=false;scene.pausaGolpe=0;scene.fase='lucha';
     return {form:me.forma.nombre,stage:me.etapa,name:me.kit[k]?.nombre,formId:me.kit[k]?.forma,pending:me.kit[k]?.pendiente,prior:me.stats.usosSlot?.[k]||0,buttons:scene.panelTactil.botones.map(b=>b.slot)};
    },slot);
    await page.evaluate(k=>{
     const p=window.__pt2Game.scene.getScene('combate').panelTactil,b=p.botones.find(x=>x.slot===k),pos=p.pos(b),base=p.punto({x:0,y:0}),unit=p.punto({x:1,y:1});
     const touch={id:76,x:(pos.x-base.x)/(unit.x-base.x),y:(pos.y-base.y)/(unit.y-base.y)};
     p.abajo(touch);p.leer(x=>({ax:x.x,ay:x.y}));
    },slot);
    await page.waitForTimeout(260);
    const after=await page.evaluate(k=>{
     const s=window.__pt2Game.scene.getScene('combate'),me=s.luchadores[0];s.panelTactil.arriba({id:76});
     return {uses:me.stats.usosSlot?.[k]||0,cd:me.cd[k],energy:me.energia,ult:me.ulti,stage:me.etapa};
    },slot);
    console.log('BASE_FORM_CAST',JSON.stringify({id,slot,initial,after}));results.push({id,slot,initial:{stage:initial.stage,form:initial.form,attack:initial.name,renderer:initial.formId,pending:initial.pending},used:after.uses>initial.prior,after});
   }
   await page.evaluate(()=>window.__pt2Game.scene.getScene('combate').scene.start('titulo'));
   await page.waitForFunction(()=>window.__pt2Game.scene.isActive('titulo'),null,{timeout:10000});
  }catch(e){results.push({id,error:String(e).slice(0,280)});try{await page.evaluate(()=>window.__pt2Game.scene.getScene('combate').scene.start('titulo'))}catch{}}
 }
 const failures=results.filter(x=>x.error||x.used===false);
 console.log('BASE_TOUCH_RESULTS',JSON.stringify({tested:species.length,casts:results.filter(x=>x.slot).length,failures,passes:results.filter(x=>x.used).length,pageErrors:pageErrors.slice(-15)}));
 assert.deepEqual(failures,[],'All starting-form special touch skills must actually cast');
 assert.deepEqual(pageErrors,[],'No uncaught Phaser errors');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
