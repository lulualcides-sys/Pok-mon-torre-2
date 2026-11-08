// UI fixture only. Verify late PC portraits and original portrait-area hitboxes.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_BIN||'/home/agent/.cache/ms-playwright/chromium-1194/chrome-linux/chrome',args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{
  const p=await b.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true});const errors=[];p.on('pageerror',e=>errors.push(String(e)));
  await p.goto(process.env.TEST_URL||'http://127.0.0.1:4174/arena2d/?original=1&torre2-cards=1');
  await p.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:90000});
  await p.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
   window.pcCore=await import(new URL('./torre2/campaign-core.js',src));
   const {createPokemonProgression}=await import(new URL('./torre2/progression.js',src));
   const state=pcCore.createPlayerCampaign('bulbasaur');
   for(let i=0;i<13;i++){const id=i===12?'poliwag':'bulbasaur';state.box.push({id,uid:'portrait-test-'+i,hp:100,progression:createPokemonProgression(id,5),status:null,tmMoves:[]})}
   pcCore.saveCampaign(state);window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await p.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha').__torre2CardUI?.mode==='cards',null,{timeout:60000});
  const info=await p.evaluate(()=>{const s=window.__pt2Game.scene.getScene('campanha'),state=pcCore.readCampaign();window.pcTarget=state.box.findIndex(m=>m.uid==='portrait-test-12');const unloaded=!s.textures.exists('torre2-portrait-0060');s.pcScreen(state,Math.floor(pcTarget/6));return{unloaded,index:pcTarget}});
  assert.equal(info.unloaded,true,'Regression must exercise an unloaded portrait');
  await p.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha').children.list.some(o=>o.texture?.key==='torre2-portrait-0060'),null,{timeout:30000});
  const tap=async(x,y)=>{const pt=await p.evaluate(([x,y])=>{
   const game=window.__pt2Game,s=game.scene.getScene('campanha'),cam=s.cameras.main;
   const r=document.querySelector('#juego canvas').getBoundingClientRect();
   const screen=cam.matrix.transformPoint(x-cam.scrollX,y-cam.scrollY);
   return{x:r.x+screen.x*r.width/game.scale.gameSize.width,y:r.y+screen.y*r.height/game.scale.gameSize.height};
  },[x,y]);await p.touchscreen.tap(pt.x,pt.y);await p.waitForTimeout(250)};
  await p.screenshot({path:'/workspace/pt2-evidence/pc-page3.png'});
  await p.waitForTimeout(300);
  await tap(39,79);
  assert.equal(await p.evaluate(()=>window.__pt2Game.scene.getScene('campanha').pcSelected),0,'Team portrait selects original row');
  await tap(351,79+(info.index%6)*34);
  assert.equal(await p.evaluate(()=>pcCore.readCampaign().team.some(m=>m.uid==='portrait-test-12')),true,'Box portrait withdraws exact UID');
  assert.deepEqual(errors,[]);
  console.log('PASS_PREMIUM_PC_PORTRAIT_TOUCH_AND_PAGE3');
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
