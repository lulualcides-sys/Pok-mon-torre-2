/* Pokémon Torre 2 — premium pixel buttons EXCLUSIVELY for noncombat Phaser
 * menus (selection/preparation). No replacement of ui.js, hud.js, tactil.js
 * or any battle scene. Returns the exact public native button API so menu
 * transitions, selection, hitboxes, keyboard and controller callbacks survive.
 */
import {MOVIL,texto} from '../config.js';
import {marco,efectosBoton,vidaBoton,UI} from '../ui.js';

const whole=n=>Math.round(Number(n)||0);
export function pixelMenuButton(scene,x,y,label,onPress,{
 altoZona=14,anchoExtra=0,ancho=0
}={}){
 if(typeof onPress!=='function')throw TypeError('Menu button needs callback');
 const mobile=Boolean(MOVIL.activo);
 // Preserve original menu row spacing: oversizing a zone would overlap
 // adjacent level/arena options in landscape mobile selection.
 if(mobile){altoZona=Math.max(altoZona,20);anchoExtra=Math.max(anchoExtra,8)}
 const g=scene.add.graphics();
 const t=texto(scene,x,y+4,label,{tam:8}).setOrigin(.5).setDepth(1);
 let enabled=false,visible=true,dimmed=false;
 const dimensions=()=>{
  const w=Math.max(ancho,whole(t.width)+(mobile?20:12),24);
  return{w,bx:whole(x-w/2),by:whole(y-(mobile?6:3)),h:mobile?20:14};
 };
 const draw=()=>{
  g.clear();
  // Preserve the native Poké Arena button contract: its pregame scenes
  // may dim controls without hiding their positions or input layout.
  g.setAlpha(dimmed?.45:1);
  t.setAlpha(dimmed?.45:1);
  if(!visible)return;
  const {w,bx,by,h}=dimensions();
  const gold=enabled;
  marco(g,bx,by,w,h,gold?'oro':'azul');
  // Sharp four-corner Game Boy Advance-style facets, no blur, gradients or
  // giant zoom. These pixels are decorative, never separate click surfaces.
  const corner=gold?0xfff3ad:0x91dbff;
  const shadow=gold?0x84571b:0x071a32;
  const accent=gold?0xd29e37:0x47a2d5;
  g.fillStyle(corner,1);
  g.fillRect(bx+4,by+3,3,2);
  g.fillRect(bx+w-7,by+3,3,2);
  g.fillStyle(shadow,1);
  g.fillRect(bx+4,by+h-5,Math.max(1,w-8),2);
  g.fillRect(bx+w-5,by+6,1,Math.max(1,h-12));
  g.fillStyle(accent,.9);
  g.fillRect(bx+5,by+5,2,Math.max(1,h-11));
  g.fillRect(bx+w-7,by+5,2,Math.max(1,h-11));
  efectosBoton(g,light,bx,by,w,h,scene.time.now);
  t.setColor(gold?UI.textoOscuro:light.encima?UI.amarillo:UI.texto);
  t.setStroke(UI.bordeTexto,gold?0:2);
 };
 const light=vidaBoton(scene,g,draw);
 const hitWidth=()=>Math.max(ancho,t.width+12)+anchoExtra;
 const zone=scene.add.zone(x,y+4,hitWidth(),altoZona)
  .setInteractive({useHandCursor:true})
  .on('pointerover',()=>{if(visible){light.entrar(true);draw()}})
  .on('pointerout',()=>{light.entrar(false);draw()})
  .on('pointerdown',()=>{if(visible){light.pulsar();draw();onPress()}});
 const measure=()=>{
  const w=hitWidth();zone.setSize(w,altoZona);
  if(zone.input?.hitArea)zone.input.hitArea.setSize(w,altoZona);
  draw();
 };
 t.alRepintar=measure;
 draw();
 zone.setData('torre2-ui-theme','premium-noncombat');
 return{
  zona:zone,
  activar(value){enabled=Boolean(value);draw();return this},
  apagar(value){dimmed=Boolean(value);draw();return this},
  texto(value){t.setText(value);measure();return this},
  mostrar(value){visible=Boolean(value);t.setVisible(visible);zone.input.enabled=visible;draw();return this},
  mover(nx,ny){x=nx;y=ny;t.setPosition(x,y+4);zone.setPosition(x,y+4);draw();return this},
  // ui.js filaTrasEtiqueta calls b.ancho() to lay out arena/CPU rows.
  // The new visual wrapper must expose this ORIGINAL method or selection
  // crashes before Phaser activates the scene (and Pages cannot deploy).
  ancho(){return dimensions().w},
  capa(depth){g.setDepth(depth);t.setDepth(depth+1);zone.setDepth(depth+1);return this},
  destruir(){light.quitar();g.destroy();t.destroy();zone.destroy()}
 };
}
