// Prepared-save visual review; never evidence of natural campaign completion.
const {chromium}=require('playwright-core');const fs=require('fs/promises');const assert=require('assert/strict');
(async()=>{const out=process.env.OUT||'/workspace/pt2-evidence/scenic-v2-final';await fs.mkdir(out,{recursive:true});
const b=await chromium.launch({executablePath:process.env.CHROME_BIN||'/home/agent/.cache/ms-playwright/chromium-1194/chrome-linux/chrome',args:['--no-sandbox','--enable-unsafe-swiftshader']});
const errors=[],report=[];
try{for(const [name,width,height,stages]of [['desktop',1280,720,[0,1,3,5,6,8,12]],['mobile-landscape',844,390,[1]],['tablet',768,1024,[1]],['mobile-portrait',390,844,[1]]]){
 const p=await b.newPage({viewport:{width,height},hasTouch:name!=='desktop',isMobile:name!=='desktop'});p.on('pageerror',e=>errors.push(e.message));
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:4174/arena2d/?original=1&torre2-cards=1');await p.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:90000});
 for(const stage of stages){
  await p.evaluate(async stage=>{const src=[...document.scripts].find(s=>s.src.includes('/main.js')).src;window.scenicCore=await import(new URL('./torre2/campaign-core.js',src));const s=scenicCore.createPlayerCampaign('bulbasaur');s.stage=stage;s.trainer=Math.min(2,scenicCore.TRAINERS_PER_GYM(stage));scenicCore.saveCampaign(s);const game=window.__pt2Game;game.scene.stop('titulo');game.scene.stop('campanha');game.scene.start('campanha')},stage);
  await p.waitForFunction(stage=>{const s=window.__pt2Game.scene.getScene('campanha');return s.sys.isActive()&&s.__torre2CardUI?.mode==='cards'&&s.__torre2CardUI.stage===stage&&s.children.list.some(o=>o.getData?.('torre2-trainer-cards-root')&&o.active)},stage,{timeout:90000});
  await p.waitForFunction(()=>window.__pt2Game.textures.exists('torre2-scenic-lpc-v2'),null,{timeout:30000});await p.waitForTimeout(500);
  await p.screenshot({path:`${out}/${name}-stage-${stage}.png`});
  report.push({name,stage,atlas:await p.evaluate(()=>window.__pt2Game.textures.get('torre2-scenic-lpc-v2').source[0].width)});
 }
 if(height>width){assert.equal(await p.locator('#girar').isVisible(),true);await p.close();continue;}
 const point=async(x,y)=>p.evaluate(([x,y])=>{const game=window.__pt2Game,cam=game.scene.getScene('campanha').cameras.main,r=document.querySelector('#juego canvas').getBoundingClientRect(),s=cam.matrix.transformPoint(x-cam.scrollX,y-cam.scrollY);return{x:r.x+s.x*r.width/game.scale.gameSize.width,y:r.y+s.y*r.height/game.scale.gameSize.height}},[x,y]);
 const click=async(x,y)=>{const pt=await point(x,y);if(name==='desktop')await p.mouse.click(pt.x,pt.y);else await p.touchscreen.tap(pt.x,pt.y);await p.waitForTimeout(250)};
 const save=await p.evaluate(()=>localStorage.getItem('pokemon-torre-2-kanto-campaign-v1'));
 await click(72,180);await p.screenshot({path:`${out}/${name}-detail.png`});
 assert.equal(await p.evaluate(()=>window.__pt2Game.scene.getScene('campanha').__torre2CardUI.mode),'detail');
 await click(598,27);await click(490,25);await p.screenshot({path:`${out}/${name}-options.png`});
 await click(320,291);
 assert.equal(await p.evaluate(()=>localStorage.getItem('pokemon-torre-2-kanto-campaign-v1')),save);
 const listeners=await p.evaluate(()=>{const s=window.__pt2Game.scene.getScene('campanha');return s.load.listenerCount('filecomplete-image-torre2-scenic-lpc-v2')});assert.equal(listeners,0);
 await p.close();
}assert.deepEqual(errors,[]);console.log('PASS_SCENIC_V2_REGIONS_DETAIL_TOUCH',JSON.stringify(report));
}finally{await fs.writeFile(out+'/report.json',JSON.stringify({errors,report},null,2));await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
