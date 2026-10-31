/* PB Ranked: unauthenticated public battle observation and static catalog.
 * Scope: public practice-vs-bot only. NEVER enter ranked/friendly/multiplayer,
 * create accounts, bypass login, access private APIs, or store credentials.
 * Store names, metadata and screenshots; do not publish source/assets.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const {chromium}=require('playwright-core');
const acorn=require('acorn'),walk=require('acorn-walk');
const ROOT='https://ranked.pokemonbattlegrounds.com';
const DIR=path.resolve('reference-library/pb-ranked');
const TMP=path.resolve('test-evidence/pb-ranked-deep');
fs.mkdirSync(DIR,{recursive:true});fs.mkdirSync(TMP,{recursive:true});
const savedAt=new Date().toISOString();
const bounded=(s,n=160)=>String(s||'').replace(/[\x00-\x1f]/g,' ').slice(0,n);
const sha=v=>crypto.createHash('sha256').update(v).digest('hex');
const uniq=a=>[...new Set(a)];
const json=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const compactName=value=>bounded(value,90);
const safeUrl=v=>{try{const u=new URL(v);return u.origin===ROOT?u.pathname:'[external origin]'}catch{return '[invalid]'}};
const sourceInfo=[],resourceMap=new Map(),battleLog=[],pageErrors=[],scripts=new Map();
const LIMIT=10000;
const animationHints=['idle','walk','run','hop','hurt','attack','spattack','swing','twirl','charge','shoot','sleep','rearup','double','rotate','slice','cringe','dodge','dash','throw','release','faint','ko','jump','summon','cast','guard','block','hit','impact'];
const motionHints=['speed','velocity','acceleration','dodge','dash','movement','move','knockback','collis','hitbox','hurtbox','friction','steering','walk','run','lock','invulner','invincib','iframe','animation'];
const abilitiesHints=['move','skill','ability','attack','power','damage','dano','cooldown','cd','range','alcance','type','tipo','energy','stamina','cost','coste','status','chance','duration','duracion','weather','boost','buff','debuff','hitstun','knock'];
const arenaHints=['arena','backdrop','stage','sky','floor','wall','layer','camera','parallax','background','collision','weather','tile'];
const extracted={date:savedAt,source:ROOT,method:'read-only catalog of publicly delivered JS/DOM/response URLs; no source redistributed',
 scope:'public UI and practice bot if accessible; not ranked, private or authenticated',source_scripts:[],
 move_candidates:[],action_states:[],control_terms:[],arena_terms:[],trainer_terms:[],
 animation_paths:[],asset_inventory:[],code_surface:[],notes:[]};
let maxScreenshots=30,frame=0;
function captureFrame(page,label){
 return page.screenshot({path:path.join(TMP,'frame-'+String(++frame).padStart(2,'0')+'-'+label+'.png'),
  timeout:12000,animations:'disabled'}).catch(e=>pageErrors.push('screenshot '+label+': '+bounded(e.message)));
}
const srcString=node=>{
 if(!node)return null;
 if(node.type==='Literal'&&['string','number'].includes(typeof node.value))return String(node.value);
 if(node.type==='TemplateLiteral'&&node.expressions.length===0)return node.quasis.map(q=>q.value.cooked).join('');
 return null;
};
const propName=node=>!node?null:node.type==='Identifier'?node.name:srcString(node);
const hintsMatch=(text,hints)=>hints.some(x=>String(text).toLowerCase().includes(x));
function inspectAst(src,url){
 const stats={path:safeUrl(url),bytes:Buffer.byteLength(src),sha256:sha(src),status:'unknown',
 nodes:0,candidate_moves:0,object_shapes:[],animation_mentions:[],control_mentions:[],
 arena_mentions:[],trainer_mentions:[],error:null};
 let tree;
 try{tree=acorn.parse(src,{ecmaVersion:'latest',sourceType:'module',allowHashBang:true,allowReturnOutsideFunction:true});stats.status='parsed';}
 catch(e){try{tree=acorn.parse(src,{ecmaVersion:'latest',sourceType:'script',allowReturnOutsideFunction:true});stats.status='parsed-script';}
 catch(e2){stats.error=bounded(e2.message);return stats;}}
 const shapes=new Map(),anims=new Set(),controls=new Set(),arena=new Set(),trainers=new Set();
 const moveKeys=/^(name|nombre|id|title|move|ability|skill|type|tipo|power|poder|damage|dano|cooldown|cd|range|alcance|cost|coste|energy|anim|animation|effect|forma|status|chance|accuracy|duracion|duration)$/i;
 let encountered=0;
 walk.fullAncestor(tree,(n,_,anc)=>{
  stats.nodes++;if(stats.nodes>800000)return;
  if(n.type==='ObjectExpression'){
    const keys=n.properties.filter(p=>p.type==='Property').map(p=>propName(p.key)).filter(Boolean);
    const power=keys.filter(k=>moveKeys.test(k));
    const parent=anc[anc.length-2],owner=parent?.type==='Property'?propName(parent.key):null;
    const values=Object.fromEntries(n.properties.filter(p=>p.type==='Property').map(p=>[propName(p.key),srcString(p.value)])
      .filter(([k,v])=>k&&v!==null));
    if(power.length>=3 && (power.some(k=>/^(damage|dano|power|poder|cooldown|cd|range|alcance|cost|coste)$/i.test(k)))){
      const name=values.name||values.nombre||values.move||values.ability||values.id||owner;
      if(name && name.length<=90 && extracted.move_candidates.length<25000){
        const item={source:stats.path,name:compactName(name),fields:power.slice(0,25),
         properties:Object.fromEntries(Object.entries(values).filter(([k])=>moveKeys.test(k)).slice(0,20)
          .map(([k,v])=>[k,bounded(v,120)])),evidence:'static object declaration; not verified in battle'};
        extracted.move_candidates.push(item);stats.candidate_moves++;
      }
    }
    if(power.length>=2){const shape=keys.sort().join(',');shapes.set(shape,(shapes.get(shape)||0)+1);}
  }else if(n.type==='Literal'&&typeof n.value==='string'){
    const s=n.value.trim();
    if(s.length<2||s.length>110)return;
    if(hintsMatch(s,animationHints)&&anims.size<500)anims.add(s);
    if(hintsMatch(s,motionHints)&&controls.size<700)controls.add(s);
    if(hintsMatch(s,arenaHints)&&arena.size<700)arena.add(s);
    if(hintsMatch(s,['trainer','pokeball','pokéball','ballthrow','catch','capture','red','blue','cynthia'])&&trainers.size<400)trainers.add(s);
  }else if(n.type==='Identifier'){
    const s=n.name;
    if(hintsMatch(s,motionHints)&&controls.size<700)controls.add(s);
    if(hintsMatch(s,arenaHints)&&arena.size<700)arena.add(s);
    if(hintsMatch(s,animationHints)&&anims.size<500)anims.add(s);
  }
 });
 stats.object_shapes=[...shapes.entries()].sort((a,b)=>b[1]-a[1]).slice(0,35)
   .map(([keys,count])=>({keys,count}));
 stats.animation_mentions=[...anims].sort().slice(0,350);
 stats.control_mentions=[...controls].sort().slice(0,450);
 stats.arena_mentions=[...arena].sort().slice(0,450);
 stats.trainer_mentions=[...trainers].sort().slice(0,300);
 return stats;
}
function pageCollector(page,label){
 return page.evaluate(()=>{
   const q=sel=>[...document.querySelectorAll(sel)];
   const t=e=>(e?.innerText||e?.textContent||'').trim().replace(/\s+/g,' ').slice(0,90);
   const visible=e=>{const r=e.getBoundingClientRect();const cs=getComputedStyle(e);
     return r.width>1&&r.height>1&&cs.visibility!=='hidden'&&cs.display!=='none';};
   return{title:document.title,path:location.pathname,
      headings:q('h1,h2,h3,h4').filter(visible).map(t).slice(0,55),
      buttons:q('button,[role=button]').filter(visible).map(t).slice(0,90),
      inputs:q('input').filter(visible).map(e=>({name:e.name,type:e.type,id:e.id,
       placeholder:e.placeholder,maxLength:e.maxLength})).slice(0,20),
      selects:q('select').filter(visible).map(e=>({id:e.id,name:e.name,options:[...e.options].slice(0,100).map(o=>t(o))})).slice(0,20),
      canvases:q('canvas').map(e=>({width:e.width,height:e.height,visible:visible(e)})),
      visibleText:t(document.body).slice(0,90)};
 });
}
async function state(page,label){
 const payload=await pageCollector(page,label).catch(e=>({error:bounded(e.message)}));
 battleLog.push({at:new Date().toISOString(),label,...payload});
 if(frame<maxScreenshots)await captureFrame(page,label);
 json(path.join(TMP,'battle-navigation.json'),battleLog);
 return payload;
}
async function clickButton(page,re,label){
 const matches=page.getByRole('button',{name:re});
 for(let i=0;i<Math.min(20,await matches.count());i++){
  const el=matches.nth(i);
  if(await el.isVisible()&&await el.isEnabled()){
   try{await el.click({timeout:9000});await page.waitForTimeout(1600);
    await state(page,label);return true;}
   catch(e){pageErrors.push('click '+label+': '+bounded(e.message));}
  }
 }
 return false;
}
async function fillTrainer(page){
 const inputs=page.locator('input:visible');
 for(let i=0;i<Math.min(12,await inputs.count());i++){
  const el=inputs.nth(i);
  const attr=((await el.getAttribute('placeholder'))||'')+' '+((await el.getAttribute('id'))||'');
  const type=await el.getAttribute('type');
  if((!type||type==='text')&&/name|nickname|trainer|your/i.test(attr)){
   try{await el.fill('TorreAudit',{timeout:3000});return true;}catch{}
  }
 }
 return false;
}
async function collect(){
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1440,height:900},
   deviceScaleFactor:1,locale:'en-US',serviceWorkers:'block',acceptDownloads:false});
 const page=await context.newPage();
 page.on('pageerror',e=>{if(pageErrors.length<70)pageErrors.push('page: '+bounded(e.message))});
 page.on('response',async response=>{
  try{
   const u=new URL(response.url());
   if(u.origin!==ROOT)return;
   if(resourceMap.size<LIMIT)resourceMap.set(u.pathname,{path:u.pathname,status:response.status(),
    type:response.request().resourceType(),mime:(response.headers()['content-type']||'').split(';')[0],
    size:Number(response.headers()['content-length']||0)});
   if((/\.m?js$/i.test(u.pathname)||/javascript/.test(response.headers()['content-type']||''))&&response.ok()){
    const raw=await response.body();
    if(raw.length<22*1024*1024)scripts.set(u.pathname,{text:raw.toString('utf8'),url:u.href});
   }
  }catch(e){if(pageErrors.length<70)pageErrors.push('capture: '+bounded(e.message))}
 });
 try{
  await page.goto(ROOT,{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForTimeout(3400);
  await state(page,'landing');
  // Allowed user action: enter a disposable guest trainer name; never click
  // OAuth, private account screens, store/password or player matchmaking.
  await fillTrainer(page);
  await clickButton(page,/^Start$/i,'trainer-start');
  await clickButton(page,/^Play here$/i,'public-menu');
  await clickButton(page,/^Practice vs bot$/i,'practice-bot');
  await page.waitForTimeout(2200);
  await state(page,'post-practice');
  // Practice may require selecting one's party. Only click visible local
  // controls with labels on a vetted allowlist, never create an online room.
  const candidates=['Use this team','Choose team','Pick team','Ready','Play','Start battle','Battle bot','Start practice','Fight','Begin'];
  for(let j=0;j<5;j++){
    let acted=false;
    for(const c of candidates){
      if(await clickButton(page,new RegExp('^'+c+'$','i'),'practice-'+c.toLowerCase().replace(/ /g,'-'))){
        acted=true;break;
      }
    }
    if(!acted)break;
  }
  const now=await state(page,'practice-final');
  const gameplayLabels=now.buttons?.filter(x=>/^(auto|dodge|mega evolve|surrender|[1234]|fight)$/i.test(x))||[];
  if(gameplayLabels.length){
    extracted.notes.push('Battle HUD control buttons visibly observed: '+gameplayLabels.join(', '));
    for(let i=0;i<12;i++){await page.waitForTimeout(300);await captureFrame(page,'gameplay-'+i);}
  }else extracted.notes.push('No demonstrated battle HUD in public guest practice; do not claim gameplay access.');
 }catch(e){pageErrors.push('navigation: '+bounded(e.stack||e.message,500));}
 finally{
  await browser.close();
  const manifest=[...resourceMap.values()].sort((a,b)=>a.path.localeCompare(b.path));
  extracted.asset_inventory=manifest.filter(x=>/\.(png|webp|jpg|jpeg|gif|svg|mp3|ogg|wav|atlas|json|css|webm|mp4)$/i.test(x.path));
  const observedPaths=extracted.asset_inventory.map(x=>x.path);
  extracted.animation_paths=observedPaths.filter(x=>hintsMatch(x.toLowerCase(),animationHints)).slice(0,5000);
  extracted.source_scripts=[...scripts.keys()].sort();
  const summary={date:savedAt,steps:battleLog.map(({label,buttons,inputs})=>({label,buttons,inputs})),
    resources:manifest.length,scripts:scripts.size,errors:pageErrors,
    access:'guest public UI only; battle depends on available practice-vs-bot flow',
    battleHUD:extracted.notes.some(n=>n.includes('visibly observed'))};
  json(path.join(DIR,'navegacao-e-acesso.json'),summary);
  json(path.join(DIR,'recursos-publicos.json'),manifest);
  json(path.join(TMP,'page-errors.json'),pageErrors);
  json(path.join(TMP,'summary.json'),summary);
  for(const [key,{url,text}] of scripts.entries()){
    const stats=inspectAst(text,url);
    sourceInfo.push(stats);
  }
  extracted.code_surface=sourceInfo.map(x=>({source:x.path,sha256:x.sha256,nodes:x.nodes,
   bytes:x.bytes,ast:x.status,reason:x.error,candidate_moves:x.candidate_moves,
   object_shapes:x.object_shapes}));
  extracted.action_states=uniq(sourceInfo.flatMap(x=>x.animation_mentions))
   .map(name=>({name,evidence:'static JS identifier/string; may not be used in battle'}));
  extracted.control_terms=uniq(sourceInfo.flatMap(x=>x.control_mentions))
   .map(name=>({name,evidence:'static code identifier/string'}));
  extracted.arena_terms=uniq(sourceInfo.flatMap(x=>x.arena_mentions))
   .map(name=>({name,evidence:'static code identifier/string'}));
  extracted.trainer_terms=uniq(sourceInfo.flatMap(x=>x.trainer_mentions))
   .map(name=>({name,evidence:'static code identifier/string'}));
  // Remove duplicates from candidates with source/name/fields; do not invent
  // a complete move list when only partial static evidence is available.
  const seen=new Set();extracted.move_candidates=extracted.move_candidates.filter(x=>{
    const id=x.source+'|'+x.name+'|'+x.fields.join(',');
    if(seen.has(id))return false;seen.add(id);return true;});
  json(path.join(DIR,'golpes-candidatos.json'),{source:ROOT,date:savedAt,
   evidence:'public source AST only, needs gameplay validation',
   count:extracted.move_candidates.length,items:extracted.move_candidates});
  json(path.join(DIR,'movimentacoes-animacoes.json'),{source:ROOT,date:savedAt,
   states:extracted.action_states,animation_paths:extracted.animation_paths,
   controls:extracted.control_terms});
  json(path.join(DIR,'arenas-e-cenarios.json'),{source:ROOT,date:savedAt,
   arena_identifiers:extracted.arena_terms,public_resources:extracted.asset_inventory.filter(x=>hintsMatch(x.path,arenaHints)),
   caveat:'Static mentions and resource names are NOT 3D/2D gameplay observation.'});
  json(path.join(DIR,'treinadores-pokebolas.json'),{source:ROOT,date:savedAt,
   trainer_identifiers:extracted.trainer_terms,
   resources:extracted.asset_inventory.filter(x=>hintsMatch(x.path,['trainer','ball','throw','pokeball'])),
   caveat:'Do not assume throwing animation without a recorded battle.'});
  json(path.join(DIR,'analise-js-rea.json'),{source:ROOT,date:savedAt,scripts:sourceInfo});
  json(path.join(DIR,'catalogo-geral.json'),{source:ROOT,date:savedAt,
   counts:{scripts:scripts.size,resources:manifest.length,move_candidates:extracted.move_candidates.length,
    motion_states:extracted.action_states.length,control_terms:extracted.control_terms.length,
    arena_terms:extracted.arena_terms.length,trainer_terms:extracted.trainer_terms.length,
    screenshots:frame},
   coverage:'Public guest pages and scripts loaded in those pages only. No authenticated assets/flows.',
   notes:extracted.notes,output:['golpes-candidatos.json','movimentacoes-animacoes.json',
    'arenas-e-cenarios.json','treinadores-pokebolas.json','analise-js-rea.json',
    'recursos-publicos.json','navegacao-e-acesso.json']});
  console.log(JSON.stringify({counts:JSON.parse(fs.readFileSync(path.join(DIR,'catalogo-geral.json'))).counts,
   steps:battleLog.map(x=>x.label),errors:pageErrors.slice(0,10)},null,2));
 }
}
collect().catch(e=>{console.error(e.stack||e);process.exitCode=1});
