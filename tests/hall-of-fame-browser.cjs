'use strict';
// Real Phaser Champion team, battle transitions, report, Hall of Fame and reload.
// Uses forced native KOs to shorten the test; NOT evidence of unassisted victory.
const assert=require('node:assert/strict'),fs=require('node:fs'),fsp=require('node:fs/promises');
const path=require('node:path'),http=require('node:http'),{chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp',
 '.svg':'image/svg+xml','.woff2':'font/woff2','.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1');
 const f=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!f.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const b=await fsp.readFile(f);res.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});res.end(b)}
 catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(ok=>server.listen(4301,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 async function clickTagged(tag){
  const p=await page.evaluate(tag=>{
   const s=window.__pt2Game.scene.getScene('campanha');
   const z=s.children.list.find(o=>o.active&&o.input?.enabled&&o.getData?.(tag)===true);
   if(!z)throw Error('Hall click-zone missing: '+tag);
   const r=document.querySelector('#juego canvas').getBoundingClientRect();
   return {x:r.x+z.x*r.width/640,y:r.y+z.y*r.height/360};
  },tag);
  await page.mouse.click(p.x,p.y);
 }
 try{
  await page.goto('http://127.0.0.1:4301/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:45000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=window.__testKantoCore=await import(new URL('./torre2/campaign-core.js',src));
   const s=core.createCampaign('bulbasaur');
   s.stage=12;s.trainer=0;s.active=1;
   s.badges=core.GYMS.map(g=>g.badge);
   s.leagueHonors=core.ELITE.slice(0,4).map(e=>e.badge);
   core.saveCampaign(s);
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'),null,{timeout:45000});
  await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   c.enterBattle(window.__testKantoCore.readCampaign());
  });
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.__torre2PartyInstalled&&b.fase==='lucha'
  },null,{timeout:45000});
  const enemy=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   b.controles.forEach(c=>{c.leer=()=>null});
   b.__torre2TrainerStrategy.enabled=false;
   return b.datos.torre2.party.foes.map(m=>m.id);
  });
  assert.equal(enemy.length,6,'Champion must fight with six Pokémon in native Phaser');
  console.log('CHAMPION_REAL_RENDERED_TEAM',JSON.stringify(enemy));
  for(let i=0;i<enemy.length;i++){
   await page.waitForFunction(index=>{
    const b=window.__pt2Game.scene.getScene('combate');
    return b.scene.isActive()&&b.fase==='lucha'&&!b.__torre2Changing&&
     b.datos.torre2.party.enemyIndex===index;
   },i,{timeout:25000});
   const actual=await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate');
    const e=b.luchadores[1];
    return {id:b.datos.torre2.party.foes[b.datos.torre2.party.enemyIndex].id,
     texture:e.spr.texture.key,dex:e.dex,hp:e.hp};
   });
   assert.equal(actual.id,enemy[i]);
   assert.ok(actual.texture.startsWith('pmd-'+actual.dex+'-'));
   assert.ok(actual.hp>0);
   if(i===enemy.length-1)await page.screenshot({
    path:'test-evidence/champion-native-sixth-pokemon.png',fullPage:true});
   await page.evaluate(()=>{
    const b=window.__pt2Game.scene.getScene('combate'),e=b.luchadores[1];
    e.hp=0;b.alKO(e);
   });
  }
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
   window.__testKantoCore.readCampaign()?.champion===true,null,{timeout:25000});
  const final=await page.evaluate(()=>{
   const s=window.__testKantoCore.readCampaign();
   return {stage:s.stage,champion:s.champion,badges:s.badges,
    honors:s.leagueHonors,team:s.team.map(p=>({id:p.id,level:p.progression.level})),
    money:s.money,wins:s.wins};
  });
  assert.equal(final.stage,13);assert.equal(final.champion,true);
  assert.equal(final.badges.length,8);assert.equal(final.honors.length,5);
  // The full shared EXP after Champion can LEGITIMATELY evolve Bulbasaur.
  // The Hall must show the evolved species actually saved, never the starter.
  assert.ok(['bulbasaur','ivysaur','venusaur'].includes(final.team[0].id),
   'Champion EXP may evolve the starter after combat');
  assert.equal(final.money,2600);assert.equal(final.wins,1);
  await page.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return !!c.children.list.find(o=>o.getData?.('torre2-report-continue')===true);
  });
  await clickTagged('torre2-report-continue');
  await page.waitForFunction(()=>{
   const s=window.__pt2Game.scene.getScene('campanha');
   return !s.children.list.find(o=>o.getData?.('torre2-report-continue')===true)
  });
  const cta=await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   const z=c.children.list.find(o=>o.getData?.('torre2-central-cta')===true);
   return {visible:!!z?.input?.enabled,x:z?.x,y:z?.y};
  });
  assert.equal(cta.visible,true,'Champion victory must unlock native Hall CTA');
  await clickTagged('torre2-central-cta');
  await page.waitForFunction(()=>!!window.__pt2Game.scene.getScene('campanha').__torre2HallOfFame);
  const hall=await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return {text:c.children.list.filter(o=>typeof o.text==='string').map(o=>o.text),
    data:c.__torre2HallOfFame,
    images:c.children.list.filter(o=>o.type==='Image'&&o.texture?.key?.startsWith('torre2-portrait-')).map(o=>o.texture.key)}
  });
  assert.equal(hall.data.complete,true);
  assert.equal(hall.data.badgeCount,8);assert.equal(hall.data.honorCount,5);
  assert.ok(hall.text.some(t=>t.includes('SALÃO DA FAMA')));
  assert.ok(hall.images.length>=2,'Must draw real team portraits, not generic boxes');
  assert.deepEqual(hall.data.team.map(m=>m.id),final.team.map(m=>m.id));
  await page.screenshot({path:'test-evidence/hall-of-fame-desktop.png',fullPage:true});
  await page.setViewportSize({width:854,height:480});
  await page.screenshot({path:'test-evidence/hall-of-fame-mobile.png',fullPage:true});
  await clickTagged('torre2-hall-back');
  const back=await page.evaluate(()=>window.__pt2Game.scene.getScene('campanha').__torre2BattlePath);
  assert.equal(back.stage,13,'Back must return to champion map');
  const after=await page.evaluate(()=>{
   const s=window.__testKantoCore.readCampaign();
   return {stage:s.stage,champion:s.champion,badges:s.badges,
    honors:s.leagueHonors,team:s.team.map(p=>({id:p.id,level:p.progression.level})),
    money:s.money,wins:s.wins};
  });
  assert.deepEqual(after,final,'Hall cannot duplicate rewards or touch campaign save');
  // The initial test uses ?original=1 to bootstrap at title. Reload the
  // real public campaign entry route instead, retaining the same origin save.
  await page.goto('http://127.0.0.1:4301/arena2d/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('campanha'),null,{timeout:45000});
  const restored=await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   const z=c.children.list.find(o=>o.getData?.('torre2-central-cta')===true);
   return {button:!!z?.input?.enabled};
  });
  assert.equal(restored.button,true,'Hall CTA must survive reload');
  assert.deepEqual(errors,[],'Native Phaser Champion and Hall produce no JS errors');
  console.log('PASS native Champion six-Pokémon forced-KO, real report, Hall portraits, mobile touch, reload and unchanged save; debug-assisted, not full normal gameplay');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
