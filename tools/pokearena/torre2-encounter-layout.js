/* Kanto campaign progression role order. No Phaser, saves, sprites or
 * FireRed data imports: the same pure logic runs in Node and the browser.
 */
export function gymRouteCount(stage,trainerLimit){
 if(!Number.isInteger(stage)||stage<0||stage>=8)return null;
 return Math.max(0,trainerLimit(stage)-(stage===0?3:4));
}
export function encounterRole(stage,index,max){
 if(index>=max)return 'leader';
 const original=i=>i>0&&i%9===3?'rival':i>0&&i%7===5?'rocket':'trainer';
 const boundary=gymRouteCount(stage,()=>max);
 // Move special story encounters from gym positions into ordinary route
 // positions; preserve each Rival/Rocket fight and the stage's total count.
 const specials=[];
 if(boundary!==null)for(let i=boundary;i<max;i++)
  if(original(i)!=='trainer')specials.push(i);
 const targets=[];
 if(boundary!==null)for(let i=boundary-1;i>=0&&targets.length<specials.length;i--)
  if(original(i)==='trainer')targets.unshift(i);
 let type=original(index);
 for(let i=0;i<specials.length;i++){
  if(index===specials[i])type='trainer';
  else if(index===targets[i])type=original(specials[i]);
 }
 return type;
}
