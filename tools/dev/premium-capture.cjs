const {chromium}=require('playwright-core');
const fs=require('node:fs/promises');
(async()=>{
 const out=process.env.OUT||'/workspace/pt2-evidence/before';await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({executablePath:'/home/agent/.cache/ms-playwright/chromium-1194/chrome-linux/chrome',args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 const report=[];
 try{for(const [label,width,height] of [['desktop',1280,720],['tablet',768,1024],['mobile',390,844]]){
  const p=await browser.newPage({viewport:{width,height},hasTouch:label!=='desktop'}),errors=[];
  p.on('pageerror',e=>errors.push(String(e)));
  await p.goto(process.env.BASE_URL||('http://127.0.0.1:'+(process.env.PORT||4173)+'/arena2d/?original=1&torre2-cards=1'),{timeout:60000});
  await p.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:120000});
  await p.screenshot({path:out+'/'+label+'-title.png'});
  await p.evaluate(async()=>{
   const main=[...document.scripts].find(s=>s.src.includes('/main.js')).src;
   window.qaCore=await import(new URL('./torre2/campaign-core.js',main));
   const state=qaCore.createPlayerCampaign('bulbasaur');state.stage=1;state.trainer=2;
   qaCore.saveCampaign(state);window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await p.waitForFunction(()=>window.__pt2Game.scene.getScene('campanha').__torre2CardUI?.mode==='cards',null,{timeout:90000});
  await p.waitForTimeout(1800);
  if(process.env.EXPECT_PREMIUM==='1'&&!await p.evaluate(()=>window.__pt2Game.textures.exists('torre2-premium-tree')))throw Error('Premium card art was not loaded');
  await p.screenshot({path:out+'/'+label+'-cards.png'});
  const save=await p.evaluate(()=>localStorage.getItem('pokemon-torre-2-kanto-campaign-v1'));
  await p.evaluate(()=>window.__pt2Game.scene.getScene('campanha').pcScreen(qaCore.readCampaign()));
  await p.waitForTimeout(500);await p.screenshot({path:out+'/'+label+'-pc.png'});
  await p.evaluate(()=>{const s=window.__pt2Game.scene.getScene('campanha');s.__torre2PathStage=1;s.__torre2CityRoute=false;s.renderLegacyCampaign(qaCore.readCampaign())});
  await p.waitForTimeout(600);await p.screenshot({path:out+'/'+label+'-city.png'});
  report.push({label,width,height,errors,saveUnchanged:save===await p.evaluate(()=>localStorage.getItem('pokemon-torre-2-kanto-campaign-v1')),meta:await p.evaluate(()=>({city:window.__pt2Game.scene.getScene('campanha').__torre2CityHub,renderer:window.__pt2Game.renderer.type}))});
  console.log(label,JSON.stringify(report.at(-1)));await p.close();
 }}finally{await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
