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
   assert.equal(magmortar.dex,'0467','Evolution must use Magmortar national-dex sprite');
   assert.equal(magmortar.kit.filter(Boolean).length,4,
    'Evolved Magmortar must retain all four combat moves');
   await page.waitForFunction(()=>{
    const me=window.__pt2Game.scene.getScene('combate').luchadores[0];
    return me.spr?.texture?.key?.includes('0467');
   },null,{timeout:9000}).catch(async error=>{
    const state=await page.evaluate(()=>{
     const s=window.__pt2Game.scene.getScene('combate'),me=s.luchadores[0];
     return {form:me.forma?.nombre,dex:me.dex,texture:me.spr?.texture?.key,
      available:s.textures.exists('pmd-0467-Idle'),
      anim:me.spr?.anims?.currentAnim?.key,
      kit:['lmb','rmb','q','e'].map(slot=>me.kit?.[slot]?.nombre)};
    });
    throw Error('Magmortar did not render its real battle sprite: '+
     JSON.stringify(state)+'; '+error);
   });
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
  // Real mobile EVO must choose each Tyrogue branch exactly once.
  // Each roll uses an independent new battle (not a fake roster mutation).
  for(const [roll,expected,dex] of [
   [0,'HITMONCHAN','0107'],[.40,'HITMONLEE','0106'],[.99,'HITMONTOP','0237']
  ]){
   const initial=await battle('tyrogue');
   assert.deepEqual(initial.stages,['HITMONCHAN','HITMONLEE','HITMONTOP']);
   await page.evaluate(value=>{window.__tyroguePriorRandom=Math.random;Math.random=()=>value},roll);
   let chosen;
   try{chosen=await evo();}
   finally{await page.evaluate(()=>{Math.random=window.__tyroguePriorRandom})}
   assert.equal(chosen.name,expected,'Tyrogue must choose a legitimate branch '+roll);
   assert.equal(chosen.dex,dex,'Tyrogue must equip the correct battle art '+expected);
   assert.ok(chosen.kit.some(Boolean),'Tyrogue '+expected+' has no usable attacks');
   await page.waitForFunction(dex=>{
    const w=window.__pt2Game.scene.getScene('combate').luchadores[0];
    return w.spr?.texture?.key?.includes(dex);
   },dex,{timeout:9000});
   const stable=await page.evaluate(()=>{
    const w=window.__pt2Game.scene.getScene('combate').luchadores[0];
    const initial=w.etapa;
    w.etapa=initial+1;
    return {actual:w.etapa,expected:initial,can:w.puedeEvolucionar,
     name:w.forma.nombre};
   });
   assert.equal(stable.actual,stable.expected,'Tyrogue cannot re-evolve');
   assert.equal(stable.can,false,'Tyrogue has only one evolution per fight');
   assert.equal(stable.name,expected,'No accidental branch change');
  }
  const togepi=await battle('togepi');
  assert.ok(togepi.buttons?.includes('lmb'),'Togepi cannot attack in Arena');
  const kit=await page.evaluate(()=>{
   const me=window.__pt2Game.scene.getScene('combate').luchadores[0];
   return {atk:me.kit?.lmb?.nombre,dmg:me.kit?.lmb?.dano,
    skills:['lmb','rmb','q','e'].map(slot=>me.kit?.[slot]?.nombre||null)};
  });
  assert.ok(kit.atk&&kit.dmg>0,'Togepi real combat kit has no damage');
  // Previous Wobbuffet checks invoked its custom functions directly.
  // This must verify its actual human touch-to-native-combat cast path.
  await battle('wobbuffet');
  const button=await page.evaluate(()=>{
   const s=window.__pt2Game.scene.getScene('combate'),w=s.luchadores[0];
   // Observe the real native frame path; do not inject or fabricate a cast.
   window.__torre2WobbuffetFrames=[];
   const nativeUpdate=w.update;
   w.update=function(dt,input){
    let failure=null;
    try{return nativeUpdate.call(this,dt,input)}
    catch(error){failure=String(error?.stack||error);throw error}
    finally{
     if(input?.lmb||failure){
      const trace=window.__torre2WobbuffetFrames;
      if(trace.length<80)trace.push({t:w.t,lmb:input?.lmb,
       cd:w.cd.lmb,usos:w.stats?.usosSlot?.lmb||0,
       estado:w.est?.torre2WobbuffetCounter,
       pending:w.kit?.lmb?.pendiente,form:w.kit?.lmb?.forma,
       active:s.scene.isActive(),phase:s.fase,error:failure});
     }
    }
   };
   w.energia=100;w.accion=null;w.dash=null;w.cd.lmb=0;
   const p=s.panelTactil,b=p?.botones?.find(x=>x.slot==='lmb');
   if(!b)throw Error('Wobbuffet native ATK touch button missing');
   const at=p.pos(b),o=p.punto({x:0,y:0}),unit=p.punto({x:1,y:1});
   p.abajo({id:88,x:(at.x-o.x)/(unit.x-o.x),y:(at.y-o.y)/(unit.y-o.y)});
   // Match the native successful EVO test: flush the touch panel read.
   const pressed=p.leer(v=>({ax:v.x,ay:v.y}));
   return {move:w.kit?.lmb?.nombre,form:w.kit?.lmb?.forma,
    energy:w.energia,pressed};
  });
  assert.equal(button.move,'Counter');
  assert.equal(button.pressed?.lmb,true,
   'Touch panel must register the actual Counter button');
  await page.waitForFunction(()=>{
   const w=window.__pt2Game.scene.getScene('combate').luchadores[0];
   return w.est?.torre2WobbuffetCounter?.hasta>w.t;
  },null,{timeout:6000}).catch(async e=>{
   const state=await page.evaluate(()=>{
    const s=window.__pt2Game.scene.getScene('combate'),w=s.luchadores[0];
    return {phase:s.fase,form:w.kit?.lmb?.forma,cd:w.cd?.lmb,
     energy:w.energia,action:w.accion,status:w.est,
     frames:window.__torre2WobbuffetFrames,
     frameErrors:s.erroresFotograma||0,
     controller:s.controles?.[0]?.tipo,autoEnabled:s.__torre2AutoMode?.enabled,
     move:w.kit?.lmb,uses:w.stats?.usosSlot,
     buttons:s.panelTactil?.botones?.map(b=>b.slot)};
   });
   throw Error('Wobbuffet real native touch input did not cast Counter: '+
    JSON.stringify(state)+'; '+e);
  });
  await page.evaluate(()=>window.__pt2Game.scene.getScene('combate')
   .panelTactil.arriba({id:88}));
  assert.deepEqual(errors,[],'Real evolution or cast generated Phaser errors');
  await page.screenshot({path:'test-evidence/arena-johto-evolutions-mobile.png'});
  console.log('PASS_REAL_JOHTO_ARENA_EVO',JSON.stringify({magby,magmar,umbreon,kit}));
  await page.close();
 }finally{await browser.close();await new Promise(done=>server.close(done))}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
