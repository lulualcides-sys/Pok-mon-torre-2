#!/usr/bin/env node
// Audit complete known Poké Arena Phaser moves across all characters, stages and Megas.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve('_site/arena2d');
const version=fs.readdirSync(root).find(x=>/^src-[a-f0-9]{10}$/.test(x));
if(!version)throw Error('run capture-client + build-preview first');
const base=pathToFileURL(path.join(root,version,'datos.js'));
const {ROSTER,TODOS}=await import(base);
const pool=await import(pathToFileURL(path.join(root,version,'torre2/move-pool.js')));
const plan=JSON.parse(fs.readFileSync('data/kanto-new-phaser-moves.json','utf8'));
const slug=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const slots=['lmb','rmb','esp','q','e'],catalog=new Map();
const merge=(left,right)=>Object.fromEntries([...new Set([...Object.keys(left||{}),...Object.keys(right||{})])].map(k=>[k,{...(left?.[k]||{}),...(right?.[k]||{})}]));
function record(kit,pk,stage,scope){
 for(const slot of slots){
  const move=kit?.[slot];if(!move?.nombre)continue;
  const key=slug(move.nombre),v=catalog.get(key)||{name:move.nombre,types:[],forms:[],examples:[],sources:[]};
  if(move.tipo&&!v.types.includes(move.tipo))v.types.push(move.tipo);
  if(move.forma&&!v.forms.includes(move.forma))v.forms.push(move.forma);
  if(!v.sources.includes(scope))v.sources.push(scope);
  if(!v.examples.some(a=>a.pokemon===pk&&a.stage===stage&&a.slot===slot))
   v.examples.push({pokemon:pk,stage,slot});
  catalog.set(key,v);
 }
}
for(const d of TODOS){
 const scope=d.desactivado?'disabled':'active';
 let kit=d.kit||{};record(kit,d.id,d.nombre,scope);
 for(const ev of d.evoluciones||[]){
  kit=merge(kit,ev.kit||{});
  record(kit,d.id,ev.nombre,scope);
  if(ev.mega?.kit)record(merge(kit,ev.mega.kit),d.id,ev.mega.nombre||'Mega',scope);
 }
}
const implemented=[...catalog.values()].sort((a,b)=>a.name.localeCompare(b.name));
const custom=new Map(pool.SIGNATURE_MOVES.map(m=>[slug(m.nombre),{name:m.nombre,form:m.forma}]));
const chosen=new Set(pool.TEST_LIBRARY.map(m=>slug(m.nombre)));
function classify(name){
 const fromSite=catalog.get(slug(name));
 if(fromSite)return{status:'IN_SITE',forms:fromSite.forms,
  pokemonExamples:fromSite.examples.slice(0,6),inMewtwoPool:chosen.has(slug(name))};
 const newAttack=custom.get(slug(name));
 if(newAttack)return{status:'NEW_IN_TORRE2',forms:[newAttack.form]};
 return{status:'MISSING_IN_CAPTURED_CLIENT'};
}
const byType=plan.types.map(type=>{
 const attack=type.attack.map(m=>({name:m.name,kind:'attack',...classify(m.name)}));
 const status=type.status.map(m=>({name:m.name,kind:'status',...classify(m.name)}));
 const items=[...attack,...status];
 return{type:type.type,attacks:attack,statusMoves:status,
 existing:items.filter(m=>m.status==='IN_SITE').length,
 newlyCreated:items.filter(m=>m.status==='NEW_IN_TORRE2').length,
 missing:items.filter(m=>m.status==='MISSING_IN_CAPTURED_CLIENT').map(m=>m.name),
 unassignedSlots:type.openAttackSlots+type.openStatusSlots};
});
const totals={inSite:byType.reduce((a,t)=>a+t.existing,0),
 newTorre2:byType.reduce((a,t)=>a+t.newlyCreated,0),
 missing:byType.reduce((a,t)=>a+t.missing.length,0),
 unassigned:byType.reduce((a,t)=>a+t.unassignedSlots,0)};
const checks=['Rock Slide','Rock Throw','Stone Edge','Psybeam','Egg Bomb','High Jump Kick','Volt Tackle',
 'Swift','Lovely Kiss','Soft-Boiled','Surf','Confuse Ray','Splash','Seismic Toss',
 'Bonemerang','Bone Club','Tri Attack','Pay Day','Shadow Ball','Thunderbolt','Ice Beam']
 .map(name=>({name,...classify(name)}));
const report={version,audit:'captured Poké Arena Phaser game (not Pokémon Torre 1)',
 source:'https://www.pokearena2d.com/',activeLines:ROSTER.length,allLines:TODOS.length,
 originalMoveCount:implemented.length,mewtwoSelectables:pool.TEST_LIBRARY.length,
 originalMoves:implemented,customMoves:pool.SIGNATURE_MOVES,
 keyChecks:checks,byType,totals,
 caveats:['IN_SITE means declared in a Pokémon kit, not each move screenshot-tested',
 'Evolution and other-generation kits are included','No move effect from Pokémon Torre 1 is reused',
 'Missing means not listed in the currently captured Phaser version, not necessarily absent from all game versions']};
fs.mkdirSync('site-capture',{recursive:true});
fs.writeFileSync('site-capture/POKEARENA-MOVE-AUDIT.json',JSON.stringify(report,null,2));
const markdown=['# Inventário técnico dos golpes do Poké Arena 2D',
 'Fonte: https://www.pokearena2d.com/ (código Phaser capturado)',
 '',
 '- Linhas jogáveis: **'+ROSTER.length+'**',
 '- Movimentos distintos nos kits do cliente: **'+implemented.length+'**',
 '- Biblioteca selecionável no Mewtwo de testes, incluindo novos: **'+pool.TEST_LIBRARY.length+'**',
 '- Plano 14 ataques + 2 status por tipo: **'+totals.inSite+' já no site**, **'+totals.newTorre2+' novos no Torre 2**, **'+totals.missing+' ainda ausentes**, **'+totals.unassigned+' vagas em aberto**',
 '',
 '## Verificação dos golpes mencionados',
 '| Golpe | Situação | Exemplos encontrados |',
 '|---|---|---|',
 ...checks.map(x=>'| '+x.name+' | '+x.status+' | '+(x.pokemonExamples||[]).slice(0,3).map(y=>y.stage).join(', ')+' |'),
 '',
 '## Golpes realmente faltantes na seleção 14+2',
 '| Tipo | Já no site | Faltantes | Nomes |',
 '|---|---:|---:|---|',
 ...byType.map(t=>'| '+t.type+' | '+t.existing+' | '+t.missing.length+' | '+(t.missing.join(', ')||'—')+' |'),
 '',
 'Detalhamento de formas, slots e espécies: POKEARENA-MOVE-AUDIT.json.',
 'A presença no kit não garante que todas as animações estejam testadas ou que a espécie esteja liberada na campanha Kanto.'].join('\n');
fs.writeFileSync('site-capture/POKEARENA-MOVE-AUDIT.md',markdown);
console.log(JSON.stringify({version,lines:ROSTER.length,originalMoves:implemented.length,
 mewtwo:pool.TEST_LIBRARY.length,totals,checks,missingByType:byType.map(x=>({type:x.type,
 missingCount:x.missing.length}))},null,2));
