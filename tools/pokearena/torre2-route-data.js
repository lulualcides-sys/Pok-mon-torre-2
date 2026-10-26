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
export function routeNode(stage,index,max){
 if(index>=max)return {type:'leader',name:'GINÁSIO',index};
 // Insert rivals/Rocket IN the trainer ladder without adding extra
 // compulsory battles. Boss and existing 13+ progression remain unchanged.
 const type=index>0&&index%9===3?'rival':index>0&&index%7===5?'rocket':'trainer';
 return {type,name:type==='rival'?'RIVAL':type==='rocket'?'ROCKET':'TREINADOR',index};
}
// Gym rewards only refer to installed moves. Toxic awaits its own implementation.
export const GYM_TM_REWARDS=Object.freeze(['tm-rock-tomb','tm-water-pulse',
 'tm-shock-wave','tm-giga-drain',null,'tm-calm-mind','tm-fire-blast','tm-earthquake']);
export const MART_ITEMS=Object.freeze([
 {id:'tm-rock-tomb',name:'TM39 ROCK TOMB',price:1200,kind:'tm',move:'Rock Tomb',minStage:1},
 {id:'pokeball',name:'POKÉ BALL',price:200,kind:'ball'},
 {id:'greatball',name:'GREAT BALL',price:600,kind:'ball',minStage:2},
 {id:'ultraball',name:'ULTRA BALL',price:1200,kind:'ball',minStage:4},
 {id:'potion',name:'POÇÃO',price:300,kind:'heal',heal:25},
 {id:'superpotion',name:'SUPER POÇÃO',price:700,kind:'heal',heal:60,minStage:2},
 {id:'tm-thunderbolt',name:'TM24 THUNDERBOLT',price:1800,kind:'tm',move:'Thunderbolt',minStage:2},
 {id:'tm-water-pulse',name:'TM03 WATER PULSE',price:1500,kind:'tm',move:'Water Pulse',minStage:1},
 {id:'tm-flamethrower',name:'TM35 FLAMETHROWER',price:2200,kind:'tm',move:'Flamethrower',minStage:3},
 {id:'tm-ice-beam',name:'TM13 ICE BEAM',price:2400,kind:'tm',move:'Ice Beam',minStage:4},
 {id:'tm-shock-wave',name:'TM34 SHOCK WAVE',price:1800,kind:'tm',move:'Shock Wave',minStage:3},
 {id:'tm-giga-drain',name:'TM19 GIGA DRAIN',price:2200,kind:'tm',move:'Giga Drain',minStage:4},
 {id:'tm-calm-mind',name:'TM04 CALM MIND',price:2600,kind:'tm',move:'Calm Mind',minStage:6},
 {id:'tm-fire-blast',name:'TM38 FIRE BLAST',price:3000,kind:'tm',move:'Fire Blast',minStage:7},
 {id:'tm-earthquake',name:'TM26 EARTHQUAKE',price:4000,kind:'tm',move:'Earthquake',minStage:8},
].map(item=>item.kind==='tm'?Object.freeze({...item,
 compatible:Object.freeze(Object.entries(FRLG_MACHINES).filter(([,moves])=>
  moves.includes(item.id.slice(3))).map(([id])=>id))}):Object.freeze(item)));
