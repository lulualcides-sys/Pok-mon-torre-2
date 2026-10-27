'use strict';
/* Inspect the built native Phaser client. No save writes or game balance hacks. */
const assert=require('node:assert/strict'),fsp=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg'};
const server=http.createServer(async(req,res)=>{
 const p=new URL(req.url,'http://127.0.0.1:4293').pathname,filename=path.resolve(root,'.'+(p.endsWith('/')?p+'index.html':p));
 if(!filename.startsWith(root+path.sep)){res.writeHead(403);return res.end('denied');}
 try{const bytes=await fsp.readFile(filename);res.writeHead(200,{'content-type':mime[path.extname(filename)]||'application/octet-stream'});res.end(bytes);}
 catch{res.writeHead(404);res.end('missing');}
});
(async()=>{
 await new Promise(resolve=>server.listen(4293,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4293/arena2d/?original=1');
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:45000});
  const results=await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
   const base=new URL('./',src);
   const {ROSTER,buscar}=await import(new URL('./datos.js',base));
   const {Luchador}=await import(new URL('./luchador.js',base));
   const fighter=(id,campaign=false)=>{
    const info=buscar(id);
    if(!info?.def)throw Error('Missing Pokémon '+id);
    const f=Object.create(Luchador.prototype);
    f.def=info.def;f.etapa=info.etapa;f.mega=false;f.jefe=null;f.aspecto=null;f.lado=0;
    f.escena={datos:campaign?{torre2:true}:{modo:'cpu'}};
    return f;
   };
   const variants={},tested=['clefairy','persian','raticate','marowak','kingler','weezing','porygon'];
   for(const name of tested){
    try{const f=fighter(name);const kit=f.kitActual();
     variants[name]={added:f.def.torre2ArenaAdded===true,slots:['lmb','rmb','q','e'].map(s=>({name:kit[s]?.nombre||null,cd:kit[s]?.cd??null}))};
    }catch(e){variants[name]={error:String(e)};}
   }
   const history=[];
   const origRandom=Math.random;
   try{
    for(const seed of [0,.4,.99]){
     Math.random=()=>seed;
     const f=fighter('eevee');f.etapa=1;
     const first=f.forma.nombre,second=f.forma.nombre;
     const skills=f.kitActual();
     history.push({seed,first,second,stage:f.etapa,mayEvolve:f.puedeEvolucionar,
      skills:['lmb','rmb','q','e'].map(s=>({name:skills[s]?.nombre||null,type:skills[s]?.tipo||null}))});
    }
   }finally{Math.random=origRandom;}
   const campaign=fighter('eevee',true);campaign.etapa=1;
   const original=campaign.forma.nombre;
   const cooldown={};
   for(const def of ROSTER){
    for(let stage=0;stage<=def.evoluciones.length;stage++){
     const f=Object.create(Luchador.prototype);
     f.def=def;f.etapa=stage;f.mega=false;f.jefe=null;f.aspecto=null;f.lado=0;
     f.escena={datos:{modo:'cpu'}};
     let kit;
     try{kit=f.kitActual();}catch{continue;}
     for(const slot of ['lmb','rmb','q','e']){
      const attack=kit[slot];if(!attack?.nombre)continue;
      const key=attack.nombre.toLowerCase();
      if(!['blizzard','seismic toss','hydro pump','egg bomb','eggbomb','bomba de ovo','bomba-ovo','bomba de huevos','thunder','psybeam','psy beam','fire blast','charge'].includes(key))continue;
      (cooldown[key]??=[]).push({species:def.id,stage,cd:attack.cd});
     }
    }
   }
   return {variants,history,campaign:original,cooldown,rosterSize:ROSTER.length};
  });
  console.log('ARENA_REVIEW',JSON.stringify(results));
  for(const name of ['clefairy','persian','raticate','marowak','kingler','weezing','porygon']){
   const row=results.variants[name];
   assert.ok(row&&!row.error,'Valid Arena kit '+name+': '+row?.error);
   if(!row.added)continue; // never rewrite original P2 fighters
   assert.ok(!row.slots.some(x=>x.name==='Hyper Beam'),'Do not give generic Hyper Beam to '+name);
  }
  const offTheme={
    clefairy:['Water Pulse','Solar Beam'],
    persian:['Water Pulse','Shadow Ball'],
    raticate:['Blizzard'],
    marowak:['Blizzard'],
    kingler:['Blizzard']
  };
  for(const [species,banned] of Object.entries(offTheme)){
   const row=results.variants[species];
   if(row?.added)for(const name of banned)
    assert.ok(!row.slots.some(x=>x.name===name),species+' should not auto-equip unrelated TM '+name);
  }
  const persian=results.variants.persian;
  if(persian.added)assert.ok(persian.slots.some(x=>x.name==='Pay Day'),'Persian approved signature');
  const marowak=results.variants.marowak;
  if(marowak.added)assert.ok(marowak.slots.some(x=>x.name==='Bonemerang'),'Marowak approved signature');
  assert.deepEqual(results.history.map(x=>x.first),['VAPOREON','JOLTEON','FLAREON'],'Eevee branches should be three distinct outcomes');
  assert.ok(results.history.every(x=>x.first===x.second&&!x.mayEvolve),'Branch stable until end of battle');
  const eeveeTypes={VAPOREON:'WATER',JOLTEON:'ELECTRIC',FLAREON:'FIRE'};
  for(const row of results.history)assert.ok(row.skills.some(s=>s.type===eeveeTypes[row.first]),
   'Eevee '+row.first+' needs a signature attack matching its evolution');
  assert.equal(results.campaign,'VAPOREON','Campaign explicitly unchanged');
  for(const [name,expected] of [['blizzard',4],['seismic toss',3],['hydro pump',3.5]]){
   assert.ok((results.cooldown[name]||[]).length>0,name+' must be present in built Phaser client');
   for(const h of results.cooldown[name]||[])assert.equal(h.cd,expected,
    name+' must follow 2–4s Arena pacing for '+JSON.stringify(h));
  }
  const eggNames=['egg bomb','eggbomb','bomba de ovo','bomba-ovo','bomba de huevos'];
  for(const name of eggNames)for(const h of results.cooldown[name]||[])
   assert.equal(h.cd,3,'Egg Bomb must have 3s Arena cooldown for '+JSON.stringify(h));
  assert.ok((results.cooldown.thunder||[]).length>0,
   'Thunder must exist in at least one Pokémon Arena kit');
  for(const attack of results.cooldown.thunder)
   assert.equal(attack.cd,3,'Thunder exact 3s cooldown for '+JSON.stringify(attack));
  const psybeam=(results.cooldown.psybeam||[]).concat(results.cooldown['psy beam']||[]);
  assert.ok(psybeam.length>0,'Psybeam should be present in a real Arena roster kit');
  for(const attack of psybeam)
   assert.equal(attack.cd,3,'Psybeam must have 3s cooldown '+JSON.stringify(attack));
  assert.ok((results.cooldown['fire blast']||[]).length>0,
    'Fire Blast must be present in actual Arena roster');
  for(const attack of results.cooldown['fire blast'])
   assert.equal(attack.cd,3.5,'Fire Blast 3.5s for '+JSON.stringify(attack));
  for(const attack of results.cooldown.charge||[])
   assert.equal(attack.cd,3,'Charge 3s for '+JSON.stringify(attack));
  assert.deepEqual(errors,[],'No JS errors in public-game equivalent');
  console.log('PASS real generated Phaser Arena move policy / Eevee / cooldown');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
