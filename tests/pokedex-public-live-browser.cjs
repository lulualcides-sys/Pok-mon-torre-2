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
  const errors=[],missing=[],failedRequests=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('requestfailed',request=>{
   const failure=request.failure();
   if(failedRequests.length<40)failedRequests.push({
    url:request.url(),error:typeof failure==='string'?failure:(failure?.errorText||'unknown')
   });
  });
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
  if(process.env.EXPECTED_POKEDEX_BUILD)
   assert.equal(version.modules,process.env.EXPECTED_POKEDEX_BUILD,
    'Public Pages is serving an older build than the deployment just uploaded');
  try{
   await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('pokedex'),
    null,{timeout:90000});
  }catch(error){
   // The independent 150-species public audit previously timed out before
   // saving evidence. Preserve the REAL browser state; never fake a pass.
   const state=await page.evaluate(()=>({
    readyState:document.readyState,url:location.href,
    gamePresent:Boolean(window.__pt2Game),
    scenes:window.__pt2Game?.scene?.scenes?.map(scene=>({
     key:scene.sys?.settings?.key,active:Boolean(scene.sys?.isActive?.())
    })).slice(0,25)||[],
    canvasCount:document.querySelectorAll('canvas').length,
    title:document.title,body:document.body?.innerText?.slice(0,500)||''
   })).catch(e=>({evaluationError:String(e)}));
   const diagnostic={
    failure:String(error),publicVersion:version.modules,state,
    errors,missing,failedRequests
   };
   fs.writeFileSync('test-evidence/pokedex-public-boot-diagnostic.json',
    JSON.stringify(diagnostic,null,2));
   console.error('PUBLIC_POKEDEX_BOOT_DIAGNOSTIC',JSON.stringify(diagnostic));
   await page.screenshot({
    path:'test-evidence/pokedex-public-boot-failure.png',fullPage:true,timeout:15000
   }).catch(e=>console.error('PUBLIC_POKEDEX_SCREENSHOT_FAILURE',String(e)));
   throw error;
  }
  const result=await page.evaluate(async({expect,release,auditFull})=>{
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
   // Inspect actual PUBLIC Phaser Pokédex stage cards, not only compiled
   // fixtures. Mewtwo is a laboratory encounter, not a Kanto campaign slot.
   // No XP, save, TM, or battle state is changed by these read-only checks.
   const root=new URL('.',location.href);
   const [{KANTO_151},{resolveLoadout},{kantoDexStages}]=await Promise.all([
    import(new URL(release+'/torre2/all-kanto-species.js',root).href),
    import(new URL(release+'/torre2/move-pool.js',root).href),
    import(new URL(release+'/escenas/pokedex.js',root).href)
   ]);
   const eligible=new Set(KANTO_151.filter(p=>p.id!=='mewtwo').map(p=>p.id));
   const found=new Set(),problems=[],roles=['lmb','rmb','q','e'];
   const savedBefore=JSON.stringify(Object.fromEntries(
    Object.keys(localStorage).map(key=>[key,localStorage.getItem(key)])));
   if(auditFull){
   for(let i=0;i<scene.casillas.length;i++){
    const family=scene.casillas[i]?.p;
    if(!family)continue;
    scene.elegir(i);
    for(let stageIndex=0;stageIndex<scene.etapas.length;stageIndex++){
     const stage=scene.etapas[stageIndex];
     if(stage?.mega)continue;
     const id=String(stageIndex===0?family.id:
      (family.evoluciones?.[stageIndex-1]?.nombre||stage?.nombre||'')).toLowerCase();
     // Native P2 may expose alternate/mega/costume forms with the same
     // Kanto species ID. They are NOT separate Kanto campaign evolutions.
     if(!eligible.has(id)||found.has(id))continue;
     scene.irEtapa(stageIndex);
     // PMD Idle sheets load asynchronously on the first evolution click.
     // Reading immediately after irEtapa() incorrectly inspects the BASE
     // form (Pidgey instead of Pidgeot, Caterpie instead of Butterfree).
     const until=Date.now()+15000;
     while(scene.etapa!==stageIndex){
      if(Date.now()>until)throw Error('Evolution tab failed to load: '+id);
      await new Promise(resolve=>setTimeout(resolve,40));
     }
     const displayed=scene.etapas[scene.etapa]?.kit||{};
     const expectedKit=resolveLoadout({id,progression:{species:id,level:50},tmMoves:[]});
     const computed=kantoDexStages(family)[stageIndex]?.kit||{};
     const afterStageName=scene.etapas[scene.etapa]?.nombre;
     found.add(id);
     for(const role of roles){
      const move=displayed[role],real=expectedKit[role];
      if(!move?.id||!move?.forma||move.pendiente||
         move.torre2Unavailable||move.torre2RequiresTM)
       problems.push({id,role,family:family.id,stageIndex,stageName:stage?.nombre,kind:'missing/locked/TM',move:move?.nombre||null});
      if(move?.id!==real?.id)
       problems.push({id,role,family:family.id,stageIndex,stageName:stage?.nombre,afterStageName,kind:'Pokédex differs from battle',
        view:move?.id||null,battle:real?.id||null,computed:computed[role]?.id||null});
     }
    }
   }
   }
   const savedAfter=JSON.stringify(Object.fromEntries(
    Object.keys(localStorage).map(key=>[key,localStorage.getItem(key)])));
   if(savedBefore!==savedAfter)
    problems.push({kind:'public Pokédex inspection modified player save'});
   const kanto=auditFull?{eligible:eligible.size,visible:found.size,
    missing:[...eligible].filter(id=>!found.has(id)),
    problems:problems.slice(0,40),totalProblems:problems.length}:null;
   return{build,installed,cardCount:scene.casillas.length,observations,kanto};
  },{expect:expected,release:version.modules,
   auditFull:process.env.POKEDEX_FULL_PUBLIC_AUDIT==='1'});
  const report={url,build:result.build,publicVersion:version.modules,
   installed:result.installed,cardCount:result.cardCount,
   observations:result.observations,kanto:result.kanto,errors,missing};
  fs.writeFileSync('test-evidence/pokedex-public-live-audit.json',
   JSON.stringify(report,null,2));
  console.log('PUBLIC_POKEDEX_AUDIT',JSON.stringify(report));
  assert.equal(result.build,version.modules,
   'HTML uses stale Phaser code; public version.json refers to a different release');
  assert.ok(result.installed.some(s=>s.includes('/'+version.modules+'/main.js')),
   'Browser loaded a stale Phaser entrypoint');
  assert.ok(result.cardCount>=90,'Expected at least 90 roster families');
  if(process.env.POKEDEX_FULL_PUBLIC_AUDIT==='1'){
  assert.equal(result.kanto.eligible,150,'Kanto campaign should cover 150 species');
  assert.deepEqual(result.kanto.missing,[],
   'Some Kanto species are absent from the ACTUAL public Pokédex');
  assert.equal(result.kanto.visible,150,
   'Public Pokédex does not expose all 150 campaign species');
  assert.equal(result.kanto.totalProblems,0,
   'Public Kanto stage kits differ from real Lv50 battle loadouts: '+
    JSON.stringify(result.kanto.problems));
  }
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
