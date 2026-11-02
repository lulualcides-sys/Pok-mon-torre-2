/* Optional visual experiment for the LABORATORY scene only.
 * Does not call attack, cast, damage, inventory or save functions.
 * Everything is original Phaser pixel-cell graphics; no PB Ranked assets.
 */
import {REA_FRAME_REFERENCES,movePrototypePoint,sweptVectorCurveHit,u01} from './rea-vector-math.js';
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
 // Author the backdrop in a temporary Graphics object, then cache it in
 // one WebGL RenderTexture if the native client supports it. This reduces
 // 139 static geometry commands per rendered frame to one texture quad.
 // Keep a Graphics fallback for older clients and isolated test stubs.
 let backdrop=scene.add.graphics().setDepth(89999).setVisible(false);
 let usesCachedBackdrop=false;
// Original layered pixel-art test room, covering high-depth battle UI.
    // Never draw over the LAB top controls at logical y=77.
    pixel(backdrop,16,105,608,173,0x020d1b,1);
    pixel(backdrop,19,108,602,167,0x0a2131,1);
    pixel(backdrop,23,111,594,24,0x17374a,1);
    pixel(backdrop,23,135,594,64,0x0c2836,1);
    pixel(backdrop,23,160,594,39,0x123444,1);
    pixel(backdrop,23,184,594,15,0x163b48,1);
    pixel(backdrop,23,199,594,29,0x1c454c,1);
    pixel(backdrop,23,228,594,19,0x294d50,1);
    pixel(backdrop,23,247,594,27,0x071928,1);
    // Hand-authored stepped bezel and amber/sea-glass corners.
    pixel(backdrop,19,108,602,3,0xbfd8ba,1);
    pixel(backdrop,19,272,602,3,0xbfd8ba,1);
    pixel(backdrop,19,111,3,161,0x7eaeab,1);
    pixel(backdrop,618,111,3,161,0x7eaeab,1);
    for(const x of [20,610])for(const y of [110,265]){
     pixel(backdrop,x,y,9,3,0xffd17a,1);pixel(backdrop,x,y,3,10,0xffd17a,1);
    }
    pixel(backdrop,23,136,594,2,0x356875,1);
    pixel(backdrop,23,245,594,2,0x64847e,1);
    // Mountains in the far distance: procedural placement is deterministic,
    // pixel-aligned and original; no reference-game background assets.
    for(let i=0;i<16;i++){
     const x=23+i*38,h=9+(i*17%13);
     pixel(backdrop,x,198-h,36,h,0x1d4347,1);
     pixel(backdrop,x+6,195-h,20,3,0x31575a,.92);
    }
    // Irregular stone slabs, sparse grass and tiny glowing laboratory marks.
    for(let i=0;i<34;i++){
     const x=31+i*17,y=230+(i*11%11);
     pixel(backdrop,x,y,11,2,i%3?0x40655d:0x6a7363,.88);
     if(i%4===0){pixel(backdrop,x+4,225,2,3,0x94b774,.9);pixel(backdrop,x+7,227,2,2,0x6b936c,.9);}
    }
    for(let x=38;x<609;x+=24)
     pixel(backdrop,x,148+(x*7%13),2,2,0x85c9b7,.22);
 // Stationary target and its reticle are drawn one time only.
 for(const [x,y,w,h,c] of [
  [TGT.x-18,TGT.y+13,36,5,0x071622],
  [TGT.x-13,TGT.y+8,26,7,0x3b5656],
  [TGT.x-3,TGT.y-17,6,29,0x3c6162],
  [TGT.x-15,TGT.y-12,30,26,0x071927],
  [TGT.x-12,TGT.y-9,24,20,0x7b9c9c],
  [TGT.x-9,TGT.y-6,18,14,0x203d4c],
  [TGT.x-6,TGT.y-4,12,10,0x6bdac7],
  [TGT.x-3,TGT.y-1,6,4,0xe8f9c8]
 ])pixel(backdrop,x,y,w,h,c);
 if(typeof scene.add.renderTexture==='function'){
  // RT coordinates are world logical 640×360; origin=0 keeps pixel math
  // identical to Phaser.Graphics. Draw while source Graphics is visible,
  // then destroy that temporary display object (no duplicate render).
  const rt=scene.add.renderTexture(0,0,640,360)
   .setOrigin(0,0).setDepth(89999).setVisible(false);
  backdrop.setVisible(true);
  rt.draw(backdrop);
  backdrop.destroy();
  backdrop=rt;
  usesCachedBackdrop=true;
 }
 // Static mode-specific paths are rebuilt only once per 1.8s mode.
 const trail=scene.add.graphics().setDepth(89999.5).setVisible(false);
 const drawModeTrail=(current,palette)=>{
  trail.clear();
  const count=current==='arc'?24:14;
  for(let n=0;n<=count;n++){
   const at=movePrototypePoint(current,n/count);
   pixel(trail,at.x,at.y,2,2,current==='arc'?0xedb6be:palette[1],
    current==='arc'?0.24:0.18);
  }
  const ix=MODES.indexOf(current);
  for(let i=0;i<3;i++)pixel(trail,394+i*12,117,8,5,
   i===ix?palette[2]:0x3c6067,i===ix?1:.6);
 };
 const g=scene.add.graphics().setDepth(90000).setVisible(false);
 const label=scene.add.text(38,117,'',{fontFamily:'Pixelify Sans,monospace',
  fontSize:'11px',fontStyle:'bold',color:'#fff2d8',
  stroke:'#071727',strokeThickness:2}).setDepth(90001).setVisible(false);
 const detail=scene.add.text(38,256,'',{fontFamily:'Pixelify Sans,monospace',
  fontSize:'9px',color:'#c5deed',stroke:'#071727',strokeThickness:1})
  .setDepth(90001).setVisible(false);
 // An invisible high-priority hit area prevents clicking underlying AUTO/skill
 // HUD buttons through the demonstration. It never handles battle actions.
 const inputShield=scene.add.zone(320,191,608,173).setDepth(90002).setInteractive();
 inputShield.input.enabled=false;
 let active=false,destroyed=false,clock=0,mode=null,previousRatio=null,impactTick=-Infinity,hitCount=0;
 let lastLabel='',lastDetailMode=null;
 const debug={active:false,mode:null,hitCount:0,lastHitPosition:null,
  byMode:{beam:0,dash:0,arc:0},lastHitMode:null,
  isolation:'LAB_VISUAL_ONLY',containsThirdPartyAssets:false,doesNotChangeDamage:true,
  usesCachedBackdrop};
 scene.__torre2ReaMathPreview=debug;
 const render=(deltaMs=16.667)=>{
  if(!active||destroyed)return;
  const step=Math.max(0,Math.min(64,Number(deltaMs)||16.667));
  clock+=step;const index=Math.floor(clock/1800)%MODES.length;
  const current=MODES[index],local=clock%1800,ratio=local/1800;
  const point=movePrototypePoint(current,ratio),palette=PALETTES[current];
  if(mode!==current){
   mode=current;previousRatio=null;impactTick=-Infinity;
   drawModeTrail(mode,palette);
  }
  let collided=false;
  if(previousRatio!==null){
   // Check the actual sampled curved path, not just its endpoint chord.
   // Eight bounded segments keep the prototype predictable at low frame rates.
   const hit=sweptVectorCurveHit(t=>movePrototypePoint(mode,t),7,()=>TGT,12,previousRatio,ratio,8);
   collided=hit.hit;
   if(collided&&impactTick<0){
    impactTick=clock;hitCount++;
    debug.byMode[mode]++;debug.lastHitMode=mode;
    const contact=movePrototypePoint(mode,hit.firstFraction);
    debug.lastHitPosition={x:Math.round(contact.x),y:Math.round(contact.y)};
   }
  }
  previousRatio=ratio;debug.mode=mode;debug.hitCount=hitCount;
  const flash=clock-impactTick<225,view=['PROJETIL CURVO','ESQUIVA / DASH','ARCO DE POKEBOLA'][index];
  const ref=[REA_FRAME_REFERENCES.Shoot,REA_FRAME_REFERENCES.Swing,REA_FRAME_REFERENCES.Attack][index];
  g.clear();
  drawGlyph(g,point.x,point.y,palette,mode);
  if(flash){
   pixel(g,TGT.x-6,TGT.y-4,12,10,0xffffff);
   pixel(g,TGT.x-3,TGT.y-1,6,4,palette[3]);
  }
  if(flash){
   const since=u01((clock-impactTick)/225),r=6+23*since;
   for(let j=0;j<8;j++){
    const a=j*Math.PI/4;
    pixel(g,TGT.x+Math.cos(a)*r,TGT.y+Math.sin(a)*r,3,3,
     j%2?palette[2]:palette[3],1-since);
   }
   pixel(g,TGT.x-3,TGT.y-3,7,7,0xffffff,1-since);
  }
  // Phaser Text.setText may regenerate a canvas texture. Update only on a
  // meaningful mode/impact transition, not once per simulation frame.
  const labelState=mode+(flash?':hit':':normal');
  if(lastLabel!==labelState){
   label.setText('LAB VETORIAL / '+view+'  '+(flash?'• IMPACTO':''));
   lastLabel=labelState;
  }
  if(lastDetailMode!==mode){
   const ord=Math.round(ref.hitOrdinal*100);
   detail.setText('REA: '+ref.medianFrames+' QUADROS | HIT '+ord+
     '% DA SEQUENCIA | TEMPO NAO MEDIDO | SEM DANO');
   lastDetailMode=mode;
  }
  return {mode,point,collided};
 };
 const tick=(_time,delta)=>render(delta);
 const toggle=()=>{
  if(destroyed)return false;
  active=!active;debug.active=active;
  inputShield.input.enabled=active;
  backdrop.setVisible(active);trail.setVisible(active);g.setVisible(active);label.setVisible(active);detail.setVisible(active);
  if(active){
   clock=0;mode=null;previousRatio=null;impactTick=-Infinity;hitCount=0;
   lastLabel='';lastDetailMode=null;
   debug.hitCount=0;debug.lastHitPosition=null;debug.lastHitMode=null;
   debug.byMode={beam:0,dash:0,arc:0};
   render(0);
  }else{g.clear();debug.mode=null;}
  return active;
 };
 const destroy=()=>{
  if(destroyed)return;destroyed=true;active=false;
  scene.events.off('update',tick);scene.events.off('shutdown',destroy);
  // Phaser can clear an input handler BEFORE scene shutdown listeners run.
  // Never abort scene transition because the already-released Zone has no input.
  if(inputShield.input)inputShield.input.enabled=false;
  inputShield.destroy();g.destroy();trail.destroy();backdrop.destroy();label.destroy();detail.destroy();
  if(scene.__torre2ReaMathPreview===debug)delete scene.__torre2ReaMathPreview;
 };
 scene.events.on('update',tick);
 scene.events.once('shutdown',destroy);
 return {toggle,destroy,render,debug};
}
