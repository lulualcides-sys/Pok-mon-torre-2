'use strict';
/* T46: real Phaser/WebGL screenshots of approved maps; controlled starter fixture,
 * never proof of naturally completed gyms, saves or trainer wins.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const out=path.resolve('test-evidence/visual-guard');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 let name;
 try{name=decodeURIComponent(new URL(req.url||'/','http://127.0.0.1').pathname)}
 catch{res.writeHead(400);return res.end('bad url')}
 const file=path.resolve(root,'.'+(name.endsWith('/')?name+'index.html':name));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const b=await fs.readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(b)}
 catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const evidence={ok:false,source:'real-Phaser-Chromium',
  fixture:'controlled stage-one state for screenshots; NOT natural story progress',
  maps:[],errors:[]};
 let browser;
 try{
  await new Promise((yes,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',yes)});
  browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
   headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
    '--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist']});
  for(const mode of [{name:'desktop',width:1280,height:720,isMobile:false},
                     {name:'mobile',width:844,height:390,isMobile:true}]){
   const page=await browser.newPage({viewport:{width:mode.width,height:mode.height},
    deviceScaleFactor:1,isMobile:mode.isMobile,hasTouch:mode.isMobile});
   page.on('pageerror',e=>evidence.errors.push(String(e).slice(0,500)));
   await page.goto('http://127.0.0.1:'+server.address().port+'/arena2d/?original=1',
    {waitUntil:'domcontentloaded',timeout:45000});
   await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo')&&
    document.querySelector('#juego canvas'),null,{timeout:55000});
   await page.evaluate(async()=>{
    const main=[...document.scripts].find(s=>s.src?.includes('/main.js'))?.src;
    if(!main)throw Error('Native main module absent');
    const core=await import(new URL('./torre2/campaign-core.js',main));
    window.kanto=core;
    const fixture=core.createPlayerCampaign('bulbasaur');
    fixture.stage=1; // controlled Cerulean fixture: stage zero stays in Pallet-safe fallback
    core.saveCampaign(fixture);
    window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
   });
   // Stage 1 after Brock must begin on Route 3, not jump to Cerulean.
   await page.waitForFunction(()=>{
    const game=window.__pt2Game,scene=game?.scene.getScene('campanha');
    return game?.scene.isActive('campanha')&&
     scene?.__torre2ApprovedMapView?.id==='route-3';
   },null,{timeout:50000});
   const beforeChain=await page.evaluate(()=>JSON.stringify(window.kanto.readCampaign()));
   await page.screenshot({path:path.join(out,
    't61-approved-route-3-'+mode.name+'.png'),fullPage:true,animations:'disabled'});
   const routeChain=[
    ['route-3','route4','route-4-west'],
    ['route-4-west','moon','mt-moon'],
    ['mt-moon','exit','route-4-east'],
    ['route-4-east','cerulean','cerulean-city']
   ];
   for(const [from,sign,to] of routeChain){
    const src=await page.evaluate(([id,hotspot])=>{
     const scene=window.__pt2Game.scene.getScene('campanha'),
      view=scene.__torre2ApprovedMapView;
     if(view?.id!==id)throw Error('Wrong route view: '+view?.id+' expected '+id);
     const zone=view.zones.find(z=>z.getData?.('torre2-approved-hotspot')===id+':'+hotspot);
     if(!zone)throw Error('Missing real Phaser sign '+id+':'+hotspot);
     const rect=document.querySelector('#juego canvas').getBoundingClientRect();
     // Phaser preserves 16:9 inside the phone's wider viewport. The canvas
     // bounding box may include side letterboxes (844x390 -> ~693x390).
     const drawWidth=Math.min(rect.width,rect.height*640/360);
     const drawHeight=Math.min(rect.height,rect.width*360/640);
     const left=rect.x+(rect.width-drawWidth)/2;
     const top=rect.y+(rect.height-drawHeight)/2;
     return {x:left+(zone.x/640)*drawWidth,
      y:top+(zone.y/360)*drawHeight,texture:view.image.texture.key};
    },[from,sign]);
    assert.equal(src.texture,'torre2-approved-map-'+from);
    if(mode.isMobile)await page.touchscreen.tap(src.x,src.y);
    else await page.mouse.click(src.x,src.y);
    await page.waitForFunction(expected=>
     window.__pt2Game.scene.getScene('campanha')
      ?.__torre2ApprovedMapView?.id===expected,to,{timeout:25000});
    assert.equal(await page.evaluate(()=>JSON.stringify(window.kanto.readCampaign())),
     beforeChain,'Navigating '+from+'->'+to+' unexpectedly changed campaign save');
    const filename='t61-approved-'+to+'-'+mode.name+'.png';
    await page.screenshot({path:path.join(out,filename),fullPage:true,animations:'disabled'});
    evidence.maps.push({id:to,mode:mode.name,via:'real Phaser sign mouse/touch',
     from,sign,saveUnchanged:true,screenshot:filename});
   }
   for(const id of ['route-2','pewter-city','gym-brock','cerulean-city','gym-misty']){
    const info=await page.evaluate(async id=>{
     const game=window.__pt2Game,scene=game.scene.getScene('campanha');
     const main=[...document.scripts].find(s=>s.src?.includes('/main.js'))?.src;
     const atlas=await import(new URL('./torre2/torre2-approved-maps-atlas.js',main));
     const renderer=await import(new URL('./torre2/torre2-approved-map-renderer.js',main));
     const entry=atlas.approvedMap(id);
     if(!entry)throw Error('Approved map not registered: '+id);
     const key='torre2-approved-map-'+id;
     if(!game.textures.exists(key)){
      await new Promise((resolve,reject)=>{
       let failed=false;
       const onError=file=>{if(file?.key===key)failed=true};
       scene.load.on('loaderror',onError);
       scene.load.once('complete',()=>{
        scene.load.off('loaderror',onError);
        if(failed||!game.textures.exists(key))reject(Error('Approved map texture missing: '+id));
        else resolve();
       });
       scene.load.image(key,renderer.approvedMapImagePath(id,entry));
       scene.load.start();
      });
     }
     const state=window.kanto.readCampaign();
     if(!scene.approvedMapPreview(state,id))throw Error('Phaser rejected approved preview: '+id);
     const view=scene.__torre2ApprovedMapView;
     const aces=scene.children.list.filter(x=>x.active&&x.getData?.('torre2-gym-ace')===id)
      .map(x=>({texture:x.texture?.key,w:x.displayWidth,h:x.displayHeight,
       originY:x.originY,x:x.x,y:x.y,
       source:x.getData?.('torre2-gym-ace-source')||'legacy-portrait'}));
     const leaders=scene.children.list.filter(x=>x.active&&
      x.getData?.('torre2-gym-leader-sprite')===id)
      .map(x=>({texture:x.texture?.key,x:x.x,y:x.y}));
     const trainers=scene.children.list.filter(x=>x.active&&
      String(x.getData?.('torre2-gym-trainer-sprite')||'').startsWith(id+':'))
      .map(x=>({texture:x.texture?.key,kind:x.getData('torre2-gym-trainer-kind'),
       frameWidth:x.frame?.width,frameHeight:x.frame?.height,
       displayHeight:x.displayHeight,x:x.x,y:x.y}));
     return {id,texture:view.image.texture.key,hotspots:view.zones.length,
      rect:view.rect,aces,leaders,trainers,fps:game.loop.actualFps,stage:state.stage};
    },id);
    assert.equal(info.texture,'torre2-approved-map-'+id);
    assert.ok(info.rect.width>=639.9&&info.rect.height>=359.9,id+' must be 16:9');
    if(id==='gym-brock'||id==='gym-misty'){
     assert.equal(info.aces.length,1,id+' must show exactly one ace');
     assert.equal(info.aces[0].source,'pmd-idle',id+' needs native PMD Idle, not portrait');
     assert.ok(Math.abs(info.aces[0].y-info.leaders[0].y)<1,
      id+' Pokémon visible feet must be aligned with leader');
    }
    if(id==='gym-misty'){
     assert.equal(info.aces[0].texture,'torre2-gym-ace-idle-0121',
      'T76 real transparent Starmie PMD animation sheet, not portrait');
     assert.equal(info.aces[0].source,'pmd-idle');
     assert.ok(info.aces[0].w>=35&&info.aces[0].h>=35,
      'T76 Starmie must be a legible full-body sprite on the leader dais');
     assert.deepEqual(info.leaders.map(l=>l.texture),['frlg-npc-misty']);
     assert.deepEqual(info.trainers.map(t=>t.texture),[
      'frlg-npc-swimmer_m_land','frlg-npc-swimmer_f_land',
      'frlg-npc-tuber_m_land','frlg-npc-tuber_f'
     ],'T77 all subchiefs must be aquatic FRLG overworld sprites (no camper)');
     assert.equal(new Set(info.trainers.map(t=>t.texture)).size,4);
     assert.deepEqual(info.trainers.map(t=>t.frameHeight),[32,32,16,16],
      'T77 authentic FireRed frame geometry: adults 16x32, children 16x16');
     assert.ok(info.trainers.every(t=>t.frameWidth===16));
     assert.ok(info.trainers[2].displayHeight<info.trainers[0].displayHeight,
      'T77 child Tuber must remain visibly smaller than adult swimmer');
    }
    const filename='approved-'+id+'-'+mode.name+'.png';
    await page.screenshot({path:path.join(out,filename),fullPage:true,animations:'disabled'});
    evidence.maps.push({...info,mode:mode.name,screenshot:filename});
    if(id==='route-2'){
     // Real mouse/touch dispatch over the approved SOUTH and NORTH signs.
     // A stage-one fixture permits checking this navigation in isolation;
     // this is NOT proof of a complete Pallet-to-Pewter story.
     const checkpoint=await page.evaluate(()=>{
      const scene=window.__pt2Game.scene.getScene('campanha');
      const zones=scene.__torre2ApprovedMapView.zones;
      const get=(label)=>zones.find(z=>
       z.getData?.('torre2-approved-hotspot')==='route-2:'+label);
      const north=get('pewter'),south=get('forest');
      if(!north||!south)throw Error('Missing real Route 2 signage zones');
      return {north:{x:north.x,y:north.y},south:{x:south.x,y:south.y},
       before:JSON.stringify(window.kanto.readCampaign())};
     });
     const pointToViewport=await page.evaluate(points=>{
      const canvas=document.querySelector('#juego canvas');
      if(!canvas)throw Error('Phaser canvas missing');
      const bounds=canvas.getBoundingClientRect();
      const w=Math.min(bounds.width,bounds.height*640/360);
      const h=Math.min(bounds.height,bounds.width*360/640);
      const left=bounds.x+(bounds.width-w)/2,top=bounds.y+(bounds.height-h)/2;
      const map=p=>({x:left+p.x/640*w,y:top+p.y/360*h});
      return {north:map(points.north),south:map(points.south)};
     },checkpoint);
     const dispatch=async position=>{
      if(mode.isMobile)await page.touchscreen.tap(position.x,position.y);
      else await page.mouse.click(position.x,position.y);
     };
     await dispatch(pointToViewport.south);
     assert.equal(await page.evaluate(()=>
      window.__pt2Game.scene.getScene('campanha').__torre2ApprovedMapView?.id),
      'route-2','Missing Viridian Forest artwork must not cause a false teleport');
     await dispatch(pointToViewport.north);
     await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')
      ?.__torre2ApprovedMapView?.id==='pewter-city',null,{timeout:20000});
     const after=await page.evaluate(()=>JSON.stringify(window.kanto.readCampaign()));
     assert.equal(after,checkpoint.before,'Route 2 transition modified campaign save');
     await page.screenshot({path:path.join(out,
      'approved-route-2-to-pewter-'+mode.name+'.png'),fullPage:true,
      animations:'disabled'});
     evidence.maps.push({id:'route-2-to-pewter',mode:mode.name,
      via:'native touch/click',saveUnchanged:true});
    }
   }
   // Controlled stage-two fixture: after Misty, the journey must still
   // start in Cerulean (not skip Nugget Bridge / Route 5 to Vermilion).
   await page.evaluate(()=>{
    const state=window.kanto.readCampaign();
    state.stage=2;
    window.kanto.saveCampaign(state);
    const scene=window.__pt2Game.scene.getScene('campanha');
    scene.__torre2ApprovedReturn=null;
    scene.scene.restart();
   });
   await page.waitForFunction(()=>
    window.__pt2Game.scene.getScene('campanha')
     ?.__torre2ApprovedMapView?.id==='cerulean-city',null,{timeout:40000});
   const stage2Before=await page.evaluate(()=>JSON.stringify(window.kanto.readCampaign()));
   const stage2Path=[
    ['cerulean-city','route24','route-24'],
    ['route-24','route25','route-25'],
    ['route-25','route24','route-24'],
    ['route-24','cerulean','cerulean-city'],
    ['cerulean-city','route5','route-5'],
    ['route-5','underground','underground-5-6'],
    ['underground-5-6','route6','route-6'],
    ['route-6','vermilion','vermilion-city']
   ];
   for(const [from,sign,to] of stage2Path){
    const position=await page.evaluate(([source,hotspot])=>{
     const scene=window.__pt2Game.scene.getScene('campanha'),
      view=scene.__torre2ApprovedMapView;
     if(view?.id!==source)throw Error('Wrong stage-2 map '+view?.id+' != '+source);
     const zone=view.zones.find(z=>z.getData?.('torre2-approved-hotspot')===
      source+':'+hotspot);
     if(!zone)throw Error('No clickable stage-2 sign '+source+':'+hotspot);
     const bounds=document.querySelector('#juego canvas').getBoundingClientRect();
     const w=Math.min(bounds.width,bounds.height*640/360);
     const h=Math.min(bounds.height,bounds.width*360/640);
     return {x:bounds.x+(bounds.width-w)/2+zone.x/640*w,
      y:bounds.y+(bounds.height-h)/2+zone.y/360*h};
    },[from,sign]);
    if(mode.isMobile)await page.touchscreen.tap(position.x,position.y);
    else await page.mouse.click(position.x,position.y);
    await page.waitForFunction(id=>window.__pt2Game.scene.getScene('campanha')
     ?.__torre2ApprovedMapView?.id===id,to,{timeout:25000});
    const after=await page.evaluate(()=>JSON.stringify(window.kanto.readCampaign()));
    assert.equal(after,stage2Before,'Stage 2 route transition changed saves: '+from+'->'+to);
    const screenshot='t62-approved-'+to+'-'+mode.name+'.png';
    await page.screenshot({path:path.join(out,screenshot),fullPage:true,
      animations:'disabled'});
    evidence.maps.push({id:to,mode:mode.name,from,sign,
      via:'actual Phaser sign click/touch',saveUnchanged:true,screenshot});
   }
   // T80: use the real Vermilion GYM door to enter the USER-REPLACED
   // background. It has empty platforms: all six authentic actors must be
   // overlaid independently, with Raichu grounded next to Lt. Surge.
   const surgeDoor=await page.evaluate(()=>{
    const scene=window.__pt2Game.scene.getScene('campanha');
    if(scene.__torre2ApprovedMapView?.id!=='vermilion-city')
     throw Error('T78 must enter Surge through approved Vermilion city');
    const zone=scene.__torre2ApprovedMapView.zones.find(z=>
     z.getData?.('torre2-approved-hotspot')==='vermilion-city:gym');
    if(!zone)throw Error('T78 original Vermilion gym doorway missing');
    const b=document.querySelector('#juego canvas').getBoundingClientRect();
    const w=Math.min(b.width,b.height*640/360);
    const h=Math.min(b.height,b.width*360/640);
    return {x:b.x+(b.width-w)/2+zone.x/640*w,
      y:b.y+(b.height-h)/2+zone.y/360*h};
   });
   if(mode.isMobile)await page.touchscreen.tap(surgeDoor.x,surgeDoor.y);
   else await page.mouse.click(surgeDoor.x,surgeDoor.y);
   await page.waitForFunction(()=>{
    const scene=window.__pt2Game.scene.getScene('campanha');
    return scene?.__torre2ApprovedMapView?.id==='gym-surge'&&
      scene.__torre2ApprovedMapView?.image?.active===true;
   },null,{timeout:40000});
   const surge=await page.evaluate(()=>{
    const game=window.__pt2Game,scene=game.scene.getScene('campanha');
    const painted=scene.__torre2ApprovedMapView;
    const leaders=scene.children.list.filter(x=>x.active&&
     x.getData?.('torre2-gym-leader-sprite')==='gym-surge');
    const aces=scene.children.list.filter(x=>x.active&&
     x.getData?.('torre2-gym-ace')==='gym-surge');
    const trainers=scene.children.list.filter(x=>x.active&&
     String(x.getData?.('torre2-gym-trainer-sprite')||'').startsWith('gym-surge:'));
    return {texture:painted.image.texture.key,
     sourceImage:painted.image.texture.getSourceImage().width,
     leaders:leaders.map(x=>({texture:x.texture?.key,y:x.y})),
     aces:aces.map(x=>({texture:x.texture?.key,y:x.y,originY:x.originY,
      source:x.getData?.('torre2-gym-ace-source')})),
     trainers:trainers.map(x=>x.texture?.key),
     actions:scene.children.list.filter(x=>x.active&&
      String(x.getData?.('torre2-approved-gym-trainer')||'')
       .startsWith('gym-surge:')).length,
     actors:scene.children.list.filter(x=>x.active&&
      (x.getData?.('torre2-gym-leader-sprite')==='gym-surge'||
       x.getData?.('torre2-gym-ace')==='gym-surge'||
       String(x.getData?.('torre2-gym-trainer-sprite')||'')
        .startsWith('gym-surge:'))).length,
     actualAce:window.kanto.GYMS[2]?.boss,
     actualTeam:window.kanto.GYMS[2]?.leaderTeam,
     save:JSON.stringify(window.kanto.readCampaign())};
   });
   assert.equal(surge.texture,'torre2-approved-map-gym-surge');
   assert.equal(surge.actors,6,'T80 all 6 original FRLG/PMD characters must render');
   assert.deepEqual(surge.leaders.map(x=>x.texture),['frlg-npc-lt_surge']);
   assert.deepEqual(surge.trainers,[
    'frlg-npc-sailor','frlg-npc-rocker','frlg-npc-gentleman','frlg-npc-worker_m'
   ]);
   assert.equal(surge.aces[0]?.texture,'torre2-gym-ace-idle-0026');
   assert.equal(surge.aces[0]?.source,'pmd-idle');
   assert.ok(Math.abs(surge.aces[0].y-surge.leaders[0].y)<1,
    'T80 Raichu visible feet must align with the leader floor line');
   assert.equal(surge.actions,4,'T78 four original trainers must remain interactive');
   assert.equal(surge.actualAce,'raichu','T78 real Surge ace must remain Raichu');
   assert.ok(surge.actualTeam.includes('raichu'));
   assert.equal(surge.save,stage2Before,'T78 entering approved gym altered campaign');
   const surgeScreenshot='t78-approved-gym-surge-'+mode.name+'.png';
   await page.screenshot({path:path.join(out,surgeScreenshot),fullPage:true,
    animations:'disabled'});
   evidence.maps.push({id:'gym-surge',mode:mode.name,
    via:'T78 real Vermilion gym door click/touch',
    fixture:'Controlled stage 2, not naturally earned Thunder Badge',
    userBackground:true,renderedPhaserActors:surge.actors,
    aceInBattle:surge.actualAce,screenshot:surgeScreenshot});
   // Return using an actual approved exit, never an invented stage warp.
   const surgeExit=await page.evaluate(()=>{
    const scene=window.__pt2Game.scene.getScene('campanha'),view=scene.__torre2ApprovedMapView;
    const zone=view?.zones?.find(x=>x.getData?.('torre2-approved-hotspot')==='gym-surge:exit');
    if(!zone)throw Error('T78 original Surge exit missing');
    const b=document.querySelector('#juego canvas').getBoundingClientRect();
    const w=Math.min(b.width,b.height*640/360);
    const h=Math.min(b.height,b.width*360/640);
    return {x:b.x+(b.width-w)/2+zone.x/640*w,
     y:b.y+(b.height-h)/2+zone.y/360*h};
   });
   if(mode.isMobile)await page.touchscreen.tap(surgeExit.x,surgeExit.y);
   else await page.mouse.click(surgeExit.x,surgeExit.y);
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')
    ?.__torre2ApprovedMapView?.id==='vermilion-city',null,{timeout:30000});
   assert.equal(await page.evaluate(()=>JSON.stringify(window.kanto.readCampaign())),
    stage2Before,'T78 approved gym visit altered campaign progression');
   // T69: the user-facing Party Summary must return to the SAME original
   // approved map after Back and after selecting the current team member.
   // No battle result, extra Pokémon or save edit is fabricated here.
   const summaryBack=async control=>{
    await page.evaluate(()=>{
     const scene=window.__pt2Game.scene.getScene('campanha');
     scene.showSummary(window.kanto.readCampaign(),0);
    });
    await page.waitForFunction(key=>window.__pt2Game.scene.getScene('campanha')
     .children.list.some(x=>x.active&&x.getData?.(key)===true),
     control,{timeout:20000});
    // Phaser inserts interactive regions on the following input preUpdate.
    await page.evaluate(()=>new Promise(resolve=>
     requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const pos=await page.evaluate(key=>{
     const scene=window.__pt2Game.scene.getScene('campanha');
     const hit=scene.children.list.find(x=>x.active&&x.getData?.(key)===true);
     if(!hit)throw Error('T69 real Phaser summary button absent: '+key);
     const bounds=document.querySelector('#juego canvas').getBoundingClientRect();
     const w=Math.min(bounds.width,bounds.height*640/360);
     const h=Math.min(bounds.height,bounds.width*360/640);
     return {x:bounds.x+(bounds.width-w)/2+hit.x/640*w,
      y:bounds.y+(bounds.height-h)/2+hit.y/360*h};
    },control);
    if(mode.isMobile)await page.touchscreen.tap(pos.x,pos.y);
    else await page.mouse.click(pos.x,pos.y);
    await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')
     ?.__torre2ApprovedMapView?.id==='vermilion-city'&&
     window.__pt2Game.scene.getScene('campanha')
      ?.__torre2ApprovedMapView?.image?.active===true&&
     window.__pt2Game.scene.getScene('campanha').children.list.some(x=>
      x.active&&x.getData?.('torre2-approved-hotspot')==='vermilion-city:route6'),
     null,{timeout:20000});
    assert.equal(await page.evaluate(()=>JSON.stringify(window.kanto.readCampaign())),
     stage2Before,'T69 summary return unexpectedly modified a campaign save');
    const screenshot='t69-summary-'+control+'-'+mode.name+'.png';
    await page.screenshot({path:path.join(out,screenshot),
     fullPage:true,animations:'disabled'});
    evidence.maps.push({id:'vermilion-city',mode:mode.name,
     via:'native summary '+control+' mouse/touch',saveUnchanged:true,screenshot});
   };
   await summaryBack('torre2-summary-back');
   await summaryBack('torre2-active-select');
   // T70: exercise the six menu return buttons with real Chromium
   // mouse/touch. Menus are opened with a controlled stage-two fixture,
   // not invented battle victories, purchases, heals or badges.
   const backMenus=[
    ['center','centerScreen','torre2-center-back'],
    ['mart','martScreen','torre2-mart-back'],
    ['bag','bagScreen','torre2-bag-back'],
    ['pc','pcScreen','torre2-pc-back'],
    ['dex','dexScreen','torre2-dex-back'],
    ['badges','badgeCaseScreen','torre2-badge-case-back']
   ];
   for(const [label,method,key] of backMenus){
    await page.evaluate(fn=>{
     const scene=window.__pt2Game.scene.getScene('campanha');
     const current=window.kanto.readCampaign();
     if(scene.__torre2ApprovedMapView?.id!=='vermilion-city')
      throw Error('T70 menu opened outside approved Vermilion map');
     scene[fn](current);
    },method);
    await page.waitForFunction(k=>window.__pt2Game.scene.getScene('campanha')
     .children.list.some(obj=>obj.active&&obj.getData?.(k)===true),key,{timeout:20000});
    await page.evaluate(()=>new Promise(resolve=>
     requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const pos=await page.evaluate(k=>{
     const scene=window.__pt2Game.scene.getScene('campanha');
     const hit=scene.children.list.find(x=>x.active&&x.getData?.(k)===true);
     if(!hit)throw Error('T70 missing physical button '+k);
     const b=document.querySelector('#juego canvas').getBoundingClientRect();
     const w=Math.min(b.width,b.height*640/360);
     const h=Math.min(b.height,b.width*360/640);
     return {x:b.x+(b.width-w)/2+hit.x/640*w,
      y:b.y+(b.height-h)/2+hit.y/360*h};
    },key);
    if(mode.isMobile)await page.touchscreen.tap(pos.x,pos.y);
    else await page.mouse.click(pos.x,pos.y);
    await page.waitForFunction(()=>{
     const scene=window.__pt2Game.scene.getScene('campanha');
     return scene?.__torre2ApprovedMapView?.id==='vermilion-city'&&
      scene.__torre2ApprovedMapView?.image?.active===true&&
      scene.children.list.some(x=>x.active&&x.getData?.(
       'torre2-approved-hotspot')==='vermilion-city:route6');
    },null,{timeout:25000});
    assert.equal(await page.evaluate(()=>JSON.stringify(window.kanto.readCampaign())),
     stage2Before,'T70 '+label+' Back unexpectedly changed the real campaign save');
    if(label==='center'||label==='pc'||label==='dex'){
     const screenshot='t70-'+label+'-return-'+mode.name+'.png';
     await page.screenshot({path:path.join(out,screenshot),fullPage:true,animations:'disabled'});
     evidence.maps.push({id:'vermilion-city',mode:mode.name,
      via:'T70 '+label+' real mouse/touch',saveUnchanged:true,screenshot});
    }
   }
   // T73: an obsolete wild result must NEVER be reinterpreted as a
   // trainer victory, even when its stage and trainer index match.
   // This is a CONTROLLED invalid-result fixture, not a played battle.
   const beforeStale=await page.evaluate(()=>JSON.stringify(window.kanto.readCampaign()));
   await page.evaluate(()=>{
    const current=window.kanto.readCampaign();
    const scene=window.__pt2Game.scene.getScene('campanha');
    if(scene.__torre2ApprovedMapView?.id!=='vermilion-city')
     throw Error('T73 expects unchanged Vermilion stage-two map');
    scene.scene.restart({finished:true,won:true,
     marker:{kind:'wild',stage:current.stage,trainer:current.trainer,
      id:'zubat',encounterCounter:current.wildEncountersStage||0}});
   });
   // T71 intentionally discards the last-map return marker for a REJECTED
   // battle result. The native stage-2 opening is Cerulean, NOT Vermilion.
   // Verify that authorized canonical map instead of demanding a forbidden
   // stale-location restore. Then walk approved signs back to Vermilion.
   await page.waitForFunction(()=>{
    const scene=window.__pt2Game.scene.getScene('campanha');
    return scene?.scene.isActive()&&scene.__torre2ApprovedMapView?.id==='cerulean-city'&&
     scene.__torre2ApprovedMapView?.image?.active===true;
   },null,{timeout:45000});
   assert.equal(await page.evaluate(()=>JSON.stringify(window.kanto.readCampaign())),
    beforeStale,'T73 invalid wild result granted a trainer win, badge or money');
   assert.equal(await page.evaluate(()=>window.__pt2Game.scene.getScene('campanha')
     .children.list.some(o=>o.active&&o.getData?.('torre2-report-continue')===true)),
    false,'T73 stale result must not show a fabricated victory report');
   evidence.maps.push({id:'cerulean-city',mode:mode.name,
    via:'T73 obsolete wild marker rejected; canonical opening restored',
    fixture:'INVALID result; no actual battle',saveUnchanged:true});
   // Go back on real approved clickable signs; no fabricated checkpoint
   // or teleport is allowed just to prepare the T71 regression.
   for(const [from,sign,to] of stage2Path.slice(4)){
    const position=await page.evaluate(([source,hotspot])=>{
     const scene=window.__pt2Game.scene.getScene('campanha'),
      view=scene.__torre2ApprovedMapView;
     if(view?.id!==source)throw Error('T76 expected map '+source+', got '+view?.id);
     const zone=view.zones.find(z=>z.getData?.('torre2-approved-hotspot')===
      source+':'+hotspot);
     if(!zone)throw Error('T76 missing approved sign '+source+':'+hotspot);
     const bounds=document.querySelector('#juego canvas').getBoundingClientRect();
     const w=Math.min(bounds.width,bounds.height*640/360),
      h=Math.min(bounds.height,bounds.width*360/640);
     return {x:bounds.x+(bounds.width-w)/2+zone.x/640*w,
      y:bounds.y+(bounds.height-h)/2+zone.y/360*h};
    },[from,sign]);
    if(mode.isMobile)await page.touchscreen.tap(position.x,position.y);
    else await page.mouse.click(position.x,position.y);
    await page.waitForFunction(id=>window.__pt2Game.scene.getScene('campanha')
     ?.__torre2ApprovedMapView?.id===id,to,{timeout:25000});
   }
   assert.equal(await page.evaluate(()=>JSON.stringify(window.kanto.readCampaign())),
    beforeStale,'T76 approved post-stale navigation mutated the save');
   // T71: controlled defeat RESULT in stage 2 (not a naturally played
   // fight or a simulated victory). Run the native save resolver once, and
   // use a REAL mouse/touch click on the original report Continue button.
   // A loss must not award a badge or skip a trainer, and the last approved
   // Vermilion location must survive after acknowledgement and restart.
   const beforeDefeat=await page.evaluate(()=>{
    const scene=window.__pt2Game.scene.getScene('campanha');
    const s=window.kanto.readCampaign();
    if(scene.__torre2ApprovedMapView?.id!=='vermilion-city')
     throw Error('T71 fixture must start in original Vermilion');
    const before={stage:s.stage,trainer:s.trainer,wins:s.wins,
     losses:s.losses,money:s.money,badges:[...s.badges],
     lastMap:scene.__torre2ApprovedReturn?.id};
    if(before.lastMap!=='vermilion-city')
     throw Error('T71 no original approved-map return checkpoint');
    scene.scene.restart({finished:true,won:false,
     marker:{kind:'trainer',stage:s.stage,trainer:s.trainer}});
    return before;
   });
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')
    ?.children.list.some(item=>item.active&&
     item.getData?.('torre2-report-continue')===true),null,{timeout:45000});
   const afterDefeat=await page.evaluate(()=>{
    const s=window.kanto.readCampaign();
    return {stage:s.stage,trainer:s.trainer,wins:s.wins,
     losses:s.losses,money:s.money,badges:[...s.badges],
     saved:JSON.stringify(s)};
   });
   assert.equal(afterDefeat.stage,beforeDefeat.stage,'T71 defeat changed native stage');
   assert.equal(afterDefeat.trainer,beforeDefeat.trainer,'T71 defeat skipped trainer');
   assert.equal(afterDefeat.wins,beforeDefeat.wins,'T71 defeat counted a victory');
   assert.equal(afterDefeat.losses,beforeDefeat.losses+1,'T71 defeat must save exactly once');
   assert.equal(afterDefeat.money,beforeDefeat.money,'T71 defeat awarded money');
   assert.deepEqual(afterDefeat.badges,beforeDefeat.badges,'T71 defeat awarded badge');
   await page.evaluate(()=>new Promise(resolve=>
    requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const continueAt=await page.evaluate(()=>{
    const scene=window.__pt2Game.scene.getScene('campanha');
    const hit=scene.children.list.find(o=>o.active&&
     o.getData?.('torre2-report-continue')===true);
    if(!hit)throw Error('T71 report Continue zone absent');
    const b=document.querySelector('#juego canvas').getBoundingClientRect();
    const w=Math.min(b.width,b.height*640/360);
    const h=Math.min(b.height,b.width*360/640);
    return {x:b.x+(b.width-w)/2+hit.x/640*w,
     y:b.y+(b.height-h)/2+hit.y/360*h};
   });
   if(mode.isMobile)await page.touchscreen.tap(continueAt.x,continueAt.y);
   else await page.mouse.click(continueAt.x,continueAt.y);
   await page.waitForFunction(()=>{
    const scene=window.__pt2Game.scene.getScene('campanha');
    return scene?.__torre2ApprovedMapView?.id==='vermilion-city'&&
     scene.__torre2ApprovedMapView?.image?.active&&
     scene.children.list.some(o=>o.active&&
      o.getData?.('torre2-approved-hotspot')==='vermilion-city:route6');
   },null,{timeout:25000});
   assert.equal(await page.evaluate(()=>JSON.stringify(window.kanto.readCampaign())),
    afterDefeat.saved,'T71 report Continue altered checkpoint a second time');
   const defeatShot='t71-post-defeat-original-vermilion-'+mode.name+'.png';
   await page.screenshot({path:path.join(out,defeatShot),
    fullPage:true,animations:'disabled'});
   evidence.maps.push({id:'vermilion-city',mode:mode.name,
    via:'T71 controlled defeat + native report Continue mouse/touch',
    noFakeWins:true,saveUnchangedAfterContinue:true,screenshot:defeatShot});
   await page.evaluate(()=>{
    window.__pt2Game.scene.getScene('campanha').scene.restart();
   });
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')
    ?.__torre2ApprovedMapView?.id==='vermilion-city',null,{timeout:40000});
   assert.equal(await page.evaluate(()=>JSON.stringify(window.kanto.readCampaign())),
    afterDefeat.saved,'T71 restarting after report replayed defeat rewards or losses');
   // T72: controlled battle-result fixtures, NOT naturally won fights.
   // Feed the existing native resolver a first-clear Misty checkpoint; never
   // add Cascata, a reward TM or a win directly. After Continue, Phaser must
   // PRELOAD stage 2 and open the approved Cerulean map (not legacy HUD).
   await page.evaluate(()=>{
    const core=window.kanto,scene=window.__pt2Game.scene.getScene('campanha');
    const s=core.readCampaign();
    s.stage=1;s.trainer=core.TRAINERS_PER_GYM(1);
    s.badges=['Rocha'];s.leagueHonors=[];s.champion=false;
    core.saveCampaign(s);
    scene.__torre2ApprovedReturn=null;
    scene.__torre2ApprovedMapView=null;
    scene.scene.restart({finished:true,won:true,
     marker:{kind:'trainer',stage:1,trainer:s.trainer}});
   });
   const reportClick=async label=>{
    await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')
     ?.children.list.some(o=>o.active&&o.getData?.('torre2-report-continue')===true),
      null,{timeout:45000});
    await page.evaluate(()=>new Promise(resolve=>
     requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const p=await page.evaluate(label=>{
     const hit=window.__pt2Game.scene.getScene('campanha').children.list.find(
      o=>o.active&&o.getData?.('torre2-report-continue')===true);
     if(!hit)throw Error('T72 missing real '+label+' report button');
     const b=document.querySelector('#juego canvas').getBoundingClientRect();
     const w=Math.min(b.width,b.height*640/360),
      h=Math.min(b.height,b.width*360/640);
     return {x:b.x+(b.width-w)/2+hit.x/640*w,
      y:b.y+(b.height-h)/2+hit.y/360*h};
    },label);
    if(mode.isMobile)await page.touchscreen.tap(p.x,p.y);
    else await page.mouse.click(p.x,p.y);
   };
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')
    ?.children.list.some(o=>o.active&&o.getData?.('torre2-report-continue')===true),
    null,{timeout:45000});
   const misty=await page.evaluate(()=>{
    const s=window.kanto.readCampaign();
    return {stage:s.stage,trainer:s.trainer,wins:s.wins,
     badges:s.badges.slice(),claims:s.gymTMClaims?.slice()||[],
     snapshot:JSON.stringify(s)};
   });
   assert.equal(misty.stage,2,'T72 native Misty resolver must advance to stage 2');
   assert.equal(misty.trainer,0,'T72 native stage advance resets trainer index');
   assert.ok(misty.badges.includes('Rocha')&&misty.badges.includes('Cascata'),
    'T72 native win must persist both legitimate gym rewards');
   assert.equal(misty.badges.length,2,'T72 no extra gym badges');
   assert.ok(misty.claims.length>0,'T72 native Misty TM grant missing');
   await reportClick('Misty');
   await page.waitForFunction(()=>{
    const scene=window.__pt2Game.scene.getScene('campanha'),v=scene?.__torre2ApprovedMapView;
    return scene?.scene.isActive()&&v?.id==='cerulean-city'&&v?.image?.active&&
     scene.children.list.some(o=>o.active&&
      o.getData?.('torre2-approved-hotspot')==='cerulean-city:route24');
   },null,{timeout:45000});
   assert.equal(await page.evaluate(()=>JSON.stringify(window.kanto.readCampaign())),
    misty.snapshot,'T72 report Continue replayed Misty win/rewards');
   const mistyShot='t72-misty-native-resolver-cerulean-'+mode.name+'.png';
   await page.screenshot({path:path.join(out,mistyShot),
    fullPage:true,animations:'disabled'});
   evidence.maps.push({id:'cerulean-city',mode:mode.name,
    via:'T72 controlled leader result + native award resolver + real Continue tap',
    fixture:'NOT a naturally played Misty fight',screenshot:mistyShot,
    stage:misty.stage,badges:misty.badges,saveUnchangedAfterContinue:true});
   // A second native restart must not award Cascata, TM or XP twice.
   await page.evaluate(()=>window.__pt2Game.scene.getScene('campanha').scene.restart({}));
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')
    ?.__torre2ApprovedMapView?.id==='cerulean-city',null,{timeout:45000});
   assert.equal(await page.evaluate(()=>JSON.stringify(window.kanto.readCampaign())),
    misty.snapshot,'T72 after leader restart replayed saved victory');

   // A regular trainer win must keep the SAME stage, trainer index +1,
   // and restore Cerulean without restarting again or granting badges.
   await page.evaluate(()=>{
    const s=window.kanto.readCampaign();
    window.__pt2Game.scene.getScene('campanha').scene.restart({
     finished:true,won:true,
     marker:{kind:'trainer',stage:s.stage,trainer:s.trainer}});
   });
   // Wait for the real report and the native save commit before checking.
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')
    ?.children.list.some(o=>o.active&&
     o.getData?.('torre2-report-continue')===true),null,{timeout:45000});
   const trainerAfter=await page.evaluate(()=>{
    const s=window.kanto.readCampaign();
    return {stage:s.stage,trainer:s.trainer,wins:s.wins,badges:s.badges.slice(),
     snapshot:JSON.stringify(s)};
   });
   assert.equal(trainerAfter.stage,2,'T72 regular trainer must stay in stage 2');
   assert.equal(trainerAfter.trainer,1,'T72 regular trainer advances index exactly one');
   assert.equal(trainerAfter.wins,misty.wins+1,'T72 regular trainer win count');
   assert.deepEqual(trainerAfter.badges,misty.badges,'T72 regular trainer cannot grant badge');
   await reportClick('regular trainer');
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')
    ?.__torre2ApprovedMapView?.id==='cerulean-city',null,{timeout:25000});
   assert.equal(await page.evaluate(()=>JSON.stringify(window.kanto.readCampaign())),
    trainerAfter.snapshot,'T72 regular trainer Continue must not re-award rewards');
   evidence.maps.push({id:'cerulean-city',mode:mode.name,
    via:'T72 controlled ordinary trainer victory + native checkpoint + Continue',
    fixture:'NOT a naturally played battle',saveUnchangedAfterContinue:true});
   // T63: controlled stage-three fixture after Lt. Surge — must start in
   // Vermilion, traverse the original Route 9 solo before Route 10, and
   // never mutate battle saves by simply clicking painted map signs.
   const gotoStage=async(expected,number)=>{
    await page.evaluate(stage=>{
     const s=window.kanto.readCampaign();s.stage=stage;
     // Synthetic browser fixture only: stage eight starts with exactly the
     // eight native badges. This does NOT imply a real player won any gym.
     // It allows real mouse/touch QA without bypassing the T68 badge gate.
     if(stage>=8)s.badges=window.kanto.GYMS.map(gym=>gym.badge);
     window.kanto.saveCampaign(s);
     const scene=window.__pt2Game.scene.getScene('campanha');
     scene.__torre2ApprovedReturn=null;
     // The previous stage may end in the SAME city as the new stage starts.
     // Clear the old view before restarting to avoid clicking destroyed zones.
     scene.__torre2ApprovedMapView=null;
     scene.scene.restart();
    },number);
    await page.waitForFunction(id=>{
     const scene=window.__pt2Game.scene.getScene('campanha'),
      view=scene?.__torre2ApprovedMapView;
     return scene?.scene.isActive()&&view?.id===id&&view.zones?.some(z=>
      z.active&&typeof z.getData==='function');
    },expected,{timeout:45000});
    return page.evaluate(()=>JSON.stringify(window.kanto.readCampaign()));
   };
   const followSigns=async(chain,baseline,label)=>{
    for(const [from,sign,to] of chain){
     const position=await page.evaluate(([source,hotspot])=>{
      const scene=window.__pt2Game.scene.getScene('campanha'),
       view=scene.__torre2ApprovedMapView;
      if(view?.id!==source)throw Error('T63 wrong '+source+' map: '+view?.id);
      const zone=view.zones.find(z=>z.getData?.('torre2-approved-hotspot')===
       source+':'+hotspot);
      if(!zone)throw Error('T63 missing actual sign '+source+':'+hotspot);
      const bounds=document.querySelector('#juego canvas').getBoundingClientRect();
      const drawW=Math.min(bounds.width,bounds.height*640/360);
      const drawH=Math.min(bounds.height,bounds.width*360/640);
      return {x:bounds.x+(bounds.width-drawW)/2+zone.x/640*drawW,
       y:bounds.y+(bounds.height-drawH)/2+zone.y/360*drawH};
     },[from,sign]);
     // A freshly drawn Phaser hit zone only enters the active input list
     // on a subsequent render frame. Never click an unregistered zone.
     // Still use actual mouse/touch; no direct callback or synthetic win.
     await page.evaluate(()=>new Promise(resolve=>
      requestAnimationFrame(()=>requestAnimationFrame(resolve))));
     if(mode.isMobile)await page.touchscreen.tap(position.x,position.y);
     else await page.mouse.click(position.x,position.y);
     try{
      await page.waitForFunction(target=>window.__pt2Game.scene.getScene('campanha')
       ?.__torre2ApprovedMapView?.id===target,to,{timeout:25000});
     }catch(error){
      const status=await page.evaluate(([source,hotspot,target])=>{
       const game=window.__pt2Game,scene=game.scene.getScene('campanha');
       const view=scene.__torre2ApprovedMapView;
       const hit=view?.zones?.find(z=>z.getData?.('torre2-approved-hotspot')===
        source+':'+hotspot);
       const save=window.kanto.readCampaign();
       return {from:source,sign:hotspot,expected:target,
        actual:view?.id,zoneActive:hit?.active,
        loaderBusy:scene.load.isLoading?.(),
        queued:scene.__torre2QueuedApprovedTarget,
        texturePresent:scene.textures.exists('torre2-approved-map-'+target),
        stage:save?.stage,badges:save?.badges,
        viewport:{width:innerWidth,height:innerHeight}};
      },[from,sign,to]);
      evidence.errors.push('T68_ROUTE_DIAG '+JSON.stringify(status));
      await page.screenshot({path:path.join(out,
       't68-route-failure-'+from+'-'+to+'-'+mode.name+'.png'),
       fullPage:true,animations:'disabled'});
      throw Error('T68 route timeout '+JSON.stringify(status)+'; '+error);
     }
     const actual=await page.evaluate(()=>JSON.stringify(window.kanto.readCampaign()));
     assert.equal(actual,baseline,'T63 navigation altered save '+from+'→'+to);
     // Screenshot representative scenes, not 18 duplicate frames.
     if(['route-11','route-9-solo','routes-9-10','lavender-town','routes-7-8',
      'rocket-hideout','routes-16-18','routes-12-15','fuchsia-city',
      'silph-co','gym-sabrina','routes-19-20','seafoam-islands',
      'cinnabar-island','pokemon-mansion','gym-blaine',
      'routes-22-23','victory-road','indigo-plateau','elite-four-rooms'].includes(to)){
      const name=(label.startsWith('stage8')||label.startsWith('stage9')?
       't66-approved-':label.startsWith('stage5')||label.startsWith('stage6')?
       't65-approved-':'t63-approved-')+to+'-'+mode.name+'.png';
      await page.screenshot({path:path.join(out,name),
       fullPage:true,animations:'disabled'});
      evidence.maps.push({id:to,mode:mode.name,from,sign,saveUnchanged:true,
       via:'real mouse/touch in Phaser',screenshot:name});
     }
    }
   };
   const stage3=await gotoStage('vermilion-city',3);
   await followSigns([
    ['vermilion-city','route11','route-11'],
    ['route-11','vermilion','vermilion-city'],
    ['vermilion-city','route6','route-6'],
    ['route-6','underground','underground-5-6'],
    ['underground-5-6','route5','route-5'],
    ['route-5','cerulean','cerulean-city'],
    ['cerulean-city','route9','route-9-solo'],
    ['route-9-solo','route10','routes-9-10'],
    ['routes-9-10','lavender','lavender-town'],
    ['lavender-town','tower','pokemon-tower'],
    ['pokemon-tower','exit','lavender-town'],
    ['lavender-town','route8','routes-7-8'],
    ['routes-7-8','celadon','celadon-city'],
    ['celadon-city','game','rocket-hideout'],
    ['rocket-hideout','exit','celadon-city']
   ],stage3,'stage3');
   // T63: after Erika, do not skip Celadon → original Cycling Road →
   // Fuchsia. Continue into approved Routes 12–15 via the actual sign.
   const stage4=await gotoStage('celadon-city',4);
   await followSigns([
    ['celadon-city','route16','routes-16-18'],
    ['routes-16-18','fuchsia','fuchsia-city'],
    ['fuchsia-city','route15','routes-12-15'],
    ['routes-12-15','lavender','lavender-town']
   ],stage4,'stage4');
   // T65 isolated Saffron proof: this direct renderer fixture DOES NOT
   // imply a finished city-gate route (Celadon→Saffron lacks a valid sign).
   const stage5=await gotoStage('fuchsia-city',5);
   await page.evaluate(async()=>{
    const scene=window.__pt2Game.scene.getScene('campanha'),
     state=window.kanto.readCampaign();
    const main=[...document.scripts].find(s=>s.src?.includes('/main.js'))?.src;
    if(!main)throw Error('T65 Phaser main module missing');
    const atlas=await import(new URL('./torre2/torre2-approved-maps-atlas.js',main));
    const renderer=await import(new URL('./torre2/torre2-approved-map-renderer.js',main));
    const id='saffron-city',key=renderer.mapTextureKey(id);
    const entry=atlas.approvedMap(id);
    if(!entry)throw Error('T65 Saffron absent from original atlas');
    if(!scene.textures.exists(key)){
     await new Promise((resolve,reject)=>{
      let failed=false;
      const onError=file=>{if(file?.key===key)failed=true};
      scene.load.on('loaderror',onError);
      scene.load.once('complete',()=>{
       scene.load.off('loaderror',onError);
       if(failed||!scene.textures.exists(key))
        reject(Error('T65 approved Saffron texture failed'));
       else resolve();
      });
      scene.load.image(key,entry.image);
      scene.load.start();
     });
    }
    if(!scene.approvedMapPreview(state,id))
     throw Error('T65 original Saffron view unavailable');
   });
   await followSigns([
    ['saffron-city','silph','silph-co'],
    ['silph-co','exit','saffron-city'],
    ['saffron-city','gym','gym-sabrina'],
    ['gym-sabrina','exit','saffron-city']
   ],stage5,'stage5-isolated-saffron');
   // After the Sabrina chapter, do not teleport to Cinnabar. Navigate
   // through the physical Fuchsia → Route 19/20 → Seafoam corridor.
   const stage6=await gotoStage('fuchsia-city',6);
   await followSigns([
    ['fuchsia-city','route19','routes-19-20'],
    ['routes-19-20','seafoam','seafoam-islands'],
    ['seafoam-islands','cinnabar','cinnabar-island'],
    ['cinnabar-island','mansion','pokemon-mansion'],
    ['pokemon-mansion','exit','cinnabar-island'],
    ['cinnabar-island','gym','gym-blaine'],
    ['gym-blaine','exit','cinnabar-island'],
    ['cinnabar-island','seafoam','seafoam-islands'],
    ['seafoam-islands','route19','routes-19-20'],
    ['routes-19-20','fuchsia','fuchsia-city']
   ],stage6,'stage6-coastal');
   // T66 stage-eight proof: Route 22/23 -> Victory Road -> Indigo,
   // including physical return; no fabricated victory or battle grants.
   const stage8=await gotoStage('routes-22-23',8);
   await followSigns([
    ['routes-22-23','victory','victory-road'],
    ['victory-road','indigo','indigo-plateau'],
    ['indigo-plateau','victory','victory-road'],
    ['victory-road','indigo','indigo-plateau']
   ],stage8,'stage8-league-route');
   const nativeChallenge=async(expectedMap,hotspot)=>{
    const position=await page.evaluate(([map,key])=>{
     const scene=window.__pt2Game.scene.getScene('campanha'),
      view=scene?.__torre2ApprovedMapView;
     if(view?.id!==map)throw Error('T66 not on '+map+': '+view?.id);
     const zone=view.zones.find(z=>z.getData?.('torre2-approved-hotspot')===map+':'+key);
     if(!zone)throw Error('T66 missing real challenge '+map+':'+key);
     const bounds=document.querySelector('#juego canvas').getBoundingClientRect();
     const w=Math.min(bounds.width,bounds.height*640/360);
     const h=Math.min(bounds.height,bounds.width*360/640);
     return {x:bounds.x+(bounds.width-w)/2+zone.x/640*w,
      y:bounds.y+(bounds.height-h)/2+zone.y/360*h};
    },[expectedMap,hotspot]);
    if(mode.isMobile)await page.touchscreen.tap(position.x,position.y);
    else await page.mouse.click(position.x,position.y);
    await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')
     ?.children.list.some(item=>typeof item?.text==='string'&&
      item.text.includes('DESAFIO DA LIGA')),null,{timeout:20000});
    const now=await page.evaluate(()=>JSON.stringify(window.kanto.readCampaign()));
    assert.equal(now,expectedMap==='indigo-plateau'?stage8:stage9,
     'T66 clicking a battle challenge must NOT simulate a victory');
   };
   await nativeChallenge('indigo-plateau','challenge');
   // Synthetic stage-nine fixture: verify Bruno opens the native challenge,
   // without claiming that Lorelei or any other battle was won.
   const stage9=await gotoStage('elite-four-rooms',9);
   await page.screenshot({path:path.join(out,'t66-approved-elite-four-rooms-'+
    mode.name+'.png'),fullPage:true,animations:'disabled'});
   await nativeChallenge('elite-four-rooms','bruno');
   // T67 real Phaser visual proof; the Champion state below is a CONTROLLED
   // TEST FIXTURE, not evidence of a player winning every fight.
   await page.evaluate(()=>{
    const save=window.kanto.readCampaign();
    save.stage=13;save.champion=true;
    window.kanto.saveCampaign(save);
    const scene=window.__pt2Game.scene.getScene('campanha');
    scene.__torre2ApprovedReturn=null;
    scene.__torre2ApprovedMapView=null;
    scene.scene.restart();
   });
   await page.waitForFunction(()=>{
    const scene=window.__pt2Game.scene.getScene('campanha');
    return scene?.scene.isActive()&&scene.__torre2ApprovedMapView?.id==='hall-of-fame'&&
     scene.children.list.some(x=>x.active&&x.getData?.('torre2-approved-sevii-departure'));
   },null,{timeout:45000});
   const seviiSave=await page.evaluate(()=>JSON.stringify(window.kanto.readCampaign()));
   const clickPhaser=async what=>{
    // Phaser registers newly created interactive zones on the next input
    // preUpdate. Wait two rendered frames before simulating a human tap;
    // otherwise the test can click a visible but not-yet-registered button.
    // This still dispatches a real mouse/touch event, never invokes a callback.
    await page.evaluate(()=>new Promise(resolve=>
     requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const position=await page.evaluate(goal=>{
     const scene=window.__pt2Game.scene.getScene('campanha');
     let target;
     if(goal.type==='sign'){
      const view=scene.__torre2ApprovedMapView;
      if(view?.id!==goal.from)throw Error('T67 wrong map: '+view?.id+' not '+goal.from);
      target=view.zones.find(z=>z.getData?.('torre2-approved-hotspot')===
       goal.from+':'+goal.label);
     }else{
      target=scene.children.list.find(z=>z.active&&
       z.getData?.(goal.type==='start'?
        'torre2-approved-sevii-departure':'torre2-approved-ferry-destination')===
        (goal.type==='start'?true:goal.label));
     }
     if(!target)throw Error('T67 missing actual Phaser click '+JSON.stringify(goal));
     const bounds=document.querySelector('#juego canvas').getBoundingClientRect();
     const w=Math.min(bounds.width,bounds.height*640/360),
      h=Math.min(bounds.height,bounds.width*360/640);
     return {x:bounds.x+(bounds.width-w)/2+target.x/640*w,
      y:bounds.y+(bounds.height-h)/2+target.y/360*h};
    },what);
    if(mode.isMobile)await page.touchscreen.tap(position.x,position.y);
    else await page.mouse.click(position.x,position.y);
   };
   const verifySave=async label=>{
    const after=await page.evaluate(()=>JSON.stringify(window.kanto.readCampaign()));
    assert.equal(after,seviiSave,'T67 map navigation modified save: '+label);
   };
   const waitMap=async id=>{
    try{
     await page.waitForFunction(target=>{
      const scene=window.__pt2Game.scene.getScene('campanha'),
       view=scene?.__torre2ApprovedMapView;
      return scene?.scene.isActive()&&view?.id===target&&view.image?.active;
     },id,{timeout:25000});
    }catch(error){
     const state=await page.evaluate(target=>{
      const scene=window.__pt2Game.scene.getScene('campanha'),
       map=scene?.__torre2ApprovedMapView;
      const saved=window.kanto.readCampaign();
      return {expected:target,map:map?.id,stage:saved?.stage,champion:saved?.champion,
       ferryOpen:scene.__torre2SeviiFerryOpen,
       loaderBusy:scene.load.isLoading?.(),
       texturePresent:scene.textures.exists('torre2-approved-map-'+target),
       activeSelections:scene.children.list.filter(x=>x.active&&
        x.getData?.('torre2-approved-ferry-destination'))
        .map(x=>({destination:x.getData('torre2-approved-ferry-destination'),x:x.x,y:x.y})),
       currentText:scene.children.list.filter(x=>x.active&&typeof x.text==='string')
        .map(x=>x.text).slice(-14)};
     },id);
     const name='t67-failure-'+id+'-'+mode.name+'.png';
     await page.screenshot({path:path.join(out,name),fullPage:true,animations:'disabled'});
     evidence.errors.push('T67_DIAG '+JSON.stringify(state));
     throw Error('T67 transition timed out: '+JSON.stringify(state)+'; '+error);
    }
    await verifySave(id);
    const name='t67-approved-'+id+'-'+mode.name+'.png';
    await page.screenshot({path:path.join(out,name),fullPage:true,animations:'disabled'});
    evidence.maps.push({id,mode:mode.name,fixture:'Champion stage 13 ONLY',
     screenshot:name,saveUnchanged:true});
   };
   const move=async(from,sign,to)=>{
    await clickPhaser({type:'sign',from,label:sign});
    await waitMap(to);
   };
   const ferry=async(from,to)=>{
    await clickPhaser({type:'sign',from,label:'port'});
    await page.waitForFunction(target=>{
     const scene=window.__pt2Game.scene.getScene('campanha');
     return scene.__torre2SeviiFerryOpen&&
      scene.children.list.some(x=>x.active&&
       x.getData?.('torre2-approved-ferry-destination')===target);
    },to,{timeout:10000});
    await clickPhaser({type:'ferry',label:to});
    await waitMap(to);
   };
   const hallGate=await page.evaluate(()=>{
    const s=window.kanto.readCampaign();
    const scene=window.__pt2Game.scene.getScene('campanha');
    return scene.approvedMapPreview({...s,champion:false},'sevii-1');
   });
   assert.equal(hallGate,false,'T67 must forbid Sevii before a real Champion flag');
   await clickPhaser({type:'start'});
   await waitMap('sevii-1');
   await move('sevii-1','ember','mt-ember');
   await move('mt-ember','island1','sevii-1');
   await ferry('sevii-1','sevii-2');
   await ferry('sevii-2','sevii-3');
   await ferry('sevii-3','sevii-4');
   await move('sevii-4','icefall','icefall-cave');
   await move('icefall-cave','island4','sevii-4');
   await ferry('sevii-4','sevii-5');
   await clickPhaser({type:'sign',from:'sevii-5',label:'warehouse'});
   assert.equal(await page.evaluate(()=>
    window.__pt2Game.scene.getScene('campanha').__torre2ApprovedMapView?.id),
    'sevii-5','T67 must not enter Rocket Warehouse without password');
   await verifySave('protected-rocket');
   await ferry('sevii-5','sevii-6');
   await ferry('sevii-6','sevii-7');
   await move('sevii-7','canyon','sevault-canyon');
   await clickPhaser({type:'sign',from:'sevault-canyon',label:'tanoby'});
   assert.equal(await page.evaluate(()=>
    window.__pt2Game.scene.getScene('campanha').__torre2ApprovedMapView?.id),
    'sevault-canyon','T67 must not enter Tanoby without key');
   await verifySave('protected-tanoby');
   await move('sevault-canyon','island7','sevii-7');
   await move('sevii-7','tower','trainer-tower');
   await clickPhaser({type:'sign',from:'trainer-tower',label:'battle-1'});
   await verifySave('trainer-tower-decorative-battle');
   await move('trainer-tower','exit','sevii-7');
   // T79: controlled Erika first-clear stage (not an earned story win).
   // Keep all existing battle checkpoints; display the ORIGINAL Celadon art,
   // enter its gym by a real interactive door, and audit the 4 native FRLG
   // NPC textures plus the transparent Vileplume PMD Idle sprite.
   await page.evaluate(()=>{
    const core=window.kanto,s=core.readCampaign();
    s.stage=3;s.trainer=0;s.champion=false;s.leagueHonors=[];
    s.badges=['Rocha','Cascata','Trovao'];
    s.pendingWild=null;s.pendingCapture=null;
    core.saveCampaign(s);
    const scene=window.__pt2Game.scene.getScene('campanha');
    scene.__torre2ApprovedReturn=null;
    scene.__torre2ApprovedMapView=null;
    scene.scene.restart({});
   });
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')
    ?.__torre2ApprovedMapView?.id==='vermilion-city',null,{timeout:45000});
   await page.evaluate(async()=>{
    const game=window.__pt2Game,scene=game.scene.getScene('campanha');
    const main=[...document.scripts].find(s=>s.src?.includes('/main.js'))?.src;
    if(!main)throw Error('T79 original Phaser module missing');
    const atlas=await import(new URL('./torre2/torre2-approved-maps-atlas.js',main));
    const entry=atlas.approvedMap('celadon-city');
    if(!entry)throw Error('T79 approved Celadon atlas entry missing');
    const key='torre2-approved-map-celadon-city';
    if(!game.textures.exists(key)){
     await new Promise((resolve,reject)=>{
      let failed=false;
      const onError=file=>{if(file?.key===key)failed=true};
      scene.load.on('loaderror',onError);
      scene.load.once('complete',()=>{
       scene.load.off('loaderror',onError);
       if(failed||!game.textures.exists(key))reject(Error('T79 Celadon art missing'));
       else resolve();
      });
      scene.load.image(key,entry.image);
      scene.load.start();
     });
    }
    if(!scene.approvedMapPreview(window.kanto.readCampaign(),'celadon-city'))
     throw Error('T79 native Phaser refused Celadon preview');
   });
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')
    ?.__torre2ApprovedMapView?.id==='celadon-city',null,{timeout:20000});
   const erikaBefore=await page.evaluate(()=>JSON.stringify(window.kanto.readCampaign()));
   const erikaDoor=await page.evaluate(()=>{
    const scene=window.__pt2Game.scene.getScene('campanha');
    const zone=scene.__torre2ApprovedMapView?.zones?.find(z=>
     z.getData?.('torre2-approved-hotspot')==='celadon-city:gym');
    if(!zone)throw Error('T79 approved Celadon gym door missing');
    const b=document.querySelector('#juego canvas').getBoundingClientRect();
    const w=Math.min(b.width,b.height*640/360),
     h=Math.min(b.height,b.width*360/640);
    return {x:b.x+(b.width-w)/2+zone.x/640*w,
     y:b.y+(b.height-h)/2+zone.y/360*h};
   });
   if(mode.isMobile)await page.touchscreen.tap(erikaDoor.x,erikaDoor.y);
   else await page.mouse.click(erikaDoor.x,erikaDoor.y);
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')
    ?.__torre2ApprovedMapView?.id==='gym-erika',null,{timeout:45000});
   const erikaReport=await page.evaluate(()=>{
    const game=window.__pt2Game,scene=game.scene.getScene('campanha');
    return {
     texture:scene.__torre2ApprovedMapView?.image?.texture?.key,
     leaders:scene.children.list.filter(o=>o.active&&
      o.getData?.('torre2-gym-leader-sprite')==='gym-erika')
      .map(o=>o.texture?.key),
     trainers:scene.children.list.filter(o=>o.active&&
      String(o.getData?.('torre2-gym-trainer-sprite')||'').startsWith('gym-erika:'))
      .map(o=>o.texture?.key),
     aces:scene.children.list.filter(o=>o.active&&
      o.getData?.('torre2-gym-ace')==='gym-erika')
      .map(o=>({key:o.texture?.key,w:o.displayWidth,h:o.displayHeight,
       originY:o.originY,source:o.getData?.('torre2-gym-ace-source')})),
     save:JSON.stringify(window.kanto.readCampaign())
    };
   });
   assert.equal(erikaReport.texture,'torre2-approved-map-gym-erika');
   assert.deepEqual(erikaReport.leaders,['frlg-npc-erika']);
   assert.deepEqual(erikaReport.trainers,[
    'frlg-npc-lass','frlg-npc-beauty',
    'frlg-npc-picnicker','frlg-npc-cooltrainer_f'
   ],'T79 four distinct authentic Grass-gym FRLG NPCs, no Bug Catchers');
   assert.equal(new Set(erikaReport.trainers).size,4);
   assert.equal(erikaReport.aces.length,1);
   assert.equal(erikaReport.aces[0].key,'torre2-gym-ace-idle-0045');
   assert.equal(erikaReport.aces[0].source,'pmd-idle');
   assert.equal(erikaReport.aces[0].originY,26/40,
    'T79 Vileplume must stand on platform using true alpha-visible feet');
   assert.ok(erikaReport.aces[0].w>=35&&erikaReport.aces[0].h>=35);
   assert.equal(erikaReport.save,erikaBefore,
    'T79 walking into Erika gym modified story save');
   const erikaScreenshot='t79-approved-gym-erika-'+mode.name+'.png';
   await page.screenshot({path:path.join(out,erikaScreenshot),
    fullPage:true,animations:'disabled'});
   evidence.maps.push({id:'gym-erika',mode:mode.name,
    via:'T79 real Celadon gym door click/touch + original FRLG NPCs',
    fixture:'Controlled stage three; NOT an actual gym victory',
    aceTexture:erikaReport.aces[0].key,trainers:erikaReport.trainers,
    saveUnchanged:true,screenshot:erikaScreenshot});
   // T74: real native wild encounter persisted after reload. A second
   // 'search' must NEVER replace its species/Shiny or the encounter counter.
   // Deliberately force the 1% Shiny roll for this CONTROLLED test fixture;
   // no test mutation is written to main or a real player's localStorage.
   await page.evaluate(()=>{
    const core=window.kanto,scene=window.__pt2Game.scene.getScene('campanha');
    const s=core.readCampaign();
    // Stage three starts on the ORIGINAL Vermilion image. Stage two
    // starts at Cerulean, so using stage two would test a fake warp.
    s.stage=3;s.trainer=0;s.champion=false;
    s.badges=['Rocha','Cascata','Trovao'];s.leagueHonors=[];
    s.pendingWild=null;s.pendingCapture=null;s.wildEncountersStage=0;
    core.saveCampaign(s);
    scene.__torre2ApprovedReturn=null;
    scene.__torre2ApprovedMapView=null;
    scene.scene.restart({});
   });
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')
    ?.__torre2ApprovedMapView?.id==='vermilion-city',null,{timeout:45000});
   const pending=await page.evaluate(()=>{
    const core=window.kanto,s=core.readCampaign();
    const first=core.startWildEncounter(s,()=>0);
    if(!first.ok)throw Error('T74 first native wild encounter did not start');
    if(first.encounter?.shiny!==true)throw Error('T74 RNG fixture not shiny');
    return {snapshot:JSON.stringify(core.readCampaign()),species:first.encounter.id};
   });
   const second=await page.evaluate(()=>{
    const core=window.kanto,s=core.readCampaign();
    return core.startWildEncounter(s,()=>0.9);
   });
   assert.equal(second.ok,false,'T74 second search replaced pending wild');
   assert.match(second.reason,/Retome a batalha/i);
   assert.equal(await page.evaluate(()=>JSON.stringify(window.kanto.readCampaign())),
    pending.snapshot,'T74 second search changed existing Shiny encounter/save');
   await page.evaluate(()=>{
    const scene=window.__pt2Game.scene.getScene('campanha');
    scene.grassScreen(window.kanto.readCampaign());
   });
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')
    .children.list.some(o=>o.active&&o.getData?.('torre2-grass-resume')===true),
    null,{timeout:20000});
   const resumeShot='t74-shiny-encontro-pendente-'+mode.name+'.png';
   await page.screenshot({path:path.join(out,resumeShot),
    fullPage:true,animations:'disabled'});
   evidence.maps.push({id:'vermilion-city',mode:mode.name,
    via:'T74 saved Shiny encounter + real Phaser grass Resume button',
    fixture:'Shiny RNG forced for QA only; not real random chance',
    screenshot:resumeShot,saveUnchanged:true});
   const target=await page.evaluate(()=>{
    const hit=window.__pt2Game.scene.getScene('campanha').children.list.find(
     o=>o.active&&o.getData?.('torre2-grass-resume')===true);
    const b=document.querySelector('#juego canvas').getBoundingClientRect();
    const w=Math.min(b.width,b.height*640/360),
     h=Math.min(b.height,b.width*360/640);
    return {x:b.x+(b.width-w)/2+hit.x/640*w,
     y:b.y+(b.height-h)/2+hit.y/360*h};
   });
   await page.evaluate(()=>new Promise(resolve=>
    requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   if(mode.isMobile)await page.touchscreen.tap(target.x,target.y);
   else await page.mouse.click(target.x,target.y);
   await page.waitForFunction(()=>window.__pt2Game.scene.isActive('combate'),
    null,{timeout:45000});
   const resumed=await page.evaluate(()=>{
    const game=window.__pt2Game;
    return {payload:game.scene.getScene('combate')?.datos?.torre2,
     saved:JSON.stringify(window.kanto.readCampaign())};
   });
   assert.equal(resumed.payload?.kind,'wild','T74 resumed battle became a trainer');
   assert.equal(resumed.payload?.id,pending.species,'T74 resumed battle replaced species');
   assert.equal(resumed.payload?.encounterCounter,1,
    'T74 resumed encounter lost its durable token');
   assert.equal(resumed.payload?.shiny,true,'T74 resumed encounter lost Shiny state');
   assert.equal(resumed.saved,pending.snapshot,
    'T74 returning to combat unexpectedly changed the saved encounter');
   await page.close();
  }
  assert.deepEqual(evidence.errors,[],'Phaser page errors');
  evidence.ok=true;
 }catch(e){evidence.error=String(e?.stack||e).slice(0,2500);process.exitCode=1}
 finally{
  await fs.writeFile(path.join(out,'approved-map-real-browser-result.json'),JSON.stringify(evidence,null,2));
  if(browser)await browser.close();
  await new Promise(done=>server.close(done));
 }
})();
