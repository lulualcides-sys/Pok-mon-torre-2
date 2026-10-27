/* Optional single-player AUTO button. Reuse the client's native IA rather
 * than inventing moves, bypassing cooldowns or modifying battle math.
 * OFF by default on every new match; original controls restored on exit.
 */
const OFFLINE_MODES=new Set(['cpu','entreno','arena']);
const HUMAN_TYPES=new Set(['kbm','tactil','teclado2']);
const isHuman=c=>HUMAN_TYPES.has(c?.tipo)||/^pad[0-9]+$/.test(c?.tipo||'');
export function autoBattleAllowed(scene){
 const d=scene?.datos;
 if(!d||scene.sim||scene.enLinea||scene.red||d.online||d.ranked||d.registro||
    ['online','versus','demo','replay'].includes(d.modo))return false;
 return OFFLINE_MODES.has(d.modo)||Boolean(d.torre2);
}
export function manualFighterControl(scene){
 if(!Array.isArray(scene?.controles))return null;
 return scene.controles.find(c=>isHuman(c)&&c.l&&!c.l.remoto&&typeof c.leer==='function')||null;
}
export function installAutoBattle(scene,makeNativeAI){
 if(!autoBattleAllowed(scene)||scene.__torre2AutoMode||
    typeof makeNativeAI!=='function')return null;
 // AUTO is strictly single-player. Never commandeer a local multiplayer
 // participant or let one human's toggle affect another human's fighter.
 if((scene.controles||[]).filter(isHuman).length!==1)return null;
 const original=manualFighterControl(scene);
 if(!original)return null;
 const state={enabled:false,control:original,read:original.leer,ai:makeNativeAI(original.l),
  button:null, label:null, zone:null,cleaned:false};
 if(typeof state.ai?.leer!=='function')throw Error('Native Poké Arena IA missing');
 const safeRead=function(dt,...args){
  if(!state.enabled||state.cleaned||scene.pausado||scene.fase!=='lucha')
   return state.read.call(this,dt,...args);
  // Official AI respects Pokémon move slots, readiness, HP and real energy.
  // Clone its mutable per-frame input to avoid modifying the native controller.
  const it=state.ai.leer(Math.max(.001,Number(dt)||1/60));
  return it?{...it,mega:false}:state.read.call(this,dt,...args);
 };
 original.leer=safeRead;
 scene.__torre2AutoMode=state;
 const bg=scene.add.rectangle(579,115,56,22,0x161f2d,.92)
  .setStrokeStyle(1,0x9eacbe,.95).setDepth(9850);
 const text=scene.add.text(579,115,'AUTO',{fontFamily:'monospace',fontSize:'10px',
  fontStyle:'bold',color:'#dce5ef',stroke:'#111827',strokeThickness:2})
  .setOrigin(.5).setDepth(9852);
 const hot=scene.add.zone(579,115,66,36).setDepth(9853).setInteractive({useHandCursor:true});
 state.button=bg;state.label=text;state.zone=hot;
 function refresh(){
  bg.setFillStyle(state.enabled?0x164b35:0x161f2d,.94);
  bg.setStrokeStyle(1,state.enabled?0x5af4a0:0x9eacbe,.95);
  text.setText(state.enabled?'AUTO ✓':'AUTO').setColor(state.enabled?'#baffd2':'#dce5ef');
 }
 refresh(); // Display OFF immediately, before the first pointer/keyboard event.
 hot.on('pointerdown',(_p,_x,_y,event)=>{
  event?.stopPropagation?.();
  if(state.cleaned||scene.fase==='fin'||scene.sim)return;
  state.enabled=!state.enabled;
  refresh();
 });
 const keyboard=scene.input?.keyboard;
 const hotkey=event=>{
  if(event.repeat||event.ctrlKey||event.altKey||event.metaKey)return;
  if(scene.fase==='fin'||state.cleaned)return;
  state.enabled=!state.enabled;
  refresh();
 };
 keyboard?.on('keydown-KeyB',hotkey);
 const sync=()=>{
  if(state.cleaned)return;
  const visible=scene.fase!=='fin';
  bg.setVisible(visible);text.setVisible(visible);hot.setActive(visible);
  if(!visible)state.enabled=false;
  const camera=scene.camUI??scene.cameras?.main;
  // Follow the wide-screen right gutter just like the native touch buttons.
  const width=Number(camera?.width)||640;
  const zoom=Number(camera?.zoom)||1;
  const shift=Math.max(0,(width/zoom-640));
  const px=579+shift;
  bg.setX(px);text.setX(px);hot.setX(px);
 };
 scene.events?.on('postupdate',sync);
 const destroy=()=>{
  if(state.cleaned)return;
  state.cleaned=true;state.enabled=false;
  if(original.leer===safeRead)original.leer=state.read;
  keyboard?.off('keydown-KeyB',hotkey);
  scene.events?.off('postupdate',sync);
  hot.removeAllListeners?.();
  hot.destroy();text.destroy();bg.destroy();
  if(scene.__torre2AutoMode===state)scene.__torre2AutoMode=null;
 };
 scene.events?.once('shutdown',destroy);
 scene.events?.once('destroy',destroy);
 sync();
 return state;
}
export function bindAutoBattleToScene(Scene,IA){
 if(typeof Scene?.prototype?.create!=='function'||typeof IA!=='function')
  throw Error('Original Phaser scene and Poké Arena IA required');
 if(Object.hasOwn(Scene.prototype,'__torre2AutoPatched'))return;
 const original=Scene.prototype.create;
 Scene.prototype.create=function(...args){
  const result=original.apply(this,args);
  installAutoBattle(this,fighter=>new IA(fighter,'normal'));
  return result;
 };
 Object.defineProperty(Scene.prototype,'__torre2AutoPatched',{value:true,configurable:false});
}
