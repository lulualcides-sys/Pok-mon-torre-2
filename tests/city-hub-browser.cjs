/* Real Phaser/WebGL mouse and touch UI regression. Stage is a visual fixture,
 * not evidence of earned badges or campaign victories. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost'),p=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!p.startsWith(root+path.sep)){res.writeHead(403);return res.end()}
 fs.readFile(p,(err,b)=>{res.writeHead(err?404:200,{'Content-Type':({'.js':'text/javascript','.html':'text/html','.json':'application/json','.png':'image/png','.webp':'image/webp','.css':'text/css'})[path.extname(p)]||'application/octet-stream'});res.end(err?'missing':b)});
});
(async()=>{
 await new Promise(r=>server.listen(4497,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 fs.mkdirSync('test-evidence',{recursive:true});
 try{
  for(const [label,viewport]of [['desktop',{width:1280,height:720}],['mobile',{width:854,height:480}]]){
   const page=await browser.newPage({viewport,hasTouch:label==='mobile'}),errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   const click=async(x,y)=>{
    const p=await page.evaluate(([x,y])=>{const r=document.querySelector('#juego canvas').getBoundingClientRect();return{x:r.x+x*r.width/640,y:r.y+y*r.height/360}},[x,y]);
    if(label==='mobile')await page.touchscreen.tap(p.x,p.y);else await page.mouse.click(p.x,p.y,{delay:120});
    await page.waitForTimeout(220);
   };
   const named=async(key,value)=>{const p=await page.evaluate(([key,value])=>{const s=window.__pt2Game.scene.getScene('campanha'),o=s.children.list.find(o=>o.active&&o.input?.enabled&&o.getData?.(key)===value);if(!o)throw Error('Missing '+key+' '+value);return[o.x,o.y]},[key,value]);await click(...p)};
   const city=()=>page.waitForFunction(()=>{const s=window.__pt2Game?.scene.getScene('campanha');return s?.scene.isActive()&&s.children.list.some(o=>o.getData?.('torre2-city-layer')==='terrain')},null,{timeout:60000});
   await page.goto('http://127.0.0.1:4497/arena2d/?original=1');
   await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
   await page.evaluate(async()=>{
    const main=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
    const core=await import(new URL('./torre2/campaign-core.js',main));
    const s=core.createPlayerCampaign('bulbasaur');s.stage=1;s.trainer=2;
    core.saveCampaign(s);window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
   });
   await city();await page.waitForTimeout(500);
   const before=await page.evaluate(()=>localStorage.getItem('pokemon-torre-2-kanto-campaign-v1'));
   const report=await page.evaluate(()=>{const s=window.__pt2Game.scene.getScene('campanha');return{...s.__torre2CityHub,renderer:s.game.renderer.type,objects:s.children.length}});
   assert.equal(report.renderer,2,'actual WebGL renderer');assert.equal(report.walking,false);
   assert.deepEqual(report.hotspots.map(x=>x.id),['center','mart','gym']);
   await page.screenshot({path:'test-evidence/city-layered-'+label+'.png'});
   await named('torre2-city-landmark','center');
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha').children.list.some(o=>o.getData?.('torre2-center-pc')));
   await named('torre2-center-pc',true);
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha').children.list.some(o=>o.getData?.('torre2-pc-team-index')===0));
   await click(549,21);await city();
   await named('torre2-city-landmark','mart');
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha').children.list.some(o=>o.getData?.('torre2-mart-buy')==='pokeball'));
   await click(120,315);await city();
   await named('torre2-city-landmark','gym');
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha').children.list.some(o=>o.text?.includes('FALTAM 13')));
   await click(320,306);await city();
   await named('torre2-city-action','EQUIPE');
   await named('torre2-summary-back',true);await city();
   await named('torre2-city-action','INSÍGNIAS');
   await named('torre2-badge-case-back',true);await city();
   assert.equal(await page.evaluate(()=>localStorage.getItem('pokemon-torre-2-kanto-campaign-v1')),before,'navigation cannot mutate save');
   // Repeated render must not leak animated water callbacks.
   const timers=await page.evaluate(()=>window.__pt2Game.scene.getScene('campanha').time.getAllEvents().filter(e=>e.loop).length);
   assert.ok(timers<=3,'bounded looping events: '+timers);
   assert.deepEqual(errors,[]);
   fs.writeFileSync('test-evidence/city-layered-'+label+'.json',JSON.stringify({...report,timers,errors,fixture:true},null,2));
   console.log(label+' city WebGL + Center/PC/Mart/gym/summary/badges passed');await page.close();
  }
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
