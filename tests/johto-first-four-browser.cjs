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
  let page=await browser.newPage({viewport:{width:1280,height:720}});
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
    originals:c.JOHTO_LAB_ALL.filter(x=>["powder-snow","whirlpool","zap-cannon","triple-kick","octazooka","thief","false-swipe","steel-wing","rock-smash","return","present","frustration","magnitude","hidden-power"].includes(x.id)).map(x=>x.id),
    defaults:[...s.picks],
    removedOld:c.JOHTO_LAB_VISIBLE.map(m=>({id:m.id,loaded:s.textures.exists("torre2-johto-pixelfx-"+m.id)}))};
  });
  assert.deepEqual(visible.visible,["pursuit","vital-throw","hidden-power","beat-up"]);
  assert.deepEqual(visible.defaults,visible.visible);
  assert.equal(visible.originals.length,14,"All 14 approved FX preserved in move pool");
  assert.ok(visible.visible.includes("hidden-power"),"Approved Hidden Power remains playable");
  const oldDetails=["pursuit","vital-throw","beat-up"];
  assert.equal(visible.visible.filter(x=>oldDetails.includes(x)).length,3);
  assert.ok(visible.removedOld.every(x=>!x.loaded),
   "Four rejected rectangular spritesheets must NOT be loaded");
  await fs.mkdir("test-evidence/johto-first-four",{recursive:true});
  await page.screenshot({path:"test-evidence/johto-first-four/choice.png"});
  await page.evaluate(()=>window.__pt2Game.scene.getScene("johto-lab").startPractice());
  await page.waitForFunction(()=>{
   const s=window.__pt2Game.scene.getScene("combate");
   return s.scene.isActive()&&s.fase==="lucha"&&s.__johtoLabInstalled;
  },null,{timeout:40000});
  // Each P2 name globo is verified in an independently booted live
  // Chromium arena. Headless Phaser CanvasPool cannot support several
  // synthetic native Text allocations in the same packed test instance.
  // Reboots are real UI boots; never mock vfx.globo or its displayed text.
  const casts=[];
  for(const [index,id] of visible.visible.entries()){
   if(index){
    await page.close();
    page=await browser.newPage({viewport:{width:1280,height:720}});
    page.on("pageerror",e=>errors.push(String(e)));
    page.on("requestfailed",x=>network.push(x.url()+" "+(x.failure()?.errorText||"")));
    await page.goto("http://127.0.0.1:4305/arena2d/?original=1");
    await page.waitForFunction(()=>window.__pt2Game?.scene.isActive("titulo"),null,{timeout:45000});
    await page.evaluate(()=>window.__pt2Game.scene.getScene("titulo").scene.start("johto-lab"));
    await page.waitForFunction(()=>window.__pt2Game.scene.isActive("johto-lab"),null,{timeout:15000});
    await page.evaluate(()=>window.__pt2Game.scene.getScene("johto-lab").startPractice());
    await page.waitForFunction(()=>{
     const s=window.__pt2Game.scene.getScene("combate");
     return s.scene.isActive()&&s.fase==="lucha"&&s.__johtoLabInstalled;
    },null,{timeout:40000});
   }
   const singleCast=await page.evaluate(async(moveId)=>{
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
   try{for(const m of JOHTO_LAB_VISIBLE.filter(m=>m.id===moveId)){
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
      ["p-cuchilla","p-estrella","p-aura","p-fantasma","p-hipnosis","p-espuma","p-agua","p-sombra","p-mira","p-psiquico","p-guijarro",
       "vfx-quickattack","vfx-arco","vfx-arco-sombra","vfx-arco-acero","vfx-arco-golpe",
       "vfx-astonish","vfx-acometida","vfx-cuchilla","vfx-fly","vfx-aeroblast","vfx-roca","vfx-huevo","vfx-hiper_impacto","p-corazon","p-brasa","p-roca",
       "vfx-psico","vfx-psywave","vfx-teleporte","vfx-hexgolpe",
       "vfx-hexaviso","vfx-atadura","vfx-rapidspin","vfx-aterriza","vfx-aterriza-golpe"].includes(o.texture?.key));
    const effect=scene.efectos.at(-1),beforeHP=enemy.hp;
    const nameVisible=scene.globos?.some(c=>c.list?.some(obj=>obj.text===m.nombre+"!"))||false;
    const poses=[],liftValues=[],framesSeen=new Set();
    if(native.length&&effect){
     // Advance in actual 60Hz Phaser frames, not large clamped synthetic
     // deltas that skip the 0.34s contact window of False Swipe/Steel Wing.
     for(let frame=0;frame<66;frame++){
      effect.update(.016);
      if(m.id==="vital-throw")liftValues.push(enemy.salto||0);
      if(frame%3===0){
       poses.push(native.map(o=>o.visible?
        [o.x,o.y,o.displayWidth,o.displayHeight,o.frame?.name,Math.round(o.alpha*100)].join(","):"off").join("|"));
       // Collect ACTUAL P2 source frames across the 60Hz animation.
       // Sampling only the last frame falsely classified short impacts
       // as static, even though their sheet advanced on earlier ticks.
       for(const sprite of native)if(sprite.visible&&sprite.texture?.key?.startsWith("vfx-"))
        framesSeen.add(sprite.texture.key+":"+sprite.frame?.name);
      }
     }
    }
    out.push({id:m.id,ok,source:"P2-native",sprites:native.length,
      assets:[...new Set(native.map(o=>o.texture?.key))],unique:new Set(poses).size,
      damage:beforeHP-enemy.hp,nameVisible,
      liftPeak:liftValues.length?Math.max(...liftValues):0,
      sourceFrames:[...framesSeen],
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
   return out[0];
  },id);
  casts.push(singleCast);
  }
  console.log("JOHTO_FIRST_FOUR_IN_PHASER",JSON.stringify({visible,casts,errors,network}));
  assert.ok(casts.every(m=>m.ok&&m.sprites>=8&&m.unique>=3),
   "All four must animate multiple REAL P2 pixel sprites inside Phaser");
  // Distinct silhouettes, not three recolorings of the same P2 slash.
  const assetSets=new Map(casts.map(m=>[m.id,new Set(m.assets)]));
  for(const [id,required] of [
   ["pursuit",["vfx-quickattack","vfx-astonish"]],
   ["vital-throw",["vfx-acometida"]],
   ["beat-up",["vfx-acometida","vfx-hiper_impacto"]]
  ])for(const name of required)
    assert.ok(assetSets.get(id)?.has(name),id+" must use unique "+name);
  const throwAssets=assetSets.get("vital-throw");
  for(const forbidden of ["vfx-rapidspin","vfx-fly","vfx-atadura"])
   assert.ok(!throwAssets?.has(forbidden),"Vital Throw still contains unwanted spiral "+forbidden);
  const pursuitAssets=assetSets.get("pursuit");
  for(const forbidden of ["vfx-teleporte","vfx-hexgolpe","vfx-hexaviso"])
   assert.ok(!pursuitAssets?.has(forbidden),"Pursuit must chase, not cast a spell "+forbidden);
  assert.ok(!assetSets.get("beat-up")?.has("vfx-rapidspin"),
   "Beat Up must never reuse spin");
  assert.ok((casts.find(m=>m.id==="vital-throw")?.liftPeak||0)>=12,
    "Vital Throw must physically LIFT the real enemy sprite, not a reused visual burst");
  assert.ok(casts.every(m=>m.sourceFrames.length>=2),
   "All four use actual multi-frame P2 VFX source spritesheets");
  assert.ok(casts.every(m=>m.damage>0),
   "Every move must reduce native opponent HP, not only show an effect");
  assert.ok(casts.every(m=>m.nameVisible),
   "Poké Arena native globo must announce the move above Mewtwo for every offensive cast");
  assert.equal(errors.length,0,"Page JavaScript errors: "+errors.join(" | "));
  await page.screenshot({path:"test-evidence/johto-first-four/battle.png"});
 }finally{await browser.close()}
})().then(()=>server.close()).catch(e=>{console.error(e);server.close();process.exitCode=1});
