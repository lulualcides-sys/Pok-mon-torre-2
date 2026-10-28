'use strict';
// T05 - Chromium reload recovery test against the actual generated Phaser game.
// Does not modify any player's save, only an isolated browser localStorage.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg',
 '.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url||'/','http://127.0.0.1:4367');
 const file=path.resolve(root,'.'+(url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const data=await fsp.readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(data)}
 catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(resolve=>server.listen(4367,'127.0.0.1',resolve));
 const browser=await chromium.launch({
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']
 });
 try{
  const page=await browser.newPage({viewport:{width:854,height:480}}),errors=[];
  page.on('pageerror',err=>errors.push(String(err)));
  const url='http://127.0.0.1:4367/arena2d/?original=1';
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  const before=await page.evaluate(async()=>{
   const src=[...document.scripts].find(x=>x.src?.includes('/main.js')).src;
   const core=await import(new URL('./torre2/campaign-core.js',src).href);
   const s=core.createCampaign('charmander');
   s.stage=1;s.trainer=3;s.money=4510;s.team[0].hp=63;
   s.wins=17;s.badges=['Rocha'];s.gymTMClaims=['tm-rock-tomb'];
   s.inventory.tms=['tm-rock-tomb'];s.inventory.pokeball=11;
   s.box.push(s.team.pop()); // The permanent Mewtwo stays in PC.
   core.saveCampaign(s);
   // Prime additive defaults via native migration before capturing the exact
   // last-known-good serialized byte sequence.
   const migrated=core.readCampaign();
   const valid=localStorage.getItem(core.SAVE_KEY);
   localStorage.setItem(core.SAVE_BACKUP_KEY,valid);
   localStorage.setItem(core.SAVE_KEY,JSON.stringify({...migrated,team:[]}));
   return {valid,corruptValidJson:true,stage:migrated.stage,wins:migrated.wins,
    money:migrated.money,box:migrated.box.map(x=>x.id),balls:migrated.inventory.pokeball,
    team:migrated.team.map(x=>x.id),hp:migrated.team[0].hp};
  });
  // True page reload: global JS, Phaser scene and ES module references reset.
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  const after=await page.evaluate(async()=>{
   const src=[...document.scripts].find(x=>x.src?.includes('/main.js')).src;
   const core=await import(new URL('./torre2/campaign-core.js',src).href);
   const restored=core.readCampaign();
   if(!restored)throw Error('Native save load failed after browser reload');
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
   return {primary:localStorage.getItem(core.SAVE_KEY),backup:localStorage.getItem(core.SAVE_BACKUP_KEY),
    stage:restored.stage,wins:restored.wins,money:restored.money,team:restored.team.map(x=>x.id),
    box:restored.box.map(x=>x.id),hp:restored.team[0].hp,balls:restored.inventory.pokeball,
    claims:restored.gymTMClaims,items:restored.inventory.tms};
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
   !!window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,null,{timeout:45000});
  assert.equal(after.primary,before.valid);
  assert.equal(after.backup,before.valid);
  for(const k of ['stage','wins','money','balls','hp'])assert.equal(after[k],before[k],k);
  assert.deepEqual(after.box,['mewtwo']);
  assert.deepEqual(after.team,['charmander']);
  assert.deepEqual(after.claims,['tm-rock-tomb']);
  assert.deepEqual(after.items,['tm-rock-tomb']);
  await page.screenshot({path:'test-evidence/t05-browser-restored-campaign.png'});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  const second=await page.evaluate(async()=>{
   const src=[...document.scripts].find(x=>x.src?.includes('/main.js')).src;
   const core=await import(new URL('./torre2/campaign-core.js',src).href);
   const s=core.readCampaign();
   return {team:s.team.map(x=>x.id),box:s.box.map(x=>x.id),money:s.money,
    saved:localStorage.getItem(core.SAVE_KEY),backup:localStorage.getItem(core.SAVE_BACKUP_KEY)};
  });
  assert.deepEqual(second.team,['charmander']);
  assert.deepEqual(second.box,['mewtwo']);
  assert.equal(second.money,4510);
  assert.equal(second.saved,before.valid);
  assert.equal(second.backup,before.valid);
  // Another genuine page reload: a JSON-valid primary repeats the same
  // creature identity in party and PC. Restore the clean backup byte-for-byte.
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(x=>x.src?.includes('/main.js')).src;
   const core=await import(new URL('./torre2/campaign-core.js',src).href);
   const good=localStorage.getItem(core.SAVE_KEY);
   const corrupt=JSON.parse(good);
   corrupt.box[0].uid=corrupt.team[0].uid;
   localStorage.setItem(core.SAVE_BACKUP_KEY,good);
   localStorage.setItem(core.SAVE_KEY,JSON.stringify(corrupt));
  });
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  const identityRecovery=await page.evaluate(async()=>{
   const src=[...document.scripts].find(x=>x.src?.includes('/main.js')).src;
   const core=await import(new URL('./torre2/campaign-core.js',src).href);
   const state=core.readCampaign();
   return {primary:localStorage.getItem(core.SAVE_KEY),
    backup:localStorage.getItem(core.SAVE_BACKUP_KEY),
    team:state.team.map(x=>({id:x.id,uid:x.uid})),
    box:state.box.map(x=>({id:x.id,uid:x.uid})),money:state.money};
  });
  assert.equal(identityRecovery.primary,before.valid);
  assert.equal(identityRecovery.backup,before.valid);
  assert.notEqual(identityRecovery.team[0].uid,identityRecovery.box[0].uid);
  assert.deepEqual(identityRecovery.team.map(x=>x.id),['charmander']);
  assert.deepEqual(identityRecovery.box.map(x=>x.id),['mewtwo']);
  assert.equal(identityRecovery.money,4510);
  // Real Phaser/WebGL browser, with a deliberately failing storage adapter.
  // This is a controlled quota/security fixture, not an actual full disk.
  const readOnly=await page.evaluate(async()=>{
   const src=[...document.scripts].find(x=>x.src?.includes('/main.js')).src;
   const core=await import(new URL('./torre2/campaign-core.js',src).href);
   const good=localStorage.getItem(core.SAVE_KEY);
   const broken=JSON.stringify({...JSON.parse(good),team:[]});
   const data=new Map([[core.SAVE_KEY,broken],[core.SAVE_BACKUP_KEY,good]]);
   let rejected=0;
   const readonly={getItem:key=>data.get(key)??null,
    setItem(){rejected++;throw new DOMException('Quota exceeded','QuotaExceededError')}};
   const restored=core.readCampaign(readonly);
   const migration=JSON.parse(good);
   delete migration.leagueHonors;
   const legacyData=new Map([[core.SAVE_KEY,JSON.stringify(migration)]]);
   const legacyReadonly={getItem:key=>legacyData.get(key)??null,
    setItem(){rejected++;throw new DOMException('Storage blocked','SecurityError')}};
   const migrated=core.readCampaign(legacyReadonly);
   const b=window.__pt2Game.scene.getScene('titulo');
   return {restored:restored&&{stage:restored.stage,wins:restored.wins,
     team:restored.team.map(x=>x.id),box:restored.box.map(x=>x.id)},
    migrated:migrated&&{stage:migrated.stage,wins:migrated.wins,
     leagueHonors:migrated.leagueHonors,team:migrated.team.map(x=>x.id)},
    rejected,primaryUnchanged:data.get(core.SAVE_KEY)===broken,
    backupUnchanged:data.get(core.SAVE_BACKUP_KEY)===good,
    sceneActive:b.scene.isActive(),renderer:window.__pt2Game.config.type,
    liveSaveUnchanged:localStorage.getItem(core.SAVE_KEY)===good};
  });
  assert.ok(readOnly.restored&&readOnly.migrated,'read-only storage must not blank campaign');
  assert.equal(readOnly.restored.stage,1);
  assert.equal(readOnly.restored.wins,17);
  assert.deepEqual(readOnly.restored.team,['charmander']);
  assert.deepEqual(readOnly.restored.box,['mewtwo']);
  assert.deepEqual(readOnly.migrated.leagueHonors,[]);
  assert.equal(readOnly.rejected,2,'both recovery and migration writes must be rejected');
  assert.ok(readOnly.primaryUnchanged&&readOnly.backupUnchanged&&readOnly.liveSaveUnchanged,
   'storage failures must not overwrite primary, backup or actual browser save');
  assert.ok(readOnly.sceneActive,'Phaser scene must remain active');
  console.log('T05 READ-ONLY STORAGE PASS',JSON.stringify(readOnly));
  // Browser/Phaser proof for independently denied storage reads. The actual
  // browser localStorage is untouched: adapters simulate SecurityError.
  const partialRead=await page.evaluate(async()=>{
   const src=[...document.scripts].find(x=>x.src?.includes('/main.js')).src;
   const core=await import(new URL('./torre2/campaign-core.js',src).href);
   const good=localStorage.getItem(core.SAVE_KEY);
   const data=new Map([[core.SAVE_KEY,good],[core.SAVE_BACKUP_KEY,good]]);
   let writes=0;
   const noBackup={
    getItem:key=>{
     if(key===core.SAVE_BACKUP_KEY)throw new DOMException('Denied backup','SecurityError');
     return data.get(key)??null;
    },
    setItem(){writes++;throw Error('Unexpected write')}
   };
   const primary=core.readCampaign(noBackup);
   const corrupt=JSON.stringify({...JSON.parse(good),team:[]});
   data.set(core.SAVE_KEY,corrupt);
   const noPrimary={
    getItem:key=>{
     if(key===core.SAVE_KEY)throw new DOMException('Denied primary','SecurityError');
     return data.get(key)??null;
    },
    setItem(){writes++;throw new DOMException('Quota exceeded','QuotaExceededError')}
   };
   const backup=core.readCampaign(noPrimary);
   return {primaryOk:JSON.stringify(primary)===good,
    backupOk:JSON.stringify(backup)===good,
    primaryStatus:primary?.team[0]?.status??null,
    backupStatus:backup?.team[0]?.status??null,
    writes,backupUnchanged:data.get(core.SAVE_BACKUP_KEY)===good,
    corruptPrimaryUnchanged:data.get(core.SAVE_KEY)===corrupt,
    liveSaveUnchanged:localStorage.getItem(core.SAVE_KEY)===good,
    sceneActive:window.__pt2Game.scene.isActive('titulo')};
  });
  assert.ok(partialRead.primaryOk&&partialRead.backupOk,
   'one denied storage key must not blank a recoverable campaign');
  assert.equal(partialRead.writes,1,'only the backup recovery attempts a write');
  assert.ok(partialRead.backupUnchanged&&partialRead.corruptPrimaryUnchanged&&
   partialRead.liveSaveUnchanged&&partialRead.sceneActive,
   'partial read errors must preserve both stored checkpoints and Phaser scene');
  console.log('T05 PARTIAL STORAGE READ PASS',JSON.stringify(partialRead));
  await page.screenshot({path:'test-evidence/t05-browser-uid-recovery.png'});
  assert.deepEqual(errors,[]);
  console.log('T05 PASS REAL RELOAD: structural and duplicate-UID corruption recovered from clean backup; PC/cash/items/HP/badges intact');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
