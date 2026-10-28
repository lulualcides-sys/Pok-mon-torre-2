'use strict';
// T25 original Phaser PC mobile integration: full-party swap, blocked withdraw,
// deposit, withdrawal, reload and UID stability through real canvas taps.
// Only team contents are an isolated UI fixture. Never force wins, XP, captures.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1');
 const filename=path.resolve(root,'.'+(u.pathname.endsWith('/')?
  u.pathname+'index.html':u.pathname));
 if(!filename.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const b=await fsp.readFile(filename);res.writeHead(200,
  {'content-type':mime[path.extname(filename)]||'application/octet-stream'});res.end(b)}
 catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(ok=>server.listen(4477,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:854,height:480},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const tap=async(x,y)=>{
   const point=await page.evaluate(([x,y])=>{
    const canvas=document.querySelector('#juego canvas')||document.querySelector('canvas');
    if(!canvas)throw Error('Phaser canvas not found');
    const r=canvas.getBoundingClientRect();
    return {x:r.left+x*r.width/640,y:r.top+y*r.height/360};
   },[x,y]);
   assert.ok(point.x>=0&&point.x<=854&&point.y>=0&&point.y<=480,
    'PC control outside mobile viewport');
   await page.touchscreen.tap(point.x,point.y);
  };
  const state=async()=>page.evaluate(()=>{
   const s=window.t25Core.readCampaign();
   return {team:s.team.map(m=>({uid:m.uid,id:m.id,hp:m.hp,status:m.status,
     level:m.progression?.level,tmMoves:m.tmMoves||[]})),
    box:s.box.map(m=>({uid:m.uid,id:m.id,hp:m.hp,status:m.status,
     level:m.progression?.level,tmMoves:m.tmMoves||[]})),
    active:s.active,stage:s.stage,trainer:s.trainer,wins:s.wins,losses:s.losses,
    money:s.money,badges:s.badges,tms:s.inventory.tms};
  });
  await page.goto('http://127.0.0.1:4477/arena2d/?original=1',
   {waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),
   null,{timeout:60000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=window.t25Core=await import(new URL('./torre2/campaign-core.js',src));
   const {createPokemonProgression}=await import(new URL('./torre2/progression.js',src));
   const s=core.createCampaign('bulbasaur');
   // Original Lv50 QA Mewtwo deposited via the real campaign resolver.
   core.saveCampaign(s);
   if(!core.storePokemon(s,1))throw Error('QA Mewtwo could not be stored');
   for(const [i,id]of ['squirtle','charmander','pikachu','weedle','pidgey'].entries()){
    s.team.push({id,uid:'t25-team-'+i+'-'+id,hp:65+i*5,
     progression:createPokemonProgression(id,5+i),
     status:i===2?{kind:'quemado'}:null,tmMoves:[]});
   }
   s.box.push({id:'eevee',uid:'t25-box-eevee',hp:78,
    progression:createPokemonProgression('eevee',8),
    status:null,tmMoves:['Protect']});
   core.saveCampaign(s);
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return c.scene.isActive()&&!!c.__torre2BattlePath;
  },null,{timeout:65000});
  const before=await state();
  assert.equal(before.team.length,6);assert.equal(before.box.length,2);
  assert.equal(new Set([...before.team,...before.box].map(m=>m.uid)).size,8);
  const openPc=async()=>{
   await page.evaluate(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    c.centerScreen(window.t25Core.readCampaign());
   });
   const target=await page.evaluate(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    const z=c.children.list.find(o=>o.active&&o.input?.enabled&&
     o.getData?.('torre2-center-pc')===true);
    if(!z)throw Error('Native Center PC button not interactive');
    return {x:z.x,y:z.y};
   });
   await tap(target.x,target.y);
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')
    .children.list.some(o=>typeof o.text==='string'&&o.text.includes('ARMAZENAMENTO')),
    null,{timeout:9000});
  };
  await openPc();
  await page.screenshot({path:'test-evidence/t25-mobile-pc-full-team.png'});
  // Team full -> first right member swaps ONLY with selected left member.
  await tap(164,79);await tap(466,79);
  const swapped=await state();
  assert.equal(swapped.team.length,6);
  assert.equal(swapped.box.length,2);
  assert.equal(swapped.team[0].uid,before.box[0].uid);
  assert.equal(swapped.box[0].uid,before.team[0].uid);
  assert.deepEqual(swapped.box[0].tmMoves,before.team[0].tmMoves);
  const afterSwap=JSON.stringify(swapped);
  await tap(466,79);
  assert.equal(JSON.stringify(await state()),afterSwap,
   'Clicking PC member with full unselected team must not duplicate Pokémon');
  // Store the second party member; then withdraw first PC member with a real tap.
  await tap(164,113);await tap(121,310);
  const stored=await state();
  assert.equal(stored.team.length,5);
  assert.equal(stored.box.length,3);
  assert.ok(stored.box.some(m=>m.uid===swapped.team[1].uid));
  await tap(466,79);
  const withdrawn=await state();
  assert.equal(withdrawn.team.length,6);
  assert.equal(withdrawn.box.length,2);
  assert.equal(withdrawn.team.at(-1).uid,swapped.box[0].uid);
  assert.equal(new Set([...withdrawn.team,...withdrawn.box].map(m=>m.uid)).size,8,
   'PC operations duplicated or lost a UID');
  assert.deepEqual([...withdrawn.team,...withdrawn.box].map(x=>x.uid).sort(),
   [...before.team,...before.box].map(x=>x.uid).sort(),
   'PC must conserve precisely the original eight Pokémon');
  for(const k of ['stage','trainer','wins','losses','money','badges','tms'])
   assert.deepEqual(withdrawn[k],before[k],'PC modified campaign progress or economy '+k);
  await page.screenshot({path:'test-evidence/t25-mobile-pc-after-operations.png'});
  // Load from localStorage in another page lifecycle; clicks are not enough
  // unless the persisted save retains all eight identities and team order.
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),
   null,{timeout:65000});
  const final=await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=window.t25Core=await import(new URL('./torre2/campaign-core.js',src));
   const s=core.readCampaign();
   const single=core.createCampaign('bulbasaur');
   // Last-member restriction should fail without mutating persisted save.
   single.team=single.team.slice(0,1);
   if(core.storePokemon(single,0)!==false)throw Error('Stored the final party member');
   return {team:s.team.map(m=>m.uid),box:s.box.map(m=>m.uid),
    money:s.money,stage:s.stage,wins:s.wins,
    all:new Set([...s.team,...s.box].map(m=>m.uid)).size};
  });
  assert.deepEqual(final.team,withdrawn.team.map(m=>m.uid));
  assert.deepEqual(final.box,withdrawn.box.map(m=>m.uid));
  assert.equal(final.all,8);
  assert.equal(final.money,before.money);
  assert.deepEqual(errors,[],'PC mobile Phaser errors');
  fs.writeFileSync('test-evidence/t25-mobile-pc-transactions.json',
   JSON.stringify({fixture:'full team + two PC members, isolated browser',
    noNaturalCaptures:true,before,swapped,stored,withdrawn,final},null,2));
  console.log('T25 NATIVE MOBILE PC PASS',JSON.stringify({
   team:final.team,box:final.box,kept:final.all,unchangedEconomy:true
  }));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
