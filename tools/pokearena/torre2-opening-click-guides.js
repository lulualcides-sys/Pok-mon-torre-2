/* T91 — original Kanto opening: clearly labeled navigation and door cues.
 * Drawn on Phaser layer BELOW existing interactive hit zones.
 * No invented route, no ground movement, no save changes or fake door.
 */
import {firstApprovedDestination} from './torre2-approved-map-first-scenes.js';
const guide=(caption,dx,dy,kind='route')=>Object.freeze({caption,dx,dy,kind});
export const OPENING_CLICK_GUIDES=Object.freeze({
 'pallet-town':Object.freeze({
  route1:guide('▲ ROTA 1',0,.057),
  center:guide('PC',0,-.052,'door')
 }),
 'route-1':Object.freeze({
  viridian:guide('▲ VIRIDIAN',0,.058),
  pallet:guide('▼ PALLET',0,-.048)
 }),
 'viridian-city':Object.freeze({
  forest:guide('▲ FLORESTA',0,.063),
  route1:guide('▼ ROTA 1',0,-.051),
  center:guide('PC',0,-.062,'door'),
  mart:guide('LOJA',0,-.060,'door')
 }),
 'viridian-forest':Object.freeze({
  route2:guide('▲ ROTA 2',0,.067),
  viridian:guide('▼ VIRIDIAN',0,-.055)
 }),
 'route-2':Object.freeze({
  pewter:guide('▲ PEWTER',0,.067),
  forest:guide('▼ FLORESTA',0,-.062)
 }),
 'pewter-city':Object.freeze({
  route2:guide('▼ ROTA 2',0,-.055),
  gym:guide('GINÁSIO',0,-.073,'door'),
  center:guide('PC',0,-.071,'door'),
  mart:guide('LOJA',0,-.071,'door'),
  route3:guide('▶ ROTA 3',-.044,0)
 })
});
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export function openingClickGuidePlan(mapId,hotspots,canTravel=()=>false){
 const spec=OPENING_CLICK_GUIDES[mapId];
 if(!spec||!Array.isArray(hotspots))return [];
 const result=[];
 for(const h of hotspots){
  const g=spec[h.id];
  if(!g||h.validated!=='visual')continue;
  const destination=firstApprovedDestination(mapId,h.id);
  if(destination&&canTravel(mapId,destination)!==true)continue;
  result.push(Object.freeze({
   id:h.id,caption:g.caption,kind:g.kind,
   cx:clamp(h.cx+g.dx,.05,.95),cy:clamp(h.cy+g.dy,.045,.955),
   target:destination||null
  }));
 }
 return result;
}
export function renderOpeningClickGuides(scene,entry,hotspots,rect,canTravel){
 const plan=openingClickGuidePlan(entry.id,hotspots,canTravel),objects=[];
 for(const item of plan){
  const x=rect.x+item.cx*rect.width,y=rect.y+item.cy*rect.height;
  const label=scene.add.text(x,y,item.caption,{
   fontFamily:'Pixelify Sans,monospace',
   fontSize:item.kind==='door'?'9px':'10px',
   fontStyle:'bold',color:item.kind==='door'?'#e6fff4':'#ffed94',
   stroke:'#071625',strokeThickness:3,align:'center',
   backgroundColor:'#08283a',padding:{x:4,y:2}
  }).setOrigin(.5).setDepth(33).setAlpha(.90)
   .setData('torre2-opening-click-guide',entry.id+':'+item.id);
  objects.push(label);
 }
 return objects;
}
