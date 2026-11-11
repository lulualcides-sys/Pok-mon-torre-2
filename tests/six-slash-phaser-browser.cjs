'use strict';
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const filename=path.resolve(root,'.'+decodeURI((req.url||'/').split('?')[0]));
 if(filename!==root&&!filename.startsWith(root+path.sep)){res.writeHead(403).end();return}
 fs.readFile(filename,(err,data)=>{
  if(err){res.writeHead(404).end('not found');return}
  const ext=path.extname(filename);
  res.writeHead(200,{'Content-Type':ext==='.png'?'image/png':ext==='.js'?'text/javascript':ext==='.html'?'text/html':'application/octet-stream'});
  res.end(data);
 });
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
 headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 try{
 for(const [label,viewport,isMobile] of [['desktop',{width:1280,height:750},false],['mobile',{width:844,height:390},true]]){
  const page=await browser.newPage({viewport,isMobile,hasTouch:isMobile});
  const errors=[],bad=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400&&/slash|phaser|\.png/.test(r.url()))bad.push(r.status()+' '+r.url())});
  await page.goto('http://127.0.0.1:'+server.address().port+'/slash-phaser-lab.html',
   {waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForFunction(()=>window.__slashLabReady?.ok===true,null,{timeout:45000});
  await page.waitForTimeout(1100);
  const data=await page.evaluate(()=>({state:window.__slashLabReady,
    canvas:[document.querySelector('#game canvas')?.width,document.querySelector('#game canvas')?.height]}));
  assert.equal(data.state.textureCount,6,label);
  assert.equal(data.state.renderer,'WebGL',label);
  assert.ok(data.state.visibleSprites>=6,label);
  assert.deepEqual(data.canvas,[960,540],label);
  assert.deepEqual(errors,[],label+' console errors');
  assert.deepEqual(bad,[],label+' HTTP errors');
  fs.mkdirSync(path.join(root,'test-evidence','slashes'),{recursive:true});
  await page.screenshot({path:path.join(root,'test-evidence','slashes',label+'.png')});
  console.log('PASS '+label+' Phaser WebGL six animated textures, screenshot saved');
  await page.close();
 }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1});
