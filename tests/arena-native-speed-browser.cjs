'use strict';
// Chromium/WebGL validation of real Phaser fighter walking velocity.
// Verifies ORIGINAL/native unchanged and all Kanto-added families harmonized.
const assert=require('node:assert/strict'),fsp=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const uri=new URL(req.url,'http://127.0.0.1:4297');
 const dest=path.resolve(root,'.'+(uri.pathname.endsWith('/')?uri.pathname+'index.html':uri.pathname));
 if(!dest.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden');}
 try{const data=await fsp.readFile(dest);res.writeHead(200,{'content-type':mime[path.extname(dest)]||'application/octet-stream'});res.end(data)}
 catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 await new Promise(ok=>server.listen(4297,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:4297/arena2d/');
 await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:45000});
 const result=await page.evaluate(async()=>{
  const src=[...document.scripts].find(s=>s.src?.includes('/main.js'))?.src;
  const dir=new URL('./',src);
  const [{ROSTER},{Luchador},{synchronizedArenaSpeed}]=await Promise.all([
   import(new URL('./datos.js',dir)),import(new URL('./luchador.js',dir)),
   import(new URL('./torre2/arena-tempo.js',dir))
  ]);
  const rows=[];
  for(const def of ROSTER){
   const samples=[0,...(def.evoluciones?.length?[def.evoluciones.length]:[])];
   for(const stage of samples){
    const f=Object.create(Luchador.prototype);
    f.def=def;f.etapa=stage;f.mega=false;f.jefe=null;
    f.escena={datos:{modo:'cpu'}};
    const raw=f.forma.vel,native=f.velBase;
    f.escena={datos:{torre2:{active:true},modo:'campanha'}};
    const campaign=f.velBase;
    rows.push({id:def.id,stage,added:!!def.torre2ArenaAdded,extended:!!def.torre2Kanto151,raw,native,campaign,formula:synchronizedArenaSpeed(raw,{added:!!def.torre2ArenaAdded,kanto151:!!def.torre2Kanto151})});
   }
  }
  return rows;
 });
 const raw={native:[],early:[],extended:[]},synced={native:[],early:[],extended:[]};
 for(const row of result){
  const group=!row.added?'native':row.extended?'extended':'early';
  if(row.stage===0){raw[group].push(row.raw);synced[group].push(row.native);}
  assert.equal(row.campaign,row.native,row.id+' Arena and campaign must walk at same speed');
  assert.equal(row.native,row.formula,row.id+' uses the exact tempo helper');
  if(!row.added)assert.equal(row.native,row.raw,row.id+' original movement untouched');
 }
 const avg=arr=>arr.reduce((a,b)=>a+b,0)/arr.length;
 const summary=Object.fromEntries(Object.keys(raw).map(k=>[k,{
  count:raw[k].length,old:Math.round(avg(raw[k])*10)/10,new:Math.round(avg(synced[k])*10)/10,
  min:Math.min(...synced[k]),max:Math.max(...synced[k])
 }]));
 console.log('ARENA_NATIVE_TEMPO_STATS',JSON.stringify(summary));
 assert.ok(summary.native.count>20,'baseline roster loaded');
 assert.ok(summary.early.count>10,'early Kanto roster loaded');
 assert.ok(summary.extended.count>10,'remaining Kanto roster loaded');
 assert.ok(Math.abs(summary.early.new-summary.native.new)<15,'early added Kanto should match native pacing');
 assert.ok(Math.abs(summary.extended.new-summary.native.new)<15,'extended added Kanto should match native pacing');
 assert.ok(summary.early.new>summary.early.old,'early added Kanto movement improved');
 assert.ok(summary.extended.new>summary.extended.old,'extended Kanto movement improved');
 assert.deepEqual(errors,[],'no runtime errors');
 console.log('PASS native Arena and Kanto walk at identical calibrated pace; original species unchanged');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
