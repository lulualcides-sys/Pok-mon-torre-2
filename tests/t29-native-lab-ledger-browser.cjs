'use strict';
// T29 regression: first real damage in Lab may not throw undefined.push.
// Uses the original Combate.anotarEntreno and original Luchador.recibir.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url||'/','http://127.0.0.1');
 const file=path.resolve(root,'.'+(url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const content=await fsp.readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(content)}
 catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(ok=>server.listen(4488,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4488/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(x=>x.src?.includes('/main.js')).src;
   window.t29Core=await import(new URL('./torre2/campaign-core.js',src));
   window.t29Core.saveCampaign(window.t29Core.createCampaign('bulbasaur'));
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'),null,{timeout:60000});
  const beforeSave=await page.evaluate(()=>localStorage.getItem(window.t29Core.SAVE_KEY));
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(x=>x.src?.includes('/main.js')).src;
   const lab=await import(new URL('./torre2/laboratory.js',src));
   const match=lab.prepareLaboratoryMatch({player:'charizard',enemy:'onix',level:50});
   window.__pt2Game.scene.getScene('campanha').launchBattle(match,false);
  });
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.__torre2LabInstalled&&b.fase==='lucha'&&
    b.__torre2Weather&&b.luchadores?.length===2;
  },null,{timeout:70000});
  const result=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),[attacker,defender]=b.luchadores;
   b.controles.forEach(c=>{c.leer=()=>null;});
   attacker.inmortal=true;defender.inmortal=true;
   attacker.est={};defender.est={};defender.hp=defender.hpMax;
   const initial={enemy:defender.def.id,player:attacker.def.id,
    ledger:Array.isArray(b.registroDano),count:b.registroDano?.length,
    combo:b.comboActual};
   const hp=defender.hp;
   const hit=defender.recibir(attacker,{dano:10,tipo:'WATER',slot:'q'});
   const output={hit,previousHp:hp,afterHp:defender.hp,
    damageRegistered:b.registroDano.length-initial.count,
    last:b.registroDano.at(-1),combo:b.comboActual,
    best:b.mejorCombo};
   return {initial,output,renderer:b.game.renderer.type};
  });
  assert.deepEqual([result.initial.player,result.initial.enemy],['charizard','onix']);
  assert.equal(result.initial.ledger,true,'Native damage array must exist before first strike');
  assert.ok(result.output.afterHp<result.output.previousHp,
   'Original Phaser recipient must inflict native type damage');
  assert.ok(result.output.damageRegistered>=1,
   'Original Phaser damage recorder must receive the first actual strike');
  assert.ok(result.output.last?.d>0,'Native ledger must record positive damage');
  assert.ok(result.output.combo>=1,'Native combo count must be initialized and increment');
  assert.equal(await page.evaluate(()=>localStorage.getItem(window.t29Core.SAVE_KEY)),beforeSave,
   'Laboratory test cannot change the real campaign save');
  assert.deepEqual(errors,[],'No browser exceptions in lab first hit');
  await page.screenshot({path:'test-evidence/t29-lab-real-first-hit.png'});
  fs.writeFileSync('test-evidence/t29-native-lab-ledger.json',JSON.stringify(result,null,2));
  console.log('T29 NATIVE LAB DAMAGE LEDGER PASS',JSON.stringify(result));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
