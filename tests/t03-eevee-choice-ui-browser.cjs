'use strict';
// Real Chromium+Phaser UI for Eevee evolution choice.
// Creates a level-30 pending checkpoint through the campaign resolver;
// NO naturally played trainer fight is claimed in this regression.
const assert=require('node:assert/strict');
const http=require('node:http'),fsp=require('node:fs/promises'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json',
 '.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.ogg':'audio/ogg'};
const server=http.createServer(async(req,res)=>{
 const q=new URL(req.url,'http://127.0.0.1').pathname;
 const file=path.resolve(root,'.'+(q.endsWith('/')?q+'index.html':q));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden');}
 try{const buf=await fsp.readFile(file);res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream'});res.end(buf);}
 catch{res.writeHead(404);res.end('not found');}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(ok=>server.listen(4389,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
  '--use-gl=angle','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 const errors=[],report={mode:'Prepared post-battle checkpoint in real Phaser UI',forms:[]};
 page.on('pageerror',e=>errors.push(String(e)));
 const gameReady=()=>page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
 try{
  await page.goto('http://127.0.0.1:4389/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await gameReady();
  for(const form of ['vaporeon','jolteon','flareon']){
   const before=await page.evaluate(async()=>{
    const script=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
    const base=new URL('./',script),core=window.kanto=await import(new URL('./torre2/campaign-core.js',base));
    const progress=await import(new URL('./torre2/progression.js',base));
    const s=core.createCampaign('bulbasaur');
    s.stage=4;s.trainer=0;
    s.box.push(s.team.pop());
    const eevee={id:'eevee',uid:'t03-eevee-ui',hp:70,
     progression:progress.createPokemonProgression('eevee',29,{
      experience:progress.totalExperienceForLevel(30)-1}),
     nickname:'Eevee Escolha',tmMoves:['Protect'],moves:['Tackle'],movePlanSpecies:'eevee'};
    s.team.push(eevee);s.active=0;
    core.saveCampaign(s);
    const result=core.resolveBattle(s,true);
    if(!result.won||s.team[1].id!=='eevee')throw Error('Bad post-battle pending fixture');
    window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
    return {wins:s.wins,level:s.team[1].progression.level,uid:eevee.uid};
   });
   await page.waitForFunction(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    return c.scene.isActive()&&c.__torre2EeveeChoice?.active&&
     c.children.list.filter(o=>o.active&&o.getData?.('torre2-eevee-choice')).length===3;
   },null,{timeout:55000});
   const controls=await page.evaluate(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    return c.children.list.filter(o=>o.active&&o.getData?.('torre2-eevee-choice'))
     .map(o=>({id:o.getData('torre2-eevee-choice'),x:o.x,y:o.y}));
   });
   assert.deepEqual(controls.map(x=>x.id),['vaporeon','jolteon','flareon']);
   await page.screenshot({path:'test-evidence/t03-eevee-choices-'+form+'.png'});
   const target=controls.find(o=>o.id===form);
   const rect=await page.locator('#juego canvas').boundingBox();
   assert.ok(rect);
   await page.mouse.click(rect.x+target.x*rect.width/640,rect.y+target.y*rect.height/360);
   await page.waitForFunction(form=>{
    const s=window.kanto.readCampaign();
    return window.__pt2Game.scene.isActive('campanha')&&
     s?.team?.find(m=>m.uid==='t03-eevee-ui')?.id===form &&
     !window.__pt2Game.scene.getScene('campanha').__torre2EeveeChoice?.active;
   },form,{timeout:15000});
   const saved=await page.evaluate(()=>{
    const s=window.kanto.readCampaign(),m=s.team.find(m=>m.uid==='t03-eevee-ui');
    return {id:m.id,uid:m.uid,level:m.progression.level,nickname:m.nickname,
     tmMoves:m.tmMoves,movePlanSpecies:m.movePlanSpecies,won:s.wins,
     money:s.money,choices:window.kanto.pendingEeveeEvolution(s),
     bytes:localStorage.getItem(window.kanto.SAVE_KEY)};
   });
   assert.equal(saved.id,form);
   assert.equal(saved.uid,before.uid);
   assert.ok(saved.level>=30);
   assert.equal(saved.won,before.wins);
   assert.equal(saved.nickname,'Eevee Escolha');
   assert.deepEqual(saved.tmMoves,['Protect']);
   assert.equal(saved.movePlanSpecies,undefined);
   assert.equal(saved.choices,null);
   await page.reload({waitUntil:'domcontentloaded'});
   await gameReady();
   const post=await page.evaluate(async()=>{
    const script=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
    const c=await import(new URL('./torre2/campaign-core.js',script));
    return {id:c.readCampaign().team.find(m=>m.uid==='t03-eevee-ui')?.id,
     bytes:localStorage.getItem(c.SAVE_KEY)};
   });
   assert.equal(post.id,form);
   assert.equal(post.bytes,saved.bytes,'Valid Eevee evolution save must not mutate on reload');
   report.forms.push({from:'eevee',to:form,level:saved.level,
    uid:saved.uid,saveUnchanged:true,wins:saved.won,choiceCount:controls.length});
   console.log('PASS T03 EEVEE PHASER CHOICE',JSON.stringify(report.forms.at(-1)));
  }
  assert.deepEqual(errors,[],'No browser JavaScript exceptions');
  console.log('PASS three saved Eevee forms via native Phaser touch controls');
 }finally{
  fs.writeFileSync('test-evidence/t03-eevee-choices.json',JSON.stringify(report,null,2));
  await browser.close();server.close();
 }
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
