'use strict';
// Genuine Phaser/Chromium section 20 regression. KO is forced only to test
// opponent sendout; NOT evidence of winning Kanto through normal gameplay.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp',
 '.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/', 'http://127.0.0.1');
 const f=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!f.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const data=await fs.readFile(f);res.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});res.end(data)}
 catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 await new Promise(r=>server.listen(4313,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
   '--use-gl=angle','--use-angle=swiftshader']});
 try{
  for(const [label,viewport]of [['desktop',{width:1280,height:720}],['mobile',{width:854,height:480}]]){
   const page=await browser.newPage({viewport,hasTouch:label==='mobile'}),errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   await page.goto('http://127.0.0.1:4313/arena2d/?original=1',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:45000});
   await page.evaluate(async()=>{
    const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
    window.sectionCore=await import(new URL('./torre2/campaign-core.js',src));
    const s=sectionCore.createCampaign('squirtle');
    s.team.forEach(m=>m.hp=0);
    sectionCore.saveCampaign(s);
    window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
   });
   await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
    window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,null,{timeout:45000});
   // Real game UI method enters Center, never launches a fainted actor.
   await page.evaluate(()=>{
    const s=sectionCore.readCampaign();
    window.__pt2Game.scene.getScene('campanha').enterBattle(s);
   });
   const blocked=await page.evaluate(()=>{
    const s=sectionCore.readCampaign(),c=window.__pt2Game.scene.getScene('campanha');
    return {battle:window.__pt2Game.scene.isActive('combate'),center:
      c.children.list.some(o=>typeof o.text==='string'&&o.text.includes('CENTRO POKÉMON')),
     fainted:s.team.every(m=>m.hp===0),stage:s.stage,trainer:s.trainer,wins:s.wins};
   });
   assert.equal(blocked.battle,false,'KO team cannot start battle');
   assert.equal(blocked.center,true,'KO team is offered the real Center');
   assert.equal(blocked.fainted,true);assert.equal(blocked.trainer,0);
   assert.equal(blocked.wins,0);
   await page.screenshot({path:'test-evidence/section20-ko-center-'+label+'.png'});
   // Use the Center's existing save authority, then test the more important
   // damaged-active / conscious-reserve transition against Brock.
   await page.evaluate(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    const s=sectionCore.readCampaign();
    sectionCore.healTeam(s);
    s.trainer=sectionCore.TRAINERS_PER_GYM(0);
    s.active=0;s.team[0].hp=0;s.team[1].hp=57;
    sectionCore.saveCampaign(s);
    c.renderCampaign(s);
    c.enterBattle(s);
   });
   await page.waitForFunction(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return b.scene.isActive()&&b.__torre2PartyInstalled&&b.fase==='lucha';
   },null,{timeout:60000});
   const start=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate'),s=sectionCore.readCampaign();
    b.controles.forEach(c=>{c.leer=()=>null});
    b.__torre2TrainerStrategy.enabled=false;
    return {active:s.active,roster:b.datos.torre2.party.friend.map(x=>({id:x.id,hp:x.hp})),
     seen:[...s.dexSeen],enemy:b.datos.p2,enemyIndex:b.datos.torre2.party.enemyIndex};
   });
   assert.equal(start.active,1,'healthy Mewtwo must enter when starter is KO');
   assert.equal(start.roster[0].hp,0,'KO starter stays KO');
   assert.equal(start.roster[1].hp,57,'Mewtwo starts at actual saved HP');
   assert.equal(start.enemy,'geodude');
   assert.ok(start.seen.includes('geodude'));
   assert.ok(!start.seen.includes('onix'),'unseen ace cannot appear in dex early');
   await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    b.luchadores[1].hp=0;b.alKO(b.luchadores[1]);
   });
   await page.waitForFunction(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    const s=window.sectionCore.readCampaign();
    return b.scene.isActive()&&b.fase==='lucha'&&!b.__torre2Changing&&
     b.datos.torre2.party.enemyIndex===1&&s.dexSeen.includes('onix');
   },null,{timeout:45000});
   const switched=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate'),s=sectionCore.readCampaign();
    return {enemy:b.datos.p2,texture:b.luchadores[1].spr.texture.key,
     stage:s.stage,trainer:s.trainer,wins:s.wins,seen:s.dexSeen,
     active:s.active,team:s.team.map(p=>({id:p.id,hp:p.hp}))};
   });
   assert.equal(switched.enemy,'onix');
   assert.ok(switched.texture.startsWith('pmd-'));
   assert.equal(switched.stage,0);
   assert.equal(switched.trainer,13);
   assert.equal(switched.wins,0,'just seeing ace is not winning gym');
   assert.deepEqual(errors,[]);
   await page.screenshot({path:'test-evidence/section20-brock-actual-seen-'+label+'.png'});
   await page.close();
   console.log('PASS section 20',label,'KO gate, healthy reserve, first Geodude and Seen Onix after real Phaser sendout');
  }
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
