'use strict';
// Browser smoke-test of the authorized original Poké Arena Phaser client,
// isolated at /arena2d/ from the Kanto campaign. Does not contact online services.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const fsp=require('node:fs/promises');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg',
 '.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.mp3':'audio/mpeg',
 '.ogg':'audio/ogg','.wav':'audio/wav'};
const server=http.createServer(async(req,res)=>{
 const requested=new URL(req.url||'/', 'http://127.0.0.1');
 let key=decodeURIComponent(requested.pathname);
 if(key.endsWith('/'))key+='index.html';
 const absolute=path.resolve(root,'.'+key);
 if(!absolute.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{
  const data=await fsp.readFile(absolute);
  res.writeHead(200,{'content-type':types[path.extname(absolute)]||'application/octet-stream'});
  res.end(data);
 }catch{res.writeHead(404);res.end('missing '+key);}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(resolve=>server.listen(4274,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
   '--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:980,height:650},deviceScaleFactor:1});
 const errors=[],notFound=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('response',r=>{if(r.status()>=400)notFound.push({status:r.status(),url:r.url()})});
 try{
  const response=await page.goto('http://127.0.0.1:4274/arena2d/',{waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(response.status(),200);
  assert.match(await page.title(),/Pok. Arena 2D/i);
  await page.waitForFunction(()=>!!window.Phaser&&!!document.querySelector('#juego canvas'),null,{timeout:35000});
  await page.waitForFunction(()=>window.__pt2Started===true,null,{timeout:45000,polling:250});
  await page.waitForTimeout(800);
  const canvas=await page.evaluate(()=>{
   const c=document.querySelector('#juego canvas');
   return {width:c.width,height:c.height,visible:c.getBoundingClientRect().width>0,
    renderer:!!window.Phaser?.WEBGL,html:document.title};
  });
  assert.ok(canvas.width>=700&&canvas.height>=400,'original Phaser arena must have real pixels');
  assert.ok(canvas.visible);
  const critical=errors.filter(e=>/module|SyntaxError|Unexpected token|imported module|does not provide an export|is not defined/i.test(e));
  assert.deepEqual(critical,[],'import graph must load without runtime crash');
  const missingModule=notFound.filter(o=>/\.js(\?|$)/.test(o.url));
  assert.deepEqual(missingModule,[],'missing source JS file(s)');
  await page.screenshot({path:'test-evidence/pokearena-original-phaser-source.png',fullPage:true});
  // Exercise the real on-canvas Play button rather than stopping at the title.
  await page.mouse.click(490,275);
  await page.waitForTimeout(1100);
  await page.screenshot({path:'test-evidence/pokearena-play-menu.png',fullPage:true});
  await page.mouse.click(490,405); // Training in the original Play menu.
  await page.waitForTimeout(1350);
  await page.screenshot({path:'test-evidence/pokearena-training-select.png',fullPage:true});
  await page.mouse.click(205,149); // Confirm Squirtle for Player 1.
  await page.waitForTimeout(300);
  await page.mouse.click(68,149); // Confirm Bulbasaur as Dummy after focus switches.
  await page.waitForTimeout(350);
  await page.mouse.click(864,544); // Fight! from original client.
  await page.waitForTimeout(2450);
  await page.screenshot({path:'test-evidence/pokearena-training-battle.png',fullPage:true});
  // Android landscape: the real LOADING scene must complete before the
  // timeout; merely having a WebGL canvas is not enough.
  const mobile=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:2});
  const mobileErrors=[];const mobileMissing=[];
  mobile.on('pageerror',e=>mobileErrors.push(String(e)));
  mobile.on('response',r=>{if(r.status()>=400)mobileMissing.push({status:r.status(),url:r.url()})});
  const begin=Date.now();
  await mobile.goto('http://127.0.0.1:4274/arena2d/',{waitUntil:'domcontentloaded',timeout:35000});
  await mobile.waitForFunction(()=>window.__pt2Started===true&&!!document.querySelector('#juego canvas'),null,{timeout:55000,polling:250});
  await mobile.waitForTimeout(750);
  const mobileBootMs=Date.now()-begin;
  const mobileInfo=await mobile.evaluate(()=>({started:window.__pt2Started,
    canvasWidth:document.querySelector('#juego canvas')?.width,
    viewport:{width:innerWidth,height:innerHeight},
    rotateOverlay:getComputedStyle(document.getElementById('girar')).display}));
  assert.equal(mobileInfo.started,true,'Android must leave initial LOADING scene');
  assert.ok(mobileInfo.canvasWidth>500,'Android landscape WebGL game must render');
  assert.deepEqual(mobileErrors.filter(x=>/TypeError|ReferenceError|SyntaxError/i.test(x)),[]);
  await mobile.screenshot({path:'test-evidence/pokearena-android-landscape.png',fullPage:true});
  await mobile.close();
  const summary={url:page.url(),title:await page.title(),canvas,errors:errors.slice(0,20),
   notFound:notFound.slice(0,40),mobile:{...mobileInfo,bootMs:mobileBootMs,errors:mobileErrors,missing:mobileMissing.slice(0,20)},source:'pokearena2d.com',result:'Phaser source booted'};
  fs.writeFileSync('test-evidence/pokearena-original-source-smoke.json',JSON.stringify(summary,null,2));
  console.log(JSON.stringify(summary,null,2));
 }finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
