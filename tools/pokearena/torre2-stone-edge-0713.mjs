/** Patch only the existing NATIVE Stone Edge move. No new VFX and no
 * global cooldown multiplier; the arena/league/combat share this kit. */
export function setNativeStoneEdgeCooldown0713(source,alpha,seconds=3.5){
 if(alpha!=='0.71.3')return source;
 if(typeof source!=='string'||seconds!==3.5)throw Error('Unexpected Stone Edge cooldown');
 const rx=/(nombre:"Stone Edge",forma:"erupcion",estilo:"roca",tipo:"ROCK"[^}]{0,450}\bcd:)(?:1|[1-3](?:\.\d+)?)(?=,anim:"Charge")/g;
 const matches=[...source.matchAll(rx)];
 if(matches.length!==1)throw Error('Expected one source-authentic Stone Edge move, got '+matches.length);
 return source.replace(rx,(_,p)=>p+seconds);
}
