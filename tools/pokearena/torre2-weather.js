/* FRLG weather, adapted to five four-second simulation windows.
 * State belongs to one battle, never the save or an individual fighter.
 * Rendering stays owned by the approved native effects.
 */
export const WEATHER_WINDOW=4,WEATHER_DURATION=20;
export const WEATHER_NAMES=Object.freeze({none:'SEM CLIMA',sun:'SOL',rain:'CHUVA',sand:'AREIA',hail:'GRANIZO'});
export const WEATHER_MOVES=Object.freeze({'Sunny Day':'sun','Rain Dance':'rain',Sandstorm:'sand',Hail:'hail'});
export function createWeather(){return {kind:'none',remaining:0,elapsed:0,revision:0};}
export function setWeather(state,kind){
 if(!Object.hasOwn(WEATHER_NAMES,kind))return false;
 state.kind=kind;state.remaining=kind==='none'?0:WEATHER_DURATION;state.elapsed=0;state.revision++;return true;
}
// Torre 2's requested 20% gym/campaign type-affinity bonus is NOT the
// original Gen III +50% move-type boost. A matching species gains exactly
// +20% direct attack damage, including coverage moves. Dual types do not stack.
// The existing sun/rain *penalties* and Solar Beam drawback remain intact.
export const WEATHER_AFFINITY_TYPES=Object.freeze({
 sun:Object.freeze(['FIRE']),
 rain:Object.freeze(['WATER']),
 sand:Object.freeze(['ROCK','GROUND','STEEL']),
 hail:Object.freeze(['ICE'])
});
export const WEATHER_AFFINITY_BONUS=1.2;
export function weatherDamageMultiplier(state,type,move='',attackerTypes=[]){
 const kind=state?.kind||'none';
 if(kind==='none'||!(Number(state?.remaining)>0))return 1;
 let factor=1;
 if(kind==='sun'&&type==='WATER')factor*=.5;
 if(kind==='rain'&&type==='FIRE')factor*=.5;
 if(isSolarBeam(move)&&['rain','sand','hail'].includes(kind))factor*=.5;
 // Use the attacker's native live types, not pre-evolution/metadata or the
 // defender types. A species benefits only from its own matching weather.
 if(Array.isArray(attackerTypes)&&attackerTypes.some(t=>
   WEATHER_AFFINITY_TYPES[kind]?.includes(t)))factor*=WEATHER_AFFINITY_BONUS;
 return factor;
}
export function weatherRecoveryFraction(state){return state?.kind==='sun'?2/3:!state||state.kind==='none'?1/2:1/4;}
const moveKey=name=>String(name||'').normalize('NFKD')
 .replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/[\s_-]+/g,' ');
const isThunder=name=>['thunder','trueno'].includes(moveKey(name));
const isSolarBeam=name=>['solar beam','solarbeam','rayo solar'].includes(moveKey(name));
export function weatherAccuracy(state,move,base){
 // Blizzard gains guaranteed accuracy only in later generations, not FRLG.
 return isThunder(move)?(state?.kind==='rain'?100:state?.kind==='sun'?50:base):base;
}
// The original Arena collision still decides whether the attack reaches a
// target. This Gen III weather roll affects only a landed Thunder in sunlight.
// In rain there is NO additional RNG; physical aim and shields remain intact.
export function weatherThunderMiss(state,move,random=Math.random){
 if(state?.kind!=='sun'||!isThunder(move))return false;
 return Number(random())>=0.5;
}
export function weatherResidualImmune(kind,types=[]){
 return kind==='sand'?types.some(t=>['ROCK','GROUND','STEEL'].includes(t)):kind==='hail'?types.includes('ICE'):true;
}
export function tickWeather(state,dt,actors=[]){
 if(state.kind==='none'||!Number.isFinite(dt)||dt<=0)return [];
 const step=Math.min(dt,state.remaining);state.remaining=Math.max(0,state.remaining-step);state.elapsed+=step;
 const fainted=[];
 while(state.elapsed+1e-9>=WEATHER_WINDOW){
  state.elapsed=Math.max(0,state.elapsed-WEATHER_WINDOW);
  for(const actor of actors){
   if(!actor||actor.ko||actor.hp<=0||weatherResidualImmune(state.kind,actor.tipos))continue;
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
 if(!actor.escena?.datos?.torre2)return;
 const kind=WEATHER_MOVES[move?.nombre];
 if(kind)setWeather(actor.escena.__torre2Weather??=createWeather(),kind);
}
