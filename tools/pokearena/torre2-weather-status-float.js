/* Solo Kanto — weather affinity feedback uses the same real damage rule.
 * Show a short 3-second status toast beside the actual fighter. The real
 * weather damage multiplier continues unchanged until climate expires.
 * Only cosmetic Phaser Text; battle hitboxes, saves and native Arena stay intact.
 */
import {weatherSpeciesMultiplier,WEATHER_NAMES} from './weather.js';
export const WEATHER_STATUS_FLOAT_MS=240;
export const WEATHER_STATUS_VISIBLE_MS=3000;
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
 const shown=['',''],labels=[null,null],shownAt=[0,0];
 let disposed=false;
 const debug={shown:[],active:labels,disposed:false};
 scene.__torre2WeatherStatus=debug;
 const current=side=>side===0?party.friend[party.playerIndex]:party.foes[party.enemyIndex];
 function remove(side){
  const tag=labels[side];
  if(tag?.active){scene.tweens.killTweensOf?.(tag);tag.destroy();}
  labels[side]=null;
 }
 function position(side){
  const actor=actors[side];
  // Keep a compact native-scale badge beside the moving Pokémon.
  // Move OUTWARD from the actor, not toward the opponent. The old +51/-51
  // offsets put both badges in the middle where they collided.
  const sx=Math.min(575,Math.max(65,Math.round((Number(actor.x)||320)+(side===0?-23:23))));
  const sy=Math.min(313,Math.max(98,Math.round((Number(actor.y)||170)-
   (Number(actor.alto)||36)*.48-12)));
  return {x:sx,y:sy};
 }
 function show(side,info,member){
  remove(side);
  if(!info)return;
  const at=position(side);
  const tag=scene.add.text(at.x,at.y,info.text,{
   fontFamily:'Pixelify Sans,monospace',fontSize:'11px',fontStyle:'bold',
   color:info.color,stroke:'#091728',strokeThickness:3,align:'center'
  }).setOrigin(.5).setDepth(2778).setAlpha(.1).setScale(.88);
  tag.setData('torre2-weather-status',side);
  tag.setData('torre2-weather-status-kind',info.kind);
  labels[side]=tag;
  shownAt[side]=scene.time?.now??0;
  debug.shown.push({side,species:member.id,revision:weather.revision,
   kind:info.kind,text:info.text,climate:info.climate});
  // Small appearance tween only. The label expires after three seconds;
  // the real 20% multiplier keeps applying until the climate ends.
  scene.tweens.add({targets:tag,alpha:1,duration:WEATHER_STATUS_FLOAT_MS,
   ease:'Cubic.Out'});
 }
 function refresh(side){
  if(disposed)return;
  const actor=actors?.[side];
  const ready=scene.scene.isActive()&&scene.fase==='lucha'&&
   !scene.__torre2Changing&&!scene.__torre2BallTransitions&&
   actor&&!actor.ko&&actor.hp>0&&actor.spr?.visible;
  if(!ready){remove(side);return;}
  const member=current(side);
  if(!member){remove(side);return;}
  const info=weatherStatusDescriptor(weather,actor.tipos||[]);
  const key=String(weather.revision)+'|'+String(member.uid||member.id)+'|'+
   String(side===0?party.playerIndex:party.enemyIndex)+'|'+(info?.kind||'neutral');
  if(shown[side]!==key){
   shown[side]=key;
   show(side,info,member);
  }
  const tag=labels[side];
  if(tag?.active){
   if((scene.time?.now??0)-shownAt[side]>=WEATHER_STATUS_VISIBLE_MS)
    remove(side);
   else{const at=position(side);tag.setPosition(at.x,at.y);}
  }
 }
 function update(){refresh(0);refresh(1);}
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
