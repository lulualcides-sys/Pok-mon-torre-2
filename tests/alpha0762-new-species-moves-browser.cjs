'use strict';
// Alpha 0.76.2 port: casts every slot (lmb/rmb/q/e/esp) of the 11 new native
// species in a real Phaser combat (Chromium/WebGL). Fails on any page error,
// rejected or throwing cast, or a fighter that does not start.
// Usage: CHROME_BIN=... node tests/alpha0762-new-species-moves-browser.cjs [_site] [test-evidence/alpha0762]
const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(process.argv[2]||process.env.PREVIEW_ROOT||'_site');
const out=path.resolve(process.argv[3]||'test-evidence/alpha0762');
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png',
 '.jpg':'image/jpeg','.webp':'image/webp','.mp3':'audio/mpeg','.webmanifest':'application/manifest+json','.css':'text/css'};
const server=http.createServer(async(req,res)=>{
 let key=decodeURIComponent(new URL(req.url,'http://x').pathname);if(key.endsWith('/'))key+='index.html';
 const abs=path.resolve(root,'.'+key);if(!abs.startsWith(root)){res.writeHead(403);return res.end()}
 try{const d=await fs.readFile(abs);res.writeHead(200,{'content-type':types[path.extname(abs)]||'application/octet-stream'});res.end(d)}
 catch{res.writeHead(404);res.end()}
});
// TORRE2_NEW_SPECIES=grimer,staryu (comma list) overrides the 0.76.2 set,
// e.g. for the species that became native in Alpha 0.77.3.
const SPECIES=process.env.TORRE2_NEW_SPECIES?process.env.TORRE2_NEW_SPECIES.split(','):
 ['mimejr','porygon','treecko','sableye','chimchar','solosis','honedge','regice','darkrai','zeraora','hoopa'];
(async()=>{
 await fs.mkdir(out,{recursive:true});
 await new Promise(r=>server.listen(4291,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true,
  args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:980,height:560}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e.stack||e).slice(0,400)));
 const missing=[];page.on('response',r=>{if(r.status()>=400)missing.push(r.status()+' '+r.url().replace(/^.*arena2d\//,''))});
 await page.goto('http://127.0.0.1:4291/arena2d/index.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__pt2Started===true&&window.__pt2Game?.scene.isActive('titulo'),null,{timeout:90000});
 const report=[];
 for(const id of SPECIES){
  const errBefore=errors.length;
  await page.evaluate(id=>{const g=window.__pt2Game;for(const s of g.scene.getScenes(true))if(s.scene.key!=='titulo')s.scene.stop();
   g.scene.getScene('titulo').scene.start('combate',{p1:id,p2:'onix',arena:'estadio',nivel:'facil',modo:'entreno',mandos:['kbm','cpu']})},id);
  try{
   await page.waitForFunction(id=>{const c=window.__pt2Game.scene.getScene('combate');const l=c?.luchadores?.[0];return c?.sys.isActive()&&c.luchadores?.length===2&&c.fase==='lucha'&&(l.def?.id===id||l.id===id||l.p?.id===id)},id,{timeout:60000,polling:300});
  }catch(e){report.push({id,started:false,errors:errors.slice(errBefore)});continue}
  const casts=[];
  for(const sl of ['lmb','rmb','q','e','esp']){
   const r=await page.evaluate(async sl=>{
    const entry=[...document.querySelectorAll('script[src]')].find(x=>x.src.includes('/main.js'));
    const fx=await import(new URL('./habilidades.js',entry.src).href);
    const c=window.__pt2Game.scene.getScene('combate'),l=c.luchadores[0],r=c.luchadores[1];
    const h=l.kit?.[sl];if(!h)return {sl,absent:true};
    l.x=300;l.y=215;l.hp=l.hpMax;l.energia=100;l.ulti=100;r.x=360;r.y=215;r.hp=r.hpMax;r.ia&&(r.ia.pausa=99);
    l.ax=r.x;l.ay=r.y;l.cd[sl]=0;l.accion=null;delete l.est?.aturdido;
    const hp0=r.hp,fx0=c.efectos.length;let ok;
    try{ok=fx.usarHabilidad(l,sl)}catch(e){return {sl,nombre:h.nombre,forma:h.forma,threw:String(e).slice(0,200)}}
    return {sl,nombre:h.nombre,forma:h.forma,ok,rendered:c.efectos.length>fx0,hp0};
   },sl);
   await page.waitForTimeout(sl==='e'?2600:1400);
   if(!r.absent&&!r.threw)r.damage=await page.evaluate(hp0=>{const c=window.__pt2Game.scene.getScene('combate');return +(hp0-c.luchadores[1].hp).toFixed(1)},r.hp0);
   delete r.hp0;casts.push(r);
   if(sl==='e')await page.screenshot({path:path.join(out,id+'-ult.png')});
  }
  report.push({id,started:true,dex:await page.evaluate(()=>window.__pt2Game.scene.getScene('combate').luchadores[0].dex),
   casts,errors:errors.slice(errBefore)});
 }
 await fs.writeFile(path.join(out,'report.json'),JSON.stringify({report,missing:[...new Set(missing)]},null,1));
 for(const x of report){
  console.log(x.id.padEnd(9),x.started?'luta ok':'NAO INICIOU',
   (x.casts||[]).map(c=>c.absent?c.sl+':-':`${c.sl}:${c.nombre}[${c.threw?'ERRO':c.ok?'ok':'recusado'}${c.rendered?',fx':''}${c.damage>0?',dano '+c.damage:''}]`).join(' '),
   x.errors?.length?'ERROS:'+x.errors.length:'');
 }
 console.log('404/403:',[...new Set(missing)].slice(0,20));
 await browser.close();server.close();
 const bad=report.filter(x=>!x.started||x.errors.length||x.casts.some(c=>!c.absent&&(c.threw||!c.ok)));
 if(bad.length){console.error('ALPHA0762_NEW_MOVES_FAILED',JSON.stringify(bad).slice(0,4000));process.exit(1)}
 console.log('ALPHA0762_NEW_SPECIES_MOVES_OK',report.length,'species');
})().catch(e=>{console.error(e);process.exit(1)});
