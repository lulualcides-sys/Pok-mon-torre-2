/* Pure move catalog, shared by Github build gate and Phaser runtime.
 * Never import WebGL FX into Node policy checks prior to build copying.
 */
export const FINALE_13_MOVES=Object.freeze([
 ['Psychic','PSYCHIC',22,246,35,7.6,'Charge',90,100,'SPECIAL'],
 ['Sleep Powder','GRASS',0,206,22,10,'Charge',0,75,'STATUS'],
 ['Protect','NORMAL',0,0,31,13,'Charge',0,100,'STATUS'],
 ['Surf','WATER',19,225,35,8,'Charge',95,100,'SPECIAL'],
 ['Ice Punch','ICE',15,72,23,5.7,'Punch',75,100,'PHYSICAL'],
 ['Thunder Punch','ELECTRIC',15,72,23,5.7,'Punch',75,100,'PHYSICAL'],
 ['Fire Punch','FIRE',15,72,23,5.7,'Punch',75,100,'PHYSICAL'],
 ['Cross Chop','FIGHTING',20,77,30,7.1,'Swing',100,80,'PHYSICAL'],
 ['Aerial Ace','FLYING',12,88,21,5.2,'Swing',60,100,'PHYSICAL'],
 ['Flame Wheel','FIRE',12,85,22,5.2,'Charge',60,100,'PHYSICAL'],
 ['Light Screen','PSYCHIC',0,0,32,15,'Charge',0,100,'STATUS'],
 ['Rain Dance','WATER',0,0,35,18,'Charge',0,100,'STATUS'],
 ['Sand Attack','GROUND',0,202,18,8,'Throw',0,100,'STATUS']
].map(([nombre,tipo,dano,alcance,coste,cd,anim,poder,precisao,categoria])=>
 Object.freeze({id:nombre.toLowerCase().replaceAll(' ','-'),nombre,
 forma:'torre2_finale_'+nombre.toLowerCase().replaceAll(' ',''),
 tipo,dano,alcance,coste,cd,anim,lanzar:.15,poder,precisao,pp:10,categoria,
 approved:['fire-punch','cross-chop','aerial-ace','ice-punch','thunder-punch','rain-dance','sand-attack','sleep-powder','surf','flame-wheel','psychic','protect','light-screen'].includes(nombre.toLowerCase().replaceAll(' ','-')),
 description:'Kanto finishing pass: original pixel frames, real hit checks and status'})));
export const FINALE_13_NAMES=Object.freeze(FINALE_13_MOVES.map(m=>m.nombre));

/* Custom Poison Punch (NOT a canonical FireRed move): player-requested
 * purple recolor of the approved physical-punch silhouette and timing. */
export const POISON_PUNCH_MOVES=Object.freeze([Object.freeze({
 id:'poison-punch',nombre:'Poison Punch',forma:'torre2_finale_poisonpunch',
 tipo:'POISON',dano:15,alcance:72,coste:23,cd:5.7,anim:'Punch',
 lanzar:.15,poder:75,precisao:100,pp:15,categoria:'PHYSICAL',
 approved:true,description:'Purple variant of the approved contact punch; 30% poison on true hit; approved by user on 2026-10-23'
})]);
