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
 await new Promise(r=>server.listen(4282,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:4282/arena2d/');
 await page.waitForFunction(()=>window.__pt2Started&&window.__pt2Game?.scene.isActive('titulo'),null,{timeout:45000});
 await page.evaluate(async()=>{
  const src=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
  window.core=await import(new URL('./torre2/campaign-core.js',src));
  core.saveCampaign(core.createCampaign('bulbasaur'));
  window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
 });
 await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'));


 const report=[];
 for(let stage=0;stage<13;stage++){
  const setup=await page.evaluate(stage=>{
   const s=core.readCampaign();if(s.stage!==stage)throw Error('Unexpected campaign stage '+s.stage);
   s.trainer=core.TRAINERS_PER_GYM(stage);core.healTeam(s);s.active=s.team.findIndex(m=>m.id==='mewtwo');core.saveCampaign(s);
   const spec=core.STAGES[stage],before={money:s.money,badges:[...s.badges],wins:s.wins};
   window.__pt2Game.scene.getScene('campanha').enterBattle(s);
   return {name:spec.leader,expected:stage===12?core.rivalChampionTeam(core.campaignStarter(s)):spec.leaderTeam,levels:spec.leaderLevels,before};
  },stage);
  await page.waitForFunction(()=>{const b=window.__pt2Game.scene.getScene('combate');return b.scene.isActive()&&b.__torre2PartyInstalled},null,{timeout:45000});
  await page.evaluate(()=>{const b=window.__pt2Game.scene.getScene('combate');b.controles.forEach(c=>c.leer=()=>null);b.__torre2TrainerStrategy.enabled=false;});
  await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').fase==='lucha',null,{timeout:20000});
  const lineup=await page.evaluate(()=>window.__pt2Game.scene.getScene('combate').datos.torre2.party.foes.map(m=>({id:m.id,level:m.level,moves:Object.values(m.loadout).filter(h=>h&&!h.pendiente).map(h=>h.nombre)})));
  assert.deepEqual(lineup.map(m=>m.id),setup.expected);assert.deepEqual(lineup.map(m=>m.level),setup.levels);
  const rendered=[];
  for(let index=0;index<lineup.length;index++){
   await page.waitForFunction(index=>{const b=window.__pt2Game.scene.getScene('combate');return b.scene.isActive()&&b.fase==='lucha'&&!b.__torre2Changing&&b.datos.torre2.party.enemyIndex===index},index,{timeout:20000});
   const actor=await page.evaluate(()=>{const b=window.__pt2Game.scene.getScene('combate'),e=b.luchadores[1];return {id:b.datos.p2,name:e.nombre,hudName:b.hud.lados[1].identidad[0].text,portrait:b.hud.lados[1].retrato.texture.key,dex:e.dex,texture:e.spr.texture.key,hp:e.hp,max:e.hpMax,x:e.x,y:e.y,level:b.datos.torre2.enemyLevel,items:b.__torre2TrainerItems.inventory}});
   assert.equal(actor.id,lineup[index].id);assert.equal(actor.hudName,actor.name);assert.equal(actor.portrait,'retrato-'+actor.dex);assert.ok(actor.texture.startsWith('pmd-'+actor.dex+'-'));assert.ok(actor.hp>0&&actor.hp<=actor.max);assert.ok(Number.isFinite(actor.x)&&Number.isFinite(actor.y));assert.equal(actor.level,lineup[index].level);
   rendered.push(actor);
   if(index===lineup.length-1)await page.screenshot({path:'test-evidence/campaign-stage-'+stage+'.png'});
   // Debug shortcut: resolves each KO through the actual transition/result path.
   await page.evaluate(()=>{const b=window.__pt2Game.scene.getScene('combate'),e=b.luchadores[1];e.hp=0;b.alKO(e)});
  }
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'),null,{timeout:20000});
  const after=await page.evaluate(()=>{const s=core.readCampaign();return {stage:s.stage,money:s.money,badges:s.badges,leagueHonors:s.leagueHonors,wins:s.wins,champion:s.champion,tms:s.inventory.tms}});
  assert.equal(after.badges.length,Math.min(stage+1,8));assert.equal(after.leagueHonors.length,Math.max(0,stage-7));assert.equal(after.stage,stage+1);assert.equal(after.wins,setup.before.wins+1);assert.equal(after.money,setup.before.money+1200);
  report.push({stage,name:setup.name,lineup,rendered,after});console.log('PASS DEBUG CAMPAIGN',setup.name,after);
 }
 assert.equal(report.at(-1).after.champion,true);assert.deepEqual(errors,[]);
 fs.writeFileSync('test-evidence/campaign-tour-debug.json',JSON.stringify({method:'Debug route skip and forced KO; actual browser rendering, transitions, results and saves. NOT normal gameplay.',report},null,2));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
