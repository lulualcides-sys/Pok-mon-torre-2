/* Real Phaser/WebGL mouse and touch UI regression. Stage is a visual fixture,
 * not evidence of earned badges or campaign victories. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost'),p=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!p.startsWith(root+path.sep)){res.writeHead(403);return res.end()}
 fs.readFile(p,(err,b)=>{res.writeHead(err?404:200,{'Content-Type':({'.js':'text/javascript','.html':'text/html','.json':'application/json','.png':'image/png','.webp':'image/webp','.css':'text/css'})[path.extname(p)]||'application/octet-stream'});res.end(err?'missing':b)});
});
(async()=>{
 await new Promise(r=>server.listen(4497,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 fs.mkdirSync('test-evidence',{recursive:true});
 try{
  for(const [label,viewport]of [['desktop',{width:1280,height:720}],['mobile',{width:854,height:480}]]){
   const page=await browser.newPage({viewport,hasTouch:label==='mobile'}),errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   try{
   const click=async(x,y)=>{
    const p=await page.evaluate(([x,y])=>{const r=document.querySelector('#juego canvas').getBoundingClientRect();return{x:r.x+x*r.width/640,y:r.y+y*r.height/360}},[x,y]);
    if(label==='mobile')await page.touchscreen.tap(p.x,p.y);else await page.mouse.click(p.x,p.y,{delay:120});
    await page.waitForTimeout(220);
   };
   const named=async(key,value)=>{const p=await page.evaluate(([key,value])=>{const s=window.__pt2Game.scene.getScene('campanha'),o=s.children.list.find(o=>o.active&&o.input?.enabled&&o.getData?.(key)===value);if(!o)throw Error('Missing '+key+' '+value);return[o.x,o.y]},[key,value]);await click(...p)};
   const city=()=>page.waitForFunction(()=>{const s=window.__pt2Game?.scene.getScene('campanha');return s?.scene.isActive()&&s.children.list.some(o=>o.getData?.('torre2-city-layer')==='terrain')},null,{timeout:60000});
   await page.goto('http://127.0.0.1:4497/arena2d/?original=1');
   await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
   await page.evaluate(async()=>{
    const main=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
    const core=await import(new URL('./torre2/campaign-core.js',main));
    const s=core.createPlayerCampaign('bulbasaur');s.stage=1;s.trainer=2;
    s.team=['bulbasaur','charmander','squirtle','bulbasaur','charmander','squirtle'].map((id,i)=>({
     ...core.createPlayerCampaign(id).team[0],uid:'city-ui-fixture-'+i}));
    core.saveCampaign(s);window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
   });
   // Route remains the default on entering Cerulean, even in the visual branch.
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')
    .__torre2BattlePath?.stage===1,null,{timeout:60000});
   await named('torre2-open-city',true);
   await city();await page.waitForTimeout(500);
   const before=await page.evaluate(()=>localStorage.getItem('pokemon-torre-2-kanto-campaign-v1'));
   const report=await page.evaluate(()=>{const s=window.__pt2Game.scene.getScene('campanha');return{...s.__torre2CityHub,renderer:s.game.renderer.type,objects:s.children.length}});
   assert.equal(report.renderer,2,'actual WebGL renderer');assert.equal(report.walking,false);
   assert.deepEqual(report.hotspots.map(x=>x.id),['center','mart','gym']);
   const pieces=await page.evaluate(()=>window.__pt2Game.scene.getScene('campanha').children.list
    .filter(o=>o.getData?.('torre2-city-atlas-piece')).map(o=>o.getData('torre2-city-atlas-piece')));
   for(const name of ['center','gym','mart','house','tree','planter'])assert.ok(pieces.includes(name),'Missing cropped atlas piece '+name);
   await page.screenshot({path:'test-evidence/city-layered-'+label+'.png'});
   await click(123,128); // Actual atlas door, independent of the label zone.
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha').children.list.some(o=>o.getData?.('torre2-center-pc')));
   await named('torre2-center-pc',true);
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha').children.list.some(o=>o.getData?.('torre2-pc-team-index')===0));
   await click(549,21);await city();
   await click(103,230);
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha').children.list.some(o=>o.getData?.('torre2-mart-buy')==='pokeball'));
   await click(120,315);await city();
   await click(515,134);
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha').children.list.some(o=>o.text?.includes('FALTAM 13')));
   await click(320,306);await city();
   await named('torre2-city-action','EQUIPE');
   await named('torre2-summary-back',true);await city();
   await named('torre2-city-action','MAIS EQUIPE');
   await named('torre2-city-member',5);
   await named('torre2-summary-back',true);await city();
   await named('torre2-city-action','INSÍGNIAS');
   await named('torre2-badge-case-back',true);await city();
   assert.equal(await page.evaluate(()=>localStorage.getItem('pokemon-torre-2-kanto-campaign-v1')),before,'navigation cannot mutate save');
   // Native route/city roundtrip must not change saves or leak water timers.
   await named('torre2-city-action','ROTAS');
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')
    .__torre2BattlePath?.stage===1,null,{timeout:12000});
   await named('torre2-open-city',true);await city();
   assert.equal(await page.evaluate(()=>localStorage.getItem('pokemon-torre-2-kanto-campaign-v1')),
    before,'route/city navigation must preserve the exact saved bytes');
   await page.waitForTimeout(250);
   const timers=await page.evaluate(()=>{
    const clock=window.__pt2Game.scene.getScene('campanha').time;
    // Phaser Clock has no getAllEvents(): inspect its real event queues.
    if(!Array.isArray(clock._active)||!Array.isArray(clock._pendingInsertion))
     throw Error('Phaser Clock event queues unavailable; cannot verify cleanup');
    const pendingRemoval=new Set(clock._pendingRemoval||[]);
    const active=[...clock._active,...clock._pendingInsertion]
     .filter(e=>e.loop&&!e.pendingDelete&&!pendingRemoval.has(e));
    return {allLoops:active.length,
     cityWaterLoops:active.filter(e=>e.__torre2CityWaterTimer===true).length};
   });
   // The original campaign legitimately runs other Phaser timers. Only
   // the water animation belongs to this view: after route -> city there
   // must be exactly one, regardless of unrelated engine/game events.
   assert.equal(timers.cityWaterLoops,1,
    'route/city roundtrip leaked native water timers: '+JSON.stringify(timers));
   // Exercise the real result-consumption lifecycle, with no cached atlas.
   // Only the battle outcome is a fixture; create() must earn stage 1 itself.
   await page.evaluate(async()=>{
    const main=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
    const core=await import(new URL('./torre2/campaign-core.js',main));
    const scene=window.__pt2Game.scene.getScene('campanha');
    const state=core.createPlayerCampaign('bulbasaur');
    state.trainer=core.TRAINERS_PER_GYM(0);core.saveCampaign(state);
    scene.scene.restart();
   });
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha').__torre2BattlePath?.stage===0,null,{timeout:60000});
   await page.evaluate(()=>{
    const scene=window.__pt2Game.scene.getScene('campanha');
    if(scene.textures.exists('torre2-city-atlas-v1'))throw Error('Pewter retained city atlas');
    const state=JSON.parse(localStorage.getItem('pokemon-torre-2-kanto-campaign-v1'));
    scene.scene.restart({finished:true,won:true,marker:{stage:0,trainer:state.trainer}});
   });
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha').children.list
    .some(o=>o.getData?.('torre2-report-continue')),null,{timeout:60000});
   await named('torre2-report-continue',true);
   await named('torre2-open-city',true);await city();
   assert.equal(await page.evaluate(()=>window.__pt2Game.scene.getScene('campanha').children.list
    .filter(o=>o.getData?.('torre2-city-atlas-piece')==='gym').length),1,
    'first Brock victory must display the atlas without a second restart');
   await page.screenshot({path:'test-evidence/city-layered-'+label+'-first-arrival.png'});
   // Current trainer 4 is near the Mart but must launch the native battle.
   await page.evaluate(async()=>{
    const main=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
    const core=await import(new URL('./torre2/campaign-core.js',main));
    const state=core.readCampaign();state.trainer=4;core.saveCampaign(state);
    window.__pt2Game.scene.getScene('campanha').renderCampaign(state);
   });
   // renderCampaign queues new interactive objects until the next Phaser step.
   await page.evaluate(()=>new Promise(resolve=>window.__pt2Game.events.once('poststep',
    ()=>window.__pt2Game.events.once('poststep',resolve))));
   await click(218,196);
   await page.waitForFunction(()=>window.__pt2Game.scene.isActive('combate'),null,{timeout:60000});
   await page.waitForTimeout(1500);
   await page.screenshot({path:'test-evidence/city-layered-'+label+'-battle-entry.png'});
   assert.deepEqual(errors,[]);
   fs.writeFileSync('test-evidence/city-layered-'+label+'.json',JSON.stringify({...report,timers,errors,fixture:true},null,2));
   console.log(label+' city WebGL + Center/PC/Mart/gym/summary/badges passed');
   }catch(error){
    await page.screenshot({path:'test-evidence/city-layered-'+label+'-failure.png'});
    const scene=await page.evaluate(()=>{const s=window.__pt2Game.scene.getScene('campanha');return {active:s.scene.isActive(),path:s.__torre2BattlePath,city:s.__torre2CityHub,interactive:s.children.list.filter(o=>o.input?.enabled).map(o=>({x:o.x,y:o.y,w:o.width,h:o.height,depth:o.depth,data:o.data?.values}))}});
    fs.writeFileSync('test-evidence/city-layered-'+label+'-failure.json',JSON.stringify({error:String(error),errors,scene},null,2));
    throw error;
   }finally{await page.close();}
  }
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
