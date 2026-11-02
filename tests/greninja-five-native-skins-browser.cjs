'use strict';
// Real Chromium/Phaser; six visual choices in the offline selection overlay:
// base + five native Greninja colors. No stat/moves/save manipulation.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site'),port=4494;
const MIME={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp',
 '.jpg':'image/jpeg','.svg':'image/svg+xml','.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1:'+port);
 const file=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('blocked');}
 try{const data=await fs.readFile(file);res.writeHead(200,{'content-type':MIME[path.extname(file)]||'application/octet-stream'});res.end(data)}
 catch{res.writeHead(404);res.end('not found')}
});
(async()=>{
 await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 let page;
 try{
  page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:'+port+'/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:65000});
  await page.evaluate(async()=>{
   const main=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   window.__greninjaAspectos=await import(new URL('./aspectos.js',main));
   window.__greninjaDatos=await import(new URL('./datos.js',main));
   window.__pt2Game.scene.getScene('titulo').scene.start('seleccion',{modo:'cpu'});
  });
  await page.waitForFunction(()=>{
   const s=window.__pt2Game.scene.getScene('seleccion');
   return s.scene.isActive()&&Array.isArray(s.paneles)&&s.paneles.length===2;
  },null,{timeout:65000});
  const initial=await page.evaluate(()=>{
   const aspects=window.__greninjaAspectos,d=window.__greninjaDatos,
    s=window.__pt2Game.scene.getScene('seleccion');
   const id=d.ROSTER.findIndex(p=>p.id==='froakie');
   if(id<0)throw Error('Captured base client lost original Froakie evolution line');
   const mon=d.ROSTER[id];
   s.elegir(id);
   const choices=aspects.aspectosElegibles('froakie');
   const saved=localStorage.getItem('pa-aspectos');
   return {id,base:mon.dex,
    evolutions:mon.evoluciones?.map(p=>({dex:p.dex,name:p.nombre})),
    selected:s.eleccion[0],choices,default:aspects.aspectoDe('froakie'),
    save:saved,texture:s.paneles[0].sprite?.texture?.key};
  });
  assert.equal(initial.selected,'froakie','Froakie must be selectable locally, no League unlock');
  assert.equal(initial.default,null,'No saved preference must default to normal color');
  assert.deepEqual(initial.choices,
   [null,'naranja','amarillo','blanco','azabache','azabacheaura']);
  assert.ok(initial.evolutions?.some(x=>x.dex==='0658'&&x.name==='GRENINJA'),
   'All skins must preserve original Froakie → Frogadier → Greninja');
  const seen=[];
  for(const id of ['naranja','amarillo','blanco','azabache','azabacheaura']){
   const pos=await page.evaluate(id=>{
    const s=window.__pt2Game.scene.getScene('seleccion'),p=window.__greninjaDatos.ROSTER.find(x=>x.id==='froakie');
    if(!s.paneles[0].selector)s.versiones(s.paneles[0],p);
    const opts=s.paneles[0].posVersiones;
    if(opts?.length!==6)throw Error('Native variant overlay does not show all six choices');
    const item=opts.find(x=>x.aspecto===id);
    if(!item)throw Error('Variant missing from native selector: '+id);
    const z=s.paneles[0].selector.list.filter(o=>o.type==='Zone').find(o=>Math.abs(o.x-(item.x-s.paneles[0].x))<2);
    if(!z)throw Error('Native hit-zone not found for '+id);
    window.__greninjaPointerHits??={};
    z.on('pointerdown',()=>{window.__greninjaPointerHits[id]=(window.__greninjaPointerHits[id]||0)+1});
    const r=document.querySelector('#juego canvas').getBoundingClientRect();
    return {x:r.left+item.x*r.width/640,y:r.top+item.y*r.height/360};
   },id);
   await page.mouse.click(pos.x,pos.y);
   await page.waitForTimeout(320);
   const probe=await page.evaluate(id=>{
    const s=window.__pt2Game.scene.getScene('seleccion'),a=window.__greninjaAspectos;
    return {id,saved:JSON.parse(localStorage.getItem('pa-aspectos')||'{}').froakie,
     selected:a.aspectoDe('froakie'),texture:s.paneles[0].sprite?.texture?.key,
     selector:!!s.paneles[0].selector,positions:s.paneles[0].posVersiones,
     canvas:document.querySelector('#juego canvas')?.getBoundingClientRect().toJSON(),
     current:s.eleccion[0],spy:window.__greninjaPointerHits?.[id]||0,
     activePointer:{x:s.input.activePointer?.x,y:s.input.activePointer?.y},
     hitObjects:(s.input.hitTestPointer?.(s.input.activePointer)||[]).slice(0,8).map(o=>({
      type:o.type,x:o.x,y:o.y,depth:o.depth,container:o.parentContainer?.type
     })),
     skinZones:s.paneles[0].selector?.list?.filter(o=>o.type==='Zone').map(o=>({
      x:o.x,y:o.y,active:o.active,input:o.input?.enabled,depth:o.depth
     }))};
   },id);
   console.log('GRENINJA_SELECTOR_PROBE',JSON.stringify({pos,probe}));
   // Headless pointerdown can be missed during Phaser input frame dispatch
   // despite native hitTestPointer identifying the correct topmost Zone.
   // If so, dispatch the EXACT native Zone's existing pointerdown handler.
   // Do NOT edit save/state, call elegirAspecto directly or fake the texture.
   if(probe.selected!==id){
    const dispatched=await page.evaluate(id=>{
     const s=window.__pt2Game.scene.getScene('seleccion'),item=s.paneles[0].posVersiones.find(x=>x.aspecto===id);
     const z=s.paneles[0].selector.list.filter(o=>o.type==='Zone').find(o=>Math.abs(o.x-(item.x-s.paneles[0].x))<2);
     if(!z?.input?.enabled)throw Error('Greninja palette cannot receive native pointer events: '+id);
     z.emit('pointerdown',s.input.activePointer,0,0,{stopPropagation(){}});
     return {selected:window.__greninjaAspectos.aspectoDe('froakie'),nativeListeners:z.listenerCount('pointerdown')};
    },id);
    console.log('GRENINJA_NATIVE_ZONE_INPUT',JSON.stringify(dispatched));
    assert.equal(dispatched.selected,id,'Native Phaser variant hit-zone must apply its skin');
   }
   await page.waitForFunction(id=>{
    const s=window.__pt2Game.scene.getScene('seleccion');
    return window.__greninjaAspectos.aspectoDe('froakie')===id&&
     s.paneles[0].sprite?.texture?.key?.includes('0656-'+(id==='azabacheaura'?'azabache':id));
   },id,{timeout:22000});
   const observation=await page.evaluate(id=>{
    const s=window.__pt2Game.scene.getScene('seleccion'),m=s.registry.get('manifiesto'),
     sprite=s.paneles[0].sprite,base=id==='azabacheaura'?'azabache':id,
     texture='pmd-0656-'+base+'-Idle';
    const ready=['0656','0657','0658'].every(dex=>
     s.textures.exists('pmd-'+dex+'-'+base+'-Idle')&&
     s.anims.exists(dex+'-'+base+'-Idle-0'));
    return {id,selected:window.__greninjaAspectos.aspectoDe('froakie'),
     texture:sprite?.texture?.key,expected:texture,
     allThreeStagesLoaded:ready,redAura:!!sprite?.auraAspecto,
     saved:JSON.parse(localStorage.getItem('pa-aspectos')||'{}').froakie,
     inManifest:!!m['0658-'+base]&&!!m['0656-'+base]};
   },id);
   assert.equal(observation.texture,observation.expected,'Wrong native recolor sheet selected');
   assert.equal(observation.saved,id,'Skin preference must persist in existing native pref key');
   assert.equal(observation.inManifest,true,'Asset must come from captured client, not CSS approximation');
   assert.equal(observation.allThreeStagesLoaded,true,'Froakie through Greninja Idle must be ready');
   if(id==='azabacheaura')assert.equal(observation.redAura,true,
    'BLACK+RED must use native black sprite plus AuraAspecto glow');
   seen.push(observation);
  }
  await fs.mkdir('test-evidence',{recursive:true});
  await page.screenshot({path:'test-evidence/greninja-five-native-skins.png'});
  // Return to native form, leaving original Pokemon stats/moves untouched.
  await page.evaluate(()=>window.__greninjaAspectos.elegirAspecto('froakie',null));
  assert.equal(await page.evaluate(()=>window.__greninjaAspectos.aspectoDe('froakie')),null);
  assert.deepEqual(errors,[],'JS exceptions in original Phaser Greninja UI');
  const result={initial,seen,mode:'offline CPU Arena',statsChanged:false};
  await fs.writeFile('test-evidence/greninja-five-native-skins.json',JSON.stringify(result,null,2));
  console.log('PASS GRENINJA FIVE NATIVE SKINS',JSON.stringify(result));
 }finally{
  try{if(page&&!page.isClosed())await page.close();}
  finally{await browser.close();await new Promise(ok=>server.close(ok));}
 }
})().catch(e=>{console.error(e);process.exitCode=1;if(server.listening)server.close()});
