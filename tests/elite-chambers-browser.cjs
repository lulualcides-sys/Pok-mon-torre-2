/* T38: real Phaser/WebGL room screenshots from isolated League-stage
 * fixtures. Fixtures DO NOT earn victories, badges or modify a user's save.
 */
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
 await new Promise(resolve=>server.listen(4499,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
   '--use-gl=angle','--use-angle=swiftshader']});
 const folder='test-evidence/elite-chambers';fs.mkdirSync(folder,{recursive:true});
 const reports=[];
 try{
  for(const [device,viewport] of [['desktop',{width:1280,height:720}],['mobile',{width:854,height:480}]]){
   for(const [stage,leader] of [[8,'Lorelei'],[9,'Bruno'],[10,'Agatha'],[11,'Lance'],[12,'Rival']]){
    const page=await browser.newPage({viewport,hasTouch:device==='mobile'});
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    try{
     await page.goto('http://127.0.0.1:4499/arena2d/?original=1',{waitUntil:'domcontentloaded'});
     await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
     await page.evaluate(async stage=>{
      const main=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
      const core=await import(new URL('./torre2/campaign-core.js',main));
      const fixture=core.createPlayerCampaign('bulbasaur');
      fixture.stage=stage;
      fixture.trainer=core.TRAINERS_PER_GYM(stage);
      core.saveCampaign(fixture);
      window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
     },stage);
     await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'),null,{timeout:60000});
     await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')?.__torre2BattlePath?.nodes?.length>0,null,{timeout:10000});
     const before=await page.evaluate(()=>localStorage.getItem('pokemon-torre-2-kanto-campaign-v1'));
     // Use the native route portal, not an internal call to gymScreen().
     await page.evaluate(()=>{
      const scene=window.__pt2Game.scene.getScene('campanha');
      scene.__torre2BattlePath.nodes.at(-1).emit('pointerdown');
     });
     await page.waitForFunction(()=>!!window.__pt2Game.scene.getScene('campanha')?.__torre2EliteChamber,null,{timeout:12000});
     await page.waitForTimeout(350);
     const info=await page.evaluate(()=>{
      const scene=window.__pt2Game.scene.getScene('campanha');
      return {...scene.__torre2EliteChamber,renderer:scene.game.renderer.type,
       fps:scene.game.loop.actualFps,
       leaderSprites:scene.children.list.filter(o=>o.getData?.('torre2-elite-opponent')!==undefined).length,
       playerSprites:scene.children.list.filter(o=>o.getData?.('torre2-elite-player')===true).length,
       fixtureOnly:true};
     });
     assert.equal(info.renderer,2,'native WebGL');
     assert.equal(info.stage,stage);
     assert.equal(info.leader,leader);
     assert.equal(info.cameraZoom,1);
     assert.equal(info.leaderSprite,true);
     assert.equal(info.playerSprite,true);
     assert.equal(info.leaderSprites,1);
     assert.equal(info.playerSprites,1);
     assert.ok(info.nativeTiles>0,'native Indigo source pixels are present');
     assert.equal(await page.evaluate(()=>localStorage.getItem('pokemon-torre-2-kanto-campaign-v1')),before,
      'visual room and portal cannot mutate the campaign save');
     assert.deepEqual(errors,[]);
     const file='elite-'+leader.toLowerCase()+'-'+device+'.png';
     await page.screenshot({path:folder+'/'+file});
     reports.push({...info,device,file});
    }catch(error){
     await page.screenshot({path:folder+'/failure-'+leader.toLowerCase()+'-'+device+'.png'}).catch(()=>{});
     fs.writeFileSync(folder+'/failure-'+leader.toLowerCase()+'-'+device+'.json',
      JSON.stringify({error:String(error),errors},null,2));
     throw error;
    }finally{await page.close()}
   }
  }
  fs.writeFileSync(folder+'/report.json',JSON.stringify(reports,null,2));
  console.log('PASS T38 10 real Phaser/WebGL League room captures, save unchanged');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
