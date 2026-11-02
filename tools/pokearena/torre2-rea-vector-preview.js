/* Optional visual experiment for the LABORATORY scene only.
 * Does not call attack, cast, damage, inventory or save functions.
 * Everything is original Phaser pixel-cell graphics; no PB Ranked assets.
 */
import {REA_FRAME_REFERENCES,movePrototypePoint,sweptVectorHit,u01} from './rea-vector-math.js';
const MODES=Object.freeze(['beam','dash','arc']);
const PALETTES=Object.freeze({
 beam:[0x17464e,0x3db59b,0xa7ffe4,0xffffff],
 dash:[0x364663,0x68a9ed,0xc9e7ff,0xffffff],
 arc:[0x633b55,0xe382a0,0xffdbd1,0xffffff]
});
const TGT=Object.freeze({x:462,y:202});
function pixel(g,x,y,w,h,color,alpha=1){
 g.fillStyle(color,alpha).fillRect(Math.round(x),Math.round(y),
  Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));
}
function drawGlyph(g,x,y,palette,phase){
 // Stepped pixel shapes; not a copied move or an approved effect replacement.
 const extent=phase==='dash'?8:phase==='arc'?5:11;
 for(let i=0;i<5;i++){
  pixel(g,x-i*(phase==='arc'?1:3)-extent/2,y+((i%2)*3)-4,
   phase==='dash'?9:4,phase==='dash'?3:5,
   palette[Math.min(3,Math.floor(i/2))],1-i*.11);
 }
 pixel(g,x-3,y-3,7,7,palette[3]);
}
export function createReaVectorPreview(scene){
 if(!scene?.datos?.torre2?.laboratory)throw new Error('REA preview requires laboratory');
 if(!scene.add?.graphics||!scene.add?.text||!scene.events?.on)throw new Error('Phaser scene missing');
 const g=scene.add.graphics().setDepth(2804).setVisible(false);
 const label=scene.add.text(32,113,'',{fontFamily:'Pixelify Sans,monospace',
  fontSize:'11px',fontStyle:'bold',color:'#fff2d8',
  stroke:'#071727',strokeThickness:2}).setDepth(2805).setVisible(false);
 const detail=scene.add.text(32,258,'',{fontFamily:'Pixelify Sans,monospace',
  fontSize:'9px',color:'#c5deed',stroke:'#071727',strokeThickness:1})
  .setDepth(2805).setVisible(false);
 let active=false,destroyed=false,clock=0,mode=null,previous=null,impactTick=-Infinity,hitCount=0;
 const debug={active:false,mode:null,hitCount:0,lastHitPosition:null,
  isolation:'LAB_VISUAL_ONLY',containsThirdPartyAssets:false,doesNotChangeDamage:true};
 scene.__torre2ReaMathPreview=debug;
 const render=(deltaMs=16.667)=>{
  if(!active||destroyed)return;
  const step=Math.max(0,Math.min(64,Number(deltaMs)||16.667));
  clock+=step;const index=Math.floor(clock/1800)%MODES.length;
  const current=MODES[index],local=clock%1800,ratio=local/1800;
  if(mode!==current){mode=current;previous=null;impactTick=-Infinity;}
  const point=movePrototypePoint(mode,ratio),palette=PALETTES[mode];
  let collided=false;
  if(previous){
   const hit=sweptVectorHit(previous,point,7,TGT,TGT,12);
   collided=hit.hit;
   if(collided&&impactTick<0){
    impactTick=clock;hitCount++;
    debug.lastHitPosition={x:Math.round(previous.x+(point.x-previous.x)*hit.firstFraction),
     y:Math.round(previous.y+(point.y-previous.y)*hit.firstFraction)};
   }
  }
  previous=point;debug.mode=mode;debug.hitCount=hitCount;
  const flash=clock-impactTick<225,view=['PROJETIL CURVO','ESQUIVA / DASH','ARCO DE POKEBOLA'][index];
  const ref=[REA_FRAME_REFERENCES.Shoot,REA_FRAME_REFERENCES.Swing,REA_FRAME_REFERENCES.Attack][index];
  g.clear();
  pixel(g,16,105,608,170,0x061625,.96);
  pixel(g,18,107,604,2,0x7aaec3);
  pixel(g,18,273,604,2,0x7aaec3);
  for(let x=32;x<617;x+=22)for(let y=144;y<247;y+=22)
   pixel(g,x,y,1,1,0x407388,.28);
  // Distinct bands and floor give depth without importing background assets.
  pixel(g,38,235,560,3,0x264d58,.9);
  for(let x=43;x<590;x+=17)pixel(g,x,238,9,2,0x2e5960,.55);
  // Pixel-art reference target, only a colored dummy, never a real opponent.
  pixel(g,TGT.x-11,TGT.y-9,22,19,0x12202f);
  pixel(g,TGT.x-9,TGT.y-7,18,15,0x7b90a1);
  pixel(g,TGT.x-6,TGT.y-4,12,9,flash?0xffffff:0xa9c5d1);
  pixel(g,TGT.x-14,TGT.y+12,28,3,0x304854,.8);
  if(mode==='arc'){
   for(let n=0;n<=24;n++){
    const t=n/24,p=movePrototypePoint('arc',t);
    pixel(g,p.x,p.y,2,2,0xedb6be,.24);
   }
  }else{
   for(let n=0;n<15;n++){
    const p=movePrototypePoint(mode,n/14);
    pixel(g,p.x,p.y,2,2,palette[1],.18);
   }
  }
  drawGlyph(g,point.x,point.y,palette,mode);
  if(flash){
   const since=u01((clock-impactTick)/225),r=6+23*since;
   for(let j=0;j<8;j++){
    const a=j*Math.PI/4;
    pixel(g,TGT.x+Math.cos(a)*r,TGT.y+Math.sin(a)*r,3,3,
     j%2?palette[2]:palette[3],1-since);
   }
   pixel(g,TGT.x-3,TGT.y-3,7,7,0xffffff,1-since);
  }
  for(let i=0;i<3;i++)pixel(g,394+i*12,117,8,5,
   i===index?palette[2]:0x3c6067,i===index?1:.6);
  label.setText('REA • DEMO VETORIAL — '+view+'  '+(flash?'IMPACTO':''));
  const ord=Math.round(ref.hitOrdinal*100);
  detail.setText('REFERENCIA: '+ref.medianFrames+' QUADROS, HIT '+ord+
    '% DA ORDEM • NAO E TEMPO MEDIDO • SEM DANO');
  return {mode,point,collided};
 };
 const tick=(_time,delta)=>render(delta);
 const toggle=()=>{
  if(destroyed)return false;
  active=!active;debug.active=active;
  g.setVisible(active);label.setVisible(active);detail.setVisible(active);
  if(active){clock=0;mode=null;previous=null;impactTick=-Infinity;render(0);}
  else{g.clear();debug.mode=null;}
  return active;
 };
 const destroy=()=>{
  if(destroyed)return;destroyed=true;active=false;
  scene.events.off('update',tick);scene.events.off('shutdown',destroy);
  g.destroy();label.destroy();detail.destroy();
  if(scene.__torre2ReaMathPreview===debug)delete scene.__torre2ReaMathPreview;
 };
 scene.events.on('update',tick);
 scene.events.once('shutdown',destroy);
 return {toggle,destroy,render,debug};
}
