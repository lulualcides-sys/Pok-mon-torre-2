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
export function weatherDamageMultiplier(state,type,move=''){
 const kind=state?.kind||'none';let factor=1;
 if(kind==='sun')factor=type==='FIRE'?1.5:type==='WATER'?.5:1;
 if(kind==='rain')factor=type==='WATER'?1.5:type==='FIRE'?.5:1;
 if(isSolarBeam(move)&&['rain','sand','hail'].includes(kind))factor*=.5;
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
 if(state.remaining<=0)setWeather(state,'none');
 return fainted;
}
export function weatherFromMove(actor,move){
 if(!actor.escena?.datos?.torre2)return;
 const kind=WEATHER_MOVES[move?.nombre];
 if(kind)setWeather(actor.escena.__torre2Weather??=createWeather(),kind);
}
