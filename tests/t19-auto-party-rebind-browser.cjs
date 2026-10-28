'use strict';
// Runtime browser proof: after selecting a different living party member via
// the real Phaser sidebar, the optional AUTO must use a NEW native IA for
// that species. No fake damage, hit, KO, result, cooldown or game-frame skip.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg',
 '.svg':'image/svg+xml','.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1');
 const filename=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!filename.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden');}
 try{const data=await fsp.readFile(filename);res.writeHead(200,
  {'content-type':mime[path.extname(filename)]||'application/octet-stream'});res.end(data);}
 catch{res.writeHead(404);res.end('missing');}
});
const report={scope:'T19 native Auto AI changes with real party sprite selection',
 fixture:'post-Brock stage1, two Lv21 party members; no natural route progress',
 forcedWin:false,forcedKO:false,status:'starting'};
function save(){fs.mkdirSync('test-evidence',{recursive:true});
 fs.writeFileSync('test-evidence/t19-auto-rebind-party.json',JSON.stringify(report,null,2));}
(async()=>{
 save();await new Promise(done=>server.listen(4499,'127.0.0.1',done));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 let page=null;
 try{
  page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4499/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:65000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=window.t19Core=await import(new URL('./torre2/campaign-core.js',src));
   const {createPokemonProgression}=await import(new URL('./torre2/progression.js',src));
   const st=core.createCampaign('squirtle');core.saveCampaign(st);
   if(!core.storePokemon(st,1))throw Error('Expected separate QA Mewtwo in PC');
   st.stage=1;st.trainer=0;st.wins=14;st.badges=['Rocha'];
   st.team[0].id='wartortle';st.team[0].hp=100;
   st.team[0].progression=createPokemonProgression('wartortle',21);
   st.team[0].moves=[];st.team[0].tmMoves=[];
   st.team.push({id:'pikachu',uid:'t19-auto-switch-pikachu',hp:100,
    progression:createPokemonProgression('pikachu',21),status:null,tmMoves:[],moves:[]});
   st.active=0;core.saveCampaign(st);
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return c.scene.isActive()&&!!c.__torre2BattlePath;
  },null,{timeout:65000});
  await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   c.enterBattle(window.t19Core.readCampaign());
  });
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.fase==='lucha'&&
    b.__torre2PartyInstalled&&b.__torre2AutoMode?.zone?.input?.enabled&&
    b.__torre2SideParty?.slots?.[1]?.input?.enabled;
  },null,{timeout:70000});
  const tap=async(x,y)=>{
   const p=await page.evaluate(([x,y])=>{
    const rect=document.querySelector('#juego canvas').getBoundingClientRect();
    return {x:rect.x+x*rect.width/640,y:rect.y+y*rect.height/360};
   },[x,y]);
   await page.mouse.move(p.x,p.y);
   await page.mouse.down();await page.waitForTimeout(110);await page.mouse.up();
  };
  const initial=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   const a=b.__torre2AutoMode;
   window.__t19FirstAi=a.ai;window.__t19FirstActor=b.luchadores[0];
   return {species:a.autoSpecies,foe:b.datos.p2,
    party:b.datos.torre2.party.friend.map(x=>({id:x.id,hp:x.hp})),
    selected:b.datos.torre2.party.playerIndex,auto:a.enabled,brain:!!a.ai};
  });
  report.initial=initial;save();
  assert.deepEqual(initial.party.map(m=>m.id),['wartortle','pikachu']);
  assert.equal(initial.selected,0);assert.equal(initial.auto,false);
  assert.equal(initial.brain,true);
  await tap(579,146);
  await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate')
   .__torre2AutoMode?.enabled===true,null,{timeout:10000});
  await tap(34,156); // native left sidebar Pokémon slot 1, no direct state edits
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),p=b.datos?.torre2?.party;
   return b.scene.isActive()&&b.fase==='lucha'&&p?.playerIndex===1&&
    !b.__torre2Changing&&b.__torre2AutoMode?.ai!==window.__t19FirstAi&&
    b.__torre2AutoMode?.enabled===true;
  },null,{timeout:30000});
  const swapped=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),a=b.__torre2AutoMode;
   const st=window.t19Core.readCampaign();
   return {selected:b.datos.torre2.party.playerIndex,
    party:b.datos.torre2.party.friend.map(m=>({id:m.id,hp:m.hp})),
    enabled:a.enabled,brainReplaced:a.ai!==window.__t19FirstAi,
    sameActor:window.__t19FirstActor===b.luchadores[0],
    species:a.autoSpecies,liveSpecies:String(b.luchadores[0].def?.id||b.luchadores[0].dex||'')+':'+String(b.luchadores[0].etapa??0),
    wins:st.wins,trainer:st.trainer,losses:st.losses,
    cooldowns:{...b.luchadores[0].cd}};
  });
  report.swapped=swapped;save();
  assert.equal(swapped.selected,1);
  assert.equal(swapped.brainReplaced,true);
  assert.equal(swapped.sameActor,true,'Phaser party reuses original Luchador');
  assert.equal(swapped.enabled,true);
  assert.equal(swapped.species,swapped.liveSpecies);
  assert.equal(swapped.wins,14,'No fabricated route victory');
  assert.equal(swapped.trainer,0,'Switch does not move to another trainer');
  assert.deepEqual(errors,[],'No Phaser JS errors during live native swap');
  await page.screenshot({path:'test-evidence/t19-auto-rebound-after-pikachu-sendout.png'});
  report.status='success';save();
  console.log('T19 AUTO PARTY NATIVE REBIND PASS',JSON.stringify(swapped));
 }finally{
  if(page&&!page.isClosed())await page.close();
  await browser.close();await new Promise(done=>server.close(done));
 }
})().catch(error=>{console.error(error);process.exitCode=1;if(server.listening)server.close()});
