/* Pokémon Torre 2 — individual Pokémon (owner requests 2026-11-22, README
 * items 5, 9, 1 and 10). Campaign only, never the native kits:
 *  - Potencial individual (5): HP/ATK/DEF 0–31 per Pokémon (like IVs),
 *    stable from its own UID, ±5% at most on HP, damage dealt and taken.
 *  - Habilidade oculta (9): about 5% of Pokémon carry one of 25 rare
 *    passives (FireRed-era abilities adapted to the real-time arena).
 *  - Equipamentos (1): one held item per Pokémon. EVERY FireRed hold item
 *    except berries and mail (47), with its ORIGINAL FRLG icon
 *    (torre2-held-items/, pret/pokefirered). Effects adapted to the arena
 *    and described honestly in the Ficha. Earned from leaders (first win),
 *    3x3 events (first win), wild battles (5%) and the points shop.
 *  - Rivalidade (10): rival species fight harder against each other (+10%
 *    damage both ways) and the player's wins against a rival are counted.
 * Combat hooks (globalThis.__torre2Indiv, campaign branches of luchador.js
 * only): hp, damage multiplier, final damage and a per-frame tick. Moves,
 * VFX, cooldown tables and other modes are untouched.
 */
const list=v=>Array.isArray(v)?v:[];
export function hash(text){let h=2166136261;for(const c of String(text)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
const clampIv=v=>Math.max(0,Math.min(31,Math.floor(Number(v))));
const up=v=>String(v||'').toUpperCase();
// --- 5. Potencial -------------------------------------------------------------
export const POTENTIAL_STATS=Object.freeze([['hp','HP'],['atk','ATK'],['def','DEF']]);
export function potentialOf(member){
 const p=member?.potential;
 if(p&&[p.hp,p.atk,p.def].every(Number.isFinite))return {hp:clampIv(p.hp),atk:clampIv(p.atk),def:clampIv(p.def)};
 const seed=String(member?.uid||member?.id||'x');
 return {hp:hash(seed+':hp')%32,atk:hash(seed+':atk')%32,def:hash(seed+':def')%32};
}
export function potentialStars(p){const t=p.hp+p.atk+p.def;return t>=84?5:t>=66?4:t>=46?3:t>=26?2:1}
// FireRed-style judge words (the IV judge in the Battle Frontier/Tower).
export function potentialGrade(v){return v>=31?'Perfeito':v>=26?'Fantástico':v>=21?'Muito bom':v>=16?'Bom':v>=11?'Razoável':'Fraco'}
export function potentialTotalWord(p){const s=potentialStars(p);return ['','Comum','Promissor','Acima da média','Excelente','Lendário'][s]}
const ivFactor=v=>1+((v-15.5)/31)*.10; // 0 → 0.95, 31 → 1.05
// Percent shown in the UI: how much this potential point changes the stat
// (HP: max HP · ATK: damage dealt · DEF: damage taken, inverted).
export function potentialPercent(v,stat='atk'){
 const f=ivFactor(clampIv(v)),pct=(stat==='def'?1/f-1:f-1)*(stat==='def'?-100:100);
 const r=Math.round(pct*10)/10;
 return (r>0?'+':r<0?'−':'±')+String(Math.abs(r)).replace('.',',')+'%';
}
// --- 9. Habilidades ocultas --------------------------------------------------
export const HIDDEN_ABILITIES=Object.freeze({
 furia:{name:'Fúria Oculta',desc:'+15% de dano com o HP abaixo de 1/3'},
 casca:{name:'Casca Rara',desc:'Recebe 10% menos dano'},
 vigor:{name:'Vigor Antigo',desc:'+8% de HP máximo'},
 foco:{name:'Foco do Tipo',desc:'+10% de dano com golpes do próprio tipo'},
 sorte:{name:'Sorte Selvagem',desc:'+5% de dano e 5% menos dano recebido'},
 chama:{name:'Chama',desc:'Golpes de Fogo +25% com o HP abaixo de 1/3'},
 torrente:{name:'Torrente',desc:'Golpes de Água +25% com o HP abaixo de 1/3'},
 crescimento:{name:'Supercrescimento',desc:'Golpes de Planta +25% com o HP abaixo de 1/3'},
 enxame:{name:'Enxame',desc:'Golpes de Inseto +25% com o HP abaixo de 1/3'},
 gordura:{name:'Gordura Grossa',desc:'Recebe metade do dano de Fogo e Gelo'},
 levitacao:{name:'Levitação',desc:'Golpes de Terra quase não o atingem (-75%)'},
 coragem:{name:'Coragem',desc:'+20% de dano enquanto tiver um estado (queimado, envenenado...)'},
 forca:{name:'Força Pura',desc:'+15% de dano em todos os golpes'},
 robustez:{name:'Robustez',desc:'Com o HP cheio, sobrevive a qualquer golpe com 1 HP'},
 afobacao:{name:'Afobação',desc:'+20% de dano, mas recebe 8% a mais'},
 fogointerior:{name:'Fogo Interior',desc:'Recebe 60% menos de Fogo e seus golpes de Fogo +15%'},
 absorvevolt:{name:'Absorver Volt',desc:'Golpes Elétricos recebidos curam em vez de ferir'},
 absorveagua:{name:'Absorver Água',desc:'Golpes de Água recebidos curam em vez de ferir'},
 pressao:{name:'Pressão',desc:'O adversário recarrega os golpes 10% mais devagar'},
 intimidacao:{name:'Intimidação',desc:'O adversário causa 10% menos dano'},
 clorofila:{name:'Clorofila',desc:'+20% de dano com sol forte'},
 nadorapido:{name:'Nado Rápido',desc:'+20% de dano com chuva'},
 veuareia:{name:'Véu de Areia',desc:'Recebe 20% menos dano na tempestade de areia'},
 corpogelo:{name:'Corpo de Gelo',desc:'Recupera HP aos poucos no granizo'},
 rivalidade:{name:'Rivalidade',desc:'+15% de dano contra seus rivais'}
});
export const HIDDEN_CHANCE=5; // percent
export function hiddenAbilityOf(member){
 if(member?.hiddenAbility===null)return null;
 if(HIDDEN_ABILITIES[member?.hiddenAbility])return member.hiddenAbility;
 const seed=String(member?.uid||'');if(!seed)return null;
 if(hash(seed+':ha')%100>=HIDDEN_CHANCE)return null;
 const keys=Object.keys(HIDDEN_ABILITIES);return keys[hash(seed+':hak')%keys.length];
}
// --- 1. Equipamentos ---------------------------------------------------------
// type: +10% for moves of that type. Others carry an honest arena adaptation.
export const HELD_ITEMS=Object.freeze({
 silkscarf:{name:'Lenço de Seda',type:'NORMAL'},charcoal:{name:'Carvão',type:'FIRE'},
 mysticwater:{name:'Água Mística',type:'WATER'},miracleseed:{name:'Semente Milagrosa',type:'GRASS'},
 magnet:{name:'Ímã',type:'ELECTRIC'},nevermeltice:{name:'Gelo Eterno',type:'ICE'},
 blackbelt:{name:'Faixa Preta',type:'FIGHTING'},poisonbarb:{name:'Ferrão Venenoso',type:'POISON'},
 softsand:{name:'Areia Macia',type:'GROUND'},sharpbeak:{name:'Bico Afiado',type:'FLYING'},
 twistedspoon:{name:'Colher Torta',type:'PSYCHIC'},silverpowder:{name:'Pó Prateado',type:'BUG'},
 hardstone:{name:'Pedra Dura',type:'ROCK'},spelltag:{name:'Selo Fantasma',type:'GHOST'},
 dragonfang:{name:'Presa de Dragão',type:'DRAGON'},blackglasses:{name:'Óculos Escuros',type:'DARK'},
 metalcoat:{name:'Revestimento Metálico',type:'STEEL'},
 leftovers:{name:'Sobras',desc:'Recupera 1/16 do HP a cada 4 segundos'},
 shellbell:{name:'Sino Concha',desc:'Recupera 1/8 do dano que causar'},
 focusband:{name:'Faixa do Foco',desc:'10% de chance de aguentar um golpe fatal com 1 HP'},
 quickclaw:{name:'Garra Rápida',desc:'Recarrega os golpes 10% mais rápido'},
 kingsrock:{name:'Pedra do Rei',desc:'10% de chance de atordoar o alvo ao acertar'},
 scopelens:{name:'Lente de Mira',desc:'10% de chance de golpe crítico (dano x1,5)'},
 choiceband:{name:'Faixa de Escolha',desc:'+15% de dano em todos os golpes'},
 brightpowder:{name:'Pó Brilhante',desc:'Recebe 10% menos dano (os golpes acertam menos em cheio)'},
 laxincense:{name:'Incenso Suave',desc:'Recebe 5% menos dano'},
 seaincense:{name:'Incenso do Mar',desc:'+5% de dano com golpes de Água'},
 whiteherb:{name:'Erva Branca',desc:'Uma vez por luta, desfaz a defesa reduzida'},
 mentalherb:{name:'Erva Mental',desc:'Uma vez por luta, cura a confusão'},
 luckyegg:{name:'Ovo da Sorte',desc:'+50% de EXP'},
 expshare:{name:'Compartilhar EXP',desc:'+25% de EXP'},
 soothebell:{name:'Sino Calmante',desc:'+10% de EXP (a campanha não tem amizade)'},
 machobrace:{name:'Bracelete Macho',desc:'Ganha +1 de potencial a cada vitória (até 31)'},
 amuletcoin:{name:'Moeda Amuleto',desc:'Dobra o dinheiro das lutas contra treinadores'},
 everstone:{name:'Pedra Eterna',desc:'Impede a evolução enquanto estiver equipada'},
 cleansetag:{name:'Amuleto Purificador',desc:'Pokémon selvagens aparecem 2 níveis abaixo'},
 smokeball:{name:'Bola de Fumaça',desc:'Perder para um selvagem não machuca: você foge'},
 dragonscale:{name:'Escama de Dragão',desc:'+10% de dano com golpes de Dragão'},
 upgrade:{name:'Melhoria',desc:'Porygon: +15% de dano e 10% menos dano recebido',only:['porygon','porygon2']},
 lightball:{name:'Bola de Luz',desc:'Pikachu: +40% de dano',only:['pikachu']},
 thickclub:{name:'Osso Grosso',desc:'Cubone e Marowak: +40% de dano',only:['cubone','marowak']},
 luckypunch:{name:'Soco da Sorte',desc:'Chansey: +30% de dano',only:['chansey']},
 stick:{name:'Talo',desc:"Farfetch'd: +30% de dano",only:['farfetchd']},
 metalpowder:{name:'Pó Metálico',desc:'Ditto: recebe 30% menos dano',only:['ditto']},
 deepseatooth:{name:'Dente do Mar Profundo',desc:'Clamperl: +40% de dano',only:['clamperl']},
 deepseascale:{name:'Escama do Mar Profundo',desc:'Clamperl: recebe 30% menos dano',only:['clamperl']},
 souldew:{name:'Orvalho da Alma',desc:'Latias e Latios: +15% de dano e 15% menos dano recebido',only:['latias','latios']}
});
export const ITEM_TYPE_BONUS=1.10;
// Original FRLG icon of each item, served from assets/ui/frlg/items/held/.
export const HELD_ICON_DIR='assets/ui/frlg/items/held/';
export const heldIconKey=key=>'torre2-held-'+key;
export function itemForType(type){
 const t=up(type);
 return Object.keys(HELD_ITEMS).find(k=>HELD_ITEMS[k].type===t)||null;
}
// How to earn them (owner 2026-11-22: "Como a gente pode adquirir os itens?").
// Leaders: the item of the gym's type on the FIRST win (stage index).
export const LEADER_ITEMS=Object.freeze(['hardstone','mysticwater','magnet','miracleseed','poisonbarb',
 'twistedspoon','charcoal','softsand','nevermeltice','blackbelt','spelltag','dragonfang','silkscarf']);
export const EVENT_ITEMS=Object.freeze({e1:'sharpbeak',e2:'mysticwater',e3:'metalcoat',e4:'blackbelt',e5:'blackglasses',e6:'dragonfang'});
export const WILD_ITEM_CHANCE=.05;
// Wild win: small chance of the item of the wild Pokémon's first type.
export function wildItemRoll(types,random=Math.random){
 const r=Number(random());
 if(!(Number.isFinite(r)&&r>=0&&r<WILD_ITEM_CHANCE))return null;
 return itemForType(list(types)[0]);
}
export const HOW_TO_GET='Ganhe itens vencendo líderes e eventos 3x3 pela 1ª vez, com 5% de chance em lutas selvagens e na Loja de pontos.';
export function heldItemOf(member){return HELD_ITEMS[member?.heldItem]?member.heldItem:null}
export function itemDesc(key){const it=HELD_ITEMS[key];return !it?'':it.type?'+10% de dano com golpes do tipo '+it.type:it.desc}
const holds=(member,key)=>heldItemOf(member)===key&&(!HELD_ITEMS[key].only||HELD_ITEMS[key].only.includes(member?.id));
// Owned (not equipped) items live in inventory.held = {key: count}.
export function equipItem(state,uid,key){
 const next=JSON.parse(JSON.stringify(state));
 const m=[...list(next.team),...list(next.box)].find(x=>x?.uid===uid);if(!m)return null;
 const held={...(next.inventory?.held||{})};
 if(key&&!HELD_ITEMS[key])return null;
 if(key&&!(held[key]>0))return null;
 if(m.heldItem&&HELD_ITEMS[m.heldItem])held[m.heldItem]=(held[m.heldItem]||0)+1;
 if(key){held[key]--;if(!held[key])delete held[key]}
 m.heldItem=key||null;
 next.inventory={...next.inventory,held};
 return next;
}
export function giveItem(state,key,n=1){
 if(!HELD_ITEMS[key])return state;
 const held={...(state.inventory?.held||{})};held[key]=(held[key]||0)+n;
 return {...state,inventory:{...state.inventory,held}};
}
export function randomItemKey(random=Math.random){
 const keys=Object.keys(HELD_ITEMS);return keys[Math.min(keys.length-1,Math.floor(Math.max(0,Number(random())||0)*keys.length))];
}
// Campaign (outside battle) item effects.
export function expFactor(member){return holds(member,'luckyegg')?1.5:holds(member,'expshare')?1.25:holds(member,'soothebell')?1.10:1}
export const blocksEvolution=member=>holds(member,'everstone');
export const moneyFactor=team=>list(team).some(m=>holds(m,'amuletcoin'))?2:1;
export const wildLevelShift=member=>holds(member,'cleansetag')?2:0;
export const escapesWildLoss=member=>holds(member,'smokeball');
// Macho Brace: +1 potential (lowest stat first) after a win. Returns the stat.
export function machoBraceGrowth(member){
 if(!holds(member,'machobrace'))return null;
 const p=potentialOf(member);
 const stat=['hp','atk','def'].filter(k=>p[k]<31).sort((a,b)=>p[a]-p[b])[0];
 if(!stat)return null;
 member.potential={...p,[stat]:p[stat]+1};return stat;
}
// --- 10. Rivalidades ---------------------------------------------------------
const FAMILIES=Object.freeze({
 bulbasaur:'bulbasaur',ivysaur:'bulbasaur',venusaur:'bulbasaur',charmander:'charmander',charmeleon:'charmander',charizard:'charmander',
 squirtle:'squirtle',wartortle:'squirtle',blastoise:'squirtle',hitmonlee:'hitmonlee',hitmonchan:'hitmonchan',
 electabuzz:'electabuzz',magmar:'magmar',scyther:'scyther',pinsir:'pinsir',mankey:'mankey',primeape:'mankey',
 machop:'machop',machoke:'machop',machamp:'machop',gastly:'gastly',haunter:'gastly',gengar:'gastly',
 abra:'abra',kadabra:'abra',alakazam:'abra',magikarp:'magikarp',gyarados:'magikarp',dratini:'dratini',dragonair:'dratini',
 dragonite:'dratini',omanyte:'omanyte',omastar:'omanyte',kabuto:'kabuto',kabutops:'kabuto',nidoranm:'nidoranm',
 'nidoran-m':'nidoranm',nidorino:'nidoranm',nidoking:'nidoranm','nidoran-f':'nidoranf',nidorina:'nidoranf',nidoqueen:'nidoranf',
 growlithe:'growlithe',arcanine:'growlithe',vulpix:'vulpix',ninetales:'vulpix',sandshrew:'sandshrew',sandslash:'sandshrew',
 diglett:'diglett',dugtrio:'diglett',pikachu:'pikachu',raichu:'pikachu',voltorb:'voltorb',electrode:'voltorb'
});
export const RIVAL_PAIRS=Object.freeze([['charmander','squirtle'],['squirtle','bulbasaur'],['bulbasaur','charmander'],
 ['hitmonlee','hitmonchan'],['electabuzz','magmar'],['scyther','pinsir'],['mankey','machop'],['gastly','abra'],
 ['magikarp','dratini'],['omanyte','kabuto'],['nidoranm','nidoranf'],['growlithe','vulpix'],['sandshrew','diglett'],['pikachu','voltorb']]);
const familyOf=id=>FAMILIES[id]||id;
export function areRivals(a,b){
 const fa=familyOf(a),fb=familyOf(b);
 return fa!==fb&&RIVAL_PAIRS.some(([x,y])=>(x===fa&&y===fb)||(x===fb&&y===fa));
}
export function rivalsOf(id){
 const f=familyOf(id);
 return RIVAL_PAIRS.filter(p=>p.includes(f)).map(p=>p[0]===f?p[1]:p[0]);
}
export const RIVAL_BONUS=1.10;
export function partyHasRivalry(party){
 return list(party?.friend).some(a=>list(party?.foes).some(b=>areRivals(a?.id,b?.id)));
}
// --- Combat (pure) -------------------------------------------------------------
// atk/def: {member, side:0|1, hpRatio, hp, hpMax, types:[...], status:bool}
// move: {tipo}; ctx: {weather:'sun'|'rain'|'sand'|'hail'|'none'}
export function hpMultiplier(member,side=0){
 if(side!==0||!member)return 1;
 let m=ivFactor(potentialOf(member).hp);
 if(hiddenAbilityOf(member)==='vigor')m*=1.08;
 return m;
}
const PINCH={chama:'FIRE',torrente:'WATER',crescimento:'GRASS',enxame:'BUG'};
const ITEM_ATK={choiceband:1.15,upgrade:1.15,lightball:1.40,thickclub:1.40,luckypunch:1.30,stick:1.30,deepseatooth:1.40,souldew:1.15};
const ITEM_DEF={brightpowder:.90,laxincense:.95,upgrade:.90,metalpowder:.70,deepseascale:.70,souldew:.85};
export function damageMultiplier(atk,def,move,ctx={}){
 let m=1;const type=up(move?.tipo),weather=ctx?.weather||'none';
 if(atk?.side===0&&atk.member){
  const a=atk.member,low=atk.hpRatio>0&&atk.hpRatio<1/3;
  m*=ivFactor(potentialOf(a).atk);
  const ha=hiddenAbilityOf(a);
  if(ha==='furia'&&low)m*=1.15;
  if(PINCH[ha]&&low&&PINCH[ha]===type)m*=1.25;
  if(ha==='foco'&&type&&list(atk.types).map(up).includes(type))m*=1.10;
  if(ha==='sorte')m*=1.05;
  if(ha==='coragem'&&atk.status)m*=1.20;
  if(ha==='forca')m*=1.15;
  if(ha==='afobacao')m*=1.20;
  if(ha==='fogointerior'&&type==='FIRE')m*=1.15;
  if(ha==='clorofila'&&weather==='sun')m*=1.20;
  if(ha==='nadorapido'&&weather==='rain')m*=1.20;
  if(ha==='rivalidade'&&def?.member&&areRivals(a.id,def.member.id))m*=1.15;
  const key=heldItemOf(a),it=HELD_ITEMS[key];
  if(it?.type&&it.type===type)m*=ITEM_TYPE_BONUS;
  if(key&&ITEM_ATK[key]&&holds(a,key))m*=ITEM_ATK[key];
  if(key==='seaincense'&&type==='WATER')m*=1.05;
  if(key==='dragonscale'&&type==='DRAGON')m*=1.10;
 }
 if(def?.side===0&&def.member){
  const d=def.member;
  m/=ivFactor(potentialOf(d).def);
  const ha=hiddenAbilityOf(d);
  if(ha==='casca')m*=.90;
  if(ha==='sorte')m*=.95;
  if(ha==='gordura'&&(type==='FIRE'||type==='ICE'))m*=.5;
  if(ha==='levitacao'&&type==='GROUND')m*=.25;
  if(ha==='afobacao')m*=1.08;
  if(ha==='fogointerior'&&type==='FIRE')m*=.40;
  if(ha==='veuareia'&&weather==='sand')m*=.80;
  if(ha==='intimidacao'&&atk?.side!==0)m*=.90;
  const key=heldItemOf(d);
  if(key&&ITEM_DEF[key]&&holds(d,key))m*=ITEM_DEF[key];
 }
 if(atk?.member&&def?.member&&areRivals(atk.member.id,def.member.id))m*=RIVAL_BONUS;
 return m;
}
// Final damage d (after every native multiplier). Returns what the hook
// applies: the damage, heals and a short stun (seconds).
export function finalAdjust(atk,def,move,d,random=Math.random){
 const out={d,srcHeal:0,dstHeal:0,stun:0,crit:false,survived:null,absorbed:false};
 if(!(d>0))return out;
 const type=up(move?.tipo);
 if(atk?.side===0&&atk.member){
  const key=heldItemOf(atk.member);
  if(key==='scopelens'&&random()<.10){out.d*=1.5;out.crit=true}
  if(key==='kingsrock'&&random()<.10)out.stun=.25;
 }
 if(def?.side===0&&def.member){
  const ha=hiddenAbilityOf(def.member),key=heldItemOf(def.member);
  if((ha==='absorvevolt'&&type==='ELECTRIC')||(ha==='absorveagua'&&type==='WATER')){
   out.absorbed=true;out.dstHeal=(def.hpMax||0)/8;out.d=0;out.stun=0;return out;
  }
  const hp=Number(def.hp)||0;
  if(out.d>=hp&&hp>1){
   if(ha==='robustez'&&def.hpRatio>=.999){out.d=hp-1;out.survived='robustez'}
   else if(key==='focusband'&&random()<.10){out.d=hp-1;out.survived='focusband'}
  }
 }
 if(atk?.side===0&&heldItemOf(atk.member)==='shellbell')out.srcHeal=out.d/8;
 return out;
}
// Per-frame effects (dt in seconds). me: the fighter's side info; foeAbility:
// the player's active hidden ability when me is an opponent (Pressão).
export function tickAdjust(me,dt,ctx={},used={}){
 const out={heal:0,cdDelta:0,cure:null};
 const t=Math.max(0,Math.min(.25,Number(dt)||0));if(!t)return out;
 if(me?.side!==0){if(ctx.playerAbility==='pressao')out.cdDelta=-t*.10;return out}
 const m=me.member;if(!m)return out;
 const key=heldItemOf(m),ha=hiddenAbilityOf(m),hpMax=Number(me.hpMax)||0;
 if(key==='leftovers')out.heal+=hpMax/64*t;
 if(ha==='corpogelo'&&ctx.weather==='hail')out.heal+=hpMax/64*t;
 if(key==='quickclaw')out.cdDelta=t*.10;
 if(key==='whiteherb'&&!used.whiteherb&&me.est?.armaduraRota)out.cure='armaduraRota';
 if(key==='mentalherb'&&!used.mentalherb&&me.est?.confuso)out.cure='confuso';
 return out;
}
// --- Hooks used by the patched luchador.js (campaign battles only) -------------
function memberOf(fighter){
 const party=fighter?.escena?.datos?.torre2?.party;if(!party)return null;
 return fighter.lado===0?party.friend?.[party.playerIndex]:party.foes?.[party.enemyIndex];
}
const hpMaxOf=f=>{const v=typeof f?.hpMax==='function'?f.hpMax():f?.hpMax;return Number(v)||0};
function side(fighter){
 const m=memberOf(fighter);if(!m)return null;
 const hpMax=hpMaxOf(fighter);
 let status=false;try{status=!!fighter.tieneEstado?.()}catch{}
 return {member:m,side:fighter.lado===0?0:1,hp:Number(fighter.hp)||0,hpMax,hpRatio:hpMax>0?fighter.hp/hpMax:1,
  types:fighter.tipos||[],status,est:fighter.est||{}};
}
const weatherOf=f=>f?.escena?.datos?.torre2?.weather||'none';
export function installIndividuality(target=globalThis,random=Math.random){
 target.__torre2Indiv={
  hp(fighter){const m=memberOf(fighter);return m?hpMultiplier(m,fighter.lado===0?0:1):1},
  damage(src,dst,g){
   // Terrain (terrain.js) multiplies here too: one damage hook in luchador.js.
   const terrain=(()=>{try{return globalThis.__torre2Terrain?.damage?.(src,dst,g)??1}catch{return 1}})();
   try{const a=side(src),d=side(dst);if(!a||!d)return terrain;return damageMultiplier(a,d,g,{weather:weatherOf(dst)})*terrain}catch{return terrain}
  },
  final(src,dst,g,d){
   try{
    const a=side(src),b=side(dst);if(!a||!b)return d;
    const r=finalAdjust(a,b,g,d,random);
    if(r.srcHeal>0&&!src.ko)src.hp=Math.min(hpMaxOf(src),src.hp+r.srcHeal);
    if(r.dstHeal>0)dst.hp=Math.min(hpMaxOf(dst),dst.hp+r.dstHeal);
    if(r.stun>0)dst.ponerEstado?.('aturdido',r.stun);
    return Number.isFinite(r.d)?Math.max(0,r.d):d;
   }catch{return d}
  },
  tick(f,dt){
   try{
    if(f.ko||!(f.hp>0))return;
    const me=side(f);if(!me)return;
    const party=f.escena.datos.torre2.party,player=party.friend?.[party.playerIndex];
    const used=f.__torre2Used||(f.__torre2Used={});
    const r=tickAdjust(me,dt,{weather:weatherOf(f),playerAbility:hiddenAbilityOf(player)},used);
    if(r.heal>0)f.hp=Math.min(hpMaxOf(f),f.hp+r.heal);
    // Only running cooldowns change (a ready move stays ready).
    if(r.cdDelta&&f.cd)for(const k of Object.keys(f.cd))if(f.cd[k]>0)f.cd[k]=Math.max(0,f.cd[k]-r.cdDelta);
    if(r.cure){delete f.est[r.cure];used[heldItemOf(me.member)]=true}
   }catch{}
  }
 };
 return target.__torre2Indiv;
}
