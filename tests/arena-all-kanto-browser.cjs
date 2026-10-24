'use strict';
// Inspect the ACTUAL generated Phaser roster for all Kanto 001–151,
// including native and newly added evolution stages. No save writes.
const assert=require('node:assert/strict'),fsp=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.ogg':'audio/ogg','.mp3':'audio/mpeg','.wav':'audio/wav'};
const server=http.createServer(async(req,res)=>{
 const pathname=new URL(req.url||'/', 'http://127.0.0.1:4288').pathname;
 const target=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
 if(!target.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden');}
 try{const buf=await fsp.readFile(target);res.writeHead(200,{'content-type':mime[path.extname(target)]||'application/octet-stream'});res.end(buf);}catch{res.writeHead(404);res.end('not found');}
});
(async()=>{
 await new Promise(ok=>server.listen(4288,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try {
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
  page.on('pageerror',err=>errors.push(String(err)));
  await page.goto('http://127.0.0.1:4288/arena2d/');
  await page.waitForFunction(()=>window.__pt2Started&&window.__pt2Game?.scene.isActive('titulo'),null,{timeout:45000});
  const audit=await page.evaluate(async()=>{
   const entry=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
   const src=new URL('./',entry);
   const [{ROSTER,buscar},{KANTO_151,addAllKantoSpecies},{EARLY_KANTO_BASE},{Luchador}]=await Promise.all([
    import(new URL('./datos.js',src)),
    import(new URL('./torre2/all-kanto-species.js',src)),
    import(new URL('./torre2/early-kanto-species.js',src)),
    import(new URL('./luchador.js',src))
   ]);
   const ids=KANTO_151.map(p=>p.id),slots=['lmb','rmb','q','e'],modes=['cpu','entreno','arena','liga'];
   const problematic=[],missing=[],bySpecies=[],stillLocked=[],originallyLocked=[];
   for(const species of ids){
    const {def,etapa}=buscar(species);
    if(!def)throw Error('Missing roster definition '+species);
    const fake=Object.create(Luchador.prototype);
    fake.def=def;fake.etapa=etapa;fake.mega=false;fake.jefe=null;fake.aspecto=null;fake.lado=0;
    const details={species,def:def.id,stage:etapa,modes:[],slots:[]};
    for(const mode of modes){
     fake.escena={datos:{modo:mode}};
     const kit=fake.kitActual();
     const status=slots.map(slot=>{
      const h=kit[slot];
      return {slot,name:h?.nombre||null,form:h?.forma||null,pending:h?.pendiente===true};
     });
     details.modes.push({mode,status});
     for(const x of status){
      if(x.pending)stillLocked.push({species,mode,...x});
      if(!x.name||!x.form)missing.push({species,mode,...x});
      if(x.name==='LOCKED')problematic.push({species,mode,...x});
     }
     if(mode==='cpu')details.slots=status;
    }
    bySpecies.push(details);
   }
   const starters=[...EARLY_KANTO_BASE,'bulbasaur','charmander','squirtle'];
   for(const id of starters){
    const info=bySpecies.find(x=>x.species===id);
    if(!info)throw Error('Missing starter '+id);
    for(const slot of info.slots){
     if(!slot.name||!slot.form||slot.pending)problematic.push({starter:id,...slot});
    }
   }
   return {totalKanto:ids.length,totalArenaRoster:ROSTER.length,starters,
    problematic,stillLocked,missing:missing.filter(x=>x.mode==='cpu'),
    initial:bySpecies.filter(x=>starters.includes(x.species)),
    firstIncomplete:bySpecies.filter(x=>x.slots.some(s=>!s.name||!s.form)).slice(0,40)};
  });
  console.log('ALL_KANTO_ARENA_AUDIT',JSON.stringify(audit));
  assert.equal(audit.totalKanto,151);
  assert.deepEqual(audit.stillLocked,[],'Arena/Training/VS CPU/League may not inherit Kanto level locks');
  assert.deepEqual(audit.problematic,[],'First-route added starters must have four installed moves; no LOCKED abilities');
  assert.deepEqual(errors,[],'No Phaser runtime exceptions');
  console.log('PASS: all Kanto species checked across 4 Arena modes; actual built actor kits');
 } finally{await browser.close();server.close();}
})().catch(err=>{console.error(err);server.close();process.exitCode=1});
