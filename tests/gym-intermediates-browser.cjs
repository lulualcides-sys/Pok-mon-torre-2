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
   for(const [stage,leader,progress,expected] of [[0,'brock',10,3],[1,'misty',11,4]]){
    const page=await browser.newPage({viewport,hasTouch:device==='mobile'});
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    try{
     await page.goto('http://127.0.0.1:4498/arena2d/?original=1',{waitUntil:'domcontentloaded'});
     await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
     await page.evaluate(async({stage,progress})=>{
      const main=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
      const core=await import(new URL('./torre2/campaign-core.js',main));
      const fixture=core.createPlayerCampaign('bulbasaur');
      fixture.stage=stage;fixture.trainer=progress;
      core.saveCampaign(fixture);
      window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
     },{stage,progress});
     await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'),null,{timeout:60000});
     await page.waitForFunction(p=>window.__pt2Game.scene.getScene('campanha')?.__torre2BattlePath?.routeCount===p,progress,{timeout:10000});
     const before=await page.evaluate(()=>localStorage.getItem('pokemon-torre-2-kanto-campaign-v1'));
     const routeInfo=await page.evaluate(()=>{
      const s=window.__pt2Game.scene.getScene('campanha');
      const path=s.__torre2BattlePath;
      const nodes=path.nodes.map(n=>({index:n.getData('torre2-path-node'),type:n.getData('torre2-path-type')}));
      return {routeCount:path.routeCount,total:path.total,nodes};
     });
     assert.equal(routeInfo.routeCount,progress,'route ends at gym entrance');
     assert.equal(routeInfo.nodes.at(-1)?.type,'gym','final route node is a gym building');
     assert.equal(routeInfo.nodes.at(-1)?.index,progress);
     assert.ok(routeInfo.nodes.every(n=>n.index<=progress),'no intermediate trainer duplicated on route');
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
     assert.deepEqual(info.slots.map(x=>x.index),Array.from({length:expected},(_,i)=>progress+i));
     assert.ok(info.slots.every(x=>x.x<200||x.x>440),'boss bridge must stay clear');
     assert.equal(await page.evaluate(()=>localStorage.getItem('pokemon-torre-2-kanto-campaign-v1')),before);
     assert.deepEqual(errors,[]);
     const file='gym-'+leader+'-intermediates-'+device+'.png';
     await page.screenshot({path:folder+'/'+file});
     reports.push({...info,device,file});
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
