/* V0.4 original WebGL sprites: Brock's visible rock attacks and grounded dust.
 * Render once into Pixi GPU textures. No Canvas2D or copied game assets.
 */
const INK=0x131725,SHADOW=0x344252,STONE=0x798798,LIGHT=0xb5c0c4,DUST=0x9aa3a9;
function box(g,x,y,w,h,c,a=1){g.beginFill(c,a).drawRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h)).endFill()}
function poly(g,col,points){g.beginFill(col).drawPolygon(points).endFill()}
function rock(P,f,large){
 const g=new P.Graphics(),n=f%8;
 const rx=large?33:29,ry=large?26:24;
 const jitter=[-2,1,2,-1,0,3,-2,1][n],x=48,y=45;
 poly(g,INK,[x-rx-3,y-3,x-rx*.72,y-ry-3,x-rx*.1,y-ry-7,x+rx*.6,y-ry-3,
  x+rx+4,y-5,x+rx*.75,y+ry*.74,x+rx*.11,y+ry+5,x-rx*.66,y+ry*.6]);
 poly(g,SHADOW,[x-rx,y-5,x-rx*.60,y-ry,x+rx*.42,y-ry-2,x+rx,y-5,
  x+rx*.66,y+ry*.59,x-rx*.40,y+ry*.63]);
 poly(g,STONE,[x-rx+5,y-9,x-rx*.55,y-ry+2,x+rx*.41,y-ry,
  x+rx*.77,y-7,x+rx*.39,y+ry*.2,x-rx*.3,y+ry*.27]);
 poly(g,LIGHT,[x-rx*.54,y-ry+2,x+rx*.2,y-ry+3,x+rx*.36,y-ry*.37,
  x-rx*.45,y-ry*.28]);
 for(let i=0;i<3;i++){
  const xx=x-8+i*10+jitter,yy=y-3+i*5;
  box(g,xx,yy,12,3,INK,.55);
  box(g,xx+2,yy+3,5,5,0x505b69,.9);
 }
 if(large){for(let i=0;i<4;i++)box(g,x-30+i*19,y+20+(i%2)*3,7,4,0x4f6070,.85);}
 return g;
}
function grit(P,f){
 const g=new P.Graphics(),t=f/11;
 for(let i=0;i<17;i++){
  const ang=i*2.399963+f*.06,rad=(i%5+1)*(3+t*8);
  const x=74+Math.cos(ang)*rad,y=74+Math.sin(ang)*rad*.45;
  const size=Math.max(1,6-t*3+(i%3));
  box(g,x,y,size+3,size+2,INK,(1-t)*.55);
  box(g,x+1,y+1,size,size,DUST,(1-t)*.85);
 }
 for(let i=0;i<7;i++){
  const x=45+i*11+(i%2)*3,y=77+Math.sin(f*.6+i)*4;
  box(g,x,y,7,2,LIGHT,(1-t)*.28);
 }
 return g;
}
export function buildBrockAtlas(P,app){
 const make=(fn,length)=>Array.from({length},(_,i)=>{
  const g=fn(i);const tex=app.renderer.generateTexture(g,{resolution:1,scaleMode:P.SCALE_MODES.NEAREST});
  g.destroy();return tex;
 });
 return {geodude:make(i=>rock(P,i,false),8),
  onix:make(i=>rock(P,i,true),8),
  dust:make(i=>grit(P,i),12)};
}
export function spawnDust(P,atlas,x,y){
 const sprite=new P.Sprite(atlas.dust[0]);
 sprite.anchor.set(.5,.5);sprite.position.set(x,y);
 sprite.width=112;sprite.height=95;sprite.roundPixels=true;
 return {sprite,age:0,duration:.43};
}
export function stepDust(effect,dt,atlas){
 effect.age+=dt;
 effect.sprite.texture=atlas.dust[Math.min(atlas.dust.length-1,Math.floor(effect.age/effect.duration*atlas.dust.length))];
 effect.sprite.alpha=Math.max(0,1-effect.age/effect.duration);
 return effect.age<effect.duration;
}
