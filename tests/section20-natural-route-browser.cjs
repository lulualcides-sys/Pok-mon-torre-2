'use strict';
// Natural combat validation: no HP tampering, forced KOs, trainer skips,
// fabricated rewards, or battle-result shortcuts. Uses the visible AUTO UI
// and actual Phaser fight between a level-5 starter and the first trainer.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const path=require('node:path'),http=require('node:http'),{chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg',
 '.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/', 'http://127.0.0.1');
 const p=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!p.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const bytes=await fsp.readFile(p);res.writeHead(200,{'content-type':types[path.extname(p)]||'application/octet-stream'});res.end(bytes)}
 catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(ok=>server.listen(4319,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
   '--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  try{
   await page.goto('http://127.0.0.1:4319/arena2d/?original=1',
    {waitUntil:'domcontentloaded',timeout:45000});
   await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:45000});
   const opening=await page.evaluate(async()=>{
    const main=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
    const c=window.campaign=await import(new URL('./torre2/campaign-core.js',main));
    const s=c.createCampaign('bulbasaur');
    // Mewtwo is an optional fixed tester. Store through the same normal PC
    // helper so the starter fights without the powerful tester carrying it.
    c.saveCampaign(s);c.storePokemon(s,1);
    const starting={team:s.team.map(m=>({id:m.id,level:m.progression.level,hp:m.hp})),
      box:s.box.map(m=>m.id),trainer:s.trainer,wins:s.wins,
      money:s.money,stage:s.stage};
    window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
    return starting;
   });
   assert.deepEqual(opening.team,[{id:'bulbasaur',level:5,hp:100}]);
   assert.deepEqual(opening.box,['mewtwo']);
   await page.waitForFunction(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    return c.scene.isActive()&&c.__torre2BattlePath?.stage===0;
   },null,{timeout:45000});
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   const button=await page.evaluate(()=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    const zone=c.children.list.find(o=>o.input?.enabled&&o.getData?.('torre2-central-cta'));
    if(!zone)throw Error('Native route battle CTA not clickable');
    const rect=document.querySelector('#juego canvas').getBoundingClientRect();
    return {x:rect.x+zone.x*rect.width/640,y:rect.y+zone.y*rect.height/360};
   });
   await page.mouse.click(button.x,button.y);
   await page.waitForFunction(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return b.scene.isActive()&&b.fase==='lucha'&&
     b.__torre2PartyInstalled&&b.__torre2AutoMode?.zone?.active;
   },null,{timeout:60000});
   const combat=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    const c=document.querySelector('#juego canvas').getBoundingClientRect();
    const zone=b.__torre2AutoMode.zone;
    return {player:b.datos.p1,foe:b.datos.p2,
      level:b.datos.torre2.playerLevel,enemyLevel:b.datos.torre2.enemyLevel,
      auto:!!b.__torre2AutoMode.enabled,enemyHp:b.luchadores[1].hp,
      button:{x:c.x+zone.x*c.width/640,y:c.y+zone.y*c.height/360}};
   });
   assert.equal(combat.player,'bulbasaur');assert.equal(combat.foe,'pidgey');
   assert.equal(combat.auto,false);
   await page.mouse.click(combat.button.x,combat.button.y);
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').__torre2AutoMode?.enabled,
    null,{timeout:5000});
   await page.screenshot({path:'test-evidence/natural-route1-auto-active.png'});
   const started=Date.now();
   let result;
   try{
    await page.waitForFunction(()=>{
     const c=window.campaign;
     const s=c.readCampaign();
     return window.__pt2Game.scene.isActive('campanha')&&
      !!s&&(s.wins>0||s.losses>0);
    },null,{timeout:180000,polling:500});
    result=await page.evaluate(()=>{
     const s=window.campaign.readCampaign();
     return {wins:s.wins,losses:s.losses,trainer:s.trainer,stage:s.stage,
      money:s.money,team:s.team.map(m=>({id:m.id,hp:m.hp,level:m.progression.level})),
      box:s.box.map(m=>m.id)};
    });
   }catch(error){
    const state=await page.evaluate(()=>{
     const game=window.__pt2Game,b=game.scene.getScene('combate'),
      s=window.campaign.readCampaign();
     return {scene:b.scene.isActive(),phase:b.fase,
      hp:b.luchadores?.map(x=>({hp:x.hp,max:x.hpMax})),
      f:b.datos?.torre2?.party?.friend,e:b.datos?.torre2?.party?.foes,
      campaign:{trainer:s?.trainer,wins:s?.wins,losses:s?.losses}};
    });
    fs.writeFileSync('test-evidence/natural-route1-timeout.json',JSON.stringify(state,null,2));
    await page.screenshot({path:'test-evidence/natural-route1-timeout.png'});
    throw new Error('Natural AI route fight failed to resolve: '+JSON.stringify(state)+' '+String(error));
   }
   const elapsed=(Date.now()-started)/1000;
   fs.writeFileSync('test-evidence/natural-route1-result.json',JSON.stringify({
    methodology:'Real Phaser combat using AUTO click; Mewtwo moved to PC; no forced KO or result calls.',
    opening,combat:{player:combat.player,foe:combat.foe,
      level:combat.level,enemyLevel:combat.enemyLevel},result,elapsedSeconds:elapsed
   },null,2));
   assert.ok(elapsed>0,'Fight must not skip directly to result');
   assert.equal(result.wins,1,'Real solo level-5 starter should defeat first route trainer');
   assert.equal(result.trainer,1,'Normal battle advances exactly one route checkpoint');
   assert.equal(result.losses,0);
   assert.deepEqual(result.box,['mewtwo']);
   assert.equal(result.stage,0);
   assert.ok(result.money>opening.money);
   assert.deepEqual(errors,[]);
   console.log('PASS NORMAL PHASER KANTO ROUTE 1 STARTER VS PIDGEY',JSON.stringify({elapsedSeconds:elapsed,result}));
   await page.screenshot({path:'test-evidence/natural-route1-result.png'});
  }finally{await page.close()}
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
