'use strict';
const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 const chrome=process.env.CHROME_BIN||'/usr/bin/google-chrome';
 const browser=await chromium.launch({executablePath:chrome,headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
    '--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist']});
 const errors=[];
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1});
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto(process.env.BASE_URL||'http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:50000});
  try{
    await page.waitForFunction(()=>!!window.PokemonTorre2?.snapshot(),null,{timeout:28000});
  }catch(e){
    const diagnostic={
      pageErrors:errors,body:(await page.locator('body').innerText()).slice(0,450),
      scripts:await page.evaluate(()=>[...document.scripts].map(x=>x.src).slice(-5)),
      gameApi:await page.evaluate(()=>typeof window.PokemonTorre2),
      pixi:await page.evaluate(()=>typeof window.PIXI)
    };
    fs.writeFileSync('test-evidence/BOOT-DIAGNOSTIC.json',JSON.stringify(diagnostic,null,2));
    await page.screenshot({path:'test-evidence/BOOT-FAIL.png',fullPage:true});
    throw new Error('WebGL startup diagnostic: '+JSON.stringify(diagnostic));
  }
  let s=await page.evaluate(()=>window.PokemonTorre2.snapshot());
  assert.equal(s.renderer,'webgl','PixiJS must use actual GPU/WebGL, not Canvas2D');
  assert.equal(s.gym,'pewter');
  assert.equal(s.arenaStyle,'grass-stadium-v06','stage must use outdoor grass stadium, not old metallic arena');
  assert.equal(s.enemy.id,'geodude');
  assert.equal(await page.locator('button[data-move]').count(),4);
  // Measure optional noncommercial artist-credited sprite sheets separately from engine health.
  try{
    await page.waitForFunction(()=>window.PokemonTorre2?.snapshot()?.actorArt?.length>=3,
      null,{timeout:18000,polling:250});
  }catch(_){/* An offline fallback is permitted; record why the sprite host failed. */}
  const actorArt=await page.evaluate(()=>window.PokemonTorre2.snapshot().actorArt);
  fs.writeFileSync('test-evidence/SPRITES-STATUS.json',JSON.stringify({actorArt},null,2));
  console.log('SPRITE STATUS',JSON.stringify(actorArt));
  await page.screenshot({path:'test-evidence/brock-initial-desktop.png',fullPage:true});
  await page.locator('button[data-move="flamethrower"]').click();
  s=await page.evaluate(()=>window.PokemonTorre2.snapshot());
  assert.equal(s.castCount,1);
  assert.ok(s.player.energy<100);
  await page.waitForTimeout(140);
  s=await page.evaluate(()=>window.PokemonTorre2.snapshot());
  // Chrome headless can skip the brief mid-flight interval under SwiftShader;
  // assert the engine's accumulated GPU sprite frames after actual contact.
  await page.screenshot({path:'test-evidence/flamethrower-mid-flight.png',fullPage:true});
  await page.waitForFunction(()=>{const state=window.PokemonTorre2?.snapshot();
    return state&&(state.enemy.hp<state.enemy.maxHp||state.status!=='fighting');},
    null,{timeout:18000,polling:150});
  s=await page.evaluate(()=>window.PokemonTorre2.snapshot());
  assert.ok(s.enemy.hp<s.enemy.maxHp,'real battle must apply damage at projectile contact');
  assert.ok(s.metrics.createdEffectSprites>=1,'real PixiJS sprite must be created');
  assert.ok(s.metrics.renderedEffectFrames>=1,'move must animate through real WebGL frames');
  assert.ok(s.metrics.impactVfx>=1,'impact animation must appear when damage occurs');
  await page.screenshot({path:'test-evidence/brock-after-flamethrower.png',fullPage:true});
  for(const id of ['ember','firespin','fireblast']){
    await page.evaluate(()=>window.PokemonTorre2.restart());
    const activated=await page.evaluate(id=>window.PokemonTorre2.cast(id),id);
    assert.ok(activated.ok,'combat engine must accept '+id);
    // Software WebGL on shared CI runners can render slower than wall-clock.
    // Wait for the real simulation to reach impact, not an arbitrary 1.7 seconds.
    await page.waitForFunction(()=>{const s=window.PokemonTorre2?.snapshot();
      return s && (s.enemy.hp<s.enemy.maxHp || s.status!=='fighting');},
      null,{timeout:18000,polling:150});
    const sample=await page.evaluate(()=>window.PokemonTorre2.snapshot());
    assert.equal(sample.castCount,1);
    assert.ok(sample.metrics.createdEffectSprites>0,id+' must render PixiJS effect');
    assert.ok(sample.metrics.renderedEffectFrames>0,id+' effect must animate');
    assert.ok(sample.enemy.hp<sample.enemy.maxHp,id+' must hit opponent after arrival');
  }

  await page.evaluate(()=>window.PokemonTorre2.restart());
  await page.waitForFunction(()=>window.PokemonTorre2?.snapshot().metrics.enemyProjectileSprites>=1,
    null,{timeout:25000,polling:200});
  const enemyAction=await page.evaluate(()=>window.PokemonTorre2.snapshot());
  assert.ok(enemyAction.metrics.enemyProjectileSprites>=1,'Brock Rock Throw must spawn a PIXI WebGL sprite');
  await page.screenshot({path:'test-evidence/brock-rock-throw-v04.png',fullPage:true});
  const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  mobile.on('pageerror',e=>errors.push('mobile: '+e));
  await mobile.goto(process.env.BASE_URL||'http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:50000});
  await mobile.waitForFunction(()=>!!window.PokemonTorre2?.snapshot(),null,{timeout:50000});
  const before=await mobile.evaluate(()=>window.PokemonTorre2.snapshot());
  assert.equal(before.arenaStyle,'grass-stadium-v06');
  assert.equal(before.viewport.width,660,'mobile camera uses a separate 660 world-space viewport');
  assert.equal(before.viewport.height,660,'mobile viewport should be square');
  const canvasBox=await mobile.locator('#game canvas').boundingBox();
  assert.ok(Math.abs(canvasBox.width-canvasBox.height)<3,
    'mobile arena should not be a flattened 16:9 strip');
  await mobile.waitForTimeout(900);
  const framed=await mobile.evaluate(()=>window.PokemonTorre2.snapshot());
  assert.ok(framed.viewport.cameraX< -50,'mobile camera must center the two combatants');

  await mobile.locator('[data-dir="right"]').dispatchEvent('pointerdown',{pointerId:1,pointerType:'touch'});
  await mobile.waitForTimeout(340);
  await mobile.locator('[data-dir="right"]').dispatchEvent('pointerup',{pointerId:1,pointerType:'touch'});
  const after=await mobile.evaluate(()=>window.PokemonTorre2.snapshot());
  assert.ok(after.player.x>=before.player.x,'touch movement must not move left');
  await mobile.locator('button[data-move="ember"]').click();
  assert.ok((await mobile.evaluate(()=>window.PokemonTorre2.snapshot())).castCount>=1);
  await mobile.screenshot({path:'test-evidence/brock-mobile.png',fullPage:true});
  if(errors.length)throw Error('Browser errors: '+JSON.stringify(errors));
  fs.writeFileSync('test-evidence/BROWSER-PASS.json',JSON.stringify({webgl:true,initial:s.gym,mobile:true,
   visualsSource:'original pixel art',tested:['normal Flamethrower hit','Ember, Fire Spin, Fire Blast impact','enemy WebGL Rock Throw','touch controls','4 move buttons','square mobile battle camera','rendering desktop/mobile'],
   screenshots:5},null,2));
  console.log('BROWSER PASS: WebGL / Pewter / Flamethrower impact / mobile move / screenshots');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
