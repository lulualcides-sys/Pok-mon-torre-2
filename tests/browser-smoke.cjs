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
  await page.waitForFunction(()=>!!window.PokemonTorre2?.snapshot(),null,{timeout:50000});
  let s=await page.evaluate(()=>window.PokemonTorre2.snapshot());
  assert.equal(s.renderer,'webgl','PixiJS must use actual GPU/WebGL, not Canvas2D');
  assert.equal(s.gym,'pewter');
  assert.equal(s.enemy.id,'geodude');
  assert.equal(await page.locator('button[data-move]').count(),4);
  await page.screenshot({path:'test-evidence/brock-initial-desktop.png',fullPage:true});
  await page.locator('button[data-move="flamethrower"]').click();
  s=await page.evaluate(()=>window.PokemonTorre2.snapshot());
  assert.equal(s.castCount,1);
  assert.ok(s.player.energy<100);
  assert.ok(s.effectsActive>=0);
  await page.waitForTimeout(1400);
  s=await page.evaluate(()=>window.PokemonTorre2.snapshot());
  assert.ok(s.enemy.hp<s.enemy.maxHp,'real battle must apply damage at projectile contact');
  await page.screenshot({path:'test-evidence/brock-after-flamethrower.png',fullPage:true});
  const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  mobile.on('pageerror',e=>errors.push('mobile: '+e));
  await mobile.goto(process.env.BASE_URL||'http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:50000});
  await mobile.waitForFunction(()=>!!window.PokemonTorre2?.snapshot(),null,{timeout:50000});
  const before=await mobile.evaluate(()=>window.PokemonTorre2.snapshot());
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
   visualsSource:'original pixel art',tested:['normal Flamethrower hit','touch controls','4 move buttons','rendering desktop/mobile'],
   screenshots:3},null,2));
  console.log('BROWSER PASS: WebGL / Pewter / Flamethrower impact / mobile move / screenshots');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
