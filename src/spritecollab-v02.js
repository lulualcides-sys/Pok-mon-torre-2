/* PMD SpriteCollab animation adapter — CC BY-NC 4.0, artists require credit.
 * Detailed attribution: CREDITS_SPRITECOLLAB.md. No Poké Arena assets used.
 * Geometric Pixi fallbacks are retained when public sprite host is unavailable.
 */
export const PMD_CREDITS='https://github.com/PMDCollab/SpriteCollab';
const base='https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/';
const mons=[
 {name:'Charizard',id:'0006',target:'player',width:40,height:48,scale:1.40,direction:2},
 {name:'Geodude',id:'0074',target:'enemyRock',width:32,height:24,scale:1.72,direction:6},
 {name:'Onix',id:'0095',target:'enemyOnix',width:96,height:104,scale:.73,direction:6}
];
export async function installSpriteCollab(P,stage,report=()=>{}){
 const outcomes=[];
 for(const mon of mons){
  const url=base+mon.id+'/0000/0001/Idle-Anim.png';
  const parent=stage[mon.target];
  if(!parent){outcomes.push({pokemon:mon.name,status:'missing-actor'});continue;}
  try{
   const texture=await P.Assets.load(url);
   const baseTexture=texture.baseTexture||(texture.texture||texture).baseTexture||texture;
   const cols=Math.floor(baseTexture.width/mon.width);
   const rows=Math.floor(baseTexture.height/mon.height);
   if(cols<1||rows<1)throw Error('Invalid sprite sheet dimensions');
   const row=Math.min(mon.direction,rows-1),frames=[];
   for(let i=0;i<Math.min(4,cols);i++){
    frames.push(new P.Texture(baseTexture,
     new P.Rectangle(i*mon.width,row*mon.height,mon.width,mon.height)));
   }
   const sprite=new P.AnimatedSprite(frames);
   sprite.anchor.set(.5,.72);sprite.scale.set(mon.scale);
   sprite.animationSpeed=.085;sprite.loop=true;
   sprite.position.set(0,8);sprite.roundPixels=true;
   for(const child of parent.children)child.visible=false;
   parent.addChild(sprite);sprite.play();
   outcomes.push({pokemon:mon.name,status:'animated-sprite-loaded',
    frames:frames.length,rows,columns:cols,size:mon.width+'x'+mon.height,source:url});
  }catch(error){
   outcomes.push({pokemon:mon.name,status:'original-fallback',
    reason:String(error?.message||error).slice(0,200)});
  }
  report(outcomes.slice());
 }
 return outcomes;
}
