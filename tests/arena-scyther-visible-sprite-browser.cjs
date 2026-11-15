'use strict';
// End-to-end real native Phaser check of reported six-slot Arena LOADING,
// Scyther #0123 -> licensed Scizor #0212 battle sprite, and lazy Pokédex.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const MIME={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg',
 '.ogg':'audio/ogg','.mp3':'audio/mpeg','.woff2':'font/woff2'};
const server=http.createServer(async(req,res)=>{
 const pathname=new URL(req.url,'http://127.0.0.1').pathname;
 const file=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('denied');}
 try{const b=await fs.readFile(file);res.writeHead(200,{'content-type':MIME[path.extname(file)]||'application/octet-stream'});res.end(b);}
 catch{res.writeHead(404);res.end('not found');}
});
(async()=>{
 await new Promise(resolve=>server.listen(4439,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
   '--use-gl=angle','--use-angle=swiftshader']});
 const evidence={};const pages=[];
 try{
  const makePage=async opts=>{
   const p=await browser.newPage(opts),errs=[];
   p.on('pageerror',e=>errs.push(String(e)));
   pages.push(p);
   await p.goto('http://127.0.0.1:4439/arena2d/?original=1',{waitUntil:'domcontentloaded'});
   await p.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
   return {p,errs};
  };
  // EXACTLY the real six CPU slots in the user's screenshot, not synthetic cards.
  const {p,errs}=await makePage({viewport:{width:1120,height:720}});
  const ids=['murkrow','scyther','voltorb','lanturn','clefairy','ho-oh'];
  await p.evaluate(ids=>window.__pt2Game.scene.getScene('titulo').scene.start(
   'preparar',{previo:{jugadores:ids.map(id=>({id,disp:'cpu'}))}}),ids);
  await p.waitForFunction(()=>window.__pt2Game?.scene.isActive('preparar')&&
   window.__pt2Game.scene.getScene('preparar').tarjetas?.length===6,
   null,{timeout:30000});
  await p.waitForFunction(()=>{
   const s=window.__pt2Game.scene.getScene('preparar');
   return s.tarjetas.every(t=>{
    const dex=s.plazas[t.i]&&s.registry.get('manifiesto')&&
      window.__pt2ArenaSpritesById?.[s.plazas[t.i].id];
    return t.contenido?.list?.some(o=>String(o.texture?.key||'').startsWith('pmd-')&&
      String(o.texture?.key||'').endsWith('-Idle')&&o.active);
   });
  },null,{timeout:50000}).catch(async e=>{
   const diagnostics=await p.evaluate(()=>{
    const s=window.__pt2Game?.scene.getScene('preparar');
    return s?.tarjetas?.map(t=>({id:s.plazas[t.i]?.id,
     dex:t.contenido?.list?.find(o=>o.texture?.key?.startsWith('pmd-'))?.texture?.key,
     labels:t.contenido?.list?.filter(o=>typeof o.text==='string').map(o=>o.text),
     queued:[...s.__torre2PreviewQueued||[]],
     failure:[...(s.__torre2PreviewFailedAt||new Map()).keys()]}));
   });
   throw Error('Arena six CPU slots still have unloaded sprites: '+JSON.stringify(diagnostics)+'; '+e);
  });
  evidence.sixSlots=await p.evaluate(()=>{
   const s=window.__pt2Game.scene.getScene('preparar');
   return s.tarjetas.map(t=>({id:s.plazas[t.i].id,
    sprite:t.contenido.list.find(o=>String(o.texture?.key||'').startsWith('pmd-'))?.texture?.key}));
  });
  assert.equal(evidence.sixSlots.length,6);
  assert.deepEqual(errs,[],'Arena introduced JavaScript errors');
  console.log('PASS_ARENA_SIX_IDLE_SPRITES',JSON.stringify(evidence.sixSlots));

  const dex=await makePage({viewport:{width:1100,height:700}});
  const before=await dex.p.evaluate(()=>performance.getEntriesByType('resource')
   .filter(r=>r.name.includes('/assets/pmd/')&&r.name.endsWith('/Idle-Anim.png')).length);
  await dex.p.evaluate(()=>window.__pt2Game.scene.getScene('titulo').scene.start('pokedex',{id:'scyther'}));
  await dex.p.waitForFunction(()=>window.__pt2Game?.scene.isActive('pokedex')&&
   window.__pt2Game.scene.getScene('pokedex').casillas?.length>25,
   null,{timeout:50000});
  await dex.p.waitForTimeout(1200);
  evidence.pokedex=await dex.p.evaluate(before=>{
   const s=window.__pt2Game.scene.getScene('pokedex');
   const after=performance.getEntriesByType('resource')
    .filter(r=>r.name.includes('/assets/pmd/')&&r.name.endsWith('/Idle-Anim.png')).length;
   return {total:s.casillas.length,visible:s.casillas.filter(c=>c.g&&c.zone&&c.img).length,
    stageNames:s.etapas?.map(e=>e.nombre)||[],newIdleDownloads:after-before};
  },before);
  assert.ok(evidence.pokedex.total>=251);
  assert.ok(evidence.pokedex.visible<=25&&evidence.pokedex.visible>0);
  assert.ok(evidence.pokedex.stageNames.includes('SCIZOR'),
   'Scyther Pokédex must offer the genuine Scizor evolution');
  assert.ok(evidence.pokedex.newIdleDownloads<12,
   'Opening the Pokédex must not preload 25 large animated sprite sheets');
  assert.deepEqual(dex.errs,[]);
  console.log('PASS_POKEDEX_PORTRAIT_PRIORITY',JSON.stringify(evidence.pokedex));

  const mobile=await makePage({viewport:{width:740,height:414},isMobile:true,hasTouch:true});
  await mobile.p.evaluate(()=>window.__pt2Game.scene.getScene('titulo').scene.start('combate',
   {modo:'cpu',p1:'scyther',p2:'joltik',mandos:['tactil','pad0'],nivel:'facil'}));
  await mobile.p.waitForFunction(()=>{
   const s=window.__pt2Game.scene.getScene('combate');
   return s.scene.isActive()&&s.fase==='lucha'&&s.luchadores?.[0]?.def?.id==='scyther';
  },null,{timeout:55000});
  const pre=await mobile.p.evaluate(()=>{
   const s=window.__pt2Game.scene.getScene('combate'),me=s.luchadores[0];
   me.inmortal=true;s.luchadores[1].inmortal=true;
   if(s.controles[1])s.controles[1].leer=()=>({mx:0,my:0,ax:0,ay:0});
   me.exp=me.expNecesaria;me.accion=null;me.dash=null;me.ko=false;
   s.fase='lucha';s.pausado=false;
   const p=s.panelTactil,b=p.botones.find(x=>x.slot==='mega');
   if(!b)throw Error('No real mobile EVO input');
   const at=p.pos(b),o=p.punto({x:0,y:0}),unit=p.punto({x:1,y:1});
   p.abajo({id:94,x:(at.x-o.x)/(unit.x-o.x),y:(at.y-o.y)/(unit.y-o.y)});
   p.leer(v=>({ax:v.x,ay:v.y}));
   return{stage:me.etapa,canEvolve:me.puedeEvolucionar,forms:me.def.evoluciones?.map(e=>e.nombre)};
  });
  assert.ok(pre.canEvolve,'Scyther should be able to evolve after real EXP');
  assert.deepEqual(pre.forms,['SCIZOR']);
  await mobile.p.waitForFunction(stage=>{
   const me=window.__pt2Game.scene.getScene('combate').luchadores[0];
   return me.etapa>stage&&Number(me.dexActual)===212&&
    String(me.spr?.texture?.key||'').includes('0212');
  },pre.stage,{timeout:16000});
  evidence.evolution=await mobile.p.evaluate(()=>{
   const s=window.__pt2Game.scene.getScene('combate'),me=s.luchadores[0];
   s.panelTactil.arriba({id:94});
   return {from:'scyther',to:me.forma.nombre,dex:me.dexActual,
    texture:me.spr?.texture?.key,kit:me.kit?.lmb?.nombre,
    sync:me.__torre2BranchSpriteSync||0};
  });
  assert.equal(evidence.evolution.to,'SCIZOR');
  assert.ok(evidence.evolution.kit);
  assert.deepEqual(mobile.errs,[],'Scyther battle evolved with no JS exception');
  console.log('PASS_SCYTHER_SCIZOR_REAL_MOBILE_EVOLUTION',JSON.stringify(evidence.evolution));
 }finally{
  await fs.mkdir('test-evidence',{recursive:true});
  await fs.writeFile('test-evidence/arena-scyther-pokedex-0713.json',
   JSON.stringify({release:'0.71.3',...evidence},null,2)+'\n');
  for(const p of pages)await p.close().catch(()=>{});
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
