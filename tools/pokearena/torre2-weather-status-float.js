/* Solo Kanto — weather affinity feedback using the SAME damage rule.
 * Cosmetics only. No save writes, AI decisions, VFX overwrites or damage edits.
 */
import {weatherSpeciesMultiplier,WEATHER_NAMES} from './weather.js';
export const WEATHER_STATUS_FLOAT_MS=1120;
export const WEATHER_STATUS_COLORS=Object.freeze({
 bonus:'#9df5ba',penalty:'#ff9b80'
});
export function weatherStatusDescriptor(weather,types=[]){
 const multiplier=weatherSpeciesMultiplier(weather,types);
 if(multiplier===1)return null;
 const bonus=multiplier>1;
 return {kind:bonus?'bonus':'penalty',
  text:'ATK '+(bonus?'+20%':'-20%'),
  climate:WEATHER_NAMES[weather.kind],
  color:WEATHER_STATUS_COLORS[bonus?'bonus':'penalty']};
}
export function installWeatherStatusFloat(scene,weather,actors,party){
 const shown=['',''],labels=[null,null];
 let disposed=false;
 const debug={shown:[],active:labels,disposed:false};
 scene.__torre2WeatherStatus=debug;
 const current=side=>side===0?party.friend[party.playerIndex]:party.foes[party.enemyIndex];
 function remove(side){
  if(labels[side]?.active)labels[side].destroy();
  labels[side]=null;
 }
 function float(side,info,member){
  const actor=actors[side];
  remove(side);
  if(!actor||!info)return;
  const sx=Math.min(556,Math.max(84,Math.round((Number(actor.x)||320)+(side===0?65:-65))));
  const sy=Math.min(315,Math.max(93,Math.round((Number(actor.y)||170)-
   (Number(actor.alto)||36)*.48-9)));
  const tag=scene.add.text(sx,sy,info.text,{
   fontFamily:'Pixelify Sans,monospace',fontSize:'13px',fontStyle:'bold',
   color:info.color,stroke:'#091728',strokeThickness:4,align:'center'
  }).setOrigin(.5).setDepth(2778).setAlpha(1).setScale(.93);
  tag.setData('torre2-weather-status',side);
  tag.setData('torre2-weather-status-kind',info.kind);
  labels[side]=tag;
  debug.shown.push({side,species:member.id,revision:weather.revision,
   kind:info.kind,text:info.text,climate:info.climate});
  scene.tweens.add({targets:tag,y:sy-19,alpha:0,scale:1.05,
   duration:WEATHER_STATUS_FLOAT_MS,ease:'Cubic.Out',
   onComplete:()=>{if(labels[side]===tag)labels[side]=null;if(tag.active)tag.destroy();}});
 }
 function refresh(side){
  if(disposed||!scene.scene.isActive()||scene.fase!=='lucha'||
    scene.__torre2Changing||scene.__torre2BallTransitions||
    !actors?.[side]||actors[side].ko||actors[side].hp<=0||
    !actors[side].spr?.visible)return;
  const member=current(side);
  if(!member)return;
  const info=weatherStatusDescriptor(weather,actors[side].tipos||[]);
  const key=String(weather.revision)+'|'+String(member.uid||member.id)+'|'+
   String(side===0?party.playerIndex:party.enemyIndex)+'|'+(info?.kind||'neutral');
  if(shown[side]===key)return;
  shown[side]=key;
  remove(side);
  if(info)float(side,info,member);
 }
 function update(){
  refresh(0);refresh(1);
 }
 function dispose(){
  if(disposed)return;
  disposed=true;debug.disposed=true;
  scene.events.off('update',update);
  scene.events.off('shutdown',dispose);
  scene.events.off('destroy',dispose);
  remove(0);remove(1);
  if(scene.__torre2WeatherStatus===debug)scene.__torre2WeatherStatus=null;
 }
 scene.events.on('update',update);
 scene.events.once('shutdown',dispose);
 scene.events.once('destroy',dispose);
 return {refresh,dispose,debug};
}
