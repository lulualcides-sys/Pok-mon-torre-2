'use strict';
/* Real Chromium/Phaser WebGL screenshots of Atlas-inspired UI.
 * Uses controlled saves strictly as VIEW FIXTURES, never claims battle wins.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const fsp=require('node:fs/promises');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const types={'.js':'text/javascript','.html':'text/html','.json':'application/json',
 '.png':'image/png','.webp':'image/webp','.css':'text/css'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1');
 const p=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!p.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const b=await fsp.readFile(p);res.writeHead(200,{'Content-Type':types[path.extname(p)]||'application/octet-stream'});res.end(b)}
 catch{res.writeHead(404);res.end('missing')}
});
const out=path.resolve('test-evidence/atlas-premium');
async function frame(page){await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))}
(async()=>{
 await new Promise(r=>server.listen(4544,'127.0.0.1',r));
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 const reports=[];
 try{
  for(const [device,viewport] of [['desktop',{width:1280,height:720}],['mobile',{width:854,height:480}]]){
   const page=await browser.newPage({viewport,hasTouch:device==='mobile'});
   const errors=[];page.on('pageerror',e=>errors.push(String(e)));
   await page.goto('http://127.0.0.1:4544/arena2d/?original=1',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
   await page.evaluate(async()=>{
    const script=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
    window.__atlasCore=await import(new URL('./torre2/campaign-core.js',script));
    const state=__atlasCore.createCampaign('bulbasaur');
    state.stage=0;state.trainer=0;state.badges=[];
    __atlasCore.saveCampaign(state);
    window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
   });
   await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')?.__torre2BattlePath,null,{timeout:45000});
   const before=await page.evaluate(()=>localStorage.getItem('pokemon-torre-2-kanto-campaign-v1'));
   const screenshot=async name=>{
    await frame(page);
    await page.screenshot({path:path.join(out,name+'-'+device+'.png')});
    reports.push({name,device,source:'original Phaser/WebGL',fixtureOnly:true});
   };
   const activate=async(method,args=[])=>{
    await page.evaluate(({method,args})=>{
     const s=window.__pt2Game.scene.getScene('campanha');
     const state=window.__atlasCore.readCampaign();
     s[method](state,...args);
    },{method,args});
    await frame(page);
   };
   await activate('badgeCaseScreen',[0]);
   const badge=await page.evaluate(()=>{
    const s=window.__pt2Game.scene.getScene('campanha');
    return {view:s.__torre2BadgeCase,
     sprites:s.children.list.filter(o=>o.getData?.('torre2-badge-sprite')!==undefined).length,
     zones:s.children.list.filter(o=>o.getData?.('torre2-badge-index')!==undefined).length,
     renderer:s.game.renderer.type};
   });
   assert.equal(badge.sprites,9); // 8 tiles plus enlarged selected badge
   assert.equal(badge.zones,8);
   assert.equal(badge.renderer,2);
   assert.equal(badge.view.artVersion,'kanto-atlas-premium-20261101-v1');
   await screenshot('badges');
   await activate('badgeCaseScreen',[7]);
   assert.equal(await page.evaluate(()=>window.__pt2Game.scene.getScene('campanha').__torre2BadgeCase.selected),7);
   await activate('martScreen');
   const mart=await page.evaluate(()=>window.__pt2Game.scene.getScene('campanha').__torre2AtlasMart);
   assert.equal(mart.artVersion,'kanto-atlas-premium-20261101-v1');
   assert.ok(mart.rows.length>0);
   await screenshot('mart');
   await activate('showSummary',[0]);
   const summary=await page.evaluate(()=>{
    const s=window.__pt2Game.scene.getScene('campanha');
    return {shield:s.children.list.some(o=>o.getData?.('torre2-summary-input-shield')===true),
    back:s.children.list.some(o=>o.getData?.('torre2-summary-back')===true)};
   });
   assert.ok(summary.shield&&summary.back);
   await screenshot('summary');
   await activate('atlasDossierScreen',[0]);
   const dossier=await page.evaluate(()=>{
    const s=window.__pt2Game.scene.getScene('campanha');
    return {data:s.__torre2AtlasDossier,
     back:s.children.list.some(o=>o.getData?.('torre2-atlas-dossier-back')===true),
     moves:s.children.list.some(o=>o.getData?.('torre2-atlas-dossier-moves')===true)};
   });
   assert.equal(dossier.data.species,'bulbasaur');
   assert.equal(dossier.data.level,5);
   assert.ok(dossier.back&&dossier.moves);
   await screenshot('dossier');

   await activate('gymScreen');
   const gym=await page.evaluate(()=>{
    const s=window.__pt2Game.scene.getScene('campanha');
    return {model:s.__torre2AtlasGym,ace:s.children.list.some(o=>o.getData?.('torre2-atlas-ace')==='onix'),
      challenge:s.children.list.some(o=>o.getData?.('torre2-atlas-gym-challenge')===true)};
   });
   assert.equal(gym.model.leader,'Brock');
   assert.equal(gym.model.ready,false,'leader remains locked');
   assert.ok(gym.ace,'native Onix PMD portrait must be loaded');
   assert.ok(gym.challenge);
   await screenshot('gym-brock');
   if(device==='desktop'){
    for(let stage=8;stage<=12;stage++){
     await page.evaluate(stage=>{
      const s=window.__pt2Game.scene.getScene('campanha');
      const state=window.__atlasCore.readCampaign();
      s.gymScreen({...state,stage,trainer:0});
     },stage);
     await frame(page);
     const m=await page.evaluate(()=>window.__pt2Game.scene.getScene('campanha').__torre2AtlasGym);
     assert.equal(m.stageIndex,stage);
     assert.equal(m.isLeague,true);
     await screenshot('league-'+stage);
    }
   }
   assert.equal(await page.evaluate(()=>localStorage.getItem('pokemon-torre-2-kanto-campaign-v1')),before,
    'all presentations are read-only');
   assert.deepEqual(errors,[],'no Javascript errors in Phaser');
   await page.close();
  }
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(reports,null,2));
  console.log('PASS: Atlas original Phaser/WebGL desktop/mobile, native sprites, dynamic saves unchanged',reports.length,'screenshots');
 }finally{await browser.close();server.close()}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
