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
    originals:c.JOHTO_LAB_ALL.filter(x=>["powder-snow","whirlpool","zap-cannon","triple-kick","octazooka"].includes(x.id)).map(x=>x.id),
    defaults:[...s.picks],
    removedOld:c.JOHTO_LAB_VISIBLE.map(m=>({id:m.id,loaded:s.textures.exists("torre2-johto-pixelfx-"+m.id)}))};
  });
  assert.deepEqual(visible.visible,["thief","snore","false-swipe","steel-wing"]);
  assert.deepEqual(visible.defaults,visible.visible);
  assert.equal(visible.originals.length,5,"All 5 approved FX preserved in move pool");
  assert.ok(visible.removedOld.every(x=>!x.loaded),
   "Four rejected rectangular spritesheets must NOT be loaded");
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
   const originalRandom=Math.random;
   // The browser test bursts nine synthetic ticks without a browser paint.
   // Native Phaser floating-damage Text can exhaust its canvas texture,
   // so suppress ONLY that visual side effect in this test (not in game).
   // Enemy.recibir, defenses, shields and native HP remain real.
   const oldHitText=enemy.efectosGolpe,oldAcerto=me.acierto,
    oldExp=me.ganarExp,oldEnemyExp=enemy.ganarExp,
    oldEnemyUlt=enemy.ganarUlti;
   enemy.efectosGolpe=()=>{};me.acierto=()=>{};
   me.ganarExp=()=>{};enemy.ganarExp=()=>{};enemy.ganarUlti=()=>{};
   Math.random=()=>.35;
   try{for(const m of JOHTO_LAB_VISIBLE){
    // Real native contact/HP inspection; no campaign saves are touched.
    for(const fx of [...scene.efectos])try{fx.destroy?.()}catch{}
    scene.efectos=[];
    me.__johtoLabNextCastAt=-Infinity;me.__johtoLabActiveEffects=[];
    me.accion=null;me.dash=null;me.est=m.id==="snore"?{dormido:true}:{};
    me.x=180;me.y=180;enemy.x=280;enemy.y=180;
    enemy.est={};enemy.ko=false;enemy.hp=enemy.hpMax;
    me.ax=enemy.x;me.ay=enemy.y;
    const oldChildren=new Set(scene.children.list);
    const ok=TORRE2_JOHTO_LAB_FORMS[m.forma](me,m,{slot:"q"});
    const native=scene.children.list.filter(o=>o.active&&!oldChildren.has(o)&&
      ["p-cuchilla","p-estrella","p-aura","p-fantasma","p-hipnosis","p-espuma","p-agua","p-sombra","p-mira","p-psiquico"].includes(o.texture?.key));
    const effect=scene.efectos.at(-1),beforeHP=enemy.hp;
    const nameVisible=scene.globos?.some(c=>c.list?.some(obj=>obj.text===m.nombre+"!"))||false;
    const poses=[];
    if(native.length&&effect){
     for(const dt of [.04,.08,.12,.05,.11,.15,.06,.08,.08]){
      effect.update(dt);
      poses.push(native.map(o=>o.visible?
       [o.x,o.y,o.displayWidth,o.displayHeight,Math.round(o.alpha*100)].join(","):"off").join("|"));
     }
    }
    out.push({id:m.id,ok,source:"P2-native",sprites:native.length,
      assets:[...new Set(native.map(o=>o.texture?.key))],unique:new Set(poses).size,
      damage:beforeHP-enemy.hp,nameVisible,
      noPrematureTriple:m.id!=="triple-kick"||poses[0].split("|").every(p=>p==="off")});
    // Await P2's native 1.05s globo tween before the next cast.
    // Avoid exhausting the canvas pool via artificial synchronous bursts.
    await new Promise(ok=>setTimeout(ok,1250));
   }}finally{Math.random=originalRandom;
    enemy.efectosGolpe=oldHitText;me.acierto=oldAcerto;
    me.ganarExp=oldExp;enemy.ganarExp=oldEnemyExp;
    enemy.ganarUlti=oldEnemyUlt;}
   for(const fx of [...scene.efectos])try{fx.destroy?.()}catch{}
   scene.efectos=[];
   return out;
  });
  console.log("JOHTO_FIRST_FOUR_IN_PHASER",JSON.stringify({visible,casts,errors,network}));
  assert.ok(casts.every(m=>m.ok&&m.sprites>=8&&m.unique>=3),
   "All four must animate multiple REAL P2 pixel sprites inside Phaser");
  assert.ok(casts.every(m=>m.damage>0),
   "Every move must reduce native opponent HP, not only show an effect");
  assert.ok(casts.every(m=>m.nameVisible),
   "Poké Arena native globo must announce the move above Mewtwo for every offensive cast");
  assert.equal(errors.length,0,"Page JavaScript errors: "+errors.join(" | "));
  await page.screenshot({path:"test-evidence/johto-first-four/battle.png"});
 }finally{await browser.close()}
})().then(()=>server.close()).catch(e=>{console.error(e);server.close();process.exitCode=1});
