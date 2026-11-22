/* Pokémon Torre 2 — battle speed 1x / 1.5x / 2x (owner 2026-11-22, item 21).
 * Campaign battles only. The WHOLE combat scene clock is scaled (Phaser
 * Systems.step delta): movement, cooldowns, projectiles, tweens, timers and
 * VFX all speed up together, so hits and animations stay in sync. Nothing
 * about damage, moves or VFX data changes. Remembered per device.
 */
export const SPEEDS=Object.freeze([1,1.5,2]);
export const SPEED_KEY='torre2-battle-speed';
export function readSpeed(storage=globalThis.localStorage){
 try{const v=Number(storage?.getItem(SPEED_KEY));return SPEEDS.includes(v)?v:1}catch{return 1}
}
export function saveSpeed(v,storage=globalThis.localStorage){try{storage?.setItem(SPEED_KEY,String(SPEEDS.includes(v)?v:1))}catch{}}
export function nextSpeed(v){const i=SPEEDS.indexOf(v);return SPEEDS[(i+1)%SPEEDS.length]}
export const speedLabel=v=>(v===1.5?'1,5':String(v))+'x';
// Scales a frame delta, clamped so a slow device never jumps too far.
export function scaledDelta(delta,speed){const d=Math.max(0,Math.min(100,Number(delta)||0));return d*(SPEEDS.includes(speed)?speed:1)}
export function installBattleSpeed(scene){
 if(!scene?.datos?.torre2?.party||scene.__torre2Speed)return null;
 const state={speed:readSpeed()};
 const sys=scene.sys,nativeStep=sys.step;
 sys.step=function(time,delta){return nativeStep.call(this,time,scaledDelta(delta,state.speed))};
 const bg=scene.add.rectangle(579,174,56,22,0x161f2d,.92).setStrokeStyle(1,0x9eacbe,.95).setDepth(9850);
 const text=scene.add.text(579,174,'',{fontFamily:'monospace',fontSize:'10px',fontStyle:'bold',color:'#dce5ef',stroke:'#111827',strokeThickness:2})
  .setOrigin(.5).setDepth(9852).setData('torre2-battle-speed',true);
 const hot=scene.add.zone(579,174,66,26).setDepth(9853).setInteractive({useHandCursor:true});
 const refresh=()=>{text.setText('VEL '+speedLabel(state.speed));bg.setFillStyle(state.speed>1?0x4b3a16:0x161f2d,.94).setStrokeStyle(1,state.speed>1?0xf4c95a:0x9eacbe,.95)};
 refresh();
 hot.on('pointerdown',(_p,_x,_y,e)=>{e?.stopPropagation?.();if(scene.fase==='fin')return;state.speed=nextSpeed(state.speed);saveSpeed(state.speed);refresh()});
 scene.__torre2Speed=state;
 scene.events.once('shutdown',()=>{sys.step=nativeStep;scene.__torre2Speed=null;bg.destroy();text.destroy();hot.destroy()});
 return state;
}
