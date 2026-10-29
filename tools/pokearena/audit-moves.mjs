#!/usr/bin/env node
// Audit complete known Poké Arena Phaser moves across all characters, stages and Megas.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve('_site/arena2d');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
if(!version)throw Error('run capture-client + build-preview first');
const base=pathToFileURL(path.join(root,version,'datos.js'));
const {ROSTER,TODOS}=await import(base);
const {EARLY_KANTO_BASE,MISTY_ROUTE_BASE,SURGE_ROUTE_BASE,LATE_GYM_BASE}=await import(
 pathToFileURL(path.join(root,version,'torre2/early-kanto-species.js')));
const addedFamilies=new Set([...EARLY_KANTO_BASE,...MISTY_ROUTE_BASE,...SURGE_ROUTE_BASE,...LATE_GYM_BASE]);
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
 // Audit ONLY true upstream Poké Arena definitions. Added Torre 2 Pokémon
 // may reuse a pre-approved custom renderer (e.g. Gust), but that does NOT
 // suddenly make that renderer a native-original move or a duplicate.
 // All actual native source files and the strict collision check stay frozen.
 if(addedFamilies.has(d.id)||d.torre2Kanto151)continue;
 const scope=d.desactivado?'disabled':'active';
 let kit=d.kit||{};record(kit,d.id,d.nombre,scope);
 for(const ev of d.evoluciones||[]){
  // The game equips remastered Kanto evolution roles at runtime; do not
  // mistake approved Torre 2 custom moves for native Poké Arena sources.
  // This snapshot was saved before upgradeKantoEvolutionBattleKits ran.
  kit=merge(kit,ev.torre2OriginalKit||ev.kit||{});
  record(kit,d.id,ev.nombre,scope);
  if(ev.mega?.kit)record(merge(kit,ev.mega.kit),d.id,ev.mega.nombre||'Mega',scope);
 }
}
const implemented=[...catalog.values()].sort((a,b)=>a.name.localeCompare(b.name));
const custom=new Map(pool.SIGNATURE_MOVES.map(m=>[slug(m.nombre),{name:m.nombre,form:m.forma}]));
const chosen=new Set(pool.TEST_LIBRARY.map(m=>slug(m.nombre)));
// Duplicate protection goes beyond IDs: native attacks from the original
// Pokémon Arena 2D must not be reimplemented as new custom attacks. Aliases
// in Portuguese and English are normalized to the same move key.
const key=pool.canonicalMoveKey||slug;
const groupedMoves=new Map();
for(const m of pool.TEST_LIBRARY){
 const normalized=key(m.nombre),group=groupedMoves.get(normalized)||[];
 group.push({id:m.id,name:m.nombre,source:m.source});
 groupedMoves.set(normalized,group);
}
const duplicatedSelections=[...groupedMoves.entries()]
 .filter(([_,rows])=>rows.length!==1)
 .map(([id,rows])=>({id,entries:rows}));
const originalKeys=new Map(implemented.map(row=>[key(row.name),row.name]));
const allowedLegacy=new Set(pool.APPROVED_KANTO_NATIVE_OVERLAPS||[]);
const legacyOverlaps=pool.SIGNATURE_MOVES
 .filter(m=>originalKeys.has(key(m.nombre))&&allowedLegacy.has(key(m.nombre)));
const collisions=pool.SIGNATURE_MOVES
 .filter(m=>originalKeys.has(key(m.nombre))&&!allowedLegacy.has(key(m.nombre)))
 .map(m=>({name:m.nombre,existingOriginal:originalKeys.get(key(m.nombre))}));
// A new native version may not silently erase a user-approved old renderer.
// The exception applies ONLY to the campaign/Mewtwo editor library, not the
// original Arena/VS definitions, and demands a genuinely approved VFX.
const invalidLegacy=legacyOverlaps.filter(m=>{
 const selected=pool.TEST_LIBRARY.find(x=>key(x.nombre)===key(m.nombre));
 return m.approved!==true||!m.forma||!selected||
  selected.forma!==m.forma||selected.id!==m.id||
  selected.source!=='new-phaser-fx';
});
if(invalidLegacy.length)throw Error('APPROVED_VFX_CHANGED_BY_UPSTREAM: '+
 JSON.stringify(invalidLegacy.map(x=>({id:x.id,name:x.nombre}))));

const customKeys=new Map(),repeatedCustom=[];
for(const move of pool.SIGNATURE_MOVES){
 const normalized=key(move.nombre);
 if(customKeys.has(normalized))repeatedCustom.push({name:move.nombre,previous:customKeys.get(normalized)});
 else customKeys.set(normalized,move.nombre);
}
const visuals=new Map();
for(const row of implemented)for(const shape of row.forms){
 if(!shape)continue;
 const members=visuals.get(shape)||new Set();
 members.add(row.name);visuals.set(shape,members);
}
const sharedNativeVisuals=[...visuals]
 .filter(([_,names])=>names.size>1)
 .map(([form,names])=>({form,count:names.size,examples:[...names].slice(0,8)}))
 .sort((a,b)=>b.count-a.count);
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
 deduplication:{duplicatedSelections,collisions,
   legacyApprovedOverlap:legacyOverlaps.map(m=>({id:m.id,name:m.nombre,form:m.forma})),
   repeatedCustom,sharedNativeVisuals,
  policy:'Native Poké Arena 2D sprites and attacks stay approved; one canonical PT/EN name; recolor is NOT a new move.'},
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
 '- Entradas duplicadas no Mewtwo: **'+duplicatedSelections.length+'** | Tentativas de refazer ataque nativo: **'+collisions.length+'** | Duplicados personalizados: **'+repeatedCustom.length+'**',
 '- Plano 14 ataques + 2 status por tipo: **'+totals.inSite+' já no site**, **'+totals.newTorre2+' novos no Torre 2**, **'+totals.missing+' ainda ausentes**, **'+totals.unassigned+' vagas em aberto**',
 '',
 '## Formas visuais reaproveitadas pelo cliente (não são golpes duplicados)',
 'Mesmo renderer/sprite-base pode servir a ataques de nomes e efeitos diferentes. **Não redesenhar** os golpes originais aprovados.',
 ...sharedNativeVisuals.slice(0,15).map(x=>'- '+x.form+': '+x.count+' movimentos ('+x.examples.join(', ')+')'),
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
if(collisions.length||repeatedCustom.length||duplicatedSelections.length){
 throw Error('DUPLICATE_MOVE_BLOCKED: native vs custom='+JSON.stringify(collisions)+
  '; duplicated PT/EN='+JSON.stringify(duplicatedSelections)+
  '; duplicate custom='+JSON.stringify(repeatedCustom));
}
console.log(JSON.stringify({version,lines:ROSTER.length,originalMoves:implemented.length,
 mewtwo:pool.TEST_LIBRARY.length,totals,checks,missingByType:byType.map(x=>({type:x.type,
 missingCount:x.missing.length}))},null,2));
