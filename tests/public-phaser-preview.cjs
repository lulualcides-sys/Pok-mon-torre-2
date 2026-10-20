'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
(async()=>{
 const site=process.env.ARENA_PUBLIC_URL||
  'https://raw.githack.com/lulualcides-sys/Pok-mon-torre-2/pokearena2d-cliente-phaser/index.html';
 fs.mkdirSync('test-evidence',{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
  '--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:980,height:650}});
 const errors=[];const bad=[];
 page.on('pageerror',e=>errors.push(String(e).slice(0,300)));
 page.on('response',r=>{if(r.status()>=400)bad.push({status:r.status(),url:r.url()})});
 try{
  const response=await page.goto(site,{waitUntil:'domcontentloaded',timeout:50000});
  const initial={status:response?.status(),title:await page.title(),url:page.url()};
  const text=await page.locator('body').innerText();
  if(/External Content Notice|Open the page|phishing prevention/i.test(text)){
   const btn=page.getByText('Open the page',{exact:true}).first();
   if(await btn.count())await btn.click();
   await page.waitForTimeout(800);
  }
  await page.waitForFunction(()=>!!window.Phaser&&!!document.querySelector('#juego canvas'),null,
   {timeout:45000,polling:500});
  await page.waitForTimeout(1800);
  const game=await page.evaluate(()=>({canvas:document.querySelector('#juego canvas')?.width,
   height:document.querySelector('#juego canvas')?.height,version:window.Phaser.VERSION}));
  assert.ok(game.canvas>=700&&game.height>=400,'Phaser game must render and fill its frame');
  await page.screenshot({path:'test-evidence/pokearena-public-githack.png',fullPage:true});
  const out={site,initial,game,errors,bad:bad.slice(0,20),result:'Public original Phaser client booted'};
  fs.writeFileSync('test-evidence/pokearena-public-githack.json',JSON.stringify(out,null,2));
  console.log(JSON.stringify(out,null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
