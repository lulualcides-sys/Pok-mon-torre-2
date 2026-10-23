/* Pure move catalog, shared by Github build gate and Phaser runtime.
 * Never import WebGL FX into Node policy checks prior to build copying.
 */
export const FINALE_13_MOVES=Object.freeze([
 ['Psychic','PSYCHIC',18,246,31,7,'Charge',80,100,'SPECIAL'],
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
 approved:false,description:'Kanto finishing pass: true physics, hand-pixelled frames; visual review required.'})));
export const FINALE_13_NAMES=Object.freeze(FINALE_13_MOVES.map(m=>m.nombre));
