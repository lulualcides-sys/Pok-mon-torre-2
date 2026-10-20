'use strict';
// Check temporary playable HTML preview, independently of GitHub Pages admin access.
const fs=require('fs');
const {chromium}=require('playwright-core');
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 const site=process.env.PREVIEW_URL||'https://rawcdn.githack.com/lulualcides-sys/Pok-mon-torre-2/34ccc083d68aa386cb166b4fd2958eaeb4734357/index.html';
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
  '--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist']});
 let result={site,checked:new Date().toISOString(),pageStatus:null,html:false,
   interstitial:false,ready:false,game:null,errors:[]};
 try{
  const page=await browser.newPage({viewport:{width:1024,height:768}});
  page.on('pageerror',e=>result.errors.push(String(e).slice(0,240)));
  const response=await page.goto(site,{waitUntil:'domcontentloaded',timeout:45000});
  result.pageStatus=response?.status();
  result.title=await page.title();
  result.text=(await page.locator('body').innerText()).slice(0,550);
  result.html=!!(await page.locator('h1').count());
  if(/confirmation|phishing|proceed to|one more step|open the page/i.test(result.text)){
   result.interstitial=true;
   const open=page.getByText('Open the page',{exact:true}).first();
   if(await open.count()){await open.click();await page.waitForTimeout(2000);}
   else{
     const b=page.locator('form button, form input[type="submit"]').first();
     if(await b.count()){await b.click();await page.waitForTimeout(2000);}
   }
   result.afterInterstitial={url:page.url(),title:await page.title(),body:(await page.locator('body').innerText()).slice(0,220)};
  }
  try{
   await page.waitForFunction(()=>window.PokemonTorre2?.snapshot()?.renderer==='webgl',null,
    {timeout:35000,polling:350});
   result.game=await page.evaluate(()=>window.PokemonTorre2.snapshot());
   const loadedV02=await page.evaluate(()=>({
      style:!!document.querySelector('link[href="./styles-v02.css"]'),
      hero:window.PokemonTorre2.version,
      src:document.querySelector('script[type="module"]')?.getAttribute('src')
   }));
   result.versionEvidence=loadedV02;
   result.moveAnimations=result.game.animations;
   result.actorActions=result.game.actorArt.map(x=>({pokemon:x.pokemon,actions:x.actions}));
   if(loadedV02.hero!=='0.3.0-fidelity'||!loadedV02.style)throw Error('Wrong cached version: '+JSON.stringify(loadedV02));
   result.ready=true;
  }catch(e){result.errors.push('GAME_BOOT: '+String(e).slice(0,300));}
  await page.screenshot({path:'test-evidence/preview-githack.png',fullPage:true});
  if(result.ready){
    // Same public mirror in Android-sized touch browser.
    const mobile=await browser.newPage({viewport:{width:390,height:844},
      isMobile:true,hasTouch:true,deviceScaleFactor:1});
    await mobile.goto(site,{waitUntil:'domcontentloaded',timeout:45000});
    if((await mobile.title()).includes('External Content Notice')){
      const approve=mobile.getByText('Open the page',{exact:true}).first();
      await approve.click();
    }
    await mobile.waitForFunction(()=>window.PokemonTorre2?.snapshot()?.renderer==='webgl',
      null,{timeout:40000,polling:200});
    await mobile.locator('button[data-move="flamethrower"]').click();
    const data=await mobile.evaluate(()=>window.PokemonTorre2.snapshot());
    result.mobile={width:390,webgl:data.renderer==='webgl',
      moveButtons:await mobile.locator('[data-move]').count(),
      castCount:data.castCount,energy:data.player.energy};
    result.readyMobile=result.mobile.webgl&&result.mobile.castCount>=1;
    await mobile.screenshot({path:'test-evidence/preview-githack-android.png',fullPage:true});
  }
 }finally{await browser.close()}
 fs.writeFileSync('test-evidence/PUBLIC-PREVIEW.json',JSON.stringify(result,null,2));
 console.log(JSON.stringify(result));
 if(!result.ready || !result.readyMobile)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
