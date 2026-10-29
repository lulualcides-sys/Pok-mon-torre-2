'use strict';
/* End-to-end audit of every Kanto Pokédex stage against the SAME in-game
 * battle resolver. Synthetic Lv50 previews are not an earned campaign save.
 * Original P2 roster/animations and actual saves must remain untouched. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.css':'text/css','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1');
 const file=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const data=await fsp.readFile(file);
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});
  res.end(data);
 }catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(resolve=>server.listen(4622,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720},hasTouch:true,isMobile:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4622/arena2d/?pantalla=pokedex',
   {waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('pokedex'),
   null,{timeout:65000});
  const audit=await page.evaluate(async()=>{
   const {modules}=await (await fetch('/arena2d/version.json')).json();
   const base='/arena2d/'+modules+'/';
   const [{kantoDexStages},{ROSTER},{KANTO_151},{resolveLoadout,availableMoves,campaignLearnset}]=
     await Promise.all(['escenas/pokedex.js','datos.js',
      'torre2/all-kanto-species.js','torre2/move-pool.js'].map(x=>import(base+x)));
   const known=new Set(KANTO_151.map(x=>x.id)),checked=[],issues=[];
   const required=['lmb','rmb','q','e'],exampleNames=['mew','scyther','mr-mime','cubone','marowak','doduo'];
   const samples={};
   const localBefore=JSON.stringify(Object.fromEntries(
     Object.keys(localStorage).map(key=>[key,localStorage.getItem(key)])));
   // 151 distinct species are validated against real battle progression.
   for(const {id} of KANTO_151){
    if(id==='mewtwo')continue; // native lab kit, no campaign legitimacy claim
    const m={id,progression:{species:id,level:50},tmMoves:[]};
    const kit=resolveLoadout(m),pool=new Set(availableMoves(m).map(x=>x.id));
    const learned=new Map(campaignLearnset(id)
      .filter(x=>x.method==='LEVEL').map(x=>[x.id,x.level]));
    const slots=required.map(slot=>kit[slot]);
    for(let i=0;i<slots.length;i++){
     const h=slots[i];
     if(!h?.id||!h.forma||!pool.has(h.id)||!learned.has(h.id))
      issues.push({id,role:required[i],problem:'illegal/unrendered battle slot',move:h?.nome||h?.nombre||null});
    }
    if(new Set(slots.map(x=>x?.id)).size!==4)issues.push({id,problem:'duplicate battle slots'});
    // Different IDs are not enough: the native Bonemerang and an early
    // "ULT · Bonemerang" preview previously occupied two distinct slots.
    const canonical=x=>String(x?.torre2IntroSource||x?.nombre||'')
      .replace(/^ULT · /,'').toLowerCase().replace(/[^a-z0-9]/g,'');
    if(id!=='ditto'&&slots[3]&&slots.slice(0,3).some(x=>
       canonical(x)&&canonical(x)===canonical(slots[3])))
      issues.push({id,problem:'ULT has same underlying move as a normal HAB',
       names:slots.map(x=>x?.nombre||null)});
   }
   for(const def of ROSTER){
    if(!known.has(def.id))continue;
    const stages=kantoDexStages(def);
    stages.forEach((stage,i)=>{
     if(stage.mega)return;
     const id=(i===0?def.id:(def.evoluciones?.[i-1]?.nombre||'')).toLowerCase();
     if(!known.has(id)||id==='mewtwo')return;
     const m={id,progression:{species:id,level:50},tmMoves:[]};
     const selected=resolveLoadout(m),kit=stage.kit;
     const legal=new Map(campaignLearnset(id)
      .filter(x=>x.method==='LEVEL').map(x=>[x.id,x.level]));
     for(const slot of required){
      const h=kit[slot],real=selected[slot];
      if(!h?.id||!h?.forma||h?.pendiente||h?.torre2Unavailable||h?.torre2RequiresTM)
       issues.push({id,slot,stage:i,problem:'Pokédex empty/locked/TM',name:h?.nombre});
      if(h?.id!==real?.id)issues.push({id,slot,stage:i,problem:'Pokédex vs battle',view:h?.id,battle:real?.id});
      if(h?.id&&!legal.has(h.id))
       issues.push({id,slot,stage:i,problem:'Pokédex move not legally learned',name:h?.nombre});
     }
     checked.push(id);
     if(exampleNames.includes(id))samples[id]=Object.fromEntries(required.map(slot=>[slot,kit[slot]?.nombre||'NONE']));
    });
   }
   const sourceDeoxys=ROSTER.find(x=>x.id==='deoxys');
   const dex=sourceDeoxys&&kantoDexStages(sourceDeoxys)[0]?.kit;
   if(!dex||dex.lmb?.nombre!=='Confusion'||dex.rmb?.nombre!=='Psychic'||
      dex.e?.nombre!=='Psycho Boost'||dex.q?.nombre!=='Form Change')
    issues.push({problem:'Deoxys source kit corrupted'});
   const localAfter=JSON.stringify(Object.fromEntries(
     Object.keys(localStorage).map(key=>[key,localStorage.getItem(key)])));
   if(localBefore!==localAfter)issues.push({problem:'Pokédex audit wrote player saves'});
   return {kantoSpecies:KANTO_151.length,checkedStages:checked.length,
     uniqueStages:new Set(checked).size,issues:issues.slice(0,70),
     totalIssues:issues.length,samples};
  });
  fs.writeFileSync('test-evidence/pokedex-151-legal-slot-audit.json',
   JSON.stringify(audit,null,2));
  console.log('POKEDEX_151_AUDIT',JSON.stringify(audit));
  assert.equal(audit.kantoSpecies,151);
  assert.ok(audit.checkedStages>=90,
   'Expected dozens of genuine Kanto Pokédex family stages');
  for(const id of ['mew','scyther','mr-mime','cubone','marowak','doduo'])
   assert.ok(audit.samples[id],id+' not inspected in compiled Pokédex');
  assert.deepEqual(audit.issues,[],'Pokédex illegally hid/replaced native moves');
  assert.equal(audit.totalIssues,0);
  const scene=await page.evaluate(()=>{
   const s=window.__pt2Game.scene.getScene('pokedex');
   const i=s.casillas.findIndex(x=>x?.p?.id==='mew');
   s.elegir(i);
   return {label:s.etapas[0].kit.e?.nombre,drawn:s.movs.list
    .filter(x=>typeof x.text==='string').map(x=>x.text)};
  });
  assert.ok(!scene.drawn.some(x=>/locked|inativo|ensinar tm/i.test(x)),
   'Mew shown with a locked, inactive or unearned TM slot');
  assert.ok(scene.label&&!/struggle/i.test(scene.label),'Mew has no real ULT');
  await page.screenshot({path:'test-evidence/pokedex-mew-legal-ult.png'});
  assert.deepEqual(errors,[],'Runtime errors in full Pokédex audit');
  console.log('PASS_POKEDEX_151_LEGAL_LOADOUTS',audit.uniqueStages);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
