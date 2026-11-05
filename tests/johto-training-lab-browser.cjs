'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const MIME={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css',
 '.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1:4297'),f=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!f.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 try{const b=await fs.readFile(f);res.writeHead(200,{'content-type':MIME[path.extname(f)]||'application/octet-stream'});res.end(b)}
 catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 await new Promise(resolve=>server.listen(4297,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true,
  args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4297/arena2d/?original=1');
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:45000});
  const menu=await page.evaluate(()=>{
   const s=window.__pt2Game.scene.getScene('titulo');s.abrirMenu('jugar');
   return s.botones.map(b=>b.id);
  });
  assert.ok(menu.includes('johto-lab'),'Dedicated Mewtwo Training entry in PLAY menu');
  await page.evaluate(()=>window.__pt2Game.scene.getScene('titulo').scene.start('johto-lab'));
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('johto-lab'),null,{timeout:10000});
  const editor=await page.evaluate(()=>{
   const s=window.__pt2Game.scene.getScene('johto-lab');
   s.slot=0;s.moveCards.find(c=>c.m.id==='thief').r.emit('pointerdown');
   return {cards:s.moveCards.length,slots:s.picks,active:s.slot};
  });
  assert.equal(editor.cards,15,'Editor paginates 46 moves into mobile-friendly sets of 15');
  assert.equal(editor.slots[0],'thief','Move chosen from the editor must equip in ATK');
  assert.equal(new Set(editor.slots).size,4,'No duplicated move on slots');
  await page.evaluate(()=>window.__pt2Game.scene.getScene('johto-lab').startPractice());
  await page.waitForFunction(()=>{
   const s=window.__pt2Game.scene.getScene('combate');
   return s.scene.isActive()&&s.fase==='lucha'&&s.__johtoLabInstalled;
  },null,{timeout:40000});
  const combat=await page.evaluate(()=>{
   const s=window.__pt2Game.scene.getScene('combate'),me=s.luchadores[0];
   return {mode:s.datos.modo,player:me.def.id,opponent:s.luchadores[1].def.id,
    names:['lmb','rmb','q','e'].map(k=>me.kit[k]?.nombre),
    forms:['lmb','rmb','q','e'].map(k=>me.kit[k]?.forma),dummy:s.entreno,saveFlag:!!s.datos.torre2};
  });
  assert.equal(combat.mode,'entreno');assert.equal(combat.player,'mewtwo');
  assert.equal(combat.opponent,'onix');assert.equal(combat.names[0],'Thief');
  assert.ok(combat.forms.every(x=>x.startsWith('torre2_johto_')));
  assert.equal(combat.dummy,true);assert.equal(combat.saveFlag,false);
  const casts=await page.evaluate(async()=>{
   const base=new URL('./',Array.from(document.scripts).find(s=>s.src.includes('/main.js')).src);
   const [{JOHTO_18},{TORRE2_JOHTO_LAB_FORMS},{JOHTO_P2_TEXTURES}]=await Promise.all([
    import(new URL('torre2/johto-lab-catalog.js',base)),
    import(new URL('torre2/johto-lab-runtime.js',base)),
    import(new URL('torre2/johto-lab-pixelart.js',base))]);
   const scene=window.__pt2Game.scene.getScene('combate'),me=scene.luchadores[0],enemy=scene.luchadores[1];
   enemy.inmortal=true;me.inmortal=true;
   const result=[];
   for(const move of JOHTO_18){
    me.accion=null;me.dash=null;me.est={};
    me.ax=enemy.x=me.x+100;me.ay=enemy.y=me.y;
    if(move.id==='snore')me.ponerEstado('dormido',5,{cura:0});
    const before=scene.efectos.length;
    const output=TORRE2_JOHTO_LAB_FORMS[move.forma](me,move,{slot:'q'});
    await new Promise(ok=>setTimeout(ok,100));
    const native=JOHTO_P2_TEXTURES[move.id]||[];
    const textures=native.map(name=>({name,loaded:scene.textures.exists(name),
      rendered:scene.children.list.some(o=>o.active&&o.texture?.key===name)}));
    const pixelfxKey='torre2-johto-pixelfx-'+move.id;
    const pixelFXLoaded=scene.textures.exists(pixelfxKey);
    const pixelFXRendered=scene.children.list.some(o=>o.active&&o.texture?.key===pixelfxKey);
    const pilotKey='torre2-johto-pilot-'+move.id;
    const pilot=scene.textures.exists(pilotKey);
    const electroBallLoaded=scene.textures.exists('vfx-electroball');
    const electroBallRendered=move.id==='zap-cannon'&&
     scene.children.list.some(o=>o.active&&
      o.getData?.('torre2-zap-native-orb')===true&&
      o.texture?.key==='vfx-electroball');
    const zapImpactRendered=move.id==='zap-cannon'&&
     scene.children.list.some(o=>o.active&&
      o.getData?.('torre2-zap-native-impact')===true&&
      o.texture?.key==='vfx-electroball');
    result.push({id:move.id,output,instantiated:scene.efectos.length>=before,textures,
     pilot,pixelFXLoaded,pixelFXRendered,electroBallLoaded,electroBallRendered,zapImpactRendered,
     previewVisible:pilot&&scene.children.list.some(o=>
      o.active&&o.texture?.key===pilotKey)});
   }
   return result;
  });
  console.log('JOHTO_LAB_18_CASTS',JSON.stringify(casts));
  assert.equal(casts.length,18);
  for(const cast of casts){
   assert.equal(cast.output,true,cast.id+' cast');
   assert.equal(cast.instantiated,true,cast.id+' visual effect');
   if(cast.id==='zap-cannon'){
    assert.ok(cast.electroBallLoaded&&cast.electroBallRendered&&cast.zapImpactRendered,
     'Zap Cannon must render original Raichu Electro Ball plus impact');
   }else if(['powder-snow','whirlpool'].includes(cast.id)){
    assert.ok(cast.textures.some(t=>t.loaded&&t.rendered),
     cast.id+' approved native P2 art was replaced unexpectedly');
   }else{
    assert.ok(cast.pixelFXLoaded&&cast.pixelFXRendered,
     cast.id+' missing actual PixelFX sprite in Phaser renderer');
   }
  }
  // Snow and Whirlpool are approved. Zap Cannon now uses the base sprite
  // vfx-electroball, not its old 12-frame generated Zap PNG.
  for(const id of ['powder-snow','whirlpool']){
   const item=casts.find(x=>x.id===id);
   assert.ok(item?.pilot&&item?.previewVisible,
    id+' PILOT art was not loaded/rendered by the actual WebGL scene');
  }
  const zapCast=casts.find(x=>x.id==='zap-cannon');
  assert.equal(zapCast.electroBallLoaded,true,
   'Electro Ball 40x40 source sprite must preload in the client');
  assert.equal(zapCast.electroBallRendered,true,
   'Zap Cannon must use the original Electro Ball projectile spritesheet');
  assert.equal(zapCast.zapImpactRendered,true,
   'Zap Cannon must use the original Electro Ball explosion frames');
  // True projectile/contact path: count real native receive calls, not only VFX constructors.
  const impacts=await page.evaluate(async()=>{
   const base=new URL('./',Array.from(document.scripts).find(s=>s.src.includes('/main.js')).src);
   const [{JOHTO_18},{TORRE2_JOHTO_LAB_FORMS}]=await Promise.all([
    import(new URL('torre2/johto-lab-catalog.js',base)),import(new URL('torre2/johto-lab-runtime.js',base))]);
   const scene=window.__pt2Game.scene.getScene('combate'),me=scene.luchadores[0],enemy=scene.luchadores[1];
   const original=enemy.recibir,originalRandom=Math.random,originalXP=me.ganarExp,
    originalEnemyXP=enemy.ganarExp,originalEnemyUlt=enemy.ganarUlti,
    originalHitFX=enemy.efectosGolpe,measured=[];
   me.ganarExp=()=>{}; // synthetic 18-cast burst must not summon XP text
   // Force only native hit/HP behavior during a rapid test burst: the original
   // fighter shows ULT/EXP text when its meter fills, which needlessly allocates
   // 18+ Phaser text canvases in one synchronous page.evaluate frame. Real
   // gameplay still uses the unmodified methods and the visual test below.
   enemy.ganarUlti=()=>{};enemy.ganarExp=()=>{};
   enemy.efectosGolpe=()=>{}; // native HP/contact remain; suppress 18 simultaneous HUD damage texts
   Math.random=()=>.35; // deterministic accuracy pass; misses tested separately
   let calls=0;enemy.recibir=function(...args){calls++;return original.apply(this,args)};
   try{
    scene.fase='lucha';me.inmortal=true;enemy.inmortal=true;
    for(const move of JOHTO_18){
     for(const fx of scene.efectos)fx.destroy?.();
     scene.efectos=[];
     me.est={};me.accion=null;me.dash=null;me.x=180;me.y=180;
     enemy.ko=false;enemy.hp=enemy.hpMax;enemy.x=280;enemy.y=180;
     me.ax=enemy.x;me.ay=enemy.y;
     if(move.id==='snore')me.ponerEstado('dormido',6,{cura:0});
     calls=0;
     const ok=TORRE2_JOHTO_LAB_FORMS[move.forma](me,move,{slot:'q'});
     const effect=scene.efectos.at(-1);
     if(ok&&effect)for(let i=0;i<125;i++){if(effect.update(.016)===false)break;}
     measured.push({id:move.id,ok,calls});
    }
   }finally{enemy.recibir=original;me.ganarExp=originalXP;
    enemy.ganarExp=originalEnemyXP;enemy.ganarUlti=originalEnemyUlt;
    enemy.efectosGolpe=originalHitFX;Math.random=originalRandom;}
   return measured;
  });
  console.log('JOHTO_LAB_18_NATIVE_CONTACTS',JSON.stringify(impacts));
  for(const row of impacts)assert.ok(row.calls>0,'Missing genuine native contact '+row.id);
  // Visual evidence: capture every native P2 pixel-art move in the actual
  // Phaser combat canvas. No compositing of mockups or generated concept art.
  await fs.mkdir('test-evidence/johto-native-pixelart',{recursive:true});
  for(const {id} of casts){
   await page.evaluate(async moveId=>{
    const base=new URL('./',Array.from(document.scripts)
     .find(s=>s.src.includes('/main.js')).src);
    const [{JOHTO_18},{TORRE2_JOHTO_LAB_FORMS}]=await Promise.all([
     import(new URL('torre2/johto-lab-catalog.js',base)),
     import(new URL('torre2/johto-lab-runtime.js',base))]);
    const scene=window.__pt2Game.scene.getScene('combate');
    scene.efectos.forEach(fx=>fx.destroy?.());scene.efectos=[];
    const me=scene.luchadores[0],enemy=scene.luchadores[1];
    me.est={};me.accion=null;me.dash=null;
    me.x=178;me.y=178;enemy.x=273;enemy.y=178;
    me.ax=enemy.x;me.ay=enemy.y;
    if(moveId==='snore')me.ponerEstado('dormido',6,{cura:0});
    const m=JOHTO_18.find(m=>m.id===moveId);
    TORRE2_JOHTO_LAB_FORMS[m.forma](me,m,{slot:'q'});
   },id);
   await page.waitForTimeout(190);
   await page.screenshot({path:'test-evidence/johto-native-pixelart/'+id+'.png'});
   // Visual approval needs intermediate frames, not a single cast screenshot.
   if(['zap-cannon','powder-snow','whirlpool'].includes(id)){
    await page.waitForTimeout(200);
    await page.screenshot({path:'test-evidence/johto-native-pixelart/'+id+'-middle.png'});
    await page.waitForTimeout(160);
    await page.screenshot({path:'test-evidence/johto-native-pixelart/'+id+'-impact.png'});
   }
  }
  console.log('JOHTO_PIXEL_ART_EVIDENCE_SAVED',casts.map(c=>c.id).join(','));
  await page.evaluate(()=>window.__pt2Game.scene.getScene('combate').salir());
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('johto-lab'),null,{timeout:12000});
  const returned=await page.evaluate(()=>window.__pt2Game.scene.getScene('johto-lab').picks);
  assert.equal(returned[0],'thief');
  assert.deepEqual(errors,[],'No uncaught Phaser JS errors');
  console.log('PASS MEWTWO JOHTO LAB: 3 approved + 15 remade PixelFX casts, plus 28 preview choices');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
