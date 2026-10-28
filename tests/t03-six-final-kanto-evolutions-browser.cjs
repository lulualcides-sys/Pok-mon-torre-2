'use strict';
// T03: native Phaser EVO through six distinct three-stage Kanto families.
// This is Arena evolution readiness driven in an isolated Chromium page,
// not a claim of natural campaign-level XP or a gameplay balance change.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg',
 '.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1:4431');
 const target=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!target.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const data=await fsp.readFile(target);res.writeHead(200,{'content-type':mime[path.extname(target)]||'application/octet-stream'});res.end(data)}
 catch{res.writeHead(404);res.end('missing')}
});
const families=[
 {starter:'oddish',expected:'gloom',dex:'0044',final:'vileplume',finalDex:'0045'},
 {starter:'bellsprout',expected:'weepinbell',dex:'0070',final:'victreebel',finalDex:'0071'},
 {starter:'geodude',expected:'graveler',dex:'0075',final:'golem',finalDex:'0076'},
 {starter:'gastly',expected:'haunter',dex:'0093',final:'gengar',finalDex:'0094'},
 {starter:'abra',expected:'kadabra',dex:'0064',final:'alakazam',finalDex:'0065'},
 {starter:'machop',expected:'machoke',dex:'0067',final:'machamp',finalDex:'0068'}
];
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(ok=>server.listen(4431,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
  '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 const report={mode:'native Phaser Arena',preparedArenaExperience:true,naturalCampaign:false,families:[]};
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4431/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:50000});
  for(const {starter,expected,dex,final,finalDex} of families){
   await page.evaluate(starter=>{
    window.__pt2Game.scene.getScene('titulo').scene.start('combate',{
     modo:'cpu',p1:starter,p2:'joltik',mandos:['tactil','pad0'],nivel:'facil'
    });
   },starter);
   await page.waitForFunction(starter=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return b.scene.isActive()&&b.fase==='lucha'&&b.datos?.p1===starter&&
     b.panelTactil?.botones?.some(x=>x.slot==='mega')&&
     b.luchadores?.[0]?.spr?.texture?.key?.startsWith('pmd-');
   },starter,{timeout:60000});
   // Only evolve via native EVO touchscreen. Isolate both fighters from
   // spontaneous KOs while inspecting visibility; no trainer result is faked.
   const before=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate'),me=b.luchadores[0];
    b.luchadores[1].inmortal=true;
    b.controles[1].leer=()=>({mx:0,my:0,ax:me.x,ay:me.y});
    me.inmortal=true;me.exp=me.expNecesaria;
    return {name:me.forma.nombre,stage:me.etapa,ready:me.puedeEvolucionar,
     sprite:me.spr?.texture?.key,slots:b.panelTactil.botones.map(x=>x.slot)};
   });
   assert.equal(before.stage,0,starter+' must begin unevolved');
   assert.equal(before.ready,true,starter+' requires EVO readiness');
   assert.ok(before.slots.includes('mega'),'EVO button required for '+starter);
   await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate'),panel=b.panelTactil,
     evo=panel.botones.find(x=>x.slot==='mega'),
     at=panel.pos(evo),zero=panel.punto({x:0,y:0}),one=panel.punto({x:1,y:1});
    panel.abajo({id:86,x:(at.x-zero.x)/(one.x-zero.x),y:(at.y-zero.y)/(one.y-zero.y)});
    panel.leer(x=>({ax:x.x,ay:x.y}));
   });
   await page.waitForFunction(({expected,dex})=>{
    const b=window.__pt2Game.scene.getScene('combate'),m=b.luchadores?.[0];
    return b.scene.isActive()&&m?.etapa===1&&m?.forma?.nombre?.toLowerCase()===expected&&
     m.spr?.active&&m.spr.visible&&m.spr.texture?.key?.startsWith('pmd-'+dex+'-')&&
     m.spr.frame?.width>0&&m.spr.frame?.height>0;
   },{expected,dex},{timeout:14000});
   await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
   const after=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate'),m=b.luchadores[0];
    b.panelTactil.arriba({id:86});
    const slots=Object.fromEntries(['lmb','rmb','q','e'].map(k=>
     [k,{name:m.kit[k]?.nombre||'',pending:m.kit[k]?.pendiente===true}]));
    return {scene:b.scene.key,phase:b.fase,name:m.forma.nombre,
     stage:m.etapa,dex:m.dex,sprite:m.spr.texture.key,visible:m.spr.visible,
     active:m.spr.active,frame:[m.spr.frame.width,m.spr.frame.height],
     textureAvailable:b.textures.exists(m.spr.texture.key),slots};
   });
   assert.equal(after.scene,'combate');
   assert.equal(after.stage,1);
   assert.equal(after.name.toLowerCase(),expected);
   assert.ok(after.textureAvailable&&after.visible&&after.active);
   for(const [slot,value] of Object.entries(after.slots)){
    assert.ok(value.name,expected+' must retain '+slot+' name');
    assert.equal(value.pending,false,expected+' '+slot+' must not be placeholder');
   }
   // Second evolution reuses the live native EVO touch UI, never a
   // direct species mutation. XP is prepared ONLY in this isolated Arena
   // fixture, not awarded or rewritten in a real campaign save.
   const secondReady=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate'),m=b.luchadores[0];
    m.exp=m.expNecesaria;
    return {stage:m.etapa,ready:m.puedeEvolucionar,exp:m.exp,required:m.expNecesaria};
   });
   assert.equal(secondReady.stage,1);
   assert.equal(secondReady.ready,true,starter+' second EVO must be available');
   await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate'),panel=b.panelTactil,
     evo=panel.botones.find(x=>x.slot==='mega'),
     at=panel.pos(evo),z=panel.punto({x:0,y:0}),one=panel.punto({x:1,y:1});
    panel.abajo({id:87,x:(at.x-z.x)/(one.x-z.x),y:(at.y-z.y)/(one.y-z.y)});
    panel.leer(x=>({ax:x.x,ay:x.y}));
   });
   await page.waitForFunction(({final,finalDex})=>{
    const b=window.__pt2Game.scene.getScene('combate'),m=b.luchadores?.[0];
    return b.scene.isActive()&&m?.etapa===2&&
     m.forma?.nombre?.toLowerCase()===final&&m.spr?.active&&m.spr.visible&&
     m.spr.texture?.key?.startsWith('pmd-'+finalDex+'-')&&
     m.spr.frame?.width>0&&m.spr.frame?.height>0;
   },{final,finalDex},{timeout:16000});
   await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
   const ultimate=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate'),m=b.luchadores[0];
    b.panelTactil.arriba({id:87});
    return {stage:m.etapa,name:m.forma.nombre,sprite:m.spr.texture.key,
     frame:[m.spr.frame.width,m.spr.frame.height],visible:m.spr.visible,
     textureAvailable:b.textures.exists(m.spr.texture.key),
     kit:Object.fromEntries(['lmb','rmb','q','e'].map(k=>[k,{
      name:m.kit[k]?.nombre||'',pending:m.kit[k]?.pendiente===true
     }]))};
   });
   assert.equal(ultimate.stage,2);
   assert.equal(ultimate.name.toLowerCase(),final);
   assert.ok(ultimate.visible&&ultimate.textureAvailable);
   for(const [k,mv] of Object.entries(ultimate.kit)){
    assert.ok(mv.name,final+' '+k+' must have a name');
    assert.equal(mv.pending,false,final+' '+k+' must not be a placeholder');
   }
   await page.screenshot({path:'test-evidence/t03-six-final-'+final+'-webgl.png'});
   console.log('T03 FINAL EVOLUTION PASS',JSON.stringify({starter,first:expected,final,ultimate}));

   await page.screenshot({path:'test-evidence/t03-six-intermediate-'+expected+'-webgl.png'});
   report.families.push({starter,expected,before,after,ultimate});
   console.log('T03 STARTER EVOLUTION PASS',JSON.stringify({starter,after}));
   // Return to title between independent actual Phaser fights.
   await page.evaluate(()=>window.__pt2Game.scene.getScene('combate').scene.start('titulo'));
   await page.waitForFunction(()=>window.__pt2Game.scene.isActive('titulo'),null,{timeout:16000});
  }
  assert.deepEqual(errors,[],'No JS errors during real Kanto starter evolutions');
  assert.equal(report.families.length,6);
  fs.writeFileSync('test-evidence/t03-six-final-evolutions.json',JSON.stringify(report,null,2));
  console.log('T03 PASS TWELVE KANTO EVOLUTION TRANSITIONS (six final forms), sprites and four move slots; Arena XP fixture');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
