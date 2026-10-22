/* Deterministic checkpoints for the Kanto campaign.
 * Only the presentation changes: save indexes, Pokémon moves and trainers
 * retain the existing battle progression.
 */
export function zigzagRoutePoints(count){
 if(!Number.isInteger(count)||count<0||count>8)
  throw RangeError('Route checkpoint count must be 0–8');
 if(count===0)return [];
 if(count===1)return [{x:202,y:183}];
 const bottom=244,top=128;
 return Array.from({length:count},(_,i)=>({
  x:i%2===0?99:292,
  y:Math.round(bottom+(top-bottom)*i/(count-1))
 }));
}
