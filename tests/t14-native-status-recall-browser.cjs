'use strict';
// T14: real Phaser pointer swaps must retain a major condition on its OWN
// Pokémon and clear volatile confusion, never leak either to the reserve.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1');
 const file=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const bytes=await fsp.readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(bytes)}
 catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(ok=>server.listen(4446,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:854,height:480},hasTouch:true,isMobile:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const tap=async(x,y)=>{
   const pt=await page.evaluate(([x,y])=>{
    const c=document.querySelector('#juego canvas')||document.querySelector('canvas');
    const q=c.getBoundingClientRect();
    return {x:q.left+x*q.width/640,y:q.top+y*q.height/360};
   },[x,y]);
   assert.ok(pt.x>=0&&pt.x<=854&&pt.y>=0&&pt.y<=480);
   await page.touchscreen.tap(pt.x,pt.y);
  };
  await page.goto('http://127.0.0.1:4446/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=window.t14Core=await import(new URL('./torre2/campaign-core.js',src));
   const st=core.createCampaign('bulbasaur');
   core.storePokemon(st,1); // Leave Lv50 QA Mewtwo in PC.
   st.team.push(core.createCampaign('squirtle').team[0]);core.saveCampaign(st);
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
   window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,null,{timeout:60000});
  const pos=await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   const z=c.children.list.find(o=>o.active&&o.input?.enabled&&
    o.getData?.('torre2-central-cta')===true);
   if(!z)throw Error('Native Kanto battle CTA missing');
   return {x:z.x,y:z.y};
  });
  await tap(pos.x,pos.y);
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.__torre2PartyInstalled&&b.fase==='lucha'&&
    b.__torre2SideParty?.slots?.[1]?.input?.enabled&&!b.__torre2Changing&&
    !b.__torre2BallTransitions;
  },null,{timeout:70000});
  const start=await page.evaluate(async()=>{
   const b=window.__pt2Game.scene.getScene('combate'),a=b.luchadores[0];
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const rules=await import(new URL('./torre2/gen3-status.js',src));
   b.luchadores.forEach(actor=>{actor.inmortal=true;});
   b.controles[0].leer=()=>({mx:0,my:0,ax:a.x,ay:a.y});
   if(!rules.applyGen3Status(a,'quemado')||!a.est.quemado?.torre2Status)
    throw Error('Native major burn status failed to apply');
   if(!rules.applyGen3Status(a,'confuso',{},()=>.99)||!a.est.confuso?.torre2Status)
    throw Error('Native confusion failed to apply');
   const st=window.t14Core.readCampaign();
   return {species:a.def.id,status:rules.serializeGen3Status(a),confused:!!a.est.confuso,
    money:st.money,wins:st.wins,trainer:st.trainer,
    party:st.team.map(m=>({id:m.id,uid:m.uid}))};
  });
  assert.equal(start.species,'bulbasaur');
  assert.equal(start.status?.kind,'quemado');
  assert.equal(start.confused,true);
  const nativeTap=async index=>{
   const p=await page.evaluate(i=>{
    const b=window.__pt2Game.scene.getScene('combate');
    const z=b.__torre2SideParty.slots[i];
    if(!z?.input?.enabled)throw Error('Reserve slot not active '+i);
    return {x:z.x,y:z.y};
   },index);
   await tap(p.x,p.y);
  };
  await nativeTap(1);
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.fase==='lucha'&&!b.__torre2Changing&&
    b.datos.torre2.party.playerIndex===1&&b.luchadores[0]?.def.id==='squirtle';
  },null,{timeout:32000});
  const reserve=await page.evaluate(async()=>{
   const b=window.__pt2Game.scene.getScene('combate'),a=b.luchadores[0];
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const {serializeGen3Status}=await import(new URL('./torre2/gen3-status.js',src));
   return {species:a.def.id,status:serializeGen3Status(a),confused:!!a.est?.confuso,
    burned:!!a.est?.quemado,
    savedParty:b.datos.torre2.party.friend.map(m=>({uid:m.uid,status:m.status}))};
  });
  assert.equal(reserve.species,'squirtle');
  assert.equal(reserve.status,null,'Outgoing burn must not transfer to reserve');
  assert.equal(reserve.confused,false,'Volatile confusion must not transfer');
  assert.equal(reserve.burned,false,'Reserve must not inherit previous fighter burn');
  assert.equal(reserve.savedParty[0].status?.kind,'quemado',
   'Outgoing starter must retain persistent major status by UID');
  await nativeTap(0);
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.fase==='lucha'&&!b.__torre2Changing&&
    b.datos.torre2.party.playerIndex===0&&b.luchadores[0]?.def.id==='bulbasaur';
  },null,{timeout:32000});
  const returned=await page.evaluate(async()=>{
   const b=window.__pt2Game.scene.getScene('combate'),a=b.luchadores[0];
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const {serializeGen3Status}=await import(new URL('./torre2/gen3-status.js',src));
   const st=window.t14Core.readCampaign();
   return {species:a.def.id,status:serializeGen3Status(a),confused:!!a.est?.confuso,
    money:st.money,wins:st.wins,trainer:st.trainer,
    party:st.team.map(m=>({id:m.id,uid:m.uid}))};
  });
  assert.equal(returned.species,'bulbasaur');
  assert.equal(returned.status?.kind,'quemado','Major status must survive recall/sendout');
  assert.equal(returned.confused,false,'Volatile confusion must end when recalled (Gen III)');
  assert.equal(returned.money,start.money);
  assert.equal(returned.wins,start.wins);
  assert.equal(returned.trainer,start.trainer);
  assert.deepEqual(returned.party,start.party);
  assert.deepEqual(errors,[],'No Phaser runtime errors');
  await page.screenshot({path:'test-evidence/t14-mobile-major-status-after-recall.png'});
  const evidence={scope:'T14 live major status by UID and confusion reset across two touchscreen swaps',
   fixture:'native Gen III statuses prepared on fighter; trainer victory/items are not simulated',
   start,reserve,returned};
  fs.writeFileSync('test-evidence/t14-native-status-recall.json',JSON.stringify(evidence,null,2));
  console.log('T14 NATIVE STATUS SWITCH PASS',JSON.stringify({start:start.status,
   reserve:reserve.status,returned:returned.status,confusionCleared:!returned.confused}));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
