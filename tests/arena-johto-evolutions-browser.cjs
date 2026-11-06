'use strict';
// Real Phaser/Chromium battle evolution, not a roster-only assertion.
const assert=require('node:assert/strict'),fs=require('node:fs'),
 fsp=require('node:fs/promises'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg',
 '.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2',
 '.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const pathname=new URL(req.url,'http://127.0.0.1').pathname;
 const filename=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
 if(!filename.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const bytes=await fsp.readFile(filename);
  res.writeHead(200,{'content-type':mime[path.extname(filename)]||'application/octet-stream'});
  res.end(bytes)
 }catch{res.writeHead(404);res.end('not found')}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(done=>server.listen(4386,'127.0.0.1',done));
 const browser=await chromium.launch({
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:740,height:414},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4386/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  let priorBattles=0;
  async function battle(id){
   // Each combat scene owns physics, timers and loaders. Recycling the same
   // active scene across Magby, Eevee and Togepi can retain end-of-round
   // callbacks and cause false timeouts. Use a fresh title-to-battle lifecycle
   // for each species as a mobile player would.
   if(priorBattles++){
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),
     null,{timeout:60000});
   }
   await page.evaluate(id=>window.__pt2Game.scene.start('combate',
    {modo:'cpu',p1:id,p2:'joltik',mandos:['tactil','pad0'],nivel:'facil'}),id);
   await page.waitForFunction(id=>{
    const s=window.__pt2Game.scene.getScene('combate');
    return s.scene.isActive()&&s.fase==='lucha'&&s.luchadores?.[0]?.def?.id===id;
   },id,{timeout:50000}).catch(async error=>{
    const diagnostics=await page.evaluate(()=>{
     const s=window.__pt2Game?.scene.getScene('combate');
     return {status:s?.sys?.settings?.status,active:s?.scene?.isActive(),
      phase:s?.fase,sceneData:s?.datos?.p1,
      own:s?.luchadores?.[0]?.def?.id,other:s?.luchadores?.[1]?.def?.id};
    });
    throw new Error('Mobile Arena failed to start '+id+': '+
     JSON.stringify(diagnostics)+'; '+error);
   });
   const state=await page.evaluate(()=>{
    const s=window.__pt2Game.scene.getScene('combate'),me=s.luchadores[0];
    me.inmortal=true;s.luchadores[1].inmortal=true;
    if(s.controles[1])s.controles[1].leer=()=>({mx:0,my:0,ax:0,ay:0});
    return {name:me.nombre,stages:me.def.evoluciones?.map(e=>e.nombre),
     buttons:s.panelTactil?.botones?.map(x=>x.slot)};
   });
   assert.ok(state.buttons?.includes('mega'),'Native mobile EVO button missing: '+id);
   return state;
  }
  async function evo(){
   const pre=await page.evaluate(()=>{
    const s=window.__pt2Game.scene.getScene('combate'),me=s.luchadores[0];
    me.exp=me.expNecesaria;me.accion=null;me.dash=null;me.ko=false;
    s.fase='lucha';s.pausado=false;
    const p=s.panelTactil,b=p.botones.find(x=>x.slot==='mega');
    const at=p.pos(b),o=p.punto({x:0,y:0}),unit=p.punto({x:1,y:1});
    p.abajo({id:90,x:(at.x-o.x)/(unit.x-o.x),y:(at.y-o.y)/(unit.y-o.y)});
    p.leer(v=>({ax:v.x,ay:v.y}));
    return {stage:me.etapa,threshold:me.expNecesaria,can:me.puedeEvolucionar};
   });
   assert.ok(pre.can,'Native EXP threshold does not enable evolution '+JSON.stringify(pre));
   // Eevee's five branches occupy stage indexes 1–5. Await ANY legal
   // evolution, then assert the selected form by name below.
   await page.waitForFunction(n=>window.__pt2Game.scene.getScene('combate').luchadores[0].etapa>n,
    pre.stage,{timeout:12000});
   return page.evaluate(()=>{
    const s=window.__pt2Game.scene.getScene('combate'),me=s.luchadores[0];
    s.panelTactil.arriba({id:90});
    return{stage:me.etapa,name:me.forma.nombre,dex:me.forma.dex,
     texture:me.spr.texture?.key,
     kit:['lmb','rmb','q','e'].map(k=>me.kit?.[k]?.nombre||null)};
   });
  }
  const magby=await battle('magby');
  assert.equal(magby.stages?.[0],'MAGMAR');
  const magmar=await evo();
  assert.equal(magmar.name,'MAGMAR');
  assert.ok(magmar.texture?.includes('0126'),'Magmar animation is missing');
  const firstStage=magmar.stage;
  if(magby.stages.some(x=>x==='MAGMORTAR')){
   await page.waitForTimeout(550);
   const magmortar=await evo();
   assert.equal(magmortar.stage,firstStage+1);
   assert.equal(magmortar.name,'MAGMORTAR');
  }
  // Force the last of five available branches only in this synthetic test
  // battle. This does not alter global roster or the original Eevee.
  const eevee=await battle('eevee');
  assert.equal(eevee.stages.length>=3,true);
  await page.evaluate(()=>{window.__pt2EeveePriorRandom=Math.random;Math.random=()=>.91});
  const umbreon=await evo();
  await page.evaluate(()=>{Math.random=window.__pt2EeveePriorRandom});
  assert.equal(umbreon.name,'UMBREON');
  // Evolution changes the fighter's dex on its scheduled callback; Phaser
  // swaps the actual animated sprite on the following render tick.
  await page.waitForFunction(()=>{
   const s=window.__pt2Game.scene.getScene('combate'),me=s.luchadores[0];
   return me.spr?.texture?.key?.includes('0197');
  },null,{timeout:9000}).catch(async error=>{
   const state=await page.evaluate(()=>{
    const s=window.__pt2Game.scene.getScene('combate'),me=s.luchadores[0];
    return {name:me.nome||me.nombre,form:me.forma?.nombre,dex:me.dex,
     actual:me.dexActual,sprite:me.spr?.texture?.key,
     idleAvailable:s.textures.exists('pmd-0197-Idle'),
     animation:me.spr?.anims?.currentAnim?.key};
   });
   throw new Error('Umbreon PMD never replaced the sprite: '+JSON.stringify(state)+'; '+error);
  });
  assert.ok(umbreon.kit.some(Boolean),'Evolved Eevee lost its skills');
  const togepi=await battle('togepi');
  assert.ok(togepi.buttons?.includes('lmb'),'Togepi cannot attack in Arena');
  const kit=await page.evaluate(()=>{
   const me=window.__pt2Game.scene.getScene('combate').luchadores[0];
   return {atk:me.kit?.lmb?.nombre,dmg:me.kit?.lmb?.dano,
    skills:['lmb','rmb','q','e'].map(slot=>me.kit?.[slot]?.nombre||null)};
  });
  assert.ok(kit.atk&&kit.dmg>0,'Togepi real combat kit has no damage');
  assert.deepEqual(errors,[],'Real evolution generated Phaser errors');
  await page.screenshot({path:'test-evidence/arena-johto-evolutions-mobile.png'});
  console.log('PASS_REAL_JOHTO_ARENA_EVO',JSON.stringify({magby,magmar,umbreon,kit}));
  await page.close();
 }finally{await browser.close();await new Promise(done=>server.close(done))}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
