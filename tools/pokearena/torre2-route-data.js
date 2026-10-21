/* Route-like Kanto campaign map. FireRed-inspired locations and encounter
 * species, with FireRed/LeafGreen version differences shown as references.
 * The caller MUST filter by actually integrated battle species.
 */
export const KANTO_ROUTES=Object.freeze([
 {area:'Route 2 · Viridian Forest',label:'VIRIDIAN FOREST',
  wild:['pidgey','rattata','caterpie','weedle','pikachu','metapod','kakuna']},
 {area:'Mt. Moon · Route 4',label:'MT. MOON',
  wild:['zubat','geodude','paras','clefairy','sandshrew','ekans']},
 {area:'Route 6 · Diglett Cave',label:'VERMILION ROUTES',
  wild:['meowth','pidgey','oddish','bellsprout','diglett','dugtrio']},
 {area:'Route 7 · Route 8',label:'CELADON ROUTES',
  wild:['growlithe','vulpix','pidgeotto','rattata','meowth','ekans']},
 {area:'Safari Zone · Fuchsia',label:'SAFARI ZONE',
  wild:['exeggcute','nidoran','rhyhorn','paras','doduo','venonat']},
 {area:'Route 5 · Route 8',label:'SAFFRON ROUTES',
  wild:['pidgey','meowth','growlithe','vulpix','oddish','bellsprout']},
 {area:'Pokémon Mansion · Cinnabar',label:'POKÉMON MANSION',
  wild:['koffing','grimer','raticate','vulpix','growlithe','ditto']},
 {area:'Route 22 · Victory Road',label:'VIRIDIAN / VICTORY',
  wild:['mankey','spearow','rattata','nidoran','onix','machop']},
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
export const MART_ITEMS=Object.freeze([
 {id:'pokeball',name:'POKÉ BALL',price:200,kind:'ball'},
 {id:'greatball',name:'GREAT BALL',price:600,kind:'ball',minStage:2},
 {id:'ultraball',name:'ULTRA BALL',price:1200,kind:'ball',minStage:4},
 {id:'potion',name:'POÇÃO',price:300,kind:'heal',heal:25},
 {id:'superpotion',name:'SUPER POÇÃO',price:700,kind:'heal',heal:60,minStage:2},
 {id:'tm-thunderbolt',name:'TM24 THUNDERBOLT',price:1800,kind:'tm',move:'Thunderbolt',minStage:2},
 {id:'tm-water-pulse',name:'TM03 WATER PULSE',price:1500,kind:'tm',move:'Water Pulse',minStage:1},
 {id:'tm-flamethrower',name:'TM35 FLAMETHROWER',price:2200,kind:'tm',move:'Flamethrower',minStage:3},
 {id:'tm-ice-beam',name:'TM13 ICE BEAM',price:2400,kind:'tm',move:'Ice Beam',minStage:4},
]);
