'use strict';
/* T25: native Phaser PC/Pokédex UI smoke. Test-only save fixture; does not
 * claim a natural catch, Android hardware, or completed Kanto campaign.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp',
 '.svg':'image/svg+xml','.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1');
 const filename=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!filename.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const data=await fsp.readFile(filename);
  res.writeHead(200,{'content-type':mime[path.extname(filename)]||'application/octet-stream'});
  res.end(data);
 }catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(done=>server.listen(4598,'127.0.0.1',done));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  for(const viewport of [{width:1280,height:720,mobile:false},{width:854,height:480,mobile:true}]){
   const page=await browser.newPage({viewport:{width:viewport.width,height:viewport.height},
    hasTouch:viewport.mobile,isMobile:viewport.mobile});
   const errors=[];page.on('pageerror',e=>errors.push(String(e)));
   await page.goto('http://127.0.0.1:4598/arena2d/?original=1',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:65000});
   await page.evaluate(async()=>{
    const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
    window.__collectionCore=await import(new URL('./torre2/campaign-core.js',src));
    const state=__collectionCore.createCampaign('bulbasaur');
    state.box=Array.from({length:13},(_,i)=>({
     id:'pidgey',uid:'t25-box-'+i,progression:{species:'pidgey',level:6+i},
     hp:i===8||i===12?0:75,shiny:i===3||i===12,
     status:i===2?{kind:'veneno'}:null,confusion:null,tmMoves:[]
    }));
    state.dexSeen=['mr-mime','nidoran-f','farfetchd'];
    state.dexCaught=['mr-mime'];
    state.dexShinySeen=['mr-mime'];
    state.dexShinyCaught=[];
    __collectionCore.saveCampaign(state);
    window.__collectionState=state;
    window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
   });
   await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('campanha'),
    null,{timeout:65000});
   const before=await page.evaluate(()=>
    localStorage.getItem(__collectionCore.SAVE_KEY));
   await page.evaluate(()=>__pt2Game.scene.getScene('campanha')
    .pcScreen(__collectionState));
   const boxIndices=()=>page.evaluate(()=>__pt2Game.scene.getScene('campanha')
    .children.list.filter(o=>o.active&&o.input?.enabled&&
     Number.isInteger(o.getData?.('torre2-pc-box-index')))
    .map(o=>o.getData('torre2-pc-box-index')));
   const click=async(key,value)=>{
    const pos=await page.evaluate(([key,value])=>{
     const scene=__pt2Game.scene.getScene('campanha');
     const target=scene.children.list.find(o=>o.active&&o.input?.enabled&&
      o.getData?.(key)===value);
     if(!target)throw Error('Missing native clickable control '+key+'='+value);
     const r=document.querySelector('#juego canvas').getBoundingClientRect();
     return {x:r.x+target.x*r.width/640,y:r.y+target.y*r.height/360};
    },[key,value]);
    await page.mouse.click(pos.x,pos.y);
    await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
   };
   assert.deepEqual(await boxIndices(),[0,1,2,3,4,5]);
   await page.screenshot({path:'test-evidence/t25-pc-all-'+viewport.width+'.png'});
   await click('torre2-pc-filter','SHINY');
   assert.deepEqual(await boxIndices(),[3,12],'Shiny filter must keep original PC indexes');
   await page.screenshot({path:'test-evidence/t25-pc-shiny-'+viewport.width+'.png'});
   await click('torre2-pc-filter','KO');
   assert.deepEqual(await boxIndices(),[8,12]);
   await click('torre2-pc-filter','STATUS');
   assert.deepEqual(await boxIndices(),[2]);
   await click('torre2-pc-filter','ALL');
   await click('torre2-pc-next',true);
   assert.deepEqual(await boxIndices(),[6,7,8,9,10,11]);
   await click('torre2-pc-next',true);
   assert.deepEqual(await boxIndices(),[12]);
   await page.evaluate(()=>{
    const scene=__pt2Game.scene.getScene('campanha');
    scene.dexPage=5;scene.dexScreen(__collectionState);
   });
   const mimeEntry=await page.evaluate(()=>{
    const scene=__pt2Game.scene.getScene('campanha');
    const o=scene.children.list.find(x=>x.active&&x.getData?.('torre2-dex-id')==='mr-mime');
    return o?.text||null;
   });
   assert.match(mimeEntry||'',/MrMime.*✦/,'Captured Mr. Mime must be recognized in the live Dex');
   await page.screenshot({path:'test-evidence/t25-dex-mrmime-'+viewport.width+'.png'});
   await click('torre2-dex-next',true);
   const mew=await page.evaluate(()=>__pt2Game.scene.getScene('campanha')
    .children.list.some(o=>o.active&&o.getData?.('torre2-dex-id')==='mew'));
   assert.equal(mew,true,'The final Kanto page must reach Mew');
   const after=await page.evaluate(()=>localStorage.getItem(__collectionCore.SAVE_KEY));
   assert.equal(after,before,'PC filters and Dex pages must not rewrite saved party/box/flags');
   assert.deepEqual(errors,[],'No Phaser page errors');
   console.log('PASS T25 NATIVE PC/DEX',viewport.width,{
    shiny:[3,12],ko:[8,12],status:[2],canonical:'mr-mime',
    lastDex:'mew',saveUnchanged:true
   });
   await page.close();
  }
 }finally{await browser.close();await new Promise(done=>server.close(done))}
})().catch(error=>{console.error(error);process.exitCode=1;if(server.listening)server.close()});
