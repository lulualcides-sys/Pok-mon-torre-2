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
       scene.load.image(key,entry.image);
       scene.load.start();
      });
     }
     const state=window.kanto.readCampaign();
     if(!scene.approvedMapPreview(state,id))throw Error('Phaser rejected approved preview: '+id);
     const view=scene.__torre2ApprovedMapView;
     const aces=scene.children.list.filter(x=>x.active&&x.getData?.('torre2-gym-ace')===id)
      .map(x=>({texture:x.texture?.key,w:x.displayWidth,h:x.displayHeight}));
     return {id,texture:view.image.texture.key,hotspots:view.zones.length,
      rect:view.rect,aces,fps:game.loop.actualFps,stage:state.stage};
    },id);
    assert.equal(info.texture,'torre2-approved-map-'+id);
    assert.ok(info.rect.width>=639.9&&info.rect.height>=359.9,id+' must be 16:9');
    if(id==='gym-brock'||id==='gym-misty')
     assert.equal(info.aces.length,1,id+' must show the real ace portrait');
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
   // T63: controlled stage-three fixture after Lt. Surge — must start in
   // Vermilion, traverse the original Route 9 solo before Route 10, and
   // never mutate battle saves by simply clicking painted map signs.
   const gotoStage=async(expected,number)=>{
    await page.evaluate(stage=>{
     const s=window.kanto.readCampaign();s.stage=stage;
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
     if(mode.isMobile)await page.touchscreen.tap(position.x,position.y);
     else await page.mouse.click(position.x,position.y);
     await page.waitForFunction(target=>window.__pt2Game.scene.getScene('campanha')
      ?.__torre2ApprovedMapView?.id===target,to,{timeout:25000});
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
    await page.waitForFunction(target=>{
     const scene=window.__pt2Game.scene.getScene('campanha'),
      view=scene?.__torre2ApprovedMapView;
     return scene?.scene.isActive()&&view?.id===target&&view.image?.active;
    },id,{timeout:25000});
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
