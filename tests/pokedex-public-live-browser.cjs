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
 mew:['Pound','Ancient Power','Mega Punch','Psychic'],
 // KIT CAMPANHA · NV50 must reflect the campaign resolver, not the
 // separate Arena-121 preset. Swords Dance is the actual Lv50 HAB3.
 scyther:['Wing Attack','Fury Cutter','Swords Dance','X-Scissor'],
 'mr-mime':['Pound','Confusion','Psywave','Psychic'],
 cubone:['Bone Rush','Bone Club','Bonemerang','Earthquake'],
 marowak:['Bone Rush','Bone Club','Bonemerang','Earthquake'],
 // Doduo is Torre 2-added: its current legal Lv50 battle resolver uses
 // Fury Attack; Jump Kick belonged to an obsolete hard-coded expectation.
 doduo:['Peck','Fury Attack','Drill Peck','ULT · Tri Attack'],
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
     ultSlot:{id:kit.e?.id||null,isUltimate:kit.e?.ulti===true},
     ultLabelVisible:scene.movs?.list?.some(x=>typeof x.text==='string'&&x.text==='ULT')===true,
     unavailable:slots.filter(slot=>
      !kit[slot]?.forma||kit[slot]?.pendiente||kit[slot]?.torre2Unavailable||kit[slot]?.torre2RequiresTM),
     visible:scene.movs?.list?.filter(x=>typeof x.text==='string').map(x=>x.text).slice(0,25)||[],
     descriptor:scene.lema?.text||''
    };
   }
   // Native P2 movesets must remain identical to the original source.
   // Newly added Kanto species must match the real Torre 2 Lv50 loadout.
   // Audit all grouped evolution tabs only once per family root.
   const root=new URL('.',location.href);
   const [{KANTO_151},{resolveLoadout},{etapasDe},{ROSTER}]=await Promise.all([
    import(new URL(release+'/torre2/all-kanto-species.js',root).href),
    import(new URL(release+'/torre2/move-pool.js',root).href),
    import(new URL(release+'/escenas/pokedex.js',root).href),
    import(new URL(release+'/datos.js',root).href)
   ]);
   const dexId=new Map(KANTO_151.filter(p=>p.id!=='mewtwo').map(p=>[p.num,p.id]));
   const eligible=new Set(dexId.values());
   const native=new Map(),roles=['lmb','rmb','q','e'];
   for(const p of ROSTER){
    if(p.torre2ArenaAdded)continue;
    for(const e of etapasDe(p)){
     const dex=Number(e.dex);
     if(dexId.has(dex)&&!native.has(dex))native.set(dex,{stage:e,source:p.id});
    }
   }
   const found=new Set(),roots=new Set(),problems=[],nativeEmpty=[];
   let nativeChecked=0,addedChecked=0;
   const savedBefore=JSON.stringify(Object.fromEntries(
    Object.keys(localStorage).map(key=>[key,localStorage.getItem(key)])));
   if(auditFull){
    for(let i=0;i<scene.casillas.length;i++){
     if(!scene.casillas[i]?.p)continue;
     scene.elegir(i);
     if(roots.has(scene.foco))continue;
     roots.add(scene.foco);
     const stages=scene.etapas.slice();
     for(let stageIndex=0;stageIndex<stages.length;stageIndex++){
      const stage=stages[stageIndex],dex=Number(stage?.dex),id=dexId.get(dex);
      if(!id||stage.mega||found.has(id))continue;
      scene.irEtapa(stageIndex);
      const until=Date.now()+15000;
      while(scene.etapa!==stageIndex){
       if(Date.now()>until)throw Error('Evolution tab not ready: '+id);
       await new Promise(resolve=>setTimeout(resolve,40));
      }
      const displayed=scene.etapas[scene.etapa]?.kit||{};
      found.add(id);
      if(native.has(dex)){
       nativeChecked++;
       const original=native.get(dex);
       for(const role of roles){
        const view=displayed[role],base=original.stage.kit?.[role];
        if(!view?.forma)nativeEmpty.push({id,role});
        for(const field of ['id','nombre','forma','tipo','dano','cd','coste','ulti','dist','vel','anim']){
         if((view?.[field]??null)!==(base?.[field]??null))
          problems.push({id,role,kind:'native P2 kit changed',field,
           view:view?.[field]??null,original:base?.[field]??null});
        }
       }
      }else{
       addedChecked++;
       const expectedKit=resolveLoadout({
        id,progression:{species:id,level:50},tmMoves:[]
       });
       for(const role of roles){
        const view=displayed[role],real=expectedKit[role];
        if(!view?.id||!view?.forma||view.pendiente||
           view.torre2Unavailable||view.torre2RequiresTM)
         problems.push({id,role,kind:'added stage missing/locked/TM',
          move:view?.nombre||null});
        if(view?.id!==real?.id)
         problems.push({id,role,kind:'added stage differs from battle',
          view:view?.id||null,battle:real?.id||null});
       }
      }
     }
    }
   }
   // When public Pokédex changes, ensure Doduo's four shown skills are the
   // same legal skills equipped by the REAL Torre 2 Lv50 battle resolver.
   // Never change original P2 species data to satisfy a stale snapshot.
   const doduoBattle=resolveLoadout({
    id:'doduo',progression:{species:'doduo',level:50},tmMoves:[]
   });
   const doduoBattleNames=roles.map(slot=>doduoBattle[slot]?.nombre||null);
   const savedAfter=JSON.stringify(Object.fromEntries(
    Object.keys(localStorage).map(key=>[key,localStorage.getItem(key)])));
   if(savedBefore!==savedAfter)
    problems.push({kind:'public Pokédex inspection modified player save'});
   const kanto=auditFull?{eligible:eligible.size,visible:found.size,
    nativeChecked,addedChecked,nativeEmpty:nativeEmpty.slice(0,40),
    missing:[...eligible].filter(id=>!found.has(id)),
    problems:problems.slice(0,60),totalProblems:problems.length}:null;
   return{build,installed,cardCount:scene.casillas.length,observations,kanto,doduoBattleNames};
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
  assert.equal(result.kanto.nativeChecked+result.kanto.addedChecked,150,
   'Every Kanto species must be audited under native or added moveset rules');
  assert.ok(result.kanto.nativeChecked>0&&result.kanto.addedChecked>0,
   'Do not silently exclude native P2 or newly added Torre 2 species');
  assert.deepEqual(result.kanto.missing,[],
   'Some Kanto species are absent from the ACTUAL public Pokédex');
  assert.equal(result.kanto.visible,150,
   'Public Pokédex does not expose all 150 campaign species');
  assert.equal(result.kanto.totalProblems,0,
   'Public Kanto stage kits differ from real Lv50 battle loadouts: '+
    JSON.stringify(result.kanto.problems));
  }
  // A matching static label is not sufficient: the public Pokédex must
  // agree with the live, installed battle resolver at the same level.
  const observedDoduo=['lmb','rmb','q','e'].map(slot=>result.observations.doduo?.slots?.[slot]);
  // An explicit role badge ("ULT ·") is presentation, not a move-name
  // mismatch. Compare the exact underlying moves after removing that label.
  const moveName=value=>String(value||'').replace(/^ULT\s*·\s*/i,'').trim();
  assert.deepEqual(observedDoduo.map(moveName),result.doduoBattleNames.map(moveName),
   'Public Doduo Pokédex differs from its current Lv50 battle moves');
  for(const [id,names] of Object.entries(expected)){
   const item=result.observations[id];
   assert.ok(item&&!item.error,id+' missing on public Pokédex');
   const values=['lmb','rmb','q','e'].map(k=>item.slots[k]);
   assert.deepEqual(values,names,
    'PUBLIC Pokédex stale/incorrect for '+id+'; real loaded slots: '+JSON.stringify(values));
   assert.deepEqual(item.unavailable,[],id+' shows Locked, inactive or unlearned TM');
  }
   assert.equal(result.observations.scyther.descriptor,'KIT CAMPANHA · NV50',
    'Scyther expected slot only applies to the campaign Lv50 Pokédex view');
  // Separate canonical move names from the role badge. Native Psychic
  // is the move name; its fourth-slot metadata and visible ULT badge
  // must BOTH be retained. Do not weaken any Pokédex/UI assertion.
  assert.equal(result.observations.mew.ultSlot.id,'psychic');
  assert.equal(result.observations.mew.ultSlot.isUltimate,true,
   'Mew Psychic must remain a real ULT in the fourth slot');
  assert.equal(result.observations.mew.ultLabelVisible,true,
   'Mew Psychic must visibly display the ULT role badge');
  assert.match(result.observations.mew.descriptor,/KIT CAMPANHA · NV50/);
  assert.deepEqual(errors,[],'Public Phaser browser runtime errors');
  assert.deepEqual(missing,[],'Missing assets on the published site');
  if(process.env.POKEDEX_FAMILY_AUDIT==='1'){
   const grouped=await page.evaluate(()=>{
    const scene=window.__pt2Game.scene.getScene('pokedex'),out={};
    for(const id of ['smoochum','elekid','magby','tyrogue']){
     const i=scene.casillas.findIndex(c=>c?.p?.id===id);
     if(i<0){out[id]={error:'missing family root'};continue}
     scene.elegir(i);
     out[id]={
      stageNames:(scene.etapas||[]).map(e=>String(e.nombre||'').toLowerCase()),
      description:scene.lema?.text||'',
      page:scene.dexPage,
      pages:scene.dexPages
     };
    }
    return out;
   });
   fs.writeFileSync('test-evidence/pokedex-public-families.json',
    JSON.stringify({release:version.modules,grouped},null,2));
   for(const [baby,names] of Object.entries({
    smoochum:['smoochum','jynx'],
    elekid:['elekid','electabuzz'],
    magby:['magby','magmar'],
    tyrogue:['tyrogue','hitmonlee','hitmonchan','hitmontop']
   })){
    const family=grouped[baby];
    assert.ok(family&&!family.error,'Public family root missing: '+baby);
    for(const name of names)assert.ok(family.stageNames.includes(name),
     baby+' must show '+name+' as an evolution TAB on the actual published site');
    assert.ok(family.description.startsWith('FAMÍLIA · '),
     baby+' incorrectly says "Does not evolve" after family grouping');
   }
   console.log('PASS_PUBLIC_CROSS_GEN_FAMILIES',JSON.stringify(grouped));
  }
  await page.screenshot({path:'test-evidence/pokedex-public-live-last.png',fullPage:true});
  // A fully published Pokédex is not enough if the original Arena selection
  // still exposes the old 12/13-column portrait grid (reported on Android).
  // Test the ACTUAL deployed Phaser scene rather than relying on a local build.
  await page.evaluate(()=>window.__pt2Game.scene.start('seleccion',{
   previo:{modo:'cpu',p1:'bulbasaur'}
  }));
  await page.waitForFunction(()=>{
   const s=window.__pt2Game?.scene?.getScene('seleccion');
   return s?.scene.isActive()&&s.casillas?.length>50&&s.torre2Pages>1;
  },null,{timeout:45000});
  const selection=await page.evaluate(()=>{
   const s=window.__pt2Game.scene.getScene('seleccion');
   const cards=s.casillas||[];
   const inspect=()=>({
    page:s.torre2Page,
    pages:s.torre2Pages,
    total:cards.length,
    visible:cards.filter(c=>c.objects?.some(o=>o.visible)).length,
    misplaced:cards.filter(c=>c.objects?.some(o=>o.visible)&&
     c.page!==s.torre2Page).map(c=>c.p?.id),
    hiddenInteractive:cards.filter(c=>c.page!==s.torre2Page&&
     c.objects?.some(o=>o.input?.enabled)).map(c=>c.p?.id),
    missingPortraits:cards.filter(c=>c.page===s.torre2Page&&c.img?.visible&&
     /MISSING|__DEFAULT|__MISSING/i.test(c.img?.texture?.key||'')).map(c=>c.p?.id),
    label:s.torre2PageLabel?.text||''
   });
   const first=inspect();
   s.foco=8;s.refrescar();
   return {first,second:inspect(),fightButton:!!s.botonLuchar};
  });
  fs.writeFileSync('test-evidence/arena-public-pagination-audit.json',
   JSON.stringify({release:version.modules,selection},null,2));
  for(const [which,view] of Object.entries({first:selection.first,second:selection.second})){
   assert.equal(view.visible,8,'Public Arena '+which+' must show only eight cards');
   assert.deepEqual(view.misplaced,[],'Public Arena '+which+' renders hidden-page cards');
   assert.deepEqual(view.hiddenInteractive,[],
    'Public Arena '+which+' accepts taps on hidden Pokémon');
   assert.deepEqual(view.missingPortraits,[],
    'Public Arena '+which+' still shows placeholder portraits');
   assert.ok(view.label.startsWith('PÁG '+(view.page+1)+'/'),
    'Public Arena '+which+' has no page label');
  }
  assert.equal(selection.second.page,1,'Arena next page is not reachable');
  assert.equal(selection.fightButton,true,'Original battle FIGHT control was lost');
  console.log('PASS_PUBLIC_ARENA_SELECTION_8_PER_PAGE',JSON.stringify(selection));
  console.log('PASS_PUBLIC_POKEDEX_RELEASE',version.modules);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
