'use strict';
// T09: native Phaser/WebGL cooldown on both fighters in a real battle scene.
// Species and inputs are fixture-only; no move renderer, balance, RNG,
// campaign saves, levels or original Poké Arena source is modified.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const fsp=require('node:fs/promises');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 const uri=new URL(req.url||'/', 'http://127.0.0.1:4426');
 const file=path.resolve(root,'.'+(uri.pathname.endsWith('/')?uri.pathname+'index.html':uri.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const bytes=await fsp.readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(bytes)}
 catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(resolve=>server.listen(4426,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
   '--use-gl=angle','--use-angle=swiftshader']});
 const report={scope:'T09 Arena cooldown symmetry across live Phaser player and CPU fighters',
  fixture:'picked species and stationary fight for inspection; NOT natural campaign',
  targetCd:{thunder:3,psybeam:3,'fire-blast':3.5,'solar-beam':3,
   charge:3,'egg-bomb':3,blizzard:4,'hydro-pump':3.5,'seismic-toss':3},
  evidence:[]};
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4426/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  const selection=await page.evaluate(async(targetCd)=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const root=new URL('./',src);
   const {ROSTER}=await import(new URL('./datos.js',root));
   const {Luchador}=await import(new URL('./luchador.js',root));
   const {canonicalMoveKey}=await import(new URL('./torre2/move-pool.js',root));
   const report={options:[],found:{}};
   for(const def of ROSTER){
    const fake=Object.create(Luchador.prototype);
    fake.def=def;fake.etapa=0;fake.mega=false;fake.jefe=null;fake.aspecto=null;fake.lado=0;
    fake.escena={datos:{modo:'cpu'}};
    let kit;try{kit=fake.kitActual()}catch{continue}
    for(const slot of ['lmb','rmb','q','e']){
     const m=kit[slot],key=canonicalMoveKey(m?.nombre);
     if(!(key in targetCd))continue;
     if(!report.found[key])report.found[key]=[];
     report.found[key].push({id:def.id,slot,cd:m.cd,vfx:m.forma});
     if(!m?.pendiente&&m?.forma&&m.cd===targetCd[key]){
      report.options.push({id:def.id,slot,key,cd:m.cd,forma:m.forma});
     }
    }
   }
   return report;
  },report.targetCd);
  const keys=Object.keys(selection.found);
  assert.ok(keys.includes('thunder'),'Built Phaser roster must include Thunder');
  assert.ok(keys.includes('psybeam'),'Built Phaser roster must include Psybeam');
  for(const [key,entries] of Object.entries(selection.found))
   for(const e of entries)assert.equal(e.cd,report.targetCd[key],
    key+' should use approved 2–4s cooldown, '+JSON.stringify(e));
  const preferred=selection.options.find(o=>o.key==='thunder')||
   selection.options.find(o=>o.key==='psybeam')||selection.options[0];
  assert.ok(preferred,'At least one requested move must be available for a live match');
  report.selection=preferred;
  report.covered=Object.fromEntries(Object.entries(selection.found).map(([k,v])=>[k,v.length]));
  await page.evaluate(selected=>{
   window.__pt2Game.scene.getScene('titulo').scene.start('combate',{
    modo:'cpu',p1:selected.id,p2:selected.id,mandos:['kbm','cpu'],nivel:'facil'
   });
  },preferred);
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.fase==='lucha'&&b.luchadores?.length===2&&
    b.luchadores.every(a=>a?.kit&&a?.cd);
  },null,{timeout:65000});
  const first=await page.evaluate(expected=>{
   const b=window.__pt2Game.scene.getScene('combate');
   const values=b.luchadores.map((actor,i)=>({
    side:i,species:actor.def?.id,stage:actor.etapa,cd:actor.kit?.[expected.slot]?.cd,
    name:actor.kit?.[expected.slot]?.nombre,forma:actor.kit?.[expected.slot]?.forma,
    slot:expected.slot,currentCd:actor.cd?.[expected.slot],actorTime:actor.t
   }));
   return {renderType:b.game.renderer.type,phase:b.fase,values};
  },preferred);
  report.evidence.push({kind:'live fight readiness',...first});
  assert.equal(first.values.length,2);
  assert.ok(first.values.every(x=>x.species===preferred.id),'Same species must be present on both sides');
  for(const a of first.values){
   assert.equal(a.name?.toLowerCase().replace(/[^a-z0-9]+/g,'-'),preferred.key,
    'Real fighter must equip selected cooldown move on side '+a.side);
   assert.equal(a.cd,preferred.cd,'Live fighter cooldown must match installed kit on side '+a.side);
   assert.equal(a.forma,preferred.forma,'Preserve real approved VFX on side '+a.side);
  }
  assert.equal(first.values[0].cd,first.values[1].cd,'Player and CPU use the same cooldown');
  await page.screenshot({path:'test-evidence/t09-live-symmetric-cooldown.png'});
  assert.deepEqual(errors,[],'No Phaser exceptions during match');
  fs.writeFileSync('test-evidence/t09-native-cooldown-symmetry.json',JSON.stringify(report,null,2));
  console.log('T09 PASS LIVE CD PLAYER/CPU',JSON.stringify(report));
 }finally{await browser.close();server.close();}
})().catch(err=>{console.error(err);process.exitCode=1;server.close()});
