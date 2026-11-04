'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const MIME={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg',
 '.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1:4298');
 const file=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('blocked');}
 try{const data=await fs.readFile(file);res.writeHead(200,{'content-type':MIME[path.extname(file)]||'application/octet-stream'});res.end(data);}
 catch{res.writeHead(404);res.end('missing');}
});
(async()=>{
 await new Promise(resolve=>server.listen(4298,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true,
  args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4298/arena2d/?original=1');
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:45000});
  await page.evaluate(()=>window.__pt2Game.scene.getScene('titulo').scene.start('combate',{
   modo:'cpu',p1:'magikarp',p2:'joltik',mandos:['tactil','pad0'],nivel:'normal'
  }));
  await page.waitForFunction(()=>{
   const s=window.__pt2Game.scene.getScene('combate');
   return s.scene.isActive()&&s.fase==='lucha'&&!!s.__torre2AutoMode;
  },null,{timeout:30000});
  const before=await page.evaluate(()=>{
   const s=window.__pt2Game.scene.getScene('combate'),a=s.__torre2AutoMode;
   const p=s.luchadores[0],enemy=s.luchadores[1];
   enemy.inmortal=true;p.inmortal=true;p.energia=100;
   enemy.x=p.x+75;enemy.y=p.y;
   const original=a.read;
   return {mode:s.datos.modo,enabled:a.enabled,label:a.label.text,
    player:a.control.l.def.id,enemy:enemy.def.id,
    matches:a.control===s.controles[0],notAi:s.controles[1]!==a.control,
    originalReader:typeof original==='function',x:a.zone.x,y:a.zone.y,
    profile:{...a.ai.cfg},threshold:a.ai.c?.pBasico};
  });
  console.log('AUTO_BEFORE',JSON.stringify(before));
  assert.equal(before.enabled,false);assert.equal(before.label,'AUTO');
  assert.equal(before.player,'magikarp');
  assert.equal(before.profile.ventaja,1,'Extreme AUTO may not cheat damage');
  assert.ok(before.profile.reaccion<=.01,'Extreme AUTO must react faster');
  assert.ok(before.threshold<=.08,'Extreme AUTO should use aggressive native basic decisions');
  assert.equal(before.matches,true);assert.equal(before.notAi,true);
  assert.ok(before.x>500&&before.y>65&&before.y<190,'Button must stay small on right side');
  // Real Phaser input event (same as touching the small AUTO button).
  const point=await page.evaluate(()=>{
   const s=window.__pt2Game.scene.getScene('combate');
   const zone=s.__torre2AutoMode.zone;
   const canvas=document.querySelector('canvas').getBoundingClientRect();
   // The native stage is 640×360, CSS scales its entire canvas for mobile.
   return {x:canvas.x+zone.x*canvas.width/640,
    y:canvas.y+zone.y*canvas.height/360};
  });
  await page.mouse.click(point.x,point.y);
  const afterClick=await page.evaluate(()=>{
   const s=window.__pt2Game.scene.getScene('combate'),a=s.__torre2AutoMode;
   return {enabled:a.enabled,text:a.label.text,fill:a.button.fillColor};
  });
  console.log('AUTO_CLICK',JSON.stringify({point,afterClick}));
  assert.equal(afterClick.enabled,true,'Click on right-side AUTO must activate native IA');
  assert.ok(afterClick.text.includes('AUTO'));
  await page.waitForTimeout(2800);
  const playing=await page.evaluate(()=>{
   const s=window.__pt2Game.scene.getScene('combate'),p=s.luchadores[0],a=s.__torre2AutoMode;
   const stats=p.stats?.usosSlot||{};
   return {enabled:a.enabled,phase:s.fase,stats,ai:a.ai?.constructor?.name,
    speed:{x:p.x,y:p.y},cooldowns:p.cd};
  });
  console.log('AUTO_PLAYING',JSON.stringify(playing));
  assert.equal(playing.enabled,true);
  // Start from a LEGAL evolution-ready Magikarp fixture. Only EXP is prepared:
  // the AUTO must press the real native EVO command and Phaser evolves it.
  const ready=await page.evaluate(()=>{
   const s=window.__pt2Game.scene.getScene('combate'),me=s.luchadores[0];
   me.exp=me.expNecesaria;me.energia=100;
   return {before:me.etapa,ready:me.puedeEvolucionar,
    exp:me.exp,expNeeded:me.expNecesaria};
  });
  assert.equal(ready.before,0);
  assert.equal(ready.ready,true,'Native EXP threshold must report EVO ready');
  await page.waitForFunction(()=>{
   const s=window.__pt2Game.scene.getScene('combate');
   return s.luchadores[0]?.etapa===1;
  },null,{timeout:12000});
  const evolution=await page.evaluate(()=>{
   const s=window.__pt2Game.scene.getScene('combate');
   const me=s.luchadores[0];
   return {stage:me.etapa,name:me.forma?.nombre,auto:s.__torre2AutoMode.enabled};
  });
  assert.equal(evolution.stage,1,'Real native fighter must evolve while AUTO is on');
  assert.equal(evolution.auto,true,'AUTO stays enabled after evolution');
  console.log('AUTO_NATIVE_EVOLUTION',JSON.stringify({ready,evolution}));
  assert.ok(playing.ai,'AUTO must create original native AI');
  await page.evaluate(()=>{
   const scene=window.__pt2Game.scene.getScene('combate');
   scene.__torre2AutoMode.zone.emit('pointerdown',{id:3},0,0,{stopPropagation(){}});
  });
  const off=await page.evaluate(()=>{
   const a=window.__pt2Game.scene.getScene('combate').__torre2AutoMode;
   return {enabled:a.enabled,text:a.label.text};
  });
  assert.equal(off.enabled,false);assert.equal(off.text,'AUTO');
  await page.evaluate(()=>{
   const s=window.__pt2Game.scene.getScene('combate'),a=s.__torre2AutoMode;
   window.__torre2AutoCleanupCheck={state:a,control:a.control,original:a.read};
   s.scene.start('titulo');
  });
  // Phaser's ScenePlugin.start schedules shutdown at the scene transition,
  // not synchronously in the click/JS handler.
  await page.waitForFunction(()=>window.__torre2AutoCleanupCheck?.state?.cleaned===true,
   null,{timeout:10000});
  const cleanup=await page.evaluate(()=>{
   const x=window.__torre2AutoCleanupCheck;
   return {cleaned:x.state.cleaned,restored:x.control.leer===x.original};
  });
  assert.equal(cleanup.cleaned,true,'Manual reader must be restored when battle ends');
  assert.equal(cleanup.restored,true);
  assert.deepEqual(errors,[],'No Phaser JS errors');
  console.log('PASS AUTO button real mouse, original AI, OFF manual return and scene cleanup');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
