#!/usr/bin/env node
/* Pokémon Torre 2 — robot that plays the campaign by itself (owner 2026-11-22:
 * "monta o robô que joga sozinho"), so long playthroughs cost GitHub minutes,
 * not chat tokens. It plays REAL battles in the Phaser arena (AUTO on, VEL 2x)
 * like a player:
 *  - starts a fresh journey (createPlayerCampaign: starter only, no Mewtwo);
 *  - fights the next trainer/leader; heals at the Center when the team is down;
 *  - after two losses to the same opponent, trains in the tall grass;
 *  - in wild battles it captures NEW species (Poké Ball button, low HP) until
 *    the team has six; buys Poké Balls at the Mart when it runs out;
 *  - resolves Eevee's choice at random.
 * It writes a SHORT text report (JSON + Markdown): badges, battles, wins,
 * losses, captures, heals, time per badge, FPS and every JS error. Screenshots
 * only when something goes wrong.
 *
 * Usage: node tools/dev/campaign-robot.cjs --site _site --badges 3 --minutes 50 --out test-evidence/robo
 *   --badges tudo   plays the WHOLE game: 8 badges, Elite Four and Champion.
 *   --resume DIR    continues the journey saved by a previous part (DIR holds
 *                   save.json + report.json), so a long journey can be split
 *                   across several Actions runs (each run is limited to 6 h).
 */
'use strict';
const fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
let chromium;try{({chromium}=require('playwright-core'))}catch{({chromium}=require('playwright'))}
const arg=(k,d)=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:d};
const SITE=path.resolve(arg('site','_site')),BADGES_ARG=String(arg('badges','3')),BADGES=/^(tudo|all|liga)$/i.test(BADGES_ARG)?Infinity:Number(BADGES_ARG),MINUTES=Number(arg('minutes',50));
const OUT=path.resolve(arg('out','test-evidence/campaign-robot')),STARTER=arg('starter','random'),PORT=Number(arg('port',4390));
const RESUME=arg('resume',null)?path.resolve(arg('resume')):null;
const MIME={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg',
 '.webp':'image/webp','.ogg':'audio/ogg','.mp3':'audio/mpeg','.wasm':'application/wasm','.css':'text/css','.txt':'text/plain'};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const log=(...a)=>console.log('[robo]',...a);

(async()=>{
 await fsp.mkdir(OUT,{recursive:true});
 const server=http.createServer(async(req,res)=>{const u=new URL(req.url,'http://x');
  const f=path.resolve(SITE,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':decodeURIComponent(u.pathname)));
  if(!f.startsWith(SITE)){res.writeHead(403);return res.end()}
  try{const d=await fsp.readFile(f);res.writeHead(200,{'content-type':MIME[path.extname(f)]||'application/octet-stream'});res.end(d)}
  catch{res.writeHead(404);res.end()}});
 await new Promise(r=>server.listen(PORT,'127.0.0.1',r));
 const exe=process.env.CHROME_BIN&&fs.existsSync(process.env.CHROME_BIN)?process.env.CHROME_BIN:undefined;
 const browser=await chromium.launch({executablePath:exe,headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage({viewport:{width:960,height:540}});
 const report={started:new Date().toISOString(),goalBadges:BADGES===Infinity?'tudo':BADGES,part:1,minutesTotal:0,minutes:MINUTES,starter:null,badges:0,stage:0,champion:false,
  battles:0,wins:0,losses:0,wild:0,captures:0,captureTries:0,heals:0,ballsBought:0,eevee:0,grindBattles:0,
  badgeTimeline:[],fps:{samples:0,avg:null,min:null},battleSecondsAvg:null,errors:[],stuck:null,finished:null,screenshots:[]};
 const errors=new Map();const addErr=(kind,msg)=>{const k=kind+': '+String(msg).slice(0,300);errors.set(k,(errors.get(k)||0)+1)};
 page.on('pageerror',e=>addErr('pageerror',e.message||e));
 page.on('console',m=>{if(m.type()==='error'&&!/favicon|Failed to load resource|WebSocket connection/.test(m.text()))addErr('console',m.text())});
 const shot=async name=>{const f=path.join(OUT,name+'.png');try{await page.screenshot({path:f});report.screenshots.push(path.basename(f))}catch{}};
 const t0=Date.now(),timeUp=()=>Date.now()-t0>MINUTES*60000;
 // Continue a journey from a previous part: same save, cumulative totals.
 let resumeSave=null;
 if(RESUME){
  resumeSave=JSON.parse(await fsp.readFile(path.join(RESUME,'save.json'),'utf8'));
  try{const prev=JSON.parse(await fsp.readFile(path.join(RESUME,'report.json'),'utf8'));
   for(const k of ['battles','wins','losses','wild','captures','captureTries','heals','ballsBought','eevee','grindBattles'])report[k]=Number(prev[k])||0;
   report.badgeTimeline=Array.isArray(prev.badgeTimeline)?prev.badgeTimeline:[];report.part=(Number(prev.part)||1)+1;
   report.minutesTotal=Number(prev.minutesTotal??prev.minutesUsed)||0;}catch{}
 }
 const fpsAll=[],battleSecs=[];
 try{
  await page.goto(`http://127.0.0.1:${PORT}/arena2d/?original=1`,{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.__pt2Game?.scene?.isActive('titulo'),null,{timeout:120000});
  // Fresh player journey, AUTO battles at 2x speed.
  report.starter=await page.evaluate(async([starterArg,saved])=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   window.__core=await import(new URL('./torre2/campaign-core.js',src));
   localStorage.setItem('torre2-battle-speed','2');localStorage.setItem('torre2-tutorial-seen','1');
   let starter;
   if(saved){window.__core.saveCampaign(saved);starter=saved.starter}
   else{starter=starterArg==='random'?['bulbasaur','charmander','squirtle'][Math.floor(Math.random()*3)]:starterArg;
    window.__core.saveCampaign(window.__core.createPlayerCampaign(starter))}
   const g=window.__pt2Game;g.scene.getScenes(true)[0].scene.start('campanha');
   await new Promise(r=>{const t=setInterval(()=>{if(g.scene.isActive('campanha')){clearInterval(t);setTimeout(r,1500)}},100)});
   return starter;
  },[STARTER,resumeSave]);
  log('starter',report.starter);
  const state=()=>page.evaluate(()=>window.__core.readCampaign());
   // One real battle; resolves when the campaign scene is back.
  async function battle(wild){
   const before=await state();
   await page.evaluate(([wild])=>{const s=window.__pt2Game.scene.getScene('campanha');s.enterBattle(window.__core.readCampaign(),wild,{skipStory:true})},[wild]);
   try{await page.waitForFunction(()=>{const c=window.__pt2Game.scene.getScene('combate');return c?.sys.isActive()&&c.fase==='lucha'},null,{timeout:90000})}
   catch{await shot('falha-inicio-luta-'+report.battles);throw Error('a luta não começou em 90 s')}
   const bt=Date.now();let tried=false;
   for(;;){
    await sleep(1000);
    const st=await page.evaluate(()=>{const g=window.__pt2Game,c=g.scene.getScene('combate');
     const active=c?.sys.isActive();const e=c?.luchadores?.[1];
     return {active,fps:g.loop.actualFps,foeHp:e?.hpMax?e.hp/e.hpMax:1,phase:c?.fase,canCapture:!!c?.__torre2WildCapture&&!c?.__torre2CaptureBusy}});
    if(!st.active)break;
    if(st.fps)fpsAll.push(st.fps);
    // Capture a NEW species when its HP is low (the real Poké Ball button).
    if(wild&&!tried&&st.canCapture&&st.foeHp>0&&st.foeHp<.45&&st.phase==='lucha'){
     const want=await page.evaluate(()=>{const s=window.__core.readCampaign();return s.team.length<6&&(s.inventory?.pokeball||0)>0&&s.pendingWild&&!(s.dexCaught||[]).includes(s.pendingWild.id)});
     if(want){tried=true;report.captureTries++;
      await page.evaluate(()=>{const c=window.__pt2Game.scene.getScene('combate');
       const z=c.children.list.find(o=>o.type==='Zone'&&o.getData?.('torre2-capture-single-button'));z?.emit('pointerdown',{},0,0,{stopPropagation(){}})});
      await sleep(400);
      await page.evaluate(()=>{const c=window.__pt2Game.scene.getScene('combate');
       const zones=c.children.list.filter(o=>o.type==='Zone'&&o.depth===2715&&Math.round(o.x)===316);zones[0]?.emit('pointerdown',{},0,0,{stopPropagation(){}})});
     }
    }
    if(Date.now()-bt>300000){await shot('falha-luta-longa-'+report.battles);throw Error('luta passou de 5 min')}
   }
   await page.waitForFunction(()=>window.__pt2Game.scene.isActive('campanha'),null,{timeout:60000});
   await sleep(1200);
   battleSecs.push((Date.now()-bt)/1000);
   const after=await state();
   report.battles++;
   const won=after.wins>before.wins;won?report.wins++:after.losses>before.losses&&report.losses++;
   if(wild)report.wild++;
   const caught=(after.team.length+after.box.length)-(before.team.length+before.box.length);if(caught>0)report.captures+=caught;
   // Close the report/evolution panels exactly like returning to the map.
   await page.evaluate(()=>{const s=window.__pt2Game.scene.getScene('campanha');s.renderCampaign(window.__core.readCampaign())});
   await sleep(600);
   return {won,before,after};
  }
  let lastKey='',lossesHere=0,attemptsHere=0,grindLeft=0,lastBadges=(await state()).badges?.length||0;
  while(!timeUp()){
   let s=await state();
   report.badges=(s.badges||[]).length;report.stage=s.stage;report.champion=!!s.champion;
   if(report.badges>lastBadges){report.badgeTimeline.push({badges:report.badges,minutes:+(report.minutesTotal+(Date.now()-t0)/60000).toFixed(1),battles:report.battles});lastBadges=report.badges;log('insígnia',report.badges)}
   if(s.champion||report.badges>=BADGES){report.finished=s.champion?'campeão':'meta de insígnias';break}
   // Eevee choice, Center, Mart.
   const ev=await page.evaluate(()=>{const s=window.__core.readCampaign(),p=window.__core.pendingEeveeEvolution(s);if(!p)return false;window.__core.chooseEeveeEvolution(s,p.uid,'random');return true});
   if(ev)report.eevee++;
   s=await state();
   if(s.team.every(m=>(m.hp??100)<=0)||(s.team[s.active]?.hp??100)<=0||s.team.some(m=>(m.hp??100)<35)){await page.evaluate(()=>window.__core.healTeam(window.__core.readCampaign()));report.heals++}
   s=await state();
   if((s.inventory?.pokeball||0)<2&&s.money>=600){const n=await page.evaluate(()=>{let n=0;for(let i=0;i<5;i++){const r=window.__core.purchaseItem(window.__core.readCampaign(),'pokeball');if(r?.ok===false)break;n++}return n});report.ballsBought+=n}
   s=await state();
   const opp=await page.evaluate(()=>{const o=window.__core.currentOpponent(window.__core.readCampaign());return o?{id:o.id,leader:!!o.leader,name:o.name}:null});
   const key=s.stage+':'+s.trainer;
   if(key!==lastKey){lastKey=key;lossesHere=0;attemptsHere=0;grindLeft=0}
   // Stuck = the same opponent beat us 12 times even with training between.
   if(lossesHere>=12||attemptsHere>=90){report.stuck={stage:s.stage,trainer:s.trainer,opponent:opp?.name||opp?.id,attempts:attemptsHere,losses:lossesHere};await shot('travado-'+key.replace(':','-'));break}
   // After a loss: train in the tall grass (more each time; also captures
   // new species) before trying the same opponent again.
   const wantWild=grindLeft>0||(s.team.length<3&&Math.random()<.35);
   if(wantWild){
    const w=await page.evaluate(()=>{const r=window.__core.startWildEncounter(window.__core.readCampaign(),Math.random,null,null);return r?.ok!==false});
    if(w){attemptsHere++;const grinding=grindLeft>0;await battle(true);if(grinding){report.grindBattles++;grindLeft--}continue}
    grindLeft=0;
   }
   attemptsHere++;
   const r=await battle(false);
   if(!r.won){lossesHere++;grindLeft=Math.min(8,1+lossesHere)}
  }
  if(!report.finished&&!report.stuck)report.finished='tempo esgotado';
 }catch(e){report.finished='erro do robô';addErr('robot',e.message);await shot('erro-robo')}
 finally{
  report.minutesUsed=+((Date.now()-t0)/60000).toFixed(1);
  report.minutesTotal=+(report.minutesTotal+report.minutesUsed).toFixed(1);
  // The journey so far, for the next part (--resume).
  try{const save=await page.evaluate(()=>window.__core?.readCampaign());if(save)await fsp.writeFile(path.join(OUT,'save.json'),JSON.stringify(save))}catch{}
  if(fpsAll.length){report.fps={samples:fpsAll.length,avg:+(fpsAll.reduce((a,b)=>a+b,0)/fpsAll.length).toFixed(1),min:+Math.min(...fpsAll).toFixed(1)}}
  if(battleSecs.length)report.battleSecondsAvg=+(battleSecs.reduce((a,b)=>a+b,0)/battleSecs.length).toFixed(1);
  report.errors=[...errors].map(([msg,count])=>({msg,count}));
  if(report.errors.length)await shot('ultimo-estado-com-erros');
  await fsp.writeFile(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
  await fsp.writeFile(path.join(OUT,'report.md'),markdown(report));
  console.log(markdown(report));
  await browser.close().catch(()=>{});server.close();
  // Fail the job only for JS errors, a robot error or a stuck journey —
  // losing battles is normal play.
  process.exitCode=report.errors.some(e=>e.msg.startsWith('pageerror')||e.msg.startsWith('robot'))||report.stuck?1:0;
 }
})();

function markdown(r){
 const ok=!r.stuck&&!r.errors.length;
 return ['## Robô da campanha — '+(ok?'✅ sem problemas':'⚠️ precisa de atenção'),'',
  `- **Resultado:** ${r.finished} · ${r.badges} insígnia(s)${r.goalBadges==='tudo'?' · meta: zerar o jogo (8 insígnias + Liga)':' de '+r.goalBadges} · etapa ${r.stage}${r.champion?' · 🏆 CAMPEÃO':''}`,
  `- **Inicial:** ${r.starter} · **parte ${r.part}** · ${r.minutesUsed} min nesta parte, ${r.minutesTotal} min no total`,
  `- **Lutas:** ${r.battles} (${r.wins} vitórias, ${r.losses} derrotas; ${r.wild} selvagens, ${r.grindBattles} de treino) · média ${r.battleSecondsAvg??'-'} s por luta`,
  `- **Capturas:** ${r.captures} de ${r.captureTries} tentativas · **Centro:** ${r.heals}× · **Poké Balls compradas:** ${r.ballsBought} · **Eevee:** ${r.eevee}`,
  `- **FPS na luta:** média ${r.fps.avg??'-'}, mínimo ${r.fps.min??'-'} (${r.fps.samples} amostras)`,
  r.badgeTimeline.length?'- **Insígnias:** '+r.badgeTimeline.map(b=>`#${b.badges} em ${b.minutes} min/${b.battles} lutas`).join(' · '):'- **Insígnias:** nenhuma ainda',
  r.stuck?`- **Travou:** etapa ${r.stuck.stage}, treinador ${r.stuck.trainer} (${r.stuck.opponent}) depois de ${r.stuck.attempts} tentativas e ${r.stuck.losses} derrotas`:'- **Travou:** não',
  r.errors.length?'- **Erros:**\n'+r.errors.map(e=>`  - ${e.count}× ${e.msg}`).join('\n'):'- **Erros:** nenhum',
  r.screenshots.length?'- **Prints:** '+r.screenshots.join(', '):'',''].join('\n');
}
