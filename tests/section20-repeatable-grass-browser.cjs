'use strict';
// Native Phaser tall-grass UI after the old five-encounter soft lock.
// The saved counter=5 is a declared test fixture; no victory or capture
// is fabricated. The NEW search is made with an actual mouse/touch action.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1');
 const p=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!p.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const bytes=await fsp.readFile(p);res.writeHead(200,{'content-type':types[path.extname(p)]||'application/octet-stream'});res.end(bytes)}
 catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(r=>server.listen(4331,'127.0.0.1',r));
 const browser=await chromium.launch({
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']
 });
 try{
  for(const [label,viewport] of [['desktop',{width:1280,height:720}],['mobile',{width:854,height:480}]]){
   const page=await browser.newPage({viewport,hasTouch:label==='mobile'});
   const errors=[];page.on('pageerror',e=>errors.push(String(e)));
   try{
    await page.goto('http://127.0.0.1:4331/arena2d/?original=1',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:45000});
    await page.evaluate(async()=>{
     const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
     window.kantoGrass=await import(new URL('./torre2/campaign-core.js',src));
     const s=kantoGrass.createCampaign('squirtle');
     s.wildEncountersStage=5; // fixture only: 5 prior legitimate searches
     kantoGrass.saveCampaign(s);
     window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
    });
    await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
     !!window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,null,{timeout:45000});
    const before=await page.evaluate(()=>{
     const s=window.kantoGrass.readCampaign();
     const c=window.__pt2Game.scene.getScene('campanha');
     c.grassScreen(s);
     return {stage:s.stage,trainer:s.trainer,wins:s.wins,losses:s.losses,
      money:s.money,balls:s.inventory.pokeball,count:s.wildEncountersStage,
      text:c.children.list.filter(x=>typeof x.text==='string').map(x=>x.text).find(t=>t.includes('SEM LIMITE'))};
    });
    assert.equal(before.count,5);
    assert.match(before.text||'',/ENCONTROS REALIZADOS: 5.*SEM LIMITE/);
    await page.screenshot({path:'test-evidence/section20-grass-'+label+'-after-five.png'});
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    const point=await page.evaluate(()=>{
     const rect=document.querySelector('#juego canvas').getBoundingClientRect();
     return {x:rect.x+465*rect.width/640,y:rect.y+292*rect.height/360};
    });
    if(label==='mobile')await page.touchscreen.tap(point.x,point.y);
    else await page.mouse.click(point.x,point.y);
    await page.waitForFunction(()=>{
     const game=window.__pt2Game,b=game.scene.getScene('combate');
     return b.scene.isActive()&&b.fase==='lucha'&&!!b.__torre2WildCapture;
    },null,{timeout:65000});
    const after=await page.evaluate(()=>{
     const s=window.kantoGrass.readCampaign(),b=window.__pt2Game.scene.getScene('combate');
     return {count:s.wildEncountersStage,stage:s.stage,trainer:s.trainer,
      wins:s.wins,losses:s.losses,money:s.money,balls:s.inventory.pokeball,
      enemy:b.datos.p2,encounter:s.pendingWild?.id,level:s.pendingWild?.level};
    });
    assert.equal(after.count,6);
    assert.equal(after.stage,before.stage);
    assert.equal(after.trainer,before.trainer);
    assert.equal(after.wins,before.wins);
    assert.equal(after.losses,before.losses);
    assert.equal(after.money,before.money);
    assert.equal(after.balls,before.balls);
    assert.ok(after.enemy);
    assert.equal(after.enemy,after.encounter);
    assert.ok(after.level>=1&&after.level<=14,'wild level remains capped for Pewter');
    assert.deepEqual(errors,[]);
    await page.screenshot({path:'test-evidence/section20-wild-'+label+'-sixth-search.png'});
    console.log('PASS native grass beyond encounter five',JSON.stringify({label,before,after}));
   }finally{await page.close()}
  }
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
