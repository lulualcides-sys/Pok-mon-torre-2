// Preserve the native Phaser medir()/ajustar() algorithm. The upstream 0.70
// already listens to resize, but a second animation-frame pass is needed when
// Chrome delivers a viewport event before Phaser's new backing frame settles.
// Only the local offline build receives this guard; no CSS/zoom overrides.
export function installNativeResizeFrameGuard(source){
 if(typeof source!=='string')throw Error('Missing native main.js');
 if(source.includes('__torre2ResizeFrame'))throw Error('Native resize guard already applied');
 const from='addEventListener("resize",ajustar);alCambiarGraficos(ajustar);';
 if(source.split(from).length!==2||!source.includes('const ajustar=()=>{'))
  throw Error('Unrecognized original Phaser viewport resize handler');
 const to='addEventListener("resize",ajustar);'+
  'let __torre2ResizeFrame=false;'+
  'const __torre2ResizeNext=()=>{if(__torre2ResizeFrame)return;'+
  '__torre2ResizeFrame=true;requestAnimationFrame(()=>{__torre2ResizeFrame=false;ajustar()})};'+
  'addEventListener("resize",__torre2ResizeNext);'+
  'visualViewport?.addEventListener("resize",__torre2ResizeNext);'+
  'alCambiarGraficos(ajustar);';
 return source.replace(from,to);
}
