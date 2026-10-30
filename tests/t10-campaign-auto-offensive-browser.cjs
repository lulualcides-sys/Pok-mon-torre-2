'use strict';
/* Live original Phaser: campaign AUTO has a stronger-than-Hard brain but
 * neither modifies HP/energy/cooldowns/damage nor leaks into manual/Arena.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site'),port=4499;
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css',
 '.json':'application/json','.png':'image/png','.webp':'image/webp',
 '.jpg':'image/jpeg','.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1:'+port);
 const file=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('blocked')}
 try{const bytes=await fs.readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(bytes)}
 catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 let page;
 try{
  page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:'+port+'/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:65000});
  await page.evaluate(async()=>{
   const main=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   window.__t10Core=await import(new URL('./torre2/campaign-core.js',main));
   __t10Core.saveCampaign(__t10Core.createPlayerCampaign('squirtle'));
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
   window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,null,{timeout:60000});
  const point=await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   const z=c.children.list.find(o=>o.active&&o.input?.enabled&&
    o.getData?.('torre2-central-cta')===true);
   if(!z)throw Error('Missing native campaign challenge button');
   const r=document.querySelector('#juego canvas').getBoundingClientRect();
   return {x:r.x+z.x*r.width/640,y:r.y+z.y*r.height/360};
  });
  await page.mouse.click(point.x,point.y);
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.fase==='lucha'&&b.__torre2AutoMode?.zone?.active;
  },null,{timeout:60000});
  const initial=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),a=b.__torre2AutoMode,me=a.control.l;
   window.__t10Control={control:a.control,original:a.read};
   return {campaign:!!b.datos.torre2,enabled:a.enabled,
    originalReader:typeof a.read==='function',profile:{...a.ai.cfg},offense:{pBasico:a.ai.c.pBasico,pConGanas:a.ai.c.pConGanas,
     pSinGanas:a.ai.c.pSinGanas,pAhorro:a.ai.c.pAhorro,rangoBanda:a.ai.c.rangoBanda},
    advantage:me.ventaja,slots:Object.keys(me.kit),species:b.datos.p1};
  });
  assert.equal(initial.campaign,true);
  assert.equal(initial.species,'squirtle');
  assert.equal(initial.enabled,true,'Kanto AUTO MUST start enabled');
  assert.equal(initial.advantage,1,'Auto cannot apply Maestro native 35% damage buff');
  assert.ok(initial.profile.reaccion<=.025,'Campaign AUTO level 2 reacts in <=25ms');
  assert.equal(initial.profile.error,0,'Campaign AUTO level 2 avoids aim error');
  assert.equal(initial.profile.basicos,1,'Campaign AUTO level 2 maximizes native basic pressure');
  assert.equal(initial.profile.agresividad,1);
  assert.ok(initial.offense.pBasico<=.14,'Real native basic attack threshold must be tuned');
  assert.ok(initial.offense.pConGanas<=.20,'Preserve stronger per-species learned confidence thresholds');
  assert.equal(initial.offense.pSinGanas,.34);
  assert.equal(initial.offense.pAhorro,.08);
  const on=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),a=b.__torre2AutoMode;
   return {enabled:a.enabled,advantage:a.control.l.ventaja,profile:{...a.ai.cfg}};
  });
  assert.equal(on.enabled,true,'Campaign AUTO starts enabled without user interaction');
  assert.equal(on.advantage,1);
  assert.equal(on.profile.ventaja,1);
  assert.equal(on.profile.reaccion,.02);
  assert.equal(on.profile.basicos,1);
  await page.waitForTimeout(3500);
  const playing=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),m=b.luchadores[0],a=b.__torre2AutoMode;
   return {phase:b.fase,enabled:a?.enabled,uses:{...(m?.stats?.usosSlot||{})},
    energy:m?.energia,advantage:m?.ventaja,profile:{...(a?.ai?.cfg||{})},
    offense:{pBasico:a?.ai?.c?.pBasico,pAhorro:a?.ai?.c?.pAhorro}};
  });
  assert.equal(playing.advantage,1,'Combat AUTO may not silently buff attack damage');
  assert.equal(playing.profile.agresividad,1);
  assert.ok(playing.offense.pBasico<=.14);
  assert.equal(playing.offense.pAhorro,.08);
  assert.ok(Object.values(playing.uses).reduce((sum,n)=>sum+Number(n||0),0)>=1,
   'Real native Phaser AUTO must actually cast a learned move during combat');
  assert.equal(playing.enabled,true,'AUTO remains active after live decision frames');
  await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),a=b.__torre2AutoMode;
   a.zone.emit('pointerdown',{id:132},0,0,{stopPropagation(){}});
  });
  const off=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),a=b.__torre2AutoMode;
   return {enabled:a.enabled,manual:a.control.leer!==a.read?false:true,
    readerInstalled:a.control.leer!==a.read,profile:a.ai.cfg};
  });
  assert.equal(off.enabled,false);
  assert.equal(off.readerInstalled,true,'AUTO wrapper stays ready for the next toggle');
  await page.evaluate(()=>window.__pt2Game.scene.getScene('combate').scene.start('titulo'));
  await page.waitForFunction(()=>window.__t10Control?.control?.leer===
   window.__t10Control.original,null,{timeout:10000});
  assert.deepEqual(errors,[],'No uncaught Phaser JS error');
  const report={initial,on,playing,off,restored:true};
  await fs.mkdir('test-evidence',{recursive:true});
  await fs.writeFile('test-evidence/t10-campaign-offensive-auto.json',JSON.stringify(report,null,2));
  console.log('PASS T10 CAMPAIGN OFFENSIVE AUTO NO BONUS DAMAGE',JSON.stringify(report));
 }finally{
  if(page&&!page.isClosed())await page.close();
  await browser.close();await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error(e);process.exitCode=1;if(server.listening)server.close()});
