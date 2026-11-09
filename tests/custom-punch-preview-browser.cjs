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
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
