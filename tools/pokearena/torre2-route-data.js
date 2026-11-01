import {FRLG_MACHINES} from './frlg-learnsets.js';
/* Route-like Kanto campaign map. FireRed-inspired locations and encounter
 * species, with FireRed/LeafGreen version differences shown as references.
 * The caller MUST filter by actually integrated battle species.
 */
export const KANTO_ROUTES=Object.freeze([
 {area:'Route 1 · Route 2 · Viridian Forest · Route 22',label:'ROUTE 1 / VIRIDIAN FOREST',
  wild:['pidgey','rattata','caterpie','weedle','pikachu','metapod','kakuna',
   'spearow','mankey','nidoran-f','nidoran-m','geodude']},
 {area:'Route 3 · Mt. Moon · Route 4 · Cerulean',label:'MT. MOON / CERULEAN',
  wild:['zubat','geodude','paras','clefairy','sandshrew','ekans',
   'staryu','psyduck','poliwag','jigglypuff','clefairy','parasect','zubat']},
 {area:'Route 24/25 · Route 5/6 · S.S. Anne · Diglett Cave',
  label:'CERULEAN / VERMILION ROUTES',
  wild:['meowth','pidgey','oddish','bellsprout','diglett','dugtrio',
   'magnemite','voltorb','drowzee','farfetchd','eevee','ponyta']},
 {area:'Route 7 · Route 8',label:'CELADON ROUTES',
  wild:['growlithe','vulpix','pidgeotto','rattata','meowth','ekans',
   'abra','kadabra','venonat','oddish','gloom','bellsprout','exeggcute']},
 {area:'Safari Zone · Fuchsia',label:'SAFARI ZONE',
  wild:['exeggcute','nidoran-f','nidoran-m','rhyhorn','paras','doduo','venonat',
   'kangaskhan','chansey','scyther','pinsir','tauros','ditto','nidorina','nidorino']},
 {area:'Route 5 · Route 8',label:'SAFFRON ROUTES',
  wild:['pidgey','meowth','growlithe','vulpix','oddish','bellsprout',
   'drowzee','hypno','gastly','haunter','venomoth','mr-mime','kadabra']},
 {area:'Pokémon Mansion · Cinnabar',label:'POKÉMON MANSION',
  wild:['koffing','grimer','raticate','vulpix','growlithe','ditto',
   'weezing','muk','ponyta','rapidash','magmar','electabuzz','seel','shellder']},
 {area:'Route 22 · Victory Road',label:'VIRIDIAN / VICTORY',
  wild:['mankey','spearow','rattata','nidoran-m','nidoran-f','onix','machop',
   'cubone','marowak','rhyhorn','rhydon','dugtrio','sandshrew','sandslash']},
 {area:'Route 23 · Victory Road',label:'VICTORY ROAD / LIGA',
  wild:['onix','machop','machoke','geodude','golbat','zubat','rhyhorn',
   'dragonair','dratini','seadra','dewgong','lapras','omanyte','kabuto']},
]);
export const ROUTE_STOP_TYPES=Object.freeze(['grass','center','mart']);
export function routeEncounterTable(stage){
 return KANTO_ROUTES[Math.min(KANTO_ROUTES.length-1,Math.max(0,stage))]||KANTO_ROUTES[0];
}
// Gym and route use the SAME encounter boundary. This is pure progression
// data, not a sprite-placement rule, and keeps old save indices intact.
export function gymRouteCount(stage,trainerLimit){
 if(!Number.isInteger(stage)||stage<0||stage>=8)return null;
 return Math.max(0,trainerLimit(stage)-(stage===0?3:4));
}
export function routeNode(stage,index,max){
 if(index>=max)return {type:'leader',name:'GINÁSIO',index};
 // Rival fights belong on the ROUTE, never inside a gym or just before its
 // leader. Keep the exact number of encounters and original trainer indices.
 // For the four affected stages (Brock, Misty, Sabrina, Blaine), move the
 // final rival to the final ROUTE position and put its ordinary route NPC
 // into the vacated gym position. No extra battles or save-schema changes.
 const boundary=gymRouteCount(stage,()=>max);
 const isRival=i=>i>0&&i%9===3;
 let rivalFrom=-1;
 if(boundary!==null)
  for(let i=boundary;i<max;i++)if(isRival(i)){rivalFrom=i;break;}
 const rivalTo=rivalFrom>=0?boundary-1:-1;
 const type=index===rivalTo?'rival':index===rivalFrom?'trainer':
  isRival(index)?'rival':index>0&&index%7===5?'rocket':'trainer';
 return {type,name:type==='rival'?'RIVAL':type==='rocket'?'ROCKET':'TREINADOR',index};
}
// Gym rewards only refer to installed moves. Toxic awaits its own implementation.
export const GYM_TM_REWARDS=Object.freeze(['tm-rock-tomb','tm-water-pulse',
 'tm-shock-wave','tm-giga-drain',null,'tm-calm-mind','tm-fire-blast','tm-earthquake']);
// A shop TM is available only after defeating the relevant Kanto leader.
// Gym rewards stay in their existing one-time award logic. Badge checks are
// independent of the current city index, protecting old/imported saves.
export const SHOP_TM_BADGE_STAGE=Object.freeze({
 'tm-rock-tomb':0,'tm-water-pulse':1,
 'tm-thunderbolt':2,'tm-shock-wave':2,
 'tm-giga-drain':3,'tm-ice-beam':4,
 'tm-calm-mind':5,'tm-flamethrower':6,'tm-fire-blast':6,
 'tm-earthquake':7
});
export function martItemUnlocked(state,item){
 if(!item||!Number.isInteger(state?.stage))return false;
 if(state.stage<(item.minStage??0))return false;
 if(item.kind!=='tm')return true;
 const gym=SHOP_TM_BADGE_STAGE[item.id];
 return Number.isInteger(gym)&&
  state.stage>gym&&Array.isArray(state.badges)&&
  state.badges.includes(['Rocha','Cascata','Trovao','Arco-Iris',
   'Alma','Pantano','Vulcao','Terra'][gym]);
}
export const MART_ITEMS=Object.freeze([
 {id:'antidote',name:'ANTÍDOTO',price:100,kind:'status',cures:['veneno']},
 {id:'paralyzeheal',name:'ANTI-PARALISIA',price:200,kind:'status',cures:['paralizado']},
 {id:'awakening',name:'DESPERTAR',price:250,kind:'status',cures:['dormido']},
 {id:'burnheal',name:'ANTI-QUEIMADURA',price:250,kind:'status',cures:['quemado']},
 {id:'iceheal',name:'ANTICONGELANTE',price:250,kind:'status',cures:['congelado'],minStage:2},
 {id:'fullheal',name:'CURA TOTAL',price:600,kind:'status',cures:['veneno','paralizado','dormido','quemado','congelado'],cureConfusion:true,minStage:4},
 {id:'tm-rock-tomb',name:'TM39 ROCK TOMB',price:1200,kind:'tm',move:'Rock Tomb',minStage:1},
 {id:'pokeball',name:'POKÉ BALL',price:200,kind:'ball'},
 {id:'greatball',name:'GREAT BALL',price:600,kind:'ball',minStage:2},
 {id:'ultraball',name:'ULTRA BALL',price:1200,kind:'ball',minStage:4},
 {id:'potion',name:'POÇÃO',price:300,kind:'heal',heal:25},
 {id:'superpotion',name:'SUPER POÇÃO',price:700,kind:'heal',heal:60,minStage:2},
 {id:'tm-thunderbolt',name:'TM24 THUNDERBOLT',price:1800,kind:'tm',move:'Thunderbolt',minStage:3},
 {id:'tm-water-pulse',name:'TM03 WATER PULSE',price:1500,kind:'tm',move:'Water Pulse',minStage:2},
 {id:'tm-flamethrower',name:'TM35 FLAMETHROWER',price:2200,kind:'tm',move:'Flamethrower',minStage:7},
 {id:'tm-ice-beam',name:'TM13 ICE BEAM',price:2400,kind:'tm',move:'Ice Beam',minStage:5},
 {id:'tm-shock-wave',name:'TM34 SHOCK WAVE',price:1800,kind:'tm',move:'Shock Wave',minStage:3},
 {id:'tm-giga-drain',name:'TM19 GIGA DRAIN',price:2200,kind:'tm',move:'Giga Drain',minStage:4},
 {id:'tm-calm-mind',name:'TM04 CALM MIND',price:2600,kind:'tm',move:'Calm Mind',minStage:6},
 {id:'tm-fire-blast',name:'TM38 FIRE BLAST',price:3000,kind:'tm',move:'Fire Blast',minStage:7},
 {id:'tm-earthquake',name:'TM26 EARTHQUAKE',price:4000,kind:'tm',move:'Earthquake',minStage:8},
].map(item=>item.kind==='tm'?Object.freeze({...item,
 compatible:Object.freeze(Object.entries(FRLG_MACHINES).filter(([,moves])=>
  moves.includes(item.id.slice(3))).map(([id])=>id))}):Object.freeze(item)));
