"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs/promises"),path=require("node:path"),http=require("node:http");
const {chromium}=require("playwright-core");
const root=path.resolve(process.env.PREVIEW_ROOT||"_site");
const mime={".html":"text/html",".js":"application/javascript",".json":"application/json",
 ".css":"text/css",".png":"image/png",".webp":"image/webp",".jpg":"image/jpeg"};
const server=http.createServer(async(req,res)=>{
 const uri=new URL(req.url,"http://127.0.0.1:4305");
 const file=path.resolve(root,"."+ (uri.pathname.endsWith("/")?uri.pathname+"index.html":uri.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 try{const content=await fs.readFile(file);
  res.writeHead(200,{"content-type":mime[path.extname(file)]||"application/octet-stream"});res.end(content);}
 catch{res.writeHead(404);res.end("missing");}
});
(async()=>{
 await new Promise(ok=>server.listen(4305,"127.0.0.1",ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true,
  args:["--no-sandbox","--enable-unsafe-swiftshader","--use-gl=angle","--use-angle=swiftshader"]});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[],network=[];
  page.on("pageerror",e=>errors.push(String(e)));
  page.on("requestfailed",x=>network.push(x.url()+" "+(x.failure()?.errorText||"")));
  await page.goto("http://127.0.0.1:4305/arena2d/?original=1");
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive("titulo"),null,{timeout:45000});
  await page.evaluate(()=>window.__pt2Game.scene.getScene("titulo").scene.start("johto-lab"));
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive("johto-lab"),null,{timeout:15000});
  const visible=await page.evaluate(async()=>{
   const s=window.__pt2Game.scene.getScene("johto-lab");
   const base=new URL("./",Array.from(document.scripts).find(s=>s.src.includes("/main.js")).src);
   const c=await import(new URL("torre2/johto-lab-catalog.js",base));
   return {visible:s.moveCards.filter(card=>card.m).map(card=>card.m.id),
    originals:c.JOHTO_LAB_ALL.filter(x=>["powder-snow","whirlpool","zap-cannon"].includes(x.id)).map(x=>x.id),
    defaults:[...s.picks],
    frames:c.JOHTO_LAB_VISIBLE.map(m=>({id:m.id,found:s.textures.exists("torre2-johto-pixelfx-"+m.id),
     frames:s.textures.get("torre2-johto-pixelfx-"+m.id).getFrameNames().length}))};
  });
  assert.deepEqual(visible.visible,["triple-kick","thief","snore","octazooka"]);
  assert.deepEqual(visible.defaults,visible.visible);
  assert.equal(visible.originals.length,3,"Approved FX preserved in move pool");
  assert.ok(visible.frames.every(x=>x.found&&x.frames===24),
   "4 distinct 24-frame PNG textures must load in Phaser");
  await fs.mkdir("test-evidence/johto-first-four",{recursive:true});
  await page.screenshot({path:"test-evidence/johto-first-four/choice.png"});
  await page.evaluate(()=>window.__pt2Game.scene.getScene("johto-lab").startPractice());
  await page.waitForFunction(()=>{
   const s=window.__pt2Game.scene.getScene("combate");
   return s.scene.isActive()&&s.fase==="lucha"&&s.__johtoLabInstalled;
  },null,{timeout:40000});
  const casts=await page.evaluate(async()=>{
   const base=new URL("./",Array.from(document.scripts).find(s=>s.src.includes("/main.js")).src);
   const [{JOHTO_LAB_VISIBLE},{TORRE2_JOHTO_LAB_FORMS}]=await Promise.all([
    import(new URL("torre2/johto-lab-catalog.js",base)),
    import(new URL("torre2/johto-lab-runtime.js",base))]);
   const scene=window.__pt2Game.scene.getScene("combate"),
    me=scene.luchadores[0],enemy=scene.luchadores[1],out=[];
   me.inmortal=true;enemy.inmortal=true;
   for(const m of JOHTO_LAB_VISIBLE){
    // Synthetic visual-only inspection; no save or campaign is touched.
    for(const fx of [...scene.efectos])try{fx.destroy?.()}catch{}
    scene.efectos=[];
    me.__johtoLabNextCastAt=-Infinity;me.__johtoLabActiveEffects=[];
    me.accion=null;me.dash=null;me.est=m.id==="snore"?{dormido:true}:{};
    me.ax=enemy.x;me.ay=enemy.y;
    const ok=TORRE2_JOHTO_LAB_FORMS[m.forma](me,m,{slot:"q"});
    const key="torre2-johto-pixelfx-"+m.id;
    const sprite=scene.children.list.find(o=>o.active&&o.texture?.key===key);
    const effect=scene.efectos.at(-1);
    const frames=[];
    if(sprite&&effect){
     for(const dt of [.04,.08,.12,.08]){
      effect.update(dt);
      frames.push(String(sprite.frame?.name));
     }
    }
    out.push({id:m.id,ok,found:!!sprite,frames,
     unique:new Set(frames).size});
   }
   for(const fx of [...scene.efectos])try{fx.destroy?.()}catch{}
   scene.efectos=[];
   return out;
  });
  console.log("JOHTO_FIRST_FOUR_IN_PHASER",JSON.stringify({visible,casts,errors,network}));
  assert.ok(casts.every(m=>m.ok&&m.found&&m.unique>=3),
   "Every reviewed attack must play moving frames inside Phaser, not a frozen stamp");
  assert.equal(errors.length,0,"Page JavaScript errors: "+errors.join(" | "));
  await page.screenshot({path:"test-evidence/johto-first-four/battle.png"});
 }finally{await browser.close()}
})().then(()=>server.close()).catch(e=>{console.error(e);server.close();process.exitCode=1});
