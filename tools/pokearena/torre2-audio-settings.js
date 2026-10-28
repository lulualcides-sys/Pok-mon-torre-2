/* T28: lightweight, original menu sound and safe, persistent sound options.
 * New cues are original Web Audio oscillators, not unlicensed music/assets.
 * No combat move, sprite, approved VFX or upstream Arena controller is patched.
 */
export const AUDIO_SETTINGS_KEY='torre2-audio-prefs-v1';
export const DEFAULT_AUDIO_SETTINGS=Object.freeze({
 master:0.70,effects:0.60,music:0.50,muted:false
});
const ranges=Object.freeze(['master','effects','music']);
const level=v=>Math.max(0,Math.min(1,Math.round(Number(v)*100)/100));
export function normalizeAudioSettings(value){
 const source=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
 const out={...DEFAULT_AUDIO_SETTINGS};
 for(const key of ranges){
  const n=source[key];
  if(typeof n==='number'&&Number.isFinite(n))out[key]=level(n);
 }
 if(typeof source.muted==='boolean')out.muted=source.muted;
 return out;
}
export function readAudioSettings(storage=globalThis.localStorage){
 try{
  const raw=storage?.getItem?.(AUDIO_SETTINGS_KEY);
  return normalizeAudioSettings(raw?JSON.parse(raw):null);
 }catch{return {...DEFAULT_AUDIO_SETTINGS}}
}
export function saveAudioSettings(settings,storage=globalThis.localStorage){
 const safe=normalizeAudioSettings(settings);
 try{
  storage?.setItem?.(AUDIO_SETTINGS_KEY,JSON.stringify(safe));
  return true;
 }catch{return false}
}
// The upstream Phaser client has a single global sound bus. Apply global
// master/mute, but don't pretend it supports independent music/SFX mixing.
// Our own menu cues use master*effects. The music setting is retained for
// the future licensed soundtrack and never enables an unlicensed track.
export function applyAudioSettingsToGame(scene,settings){
 const prefs=normalizeAudioSettings(settings);
 // The imported Poké Arena version exposes the engine sound bus both
 // on the Scene and on Game, but they need not be the same manager. Update
 // each distinct bus: a scene-local volume must not bypass the global mute.
 const buses=new Set([scene?.sound,scene?.game?.sound].filter(Boolean));
 for(const bus of buses){
  // Apply volume before mute: the final operation is always the user's
  // explicit mute choice, including on clients that reset audio while
  // updating the master volume node.
  try{if(typeof bus.setVolume==='function')bus.setVolume(prefs.master)}catch{}
  try{bus.volume=prefs.master}catch{}
  try{if(typeof bus.setMute==='function')bus.setMute(prefs.muted)}catch{}
  try{bus.mute=prefs.muted}catch{}
 }
 return prefs;
}
let audioContext;
export function playOriginalMenuCue(scene,storage=globalThis.localStorage){
 const prefs=readAudioSettings(storage);
 if(prefs.muted||prefs.master<=0||prefs.effects<=0)return false;
 const Context=globalThis.AudioContext||globalThis.webkitAudioContext;
 if(typeof Context!=='function')return false;
 try{
  audioContext??=new Context();
  if(audioContext.state==='closed')audioContext=new Context();
  if(audioContext.state==='suspended')audioContext.resume?.().catch?.(()=>{});
  const now=audioContext.currentTime,
   osc=audioContext.createOscillator(),gain=audioContext.createGain();
  // Two short frequencies form an original 8-bit UI acknowledgement,
  // not music playback or a protected sound from the Poké franchise.
  osc.type='square';
  osc.frequency.setValueAtTime(392,now);
  osc.frequency.setValueAtTime(494,now+.035);
  gain.gain.setValueAtTime(0,now);
  gain.gain.linearRampToValueAtTime(.028*prefs.master*prefs.effects,now+.006);
  gain.gain.exponentialRampToValueAtTime(.0001,now+.085);
  osc.connect(gain);gain.connect(audioContext.destination);
  osc.onended=()=>{try{osc.disconnect();gain.disconnect()}catch{}};
  osc.start(now);osc.stop(now+.09);
  return true;
 }catch{return false}
}
const UI_FONT='Pixelify Sans,monospace';
export function installCampaignAudioSettings(scene,storage=globalThis.localStorage){
 if(!scene?.add?.zone||!scene?.add?.graphics||!scene?.add?.text)return null;
 scene.__torre2AudioSettings?.dispose?.();
 let prefs=applyAudioSettingsToGame(scene,readAudioSettings(storage));
 const g=scene.add.graphics().setDepth(76);
 const label=scene.add.text(203,335,'ÁUDIO',{fontFamily:UI_FONT,fontSize:'11px',
  color:'#fff5d4',stroke:'#0a1625',strokeThickness:2}).setOrigin(.5).setDepth(77);
 const zone=scene.add.zone(203,335,72,29).setDepth(78)
  .setInteractive({useHandCursor:true}).setData('torre2-audio-open',true);
 const drawTab=()=>{
  g.clear();g.fillStyle(0x081c30,.97);g.fillRoundedRect(167,320,72,29,4);
  g.lineStyle(1,prefs.muted?0x848e9b:0x78b9dd);
  g.strokeRoundedRect(167,320,72,29,4);
  label.setText(prefs.muted?'SOM OFF':'ÁUDIO');
 };
 let overlay=null;
 function close(){
  if(!overlay)return;
  const v=overlay;overlay=null;
  for(const o of v)if(o.active)o.destroy();
 }
 function open(){
  if(overlay)return;
  playOriginalMenuCue(scene,storage);
  const objects=[];
  const register=o=>(objects.push(o),o);
  const shade=register(scene.add.graphics().setDepth(850));
  shade.fillStyle(0x04111e,.96);shade.fillRect(0,0,640,360);
  shade.fillStyle(0x17324b,.98);shade.fillRoundedRect(72,39,496,282,8);
  shade.lineStyle(2,0xffd17c);shade.strokeRoundedRect(72,39,496,282,8);
  register(scene.add.zone(320,180,640,360).setDepth(851).setInteractive());
  const text=(x,y,s,size=13,color='#edf5ff')=>
   register(scene.add.text(x,y,s,{fontFamily:UI_FONT,fontSize:size+'px',
    fontStyle:'bold',color,stroke:'#081423',strokeThickness:2})
    .setOrigin(.5).setDepth(855));
  const header=text(320,69,'CONFIGURAÇÕES DE ÁUDIO',19,'#ffe0a1');
  header.setData('torre2-audio-title',true);
  const note=text(320,92,'SONS DE MENU ORIGINAIS · MÚSICA LICENCIADA PENDENTE',
   10,'#a6d2ed');
  note.setData('torre2-audio-note',true);
  const button=(x,y,w,h,label,action,id)=>{
   const rect=register(scene.add.graphics().setDepth(858));
   rect.fillStyle(0x24587a);rect.fillRoundedRect(x-w/2,y-h/2,w,h,4);
   rect.lineStyle(1,0x8fd2ef);rect.strokeRoundedRect(x-w/2,y-h/2,w,h,4);
   text(x,y,label,12,'#ffffff').setDepth(859);
   const input=register(scene.add.zone(x,y,w,Math.max(29,h)).setDepth(862)
    .setInteractive({useHandCursor:true}));
   if(id)input.setData(id,true);
   input.on('pointerdown',(_p,_x,_y,event)=>{
    event?.stopPropagation?.();
    action();
   });
   return input;
  };
  function set(part,newValue){
   const update={...prefs,[part]:part==='muted'?Boolean(newValue):level(newValue)};
   saveAudioSettings(update,storage);
   prefs=applyAudioSettingsToGame(scene,update);
   const percent=p=>Math.round(prefs[p]*100)+'%';
   meters.master.setText(percent('master'));
   meters.effects.setText(percent('effects'));
   meters.music.setText(percent('music'));
   muteLabel.setText(prefs.muted?'LIGAR SOM':'SILENCIAR');
   drawTab();
  }
  const meters={};
  for(const [part,name,y] of [
   ['master','VOLUME GERAL',132],
   ['effects','EFEITOS / MENU',178],
   ['music','MÚSICA (FUTURA)',224]]){
   text(200,y,name,13,'#f5efd0');
   meters[part]=text(458,y,'',15,'#ffffff');
   button(390,y,33,28,'−',()=>{
    set(part,prefs[part]-.1);playOriginalMenuCue(scene,storage);
   },'torre2-audio-'+part+'-minus');
   button(530,y,33,28,'+',()=>{
    set(part,prefs[part]+.1);playOriginalMenuCue(scene,storage);
   },'torre2-audio-'+part+'-plus');
  }
  const muteLabel=text(200,282,'',13,'#fff1c6').setDepth(860);
  button(200,282,189,33,'',()=>{
   set('muted',!prefs.muted);playOriginalMenuCue(scene,storage);
  },'torre2-audio-toggle-mute');
  button(448,282,175,33,'VOLTAR',()=>{
   playOriginalMenuCue(scene,storage);close();
  },'torre2-audio-close');
  for(const part of ranges)meters[part].setText(Math.round(prefs[part]*100)+'%');
  muteLabel.setText(prefs.muted?'LIGAR SOM':'SILENCIAR');
  overlay=objects;
 }
 zone.on('pointerdown',(_p,_x,_y,event)=>{event?.stopPropagation?.();open()});
 drawTab();
 const dispose=()=>{close();if(zone.active)zone.destroy();if(g.active)g.destroy();
  if(label.active)label.destroy();scene.events?.off('shutdown',dispose);
  scene.events?.off('destroy',dispose);
  if(scene.__torre2AudioSettings?.button===zone)scene.__torre2AudioSettings=null;};
 scene.events?.once('shutdown',dispose);
 scene.events?.once('destroy',dispose);
 const controller={open,close,get settings(){return {...prefs}},get active(){return !!overlay},
  button:zone,dispose};
 scene.__torre2AudioSettings=controller;
 return controller;
}
