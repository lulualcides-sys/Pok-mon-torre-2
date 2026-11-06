"use strict";
// Verify Johto as playable content IN THE ACTUAL built Phaser roster. This
// rejects the common false positive of 100 species existing only in JSON.
const assert=require("node:assert/strict");
const fs=require("node:fs/promises"),path=require("node:path"),http=require("node:http");
const {chromium}=require("playwright-core");
const root=path.resolve(process.env.PREVIEW_ROOT||"_site");
const mime={".html":"text/html",".js":"application/javascript",
 ".json":"application/json",".css":"text/css",".png":"image/png",
 ".webp":"image/webp",".jpg":"image/jpeg"};
const server=http.createServer(async(req,res)=>{
 const uri=new URL(req.url,"http://127.0.0.1:4313");
 const file=path.resolve(root,"."+(uri.pathname.endsWith("/")?uri.pathname+"index.html":uri.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end()}
 try{
  const content=await fs.readFile(file);
  res.writeHead(200,{"content-type":mime[path.extname(file)]||"application/octet-stream"});
  res.end(content);
 }catch{res.writeHead(404);res.end("missing")}
});
(async()=>{
 await new Promise(ok=>server.listen(4313,"127.0.0.1",ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true,
  args:["--no-sandbox","--enable-unsafe-swiftshader","--use-gl=angle","--use-angle=swiftshader"]});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];page.on("pageerror",e=>errors.push(String(e)));
  await page.goto("http://127.0.0.1:4313/arena2d/?original=1");
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive("titulo"),null,{timeout:60000});
  const report=await page.evaluate(async()=>{
   const src=Array.from(document.scripts).find(s=>s.src.includes("/main.js")).src;
   const base=new URL("./",src);
   const [{ROSTER},{JOHTO_100_ROWS},{JOHTO_ATTACK_SLOTS}]=await Promise.all([
    import(new URL("datos.js",base)),
    import(new URL("torre2/johto-100-data.js",base)),
    import(new URL("torre2/johto-100-species.js",base))]);
   const byName=new Map();
   for(const p of ROSTER){
    if(!byName.has(p.id))byName.set(p.id,p);
    for(const e of p.evoluciones||[]){
     const name=String(e.nombre).toLowerCase();
     if(!byName.has(name))byName.set(name,{...p,...e,id:name});
    }
   }
   const slots=["lmb","rmb","q","e"];
   const diag=JOHTO_100_ROWS.map(row=>{
    const id=row[1],obj=byName.get(id);
    const kit=obj?.kit||{};
    const abilities=slots.map(k=>kit[k]?.nombre&&kit[k]?.forma?kit[k].nombre:null);
    const rendered=abilities.filter(Boolean).length;
    return {dex:row[0],id,present:!!obj,rendered,
     abilities,region:obj?.torre2ArenaRegion||"upstream",
     type:Array.isArray(obj?.tipos)?obj.tipos.join("/"):"missing"};
   });
   const counts=[0,0,0,0,0];for(const x of diag)counts[Math.min(4,x.rendered)]++;
   return {total:diag.length,roster:ROSTER.length,
    missing:diag.filter(x=>!x.present),empty:diag.filter(x=>!x.rendered),
    partial:diag.filter(x=>x.rendered<4),counts,
    samples:diag.filter(x=>[152,155,158,172,201,235,243,249,251].includes(x.dex)),
    slotLabels:JOHTO_ATTACK_SLOTS};
  });
  console.log("JOHTO_100_LIVE_ROSTER_AUDIT",JSON.stringify(report));
  await fs.mkdir("test-evidence/johto-100",{recursive:true});
  await fs.writeFile("test-evidence/johto-100/coverage.json",JSON.stringify(report,null,2)+"\n");
  assert.equal(report.total,100);
  assert.deepEqual(report.slotLabels,[["lmb","ATK"],["rmb","HAB 2"],["q","HAB 3"],["e","ULT"]]);
  assert.equal(report.missing.length,0,
   "100 Johto names/dex must exist inside actual Phaser ROSTER and evolution forms");
  // Empty native Ho-Oh must not be filled: original Poké Arena 2D kits
  // are immutable, even when the upstream client has no executable move.
  assert.deepEqual(report.empty.map(x=>x.id),["ho-oh"],
   "Only original Ho-Oh may lack a playable attack; see coverage.json");
  const unown=report.partial.find(x=>x.id==="unown");
  assert.equal(unown?.abilities[0],"Hidden Power",
   "Unown must expose the approved playable Hidden Power");
  // A Sketch demo may use ONLY already-installed cast renderers.
  // Current upstream exposes Tackle and Body Slam but not all four demo
  // moves; preserve empty slots instead of manufacturing unavailable FX.
  const smeargle=report.partial.find(x=>x.id==="smeargle")||
   report.samples.find(x=>x.id==="smeargle");
  assert.ok(smeargle?.rendered>=1,"New Smeargle needs a real installed attack");
  assert.ok(smeargle.abilities.filter(Boolean).every(name=>
   ["Tackle","Counter","Revenge","Mirror Coat","Quick Attack",
    "Swift","Body Slam","Bite","Ember","Water Gun"].includes(name)),
   "Smeargle must only copy installed moves through Sketch");
  assert.deepEqual(smeargle.abilities,
   ["Tackle","Revenge","Mirror Coat","Body Slam"],
   "Installed native P2 library must equip four distinctive real Sketch moves");
  assert.ok(!smeargle.abilities.includes("Hyper Beam"),
   "Smeargle cannot receive generic Hyper Beam fallback");
  // One grid cell per evolutionary family, like the original Poké Arena 2D.
  // Keep every real ROSTER species/kit unchanged for battle and saves.
  const inappropriate=report.partial.filter(x=>x.region==="JOHTO"&&
   x.abilities.some(n=>n==="Hyper Beam"||
    n==="Solar Beam"&&!x.type.split("/").includes("GRASS")));
  assert.deepEqual(inappropriate,[],"No generic Hyper Beam or off-type Solar Beam in new Johto");
  await page.evaluate(()=>window.__pt2Game.scene.start("pokedex"));
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive("pokedex")&&
   window.__pt2Game.scene.getScene("pokedex").casillas?.length>=150,null,{timeout:30000});
  const grouping=await page.evaluate(async()=>{
   const scene=window.__pt2Game.scene.getScene("pokedex");
   const script=Array.from(document.scripts).find(s=>s.src.includes("/main.js")).src;
   const base=new URL("./",script);
   const [{ROSTER},{JOHTO_100_ROWS},{LEVEL_EVOLUTIONS},{buildPokedexFamilies}]=
    await Promise.all([
     import(new URL("datos.js",base)),
     import(new URL("torre2/johto-100-data.js",base)),
     import(new URL("torre2/progression.js",base)),
     import(new URL("torre2/pokedex-families.js",base))
    ]);
   const model=buildPokedexFamilies(ROSTER,JOHTO_100_ROWS,LEVEL_EVOLUTIONS);
   const visible=scene.casillas.filter(c=>c.g.visible).sort((a,b)=>a.y-b.y||a.x-b.x);
   return {
    expected:model.order.slice(0,25).map(i=>ROSTER[i].id),
    visible:visible.map(c=>c.p.id),
    nativeSize:visible.map(c=>({cell:c.w,image:c.img.displayWidth})),
    originalIndices:scene.casillas.every((c,i)=>c.p.id===ROSTER[i].id),
    roster:ROSTER.length,families:model.order.length,pages:scene.dexPages,
    rootFor:model.rootIndexForIndex,
    ids:ROSTER.map(p=>p.id)
   };
  });
  assert.deepEqual(grouping.visible,grouping.expected,
   "P2 Pokédex grid should show one original root portrait per family");
  assert.ok(grouping.families<grouping.roster&&grouping.families>45,
   "Nested evolution forms must not have separate cards");
  assert.equal(grouping.originalIndices,true,"Original battle ROSTER order must be intact");
  assert.ok(grouping.nativeSize.every(x=>x.cell===42&&x.image===38),
   "Restore exactly the native P2 44px cell and 38px portrait, no 6x6 enlargement");
  assert.equal(grouping.pages,Math.ceil(grouping.families/25));
  console.log("POKEDEX_NATIVE_FAMILY_GRID",JSON.stringify({
   roster:grouping.roster,families:grouping.families,pages:grouping.pages,
   first:grouping.visible.slice(0,8),nativeSize:grouping.nativeSize[0]
  }));
  // Chikorita/Bayleef/Meganium must share ONE card and be switchable in
  // the original native evolution tabs, never displayed as three tiles.
  const families=await page.evaluate(()=>{
   const s=window.__pt2Game.scene.getScene("pokedex");
   const ids=s.casillas.map(c=>c.p.id);
   const stagesOf=id=>{
    const i=ids.indexOf(id);
    if(i<0)return null;
    s.elegir(i);
    return {root:s.foco,stages:s.etapas.map(e=>({name:e.nombre,dex:e.dex}))};
   };
   return {chikorita:stagesOf("chikorita"),eevee:stagesOf("eevee")};
  });
  assert.ok(families.chikorita,"Chikorita root must exist");
  assert.ok(["0152","0153","0154"].every(d=>
   families.chikorita.stages.some(s=>s.dex===d)),
   "Chikorita Bayleef and Meganium must be in native evolution tabs");
  assert.ok(families.eevee&&["VAPOREON","JOLTEON","FLAREON","ESPEON","UMBREON"]
   .every(n=>families.eevee.stages.some(s=>s.name.toUpperCase()===n)),
   "Eevee branches must be grouped, with accessible tabs");
  // Visit the very same Marill group from the Android screenshot and the
  // last family page; require actual texture bytes and Idle for the selected.
  const positions=await page.evaluate(async()=>{
   const s=window.__pt2Game.scene.getScene("pokedex");
   const script=Array.from(document.scripts).find(x=>x.src.includes("/main.js")).src;
   const b=new URL("./",script);
   const [{ROSTER},{JOHTO_100_ROWS},{LEVEL_EVOLUTIONS},{buildPokedexFamilies}]=
    await Promise.all([import(new URL("datos.js",b)),
     import(new URL("torre2/johto-100-data.js",b)),
     import(new URL("torre2/progression.js",b)),
     import(new URL("torre2/pokedex-families.js",b))]);
   const m=buildPokedexFamilies(ROSTER,JOHTO_100_ROWS,LEVEL_EVOLUTIONS);
   const marill=ROSTER.findIndex(p=>p.id==="marill");
   if(marill<0)throw Error("Marill must be in Pokédex");
   const ranks=[0,m.rank[marill],m.order.length-1];
   return [...new Set(ranks.map(rank=>Math.floor(rank/25)))].map(pageIndex=>({
    pageIndex,index:m.order[pageIndex*25],dex:ROSTER[m.order[pageIndex*25]].dex,
    expected:Math.min(25,m.order.length-pageIndex*25)
   }));
  });
  for(const target of positions){
   await page.evaluate(({index})=>
    window.__pt2Game.scene.getScene("pokedex").elegir(index),target);
   try{
    await page.waitForFunction(({pageIndex,index,dex,expected})=>{
     const s=window.__pt2Game.scene.getScene("pokedex");
     if(s.dexPage!==pageIndex||s.foco!==index)return false;
     const visible=s.casillas.filter(c=>c.g.visible);
     if(visible.length!==expected)return false;
     if(!visible.every(c=>s.textures.exists("retrato-"+c.p.dex)&&
      c.img.visible&&c.img.texture?.key==="retrato-"+c.p.dex&&
      c.img.displayWidth===38))return false;
     return s.textures.exists("pmd-"+dex+"-Idle")&&
      s.anims.exists(dex+"-Idle-0")&&s.sprite?.texture?.key==="pmd-"+dex+"-Idle";
    },target,{timeout:65000});
   }catch(e){
    const details=await page.evaluate(()=>{
     const s=window.__pt2Game.scene.getScene("pokedex");
     return {page:s.dexPage,focus:s.foco,label:s.__torre2DexLoadingLabel?.text,
      cards:s.casillas.filter(c=>c.g.visible).map(c=>({
       id:c.p.id,key:c.img.texture?.key,ready:s.textures.exists("retrato-"+c.p.dex)})),
      main:s.sprite?.texture?.key};
    });
    console.error("NATIVE_POKEDEX_FAMILY_DIAGNOSTIC",JSON.stringify({target,details}));
    await page.screenshot({path:"test-evidence/johto-100/family-page-"+(target.pageIndex+1)+"-failed.png"}).catch(()=>{});
    throw e;
   }
   console.log("NATIVE_POKEDEX_FAMILY_PAGE_VERIFIED",JSON.stringify(target));
  }
  // Diagnostic for the separate main Pages failure: Rayquaza was reported
  // unselectable. Do not change or bypass native P2 move slots to fix it.
  await page.evaluate(()=>window.__pt2Game.scene.start("seleccion",{
   previo:{modo:"cpu",p1:"rayquaza"}
  }));
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive("seleccion")&&
   window.__pt2Game.scene.getScene("seleccion").casillas?.length>40,null,{timeout:30000});
  const rayquaza=await page.evaluate(async()=>{
   const script=Array.from(document.scripts).find(s=>s.src.includes("/main.js")).src;
   const base=new URL("./",script);
   const [{ROSTER},selectText]=await Promise.all([
    import(new URL("datos.js",base)),
    fetch(new URL("escenas/seleccion.js",base)).then(r=>r.text())
   ]);
   const native=ROSTER.find(p=>p.id==="rayquaza");
   const cards=window.__pt2Game.scene.getScene("seleccion").casillas;
   const card=cards.find(c=>c.p?.id==="rayquaza");
   const i=selectText.indexOf("const bloqueado=");
   const other=Object.fromEntries(["chikorita","smeargle","lugia"].map(id=>{
    const c=cards.find(x=>x.p?.id===id);
    return [id,{present:!!c,locked:c?.bloqueado??null}];
   }));
   return {native:!!native,disabled:native?.desactivado,selectedCard:!!card,
    cardLocked:card?.bloqueado,cardDex:card?.p?.dex,other,
    sourceBlock:i<0?"not-found":selectText.slice(i,i+380)};
  });
  console.log("RAYQUAZA_SELECTION_PREDEPLOY_DIAGNOSTIC",JSON.stringify(rayquaza));
  assert.equal(rayquaza.cardLocked,false,"Rayquaza must be selectable in offline Arena");
  for(const id of ["chikorita","smeargle","lugia"])
   assert.deepEqual(rayquaza.other[id],{present:true,locked:false},
    "All 100 Johto species must be selectable offline, including native roots: "+id);
  // Check the actual non-Lab Arena with the new Unown (real Phaser cast).
  // Native Poké Arena / other Pokémon's kits remain unchanged.
  await page.evaluate(()=>window.__pt2Game.scene.start("combate",{
   modo:"cpu",p1:"unown",p2:"buneary",mandos:["tactil","pad0"],nivel:"normal"
  }));
  // PMD frames sometimes decode slowly under shared Chromium CI.
  // Never suppress a real hang: record active scenes and screenshot on failure.
  try{
   await page.waitForFunction(()=>window.__pt2Game.scene.isActive("combate")&&
    window.__pt2Game.scene.getScene("combate").fase==="lucha",null,{timeout:45000});
  }catch(error){
   const diagnostic=await page.evaluate(()=>{
    const game=window.__pt2Game,scene=game?.scene?.getScene("combate");
    return {phase:scene?.fase,active:game?.scene?.isActive("combate"),
     scenes:game?.scene?.getScenes(true).map(s=>s.scene.key),
     combatants:scene?.luchadores?.map(p=>({id:p.def?.id,ko:p.ko,phase:p.fase}))};
   }).catch(e=>({inspectError:String(e)}));
   console.error("JOHTO_REAL_ARENA_TRANSITION_DIAGNOSTIC",
    JSON.stringify({diagnostic,errors}));
   await fs.mkdir("test-evidence/johto-100",{recursive:true});
   await page.screenshot({path:"test-evidence/johto-100/unown-transition-timeout.png"})
    .catch(()=>{});
   throw error;
  }
  const unownCast=await page.evaluate(async()=>{
   const scene=window.__pt2Game.scene.getScene("combate"),u=scene.luchadores[0];
   const target=scene.luchadores[1];
   const script=Array.from(document.scripts).find(s=>s.src.includes("/main.js")).src;
   const forms=await import(new URL("torre2/signature-fx.js",new URL("./",script)));
   u.energia=100;u.ax=target.x;u.ay=target.y;u.ko=false;u.accion=null;
   const before=scene.efectos.length;
   const move=u.kit?.lmb;
   const cast=forms.TORRE2_FORMS[move?.forma]?.(u,move,{slot:"lmb"});
   return {id:u.def?.id,move:move?.nombre,form:move?.forma,cast,
    before,after:scene.efectos.length,lab:!!scene.datos?.johtoLab};
  });
  console.log("JOHTO_UNOWN_REAL_ARENA_CAST",JSON.stringify(unownCast));
  assert.equal(unownCast.id,"unown");
  assert.equal(unownCast.move,"Hidden Power");
  assert.equal(unownCast.lab,false,"Unown must cast in actual Arena, not only Mewtwo Lab");
  assert.equal(unownCast.cast,true,"Unown Hidden Power must launch in normal Arena");
  assert.ok(unownCast.after>unownCast.before,"Real Hidden Power VFX must be active");
  assert.equal(errors.length,0,"JS errors: "+errors.join("|"));
 }finally{await browser.close()}
})().then(()=>server.close(),e=>{console.error(e);server.close();process.exitCode=1});
