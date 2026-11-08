/* Original external-screen pixel motifs. No combat imports, timers or hit areas.
 * Each motif occupies a 32x32 cell. Integer pixels, transparent background.
 */
export const PREMIUM_PALETTE=Object.freeze([0x000000,0x183d3b,0x28604a,0x3c8751,0x65a552,0xa3c96a,0xe5e6b5,0x77654d,0xb39a70,0xefe0aa,0x537b8c,0x8fb9be,0x23495c,0x398dac,0x7ed4d7,0xe9ffff,0xc36b71,0xf3aaa0]);
export function premiumPixels(kind){
 const a=Array.from({length:32},()=>Array(32).fill(0));
 const r=(x,y,w,h,c)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(a[yy]&&xx>=0&&xx<32)a[yy][xx]=c};
 if(kind==='tree'){
  r(8,28,18,2,1);r(13,19,7,10,7);r(15,20,2,9,8);
  for(const [x,y,w,h,c]of [[4,14,24,10,1],[2,11,27,8,2],[5,5,23,14,3],[9,2,14,16,4],[7,7,11,6,5],[11,3,8,3,5],[3,12,8,4,4],[17,11,10,6,4],[11,17,9,4,3]])r(x,y,w,h,c);
  for(const [x,y]of [[9,8],[14,4],[18,7],[5,13],[22,12],[12,16],[19,18],[7,20]]){r(x,y,3,1,5);r(x+1,y-1,2,1,4)}
  r(11,10,3,2,6);r(20,14,2,1,5);r(8,22,4,1,3);
 }else if(kind==='planter'){
  r(2,24,28,4,1);r(3,19,26,7,10);r(2,18,28,3,11);r(5,22,22,1,12);
  for(let x=4;x<29;x+=5){r(x,11,4,7,2);r(x-1,12,6,3,3);r(x,11,3,1,5);r(x+1,8,1,5,4);r(x,7,3,3,x%2?16:9);r(x+1,8,1,1,6)}
 }else if(kind==='bench'){
  r(4,25,25,2,1);r(5,19,2,7,12);r(25,19,2,7,12);
  r(3,9,26,9,7);r(4,10,24,2,9);r(4,14,24,2,8);
  r(2,19,28,4,7);r(2,19,28,1,9);r(4,20,24,1,8);
  r(1,16,3,6,12);r(28,16,3,6,12);r(0,16,5,2,11);r(27,16,5,2,11);
 }else if(kind==='terminal'){
  r(4,2,24,21,12);r(5,2,22,2,11);r(7,5,18,14,10);r(8,6,16,11,13);
  r(9,7,14,1,14);r(10,9,6,1,15);r(10,11,10,1,14);r(10,13,8,1,14);
  r(6,20,20,2,11);r(23,20,2,1,5);r(14,23,4,3,10);
  r(5,26,22,4,12);r(6,26,20,1,11);for(let x=8;x<25;x+=3)r(x,28,2,1,11);
 }
 return a;
}
export function premiumSprite(scene,kind,x,y,scale=1){
 const key='torre2-premium-'+kind;
 if(!scene.textures.exists(key)){
  const g=scene.make.graphics({x:0,y:0,add:false});
  premiumPixels(kind).forEach((row,yy)=>row.forEach((c,xx)=>{if(c)g.fillStyle(PREMIUM_PALETTE[c],1).fillRect(xx,yy,1,1)}));
  g.generateTexture(key,32,32);g.destroy();
  scene.textures.get(key).setFilter(1);
 }
 return scene.add.image(Math.round(x),Math.round(y),key).setOrigin(0,0).setScale(scale);
}
