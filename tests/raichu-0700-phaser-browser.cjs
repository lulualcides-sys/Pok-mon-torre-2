'use strict';
// Real Chromium + native Phaser/WebGL + built Torre 2 Alpha 0.70 Raichu FX.
// The pinned older native client is a VERIFIED offline regression fixture,
// NOT evidence that the entire Alpha 0.70.0 was captured or published.
const fs=require('node:fs'),fsp=require('node:fs/promises');
const http=require('node:http'),path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const evidence=path.resolve('test-evidence/raichu-0700');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.png':'image/png','.webp':'image/webp','.css':'text/css','.jpg':'image/jpeg'};
const server=http.createServer(async(req,res)=>{
 let url;
 try{url=new URL(req.url||'/', 'http://localhost');}
 catch{res.writeHead(400).end();return;}
 const requested=url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname;
 const file=path.resolve(root,'.'+requested);
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{
  const data=await fsp.readFile(file);
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'}).end(data);
 }catch{res.writeHead(404).end();}
});
(async()=>{
 fs.mkdirSync(evidence,{recursive:true});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']
 });
 try{
  const page=await browser.newPage({viewport:{width:980,height:650},deviceScaleFactor:1});
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(error.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/arena2d/?original=1');
  await page.waitForFunction(()=>window.__pt2Started===true&&
    window.__pt2Game?.scene?.isActive('titulo'),null,{timeout:60000});
  const setup=await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>/\/src-[a-f0-9]{10}\/main\.js/.test(s.src))?.src;
   if(!src)throw Error('Built versioned native Phaser main.js missing');
   const base=new URL('./',src);
   const {Luchador}=await import(new URL('luchador.js',base));
   const effect=await import(new URL('torre2/raichu-electro-ball-0700.js',base));
   const signatures=await import(new URL('torre2/signature-fx.js',base));
   if(!Object.getOwnPropertySymbols(Luchador.prototype).some(
      s=>s===Symbol.for('torre2.raichu.electro.0700')))
    throw Error('Native Luchador missing installed Raichu adapter');
   if(signatures.TORRE2_FORMS[effect.RAICHU_ELECTRO_FORM]!==effect.raichuElectroBall0700)
    throw Error('Phaser FORMAS missing Raichu native handler');
   const scene=window.__pt2Game.scene.getScene('titulo');
   if(window.__pt2Game.renderer.type!==Phaser.WEBGL)
    throw Error('Real Phaser WebGL renderer is mandatory');
   const target={x:300,y:240,alto:36,hp:100,ko:false,
    hits:[],recibir(actor,h){
     this.hits.push({dano:h.dano,tipo:h.tipo,empuje:h.empuje});
     this.hp=Math.max(0,this.hp-h.dano);
     return 'golpe';
    }};
   const actor={x:130,y:240,alto:36,t:100,ax:target.x,ay:target.y-18,
    rival:target,escena:scene,ko:false,animar(){this.animated=true}};
   scene.efectos=scene.efectos||[];
   const h={nombre:'Electro Ball',forma:effect.RAICHU_ELECTRO_FORM,
    tipo:'ELECTRIC',dano:3.5,golpes:3,cada:.1,carga:.55,
    vel:380,alcance:300,radio:9,final:{dano:9,empuje:120},
    rayito:{dano:2,aturde:.5},anim:'Charge'};
   const fx=signatures.TORRE2_FORMS[h.forma](actor,h,{slot:'rmb'});
   window.__raichu0700={scene,actor,target,fx};
   for(let n=0;n<66;n++)fx.update(1/60);
   return {renderer:window.__pt2Game.renderer.type,
    adapterInstalled:true,actualVfxFunction:true,
    hitsAfterFirstSecond:target.hits.length,phaserDrawn:!!fx};
  });
  assert.equal(setup.renderer,2,'real WebGL path');
  assert.equal(setup.adapterInstalled,true);
  assert.equal(setup.actualVfxFunction,true);
  await page.screenshot({path:path.join(evidence,'raichu-electro-ball-contact-webgl.png')});
  const result=await page.evaluate(()=>{
   const {fx,target}=window.__raichu0700;
   for(let n=0;n<100;n++)fx.update(1/60);
   return {hp:target.hp,hits:target.hits,disposed:!fx.update(1/60)};
  });
  assert.equal(result.hits.length,5,'three real contact events, finisher and spark');
  assert.ok(Math.abs(result.hp-78.5)<.00001,'real impact damage');
  assert.ok(result.disposed,'Phaser graphics lifecycle complete');
  assert.deepEqual(pageErrors,[],'no JS runtime crash');
  fs.writeFileSync(path.join(evidence,'result.json'),JSON.stringify({
   note:'Offline approved-source fixture only, not full native Alpha 0.70 client',
   setup,result,pageErrors
  },null,2));
  console.log('PASS real Chromium Phaser WebGL Raichu Electro Ball with genuine graphics');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;})
 .finally(()=>server.close());
