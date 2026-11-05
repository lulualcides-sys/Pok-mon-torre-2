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
  assert.equal(report.partial.some(x=>x.id==="smeargle"),false,
   "New Smeargle must have four executable Sketch-demo abilities");
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
   return {native:!!native,disabled:native?.desactivado,selectedCard:!!card,
    cardLocked:card?.bloqueado,cardDex:card?.p?.dex,
    sourceBlock:i<0?"not-found":selectText.slice(i,i+380)};
  });
  console.log("RAYQUAZA_SELECTION_PREDEPLOY_DIAGNOSTIC",JSON.stringify(rayquaza));
  // Check the actual non-Lab Arena with the new Unown (real Phaser cast).
  // Native Poké Arena / other Pokémon's kits remain unchanged.
  await page.evaluate(()=>window.__pt2Game.scene.start("combate",{
   modo:"cpu",p1:"unown",p2:"buneary",mandos:["tactil","pad0"],nivel:"normal"
  }));
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive("combate")&&
   window.__pt2Game.scene.getScene("combate").fase==="lucha",null,{timeout:25000});
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
