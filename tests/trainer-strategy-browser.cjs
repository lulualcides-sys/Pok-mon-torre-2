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
 await new Promise(r=>server.listen(4281,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:4281/arena2d/');
 await page.waitForFunction(()=>window.__pt2Started&&window.__pt2Game?.scene.isActive('titulo'),null,{timeout:45000});
 await page.evaluate(async()=>{
  const src=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
  window.core=await import(new URL('./torre2/campaign-core.js',src));
  core.saveCampaign(core.createCampaign('bulbasaur'));
  window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
 });
 await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'));


 await page.evaluate(async()=>{
  const src=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
  const {prepareLaboratoryMatch}=await import(new URL('./torre2/laboratory.js',src));
  const {resolveLoadout}=await import(new URL('./torre2/move-pool.js',src));
  const m=prepareLaboratoryMatch({player:'squirtle',enemy:'charmander',level:50});
  m.torre2.stage=2;m.torre2.party.strategic=true;m.torre2.party.trainerItems={};
  m.torre2.party.foes[1]={id:'bulbasaur',hp:73,level:50,loadout:resolveLoadout({id:'bulbasaur',progression:{species:'bulbasaur',level:50}})};
  window.__pt2Game.scene.getScene('campanha').launchBattle(m,false);
 });
 await page.waitForFunction(()=>{const b=window.__pt2Game.scene.getScene('combate');return b.scene.isActive()&&b.__torre2TrainerStrategy&&b.fase==='lucha'},null,{timeout:30000});
 await page.evaluate(()=>{
  const b=window.__pt2Game.scene.getScene('combate');b.controles.forEach(c=>c.leer=()=>null);
  b.luchadores.forEach(a=>{a.inmortal=true;a.accion=null;a.dash=null});
  window.beforePlayerHP=b.luchadores[0].hp;
  b.t=8;b.__torre2TrainerStrategy.nextCheck=8;b.__torre2TrainerStrategy.nextSwitch=8;
 });
 await page.waitForFunction(()=>{const b=window.__pt2Game.scene.getScene('combate');return b.datos.torre2.party.enemyIndex===1&&!b.__torre2Changing&&b.fase==='lucha'},null,{timeout:20000});
 const result=await page.evaluate(()=>{
  const b=window.__pt2Game.scene.getScene('combate'),e=b.luchadores[1],p=b.datos.torre2.party;
  return {switches:b.__torre2TrainerStrategy.switches,index:p.enemyIndex,dex:e.dex,hp:e.hp,max:e.hpMax,
   outgoing:p.foes[0].hp,playerHp:b.luchadores[0].hp,playerBefore:window.beforePlayerHP,next:b.__torre2TrainerStrategy.nextSwitch,time:b.t};
 });
 assert.equal(result.switches,1);assert.equal(result.index,1);assert.equal(result.dex,'0001');
 assert.ok(Math.abs(result.hp-Math.round(result.max*.73))<2,'reserve keeps its real HP');
 assert.ok(result.outgoing>0,'outgoing Pokemon stays alive');assert.equal(result.playerHp,result.playerBefore);
 assert.ok(result.next>result.time,'switch cooldown remains active');
 await page.screenshot({path:'test-evidence/trainer-strategic-switch.png'});
 await page.evaluate(()=>{const b=window.__pt2Game.scene.getScene('combate');b.t=12;b.luchadores[1].hp=b.luchadores[1].hpMax*.2;});
 // Advance more than the retired 75-frame trigger while the new 20-second
 // cooldown is still active: a second legacy policy must not recall again.
 await page.evaluate(()=>new Promise(resolve=>{const game=window.__pt2Game;let frames=0;const step=()=>{if(++frames>=90){game.events.off('step',step);resolve()}};game.events.on('step',step)}));
 const cooldown=await page.evaluate(()=>{const b=window.__pt2Game.scene.getScene('combate');return {switches:b.__torre2TrainerStrategy.switches,index:b.datos.torre2.party.enemyIndex,changing:b.__torre2Changing}});
 assert.deepEqual(cooldown,{switches:1,index:1,changing:false});
 assert.deepEqual(errors,[]);console.log('PASS strategic AI real recall/sendout, preserved HP and bounded cooldown',result);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
