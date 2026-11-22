/* Pokémon Torre 2 — individual Pokémon (owner request 2026-11-22, README
 * items 5, 9, 1 and 10). Campaign only, never the native kits:
 *  - Potencial individual (5): HP/ATK/DEF 0–31 per Pokémon (like IVs),
 *    stable from its own UID, ±5% at most on HP, damage dealt and taken.
 *  - Habilidade oculta (9): about 5% of Pokémon carry one rare passive.
 *  - Equipamentos (1): one held item per Pokémon (type boosters +10% for
 *    moves of that type, or a vest that cuts damage taken by 8%).
 *  - Rivalidade (10): rival species fight harder against each other (+10%
 *    damage both ways) and the player's wins against a rival are counted.
 * The combat hook (globalThis.__torre2Indiv) multiplies the campaign's own
 * HP and damage scaling; moves, VFX, cooldowns and other modes are untouched.
 */
const list=v=>Array.isArray(v)?v:[];
export function hash(text){let h=2166136261;for(const c of String(text)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
const clampIv=v=>Math.max(0,Math.min(31,Math.floor(Number(v))));
// --- 5. Potencial -------------------------------------------------------------
export function potentialOf(member){
 const p=member?.potential;
 if(p&&[p.hp,p.atk,p.def].every(Number.isFinite))return {hp:clampIv(p.hp),atk:clampIv(p.atk),def:clampIv(p.def)};
 const seed=String(member?.uid||member?.id||'x');
 return {hp:hash(seed+':hp')%32,atk:hash(seed+':atk')%32,def:hash(seed+':def')%32};
}
export function potentialStars(p){const t=p.hp+p.atk+p.def;return t>=84?5:t>=66?4:t>=46?3:t>=26?2:1}
const ivFactor=v=>1+((v-15.5)/31)*.10; // 0 → 0.95, 31 → 1.05
// --- 9. Habilidades ocultas --------------------------------------------------
export const HIDDEN_ABILITIES=Object.freeze({
 furia:{name:'Fúria Oculta',desc:'+15% de dano com o HP abaixo de 1/3'},
 casca:{name:'Casca Rara',desc:'Recebe 10% menos dano'},
 vigor:{name:'Vigor Antigo',desc:'+8% de HP máximo'},
 foco:{name:'Foco do Tipo',desc:'+10% de dano com golpes do próprio tipo'},
 sorte:{name:'Sorte Selvagem',desc:'+5% de dano e 5% menos dano recebido'}
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
export const HELD_ITEMS=Object.freeze({
 silkscarf:{name:'Lenço de Seda',type:'NORMAL'},charcoal:{name:'Carvão',type:'FIRE'},
 mysticwater:{name:'Água Mística',type:'WATER'},miracleseed:{name:'Semente Milagrosa',type:'GRASS'},
 magnet:{name:'Ímã',type:'ELECTRIC'},nevermeltice:{name:'Gelo Eterno',type:'ICE'},
 blackbelt:{name:'Faixa Preta',type:'FIGHTING'},poisonbarb:{name:'Ferrão Venenoso',type:'POISON'},
 softsand:{name:'Areia Macia',type:'GROUND'},sharpbeak:{name:'Bico Afiado',type:'FLYING'},
 twistedspoon:{name:'Colher Torta',type:'PSYCHIC'},silverpowder:{name:'Pó Prateado',type:'BUG'},
 hardstone:{name:'Pedra Dura',type:'ROCK'},spelltag:{name:'Selo Fantasma',type:'GHOST'},
 dragonfang:{name:'Presa de Dragão',type:'DRAGON'},vest:{name:'Colete Reforçado',guard:.08}
});
export const ITEM_TYPE_BONUS=1.10;
export function heldItemOf(member){return HELD_ITEMS[member?.heldItem]?member.heldItem:null}
export function itemDesc(key){const it=HELD_ITEMS[key];if(!it)return '';return it.guard?'Recebe 8% menos dano':'+10% de dano com golpes do tipo '+it.type}
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
// --- Combat multipliers (pure) -----------------------------------------------
// atk/def: {member, side:0|1, hpRatio, types:[...]}; move: {tipo}
export function hpMultiplier(member,side=0){
 if(side!==0||!member)return 1;
 let m=ivFactor(potentialOf(member).hp);
 if(hiddenAbilityOf(member)==='vigor')m*=1.08;
 return m;
}
export function damageMultiplier(atk,def,move){
 let m=1;const type=String(move?.tipo||'').toUpperCase();
 if(atk?.side===0&&atk.member){
  m*=ivFactor(potentialOf(atk.member).atk);
  const ha=hiddenAbilityOf(atk.member);
  if(ha==='furia'&&atk.hpRatio>0&&atk.hpRatio<1/3)m*=1.15;
  if(ha==='foco'&&type&&list(atk.types).map(String).includes(type))m*=1.10;
  if(ha==='sorte')m*=1.05;
  const it=HELD_ITEMS[heldItemOf(atk.member)];
  if(it?.type&&it.type===type)m*=ITEM_TYPE_BONUS;
 }
 if(def?.side===0&&def.member){
  m/=ivFactor(potentialOf(def.member).def);
  const ha=hiddenAbilityOf(def.member);
  if(ha==='casca')m*=.90;
  if(ha==='sorte')m*=.95;
  const it=HELD_ITEMS[heldItemOf(def.member)];
  if(it?.guard)m*=1-it.guard;
 }
 if(atk?.member&&def?.member&&areRivals(atk.member.id,def.member.id))m*=RIVAL_BONUS;
 return m;
}
// --- Hook used by the patched luchador.js (campaign battles only) -------------
function memberOf(fighter){
 const party=fighter?.escena?.datos?.torre2?.party;if(!party)return null;
 return fighter.lado===0?party.friend?.[party.playerIndex]:party.foes?.[party.enemyIndex];
}
function side(fighter){
 const m=memberOf(fighter);if(!m)return null;
 const hpMax=Number(fighter.hpMax)||0;
 return {member:m,side:fighter.lado===0?0:1,hpRatio:hpMax>0?fighter.hp/hpMax:1,types:fighter.tipos||[]};
}
export function installIndividuality(target=globalThis){
 target.__torre2Indiv={
  hp(fighter){const m=memberOf(fighter);return m?hpMultiplier(m,fighter.lado===0?0:1):1},
  damage(src,dst,g){
   try{const a=side(src),d=side(dst);if(!a||!d)return 1;return damageMultiplier(a,d,g)}catch{return 1}
  }
 };
 return target.__torre2Indiv;
}
