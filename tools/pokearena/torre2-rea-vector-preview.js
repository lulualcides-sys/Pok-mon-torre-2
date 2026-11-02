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
 const g=scene.add.graphics().setDepth(6500).setVisible(false);
 const label=scene.add.text(38,117,'',{fontFamily:'Pixelify Sans,monospace',
  fontSize:'11px',fontStyle:'bold',color:'#fff2d8',
  stroke:'#071727',strokeThickness:2}).setDepth(6501).setVisible(false);
 const detail=scene.add.text(38,256,'',{fontFamily:'Pixelify Sans,monospace',
  fontSize:'9px',color:'#c5deed',stroke:'#071727',strokeThickness:1})
  .setDepth(6501).setVisible(false);
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
  // Original layered pixel-art test room, covering high-depth battle UI.
  // Never draw over the LAB top controls at logical y=77.
  pixel(g,16,105,608,173,0x020d1b,1);
  pixel(g,19,108,602,167,0x0a2131,1);
  pixel(g,23,111,594,24,0x17374a,1);
  pixel(g,23,135,594,64,0x0c2836,1);
  pixel(g,23,160,594,39,0x123444,1);
  pixel(g,23,184,594,15,0x163b48,1);
  pixel(g,23,199,594,29,0x1c454c,1);
  pixel(g,23,228,594,19,0x294d50,1);
  pixel(g,23,247,594,27,0x071928,1);
  // Hand-authored stepped bezel and amber/sea-glass corners.
  pixel(g,19,108,602,3,0xbfd8ba,1);
  pixel(g,19,272,602,3,0xbfd8ba,1);
  pixel(g,19,111,3,161,0x7eaeab,1);
  pixel(g,618,111,3,161,0x7eaeab,1);
  for(const x of [20,610])for(const y of [110,265]){
   pixel(g,x,y,9,3,0xffd17a,1);pixel(g,x,y,3,10,0xffd17a,1);
  }
  pixel(g,23,136,594,2,0x356875,1);
  pixel(g,23,245,594,2,0x64847e,1);
  // Mountains in the far distance: procedural placement is deterministic,
  // pixel-aligned and original; no reference-game background assets.
  for(let i=0;i<16;i++){
   const x=23+i*38,h=9+(i*17%13);
   pixel(g,x,198-h,36,h,0x1d4347,1);
   pixel(g,x+6,195-h,20,3,0x31575a,.92);
  }
  // Irregular stone slabs, sparse grass and tiny glowing laboratory marks.
  for(let i=0;i<34;i++){
   const x=31+i*17,y=230+(i*11%11);
   pixel(g,x,y,11,2,i%3?0x40655d:0x6a7363,.88);
   if(i%4===0){pixel(g,x+4,225,2,3,0x94b774,.9);pixel(g,x+7,227,2,2,0x6b936c,.9);}
  }
  for(let x=38;x<609;x+=24)
   pixel(g,x,148+(x*7%13),2,2,0x85c9b7,.22);
  // Original practice dummy: shield, metallic pedestal and glowing center.
  pixel(g,TGT.x-18,TGT.y+13,36,5,0x071622,1);
  pixel(g,TGT.x-13,TGT.y+8,26,7,0x3b5656,1);
  pixel(g,TGT.x-3,TGT.y-17,6,29,0x3c6162,1);
  pixel(g,TGT.x-15,TGT.y-12,30,26,0x071927,1);
  pixel(g,TGT.x-12,TGT.y-9,24,20,0x7b9c9c,1);
  pixel(g,TGT.x-9,TGT.y-6,18,14,0x203d4c,1);
  pixel(g,TGT.x-6,TGT.y-4,12,10,flash?0xffffff:0x6bdac7,1);
  pixel(g,TGT.x-3,TGT.y-1,6,4,flash?palette[3]:0xe8f9c8,1);
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
  label.setText('LAB VETORIAL / '+view+'  '+(flash?'• IMPACTO':''));
  const ord=Math.round(ref.hitOrdinal*100);
  detail.setText('REA: '+ref.medianFrames+' QUADROS | HIT '+ord+
    '% DA SEQUENCIA | TEMPO NAO MEDIDO | SEM DANO');
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
