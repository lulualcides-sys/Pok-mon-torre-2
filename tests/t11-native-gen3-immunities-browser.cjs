'use strict';
// T11: inspect Gen III immunities through the actual Phaser Luchador.recibir
// path. Trainer stage and temporary type overrides are test fixtures, not a
// naturally completed campaign. No moves, sprite, VFX, saves or RNG patched.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 const uri=new URL(req.url||'/','http://127.0.0.1');
 const file=path.resolve(root,'.'+(uri.pathname.endsWith('/')?uri.pathname+'index.html':uri.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const bytes=await fsp.readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(bytes)}
 catch{res.writeHead(404);res.end('missing')}
});
const pairs=[['NORMAL','GHOST'],['FIGHTING','GHOST'],['GHOST','NORMAL'],
 ['ELECTRIC','GROUND'],['GROUND','FLYING'],['POISON','STEEL'],['PSYCHIC','DARK']];
const report={scope:'T11 seven Gen III immunities in original Phaser damage recipient',
 pairs,fixture:'Gym opponent Geodude and temporary defender typings; no natural route completion'};
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(ok=>server.listen(4437,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4437/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=window.t11Core=await import(new URL('./torre2/campaign-core.js',src));
   const state=core.createCampaign('bulbasaur');
   state.trainer=13; // Test-only Brock checkpoint: no wins or badges fabricated.
   state.team[0].id='pikachu';state.team[0].progression.species='pikachu';
   core.saveCampaign(state);
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'),null,{timeout:60000});
  await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   c.enterBattle(window.t11Core.readCampaign(),false);
  });
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.__torre2PartyInstalled&&b.fase==='lucha'&&
    !b.__torre2Changing&&!b.__torre2BallTransitions;
  },null,{timeout:70000});
  const details=await page.evaluate(async pairs=>{
   const b=window.__pt2Game.scene.getScene('combate');
   const [player,enemy]=b.luchadores;
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const {GEN3_TYPES,GEN3_CHART,gen3Effectiveness,gen3Stab,gen3Category,gen3BurnModifier}
     =await import(new URL('./torre2/gen3-types.js',src));
   if(enemy.def.id!=='geodude')throw Error('Expected genuine Geodude in Brock battle: '+enemy.def.id);
   if(!enemy.tipos.includes('GROUND'))throw Error('Original Geodude must be Ground');
   b.__torre2TrainerStrategy.enabled=false;
   player.inmortal=true;enemy.inmortal=true;
   const initialSave=window.t11Core.readCampaign();
   const progress={wins:initialSave.wins,losses:initialSave.losses,
    stage:initialSave.stage,trainer:initialSave.trainer,
    money:initialSave.money,balls:initialSave.inventory.pokeball,
    uid:initialSave.team[0].uid};
   const checks=[];
   // A genuine, unmodified Ground Geodude must be immune to Electric.
   enemy.hp=enemy.hpMax;enemy.ko=false;enemy.est={};
   const nativeBefore=enemy.hp;
   const nativeResult=enemy.recibir(player,{dano:10,tipo:'ELECTRIC',slot:'q'});
   const native={player:player.def.id,enemy:enemy.def.id,
    typing:[...enemy.tipos],before:nativeBefore,after:enemy.hp,result:nativeResult};
   for(const [type,defender]of pairs){
    // Only the TYPE getter is overridden in the fixture to cover matchups
    // unavailable in this one trainer's natural battle; call the UNALTERED
    // engine's actual recibir method each time.
    Object.defineProperty(enemy,'tipos',{configurable:true,value:[defender]});
    enemy.hp=enemy.hpMax;enemy.ko=false;enemy.est={};
    const before=enemy.hp;
    const result=enemy.recibir(player,{dano:10,tipo:type,slot:'q'});
    checks.push({attack:type,defense:defender,
     expected:gen3Effectiveness(type,[defender]),before,after:enemy.hp,result});
   }
   delete enemy.tipos;
   const saved=window.t11Core.readCampaign();
   const afterProgress={wins:saved.wins,losses:saved.losses,stage:saved.stage,
    trainer:saved.trainer,money:saved.money,balls:saved.inventory.pokeball,
    uid:saved.team[0].uid};
   const extra={typeCount:GEN3_TYPES.length,chartRows:Object.keys(GEN3_CHART).length,
    stab:gen3Stab('FIRE',['FIRE']),ghostPhysical:gen3Category('GHOST'),
    darkSpecial:gen3Category('DARK'),
    burnedGhost:gen3BurnModifier('GHOST',{quemado:{}}),
    burnedDark:gen3BurnModifier('DARK',{quemado:{}})};
   return {native,checks,progress,afterProgress,extra,renderer:b.game.renderer.type};
  },pairs);
  assert.equal(details.native.result,'miss','Original Geodude must ignore Electric entirely');
  assert.equal(details.native.after,details.native.before);
  assert.deepEqual(details.native.typing.includes('GROUND'),true);
  assert.equal(details.extra.typeCount,17);
  assert.equal(details.extra.chartRows,17);
  assert.equal(details.extra.stab,1.5);
  assert.equal(details.extra.ghostPhysical,'PHYSICAL');
  assert.equal(details.extra.darkSpecial,'SPECIAL');
  assert.equal(details.extra.burnedGhost,.5);
  assert.equal(details.extra.burnedDark,1);
  for(const row of details.checks){
   assert.equal(row.expected,0,'Source reference mismatch for '+JSON.stringify(row));
   assert.equal(row.result,'miss','Native Phaser failed immunity '+JSON.stringify(row));
   assert.equal(row.after,row.before,'Native Phaser reduced HP on immunity '+JSON.stringify(row));
  }
  assert.deepEqual(details.afterProgress,details.progress,
   'Damage immunity fixture cannot change campaign money, wins, badges or UID');
  assert.deepEqual(errors,[],'No Phaser browser exception');
  report.details=details;
  await page.screenshot({path:'test-evidence/t11-native-gen3-immunities.png'});
  fs.writeFileSync('test-evidence/t11-native-gen3-immunities.json',JSON.stringify(report,null,2));
  console.log('T11 NATIVE GEN3 IMMUNITY PASS',JSON.stringify(details));
 }finally{await browser.close();server.close()}
})().catch(error=>{console.error(error);process.exitCode=1;server.close()});
