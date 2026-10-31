/* Native Phaser/WebGL evidence only: fixture stage/trainer values are NOT earned wins.
 * Tests the real rendered scene, input zones, ace texture, and untouched save bytes.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost');
 const p=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!p.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 fs.readFile(p,(err,b)=>{
  res.writeHead(err?404:200,{'Content-Type':({
   '.js':'text/javascript','.html':'text/html','.json':'application/json',
   '.png':'image/png','.webp':'image/webp','.css':'text/css'
  })[path.extname(p)]||'application/octet-stream'});
  res.end(err?'missing':b);
 });
});
async function main(){
 await new Promise(r=>server.listen(4508,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
   '--use-gl=angle','--use-angle=swiftshader']});
 fs.mkdirSync('test-evidence',{recursive:true});
 try{
  for(const [device,viewport] of [['desktop',{width:1280,height:720}],
                                   ['mobile',{width:854,height:480}]]){
   for(const [stage,trainer,ace,leader,routeCount] of [
    [0,10,'onix','Brock',10],[1,11,'starmie','Misty',11]]){
    const name='gym-ace-'+(stage===0?'brock':'misty')+'-'+device;
    const page=await browser.newPage({viewport,hasTouch:device==='mobile'}),errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    try{
     await page.goto('http://127.0.0.1:4508/arena2d/?original=1');
     await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
     await page.evaluate(async input=>{
      const src=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
      const core=await import(new URL('./torre2/campaign-core.js',src));
      const state=core.createPlayerCampaign('bulbasaur');
      state.stage=input.stage;state.trainer=input.trainer;
      core.saveCampaign(state);
      window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
     },{stage,trainer});
     await page.waitForFunction(s=>{
      const c=window.__pt2Game?.scene.getScene('campanha');
      return c?.__torre2BattlePath?.stage===s;
     },stage,{timeout:60000});
     const before=await page.evaluate(()=>localStorage.getItem('pokemon-torre-2-kanto-campaign-v1'));
     const target=await page.evaluate(()=>{
      const c=window.__pt2Game.scene.getScene('campanha');
      const o=c.children.list.find(x=>x.active&&x.input?.enabled&&x.getData?.('torre2-central-cta')===true);
      if(!o)throw Error('Missing native route CTA');
      const r=document.querySelector('#juego canvas').getBoundingClientRect();
      return{x:r.x+o.x*r.width/640,y:r.y+o.y*r.height/360};
     });
     if(device==='mobile')await page.touchscreen.tap(target.x,target.y);
     else await page.mouse.click(target.x,target.y,{delay:100});
     await page.waitForFunction(s=>{
      const c=window.__pt2Game.scene.getScene('campanha');
      return c?.__torre2GymInterior?.stage===s;
     },stage,{timeout:12000});
     await page.waitForTimeout(600);
     const report=await page.evaluate(()=>{
      const c=window.__pt2Game.scene.getScene('campanha'),m=c.__torre2GymInterior;
      const ace=c.children.list.find(o=>o.getData?.('torre2-gym-ace')===m.ace);
      const shadow=c.children.list.find(o=>o.getData?.('torre2-gym-ace-shadow')===m.ace);
      const leader=c.children.list.find(o=>o.getData?.('torre2-gym-leader')===m.leader);
      const zones=c.children.list.filter(o=>o.input?.enabled&&o.getData?.('torre2-gym-trainer-action')!==undefined);
      return{renderer:c.game.renderer.type,stage:m.stage,ace:m.ace,
       aceRendered:m.aceRendered,leaderRendered:m.leaderRendered,aceTexture:ace?.texture?.key,
       aceBounds:ace?.getBounds?.().toJSON?.(),shadow:!!shadow,leader:!!leader,
       gymCount:m.gymCount,routeCount:m.routeCount,trainerIndices:m.trainers.map(t=>t.index),
       rivalIdentities:m.trainers.filter(t=>t.kind==='rival').map(t=>t.identity),
       trainerTouchZones:zones.length,leaderReady:m.leaderReady};
     });
     assert.equal(report.renderer,2,'must render using actual WebGL');
     assert.equal(report.ace,ace);assert.equal(report.aceRendered,true,'ace texture missing');
     assert.equal(report.leaderRendered,true,'leader sprite missing');
     assert.equal(report.shadow,true,'ace shadow missing');
     assert.equal(report.leader,true,'leader missing');
     assert.equal(report.aceTexture?.startsWith('torre2-portrait-'),true);
     assert.equal(report.gymCount,stage===0?3:4);
     assert.equal(report.routeCount,routeCount);
     assert.equal(report.trainerTouchZones,1,'exactly current trainer must be touchable');
     assert.equal(report.leaderReady,false,'leader must remain locked');
     assert.deepEqual(errors,[]);
     await page.screenshot({path:'test-evidence/'+name+'.png'});
     const back=await page.evaluate(()=>{
      const c=window.__pt2Game.scene.getScene('campanha');
      const o=c.children.list.find(x=>x.active&&x.input?.enabled&&x.getData?.('torre2-gym-back')===true);
      if(!o)throw Error('Missing gym back');
      const r=document.querySelector('#juego canvas').getBoundingClientRect();
      return{x:r.x+o.x*r.width/640,y:r.y+o.y*r.height/360};
     });
     if(device==='mobile')await page.touchscreen.tap(back.x,back.y);
     else await page.mouse.click(back.x,back.y,{delay:100});
     await page.waitForFunction(s=>window.__pt2Game.scene.getScene('campanha').__torre2BattlePath?.stage===s,
      stage,{timeout:12000});
     const after=await page.evaluate(()=>localStorage.getItem('pokemon-torre-2-kanto-campaign-v1'));
     assert.equal(after,before,'gym navigation must preserve raw save byte for byte');
     fs.writeFileSync('test-evidence/'+name+'.json',JSON.stringify({
      ...report,fixture:true,saveBytesPreserved:true,errors},null,2));
     console.log('PASS '+name+' real WebGL ace and route return');
    }catch(e){
     await page.screenshot({path:'test-evidence/'+name+'-failure.png'}).catch(()=>{});
     fs.writeFileSync('test-evidence/'+name+'-failure.json',JSON.stringify({error:String(e),errors},null,2));
     throw e;
    }finally{await page.close();}
   }
  }
 }finally{await browser.close();server.close();}
}
main().catch(e=>{console.error(e);server.close();process.exitCode=1;});
