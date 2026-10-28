'use strict';
// T03: twelve additional Kanto evolution families rendered by the actual
// Phaser/WebGL Arena. XP readiness is a test fixture, NOT natural campaign XP.
// Never writes the campaign save or modifies approved VFX, moves or controls.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp',
 '.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const pathname=new URL(req.url,'http://127.0.0.1:4422').pathname;
 const file=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const data=await fsp.readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(data)}
 catch{res.writeHead(404);res.end('missing')}
});
const families=[
 {from:'nidoran-f',to:'nidorina',dex:'0030'},
 {from:'nidoran-m',to:'nidorino',dex:'0033'},
 {from:'poliwag',to:'poliwhirl',dex:'0061'},
 {from:'magnemite',to:'magneton',dex:'0082'},
 {from:'slowpoke',to:'slowbro',dex:'0080'},
 {from:'rhyhorn',to:'rhydon',dex:'0112'},
 {from:'omanyte',to:'omastar',dex:'0139'},
 {from:'kabuto',to:'kabutops',dex:'0141'},
 {from:'dratini',to:'dragonair',dex:'0148'},
 {from:'clefairy',to:'clefable',dex:'0036'},
 {from:'growlithe',to:'arcanine',dex:'0059'},
 {from:'vulpix',to:'ninetales',dex:'0038'}
];
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(resolve=>server.listen(4422,'127.0.0.1',resolve));
 const browser=await chromium.launch({
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']
 });
 const report={test:'T03 twelve further Kanto one-step native evolutions',
  preparedArenaExp:true,naturalCampaign:false,transitions:[]};
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[],missingSlots=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4422/arena2d/?original=1',
   {waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),
   null,{timeout:55000});
  for(const {from,to,dex} of families){
   await page.evaluate(id=>window.__pt2Game.scene.getScene('titulo')
    .scene.start('combate',{modo:'cpu',p1:id,p2:'joltik',
     mandos:['tactil','pad0'],nivel:'facil'}),from);
   await page.waitForFunction(id=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return b.scene.isActive()&&b.fase==='lucha'&&b.datos?.p1===id&&
     b.panelTactil?.botones?.some(x=>x.slot==='mega')&&
     b.luchadores?.[0]?.spr?.texture?.key?.startsWith('pmd-');
   },from,{timeout:65000});
   const before=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    const me=b.luchadores[0],foe=b.luchadores[1];
    foe.inmortal=true;me.inmortal=true;
    b.controles[1].leer=()=>({mx:0,my:0,ax:me.x,ay:me.y});
    me.exp=me.expNecesaria; // Arena-only readiness fixture.
    return {species:me.forma.nombre,stage:me.etapa,
     canEvolve:me.puedeEvolucionar,sprite:me.spr.texture.key};
   });
   assert.equal(before.stage,0,from+' must begin at stage zero');
   assert.equal(before.canEvolve,true,from+' native EVO must be ready');
   await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate'),p=b.panelTactil;
    const btn=p.botones.find(x=>x.slot==='mega');
    const at=p.pos(btn),zero=p.punto({x:0,y:0}),one=p.punto({x:1,y:1});
    p.abajo({id:92,x:(at.x-zero.x)/(one.x-zero.x),
     y:(at.y-zero.y)/(one.y-zero.y)});
    p.leer(x=>({ax:x.x,ay:x.y}));
   });
   await page.waitForFunction(({to,dex})=>{
    const b=window.__pt2Game.scene.getScene('combate'),m=b.luchadores?.[0];
    return b.scene.isActive()&&b.fase==='lucha'&&m?.etapa===1&&
     m.forma?.nombre?.toLowerCase()===to&&m.spr?.active&&m.spr.visible&&
     m.spr.texture?.key?.startsWith('pmd-'+dex+'-')&&
     m.spr.frame?.width>0&&m.spr.frame?.height>0;
   },{to,dex},{timeout:20000});
   await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
   const after=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate'),m=b.luchadores[0];
    b.panelTactil.arriba({id:92});
    const canvas=document.querySelector('#juego canvas');
    return {species:m.forma.nombre,stage:m.etapa,sprite:m.spr.texture.key,
     active:m.spr.active,visible:m.spr.visible,
     textureLoaded:b.textures.exists(m.spr.texture.key),
     frame:[m.spr.frame.width,m.spr.frame.height],
     canvas:canvas&&[canvas.width,canvas.height],
     slots:Object.fromEntries(['lmb','rmb','q','e'].map(k=>
      [k,{name:m.kit[k]?.nombre||'',pending:m.kit[k]?.pendiente===true}]))};
   });
   assert.equal(after.species.toLowerCase(),to);
   assert.ok(after.active&&after.visible&&after.textureLoaded,to+' sprite unavailable');
   assert.ok(after.canvas?.[0]>0&&after.canvas?.[1]>0,to+' canvas blank');
   for(const [slot,move] of Object.entries(after.slots)){
    if(!move.name||move.pending)missingSlots.push({from,to,slot,
     reason:!move.name?'missing':'placeholder',slots:after.slots});
   }
   await page.screenshot({path:'test-evidence/t03-extra-'+to+'-webgl.png'});
   report.transitions.push({from,to,before,after});
   console.log('T03 PHASER EVOLUTION PASS',JSON.stringify({from,to,after}));
   await page.evaluate(()=>window.__pt2Game.scene.getScene('combate').scene.start('titulo'));
   await page.waitForFunction(()=>window.__pt2Game.scene.isActive('titulo'),
    null,{timeout:20000});
  }
  assert.deepEqual(errors,[],'No uncaught JS errors during native evolutions');
  assert.equal(report.transitions.length,12);
  report.missingSlots=missingSlots;
  fs.writeFileSync('test-evidence/t03-twelve-extra-evolutions.json',
   JSON.stringify(report,null,2));
  console.log('T03 ALL EVOLUTION SLOT GAPS',JSON.stringify(missingSlots));
  assert.deepEqual(missingSlots,[],'Unresolved evolved battle slots require real approved installed moves');
  console.log('PASS T03: twelve further Kanto native Phaser/WebGL evolutions (prepared Arena XP; not campaign)');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
