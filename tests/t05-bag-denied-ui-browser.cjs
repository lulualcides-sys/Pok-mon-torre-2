'use strict';
// T05: actual mobile Phaser BAG touch; prepared HP/status/TM and denied storage
// are fixtures, NOT earned gameplay, natural captures or physical Android QA.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1');
 const file=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const data=await fsp.readFile(file);
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});
  res.end(data);
 }catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(ok=>server.listen(4536,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:854,height:480},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4536/arena2d/?original=1',
   {waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   window.__bagCore=await import(new URL('./torre2/campaign-core.js',src));
   // Campaign scene requires an existing starter save before it can boot.
   window.__bagCore.saveCampaign(window.__bagCore.createCampaign('squirtle'));
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return c.scene.isActive()&&!!c.__torre2BattlePath;
  },null,{timeout:65000});
  await page.evaluate(()=>{
   window.__bagOriginalSet=Storage.prototype.setItem;
   window.__bagDeny=null;
   Storage.prototype.setItem=function(k,v){
    if(k===window.__bagDeny)throw new DOMException('Storage denied','QuotaExceededError');
    return window.__bagOriginalSet.call(this,k,v);
   };
  });
  const tap=async(key,id)=>{
   const p=await page.evaluate(([key,id])=>{
    const scene=window.__pt2Game.scene.getScene('campanha');
    const button=scene.children.list.find(o=>o.active&&o.input?.enabled&&
     o.getData?.(key)===id);
    if(!button)throw Error('Native BAG control missing: '+key+' '+id);
    const canvas=document.querySelector('#juego canvas')||document.querySelector('canvas');
    const r=canvas.getBoundingClientRect();
    return {x:r.left+button.x*r.width/640,y:r.top+button.y*r.height/360};
   },[key,id]);
   assert.ok(p.x>=0&&p.x<=854&&p.y>=0&&p.y<=480,'BAG control outside viewport');
   await page.touchscreen.tap(p.x,p.y);
  };
  const cases=[
   {id:'potion',key:'torre2-bag-use',screen:'bag',error:'torre2-bag-save-error'},
   {id:'superpotion',key:'torre2-bag-use',screen:'bag',error:'torre2-bag-save-error'},
   {id:'antidote',key:'torre2-status-medicine',screen:'status',error:'torre2-status-save-error'},
   {id:'tm-water-pulse',key:'torre2-bag-teach-tm',screen:'bag',error:'torre2-bag-save-error'}
  ];
  for(const action of cases)for(const denied of ['primary','backup']){
   await page.evaluate(action=>{
    const core=window.__bagCore,c=window.__pt2Game.scene.getScene('campanha');
    const s=core.createCampaign('squirtle');
    s.stage=1;s.money=5000;s.team[0].hp=40;
    s.team[0].status={kind:'veneno',toxic:true,elapsed:2};
    s.inventory.potion=2;s.inventory.superpotion=2;s.inventory.antidote=2;
    s.inventory.tms=['tm-water-pulse'];
    core.saveCampaign(s);
    c.__bagState=core.readCampaign();
    core.saveCampaign(c.__bagState);
    c.bagMemberIndex=0;
    if(action.screen==='status')c.statusMedicineScreen(c.__bagState,0);
    else c.bagScreen(c.__bagState);
   },action);
   const before=await page.evaluate(()=>{
    const core=window.__bagCore,c=window.__pt2Game.scene.getScene('campanha');
    return {state:structuredClone(c.__bagState),
     primary:localStorage.getItem(core.SAVE_KEY),
     backup:localStorage.getItem(core.SAVE_BACKUP_KEY)};
   });
   await page.evaluate(denied=>{
    const core=window.__bagCore;
    window.__bagDeny=denied==='primary'?core.SAVE_KEY:core.SAVE_BACKUP_KEY;
   },denied);
   await tap(action.key,action.id);
   const blocked=await page.evaluate(error=>{
    const core=window.__bagCore,c=window.__pt2Game.scene.getScene('campanha');
    return {state:structuredClone(c.__bagState),
     primary:localStorage.getItem(core.SAVE_KEY),
     backup:localStorage.getItem(core.SAVE_BACKUP_KEY),
     error:c.children.list.some(o=>o.active&&o.getData?.(error)===true)};
   },action.error);
   assert.deepEqual(blocked.state,before.state,'denied '+action.id+' mutated live state');
   assert.equal(blocked.primary,before.primary,'denied '+action.id+' changed primary');
   assert.equal(blocked.backup,before.backup,'denied '+action.id+' changed backup');
   assert.equal(blocked.error,true,'denied '+action.id+' lacks visible error');
   assert.deepEqual(errors,[],'uncaught Phaser pointer exception');
   await page.evaluate(()=>{window.__bagDeny=null});
   await tap(action.key,action.id);
   const after=await page.evaluate(error=>{
    const core=window.__bagCore,c=window.__pt2Game.scene.getScene('campanha');
    return {state:structuredClone(c.__bagState),loaded:core.readCampaign(),
     error:c.children.list.some(o=>o.active&&o.getData?.(error)===true)};
   },action.error);
   assert.equal(after.error,false,'old storage warning remained after retry');
   assert.deepEqual(after.loaded,after.state,'successful retry was not persisted');
   if(action.id==='potion'){
    assert.equal(after.state.team[0].hp,65);
    assert.equal(after.state.inventory.potion,1);
   }else if(action.id==='superpotion'){
    assert.equal(after.state.team[0].hp,100);
    assert.equal(after.state.inventory.superpotion,1);
   }else if(action.id==='antidote'){
    assert.equal(after.state.team[0].status,null);
    assert.equal(after.state.inventory.antidote,1);
   }else{
    assert.deepEqual(after.state.team[0].tmMoves,['Water Pulse']);
    assert.equal(after.state.inventory.tms.includes('tm-water-pulse'),false);
   }
  }
  assert.deepEqual(errors,[]);
  await page.screenshot({path:'test-evidence/t05-bag-atomic-mobile.png'});
  console.log('T05 BAG MOBILE PHASER: 8 denied storage taps and successful retries PASS');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
