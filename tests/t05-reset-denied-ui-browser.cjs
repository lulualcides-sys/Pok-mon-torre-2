'use strict';
// T05 native Phaser reset: denied deletion, visible retry, original backup
// preserved byte-for-byte, and successful confirmed reset after allowing storage.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1');
 const filename=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!filename.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const bytes=await fsp.readFile(filename);res.writeHead(200,{
  'content-type':mime[path.extname(filename)]||'application/octet-stream'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(done=>server.listen(4526,'127.0.0.1',done));
 const browser=await chromium.launch({
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']
 });
 let page;
 try{
  page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4526/arena2d/?original=1',
   {waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),
   null,{timeout:65000});
  await page.evaluate(async()=>{
   const main=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=window.t05Core=await import(new URL('./torre2/campaign-core.js',main));
   const s=core.createCampaign('squirtle');
   core.saveCampaign(s);
   const normalized=core.readCampaign();
   core.saveCampaign(normalized);
   normalized.money+=777;core.saveCampaign(normalized);
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   return c.scene.isActive()&&!!c.__torre2BattlePath;
  },null,{timeout:65000});
  const before=await page.evaluate(()=>{
   const c=window.t05Core;
   return {primary:localStorage.getItem(c.SAVE_KEY),
    backup:localStorage.getItem(c.SAVE_BACKUP_KEY),
    money:c.readCampaign().money,team:c.readCampaign().team.map(m=>m.uid)};
  });
  assert.ok(before.primary&&before.backup,'Two genuine checkpoints required');
  assert.notEqual(before.primary,before.backup);
  const tap=async(x,y)=>{
   const point=await page.evaluate(([x,y])=>{
    const r=document.querySelector('#juego canvas').getBoundingClientRect();
    return {x:r.left+x*r.width/640,y:r.top+y*r.height/360};
   },[x,y]);
   await page.mouse.move(point.x,point.y);
   await page.mouse.down();await page.waitForTimeout(115);await page.mouse.up();
  };
  const control=async(data,value)=>{
   await page.waitForFunction(([data,value])=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    return c.scene.isActive()&&c.children.list.some(o=>o.active&&
     o.input?.enabled&&o.getData?.(data)===value);
   },[data,value],{timeout:15000});
   const point=await page.evaluate(([data,value])=>{
    const c=window.__pt2Game.scene.getScene('campanha');
    const z=c.children.list.find(o=>o.active&&o.input?.enabled&&
     o.getData?.(data)===value);
    return {x:z.x,y:z.y};
   },[data,value]);
   await tap(point.x,point.y);
  };
  // Test the visible two-step journey reset, not a direct core reset call.
  await control('torre2-reset-journey',true);
  await page.waitForFunction(()=>!!window.__pt2Game.scene.getScene('campanha')
   .__torre2ResetDialog?.active,null,{timeout:10000});
  await page.evaluate(()=>{
   window.__t05OriginalRemove=Storage.prototype.removeItem;
   window.__t05DenyPrimaryReset=true;
   Storage.prototype.removeItem=function(key){
    if(window.__t05DenyPrimaryReset&&key===window.t05Core.SAVE_KEY)
     throw new DOMException('Browser denied save deletion','SecurityError');
    return window.__t05OriginalRemove.call(this,key);
   };
  });
  await control('torre2-reset-confirm',true);
  const blocked=await page.evaluate(()=>{
   const core=window.t05Core,c=window.__pt2Game.scene.getScene('campanha');
   return {primary:localStorage.getItem(core.SAVE_KEY),
    backup:localStorage.getItem(core.SAVE_BACKUP_KEY),
    dialog:!!c.__torre2ResetDialog?.active,
    visible:c.children.list.some(o=>o.active&&typeof o.text==='string'&&
     o.text.includes('SAVE PRESERVADO')),
    confirm:c.children.list.some(o=>o.active&&o.input?.enabled&&
     o.getData?.('torre2-reset-confirm')===true)};
  });
  assert.equal(blocked.dialog,true,'Failed reset closed the confirmation');
  assert.equal(blocked.visible,true,'No visible retryable failure for the player');
  assert.equal(blocked.confirm,true,'Confirm button unavailable for retry');
  assert.equal(blocked.primary,before.primary,'Primary lost despite denied reset');
  assert.equal(blocked.backup,before.backup,'Previous backup lost despite denied reset');
  assert.deepEqual(errors,[],'Native Phaser pointer callback threw on denied reset');
  await page.screenshot({path:'test-evidence/t05-reset-denied-visible-error.png'});
  // The SAME native confirmation button must succeed after storage is restored.
  await page.evaluate(()=>{window.__t05DenyPrimaryReset=false});
  await control('torre2-reset-confirm',true);
  await page.waitForFunction(()=>{
   const c=window.t05Core;
   return localStorage.getItem(c.SAVE_KEY)===null&&
    localStorage.getItem(c.SAVE_BACKUP_KEY)===null;
  },null,{timeout:15000});
  const after=await page.evaluate(()=>{
   const core=window.t05Core,c=window.__pt2Game.scene.getScene('campanha');
   return {primary:localStorage.getItem(core.SAVE_KEY),
    backup:localStorage.getItem(core.SAVE_BACKUP_KEY),
    saved:core.readCampaign(),dialog:!!c.__torre2ResetDialog?.active,
    ready:c.scene.isActive()};
  });
  assert.equal(after.primary,null);
  assert.equal(after.backup,null);
  assert.equal(after.saved,null,'Reset must not resurrect old backup on reload');
  assert.equal(after.dialog,false,'Successful reset left the blocker on screen');
  assert.deepEqual(errors,[],'Phaser scene errors during reset retry');
  fs.writeFileSync('test-evidence/t05-reset-denied-retry.json',JSON.stringify({
   source:'real Phaser pointer controls; storage denial simulated only in browser',
   before:{money:before.money,team:before.team,
    primaryBytes:before.primary.length,backupBytes:before.backup.length},
   blocked:{...blocked,primary:'unchanged',backup:'unchanged'},
   success:{keysRemoved:true,dialogClosed:true,pageErrors:errors}
  },null,2));
  console.log('T05 NATIVE RESET DENIAL + RETRY PASS',JSON.stringify({
   backupRetained:true,primaryRetained:true,visibleError:true,
   retriesSucceeded:true,noUncaughtPhaserError:true
  }));
 }finally{
  if(page&&!page.isClosed())await page.close();
  await browser.close();
  await new Promise(done=>server.close(done));
 }
})().catch(e=>{console.error(e);process.exitCode=1;if(server.listening)server.close()});
