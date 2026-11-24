/* Pokémon Torre 2 — city missions from NPCs (owner 2026-11-22, list item 16:
 * "quero muitas missões"). Pure rules, no Phaser.
 * 52 missions across Kanto. Each one: a city (unlocks with the campaign
 * stage), an NPC with an original FireRed sprite and a line, an objective
 * read from the save (nothing hooks into battles) and a reward.
 * Objectives "since accepting" use a baseline saved when the player accepts.
 */
const list=v=>Array.isArray(v)?v:[];
export const CITY_NAMES=Object.freeze(['Viridian e Pewter','Cerulean','Vermilion','Celadon','Fuchsia','Saffron','Cinnabar','Victory Road','Liga','Pós-Liga']);
const TYPE_PT={NORMAL:'Normal',FIRE:'Fogo',WATER:'Água',GRASS:'Planta',ELECTRIC:'Elétrico',ICE:'Gelo',FIGHTING:'Lutador',POISON:'Veneno',
 GROUND:'Terra',FLYING:'Voador',PSYCHIC:'Psíquico',BUG:'Inseto',ROCK:'Pedra',GHOST:'Fantasma',DRAGON:'Dragão'};
const nice=id=>String(id).charAt(0).toUpperCase()+String(id).slice(1);
// Objective descriptions.
export function objectiveText(q){
 const g=q.goal,o=q.kind;
 return o==='have'?'Mostre um '+nice(q.species):
  o==='haveType'?'Tenha '+g+' Pokémon do tipo '+TYPE_PT[q.type]:
  o==='level'?'Tenha um Pokémon no Nv '+g:
  o==='dexCaught'?'Capture '+g+' espécies (Pokédex)':
  o==='dexSeen'?'Veja '+g+' espécies (Pokédex)':
  o==='wins'?'Vença '+g+' batalhas depois de aceitar':
  o==='captures'?'Capture '+g+' Pokémon depois de aceitar':
  o==='stars'?'Tenha um Pokémon com '+g+' estrelas de potencial':
  o==='held'?'Junte '+g+' itens de batalha diferentes':
  o==='ability'?'Tenha um Pokémon com habilidade oculta':
  o==='events'?'Vença '+g+' evento(s) 3x3':
  o==='tower'?'Chegue ao andar '+g+' da Torre de desafios':
  o==='series'?'Complete '+g+' desafio(s) personalizado(s)':
  o==='shiny'?'Capture '+g+' Pokémon shiny':
  o==='rivalry'?'Vença '+g+' lutas de rivalidade':
  o==='badges'?'Tenha '+g+' insígnias':
  o==='money'?'Mostre que tem $'+g:
  o==='starsCount'?'Tenha '+g+' Pokémon com 5 estrelas':'';
}
// [id, stage, sprite, npc, line, kind, goal, extra, reward]
const Q=(id,stage,sprite,npc,line,kind,goal,extra,reward)=>Object.freeze({id,stage,sprite,npc,line,kind,goal,...extra,reward});
export const QUESTS=Object.freeze([
 Q('q01',0,'youngster','Jovem Joey','Meu Rattata é o melhor! Duvido você ter um Pokémon Normal tão bom.','haveType',1,{type:'NORMAL'},{items:{potion:3}}),
 Q('q02',0,'lass','Menina Ana','Estou aprendendo a capturar. Me mostra como se faz? Pegue 2!','captures',2,{},{items:{pokeball:5}}),
 Q('q03',0,'bugcatcher','Caçador Téo','Insetos são os mais legais! Traga dois Pokémon Inseto.','haveType',2,{type:'BUG'},{items:{greatball:3}}),
 Q('q04',0,'oldman','Vovô de Viridian','No meu tempo a gente capturava com paciência. Capture um Pokémon para mim.','captures',1,{},{items:{greatball:2}}),
 Q('q05',0,'hiker','Montanhista Bento','As pedras de Pewter são duras como o Brock! Tem um Pokémon Pedra?','haveType',1,{type:'ROCK'},{money:800}),
 Q('q06',0,'camper','Campista Lucas','Treino todo dia. Quero ver um Pokémon seu no Nv 10.','level',10,{},{items:{superpotion:2}}),
 Q('q07',1,'swimmer','Nadador Davi','A água de Cerulean é limpinha. Traga 2 Pokémon de Água!','haveType',2,{type:'WATER'},{items:{greatball:3},money:1000}),
 Q('q08',1,'bill','Bill','Estou pesquisando Pokémon. Veja 20 espécies na sua Pokédex!','dexSeen',20,{},{money:1500}),
 Q('q09',1,'lass','Menina Clara','Vi um Zubat no Mt. Moon e fiquei com medo... você tem um?','have',1,{species:'zubat'},{items:{greatball:3}}),
 Q('q10',1,'camper','Campista Rui','A Ponte Pepita é puxada! Vença 5 batalhas depois de falar comigo.','wins',5,{},{money:1200}),
 Q('q11',1,'youngster','Jovem Beto','Plantas crescem rápido aqui. Tem um Pokémon Planta?','haveType',1,{type:'GRASS'},{held:'everstone'}),
 Q('q12',1,'picnicker','Piquenique Lia','Meu sonho é ter um Pokémon no Nv 15. Me mostra o seu?','level',15,{},{items:{superpotion:3}}),
 Q('q13',2,'sailor','Marinheiro Zé','O S.S. Anne só leva treinador de verdade. Mostre 3 Pokémon de Água!','haveType',3,{type:'WATER'},{money:2000}),
 Q('q14',2,'man','Presidente do Fã-Clube','Eu amo Pokémon talentosos! Tem algum com 3 estrelas?','stars',3,{},{held:'soothebell'}),
 Q('q15',2,'scientist','Cientista Ivo','Estudo a eletricidade do Lt. Surge. Traga um Pokémon Elétrico.','haveType',1,{type:'ELECTRIC'},{money:2000}),
 Q('q16',2,'fisherman','Pescador Nico','Todo mundo ri do Magikarp, mas eu amo! Me mostra um.','have',1,{species:'magikarp'},{held:'deepseatooth'}),
 Q('q17',2,'gentleman','Cavalheiro Otto','Só converso com treinadores de sucesso. Mostre que tem $5000.','money',5000,{},{items:{ultraball:2},money:2000}),
 Q('q18',2,'rocker','Roqueiro Dinho','Quero ver energia! Vença 8 batalhas depois de aceitar.','wins',8,{},{held:'stick'}),
 Q('q19',3,'woman','Florista Rosa','O jardim da Erika é lindo. Traga 3 Pokémon Planta!','haveType',3,{type:'GRASS'},{items:{superpotion:5}}),
 Q('q20',3,'acef','Treinadora Bia','Colecionar é tudo! Capture 25 espécies.','dexCaught',25,{},{items:{ultraball:3}}),
 Q('q21',3,'clerk','Vendedor da Loja','Na loja de departamentos amamos variedade. Junte 3 itens de batalha.','held',3,{},{money:3000}),
 Q('q22',3,'rocketf','Recruta Rocket','Ei! O Cassino é nosso... Vença 10 batalhas e talvez eu te deixe em paz.','wins',10,{},{money:3000}),
 Q('q23',3,'biker','Motoqueiro Vado','A Ciclovia é perigosa. Mostre 2 Pokémon Veneno!','haveType',2,{type:'POISON'},{items:{fullheal:3}}),
 Q('q24',3,'gentleman','Cavalheiro Hugo','Experiência é tudo. Tem um Pokémon no Nv 25?','level',25,{},{held:'expshare'}),
 Q('q25',4,'fisherman','Pescador Tião','Os lagos de Fuchsia são enormes. Mostre 4 Pokémon de Água.','haveType',4,{type:'WATER'},{held:'deepseascale'}),
 Q('q26',4,'man','Guarda do Safari','No Safari a gente captura muito! Capture 5 depois de aceitar.','captures',5,{},{items:{ultraball:5}}),
 Q('q27',4,'oldman','Guarda Velho','Perdi minha dentadura... brincadeira! Me mostra um Chansey.','have',1,{species:'chansey'},{held:'luckypunch'}),
 Q('q28',4,'blackbelt','Faixa-Preta Kaito','Força de verdade! Mostre 2 Pokémon Lutador.','haveType',2,{type:'FIGHTING'},{items:{ultraball:3}}),
 Q('q29',4,'acef','Treinadora Lumi','Procuro talentos raros. Tem um Pokémon com 4 estrelas?','stars',4,{},{items:{ultraball:4}}),
 Q('q30',4,'camper','Campista Gil','Lutas 3x3 são incríveis! Vença 1 evento 3x3.','events',1,{},{money:4000}),
 Q('q31',5,'woman','Médium Íris','Sinto uma mente forte em você. Mostre 2 Pokémon Psíquicos.','haveType',2,{type:'PSYCHIC'},{money:4000}),
 Q('q32',5,'scientist','Cientista da Silph','A Silph precisa de dados! Capture 40 espécies.','dexCaught',40,{},{held:'upgrade'}),
 Q('q33',5,'blackbelt','Mestre do Dojô','No Dojô se treina até cair! Vença 12 batalhas depois de aceitar.','wins',12,{},{items:{ultraball:4},money:2000}),
 Q('q34',5,'rocket','Recruta Rocket','Desafio personalizado? Isso é coisa de forte... Complete 1 e eu fujo!','series',1,{},{money:5000}),
 Q('q35',5,'channeler','Médium de Lavender','Os espíritos da Torre Pokémon pedem... um Pokémon Fantasma.','haveType',1,{type:'GHOST'},{items:{superpotion:5}}),
 Q('q36',5,'fuji','Sr. Fuji','Pokémon rivais crescem juntos. Vença 3 lutas de rivalidade.','rivalry',3,{},{money:4000}),
 Q('q37',6,'scientist','Cientista do Laboratório','Fósseis e pedras! Mostre 3 Pokémon Pedra.','haveType',3,{type:'ROCK'},{money:5000}),
 Q('q38',6,'oldman','Velho do Quiz','Pergunta: quantas insígnias você tem? Se forem 6, ganha prêmio!','badges',6,{},{items:{ultraball:5}}),
 Q('q39',6,'biker','Motoqueiro Brasa','Cinnabar é puro fogo! Mostre 3 Pokémon de Fogo.','haveType',3,{type:'FIRE'},{items:{fullheal:5}}),
 Q('q40',6,'swimmer','Nadadora Mar','Nadei até aqui! Tem um Pokémon no Nv 40?','level',40,{},{held:'shellbell'}),
 Q('q41',6,'nurse','Enfermeira Joy','Pokémon raros me fascinam. Tem algum com habilidade oculta?','ability',1,{},{items:{ultraball:5}}),
 Q('q42',6,'ace','Ás Pedro','A Torre de desafios separa os fortes. Chegue ao andar 10.','tower',10,{},{money:8000}),
 Q('q43',7,'ace','Ás Marcos','Só aceito o melhor. Mostre um Pokémon com 5 estrelas!','stars',5,{},{items:{ultraball:6}}),
 Q('q44',7,'acef','Ás Carla','A Victory Road exige preparo. Capture 70 espécies.','dexCaught',70,{},{money:8000}),
 Q('q45',7,'hiker','Montanhista Ulisses','Cavernas pedem Pokémon de Terra. Mostre 3!','haveType',3,{type:'GROUND'},{items:{ultraball:5}}),
 Q('q46',7,'blackbelt','Faixa-Preta Ryu','Disciplina total: tenha um Pokémon no Nv 50.','level',50,{},{held:'laxincense'}),
 Q('q47',9,'oak','Prof. Carvalho','Você é Campeão! Agora complete 100 espécies na Pokédex.','dexCaught',100,{},{items:{ultraball:10}}),
 Q('q48',9,'bill','Bill','Um shiny! Você já capturou algum? Quero ver!','shiny',1,{},{held:'lightball'}),
 Q('q49',9,'gentleman','Magnata de Kanto','Treinadores lendários vencem eventos. Vença 10 eventos 3x3.','events',10,{},{money:20000}),
 Q('q50',9,'ace','Ás Lendária','Três desafios personalizados completos. Topa?','series',3,{},{money:15000}),
 Q('q51',9,'channeler','Médium Selene','Os espíritos querem companhia: mostre 3 Pokémon Fantasma.','haveType',3,{type:'GHOST'},{held:'metalpowder'}),
 Q('q52',9,'oak','Prof. Carvalho','O sonho de todo pesquisador: os 151 de Kanto!','dexCaught',151,{},{money:50000,items:{ultraball:20}})
]);
// --- Rare missions (owner 2026-11-22: "mais difíceis e recompensas bem
// melhores, mas raras de aparecer 3%"): each NEW map has a 3% chance to make
// one of these appear. Much harder goals, much better prizes.
export const RARE_CHANCE=.03;
const R=(id,sprite,npc,line,kind,goal,extra,reward)=>Object.freeze({id,stage:1,rare:true,sprite,npc,line,kind,goal,...extra,reward});
export const RARE_QUESTS=Object.freeze([
 R('r01','oak','Prof. Carvalho (raro)','Uma pesquisa lendária: complete 120 espécies e eu te dou meu maior tesouro.','dexCaught',120,{},{items:{masterball:1},money:30000}),
 R('r02','blackbelt','Grão-Mestre Kenshin','Só um treinador de elite chega ao Nv 60. Prove que é um!','level',60,{},{items:{masterball:1},money:15000}),
 R('r03','acef','Caçadora de Talentos','Dois Pokémon com 5 estrelas? Isso é raríssimo... me mostre!','starsCount',2,{},{items:{masterball:1},held:'luckyegg'}),
 R('r04','ace','Campeão Errante','Trinta vitórias seguidas de treino. Topa o desafio?','wins',30,{},{money:50000,items:{ultraball:15}}),
 R('r05','man','Colecionador Rico','Capture 10 Pokémon depois de aceitar e a Master Ball é sua.','captures',10,{},{items:{masterball:1,ultraball:10}}),
 R('r06','bill','Bill (raro)','Três shinies! Ninguém acredita que existe alguém assim...','shiny',3,{},{items:{masterball:2},money:20000}),
 R('r07','gentleman','Lorde dos Eventos','Vença 15 eventos 3x3 e receba uma relíquia.','events',15,{},{held:'souldew',money:40000}),
 R('r08','ace','Senhor da Torre','Chegue ao andar 25 da Torre de desafios.','tower',25,{},{items:{masterball:1},money:25000}),
 R('r09','rocket','Agente Rocket Desertor','Complete 5 desafios personalizados e eu te passo segredos... e uma Master Ball.','series',5,{},{items:{masterball:1},money:20000}),
 R('r10','oldman','Ancião do Dragão','Os dragões escolhem poucos. Tenha 3 Pokémon Dragão.','haveType',3,{type:'DRAGON'},{items:{masterball:1},money:20000}),
 R('r11','fuji','Sr. Fuji (raro)','Dez vitórias de rivalidade mostram um coração forte.','rivalry',10,{},{items:{masterball:1},money:20000}),
 R('r12','clerk','Dono da Loja de Departamentos','Junte 25 itens de batalha diferentes. Pago muito bem!','held',25,{},{money:60000,items:{masterball:1}})
]);
export const ALL_QUESTS=Object.freeze([...QUESTS,...RARE_QUESTS]);
// Rolls 3% ONCE per new map (campaign stage) reached since the last check
// (owner 2026-11-22: "a cada mapa, se não fica muito fácil"). A save seen for
// the first time only records its current map. One rare mission at a time.
export function rollRareQuest(s,random=Math.random){
 const nq=s?.npcQuests||{},stage=Number(s?.stage)||0,checked=Number.isFinite(nq.rareStage)?nq.rareStage:stage;
 const rare=list(nq.rare),done=list(nq.done);
 const open=rare.filter(id=>!done.includes(id));
 let appeared=null;
 if(stage>=1&&!open.length){
  for(let st=checked+1;st<=stage&&!appeared;st++){const r=Number(random());if(Number.isFinite(r)&&r>=0&&r<RARE_CHANCE){
   const pool=RARE_QUESTS.filter(q=>!rare.includes(q.id)&&!done.includes(q.id));
   if(pool.length)appeared=pool[Math.min(pool.length-1,Math.floor(Number(random())*pool.length)||0)].id}}
 }
 if(checked===stage&&!appeared&&Number.isFinite(nq.rareStage))return {state:s,appeared:null};
 return {state:{...s,npcQuests:{...nq,accepted:nq.accepted||{},done,rare:appeared?[...rare,appeared]:rare,rareStage:Math.max(checked,stage)}},appeared};
}
// Stage 9 means "after the League". Rare missions exist only once rolled.
export function questUnlocked(s,q){if(q.rare)return list(s?.npcQuests?.rare).includes(q.id);return q.stage<=8?(Number(s?.stage)||0)>=q.stage||!!s?.champion:!!s?.champion}
const party=s=>[...list(s?.team),...list(s?.box)].filter(Boolean);
const uids=s=>party(s).map(m=>m.uid).filter(u=>typeof u==='string');
export function questBaseline(s){return {wins:Number(s?.wins)||0,uids:uids(s)}}
// ctx: {typesOf(id), starsOf(member), hasAbility(member), towerBest(s)}
export function questProgress(s,q,ctx={},base=null){
 const all=party(s),b=base||s?.npcQuests?.accepted?.[q.id]||questBaseline(s);
 const typesOf=ctx.typesOf||(()=>[]);
 const n=q.kind==='have'?all.filter(m=>m.id===q.species).length:
  q.kind==='haveType'?all.filter(m=>list(typesOf(m.id)).includes(q.type)).length:
  q.kind==='level'?Math.max(0,...all.map(m=>Number(m.progression?.level)||5)):
  q.kind==='dexCaught'?new Set(list(s?.dexCaught)).size:
  q.kind==='dexSeen'?new Set(list(s?.dexSeen)).size:
  q.kind==='wins'?(Number(s?.wins)||0)-(Number(b.wins)||0):
  q.kind==='captures'?all.filter(m=>typeof m.uid==='string'&&!list(b.uids).includes(m.uid)).length:
  q.kind==='stars'?Math.max(0,...all.map(m=>Number(ctx.starsOf?.(m))||0)):
  q.kind==='held'?new Set([...Object.keys(s?.inventory?.held||{}).filter(k=>s.inventory.held[k]>0),...all.map(m=>m.heldItem).filter(Boolean)]).size:
  q.kind==='ability'?all.filter(m=>ctx.hasAbility?.(m)).length:
  q.kind==='events'?list(s?.events3x3?.won).length:
  q.kind==='tower'?Number(ctx.towerBest?.(s))||0:
  q.kind==='series'?Number(s?.custom?.seriesWon)||0:
  q.kind==='shiny'?list(s?.dexShinyCaught).length:
  q.kind==='rivalry'?Number(s?.rivalryWins)||0:
  q.kind==='badges'?list(s?.badges).length:
  q.kind==='money'?Number(s?.money)||0:
  q.kind==='starsCount'?all.filter(m=>(Number(ctx.starsOf?.(m))||0)>=5).length:0;
 return Math.max(0,Math.min(q.goal,n));
}
export function questState(s,q,ctx={}){
 const nq=s?.npcQuests||{};
 if(list(nq.done).includes(q.id))return 'done';
 if(!questUnlocked(s,q))return 'locked';
 if(!nq.accepted?.[q.id])return 'available';
 return questProgress(s,q,ctx)>=q.goal?'ready':'active';
}
export function acceptQuest(s,id){
 const q=ALL_QUESTS.find(x=>x.id===id);if(!q||!questUnlocked(s,q))return null;
 const nq=s?.npcQuests||{};if(nq.accepted?.[id]||list(nq.done).includes(id))return null;
 return {...s,npcQuests:{...nq,accepted:{...(nq.accepted||{}),[id]:questBaseline(s)},done:list(nq.done)}};
}
export function rewardText(r,heldName=k=>k){
 const parts=[];if(r?.money)parts.push('$'+r.money);
 const names={potion:'Poção',superpotion:'Super Poção',pokeball:'Poké Ball',greatball:'Great Ball',ultraball:'Ultra Ball',masterball:'Master Ball'};
 for(const [k,n] of Object.entries(r?.items||{}))parts.push(n+'× '+(names[k]||k));
 if(r?.held)parts.push(heldName(r.held));
 return parts.join(' · ');
}
export function claimQuest(s,id,ctx={}){
 const q=ALL_QUESTS.find(x=>x.id===id);if(!q||questState(s,q,ctx)!=='ready')return null;
 const next=JSON.parse(JSON.stringify(s)),nq=next.npcQuests;
 delete nq.accepted[id];nq.done=[...new Set([...list(nq.done),id])];
 const r=q.reward||{};
 if(r.money)next.money=(Number(next.money)||0)+r.money;
 next.inventory={...(next.inventory||{})};
 for(const [k,n] of Object.entries(r.items||{}))next.inventory[k]=(Number(next.inventory[k])||0)+n;
 // Battle items: once per journey (owner 2026-11-24); a copy already owned
 // is not given again.
 if(r.held){const got=new Set(list(next.heldObtained));for(const [k,n] of Object.entries(next.inventory.held||{}))if(n>0)got.add(k);
  for(const m of [...list(next.team),...list(next.box)])if(m?.heldItem)got.add(m.heldItem);
  if(!got.has(r.held)){const held={...(next.inventory.held||{})};held[r.held]=(held[r.held]||0)+1;next.inventory.held=held;
   next.heldObtained=[...new Set([...list(next.heldObtained),r.held])]}}
 return next;
}
export function questSummary(s,ctx={}){
 const states=QUESTS.map(q=>questState(s,q,ctx));
 const rare=RARE_QUESTS.map(q=>questState(s,q,ctx));
 return {rareOpen:rare.filter(x=>x==='available'||x==='active'||x==='ready').length,rareDone:rare.filter(x=>x==='done').length,total:QUESTS.length,done:states.filter(x=>x==='done').length,ready:states.filter(x=>x==='ready').length,
  available:states.filter(x=>x==='available').length,active:states.filter(x=>x==='active').length};
}
