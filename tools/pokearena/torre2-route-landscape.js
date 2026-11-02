/* T37 — real FireRed landscape-first route presentation.
 * Pure geometry only: the native Phaser renderer owns sprites and clicks.
 * Preserve all stage/trainer indices, battle / rematch / captures and saves.
 */
import {getSourceMainBounds,TILE_VIEW} from './torre2-frlg-location.js';
export const ROUTE_VIEW=Object.freeze({x:14,y:58,width:470,height:248});
const clamp=(value,lo,hi)=>Math.max(lo,Math.min(hi,value));
export function nativeRouteCrop(locale,width,height){
 if(!locale||!Number.isFinite(width)||!Number.isFinite(height)||
    width<176||height<176)return null;
 const main=getSourceMainBounds(locale,width,height);
 if(main.w<176||main.h<176)return null;
 // Native map tiles are 16px: crop land rather than stretch a whole city
 // sheet or paste the tiny gym screenshot into the route scenery.
 const ratio=ROUTE_VIEW.width/ROUTE_VIEW.height;
 let w=Math.min(main.w,480);
 let h=Math.floor(w/ratio);
 if(h>main.h){h=main.h;w=Math.floor(h*ratio);}
 w=Math.min(main.w,Math.floor(w/16)*16);
 h=Math.min(main.h,Math.round(w/ratio));
 if(w<176||h<96)return null;
 const focus=TILE_VIEW[locale]||{cx:main.w/2,cy:main.h/2};
 const x=main.x+clamp(Math.floor((focus.cx-w/2)/16)*16,0,main.w-w);
 const y=main.y+clamp(Math.floor((focus.cy-h/2)/16)*16,0,main.h-h);
 return Object.freeze({x,y,w,h});
}
export function routeRailSpots(offset,length,total){
 if(!Number.isInteger(offset)||offset<0||!Number.isInteger(length)||
  length<0||length>14||!Number.isInteger(total)||total<0)
  throw new RangeError('Invalid route progress rail');
 // Compact markers below the landscape. Only the current battle actor
 // stands on the actual terrain; no 14 overlapping trainer cards.
 const step=30,mid=249.5;
 const start=mid-(Math.max(0,length-1)*step)/2;
 return Object.freeze(Array.from({length},(_,i)=>
  Object.freeze({x:Math.round(start+i*step),y:291,global:offset+i,
   boss:offset+i===total})));
}
export function routeVisualCast(current,total,finished=false){
 if(finished||current>=total)return Object.freeze({trainer:false,player:true});
 return Object.freeze({trainer:true,player:true});
}
