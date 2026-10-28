'use strict';
// T03: six native Kanto evolutions AND real touch casts on the actual
// Phaser/WebGL Arena. XP readiness is a test fixture, NOT natural campaign XP.
// Never writes the campaign save or modifies approved VFX, moves or controls.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp',
 '.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const pathname=new URL(req.url,'http://127.0.0.1:4399').pathname;
 const file=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const data=await fsp.readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(data)}
 catch{res.writeHead(404);res.end('missing')}
});
const families=[
 {from:'diglett',to:'dugtrio',dex:'0051',signature:'Tri Attack',range:85},
 {from:'meowth',to:'persian',dex:'0053',signature:'Pay Day',range:70},
 {from:'mankey',to:'primeape',dex:'0057',signature:'Cross Chop',range:33}
];
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(resolve=>server.listen(4399,'127.0.0.1',resolve));
 const browser=await chromium.launch({
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']
 });
 const report={test:'T03 actual post-evolution contacts and HP damage',
  preparedArenaExp:true,naturalCampaign:false,transitions:[]};
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4399/arena2d/?original=1',
   {waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),
   null,{timeout:55000});
  for(const {from,to,dex,signature,range} of families){
   await page.evaluate(id=>window.__pt2Game.scene.getScene('titulo')
    .scene.start('combate',{modo:'cpu',p1:id,p2:'joltik',
     mandos:['tactil','pad0'],nivel:'facil'}),from);
   await page.waitForFunction(id=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return b.scene.isActive()&&b.fase==='lucha'&&b.datos?.p1===id&&
     b.panelTactil?.botones?.some(x=>x.slot==='mega')&&
     b.luchadores?.[0]?.spr?.texture?.key?.startsWith('pmd-');
   },from,{timeout:65000});
   const before=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    const me=b.luchadores[0],foe=b.luchadores[1];
    foe.inmortal=true;me.inmortal=true;
    b.controles[1].leer=()=>({mx:0,my:0,ax:me.x,ay:me.y});
    me.exp=me.expNecesaria; // Arena-only readiness fixture.
    return {species:me.forma.nombre,stage:me.etapa,
     canEvolve:me.puedeEvolucionar,sprite:me.spr.texture.key};
   });
   assert.equal(before.stage,0,from+' must begin at stage zero');
   assert.equal(before.canEvolve,true,from+' native EVO must be ready');
   assert.ok(before.sprite?.startsWith('pmd-'),from+' needs native PMD base sprite');
   await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate'),p=b.panelTactil;
    const btn=p.botones.find(x=>x.slot==='mega');
    const at=p.pos(btn),zero=p.punto({x:0,y:0}),one=p.punto({x:1,y:1});
    p.abajo({id:92,x:(at.x-zero.x)/(one.x-zero.x),
     y:(at.y-zero.y)/(one.y-zero.y)});
    p.leer(x=>({ax:x.x,ay:x.y}));
   });
   await page.waitForFunction(({to,dex})=>{
    const b=window.__pt2Game.scene.getScene('combate'),m=b.luchadores?.[0];
    return b.scene.isActive()&&b.fase==='lucha'&&m?.etapa===1&&
     m.forma?.nombre?.toLowerCase()===to&&m.spr?.active&&m.spr.visible&&
     m.spr.texture?.key?.startsWith('pmd-'+dex+'-')&&
     m.spr.frame?.width>0&&m.spr.frame?.height>0;
   },{to,dex},{timeout:20000});
   await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
   const after=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate'),m=b.luchadores[0];
    b.panelTactil.arriba({id:92});
    const canvas=document.querySelector('#juego canvas');
    return {species:m.forma.nombre,stage:m.etapa,sprite:m.spr.texture.key,
     active:m.spr.active,visible:m.spr.visible,
     textureLoaded:b.textures.exists(m.spr.texture.key),
     frame:[m.spr.frame.width,m.spr.frame.height],
     canvas:canvas&&[canvas.width,canvas.height],
     slots:Object.fromEntries(['lmb','rmb','q','e'].map(k=>
      [k,{name:m.kit[k]?.nombre||'',pending:m.kit[k]?.pendiente===true}]))};
   });
   assert.equal(after.species.toLowerCase(),to);
   assert.ok(after.active&&after.visible&&after.textureLoaded,to+' sprite unavailable');
   assert.equal(after.sprite.startsWith('pmd-'+dex+'-'),true,
    to+' must render its evolved PMD sprite, not a stale base texture');
   assert.ok(after.canvas?.[0]>0&&after.canvas?.[1]>0,to+' canvas blank');
   assert.ok(Object.values(after.slots).some(move=>move.name===signature),
    to+' must preserve the already-integrated '+signature+' native signature move');
   for(const [slot,move] of Object.entries(after.slots)){
    assert.ok(move.name,to+' '+slot+' missing after evolution');
    assert.equal(move.pending,false,to+' '+slot+' placeholder');
   }
   // Real touch on the SAME evolved Phaser fighter. Mutate ONLY resources/
   // cooldown in the isolated browser fixture, not the attack implementation.
   const slot=Object.entries(after.slots).find(([,v])=>v.name===signature)?.[0];
   assert.ok(slot,to+' signature '+signature+' is not bound to a touch slot');
   const preCast=await page.evaluate(({slot,range})=>{
    const b=window.__pt2Game.scene.getScene('combate'),m=b.luchadores[0];
    m.energia=100;m.ulti=100;m.cd[slot]=0;
    m.accion=null;m.animAccion=null;m.dash=null;m.est={};m.dolorHasta=-1;
    m.ultimoAtaque=-100;m.ultimoBasico=-100;m.sobrecargaHasta=0;m.ko=false;
    b.pausado=false;b.pausaGolpe=0;b.fase='lucha';
    // Training fixture sets positions and HP BEFORE the real projectile:
    // never modifies the opponent HP or any hit/result during the cast.
    const r=b.luchadores[1],dir=r.x>=m.x?1:-1;
    r.inmortal=false;r.ko=false;r.hp=r.hpMax;r.est={};
    r.accion=null;r.dash=null;r.dolorHasta=-1;
    r.x=m.x+dir*range;r.y=m.y;
    if(r.spr)r.spr.setPosition(r.x,r.y);
    m.ax=r.x;m.ay=r.y;
    b.__t03Contacts=[];
    const nativeRecibir=r.recibir;
    r.recibir=function(...args){
      const hpBefore=this.hp;
      const result=nativeRecibir.apply(this,args);
      b.__t03Contacts.push({result,before:hpBefore,after:this.hp,
       declaredDamage:args[1]?.dano,source:args[0]?.forma?.nombre||null});
      return result;
    };
    return {targetHp:r.hp,targetMax:r.hpMax,targetPosition:[r.x,r.y],
     attackerPosition:[m.x,m.y],range,
     species:m.forma.nombre,stage:m.etapa,
     signature:m.kit[slot].nombre,renderer:m.kit[slot].forma,
     beforeUses:m.stats.usosSlot?.[slot]||0,
     energy:m.energia,ultimate:m.ulti,cd:m.cd[slot]};
   },{slot,range});
   assert.equal(preCast.stage,1,to+' must already be evolved before casting');
   assert.equal(preCast.signature,signature,to+' cannot cast a different move');
   assert.ok(preCast.renderer,to+' signature renderer is missing');
   await page.evaluate(slot=>{
    const panel=window.__pt2Game.scene.getScene('combate').panelTactil,
     button=panel.botones.find(x=>x.slot===slot);
    if(!button)throw Error('Native touch button absent: '+slot);
    const pos=panel.pos(button),z=panel.punto({x:0,y:0}),
     one=panel.punto({x:1,y:1});
    panel.abajo({id:94,x:(pos.x-z.x)/(one.x-z.x),
     y:(pos.y-z.y)/(one.y-z.y)});
    panel.leer(x=>({ax:x.x,ay:x.y}));
   },slot);
   try{
    await page.waitForFunction(({slot,beforeUses})=>{
     const scene=window.__pt2Game.scene.getScene('combate'),
      m=scene.luchadores?.[0];
     return scene.scene.isActive()&&m?.etapa===1&&
      (m.stats.usosSlot?.[slot]||0)>beforeUses;
    },{slot,beforeUses:preCast.beforeUses},{timeout:8000,polling:100});
   }finally{
    await page.evaluate(()=>window.__pt2Game.scene.getScene('combate')
     .panelTactil.arriba({id:94})).catch(()=>{});
   }
   // The target is not invulnerable. Observe actual engine damage, not a
   // synthetic HP subtraction or a direct call to recibir().
   await page.waitForFunction(({originalHp})=>{
    const b=window.__pt2Game.scene.getScene('combate'),
     r=b.luchadores?.[1];
    return b.scene.isActive()&&r?.hp<originalHp&&
     b.__t03Contacts?.some(x=>x.result==='golpe'&&x.after<x.before);
   },{originalHp:preCast.targetHp},{timeout:6000,polling:100});
   const hit=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate'),
     r=b.luchadores[1],p=b.luchadores[0];
    return {targetHp:r.hp,targetMax:r.hpMax,contacts:b.__t03Contacts,
      targetVisible:r.spr?.visible,
      sourceSpecies:p.forma?.nombre,sourceStage:p.etapa,
      sourceTexture:p.spr?.texture?.key};
   });
   assert.ok(hit.targetHp<preCast.targetHp,
    to+' '+signature+' must inflict ACTUAL damage on rival');
   assert.ok(hit.contacts.some(x=>x.result==='golpe'&&x.after<x.before),
    to+' '+signature+' never touched the real Phaser hit handler');
   console.log('T03 POST EVOLUTION HIT PASS',JSON.stringify({
    from,to,signature,preCast,hit
   }));
   const cast=await page.evaluate(slot=>{
    const scene=window.__pt2Game.scene.getScene('combate'),m=scene.luchadores[0];
    return {uses:m.stats.usosSlot?.[slot]||0,
     cd:m.cd[slot],energy:m.energia,ultimate:m.ulti,
     sceneActive:scene.scene.isActive(),phase:scene.fase,
     stage:m.etapa,species:m.forma.nombre,texture:m.spr?.texture?.key,
     visible:m.spr?.visible,textureLoaded:scene.textures.exists(m.spr?.texture?.key)};
   },slot);
   assert.ok(cast.uses>preCast.beforeUses,to+' '+signature+' did not execute via real touch');
   assert.ok(Number.isFinite(cast.cd)&&cast.cd>0,to+' signature never entered cooldown');
   assert.ok(cast.sceneActive&&cast.visible&&cast.textureLoaded&&cast.stage===1,
    to+' battle/sprite broke after casting '+signature);
   console.log('T03 EVOLVED REAL TOUCH CAST PASS',JSON.stringify({
    from,to,signature,slot,preCast,cast
   }));
   await page.screenshot({path:'test-evidence/t03-hit-'+to+'-webgl.png'});
   report.transitions.push({from,to,signature,before,after,slot,preCast,cast,hit});
   console.log('T03 PHASER SIGNATURE EVOLUTION PASS',JSON.stringify({from,to,signature,after}));
   await page.evaluate(()=>window.__pt2Game.scene.getScene('combate').scene.start('titulo'));
   await page.waitForFunction(()=>window.__pt2Game.scene.isActive('titulo'),
    null,{timeout:20000});
  }
  assert.deepEqual(errors,[],'No uncaught JS errors during native evolutions');
  assert.equal(report.transitions.length,3);
  assert.ok(report.transitions.every(x=>x.cast.uses>x.preCast.beforeUses&&x.cast.cd>0&&x.hit.targetHp<x.preCast.targetHp));
  fs.writeFileSync('test-evidence/t03-post-evo-real-hits.json',
   JSON.stringify(report,null,2));
  console.log('PASS T03: three post-EVO real contacts and HP damage (prepared Arena XP and positioning; not natural campaign)');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
