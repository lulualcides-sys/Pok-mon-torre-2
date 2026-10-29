'use strict';
/* Verify the ACTUAL public GitHub Pages site, not a local _site build.
 * This is the gap that let an asset-only deployment gate pass while the
 * player reported outdated / locked Kanto Pokédex slots.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright-core');
const base=(process.env.POKEDEX_PUBLIC_URL||
 'https://lulualcides-sys.github.io/Pok-mon-torre-2/arena2d/').replace(/\/?$/,'/');
const expected={
 mew:['Pound','Ancient Power','Mega Punch','ULT · Psychic'],
 scyther:['Wing Attack','Fury Cutter','Double Team','X-Scissor'],
 'mr-mime':['Pound','Confusion','Psywave','Psychic'],
 cubone:['Bone Rush','Bone Club','Bonemerang','Earthquake'],
 marowak:['Bone Rush','Bone Club','Bonemerang','Earthquake'],
 doduo:['Peck','Jump Kick','Drill Peck','ULT · Tri Attack'],
 deoxys:['Confusion','Psychic','Form Change','Psycho Boost']
};
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 const browser=await chromium.launch({
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720},
   isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const errors=[],missing=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base))missing.push([r.status(),r.url()])});
  // A unique navigation URL avoids reusing the user's old cached HTML.
  const unique=Date.now().toString(36);
  const url=base+'index.html?pantalla=pokedex&torre2-check='+unique;
  const res=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
  assert.equal(res?.status(),200,'The public Phaser Pokédex page is not available');
  const verResponse=await page.request.get(base+'version.json?torre2-check='+unique,
   {headers:{'Cache-Control':'no-cache'},timeout:30000});
  assert.equal(verResponse.status(),200,'Public version.json not found');
  const version=await verResponse.json();
  assert.match(version.modules||'',/^src-[a-f0-9]{10}$/);
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('pokedex'),
   null,{timeout:90000});
  const result=await page.evaluate(async(expect)=>{
   const scene=window.__pt2Game.scene.getScene('pokedex');
   const build=document.querySelector('meta[name="pokemon-torre-build"]')?.content;
   const installed=performance.getEntriesByType('resource').map(x=>x.name)
    .filter(x=>/\/src-[0-9a-f]{10}\/main\.js/.test(x));
   const observations={};
   for(const [id,names] of Object.entries(expect)){
    // The original Poké Arena roster stores evolutions under their
    // family card: Marowak is tab 2 of Cubone, not a separate card.
    const family=id==='marowak'?'cubone':id;
    const i=scene.casillas.findIndex(x=>x?.p?.id===family);
    if(i<0){observations[id]={error:'family not in ROSTER'};continue}
    scene.elegir(i);
    if(id==='marowak'){
     const evo=scene.etapas.findIndex(x=>x?.nombre?.toLowerCase()==='marowak');
     if(evo<0){observations[id]={error:'Marowak evolution tab missing'};continue}
     scene.irEtapa(evo);
    }
    const kit=scene.etapas[scene.etapa]?.kit||{};
    const slots=['lmb','rmb','q','e'];
    observations[id]={
     slots:Object.fromEntries(slots.map(slot=>[slot,kit[slot]?.nombre||null])),
     unavailable:slots.filter(slot=>
      !kit[slot]?.forma||kit[slot]?.pendiente||kit[slot]?.torre2Unavailable||kit[slot]?.torre2RequiresTM),
     visible:scene.movs?.list?.filter(x=>typeof x.text==='string').map(x=>x.text).slice(0,25)||[],
     descriptor:scene.lema?.text||''
    };
   }
   return{build,installed,cardCount:scene.casillas.length,observations};
  },expected);
  const report={url,build:result.build,publicVersion:version.modules,
   installed:result.installed,cardCount:result.cardCount,
   observations:result.observations,errors,missing};
  fs.writeFileSync('test-evidence/pokedex-public-live-audit.json',
   JSON.stringify(report,null,2));
  console.log('PUBLIC_POKEDEX_AUDIT',JSON.stringify(report));
  assert.equal(result.build,version.modules,
   'HTML uses stale Phaser code; public version.json refers to a different release');
  assert.ok(result.installed.some(s=>s.includes('/'+version.modules+'/main.js')),
   'Browser loaded a stale Phaser entrypoint');
  assert.ok(result.cardCount>=90,'Expected at least 90 roster families');
  for(const [id,names] of Object.entries(expected)){
   const item=result.observations[id];
   assert.ok(item&&!item.error,id+' missing on public Pokédex');
   const values=['lmb','rmb','q','e'].map(k=>item.slots[k]);
   assert.deepEqual(values,names,
    'PUBLIC Pokédex stale/incorrect for '+id+'; real loaded slots: '+JSON.stringify(values));
   assert.deepEqual(item.unavailable,[],id+' shows Locked, inactive or unlearned TM');
  }
  assert.match(result.observations.mew.descriptor,/KIT CAMPANHA · NV50/);
  assert.deepEqual(errors,[],'Public Phaser browser runtime errors');
  assert.deepEqual(missing,[],'Missing assets on the published site');
  await page.screenshot({path:'test-evidence/pokedex-public-live-last.png',fullPage:true});
  console.log('PASS_PUBLIC_POKEDEX_RELEASE',version.modules);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
