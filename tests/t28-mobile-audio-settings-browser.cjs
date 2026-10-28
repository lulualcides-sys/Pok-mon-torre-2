'use strict';
// Original Phaser client only. Touch/click the actual Kanto sound settings UI.
// No externally licensed music and no modifications to approved move audio.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises'),
 path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const types={'.html':'text/html','.js':'text/javascript',
 '.json':'application/json','.png':'image/png',
 '.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1');
 const file=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const bytes=await fsp.readFile(file);res.writeHead(200,
  {'content-type':types[path.extname(file)]||'application/octet-stream'});res.end(bytes)}
 catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(ok=>server.listen(4488,'127.0.0.1',ok));
 const browser=await chromium.launch({
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']
 });
 try{
  const page=await browser.newPage({viewport:{width:854,height:480},hasTouch:true,isMobile:true});
  const errors=[];page.on('pageerror',err=>errors.push(String(err)));
  const touch=async(x,y)=>{
   const p=await page.evaluate(([x,y])=>{
    const c=document.querySelector('#juego canvas')||document.querySelector('canvas');
    if(!c)throw Error('Original Phaser canvas missing');
    const b=c.getBoundingClientRect();
    return {x:b.x+b.width*x/640,y:b.y+b.height*y/360};
   },[x,y]);
   assert.ok(p.x>=0&&p.x<=854&&p.y>=0&&p.y<=480);
   await page.touchscreen.tap(p.x,p.y);
  };
  const ui=async()=>page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   const prefs=JSON.parse(localStorage.getItem('torre2-audio-prefs-v1')||'null');
   const panels=c.children.list.filter(x=>x.active&&x.getData?.('torre2-audio-title')===true);
   return {prefs,panels:panels.length,active:c.__torre2AudioSettings?.active,
    // Game.sound is the upstream shared channel; the Scene.sound reference
    // can be a different local facade and is diagnostic only.
    volume:c.game?.sound?.volume??c.sound?.volume,
    mute:c.game?.sound?.mute??c.sound?.mute,
    busesSame:c.sound===c.game.sound,
    sceneBus:{mute:c.sound?.mute,volume:c.sound?.volume,
     setMute:typeof c.sound?.setMute==='function'},
    gameBus:{mute:c.game?.sound?.mute,volume:c.game?.sound?.volume,
     setMute:typeof c.game?.sound?.setMute==='function'},
    setterAvailable:typeof c.sound?.setVolume==='function',
    label:c.__torre2AudioSettings?.button?.active,
    buttons:c.children.list.filter(x=>x.active&&x.input?.enabled&&
     x.getData?.('torre2-audio-open')===true).length};
  });
  await page.goto('http://127.0.0.1:4488/arena2d/?original=1',
   {waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),
   null,{timeout:65000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=await import(new URL('./torre2/campaign-core.js',src));
   core.saveCampaign(core.createCampaign('bulbasaur'));
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return c.scene.isActive()&&c.__torre2BattlePath&&
    c.__torre2AudioSettings?.button?.input?.enabled;
  },null,{timeout:65000});
  await page.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return Math.abs(c.game.sound.volume-.7)<.0001;
  },null,{timeout:12000});
  const initial=await ui();
  console.log('T28 INITIAL PHASER BUS DIAG',JSON.stringify(initial));
  assert.equal(initial.panels,0);
  assert.equal(initial.buttons,1);
  assert.ok(Math.abs(initial.volume-.7)<1e-5,'Default master volume must apply to native Phaser');
  await touch(203,335);
  await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')
   .__torre2AudioSettings?.active,null,{timeout:10000});
  assert.equal((await ui()).panels,1);
  await page.screenshot({path:'test-evidence/t28-audio-menu-mobile.png'});
  await touch(390,132); // master 70 -> 60
  await touch(530,178); // SFX 60 -> 70
  await touch(390,224); // music 50 -> 40
  const changed=await ui();
  assert.equal(changed.prefs.master,.6);
  assert.equal(changed.prefs.effects,.7);
  assert.equal(changed.prefs.music,.4);
  assert.ok(Math.abs(changed.volume-.6)<1e-5,'Phaser volume should be 60%');
  await touch(200,282); // mute
  await page.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return Math.abs(c.game.sound.volume)<.0001;
  },null,{timeout:12000});
  const muted=await ui();
  console.log('T28 PHASER MUTE DIAG',JSON.stringify(muted));
  assert.equal(muted.prefs.muted,true);
  assert.ok(Math.abs(muted.volume)<1e-5,'Mute must enforce true silence via zero native gain');
  await touch(448,282); // close
  assert.equal((await ui()).panels,0);
  await touch(203,335);
  assert.equal((await ui()).panels,1,'Audio settings must reopen without duplicate');
  await touch(200,282); // unmute
  await touch(448,282);
  const expected=(await ui()).prefs;
  assert.equal(expected.muted,false);
  assert.equal((await ui()).buttons,1);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),
   null,{timeout:65000});
  await page.evaluate(()=>window.__pt2Game.scene.getScene('titulo').scene.start('campanha'));
  await page.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha')
   .__torre2AudioSettings?.button?.input?.enabled,null,{timeout:60000});
  await page.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return Math.abs(c.game.sound.volume-.6)<.0001;
  },null,{timeout:12000});
  const reload=await ui();
  assert.deepEqual(reload.prefs,expected,'Sound preferences lost after actual page reload');
  assert.ok(Math.abs(reload.volume-.6)<1e-5,'Phaser volume should persist after reload');
  assert.equal(reload.mute,false);
  assert.equal(reload.buttons,1,'Audio menu duplicated on reload');
  // Re-enter Kanto map and verify sound controls don't leak scene objects.
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=await import(new URL('./torre2/campaign-core.js',src));
   window.__pt2Game.scene.getScene('campanha').renderCampaign(core.readCampaign());
  });
  const redraw=await ui();
  assert.equal(redraw.buttons,1,'Recreating Kanto map must dispose old sound controls');
  assert.deepEqual(errors,[],'Phaser audio UI exceptions');
  const report={scope:'T28 original Phaser mobile audio settings, persistence and mute',
   audioSource:'original synthesized WebAudio menu cues; no music asset distributed',
   actualOriginalGameSoundBus:true,initial,changed,muted,reload,redraw};
  fs.writeFileSync('test-evidence/t28-audio-menu-settings.json',JSON.stringify(report,null,2));
  console.log('T28 PHASER AUDIO SETTINGS PASS',JSON.stringify({
   master:reload.prefs.master,effects:reload.prefs.effects,
   music:reload.prefs.music,muted:reload.prefs.muted,
   buttonsAfterRedraw:redraw.buttons
  }));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
