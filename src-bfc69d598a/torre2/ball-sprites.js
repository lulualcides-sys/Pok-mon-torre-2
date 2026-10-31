/* Pokémon Torre 2 — 16x16 pixel ball art sampled from the sprite reference
 * supplied by the player (1000992902(1).png). No Canvas 2D, CSS drawing
 * or third-party request: painted as nearest-neighbor Phaser/WebGL pixels.
 * Frames 0/1 are respectively front and turned views of each physical ball.
 */
const PALETTE={
 '0':0x404040,'1':0x424142,'2':0x6088b0,'4':0x7898d8,
 '6':0x800000,'8':0x909090,'9':0x90b0d8,
 'C':0xa80000,'E':0xb0c8e0,'G':0xb82858,'H':0xc89808,'R':0xf86088,
 'I':0xd02828,'K':0xd84070,'L':0xd86000,
 'N':0xe08020,'P':0xe8a040,'S':0xf89878,
 'T':0xf8c060,'U':0xf8f808,'V':0xf8f8f8
};
const BALL_FRAMES=Object.freeze({
 pokeball:[
 [
 '................','......0000......','....00CCCC00....',
 '...0CISIICC60...','...0ISVSIICC0...','..0CIISIIICC60..',
 '..0IIII00CCC60..','..00II0V80C600..','..0V0008800080..',
 '...0VVV008880...','...08VVV88880...','....00888800....',
 '......0000......','................','................','................'
 ],
 [
 '................','......0000......','....00SSII00....',
 '...0SSIIIICC0...','...0IIC006CC0...','..0IC00V800660..',
 '..0I0660066060..','...0600000060...','..080000000080..',
 '..0V0000000080..','...0VV0000V80...','...08VVV88880...',
 '....00888800....','......0000......','................','................'
 ]
 ],
 greatball:[
 [
 '................','......0000......','....00444400....',
 '...0KKE994KG0...','...GKRVE99KKG...','..04KKE999KK20..',
 '..099990044420..','..00990V804200..','..0V0008800080..',
 '...0VVV008880...','...08VVV88880...','....00888800....',
 '......0000......','................','................','................'
 ],
 [
 '................','......0000......','....00EE9900....',
 '...0EE9999440...','...0994002440...','..09400V800220..',
 '..090220022020..','...0200000020...','..080000000080..',
 '..0V0000000080..','...0VV0000V80...','...08VVV88880...',
 '....00888800....','......0000......','................','................'
 ]
 ],
 ultraball:[
 [
 '................','......0000......','....00HUUH00....',
 '...0NUU88UUL0...','...0PUU88UUN0...','..0NPPUUUUPNL0..',
 '..0PPUU00UUNL0..','..00UU0V80UU00..','..0V0008800080..',
 '...0VVV008880...','...08VVV88880...','....00888800....',
 '......0000......','................','................','................'
 ],
 [
 '................','......0000......','....0HU88UH0....',
 '...0TTUUUUNN0...','...0PUU00UUN0...','..0PN00V800LL0..',
 '..0P0LL00LL0L0..','...0L000000L0...','..080000000080..',
 '..0V0000000080..','...0VV0000V80...','...08VVV88880...',
 '....00888800....','......0000......','................','................'
 ]
 ]
});
export function drawBallSprite(g,cx,cy,kind='pokeball',scale=2,angle=0,opened=false){
 const atlas=BALL_FRAMES[kind]||BALL_FRAMES.pokeball;
 const rows=atlas[Math.abs(Math.sin(angle))>.48?1:0];
 const ox=Math.round(cx-8*scale),oy=Math.round(cy-8*scale);
 const cos=Math.cos(angle),sin=Math.sin(angle);
 let last=null;
 for(let y=0;y<16;y++){
  for(let x=0;x<16;x++){
   const code=rows[y][x],color=PALETTE[code];
   if(color===undefined)continue;
   // When releasing, split the top of the ball without scaling the whole sprite.
   const dy=opened?(y<7?-4*scale:y>8?2*scale:0):0;
   if(color!==last){g.fillStyle(color);last=color;}
   const rx=(x-7.5)*scale,ry=(y-7.5)*scale;
   g.fillRect(Math.round(cx+rx*cos-ry*sin-scale/2),Math.round(cy+rx*sin+ry*cos-scale/2+dy),scale,scale);
  }
 }
 if(opened){
  g.fillStyle(0x3b152b);g.fillRect(ox+4*scale,oy+8*scale,8*scale,2*scale);
  g.fillStyle(0xff6f79);g.fillRect(ox+5*scale,oy+6*scale,6*scale,scale);
  g.fillStyle(0xfff4b5);g.fillRect(ox+7*scale,oy+7*scale,2*scale,2*scale);
 }
}


/* The user-approved 16×16 Pokéball source becomes an actual Phaser texture.
 * Rasterize ONCE at scale 1 and animate the Image object with Phaser GPU
 * rotation/nearest sampling. Never rotate/repaint every pixel per frame.
 * This is the existing user-supplied art, not an unlicensed new rip.
 */
// Cache both approved pixel-art states. The opened ball has a larger transparent
// canvas so its split upper/lower shells are never clipped at 16x16.
export function ballTextureKey(kind='pokeball',opened=false){
 const type=Object.prototype.hasOwnProperty.call(BALL_FRAMES,kind)?kind:'pokeball';
 return 'torre2-original-ball-'+type+(opened?'-open':'');
}
function ensureBallTexture(scene,kind='pokeball',opened=false){
 const type=Object.prototype.hasOwnProperty.call(BALL_FRAMES,kind)?kind:'pokeball';
 const key=ballTextureKey(type,opened);
 if(!scene.textures.exists(key)){
  const size=opened?24:16,center=size/2;
  const gfx=scene.make.graphics({x:0,y:0,add:false});
  drawBallSprite(gfx,center,center,type,1,0,opened);
  gfx.generateTexture(key,size,size);
  gfx.destroy();
 }
 const texture=scene.textures.get(key);
 if(typeof Phaser!=='undefined'&&Phaser.Textures?.FilterMode)
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
 return key;
}
export function setBallOpened(sprite,kind='pokeball',opened=false,size=16){
 const key=ensureBallTexture(sprite.scene,kind,opened);
 const frameSize=opened?size*1.5:size;
 sprite.setTexture(key).setDisplaySize(frameSize,frameSize);
 sprite.setData('torre2-ball-opened',!!opened);
 return sprite;
}
export function originalBallSprite(scene,x,y,kind='pokeball',size=16,depth=2309){
 const type=Object.prototype.hasOwnProperty.call(BALL_FRAMES,kind)?kind:'pokeball';
 const key=ensureBallTexture(scene,type,false);
 return scene.add.image(Math.round(x),Math.round(y),key)
  .setDisplaySize(size,size).setDepth(depth).setData('torre2-original-ball-sprite',type);
}
