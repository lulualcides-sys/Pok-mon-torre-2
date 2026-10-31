'use strict';
// Real Phaser/WebGL battle, mobile ESP touch plus genuine party-switch handler.
// A prepared two-Pokémon roster is a fixture, not a captured/earned campaign.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site'),port=4673;
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg',
 '.svg':'image/svg+xml','.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1:'+port);
 const file=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const data=await fs.readFile(file);res.writeHead(200,
  {'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(data)}
 catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 await new Promise(done=>server.listen(port,'127.0.0.1',done));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 let page;
 try{
  page=await browser.newPage({viewport:{width:854,height:480},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',err=>errors.push(String(err)));
  await page.goto('http://127.0.0.1:'+port+'/arena2d/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),
   null,{timeout:65000});
  await page.evaluate(async()=>{
   const main=[...document.scripts].find(x=>x.src?.includes('/main.js'))?.src;
   if(!main)throw Error('Original Phaser source not found');
   const core=window.__dodgeCore=await import(new URL('./torre2/campaign-core.js',main));
   const state=core.createPlayerCampaign('bulbasaur');
   const a=state.team[0];
   a.id='abra';a.progression.species='abra';a.progression.level=15;a.hp=100;
   const b=structuredClone(a);b.id='geodude';b.uid='native-test-geodude';
   b.progression={...a.progression,species:'geodude'};
   state.team=[a,b];state.active=0;
   core.saveCampaign(state);
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
   !!window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,null,{timeout:60000});
  await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   const state=window.__dodgeCore.readCampaign();
   c.enterBattle(state,false);
  });
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.__torre2PartyInstalled&&b.fase==='lucha'&&
    !!b.panelTactil?.botones.find(x=>x.slot==='esp');
  },null,{timeout:75000});
  const before=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),me=b.luchadores[0];
   b.__torre2AutoMode.enabled=false;
   me.inmortal=true;b.luchadores[1].inmortal=true;
   b.controles[1].leer=()=>({mx:0,my:0});
   me.cd.esp=0;me.energia=100;me.accion=null;me.dash=null;
   me.est={};me.dolorHasta=-1;me.ultimoAtaque=-100;
   return {pokemon:b.datos.torre2.party.friend[0].id,esp:me.kit.esp?.nombre,
    original:b.datos.torre2.party.friend[0].loadout.esp?.nombre,
    native:me.kit.esp?.torre2CampaignNativeEvasion,
    uses:me.stats.usosSlot?.esp||0,save:localStorage.getItem(window.__dodgeCore.SAVE_KEY)};
  });
  assert.equal(before.pokemon,'abra');
  assert.equal(before.esp,before.original);
  assert.notEqual(before.esp,'Dodge','Real Abra native ESP must be installed');
  assert.equal(before.native,true,'Campaign must use original native ESP object');
  await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),p=b.panelTactil;
   const button=p.botones.find(v=>v.slot==='esp');
   const pos=p.pos(button),origin=p.punto({x:0,y:0}),unit=p.punto({x:1,y:1});
   const touch={id:97,x:(pos.x-origin.x)/(unit.x-origin.x),
    y:(pos.y-origin.y)/(unit.y-origin.y)};
   p.abajo(touch);
   if(b.luchadores[0].kit.esp?.alPunto){
    p.mover({...touch,x:touch.x+40/(unit.x-origin.x),
     y:touch.y-22/(unit.y-origin.y)});
    p.arriba({id:97});
   }
   p.leer(v=>({ax:v.x,ay:v.y}));
  });
  await page.waitForTimeout(600);
  const used=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),me=b.luchadores[0];
   b.panelTactil.arriba({id:97});
   return {uses:me.stats.usosSlot?.esp||0,cd:me.cd.esp,
    native:me.kit.esp.torre2CampaignNativeEvasion};
  });
  assert.ok(used.uses>before.uses||used.cd>0,
   'Native ESP must actually cast, not just update metadata');
  const partyBefore=await page.evaluate(()=>window.__pt2Game.scene.getScene('combate')
   .__torre2PlayerSwitches);
  // Actual second-reserve touch target from native Phaser side panel.
  const point=await page.evaluate(()=>{
   const rect=document.querySelector('#juego canvas').getBoundingClientRect();
   const slot=window.__pt2Game.scene.getScene('combate').__torre2SideParty.slots[1];
   return {x:rect.left+slot.x*rect.width/640,y:rect.top+slot.y*rect.height/360};
  });
  await page.touchscreen.tap(point.x,point.y);
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.__torre2PlayerSwitches>=1&&!b.__torre2Changing&&
    b.datos.torre2.party.playerIndex===1&&b.fase==='lucha';
  },null,{timeout:45000});
  const swapped=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),me=b.luchadores[0];
   return {species:b.datos.torre2.party.friend[1].id,
    loaded:me.kit.esp?.nombre,expected:b.datos.torre2.party.friend[1].loadout.esp?.nombre,
    native:me.kit.esp?.torre2CampaignNativeEvasion,
    switches:b.__torre2PlayerSwitches,
    saved:localStorage.getItem(window.__dodgeCore.SAVE_KEY)};
  });
  assert.equal(swapped.species,'geodude');
  assert.equal(swapped.loaded,'Rollout');
  assert.equal(swapped.expected,'Rollout');
  assert.equal(swapped.native,true);
  assert.equal(swapped.switches,partyBefore+1);
  assert.equal(swapped.saved,before.save,'Test should not write rewards to campaign');
  assert.deepEqual(errors,[]);
  await fs.mkdir('test-evidence',{recursive:true});
  await page.screenshot({path:'test-evidence/t13-campaign-native-esp-mobile.png'});
  console.log('PASS_T13_CAMPAIGN_NATIVE_ESP_TOUCH_SWAP',JSON.stringify({
   mode:'prepared roster fixture / real native ESP touch and swap',
   before:{pokemon:before.pokemon,esp:before.esp,native:before.native},
   used,swapped:{species:swapped.species,esp:swapped.loaded,
    switches:swapped.switches},errors
  }));
 }finally{if(page&&!page.isClosed())await page.close();await browser.close();
  await new Promise(done=>server.close(done));}
})().catch(e=>{console.error(e);process.exitCode=1;if(server.listening)server.close()});
