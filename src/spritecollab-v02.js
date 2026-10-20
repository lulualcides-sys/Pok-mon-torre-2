/* PMD SpriteCollab animation adapter — CC BY-NC 4.0, artists require credit.
 * Detailed attribution: CREDITS_SPRITECOLLAB.md. No Poké Arena assets used.
 * Geometric Pixi fallbacks are retained when public sprite host is unavailable.
 */
export const PMD_CREDITS='https://github.com/PMDCollab/SpriteCollab';
const base='https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/';
const mons=[
 {name:'Charizard',id:'0006',target:'player',width:40,height:48,scale:2.45,direction:1},
 {name:'Geodude',id:'0074',target:'enemyRock',width:32,height:24,scale:2.75,direction:7},
 {name:'Onix',id:'0095',target:'enemyOnix',width:96,height:104,scale:1.13,direction:7}
];

function recolorNoncommercialSprite(P,sprite,pokemon){
 // Community-contributed shiny variants: create an independent orange/stone
 // palette using a GPU filter, while preserving black outlines and transparency.
 // This is a documented derivative of the credited CC BY-NC sprites.
 const frag=`
 varying vec2 vTextureCoord;
 uniform sampler2D uSampler;
 uniform float uPokemon;
 void main(void){
   vec4 c=texture2D(uSampler,vTextureCoord);
   if(c.a<0.01){gl_FragColor=c;return;}
   float bright=dot(c.rgb,vec3(0.299,0.587,0.114));
   float mx=max(c.r,max(c.g,c.b)), mn=min(c.r,min(c.g,c.b));
   float chroma=mx-mn;
   if(uPokemon<0.5){
     // Dark charcoal shiny body -> warm orange, keep blue wing membrane.
     if(bright>0.11 && bright<0.76 && chroma<0.19){
       float t=clamp((bright-0.10)/0.64,0.0,1.0);
       c.rgb=mix(vec3(0.35,0.12,0.06),vec3(1.0,0.62,0.22),t);
     }
   } else {
     // Gold/green variant stone -> weathered blue-grey rock, not gold metal.
     if(bright>0.18 && c.r>c.b*1.12){
       float k=clamp(bright,0.0,1.0);
       c.rgb=vec3(0.27+0.47*k,0.30+0.43*k,0.39+0.35*k);
     }
   }
   gl_FragColor=c;
 }
`;
 sprite.filters=[new P.Filter(undefined,frag,{uPokemon:pokemon==='Charizard'?0:1})];
}

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
   parent.addChild(sprite);recolorNoncommercialSprite(P,sprite,mon.name);sprite.play();
   outcomes.push({pokemon:mon.name,status:'animated-sprite-loaded',
    frames:frames.length,recolored:true,rows,columns:cols,size:mon.width+'x'+mon.height,source:url});
  }catch(error){
   outcomes.push({pokemon:mon.name,status:'original-fallback',
    reason:String(error?.message||error).slice(0,200)});
  }
  report(outcomes.slice());
 }
 return outcomes;
}
