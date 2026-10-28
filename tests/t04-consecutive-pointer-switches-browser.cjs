'use strict';
// T04: actual native Double Kick first contact, then REAL Phaser party pointer
// switch before the second kick. Nidoran/level/position are isolated fixtures;
// damage, timing, hit callbacks and the party transition are NOT forced.
// No edits to approved move, VFX, sprites, cooldowns or user save.
const assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises');
const path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg',
 '.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 const pathname=new URL(req.url||'/','http://127.0.0.1:4418').pathname;
 const file=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const data=await fsp.readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(data)}
 catch{res.writeHead(404);res.end('missing')}
});
(async()=>{
 fs.mkdirSync('test-evidence',{recursive:true});
 await new Promise(resolve=>server.listen(4418,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 const evidence={scope:'T04 native Double Kick and three consecutive pointer recalls on Phaser WebGL',
  fixture:'Nidoran Lv18, selected move, positions, immobilized opposing AI; NOT natural campaign',events:[]};
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4418/arena2d/?original=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  const setup=await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=window.t04Core=await import(new URL('./torre2/campaign-core.js',src));
   const moves=await import(new URL('./torre2/move-pool.js',src));
   const progression=await import(new URL('./torre2/progression.js',src));
   const state=core.createCampaign('bulbasaur');
   core.storePokemon(state,1); // Keep original Mewtwo in PC.
   const member={id:'nidoran-m',uid:'t04-nidoran-m',hp:100,
    progression:progression.createPokemonProgression('nidoran-m',18)};
   const learned=moves.availableMoves(member).map(x=>x.id);
   if(!learned.includes('double-kick'))throw Error('Double Kick is not unlocked at level 18');
   member.moves=[...moves.defaultLoadout(member)];
   member.moves[2]='double-kick';member.movePlanSpecies=member.id;
   const resolved=moves.resolveLoadout(member);
   const slot=Object.entries(resolved).find(([,m])=>m.id==='double-kick')?.[0];
   if(!slot)throw Error('Nidoran fixture cannot equip Double Kick');
   state.team.unshift(member);state.active=0;
   state.dexSeen.push(member.id);state.dexCaught.push(member.id);
   core.saveCampaign(state);
   window.__t04Slot=slot;
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
   return {slot,learned,party:state.team.map(m=>m.id)};
  });
  assert.deepEqual(setup.party,['nidoran-m','bulbasaur']);
  await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha')&&
   !!window.__pt2Game.scene.getScene('campanha').__torre2BattlePath,null,{timeout:60000});
  await page.evaluate(()=>{
   const c=window.__pt2Game.scene.getScene('campanha');
   c.enterBattle(window.t04Core.readCampaign(),false);
  });
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.fase==='lucha'&&b.__torre2PartyInstalled&&
    !b.__torre2Changing&&!b.__torre2BallTransitions&&
    b.__torre2SideParty?.slots?.[1]?.input?.enabled&&
    b.__torre2AutoMode?.zone?.active;
  },null,{timeout:70000});
  const ready=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   const me=b.luchadores[0],foe=b.luchadores[1],slot=window.__t04Slot;
   if(me.def.id!=='nidoran-m')throw Error('Unexpected active Pokémon: '+me.def.id);
   if(me.kit[slot]?.forma!=='torre2_doublekick')
    throw Error('Wrong native move: '+JSON.stringify(me.kit[slot]));
   b.controles[1].leer=()=>({mx:0,my:0,ax:me.x,ay:me.y});
   me.inmortal=true;foe.inmortal=false;foe.ko=false;
   me.energia=100;me.ulti=100;
   for(const key of ['lmb','rmb','q','e'])me.cd[key]=key===slot?0:100;
   me.accion=null;me.animAccion=null;me.dash=null;
   me.est={};me.dolorHasta=-1;me.ultimoAtaque=-100;
   me.ultimoBasico=-100;me.sobrecargaHasta=0;
   foe.hp=foe.hpMax;foe.est={};foe.dolorHasta=-1;
   foe.accion=null;foe.dash=null;
   const dir=foe.x>=me.x?1:-1;
   foe.x=me.x+dir*82;foe.y=me.y;
   foe.spr?.setPosition(foe.x,foe.y);
   me.ax=foe.x;me.ay=foe.y;
   b.pausado=false;b.pausaGolpe=0;b.fase='lucha';
   b.__t04Contacts=[];b.__t04FirstHit=null;
   const original=foe.recibir;
   foe.recibir=function(...args){
    const before=this.hp,result=original.apply(this,args);
    if(args[1]?.slot===slot&&result==='golpe'&&this.hp<before){
     const event={before,after:this.hp,damage:before-this.hp,slot:args[1].slot};
     b.__t04Contacts.push(event);
     if(b.__t04Contacts.length===1){
      b.__t04FirstHit=event;
      // Freeze immediately after a GENUINE first kick, before the second.
      // Phaser pointer and Pokéball timers continue to operate.
      b.__torre2BattleBagOpen=true;
     }
    }
    return result;
   };
   return {slot,move:me.kit[slot].nombre,renderer:me.kit[slot].forma,
    foeHp:foe.hp,positions:[[me.x,me.y],[foe.x,foe.y]],
    initialUses:me.stats.usosSlot?.[slot]||0};
  });
  assert.equal(ready.renderer,'torre2_doublekick');
  // Click the actual AUTO toggle: original Poké Arena IA must issue the
  // Double Kick through the real cooldown/energy/renderer pipeline.
  const autoTap=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),z=b.__torre2AutoMode.zone;
   const rect=document.querySelector('#juego canvas').getBoundingClientRect();
   return {x:rect.left+z.x*rect.width/640,y:rect.top+z.y*rect.height/360};
  });
  await page.mouse.click(autoTap.x,autoTap.y);
  assert.equal(await page.evaluate(()=>window.__pt2Game.scene.getScene('combate').__torre2AutoMode.enabled),
   true,'Real AUTO pointer must enable native AI');
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.__t04Contacts?.length===1&&b.__t04FirstHit&&b.__torre2BattleBagOpen;
  },null,{timeout:12000,polling:20});
  await page.evaluate(()=>{window.__pt2Game.scene.getScene('combate').__torre2AutoMode.enabled=false;});
  const first=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return {contacts:[...b.__t04Contacts],effects:b.efectos.length,
    uses:b.luchadores[0].stats.usosSlot?.[window.__t04Slot]||0,
    foeHp:b.luchadores[1].hp,phase:b.fase};
  });
  assert.equal(first.contacts.length,1);
  assert.ok(first.contacts[0].damage>0,'First kick must inflict native damage');
  assert.ok(first.uses>ready.initialUses,'Native AI must cast the move');
  assert.ok(first.effects>0,'Native second kick must still be pending');
  evidence.events.push({kind:'native first kick',ready,first});
  const tap=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate'),z=b.__torre2SideParty.slots[1];
   const rect=document.querySelector('#juego canvas').getBoundingClientRect();
   return {x:rect.left+z.x*rect.width/640,y:rect.top+z.y*rect.height/360};
  });
  await page.mouse.click(tap.x,tap.y);
  await page.waitForFunction(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return b.scene.isActive()&&b.datos.p1==='bulbasaur'&&
    b.datos.torre2.party.playerIndex===1&&b.fase==='lucha'&&!b.__torre2Changing;
  },null,{timeout:35000});
  const after=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   b.__torre2BattleBagOpen=false;
   return {species:b.luchadores[0].def.id,contacts:[...b.__t04Contacts],
    effects:b.efectos.length,tasks:b.tareas.length,foeHp:b.luchadores[1].hp,
    save:window.t04Core.readCampaign()};
  });
  assert.equal(after.species,'bulbasaur');
  assert.equal(after.contacts.length,1,'Second native kick leaked across recall');
  assert.equal(after.effects,0,'Stale native Double Kick VFX survived recall');
  assert.equal(after.tasks,0,'Stale native hit task survived recall');
  assert.ok(after.foeHp>=first.foeHp-.01,'Recall inflicted extra damage');
  assert.equal(after.save.wins,0);assert.equal(after.save.losses,0);

  // T04 regression: two more REAL pointer switches immediately after each
  // prior sendout finishes. No new move is cast; this isolates stale callbacks,
  // party identity and save integrity across consecutive native transitions.
  for (const [index, expected] of [[0,'nidoran-m'],[1,'bulbasaur']]) {
    const nextTap=await page.evaluate((slotIndex)=>{
      const b=window.__pt2Game.scene.getScene('combate');
      const z=b.__torre2SideParty.slots[slotIndex];
      if(!z?.input?.enabled)throw Error('Native party slot not enabled: '+slotIndex);
      b.__torre2BattleBagOpen=true;
      const rect=document.querySelector('#juego canvas').getBoundingClientRect();
      return {x:rect.left+z.x*rect.width/640,y:rect.top+z.y*rect.height/360};
    },index);
    await page.mouse.click(nextTap.x,nextTap.y);
    await page.waitForFunction(({index,expected})=>{
      const b=window.__pt2Game.scene.getScene('combate');
      return b.scene.isActive()&&b.datos.p1===expected&&
       b.datos.torre2.party.playerIndex===index&&b.fase==='lucha'&&
       !b.__torre2Changing&&b.__torre2SideParty?.slots?.[1-index]?.input?.enabled;
    },{index,expected},{timeout:35000});
    const snapshot=await page.evaluate(()=>{
      const b=window.__pt2Game.scene.getScene('combate');
      return {species:b.luchadores[0].def.id,foeHp:b.luchadores[1].hp,
       contacts:b.__t04Contacts?.length,effects:b.efectos.length,
       tasks:b.tareas.length,save:window.t04Core.readCampaign()};
    });
    assert.equal(snapshot.species,expected,'Consecutive switch changed wrong species');
    assert.equal(snapshot.contacts,1,'Old native Double Kick contact leaked after another recall');
    assert.equal(snapshot.effects,0,'Orphan VFX after consecutive switch');
    assert.equal(snapshot.tasks,0,'Orphan hit task after consecutive switch');
    assert.ok(snapshot.foeHp>=first.foeHp-.1,'Delayed hit reached opponent on repeated recall');
    assert.equal(snapshot.save.wins,0);
    assert.equal(snapshot.save.losses,0);
    assert.deepEqual(snapshot.save.team.map(m=>m.id).sort(),['bulbasaur','nidoran-m']);
    assert.equal(new Set(snapshot.save.team.map(m=>m.uid)).size,2,
      'Consecutive switches duplicated a party UID');
    evidence.events.push({kind:'consecutive native pointer switch',index,expected,
     contacts:snapshot.contacts,foeHp:snapshot.foeHp,
     effects:snapshot.effects,tasks:snapshot.tasks,
     team:snapshot.save.team.map(m=>({id:m.id,uid:m.uid,hp:m.hp}))});
  }
  await page.evaluate(()=>{window.__pt2Game.scene.getScene('combate').__torre2BattleBagOpen=false;});
  await page.waitForTimeout(1400);
  const settled=await page.evaluate(()=>{
   const b=window.__pt2Game.scene.getScene('combate');
   return {contacts:[...b.__t04Contacts],foeHp:b.luchadores[1].hp,
    species:b.luchadores[0].def.id,sceneActive:b.scene.isActive()};
  });
  assert.equal(settled.contacts.length,1,'Delayed second kick executed on new fighter');
  assert.ok(settled.foeHp>=first.foeHp-.1,'Delayed damage reached opponent');
  assert.equal(settled.species,'bulbasaur');
  assert.equal(settled.sceneActive,true);
  assert.deepEqual(errors,[],'Uncaught Phaser/browser errors');
  evidence.events.push({kind:'real pointer recall and delayed-hit guard',after,settled});
  await page.screenshot({path:'test-evidence/t04-consecutive-pointer-switches.png'});
  fs.writeFileSync('test-evidence/t04-consecutive-pointer-switches.json',JSON.stringify(evidence,null,2));
  console.log('T04 PASS: one native Double Kick impact; three native pointer switches without leaked hit; prepared campaign fixture');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
