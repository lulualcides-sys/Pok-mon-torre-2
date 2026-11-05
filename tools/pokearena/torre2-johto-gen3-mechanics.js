/* Tested Gen III core rules for Johto LAB damage previews.
 * Never apply these to the main game without native parity review.
 * Sources: pokemondb.net/move/magnitude , /present , /triple-kick,
 * /hidden-power , /beat-up , /return , /frustration
 */
export const MAGNITUDE_TABLE=Object.freeze([
 Object.freeze({level:4,power:10,weight:5}),
 Object.freeze({level:5,power:30,weight:10}),
 Object.freeze({level:6,power:50,weight:20}),
 Object.freeze({level:7,power:70,weight:30}),
 Object.freeze({level:8,power:90,weight:20}),
 Object.freeze({level:9,power:110,weight:10}),
 Object.freeze({level:10,power:150,weight:5})
]);
export function magnitudeGen3(random=Math.random){
 const roll=Math.max(0,Math.min(.999999999,Number(random())||0));
 let cursor=0;
 for(const tier of MAGNITUDE_TABLE){cursor+=tier.weight/100;if(roll<cursor)return tier}
 return MAGNITUDE_TABLE.at(-1);
}
export function presentGen3(random=Math.random){
 const roll=Math.max(0,Math.min(.999999999,Number(random())||0));
 if(roll<.4)return {kind:"damage",power:40};
 if(roll<.7)return {kind:"damage",power:80};
 if(roll<.8)return {kind:"damage",power:120};
 return {kind:"heal",fraction:.25};
}
export function tripleKickGen3(hitIndex){
 if(!Number.isInteger(hitIndex)||hitIndex<0||hitIndex>2)throw RangeError("triple-kick hitIndex 0..2");
 return Object.freeze({power:10*(hitIndex+1),checkAccuracy:true,stopOnMiss:true});
}
export function friendshipPowerGen3(friendship,isFrustration=false){
 if(!Number.isInteger(friendship)||friendship<0||friendship>255)return null;
 const happiness=isFrustration?255-friendship:friendship;
 return Math.max(1,Math.floor(happiness*10/25));
}
const HIDDEN_POWER_TYPES=Object.freeze([
 "FIGHTING","FLYING","POISON","GROUND","ROCK","BUG","GHOST","STEEL",
 "FIRE","WATER","GRASS","ELECTRIC","PSYCHIC","ICE","DRAGON","DARK"
]);
export function hiddenPowerGen3(ivs){
 const names=["hp","attack","defense","speed","spAttack","spDefense"];
 if(!ivs||names.some(n=>!Number.isInteger(ivs[n])||ivs[n]<0||ivs[n]>31))return null;
 const parity=names.reduce((s,n,i)=>s+((ivs[n]&1)<<i),0);
 const second=names.reduce((s,n,i)=>s+(((ivs[n]>>1)&1)<<i),0);
 const type=HIDDEN_POWER_TYPES[Math.floor(parity*15/63)];
 const power=Math.floor(second*40/63)+30;
 return Object.freeze({type,power});
}
export function beatUpGen3Participants(party){
 if(!Array.isArray(party)||party.length===0)return 1; // isolated solo Mewtwo lab
 return Math.min(6,party.filter(p=>p&&p.hp>0&&!p.est?.veneno&&!p.est?.quemado&&
  !p.est?.paralizado&&!p.est?.congelado&&!p.est?.dormido).length);
}
