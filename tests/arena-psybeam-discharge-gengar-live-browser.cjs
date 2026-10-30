'use strict';
// Verify actual Phaser casts and recast rejection, not merely configured kit.cd.
const assert=require('node:assert/strict'),fs=require('node:fs/promises');
const path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site'),port=4517;
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp',
 '.ogg':'audio/ogg','.mp3':'audio/mpeg','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1:'+port);
 const file=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const bytes=await fs.readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(bytes)}
 catch{res.writeHead(404);res.end('missing')}
});
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 await new Promise(ok=>server.listen(port,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
   '--use-gl=angle','--use-angle=swiftshader']});
 const report={checks:[]};
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:'+port+'/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  for(const check of [
   {species:'abra',move:'psybeam',seconds:3},
   {species:'magneton',move:'discharge',seconds:3},
   {species:'gengar',move:null,seconds:null}
  ]){
   await page.evaluate(species=>window.__pt2Game.scene.getScene('titulo').scene.start('combate',{
    modo:'cpu',p1:species,p2:'mewtwo',mandos:['tactil','pad0'],nivel:'facil'
   }),check.species);
   await page.waitForFunction(()=>{
    const s=window.__pt2Game.scene.getScene('combate');
    return s.scene.isActive()&&s.fase==='lucha'&&s.panelTactil&&s.luchadores?.length===2;
   },null,{timeout:30000});
   const initial=await page.evaluate(expected=>{
    const s=__pt2Game.scene.getScene('combate'),me=s.luchadores[0],enemy=s.luchadores[1];
    me.inmortal=true;enemy.inmortal=true;me.energia=100;me.ulti=100;
    s.controles[1].leer=()=>({mx:0,my:0,ax:me.x,ay:me.y});
    const key=m=>String(m?.nombre||'').toLowerCase().replace(/[^a-z0-9]+/g,'-');
    const kit=Object.fromEntries(['lmb','rmb','q','e'].map(slot=>[slot,{
     nombre:me.kit[slot]?.nombre,cd:me.kit[slot]?.cd,
     forma:me.kit[slot]?.forma,pendiente:me.kit[slot]?.pendiente
    }]));
    const slot=Object.keys(kit).find(slot=>key(kit[slot])===expected.move);
    return {species:me.def?.id,stage:me.etapa,kit,slot,
     buttons:s.panelTactil.botones.map(b=>b.slot)};
   },check);
   if(check.species==='gengar'){
    const names=Object.values(initial.kit).map(v=>v.nombre);
    assert.ok(!names.includes('Hyper Beam'),'Native Gengar must never be equipped with generic Hyper Beam');
    assert.ok(names.some(name=>['Shadow Ball','Sludge Bomb','Shadow Punch','Night Shade','Dark Pulse'].includes(name)),
     'Gengar must retain a damaging thematic attack');
    report.checks.push({species:'gengar',nativeKit:initial.kit,passed:true});
   }else{
    assert.ok(initial.slot,check.species+' missing '+check.move+' in live Phaser kit');
    assert.equal(initial.kit[initial.slot].cd,check.seconds,
     check.move+' configured cooldown must be '+check.seconds+'s');
    assert.ok(initial.buttons.includes(initial.slot),'Touch button unavailable: '+initial.slot);
    // Touch is the actual native Arena control path; do not invoke a mock attack.
    const touch=async ()=>{
     return page.evaluate(slot=>{
      const s=__pt2Game.scene.getScene('combate'),me=s.luchadores[0],p=s.panelTactil;
      me.energia=100;me.ulti=100;me.accion=null;me.dash=null;me.est={};
      me.dolorHasta=-1;me.ultimoAtaque=-100;me.ultimoBasico=-100;
      s.pausado=false;s.pausaGolpe=0;s.fase='lucha';
      const b=p.botones.find(x=>x.slot===slot),at=p.pos(b);
      const origin=p.punto({x:0,y:0}),unit=p.punto({x:1,y:1});
      const finger={id:89,x:(at.x-origin.x)/(unit.x-origin.x),
       y:(at.y-origin.y)/(unit.y-origin.y)};
      const before=me.stats.usosSlot?.[slot]||0;
      p.abajo(finger);
      p.leer(x=>({ax:x.x,ay:x.y}));
      p.arriba({id:89});
      return {before,remaining:me.cd[slot]};
     },initial.slot);
    };
    const firstBefore=await touch();await wait(460);
    const first=await page.evaluate(slot=>{
     const p=__pt2Game.scene.getScene('combate').luchadores[0];
     return {casts:p.stats.usosSlot?.[slot]||0,cd:p.cd[slot]};
    },initial.slot);
    assert.ok(first.casts>firstBefore.before,
     check.move+' must fire via native touch control');
    assert.ok(first.cd>1.8,
     check.move+' must start actual cooldown after native cast: '+JSON.stringify(first));
    const deniedBefore=await touch();await wait(240);
    const denied=await page.evaluate(slot=>{
     const p=__pt2Game.scene.getScene('combate').luchadores[0];
     return {casts:p.stats.usosSlot?.[slot]||0,cd:p.cd[slot]};
    },initial.slot);
    assert.equal(denied.casts,first.casts,
     check.move+' re-fired before cooldown expired (instant spam bug)');
    assert.ok(denied.cd>0,'Cooldown must remain active on denied cast');
    // Confirm recovery after the real timer counts down.
    await page.waitForFunction(slot=>{
     const s=__pt2Game.scene.getScene('combate'),me=s.luchadores[0];
     return me?.cd?.[slot]<=0;
    },initial.slot,{timeout:8500});
    const readyBefore=await touch();await wait(460);
    const ready=await page.evaluate(slot=>{
     const p=__pt2Game.scene.getScene('combate').luchadores[0];
     return {casts:p.stats.usosSlot?.[slot]||0,cd:p.cd[slot]};
    },initial.slot);
    assert.ok(ready.casts>denied.casts,check.move+' must become usable after 3s cooldown');
    report.checks.push({species:check.species,slot:initial.slot,configured:check.seconds,
     first,denied,ready,passed:true});
   }
   await page.evaluate(()=>__pt2Game.scene.getScene('combate').scene.start('titulo'));
   await page.waitForFunction(()=>__pt2Game.scene.isActive('titulo'),null,{timeout:12000});
  }
  assert.deepEqual(errors,[],'No browser Phaser exceptions');
  await fs.mkdir('test-evidence',{recursive:true});
  await fs.writeFile('test-evidence/arena-psybeam-discharge-gengar-live.json',JSON.stringify(report,null,2));
  console.log('PASS LIVE PSYBEAM DISCHARGE GENGAR',JSON.stringify(report));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
