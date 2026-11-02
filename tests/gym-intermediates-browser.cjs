/* T19 visual fixture only. No earned trainer wins or personal save touched. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost');
 const target=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!target.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 fs.readFile(target,(err,bytes)=>{
  res.writeHead(err?404:200,{'Content-Type':({'.js':'text/javascript','.html':'text/html',
   '.json':'application/json','.png':'image/png','.webp':'image/webp','.css':'text/css'})[path.extname(target)]||'application/octet-stream'});
  res.end(err?'missing':bytes);
 });
});
(async()=>{
 await new Promise(r=>server.listen(4498,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 const folder='test-evidence/gym-intermediates';fs.mkdirSync(folder,{recursive:true});
 const reports=[];
 try{
  for(const [device,viewport] of [['desktop',{width:1280,height:720}],['mobile',{width:854,height:480}]]){
   for(const [stage,leader,progress,expected,routeCount] of [[0,'brock',9,3,10],[1,'misty',10,4,11]]){
    const page=await browser.newPage({viewport,hasTouch:device==='mobile'});
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    try{
     await page.goto('http://127.0.0.1:4498/arena2d/?original=1',{waitUntil:'domcontentloaded'});
     await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
     await page.evaluate(async({stage,progress})=>{
      const main=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
      const core=await import(new URL('./torre2/campaign-core.js',main));
      window.__t38Core=core;
      const fixture=core.createPlayerCampaign('bulbasaur');
      fixture.stage=stage;fixture.trainer=progress;
      core.saveCampaign(fixture);
      window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
     },{stage,progress});
     await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'),null,{timeout:60000});
     await page.waitForFunction(p=>window.__pt2Game.scene.getScene('campanha')?.__torre2BattlePath?.routeCount===p,routeCount,{timeout:10000});
     const before=await page.evaluate(()=>localStorage.getItem('pokemon-torre-2-kanto-campaign-v1'));
     const routeInfo=await page.evaluate(()=>{
      const s=window.__pt2Game.scene.getScene('campanha');
      const path=s.__torre2BattlePath;
      const nodes=path.nodes.map(n=>({index:n.getData('torre2-path-node'),type:n.getData('torre2-path-type')}));
      return {routeCount:path.routeCount,total:path.total,routeIndices:path.routeIndices,nodes};
     });
     assert.equal(routeInfo.routeCount,routeCount,'route count preserves original battle total');
     assert.equal(routeInfo.nodes.at(-1)?.type,'gym','final route node is a gym building');
     assert.equal(routeInfo.nodes.at(-1)?.index,routeInfo.total);
     assert.ok(routeInfo.nodes.filter(n=>n.type!=='gym').every(n=>routeInfo.routeIndices.includes(n.index)),
      'no gym trainer duplicated on route');
     assert.equal(routeInfo.nodes.some(n=>n.type==='rival'),true,'Rival must remain on route');
     // Trigger the actual Phaser interactive portal; do not call gymScreen directly.
     await page.evaluate(()=>{
      const s=window.__pt2Game.scene.getScene('campanha');
      s.__torre2BattlePath.nodes.at(-1).emit('pointerdown');
     });
     await page.waitForFunction(()=>!!window.__pt2Game.scene.getScene('campanha')?.__torre2GymRoster,null,{timeout:10000});
     await page.waitForTimeout(400);
     const info=await page.evaluate(()=>{
      const s=window.__pt2Game.scene.getScene('campanha');
      const m=s.__torre2GymRoster;
      const zones=s.children.list.filter(o=>o.getData?.('torre2-gym-intermediate-action')!==undefined);
      const npc=s.children.list.filter(o=>o.getData?.('torre2-gym-intermediate')!==undefined);
      const ace=s.__torre2GymAce;
      return{stage:m.stage,routeCount:m.routeCount,gymCount:m.gymCount,slots:m.slots.map(x=>({index:x.index,kind:x.kind,status:x.status,x:x.x,y:x.y})),
       interactiveCount:m.interactiveCount,zoneCount:zones.length,npcCount:npc.length,aceReady:ace?.ready,
       aceSpecies:ace?.species,renderer:s.game.renderer.type,fps:s.game.loop.actualFps,fixtureOnly:true};
     });
     assert.equal(info.renderer,2);
     assert.equal(info.stage,stage);
     assert.equal(info.gymCount,expected);
     assert.equal(info.npcCount,expected,'all authentic FireRed trainer NPCs should render');
     assert.equal(info.interactiveCount,1);
     assert.equal(info.zoneCount,1);
     assert.deepEqual(info.slots.map(x=>x.index),stage===0?[9,10,11]:[10,11,13,14]);
     assert.ok(info.slots.every(x=>x.kind==='trainer'),'Rival/Rocket cannot be gym intermediates');
     assert.ok(info.slots.every(x=>x.y>140&&(x.x<230||x.x>410)),'boss bridge must stay clear');
     assert.equal(await page.evaluate(()=>localStorage.getItem('pokemon-torre-2-kanto-campaign-v1')),before);
     assert.deepEqual(errors,[]);
     const file='gym-'+leader+'-intermediates-'+device+'.png';
     await page.screenshot({path:folder+'/'+file});
     reports.push({...info,device,file});
     // Inject a synthetic canvas TEXTURE as an explicit browser TEST FIXTURE.
     // It is not and must never be presented as finished artistic gym content.
     // The same original Phaser scene must draw NPCs, ace and buttons above it.
     const imageProof=await page.evaluate(({stage,leader})=>{
      const c=window.__pt2Game.scene.getScene('campanha');
      const key='torre2-gym-scene-'+leader;
      const canvas=document.createElement('canvas');
      canvas.width=640;canvas.height=360;
      const ctx=canvas.getContext('2d');
      ctx.fillStyle=stage===0?'#62523c':'#175e83';ctx.fillRect(0,0,640,360);
      ctx.fillStyle=stage===0?'#b99e78':'#55b6c3';ctx.fillRect(66,68,508,200);
      ctx.fillStyle=stage===0?'#e5cf9f':'#e5e0c1';ctx.fillRect(244,87,152,55);
      c.textures.addCanvas(key,canvas);
      c.cache.json.remove('torre2-approved-gym-scenes-v1');
      c.cache.json.add('torre2-approved-gym-scenes-v1',{version:1,scenes:[{
       stage,slug:leader,key,path:'assets/ui/gym-interiors/'+leader+'-interior.png',
       width:640,height:360,sha256:'a'.repeat(64)
      }]});
      c.gymScreen(window.__t38Core.readCampaign());
      const bg=c.__torre2GymImage;
      const npc=c.children.list.filter(o=>o.getData?.('torre2-gym-intermediate')!==undefined);
      const zones=c.children.list.filter(o=>o.getData?.('torre2-gym-intermediate-action')!==undefined);
      const ctrls=c.children.list.filter(o=>o.input?.enabled&&o.width>=180&&o.y>=290);
      return {rendered:!!bg,source:bg?.slug,depth:bg?.image?.depth,
       backgroundCount:c.children.list.filter(o=>
        o.getData?.('torre2-gym-image-background')!==undefined).length,
       npcCount:npc.length,zoneCount:zones.length,
       leader:!!c.__torre2GymAce?.leaderSprite,
       aceSpecies:c.__torre2GymAce?.species,ctaCount:ctrls.length,
       status:c.__torre2GymRoster?.imageOverlay,
       renderer:c.game.renderer.type};
     },{stage,leader});
     assert.equal(imageProof.rendered,true,'one-image gym mode must be active');
     assert.equal(imageProof.source,leader);
     assert.equal(imageProof.depth,2.4,'background behind native buttons');
     assert.equal(imageProof.backgroundCount,1,'one image, no polygon room');
     assert.equal(imageProof.npcCount,expected);
     assert.equal(imageProof.zoneCount,1);
     assert.equal(imageProof.leader,true);
     assert.equal(imageProof.aceSpecies,leader==='brock'?'onix':'starmie');
     assert.equal(imageProof.status,true);
     assert.equal(imageProof.renderer,2);
     assert.equal(await page.evaluate(()=>localStorage.getItem('pokemon-torre-2-kanto-campaign-v1')),before,
      'switching to one raster backdrop must not modify save');
     assert.deepEqual(errors,[],'image mode must not generate Phaser runtime errors');
     const fixtureFile='TEST-FIXTURE-only-gym-image-'+leader+'-'+device+'.png';
     await page.screenshot({path:folder+'/'+fixtureFile});
     reports.push({stage,leader,device,fixtureOnly:true,
      imageProof,fixtureFile});

    }catch(error){
     await page.screenshot({path:folder+'/failure-'+leader+'-'+device+'.png'}).catch(()=>{});
     fs.writeFileSync(folder+'/failure-'+leader+'-'+device+'.json',JSON.stringify({error:String(error),errors},null,2));
     throw error;
    }finally{await page.close()}
   }
  }
  fs.writeFileSync(folder+'/report.json',JSON.stringify(reports,null,2));
  console.log('PASS T19 four REAL Phaser/WebGL screenshots, no new battles, save unchanged');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
