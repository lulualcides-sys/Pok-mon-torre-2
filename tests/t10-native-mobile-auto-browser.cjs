'use strict';
// T10 real mobile AUTO touch, Arena + Kanto trainer battle.
// Uses the original Phaser controller and native AI; no simulated attack,
// cooldown, movement, victory, EXP, inventory, source effects or player saves.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url||'/','http://127.0.0.1');
 const file=path.resolve(root,'.'+(url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const bytes=await fsp.readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(bytes)}
 catch{res.writeHead(404);res.end('missing')}
});
const report={scope:'T10 native AUTO touch in Arena CPU and solo Kanto campaign',
 fixture:'immortal combatants only avoid test ending; no forced move/hit, damage, victory or XP',
 contexts:[]};
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(ok=>server.listen(4433,'127.0.0.1',ok));
 const browser=await chromium.launch({
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
   '--use-gl=angle','--use-angle=swiftshader']
 });
 const mobile=()=>browser.newPage({viewport:{width:854,height:480},hasTouch:true,isMobile:true});
 const tap=async(page,x,y)=>{
  const p=await page.evaluate(([x,y])=>{
   const canvas=document.querySelector('#juego canvas')||document.querySelector('canvas');
   if(!canvas)throw Error('Native Phaser canvas missing');
   const rect=canvas.getBoundingClientRect();
   return {x:rect.left+x*rect.width/640,y:rect.top+y*rect.height/360};
  },[x,y]);
  assert.ok(p.x>=0&&p.x<=854&&p.y>=0&&p.y<=480,'AUTO outside mobile viewport');
  await page.touchscreen.tap(p.x,p.y);
 };
 const run=async(kind)=>{
  const page=await mobile(),errors=[];
  page.on('pageerror',err=>errors.push(String(err)));
  try{
   await page.goto('http://127.0.0.1:4433/arena2d/?original=1',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
   if(kind==='arena'){
    await page.evaluate(()=>window.__pt2Game.scene.getScene('titulo').scene.start('combate',{
     modo:'cpu',p1:'koffing',p2:'buneary',mandos:['tactil','pad0'],nivel:'normal'
    }));
   }else{
    await page.evaluate(async()=>{
     const src=[...document.scripts].find(x=>x.src?.includes('/main.js')).src;
     const core=window.t10Core=await import(new URL('./torre2/campaign-core.js',src));
     const state=core.createCampaign('bulbasaur');
     core.saveCampaign(state);core.storePokemon(state,1); // Mewtwo stays in PC.
     window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
    });
    await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
     !!window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,null,{timeout:60000});
    const cta=await page.evaluate(()=>{
     const scene=window.__pt2Game.scene.getScene('campanha');
     const z=scene.children.list.find(x=>x.active&&x.input?.enabled&&
      x.getData?.('torre2-central-cta')===true);
     if(!z)throw Error('Campaign entry CTA missing');
     return {x:z.x,y:z.y};
    });
    await tap(page,cta.x,cta.y);
   }
   await page.waitForFunction(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return b.scene.isActive()&&b.fase==='lucha'&&
     !!b.__torre2AutoMode?.zone?.input?.enabled&&!b.__torre2Changing&&
     !b.__torre2BallTransitions&&b.luchadores?.length===2;
   },null,{timeout:75000});
   const initial=await page.evaluate(kind=>{
    const b=window.__pt2Game.scene.getScene('combate'),a=b.__torre2AutoMode;
    b.luchadores.forEach(actor=>{actor.inmortal=true;});
    const player=b.luchadores[0];
    const originalAI=a.ai.leer.bind(a.ai);
    a.__t10Calls=0;
    a.ai.leer=(...args)=>{a.__t10Calls++;return originalAI(...args);};
    window.__t10Context={a,control:a.control,originalReader:a.read};
    const save=kind==='campaign'?window.t10Core.readCampaign():null;
    return {enabled:a.enabled,text:a.label.text,controlIsPlayer:a.control.l===player,
     ownController:a.control===b.controles[0],initialCalls:a.__t10Calls,
     species:player.def.id,kit:JSON.stringify(player.kit),
     position:[a.zone.x,a.zone.y],nativeAI:typeof originalAI==='function',
     save:save?{wins:save.wins,losses:save.losses,stage:save.stage,trainer:save.trainer,
      money:save.money,items:save.inventory,party:save.team.map(m=>m.uid)}:null};
   },kind);
   // Arena original starts manual, but Kanto campaign now starts AUTO ON.
   const defaultOn=kind==='campaign';
   assert.equal(initial.enabled,defaultOn,kind+' native default must be preserved');
   assert.equal(initial.text,defaultOn?'AUTO ✓':'AUTO');
   assert.equal(initial.initialCalls,0,'Instrumentation installed after startup');
   assert.ok(initial.controlIsPlayer&&initial.ownController,'AUTO must control human only');
   assert.ok(initial.nativeAI);
   // Tapping the already-on Kanto AUTO would turn it OFF; only Arena
   // requires the first touch. Confirm the native IA reads actual frames.
   if(!defaultOn)await tap(page,initial.position[0],initial.position[1]);
   await page.waitForFunction(()=>{
    const a=window.__pt2Game.scene.getScene('combate').__torre2AutoMode;
    return a?.enabled&&a.__t10Calls>0;
   },null,{timeout:10000});
   const on=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate'),a=b.__torre2AutoMode;
    return {enabled:a.enabled,text:a.label.text,calls:a.__t10Calls,
     kit:JSON.stringify(b.luchadores[0].kit),
     cooldowns:{...b.luchadores[0].cd},readerIsOriginal:a.control.leer===a.read};
   });
   assert.ok(on.enabled&&on.calls>0,'Real native AI must be invoked while AUTO is ON');
   assert.equal(on.readerIsOriginal,false,'AUTO wrapper must take over native human input');
   assert.equal(on.kit,initial.kit,'AUTO must not overwrite approved attacks or cooldown metadata');
   assert.ok(Object.values(on.cooldowns).every(x=>Number.isFinite(x)),'Live cooldowns must be finite');
   await page.screenshot({path:'test-evidence/t10-mobile-'+kind+'-auto-on.png'});
   await tap(page,initial.position[0],initial.position[1]);
   const off=await page.evaluate(()=>{
    const a=window.__pt2Game.scene.getScene('combate').__torre2AutoMode;
    return {enabled:a.enabled,text:a.label.text,calls:a.__t10Calls};
   });
   assert.equal(off.enabled,false,'One native touch must disable active AUTO in either mode');
   assert.equal(off.text,'AUTO');
   await page.waitForTimeout(400);
   const later=await page.evaluate(kind=>{
    const b=window.__pt2Game.scene.getScene('combate'),a=b.__torre2AutoMode;
    const save=kind==='campaign'?window.t10Core.readCampaign():null;
    return {enabled:a.enabled,calls:a.__t10Calls,
     kit:JSON.stringify(b.luchadores[0].kit),phase:b.fase,
     save:save?{wins:save.wins,losses:save.losses,stage:save.stage,trainer:save.trainer,
      money:save.money,items:save.inventory,party:save.team.map(m=>m.uid)}:null};
   },kind);
   assert.equal(later.enabled,false);
   assert.equal(later.calls,off.calls,'Native AI must no longer be read once AUTO is OFF');
   assert.equal(later.kit,initial.kit,'Toggling AUTO must not mutate moves');
   if(kind==='campaign')assert.deepEqual(later.save,initial.save,
    'AUTO must not spend items, alter money, move party UID or manufacture a victory');
   await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    b.scene.start('titulo');
   });
   await page.waitForFunction(()=>window.__t10Context?.a?.cleaned===true,null,{timeout:12000});
   const cleanup=await page.evaluate(()=>({
    cleaned:window.__t10Context.a.cleaned,
    originalRestored:window.__t10Context.control.leer===window.__t10Context.originalReader
   }));
   assert.ok(cleanup.cleaned&&cleanup.originalRestored,'Scene shutdown must restore exact original controller');
   assert.deepEqual(errors,[],'No Phaser runtime errors');
   const result={kind,initial:{...initial,kitLength:initial.kit.length,kit:undefined},
    on:{...on,kit:undefined},off,later:{...later,kit:undefined},cleanup};
   report.contexts.push(result);
   console.log('T10 NATIVE MOBILE AUTO PASS',kind,JSON.stringify({on:on.calls,off:off.calls,cleanup}));
  }finally{await page.close()}
 };
 try{
  await run('arena');
  await run('campaign');
  fs.writeFileSync('test-evidence/t10-mobile-native-auto.json',JSON.stringify(report,null,2));
 }finally{await browser.close();server.close();}
})().catch(err=>{console.error(err);process.exitCode=1;server.close()});
