'use strict';
// Check temporary playable HTML preview, independently of GitHub Pages admin access.
const fs=require('fs');
const {chromium}=require('playwright-core');
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 const site='https://raw.githack.com/lulualcides-sys/Pok-mon-torre-2/main/index.html';
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
   result.ready=true;
  }catch(e){result.errors.push('GAME_BOOT: '+String(e).slice(0,300));}
  await page.screenshot({path:'test-evidence/preview-githack.png',fullPage:true});
 }finally{await browser.close()}
 fs.writeFileSync('test-evidence/PUBLIC-PREVIEW.json',JSON.stringify(result,null,2));
 console.log(JSON.stringify(result));
 if(!result.ready)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
