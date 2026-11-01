/* Capture actual Phaser/WebGL screenshots of Option C ART in an isolated scene.
 * This is NOT the original Poké Arena client nor integrated campaign gameplay.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve('.');
const MIME={'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.json':'application/json'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost');
 const pathname=u.pathname==='/favicon.ico'?'/tests/option-c-route1-preview.html':u.pathname;
 const p=path.resolve(root,'.'+pathname);
 if(!p.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 fs.readFile(p,(err,b)=>{
  res.writeHead(err?404:200,{'Content-Type':MIME[path.extname(p)]||'application/octet-stream'});
  res.end(err?'missing':b);
 });
});
(async()=>{
 await new Promise(resolve=>server.listen(4507,'127.0.0.1',resolve));
 const browser=await chromium.launch({
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']
 });
 const dir='test-evidence/option-c-route1';fs.mkdirSync(dir,{recursive:true});
 try{
  const reports=[];
  for(const [name,viewport] of [['desktop',{width:1280,height:720}],['mobile',{width:854,height:480}]]){
   const page=await browser.newPage({viewport,hasTouch:name==='mobile'});
   const errors=[];page.on('pageerror',e=>errors.push(String(e)));
   const response=await page.goto('http://127.0.0.1:4507/tests/option-c-route1-preview.html');
   assert.equal(response.status(),200);
   await page.waitForFunction(()=>window.__optionCScene?.artVersion==='option-c-route1-v1',null,{timeout:45000});
   const snapshot=await page.evaluate(()=>{
    const g=window.__optionCGame,s=window.__optionCScene;
    return {renderer:s.renderer,scene:g.scene.isActive('option-c-route1'),
     artVersion:s.artVersion,trainers:s.meta.trainers,preview:s.meta.previewOnly,
     north:s.meta.exits.north,south:s.meta.exits.south,
     canvas:g.canvas.getBoundingClientRect().toJSON(),
     storage:Object.keys(localStorage),pixelArt:g.config.renderType===2};
   });
   assert.equal(snapshot.renderer,2,'must be genuine Phaser WebGL');
   assert.equal(snapshot.scene,true,'Phaser scene must be live');
   assert.equal(snapshot.preview,true,'not a campaign scene');
   assert.equal(snapshot.trainers,0,'no new trainers or grind');
   assert.equal(snapshot.north,'viridian');
   assert.equal(snapshot.south,'pallet');
   assert.deepEqual(snapshot.storage,[],'art scene must not write a save');
   assert.deepEqual(errors,[],'Phaser page errors');
   await page.waitForTimeout(350);
   const filename='option-c-route1-'+name+'-phaser.png';
   await page.screenshot({path:path.join(dir,filename)});
   reports.push({device:name,file:filename,...snapshot});
   await page.close();
  }
  fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify(reports,null,2));
  console.log('PASS: real standalone Phaser/WebGL Route 1 Option C screenshots desktop/mobile, zero save writes');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
