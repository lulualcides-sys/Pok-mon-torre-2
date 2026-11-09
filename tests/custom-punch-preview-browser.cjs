'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
(async()=>{
 const browser=await chromium.launch({
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']
 });
 try{
  const page=await browser.newPage({viewport:{width:980,height:850}});
  const errors=[];page.on('pageerror',x=>errors.push(String(x)));
  const url=process.env.PUNCH_REVIEW_URL||
   'https://punch-impact-vfx-review.vercel.app/';
  const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
  assert.equal(response?.status(),200,'Published Punch preview must serve 200');
  await page.waitForFunction(()=>window.__punchPreview?.ready===true,
   null,{timeout:45000});
  const boot=await page.evaluate(()=>{
   const data=window.__punchPreview;
   return {renderer:data.renderer,drawFrames:data.drawFrames,errors:data.errors};
  });
  assert.ok(boot.renderer,'Real Phaser scene must initialize');
  assert.deepEqual(boot.errors,[],'No errors in preview initialization');
  await page.waitForFunction(()=>window.__punchPreview?.drawFrames>12,
   null,{timeout:12000});
  for(const kind of ['firepunch','thunderpunch','icepunch','poisonpunch']){
   const prev=await page.evaluate(()=>window.__punchPreview.hits);
   await page.locator('button[data-kind="'+kind+'"]').click();
   await page.waitForFunction(([k,n])=>
      window.__punchPreview?.kind===k&&window.__punchPreview.hits>n,
      [kind,prev],{timeout:12000});
   const observed=await page.evaluate(()=>({
    kind:window.__punchPreview.kind,contactTime:window.__punchPreview.contactTime,
    hits:window.__punchPreview.hits
   }));
   assert.equal(observed.kind,kind);
   assert.ok(observed.contactTime>=0&&observed.contactTime<.5,
     'Actual contact must happen during attack motion');
   console.log('PASS_PUNCH_HIT',JSON.stringify(observed));
  }
  await page.locator('#miss').click();
  const before=await page.evaluate(()=>window.__punchPreview.hits);
  await page.waitForFunction(()=>window.__punchPreview.lastOutcome==='MISS',
   null,{timeout:10000});
  await page.waitForTimeout(240);
  assert.equal(await page.evaluate(()=>window.__punchPreview.hits),before,
   'Miss must never increment damage contacts');
  await page.locator('#slow').click();
  assert.equal(await page.evaluate(()=>window.__punchPreview.rate),.5);
  await page.locator('#pause').click();
  assert.equal(await page.evaluate(()=>window.__punchPreview.paused),true);
  assert.deepEqual(errors,[],'Phaser must not throw JS runtime errors');
  console.log('PASS_ANIMATED_PUNCH_REVIEW',JSON.stringify({
   renderer:boot.renderer,types:4,miss:true,pause:true,rate:.5,
   simulatedHitCount:before
  }));

  // Actual mobile touch layout; review is intended to open in a phone
  // browser, and the Punch buttons must remain usable on narrow screens.
  const mobile=await browser.newPage({viewport:{width:390,height:844},
   isMobile:true,hasTouch:true,deviceScaleFactor:2});
  const mobileErrors=[];mobile.on('pageerror',e=>mobileErrors.push(String(e)));
  await mobile.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
  await mobile.waitForFunction(()=>window.__punchPreview?.ready===true,
   null,{timeout:45000});
  await mobile.locator('button[data-kind="icepunch"]').tap();
  await mobile.waitForFunction(()=>window.__punchPreview?.kind==='icepunch'&&
   window.__punchPreview.hits>=1,null,{timeout:12000});
  const touch=await mobile.evaluate(()=>({
   viewport:document.documentElement.clientWidth,
   pageWidth:document.documentElement.scrollWidth,
   canvasWidth:document.querySelector('#screen canvas')?.getBoundingClientRect().width,
   kind:window.__punchPreview.kind,renderer:window.__punchPreview.renderer
  }));
  assert.ok(touch.pageWidth<=touch.viewport+2,'Review must not overflow horizontally on phone');
  assert.ok(touch.canvasWidth>150,'Real Phaser canvas visible on phone');
  assert.deepEqual(mobileErrors,[],'Phone preview must not throw JS errors');
  console.log('PASS_ANIMATED_PUNCH_MOBILE',JSON.stringify(touch));
  await mobile.close();

 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
