/* Native Phaser combat-only presentation guard.
 * Cap ONLY oversize floating move-name text (Hydro Cannon / Acid etc.),
 * which can otherwise cover the opponent and the entire top HP HUD.
 * Never remove projectiles, modify collisions/damage or touch Arena/VS.
 */
export const CAMPAIGN_MOVE_LABEL_LIMITS=Object.freeze({
 maxWidth:208,maxHeight:24,left:110,right:530,top:42,bottom:314
});
const key=name=>String(name||'').normalize('NFKD')
 .replace(/[\u0300-\u036f]/g,'').toLowerCase()
 .replace(/[!！.]/g,'').replace(/\s+/g,' ').trim();
export function installCampaignMoveLabelGuard(scene,actors){
 if(!scene?.datos?.torre2?.party)return {dispose(){},check(){return 0},handled:0};
 let disposed=false,handled=0,frames=0;
 const checked=new Set();
 const limits=CAMPAIGN_MOVE_LABEL_LIMITS;
 function check(){
  if(disposed||!scene.scene.isActive()||scene.fase!=='lucha')return 0;
  const known=new Set(['hydro cannon','acid','egg bomb','seismic toss']);
  for(const actor of actors||[])
   for(const move of Object.values(actor?.kit||{})){
    const name=key(move?.nombre);
    if(name)known.add(name.replace(/^ult\s*[·:-]\s*/,''));
   }
  let corrected=0;
  for(const obj of scene.children?.list||[]){
   if(!obj?.active||!['Text','BitmapText'].includes(obj.type)||typeof obj.text!=='string')continue;
   if(!known.has(key(obj.text)))continue;
   const w=Number(obj.displayWidth),h=Number(obj.displayHeight);
   if(!(w>limits.maxWidth||h>limits.maxHeight))continue;
   if(!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0)continue;
   const factor=Math.min(1,limits.maxWidth/w,limits.maxHeight/h);
   // Clamp rendering scale only. Native action metadata, sprite animations
   // and all projectile update/damage callbacks remain untouched.
   if(typeof obj.setScale==='function')
    obj.setScale(Math.max(.05,(Number(obj.scaleX)||1)*factor),
     Math.max(.05,(Number(obj.scaleY)||1)*factor));
   if(typeof obj.setPosition==='function')
    obj.setPosition(Math.max(limits.left,Math.min(limits.right,Number(obj.x)||320)),
     Math.max(limits.top,Math.min(limits.bottom,Number(obj.y)||155)));
   checked.add(obj);handled++;corrected++;
  }
  return corrected;
 }
 function frame(){
  if(++frames%2===0)check();
 }
 function dispose(){
  if(disposed)return;
  disposed=true;
  scene.game.events.off('poststep',frame);
  scene.events.off('shutdown',dispose);
  scene.events.off('destroy',dispose);
  checked.clear();
 }
 scene.game.events.on('poststep',frame);
 scene.events.once('shutdown',dispose);
 scene.events.once('destroy',dispose);
 return {check,dispose,get handled(){return handled}};
}
