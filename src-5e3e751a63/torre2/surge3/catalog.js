/* FireRed Lt. Surge: independent move definitions, not a second copy of
 * any native Poké Arena 2D effect. Thunder Wave, Screech and three-white-crescent Sonic Boom all approved by user. */
export const SURGE3_MOVES=Object.freeze([
 Object.freeze({
  id:'thunder-wave',nombre:'Thunder Wave',forma:'torre2_surge_thunder_wave',
  tipo:'ELECTRIC',categoria:'STATUS',poder:0,precisao:100,pp:20,
  approved:true,source:'new-phaser-fx',fazContato:false,dano:0,
  alcance:230,speed:282,coste:16,cd:5.7,anim:'Shoot',lanzar:.16,
  frames:12,style:'thunder-wave',status:'paralizado',
  description:'Electric pulse: paralysis on manual hit. Ground-types immune.',
  reference:'https://pokemondb.net/move/thunder-wave'
 }),
 Object.freeze({
  id:'sonic-boom',nombre:'Sonic Boom',forma:'torre2_surge_sonic_boom',
  tipo:'NORMAL',categoria:'SPECIAL',poder:0,precisao:90,pp:20,
  approved:true,source:'new-phaser-fx',fazContato:false,dano:20,
  fixedDamage:20,alcance:250,speed:320,coste:18,cd:5.1,
  anim:'Shoot',lanzar:.13,frames:12,style:'sonic-boom',
  description:'Three white pixel-art crescents in a trailing sequence; one aimed impact for 20 fixed HP damage, Ghost immune.',
  reference:'https://pokemondb.net/move/sonic-boom'
 }),
 Object.freeze({
  id:'screech',nombre:'Screech',forma:'torre2_surge_screech',
  tipo:'NORMAL',categoria:'STATUS',poder:0,precisao:85,pp:40,
  approved:true,source:'new-phaser-fx',fazContato:false,dano:0,
  alcance:212,speed:268,coste:19,cd:7,anim:'Charge',lanzar:.16,
  frames:12,style:'screech',status:'torre2Screech',
  description:'Piercing sound waves: target loses two Defense stages, maximum -6.',
  reference:'https://pokemondb.net/move/screech'
 })
]);
export const SURGE_LEADER_LOADOUTS=Object.freeze({
 // Exactly four FRLG moves each, mapped to Kanto controls:
 // ATK, HAB2, HAB3, ULT (E). No alteration to personal party loadouts.
 voltorb:Object.freeze(['Tackle','Sonic Boom','Screech','Shock Wave']),
 pikachu:Object.freeze(['Quick Attack','Thunder Wave','Double Team','Shock Wave']),
 raichu:Object.freeze(['Quick Attack','Thunder Wave','Double Team','Shock Wave'])
});
