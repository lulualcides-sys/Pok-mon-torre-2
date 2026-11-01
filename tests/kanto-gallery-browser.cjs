/* Actual Chromium screenshots of a separate Phaser/WebGL gallery Scene.
 * Browser fixtures are visual-only; no campaign, battle, save or HUD edits.
 */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve('_site');
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost');
 const p=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!p.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 fs.readFile(p,(err,b)=>{res.writeHead(err?404:200,{'Content-Type':({'.js':'text/javascript','.html':'text/html','.json':'application/json','.png':'image/png','.webp':'image/webp','.css':'text/css'})[path.extname(p)]||'application/octet-stream'});res.end(err?'missing':b)});
});
const ids=['pallet','route1','viridian','forest2','pewter','route3','moon','route4'];
(async()=>{
 await new Promise(resolve=>server.listen(4499,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 fs.mkdirSync('test-evidence/kanto-gallery',{recursive:true});
 const reports=[];
 try{
  for(const [device,viewport] of [['desktop',{width:1280,height:720}],['mobile',{width:854,height:480}]]){
   const page=await browser.newPage({viewport,hasTouch:device==='mobile'});
   const errors=[];page.on('pageerror',e=>errors.push(String(e)));
   await page.goto('http://127.0.0.1:4499/arena2d/?original=1',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
   const initial=await page.evaluate(()=>localStorage.getItem('pokemon-torre-2-kanto-campaign-v1'));
   await page.evaluate(async()=>{
    const main=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
    const mod=await import(new URL('./torre2/kanto-gallery.js',main));
    const Phaser=window.Phaser;
    if(!Phaser?.Scene)throw Error('Native Phaser.Scene not exposed');
    class Gallery extends Phaser.Scene{
     constructor(){super({key:'kanto-gallery'})}
     create(){const go=id=>mod.drawKantoPreview(this,id,go);go('pallet')}
    }
    window.__pt2Game.scene.add('kanto-gallery',Gallery,true);
   });
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('kanto-gallery')?.__kantoPreview?.id==='pallet');
   for(let i=0;i<ids.length;i++){
    const id=ids[i];
    const state=await page.evaluate(()=>window.__pt2Game.scene.getScene('kanto-gallery').__kantoPreview);
    assert.equal(state.id,id);assert.equal(state.renderer,2,'must render native WebGL');
    assert.equal(state.implemented,false,'visual-only: do not imply campaign integrated');
    assert.equal(state.artStandard,'option-c-approved-2026-11-01','approved visual standard must be present');
    assert.ok(state.biome&&typeof state.biome==='string','each region must declare a distinct biome');
    if(state.kind==='city')assert.equal(state.trainers,0);
    if(id==='pallet')assert.deepEqual(state.buildings,['Casa do Red','Casa do Rival','Laboratório Oak']);
    const name='kanto-gallery-'+id+'-'+device+'.png';
    await page.screenshot({path:'test-evidence/kanto-gallery/'+name});
    reports.push({id,device,file:name,renderer:state.renderer,kind:state.kind,previewOnly:true});
    const xy=await page.evaluate(()=>{
     const s=window.__pt2Game.scene.getScene('kanto-gallery');
     const z=s.children.list.find(o=>o.input?.enabled&&o.getData?.('kanto-preview-nav')==='next');
     if(!z)throw Error('Native next navigation missing');
     const b=document.querySelector('#juego canvas').getBoundingClientRect();
     return{x:b.x+z.x*b.width/640,y:b.y+z.y*b.height/360};
    });
    if(device==='mobile')await page.touchscreen.tap(xy.x,xy.y);
    else{await page.mouse.move(xy.x,xy.y);await page.mouse.down();await page.waitForTimeout(120);await page.mouse.up()}
    await page.waitForFunction(nextId=>window.__pt2Game.scene.getScene('kanto-gallery').__kantoPreview.id===nextId,ids[(i+1)%ids.length],{timeout:5000});
   }
   assert.equal(await page.evaluate(()=>localStorage.getItem('pokemon-torre-2-kanto-campaign-v1')),initial,'gallery must preserve exact save bytes');
   assert.deepEqual(errors,[],'no page errors');
   await page.close();
  }
  fs.writeFileSync('test-evidence/kanto-gallery/report.json',JSON.stringify(reports,null,2));
  const items=ids.map(id=>'<figure><img src="kanto-gallery-'+id+'-desktop.png" alt="'+id+' real Phaser desktop"><img src="kanto-gallery-'+id+'-mobile.png" alt="'+id+' real Phaser mobile"><figcaption>'+id.toUpperCase()+' — PHASER WEBGL, CONCEITO NAVEGÁVEL, NÃO INTEGRADO À CAMPANHA</figcaption></figure>').join('\n');
  fs.writeFileSync('test-evidence/kanto-gallery/index.html','<!doctype html><meta charset="utf-8"><title>Kanto gallery | Phaser previews</title><style>body{background:#132b32;color:#e4e5d3;font:16px sans-serif;margin:2rem}figure{background:#23424a;padding:1rem;margin:1rem 0}img{max-width:48%;margin-right:1%}figcaption{margin-top:1rem}</style><h1>Oito regiões — prévias reais Phaser/WebGL, NÃO integradas à campanha</h1>'+items);
  console.log('PASS: 16 native Phaser/WebGL screenshots, eight scenes, desktop/mobile, unchanged save');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
