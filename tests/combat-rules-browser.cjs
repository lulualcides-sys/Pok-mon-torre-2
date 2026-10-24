'use strict';
// Browser smoke-test of the authorized original Poké Arena Phaser client,
// isolated at /arena2d/ from the Kanto campaign. Does not contact online services.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const fsp=require('node:fs/promises');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg',
 '.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.mp3':'audio/mpeg',
 '.ogg':'audio/ogg','.wav':'audio/wav'};
const server=http.createServer(async(req,res)=>{
 const requested=new URL(req.url||'/', 'http://127.0.0.1');
 let key=decodeURIComponent(requested.pathname);
 if(key.endsWith('/'))key+='index.html';
 const absolute=path.resolve(root,'.'+key);
 if(!absolute.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{
  const data=await fsp.readFile(absolute);
  res.writeHead(200,{'content-type':types[path.extname(absolute)]||'application/octet-stream'});
  res.end(data);
 }catch{res.writeHead(404);res.end('missing '+key);}
});

(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(r=>server.listen(4277,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:4277/arena2d/');
 await page.waitForFunction(()=>window.__pt2Started&&window.__pt2Game?.scene.isActive('titulo'),null,{timeout:45000});
 await page.evaluate(async()=>{
  const src=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
  window.core=await import(new URL('./torre2/campaign-core.js',src));
  core.saveCampaign(core.createCampaign('bulbasaur'));
  window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
 });
 await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'));
 const battle=async(wild=false,full=false)=>{
  await page.evaluate(({wild,full})=>{
   const s=core.readCampaign();s.team.forEach(m=>m.hp=100);s.inventory.pokeball=15;
   if(full)while(s.team.length<6)s.team.push({...s.team[0],uid:'test-'+s.team.length});
   core.saveCampaign(s);
   if(wild){s.pendingWild=null;core.startWildEncounter(s,()=>0);}
   window.__pt2Game.scene.getScene('campanha').enterBattle(s,wild);
  },{wild,full});
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('combate')&&window.__pt2Game.scene.getScene('combate').__torre2PartyInstalled,null,{timeout:20000});
  await page.evaluate(()=>{const b=window.__pt2Game.scene.getScene('combate');b.luchadores.forEach(a=>a.inmortal=true);});
  await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').fase==='lucha',null,{timeout:12000});
 };


 await page.evaluate(()=>{const s=core.readCampaign();s.trainer=13;s.team[0].id='pikachu';s.team[0].progression.species='pikachu';core.saveCampaign(s)});
 await battle();
 const immunity=await page.evaluate(()=>{
  const b=window.__pt2Game.scene.getScene('combate'),[p,e]=b.luchadores;e.est={};const hp=e.hp;
  const result=e.recibir(p,{dano:10,tipo:'ELECTRIC',slot:'q'});
  return {hp,after:e.hp,result,types:e.tipos};
 });
 assert.equal(immunity.after,immunity.hp);assert.equal(immunity.result,'miss');assert.ok(immunity.types.includes('GROUND'));
 await page.evaluate(()=>{const b=window.__pt2Game.scene.getScene('combate'),e=b.luchadores[1];e.hp=e.hpMax*.2;e.accion=null;e.dash=null;});
 await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').__torre2TrainerItems.pending,null,{timeout:15000});
 assert.equal(await page.evaluate(()=>window.__pt2Game.scene.getScene('combate').controles[1].leer(.016)),null);
 await page.screenshot({path:'test-evidence/master-trainer-potion.png'});
 await page.waitForFunction(()=>!window.__pt2Game.scene.getScene('combate').__torre2TrainerItems.pending);
 const item=await page.evaluate(()=>{const b=window.__pt2Game.scene.getScene('combate');return {uses:b.__torre2TrainerItems.uses,left:b.__torre2TrainerItems.inventory.potion,hp:b.luchadores[1].hp,max:b.luchadores[1].hpMax}});
 assert.equal(item.uses,1);assert.equal(item.left,0);assert.ok(item.hp>item.max*.2&&item.hp<=item.max);
 const statuses=await page.evaluate(async()=>{
  const b=window.__pt2Game.scene.getScene('combate'),a=b.luchadores[0];
  const src=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
  const rules=await import(new URL('./torre2/gen3-status.js',src));
  a.est={};a.hp=a.hpMax;a.ponerEstado('veneno',1,{dps:999});
  const before=a.hp;rules.tickGen3Status(a,4,()=>1);const poisonLoss=before-a.hp;
  a.ponerEstado('quemado',5,{});const exclusive=!a.est.quemado;
  const saved=rules.serializeGen3Status(a);a.est={};rules.restoreGen3Status(a,saved);
  const restored=rules.statusLabel(a);a.est={};a.ponerEstado('dormido',1,{});
  const sleeping=rules.gen3StatusInput(a,{lmb:true})===null;
  rules.tickGen3Status(a,24,()=>1);const woke=!a.est.dormido;
  a.est={};a.ponerEstado('congelado',1,{});rules.tickGen3Status(a,4,()=>0);
  return {poisonLoss,expected:Math.max(1,Math.floor(a.hpMax/8)),exclusive,restored,sleeping,woke,thawed:!a.est.congelado};
 });
 assert.equal(statuses.poisonLoss,statuses.expected);assert.equal(statuses.restored,'PSN');
 for(const k of ['exclusive','sleeping','woke','thawed'])assert.equal(statuses[k],true,k);
 console.log('PASS native status application, exclusive major status, persistence, sleep and thaw',statuses);
 console.log('PASS real Phaser Gen III immunity, limited Brock Potion, delayed healing and attack block',immunity,item);
 assert.deepEqual(errors,[]);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
