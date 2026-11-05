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
  assert.equal(report.empty.length,0,
   "No Johto species may have zero executable battle attacks; see coverage.json");
  assert.equal(errors.length,0,"JS errors: "+errors.join("|"));
 }finally{await browser.close()}
})().then(()=>server.close(),e=>{console.error(e);server.close();process.exitCode=1});
