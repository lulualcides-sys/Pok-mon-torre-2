'use strict';
// T02: live mobile tap regression for Arena FIGHT and campaign BAG / POKEMON.
// Team selection in campaign is an explicit UI test fixture: no trainer
// victories, levels, currency, capture RNG or player-owned saves are altered.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg',
 '.ogg':'audio/ogg','.mp3':'audio/mpeg','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/', 'http://127.0.0.1:4347');
 const name=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!name.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const bytes=await fsp.readFile(name);res.writeHead(200,{'content-type':mime[path.extname(name)]||'application/octet-stream'});res.end(bytes)}
 catch{res.writeHead(404);res.end('missing')}
});
const launch={executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
 headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
  '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']};
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(ok=>server.listen(4347,'127.0.0.1',ok));
 const browser=await chromium.launch(launch);
 const report={scope:'T02: touchscreen FIGHT, BAG modal and Pokemon swap',
  method:'Actual Phaser canvas touchscreen taps in 854x480 mobile viewport',
  testFixture:'second starter (Squirtle) inserted only into isolated browser localStorage',arena:{},campaign:{}};
 const save=()=>fs.writeFileSync('test-evidence/t02-mobile-menu-journey.json',JSON.stringify(report,null,2));
 const newPage=()=>browser.newPage({viewport:{width:854,height:480},hasTouch:true,isMobile:true});
 const tapAt=async(page,x,y)=>page.touchscreen.tap(x,y);
 const tapNative=async(page,x,y)=>{
  const p=await page.evaluate(([x,y])=>{
   const el=document.querySelector('#juego canvas')||document.querySelector('canvas');
   const box=el.getBoundingClientRect();
   return {x:box.left+x*box.width/640,y:box.top+y*box.height/360,
    width:box.width,height:box.height}
  },[x,y]);
  assert.ok(p.x>=0&&p.x<=854&&p.y>=0&&p.y<=480,'Mobile control must fit visible viewport');
  await tapAt(page,p.x,p.y);
  return p;
 };
 try{
  // 1: Fight is an actual native touchscreen control in Arena preparation.
  {
   const page=await newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   try{
    await page.goto('http://127.0.0.1:4347/arena2d/?original=1',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__pt2Started&&window.__pt2Game?.scene.isActive('titulo'),null,{timeout:50000});
    await page.evaluate(()=>{
     window.__pt2Game.scene.getScene('titulo').scene.start('preparar',{
      previo:{jugadores:['bulbasaur','porygon','psyduck','doduo','lickitung','dratini']
       .map((id,i)=>({id,disp:i?'cpu':'kbm'}))}
     });
    });
    await page.waitForFunction(()=>{
     const s=window.__pt2Game.scene.getScene('preparar');
     return s.scene.isActive()&&s.tarjetas?.length===6&&
      s.tarjetas.every(t=>t.contenido?.list.some(o=>o.type==='Sprite'&&
       o.texture?.key.startsWith('pmd-')&&o.anims?.currentAnim));
    },null,{timeout:60000});
    const fight=await page.evaluate(()=>{
     const s=window.__pt2Game.scene.getScene('preparar');
     return {x:s.posLuchar?.x,y:s.posLuchar?.y,
      previews:s.tarjetas.length};
    });
    assert.ok(Number.isFinite(fight.x)&&Number.isFinite(fight.y),'FIGHT position must exist');
    report.arena.fight={...fight,tap:await tapNative(page,fight.x,fight.y)};
    await page.waitForFunction(()=>{
     const s=window.__pt2Game.scene.getScene('batalla');
     return s.scene.isActive()&&s.luchadores?.length===6&&
      s.luchadores.every(a=>a.spr?.texture?.key.startsWith('pmd-'));
    },null,{timeout:45000});
    report.arena.battleStarted=true;
    await page.screenshot({path:'test-evidence/t02-mobile-arena-fight.png'});
    assert.deepEqual(errors,[],'Arena FIGHT causes no Javascript errors');
    console.log('T02 PASS NATIVE MOBILE FIGHT',JSON.stringify(report.arena));
   }finally{await page.close()}
  }
  // 2: Campaign BAG overlay closes without spending anything, and side
  // Pokémon slot changes the native fighter via the REAL touch hitzone.
  {
   const page=await newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   try{
    await page.goto('http://127.0.0.1:4347/arena2d/?original=1',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:50000});
    await page.evaluate(async()=>{
     const src=[...document.scripts].find(x=>x.src?.includes('/main.js')).src;
     const core=window.t02Core=await import(new URL('./torre2/campaign-core.js',src));
     const s=core.createCampaign('bulbasaur');
     // Explicit test-only save with ordinary level-five Squirtle instead of
     // the built-in level-fifty lab Mewtwo. Never stored in another browser.
     core.storePokemon(s,1); // Keep the permanent lab Mewtwo safely in PC.
     s.team.push(core.createCampaign('squirtle').team[0]);
     core.saveCampaign(s);
     window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
    });
    await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
     !!window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,null,{timeout:50000});
    const button=await page.evaluate(()=>{
     const c=window.__pt2Game.scene.getScene('campanha');
     const z=c.children.list.find(o=>o.active&&o.input?.enabled&&
      o.getData?.('torre2-central-cta')===true);
     if(!z)throw Error('Campaign battle entry button missing');
     return {x:z.x,y:z.y};
    });
    await tapNative(page,button.x,button.y);
    await page.waitForFunction(()=>{
     const b=window.__pt2Game.scene.getScene('combate');
     return b.scene.isActive()&&b.fase==='lucha'&&
      b.__torre2PartyInstalled&&b.__torre2BattleBag?.trigger?.active&&
      b.__torre2SideParty?.slots?.[1]?.input?.enabled;
    },null,{timeout:65000});
    // Immobilizing enemies only prevents the independent CPU from ending
    // this UI-only test; no rewards, HP or result are fabricated.
    const state=await page.evaluate(()=>{
     const b=window.__pt2Game.scene.getScene('combate');
     b.luchadores.forEach(a=>{a.inmortal=true;});
     return {party:b.datos.torre2.party.friend.map(m=>m.id),
      stored:window.t02Core.readCampaign().inventory,
      active:b.datos.p1,stage:window.t02Core.readCampaign().stage,
      trainer:window.t02Core.readCampaign().trainer,
      wins:window.t02Core.readCampaign().wins};
    });
    assert.deepEqual(state.party,['bulbasaur','squirtle']);
    report.campaign.before=state;
    await tapNative(page,565,92);
    await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').__torre2BattleBagOpen===true,null,{timeout:6000});
    report.campaign.bagOpened=true;
    await page.screenshot({path:'test-evidence/t02-mobile-bag-open.png'});
    const back=await page.evaluate(()=>{
     const b=window.__pt2Game.scene.getScene('combate');
     const z=b.children.list.find(o=>o.active&&o.input?.enabled&&o.getData?.('torre2-battle-bag-back')===true);
     if(!z)throw Error('BAG back button missing');
     return {x:z.x,y:z.y};
    });
    await tapNative(page,back.x,back.y);
    await page.waitForFunction(()=>window.__pt2Game.scene.getScene('combate').__torre2BattleBagOpen===false,null,{timeout:6000});
    report.campaign.bagClosed=true;
    const choice=await page.evaluate(()=>{
     const b=window.__pt2Game.scene.getScene('combate');
     const z=b.__torre2SideParty.slots[1];
     return {x:z.x,y:z.y};
    });
    await tapNative(page,choice.x,choice.y);
    await page.waitForFunction(()=>{
     const b=window.__pt2Game.scene.getScene('combate');
     return b.datos.torre2.party.playerIndex===1&&
      b.datos.p1==='squirtle'&&!b.__torre2Changing;
    },null,{timeout:25000});
    const after=await page.evaluate(()=>{
     const b=window.__pt2Game.scene.getScene('combate');
     const c=window.t02Core.readCampaign();
     return {active:b.datos.p1,index:b.datos.torre2.party.playerIndex,
      displayed:b.luchadores[0].def.id,stocks:c.inventory,
      wins:c.wins,stage:c.stage,trainer:c.trainer};
    });
    assert.equal(after.active,'squirtle');
    assert.equal(after.index,1);
    assert.deepEqual(after.stocks,state.stored,'Opening BAG cannot consume items');
    assert.equal(after.wins,0,'Switching must not force wins');
    assert.equal(after.stage,0);assert.equal(after.trainer,0);
    report.campaign.after=after;
    await page.screenshot({path:'test-evidence/t02-mobile-pokemon-switch.png'});
    assert.deepEqual(errors,[],'No mobile UI Javascript exceptions');
    console.log('T02 PASS MOBILE BAG AND POKEMON SWITCH',JSON.stringify(report.campaign));
   }finally{await page.close()}
  }
 }finally{save();await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
