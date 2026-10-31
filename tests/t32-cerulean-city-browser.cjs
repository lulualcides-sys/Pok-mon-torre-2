'use strict';
/* T32: native mouse/touch Cerulean map preview; state fixture only chooses stage.
 * No fake wins, item edits, XP grants or altered Arena HUD. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp',
 '.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1');
 const p=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!p.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const b=await fsp.readFile(p);res.writeHead(200,
  {'content-type':mime[path.extname(p)]||'application/octet-stream'});res.end(b)}
 catch{res.writeHead(404);res.end('missing')}
});
const screenshot='test-evidence';
fs.mkdirSync(screenshot,{recursive:true});
(async()=>{
 await new Promise(ok=>server.listen(4496,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  for(const [label,size]of [['desktop',{width:1280,height:720}],
   ['mobile',{width:854,height:480}]]){
   const page=await browser.newPage({viewport:size,hasTouch:label==='mobile'});
   const errors=[];page.on('pageerror',e=>errors.push(String(e)));
   async function tap(x,y){
    const position=await page.evaluate(([x,y])=>{
     const r=document.querySelector('#juego canvas').getBoundingClientRect();
     return {x:r.x+x*r.width/640,y:r.y+y*r.height/360};
    },[x,y]);
    if(label==='mobile')await page.touchscreen.tap(position.x,position.y);
    else{
     // Phaser's pointer manager samples mouse.down on a game frame.
     // Zero-duration Playwright click can entirely miss native pointerdown.
     await page.mouse.move(position.x,position.y);
     await page.mouse.down();await page.waitForTimeout(110);await page.mouse.up();
    }
   }
   async function named(tag,label){
    const xy=await page.evaluate(({tag,label})=>{
     const scene=window.__pt2Game.scene.getScene('campanha');
     const obj=scene.children.list.find(z=>z.active&&z.input?.enabled&&
      z.getData?.(tag)===label);
     if(!obj)throw Error('Missing native button '+tag+': '+label);
     return [obj.x,obj.y];
    },{tag,label});
    await tap(xy[0],xy[1]);
   }
   try{
    await page.goto('http://127.0.0.1:4496/arena2d/?original=1',
     {waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),
     null,{timeout:60000});
    await page.evaluate(async()=>{
     const main=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
     const core=await import(new URL('./torre2/campaign-core.js',main));
     const s=core.createCampaign('bulbasaur');
     core.storePokemon(s,1); // Mewtwo lab tester belongs in PC, not the visual fixture.
     s.stage=1;s.trainer=1; // VISUAL FIXTURE only: no earned progress claimed.
     core.saveCampaign(s);
     window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
    });
    await page.waitForFunction(()=>{
     const c=window.__pt2Game.scene.getScene('campanha');
     return c.scene.isActive()&&c.__torre2BattlePath?.stage===1;
    },null,{timeout:60000});
    const before=await page.evaluate(()=>localStorage.getItem('pokemon-torre-2-kanto-campaign-v1'));
    assert.ok(before);
    const old=JSON.parse(before);
    assert.equal(old.wins,0);assert.equal(old.stage,1);assert.equal(old.trainer,1);
    const open=await page.evaluate(()=>{
     const c=window.__pt2Game.scene.getScene('campanha');
     const zone=c.children.list.find(o=>o.active&&
      o.getData?.('torre2-open-cerulean-city')===true);
     return zone?[zone.x,zone.y]:null;
    });
    assert.ok(open,'Path must provide a distinct city button');
    await tap(open[0],open[1]);
    await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')
     .__torre2CeruleanCity?.realArt===true,null,{timeout:18000});
    const ui=await page.evaluate(()=>{
     const c=window.__pt2Game.scene.getScene('campanha'),x=c.__torre2CeruleanCity;
     return {stage:x.stage,trainer:x.trainer,art:x.realArt,
      hotspots:x.hotspots.map(z=>z.id),
      views:c.children.list.filter(z=>z.getData?.('torre2-city-real-art')===true).length,
      playerCount:c.children.list.filter(z=>z.getData?.('torre2-city-player')===true).length,
      controls:c.children.list.filter(z=>z.getData?.('torre2-city-action'))
       .map(z=>z.getData('torre2-city-action')),
      partySlots:c.children.list.filter(z=>z.getData?.('torre2-city-party-slot')!==undefined)
       .map(z=>({index:z.getData('torre2-city-party-slot'),right:z.x+z.width/2})),
      firstActionLeft:Math.min(...c.children.list.filter(z=>
       z.getData?.('torre2-city-action')).map(z=>z.x-z.width/2)),
      battleHudUnchanged:x.battleHudUnchanged};
    });
    assert.equal(ui.stage,1);assert.equal(ui.trainer,1);assert.equal(ui.art,true);
    assert.equal(ui.views,1,'Use original cached texture only once');
    assert.equal(ui.playerCount,1,'City must render one native FireRed player sprite');
    assert.equal(ui.battleHudUnchanged,true);
    assert.deepEqual(ui.partySlots.map(z=>z.index),[0,1,2,3,4,5]);
    assert.ok(ui.partySlots[5].right+8<=ui.firstActionLeft,
     'Six party cards must not overlap native city controls');
    for(const name of ['center','mart','gym','bike'])
     assert.ok(ui.hotspots.includes(name),'Missing city building: '+name);
    for(const name of ['DESAFIOS','EQUIPE','BOLSA','CAPTURA','CENTRO','PRÓXIMO DESAFIO'])
     assert.ok(ui.controls.includes(name),'Missing playable action '+name);
    await page.screenshot({path:screenshot+'/t32-cerulean-'+label+'.png'});
    await named('torre2-city-action','DESAFIOS');
    // A native Phaser pointer can miss one press on headless SwiftShader.
    // Inspect the real scene and retry the same visible button at most once;
    // never invoke the back handler or fabricate route state from the test.
    let returned=await page.waitForFunction(()=>
     window.__pt2Game.scene.getScene('campanha').__torre2BattlePath?.stage===1,
     null,{timeout:4000}).then(()=>true).catch(()=>false);
    if(!returned){
     const diagnostic=await page.evaluate(()=>{
      const c=window.__pt2Game.scene.getScene('campanha');
      return {cityOpen:c.__torre2CeruleanOpen,
       cityData:c.__torre2CeruleanCity?.stage,
       routeStage:c.__torre2BattlePath?.stage,
       active:c.scene.isActive(),
       buttons:c.children.list.filter(z=>z.active&&z.input?.enabled&&
        z.getData?.('torre2-city-action')).map(z=>({
         label:z.getData('torre2-city-action'),x:z.x,y:z.y,depth:z.depth}))};
     });
     console.log('T32 native route-return diagnostic',JSON.stringify(diagnostic),
      'pageerrors',JSON.stringify(errors));
     assert.ok(diagnostic.cityOpen&&diagnostic.buttons.some(z=>z.label==='DESAFIOS'),
      'Route not restored and native DESAFIOS control is no longer available');
     await named('torre2-city-action','DESAFIOS');
     returned=await page.waitForFunction(()=>
      window.__pt2Game.scene.getScene('campanha').__torre2BattlePath?.stage===1,
      null,{timeout:12000}).then(()=>true).catch(()=>false);
    }
    assert.ok(returned,'DESAFIOS native pointer did not restore campaign route');
    assert.equal(await page.evaluate(()=>
     localStorage.getItem('pokemon-torre-2-kanto-campaign-v1')),before,
     'Exploring the city must not create wins, badges, experience or save edits');
    await tap(open[0],open[1]);
    await page.waitForFunction(()=>{
     const c=window.__pt2Game.scene.getScene('campanha');
     return c.__torre2BattlePath===null&&c.__torre2CeruleanCity?.realArt===true&&
      c.children.list.some(x=>x.input?.enabled&&
       x.getData?.('torre2-city-landmark')==='CENTRO');
    },null,{timeout:16000});
    await named('torre2-city-landmark','CENTRO');
    // A missed native mouse press can be retried only while the actual city
    // interaction zone still exists; never call Center's handler directly.
    let centerOpened=await page.waitForFunction(()=>
     window.__pt2Game.scene.getScene('campanha').children.list.some(x=>
      typeof x.text==='string'&&x.text.includes('CENTRO POKÉMON')),
     null,{timeout:4500}).then(()=>true).catch(()=>false);
    if(!centerOpened){
     const stillCity=await page.evaluate(()=>{
      const c=window.__pt2Game.scene.getScene('campanha');
      return c.children.list.some(x=>x.active&&x.input?.enabled&&
       x.getData?.('torre2-city-landmark')==='CENTRO');
     });
     assert.ok(stillCity,'No native center hotspot remains after missed click');
     await named('torre2-city-landmark','CENTRO');
     centerOpened=await page.waitForFunction(()=>
      window.__pt2Game.scene.getScene('campanha').children.list.some(x=>
       typeof x.text==='string'&&x.text.includes('CENTRO POKÉMON')),
      null,{timeout:8000}).then(()=>true).catch(()=>false);
    }
    assert.ok(centerOpened,'Clicking building did not open the native Center');
    assert.equal(await page.evaluate(()=>
     localStorage.getItem('pokemon-torre-2-kanto-campaign-v1')),before,
     'Entering Center display without healing must not modify saves');
    assert.deepEqual(errors,[],'Browser JS errors');
    console.log('PASS T32 CERULEAN NATIVE CITY '+label,JSON.stringify(ui));
   }finally{await page.close()}
  }
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
