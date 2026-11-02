/* T39 — deterministic, pre-render AABB contract for the existing Kanto
 * battle path. Geometry only: no sprites, RNG, battles, saves or new fights.
 * All coordinates are in the native 640x360 Phaser camera; mobile uses
 * the same camera geometry scaled by Phaser, never a second random layout.
 */
const ROWS=Object.freeze([
 Object.freeze([53,116,179,242,305]),
 Object.freeze([305,242,179,116,53]),
 Object.freeze([70,148,226,304])
]);
const VIEW=Object.freeze({x:14,y:58,w:470,h:250});
const FIXED_BUTTONS=Object.freeze([
 Object.freeze({x:424-107/2,y:103-24/2,w:107,h:24}),
 Object.freeze({x:424-107/2,y:131-23/2,w:107,h:23})
]);
const freezeBox=(x,y,w,h)=>Object.freeze({x,y,w,h});
export function rectsOverlap(a,b){
 return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
}
function inside(rect,view=VIEW){
 return rect.x>=view.x&&rect.y>=view.y&&
  rect.x+rect.w<=view.x+view.w&&rect.y+rect.h<=view.y+view.h;
}
function navButton(x){
 return Object.freeze({x,y:296,box:freezeBox(x-43/2,296-23/2,43,23)});
}
function assertSafe(spots,navigation){
 const controls=[...Object.values(navigation).filter(Boolean).map(n=>n.box),...FIXED_BUTTONS];
 for(let i=0;i<spots.length;i++){
  const a=spots[i];
  if(!inside(a.hitbox)||!inside(a.captureBox))
   throw Error('T39 route node outside native 640x360 viewport: '+a.global);
  for(let j=i+1;j<spots.length;j++){
   const b=spots[j];
   if(rectsOverlap(a.hitbox,b.hitbox)||
      rectsOverlap(a.captureBox,b.hitbox)||
      rectsOverlap(b.captureBox,a.hitbox))
    throw Error('T39 route nodes overlap: '+a.global+'/'+b.global);
  }
  for(const box of controls){
   if(rectsOverlap(a.hitbox,box)||rectsOverlap(a.captureBox,box))
    throw Error('T39 route node overlaps UI: '+a.global);
  }
 }
 for(const nav of Object.values(navigation).filter(Boolean)){
  if(!inside(nav.box))throw Error('T39 route navigation outside viewport');
 }
 if(navigation.previous&&navigation.next&&
    rectsOverlap(navigation.previous.box,navigation.next.box))
  throw Error('T39 pagination controls overlap');
}
/* Fail closed before creating Phaser graphics, sprites or hit zones. */
export function planBattlePathGeometry({total,offset=0,finished=false}={}){
 if(!Number.isInteger(total)||total<0||total>60)
  throw RangeError('T39 total must be an integer in 0..60');
 if(!Number.isInteger(offset)||offset<0||offset>total||offset%13!==0)
  throw RangeError('T39 offset must be a valid 13-trainer page');
 const length=finished?0:Math.min(14,Math.max(0,total+1-offset));
 const spots=[];
 for(let i=0;i<length;i++){
  const row=Math.floor(i/5),column=i%5;
  const boss=offset+i===total;
  const x=boss?414:(ROWS[Math.min(2,row)][column]??ROWS[2][3]);
  const y=boss?178:[275,211,147][Math.min(row,2)];
  const width=boss?82:60;
  spots.push(Object.freeze({
   x,y,global:offset+i,boss,
   hitbox:freezeBox(x-width/2,y-1-63/2,width,63),
   // 12px height keeps the native grass icon clickable without stealing
   // the preceding row's trainer hitbox (old 18px target overlapped 2.5px).
   captureBox:freezeBox(x-11,y-26-6,22,12)
  }));
 }
 const navigation=Object.freeze({
  previous:offset>0?navButton(371):null,
  next:!finished&&offset+length<total+1?navButton(460):null
 });
 assertSafe(spots,navigation);
 return Object.freeze({spots:Object.freeze(spots),navigation,length,offset});
}
