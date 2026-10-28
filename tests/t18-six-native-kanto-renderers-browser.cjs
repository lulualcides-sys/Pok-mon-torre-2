'use strict';
// T18 rendered-form smoke: actual Phaser/WebGL PMD sprites on six Kanto species,
// including species with historic slug/evolution-lookup risks.
// Isolated Arena matches, no altered moves, no campaign save writes.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const MIME={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp',
 '.jpg':'image/jpeg','.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url||'/','http://127.0.0.1');
 const file=path.resolve(root,'.'+(url.pathname.endsWith('/')?
  url.pathname+'index.html':url.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('blocked');}
 try{const data=await fsp.readFile(file);res.writeHead(200,
  {'content-type':MIME[path.extname(file)]||'application/octet-stream'});res.end(data);}
 catch{res.writeHead(404);res.end('not found');}
});
const sample=[
 {id:'nidoran-f',dex:'0029'},
 {id:'farfetchd',dex:'0083'},
 {id:'mr-mime',dex:'0122'},
 {id:'venusaur',dex:'0003'},
 {id:'dragonite',dex:'0149'},
 {id:'mew',dex:'0151'}
];
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(ok=>server.listen(4449,'127.0.0.1',ok));
 const browser=await chromium.launch({
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']
 });
 const report={scope:'T18 native Phaser/WebGL six representative Kanto renderers',
  method:'Arena fight each selected species; 151 others covered by built PMD and buscar audit',
  notNaturalCampaign:true,combat:[]};
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4449/arena2d/?original=1',
   {waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),
   null,{timeout:60000});
  for(const species of sample){
   await page.evaluate(id=>{
    window.__pt2Game.scene.getScene('titulo').scene.start('combate',{
     modo:'cpu',p1:id,p2:'joltik',mandos:['tactil','pad0'],nivel:'facil'
    });
   },species.id);
   await page.waitForFunction(id=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return b.scene.isActive()&&b.fase==='lucha'&&
     b.datos.p1===id&&b.luchadores?.[0]?.spr?.active&&
     b.luchadores[0].spr?.texture?.key?.startsWith('pmd-');
   },species.id,{timeout:65000});
   const result=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate'),a=b.luchadores[0];
    const enemy=b.luchadores[1];
    a.inmortal=true;enemy.inmortal=true;
    b.controles[1].leer=()=>({mx:0,my:0,ax:a.x,ay:a.y});
    const texture=a.spr.texture.key;
    return {def:a.def.id,form:a.forma.nombre,stage:a.etapa,
     texture,visible:a.spr.visible,active:a.spr.active,
     frame:[a.spr.frame?.width,a.spr.frame?.height],
     exists:b.textures.exists(texture),kit:Object.fromEntries(
      ['lmb','rmb','q','e'].map(slot=>[slot,a.kit[slot]?.nombre||null]))
    };
   });
   assert.ok(result.exists&&result.active&&result.visible,
    species.id+' has no visible native PMD sprite');
   assert.ok(result.texture.startsWith('pmd-'+species.dex+'-'),
    species.id+' wrong form texture '+result.texture);
   assert.ok(result.frame.every(x=>x>0),species.id+' blank sprite frame');
   assert.ok(Object.values(result.kit).some(Boolean),
    species.id+' has no usable native move');
   report.combat.push({id:species.id,...result});
   await page.screenshot({path:'test-evidence/t18-'+species.id+'-native-webgl.png'});
   await page.evaluate(()=>{
    window.__pt2Game.scene.getScene('combate').scene.start('titulo');
   });
   await page.waitForFunction(()=>window.__pt2Game.scene.isActive('titulo'),
    null,{timeout:30000});
  }
  assert.equal(report.combat.length,sample.length);
  assert.deepEqual(errors,[],'Phaser JS exceptions while switching species');
  fs.writeFileSync('test-evidence/t18-six-native-rendered-forms.json',
   JSON.stringify(report,null,2));
  console.log('T18 PHASER SIX KANTO FORM RENDER PASS',JSON.stringify(
   report.combat.map(x=>({id:x.id,texture:x.texture,stage:x.stage}))));
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;server.close()});
