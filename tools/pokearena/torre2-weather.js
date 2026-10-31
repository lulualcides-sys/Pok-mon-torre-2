/* FRLG weather, adapted to five four-second simulation windows.
 * State belongs to one battle, never the save or an individual fighter.
 * Rendering stays owned by the approved native effects.
 */
export const WEATHER_WINDOW=4,WEATHER_DURATION=20;
export const WEATHER_NAMES=Object.freeze({none:'SEM CLIMA',sun:'SOL',rain:'CHUVA',sand:'AREIA',hail:'GRANIZO'});
export const WEATHER_MOVES=Object.freeze({'Sunny Day':'sun','Rain Dance':'rain',Sandstorm:'sand',Hail:'hail'});
export function createWeather(){return {kind:'none',remaining:0,elapsed:0,revision:0};}
export function setWeather(state,kind){
 if(!state||typeof state!=='object'||!Object.hasOwn(WEATHER_NAMES,kind))return false;
 state.kind=kind;state.remaining=kind==='none'?0:WEATHER_DURATION;state.elapsed=0;state.revision++;return true;
}
// Custom Kanto climate affinity, NOT the original Gen III +50% move boost.
// A species earns a single +20% for friendly climate or -20% for hostile
// climate (including its coverage attacks). For dual-type Pokémon with one
// favorable AND one opposed type, these cancel to neutral instead of stacking.
// No effect is inferred from move type: actual active fighter types only.
export const WEATHER_AFFINITY_TYPES=Object.freeze({
 sun:Object.freeze(['FIRE','GRASS']),
 // Rain belongs to Water offense; Electric still gains Thunder accuracy,
 // but not +20% to its entire moveset just because it is raining.
 rain:Object.freeze(['WATER']),
 sand:Object.freeze(['ROCK','GROUND','STEEL']),
 // Pure Water gets rain, Ice gets hail. Water/Ice benefits through Ice.
 hail:Object.freeze(['ICE'])
});
export const WEATHER_OPPOSED_TYPES=Object.freeze({
 sun:Object.freeze(['WATER','ICE']),
 rain:Object.freeze(['FIRE','GROUND','ROCK']),
 sand:Object.freeze(['GRASS','FLYING','ICE']),
 hail:Object.freeze(['FIRE','GRASS','DRAGON'])
});
export const WEATHER_AFFINITY_BONUS=1.2;
export const WEATHER_OPPOSITION_PENALTY=.8;
export function weatherSpeciesMultiplier(state,attackerTypes=[]){
 const kind=state?.kind||'none';
 if(kind==='none'||!(Number(state?.remaining)>0)||
    !Array.isArray(attackerTypes))return 1;
 const favorable=attackerTypes.some(t=>WEATHER_AFFINITY_TYPES[kind]?.includes(t));
 const opposed=attackerTypes.some(t=>WEATHER_OPPOSED_TYPES[kind]?.includes(t));
 if(favorable&&opposed)return 1; // eg Water/Ground under rain
 return favorable?WEATHER_AFFINITY_BONUS:opposed?WEATHER_OPPOSITION_PENALTY:1;
}
export function weatherDamageMultiplier(state,type,move='',attackerTypes=[]){
 const kind=state?.kind||'none';
 if(kind==='none'||!(Number(state?.remaining)>0))return 1;
 let movePenalty=1;
 if(kind==='sun'&&type==='WATER')movePenalty*=.5;
 if(kind==='rain'&&type==='FIRE')movePenalty*=.5;
 if(isSolarBeam(move)&&['rain','sand','hail'].includes(kind))movePenalty*=.5;
 const species=weatherSpeciesMultiplier(state,attackerTypes);
 // Do not compound two independent weather penalties for an opposed
 // attacker: it already takes the stronger -50% move penalty, if present.
 // This keeps weak matches challenging without making them unusable.
 return species<1&&movePenalty<1?Math.min(species,movePenalty):
  species*movePenalty;
}
export function weatherRecoveryFraction(state){
 if(!state||state.kind==='none'||!(Number(state.remaining)>0))return 1/2;
 return state.kind==='sun'?2/3:1/4;
}
const moveKey=name=>String(name||'').normalize('NFKD')
 .replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/[\s_-]+/g,' ');
const isThunder=name=>['thunder','trueno'].includes(moveKey(name));
const isSolarBeam=name=>['solar beam','solarbeam','rayo solar'].includes(moveKey(name));
export function weatherAccuracy(state,move,base){
 // Blizzard gains guaranteed accuracy only in later generations, not FRLG.
 if(!(Number(state?.remaining)>0))return base;
 return isThunder(move)?(state?.kind==='rain'?100:state?.kind==='sun'?50:base):base;
}
// The original Arena collision still decides whether the attack reaches a
// target. This Gen III weather roll affects only a landed Thunder in sunlight.
// In rain there is NO additional RNG; physical aim and shields remain intact.
export function weatherThunderMiss(state,move,random=Math.random){
 if(state?.kind!=='sun'||!(Number(state?.remaining)>0)||!isThunder(move))return false;
 return Number(random())>=0.5;
}
export function weatherResidualImmune(kind,types=[]){
 const safeTypes=Array.isArray(types)?types:[];
 return kind==='sand'?safeTypes.some(t=>['ROCK','GROUND','STEEL'].includes(t)):
  kind==='hail'?safeTypes.includes('ICE'):true;
}
export function tickWeather(state,dt,actors=[]){
 if(!state||state.kind==='none'||!Number.isFinite(dt)||dt<=0)return [];
 const activeActors=Array.isArray(actors)?actors:[];
 const step=Math.min(dt,state.remaining);state.remaining=Math.max(0,state.remaining-step);state.elapsed+=step;
 const fainted=[];
 while(state.elapsed+1e-9>=WEATHER_WINDOW){
  state.elapsed=Math.max(0,state.elapsed-WEATHER_WINDOW);
  for(const actor of activeActors){
   if(!actor||actor.ko||!Number.isFinite(actor.hp)||actor.hp<=0||
      !Number.isFinite(actor.hpMax)||actor.hpMax<=0||
      weatherResidualImmune(state.kind,actor.tipos))continue;
   actor.hp=Math.max(actor.inmortal?1:0,actor.hp-Math.max(1,Math.floor(actor.hpMax/16)));
   if(actor.hp<=0&&!fainted.includes(actor))fainted.push(actor);
  }
 }
 // Fractional Phaser-frame accumulation can leave ~1e-12s instead of zero.
 // Treat that as finished to avoid an extra invisible damage-buff frame.
 if(state.remaining<=1e-6)setWeather(state,'none');
 return fainted;
}
export function weatherFromMove(actor,move){
 if(!actor?.escena?.datos?.torre2)return;
 const kind=WEATHER_MOVES[move?.nombre];
 if(kind)setWeather(actor.escena.__torre2Weather??=createWeather(),kind);
}
