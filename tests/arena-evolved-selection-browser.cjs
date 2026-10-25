'use strict';
// Real Chromium/WebGL regression of Arena roster, selection and evolved
// skills. No writes to campaign, no changes to approved attack effects.
const assert=require('node:assert/strict'),fsp=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.ogg':'audio/ogg','.mp3':'audio/mpeg','.wav':'audio/wav'};
const server=http.createServer(async(req,res)=>{
 const p=new URL(req.url,'http://127.0.0.1:4291').pathname,filename=path.resolve(root,'.'+(p.endsWith('/')?p+'index.html':p));
 if(!filename.startsWith(root+path.sep)){res.writeHead(403);return res.end('denied');}
 try{const buf=await fsp.readFile(filename);res.writeHead(200,{'content-type':mime[path.extname(filename)]||'application/octet-stream'});res.end(buf);}
 catch{res.writeHead(404);res.end('not found');}
});
(async()=>{
 await new Promise(ok=>server.listen(4291,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 await page.goto('http://127.0.0.1:4291/arena2d/');
 try{await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:45000});}
 catch(error){
  const diag=await page.evaluate(()=>({title:document.title,body:document.body?.innerText?.slice(0,1000),start:window.__pt2Started,game:!!window.__pt2Game,scenes:window.__pt2Game?.scene.scenes.map(s=>({key:s.scene.key,active:s.scene.isActive()}))})).catch(e=>({error:String(e)}));
  console.error('STARTUP_DIAGNOSTICS',JSON.stringify({errors,diag}));throw error;
 }
 // Inspect generated code, including not-yet-loaded evolved forms.
 const kits=await page.evaluate(async()=>{
  const url=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
  const u=new URL('./',url);
  const [{ROSTER,ROLES,buscar},{Luchador}]=await Promise.all([import(new URL('./datos.js',u)),import(new URL('./luchador.js',u))]);
  const badRoles=ROSTER.filter(p=>!ROLES[p.rol]).map(p=>({id:p.id,role:p.rol}));
  const data={};
  for(const id of ['oddish','gloom','vileplume','magikarp','gyarados','joltik','ditto']){
   const {def,etapa}=buscar(id);
   const f=Object.create(Luchador.prototype);
   f.def=def;f.etapa=etapa;f.mega=false;f.jefe=null;f.aspecto=null;f.lado=0;f.escena={datos:{modo:'cpu'}};
   const resolved=f.kitActual();
   data[id]={role:def.rol,stage:etapa,
    slots:Object.fromEntries(['lmb','rmb','q','e'].map(k=>[k,{native:!!def.kit[k],evolved:!!f.forma.kit?.[k],name:resolved[k]?.nombre||'',pending:resolved[k]?.pendiente===true}]))};
  }
  return {badRoles,data};
 });
 console.log('EVOLUTION_KITS',JSON.stringify(kits));
 assert.deepEqual(kits.badRoles,[],'Every Kanto roster role must render in selection');
 for(const name of ['oddish','gloom','vileplume','gyarados']){
  for(const k of ['lmb','rmb','q','e'])assert.ok(kits.data[name].slots[k].name,name+' '+k+' must be available outside campaign');
 }
 assert.ok(kits.data.gyarados.slots.e.evolved,'Test must include an evolved form with own finisher');
 assert.equal(kits.data.gyarados.slots.e.pending,false);
 // Real selection screen, not just roster data.
 await page.evaluate(()=>window.__pt2Game.scene.getScene('titulo').scene.start('seleccion',{previo:{modo:'cpu',p1:'oddish'}}));
 await page.waitForFunction(()=>window.__pt2Game.scene.isActive('seleccion')&&window.__pt2Game.scene.getScene('seleccion').paneles?.[0]?.contenido,null,{timeout:35000});
 const selection=await page.evaluate(()=>{
  const scene=window.__pt2Game.scene.getScene('seleccion');
  const read=()=>({shown:scene.paneles[0].mostrado,labels:scene.paneles[0].contenido.list.filter(o=>typeof o.text==='string').map(o=>o.text)});
  const oddish=read();
  const id=scene.casillas.findIndex(c=>c.p?.id==='magikarp');
  if(id<0)throw Error('Magikarp not selectable');
  scene.foco=id;scene.refrescar();
  const magikarp=read();
  return {oddish,magikarp};
 });
 console.log('SELECTION_LABELS',JSON.stringify(selection));
 assert.equal(selection.oddish.shown,'oddish');
 assert.ok(selection.oddish.labels.some(x=>/EVO:/i.test(x)),'Oddish evolution must render');
 assert.ok(selection.oddish.labels.some(x=>/ACID|ABSORB|PETAL|POISON/i.test(x)),'Oddish abilities must render');
 assert.ok(selection.oddish.labels.some(x=>/RANGED/i.test(x)),'Oddish native role must render');
 assert.equal(selection.magikarp.shown,'magikarp');
 assert.ok(selection.magikarp.labels.some(x=>/EVOL|EVO:/i.test(x)),'Magikarp evolution must render');
 // Evolve via actual combat touch EVO button, not direct kit assignment.
 await page.evaluate(()=>window.__pt2Game.scene.getScene('seleccion').scene.start('combate',{modo:'cpu',p1:'magikarp',p2:'joltik',mandos:['tactil','pad0'],nivel:'facil'}));
 await page.waitForFunction(()=>window.__pt2Game.scene.isActive('combate')&&window.__pt2Game.scene.getScene('combate').fase==='lucha',null,{timeout:30000});
 const before=await page.evaluate(()=>{
  const scene=window.__pt2Game.scene.getScene('combate'),me=scene.luchadores[0];
  scene.luchadores[1].inmortal=true;
  scene.controles[1].leer=()=>({mx:0,my:0,ax:me.x,ay:me.y});
  me.inmortal=true;
  me.exp=me.expNecesaria;
  return {stage:me.etapa,canEvolve:me.puedeEvolucionar,kit:Object.fromEntries(['lmb','rmb','q','e'].map(k=>[k,me.kit[k]?.nombre||null])),touchSlots:scene.panelTactil?.botones.map(b=>b.slot)};
 });
 console.log('BEFORE_EVOLUTION',JSON.stringify(before));
 assert.equal(before.canEvolve,true);
 assert.ok(before.touchSlots.includes('mega'));
 await page.evaluate(()=>{
  const scene=window.__pt2Game.scene.getScene('combate'),panel=scene.panelTactil,b=panel.botones.find(b=>b.slot==='mega');
  const at=panel.pos(b),zero=panel.punto({x:0,y:0}),unit=panel.punto({x:1,y:1});
  const p={id:77,x:(at.x-zero.x)/(unit.x-zero.x),y:(at.y-zero.y)/(unit.y-zero.y)};
  panel.abajo(p);panel.leer(x=>({ax:x.x,ay:x.y}));
 });
 await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').luchadores[0].etapa===1,null,{timeout:10000});
 const after=await page.evaluate(()=>{
  const scene=window.__pt2Game.scene.getScene('combate'),me=scene.luchadores[0];
  scene.panelTactil.arriba({id:77});
  return {stage:me.etapa,form:me.forma.nombre,kit:Object.fromEntries(['lmb','rmb','q','e'].map(k=>[k,{name:me.kit[k]?.nombre||'',pending:me.kit[k]?.pendiente===true}])),buttons:scene.panelTactil.botones.map(b=>b.slot)};
 });
 console.log('AFTER_EVOLUTION',JSON.stringify(after));
 assert.equal(after.stage,1);
 for(const slot of ['lmb','rmb','q','e']){assert.ok(after.kit[slot].name,slot+' must survive evolution');assert.equal(after.kit[slot].pending,false)}
 for(const slot of ['rmb','q']){
  const prior=await page.evaluate(slot=>{
   const s=window.__pt2Game.scene.getScene('combate'),a=s.luchadores[0];
   a.energia=100;a.ulti=100;a.cd[slot]=0;a.accion=null;a.ko=false;a.est={};a.dash=null;s.fase='lucha';
   return a.stats.usosSlot?.[slot]||0;
  },slot);
  await page.evaluate(slot=>{
   const p=window.__pt2Game.scene.getScene('combate').panelTactil,b=p.botones.find(x=>x.slot===slot),xy=p.pos(b),zero=p.punto({x:0,y:0}),one=p.punto({x:1,y:1});
   p.abajo({id:83,x:(xy.x-zero.x)/(one.x-zero.x),y:(xy.y-zero.y)/(one.y-zero.y)});
   p.leer(x=>({ax:x.x,ay:x.y}));
  },slot);
  await page.waitForTimeout(350);
  const uses=await page.evaluate(()=>{const s=window.__pt2Game.scene.getScene('combate');s.panelTactil.arriba({id:83});return s.luchadores[0].stats.usosSlot});
  console.log('EVOLVED_TOUCH',slot,JSON.stringify({before:prior,after:uses[slot]}));
  assert.ok((uses[slot]||0)>prior,'Touch '+slot+' must cast after evolution');
 }
 assert.deepEqual(errors,[],'No uncaught browser errors');
 console.log('PASS selected Oddish sheet, Kanto roles, Gyarados evolution-only moves and post-evolution mobile casts');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
