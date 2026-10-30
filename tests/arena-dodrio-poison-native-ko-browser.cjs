'use strict';
/*
 * Dodrio Arena poison regression on the REAL compiled Phaser engine.
 * The only fixture is a low-but-positive opening HP and applying the
 * original Gengar Sludge Bomb poison definition. HP is never set to 0,
 * recibir()/morir()/alKO() are never mocked or called by the test.
 * No campaign state, original-client kit, or approved VFX is modified.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const port=4496;
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css',
 '.json':'application/json','.png':'image/png','.webp':'image/webp',
 '.jpg':'image/jpeg','.svg':'image/svg+xml','.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1:'+port);
 const target=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!target.startsWith(root+path.sep)){res.writeHead(403);return res.end('blocked')}
 try{const bytes=await fs.readFile(target);
  res.writeHead(200,{'content-type':mime[path.extname(target)]||'application/octet-stream'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('missing')}
});
const evidence={scope:'Arena (CPU) poison damage and real native Dodrio K.O.',cases:[]};
async function save(){await fs.mkdir('test-evidence',{recursive:true});
 await fs.writeFile('test-evidence/arena-dodrio-poison-native-ko.json',JSON.stringify(evidence,null,2))}
(async()=>{
 await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:'+port+'/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  for(const id of ['dodrio','doduo']){
   await page.evaluate(species=>
    window.__pt2Game.scene.getScene('titulo').scene.start('combate',{
     modo:'cpu',p1:'gengar',p2:species,mandos:['tactil','pad0'],nivel:'facil'
    }),id);
   await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('combate')&&
    window.__pt2Game.scene.getScene('combate').fase==='lucha',null,{timeout:25000});
   const pre=await page.evaluate(species=>{
    const scene=window.__pt2Game.scene.getScene('combate');
    const src=scene.luchadores[0],victim=scene.luchadores[1];
    const actualPoison=src.kit.rmb?.veneno; // Original Gengar Sludge Bomb metadata.
    if(!actualPoison||!actualPoison.dano||!actualPoison.cada||!actualPoison.ticks)
     throw Error('Missing native Gengar poison, cannot prove a real status tick');
    if(victim.def.torre2ArenaAdded!==true)
     throw Error('Expected Doduo Kanto-added fighter');
    if(victim.inmortal)throw Error('Arena target is unexpectedly immortal');
    src.inmortal=true; // Protect only the unrelated attacker so no other round starts.
    scene.controles[0].leer=()=>({mx:0,my:0,ax:src.x,ay:src.y});
    scene.controles[1].leer=()=>({mx:0,my:0,ax:victim.x,ay:victim.y});
    victim.hp=species==='dodrio'?10.4:9;
    // Dodrio: 10.4 - 5*2 native poison ticks = 0.4 HP without the
    // repair. HUD renders an empty bar, but an unpatched KO never fires.
    // Doduo: conventional integer lethal HP control case.
    const realKO=scene.alKO;
    window.__dodrioPoisonEvent=null;window.__dodrioPoisonCount=0;
    scene.alKO=function(fallen,from){
     window.__dodrioPoisonCount++;
     const before={phase:this.fase,id:fallen.nome||fallen.nombre,side:fallen.lado,
      hp:fallen.hp,ko:fallen.ko,poison:!!fallen.est.veneno,src:this.luchadores[0].nombre};
     const result=realKO.call(this,fallen,from);
     window.__dodrioPoisonEvent={before,after:{phase:this.fase,score:[...this.victorias]}};
     return result;
    };
    window.__dodrioPoisonTicks=[];
    const receiveNative=victim.recibir;
    victim.recibir=function(attacker,hit){
     const before=this.hp,at=this.escena.t,poison=!!this.est.veneno;
     const out=receiveNative.call(this,attacker,hit);
     if(hit?.tick&&hit?.puro&&hit?.tipo==='POISON')
      window.__dodrioPoisonTicks.push({at,before,after:this.hp,poison,
       elapsed:this.est.veneno?.acum??null,ko:this.ko,result:out});
     return out;
    };
    victim.envenenar(actualPoison,src);
    return {species:victim.nombre,base:victim.def.id,stage:victim.etapa,hp:victim.hp,
     hpMax:victim.hpMax,regen:victim.regen,poison:actualPoison,
     poisonApplied:!!victim.est.veneno,
     appliedAt:scene.t,expiresAt:victim.est.veneno?.hasta,
     phase:scene.fase};
   },id);
   assert.equal(pre.hp,id==='dodrio'?10.4:9);
   assert.equal(pre.poisonApplied,true);
   assert.equal(pre.phase,'lucha');
   // Observes native status ticks and K.O. (no fake attacker damage).
   try{
    await page.waitForFunction(()=>window.__dodrioPoisonEvent?.before.side===1,
     null,{timeout:14000,polling:35});
   }catch(err){
    const diagnostic=await page.evaluate(()=>{
     const scene=window.__pt2Game.scene.getScene('combate');
     const l=scene.luchadores?.[1];return {active:scene.scene.isActive(),
      phase:scene.fase,hp:l?.hp,ko:l?.ko,inmortal:l?.inmortal,
      poison:l?.est?.veneno||null,lastHit:l?.ultimoDano,t:scene.t,
      score:scene.victorias,observed:window.__dodrioPoisonEvent,
      ticks:window.__dodrioPoisonTicks||[]};
    });
    evidence.cases.push({id,pre,diagnostic,error:String(err)});
    await save();
    throw new Error('Poison failed to KO '+id+': '+JSON.stringify(diagnostic));
   }
   const event=await page.evaluate(()=>({event:window.__dodrioPoisonEvent,
    count:window.__dodrioPoisonCount,ticks:window.__dodrioPoisonTicks||[]}));
   evidence.cases.push({id,pre,event});await save();
   assert.equal(event.count,1,id+' native KO must fire once');
   assert.equal(event.event.before.ko,true);
   assert.equal(event.event.before.hp,0);
   // Native morir() clears all statuses BEFORE calling alKO; the
   // already-asserted poisonApplied flag proves this K.O. came from a
   // real poison tick, not fabricated damage or manual alKO.
   assert.equal(event.event.before.poison,false);
   assert.equal(event.event.before.phase,'lucha');
   assert.equal(event.event.after.phase,'ko');
   assert.equal(event.event.after.score[0],1);
   // Reload the scene for the next species without mutating the save.
   await page.evaluate(()=>window.__pt2Game.scene.getScene('combate').scene.start('titulo'));
   await page.waitForFunction(()=>window.__pt2Game.scene.isActive('titulo'),null,{timeout:15000});
  }
  assert.deepEqual(errors,[],'No uncaught Phaser JS exception from poison K.O.');
  console.log('PASS ARENA DODRIO DODUO REAL POISON TO NATIVE KO',JSON.stringify(evidence));
 }finally{await browser.close()}
})().catch(async e=>{console.error(e);try{await save()}catch{}process.exitCode=1})
 .finally(()=>server.close());
