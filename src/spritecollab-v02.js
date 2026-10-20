/* V0.3 — multi-action 8-direction battle animation, based on licensed PMD SpriteCollab
 * CC BY-NC, credits in CREDITS_SPRITECOLLAB.md. No Poké Arena sprites reused.
 * WebGL/Pixi, no Canvas2D, fallback actor mesh retained if asset host unavailable.
 */
export const PMD_CREDITS='https://github.com/PMDCollab/SpriteCollab';
const BASE='https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/';
const ROSTER=[
 {name:'Charizard',id:'0006',target:'player',scale:3.75,face:2,
  sizes:{Idle:[40,48],Walk:[40,48],Shoot:[56,56],Attack:[80,88],Hurt:[64,64]}},
 {name:'Geodude',id:'0074',target:'enemyRock',scale:3.35,face:6,
  sizes:{Idle:[32,24],Walk:[32,32],Shoot:[48,40],Attack:[72,80],Hurt:[40,48]}},
 {name:'Onix',id:'0095',target:'enemyOnix',scale:1.43,face:6,
  sizes:{Idle:[96,104],Walk:[88,112],Shoot:[96,112],Attack:[128,152],Hurt:[80,88]}}
];
const ACTIONS=['Idle','Walk','Shoot','Attack','Hurt'];
const FRAME_DURATIONS={
 // Durations transcribed from per-species licensed PMD SpriteCollab AnimData.xml (60 Hz ticks).
 '0006':{
  Idle:[15,15,15,15],Walk:[8,10,8,10],
  Shoot:[4,6,2,2,2,2,2,2,2,2,2],
  Attack:[2,2,2,2,4,1,1,2,2,2,2,2,2,2],Hurt:[2,8]
 },
 '0074':{
  Idle:[8,12,8,12],Walk:[8,10,8,10],
  Shoot:[2,2,4,1,1,2,2,2,2,2,2,2,2,2],
  Attack:[3,3,2,2,2,2,1,1,1,1,1,1,2,2],Hurt:[2,8]
 },
 '0095':{
  Idle:[16,16,16,16],Walk:[10,14,10,14],
  Shoot:[2,2,6,2,2,2,2,2,2,2],
  Attack:[2,6,1,1,1,2,2,2,2,2,2],Hurt:[2,8]
 }
};
export function timedFrame(durations,elapsed){
 if(!durations?.length)return 0;
 const ticks=durations.reduce((a,b)=>a+b,0);
 let position=((Math.max(0,elapsed)*60)%ticks+ticks)%ticks;
 for(let n=0;n<durations.length;n++){
  position-=durations[n];if(position<0)return n;
 }
 return durations.length-1;
}
export function facingDirection(dx,dy,previous=2){
 if(Math.hypot(dx,dy)<0.13)return previous;
 // PMD eight-way rows: down, down-right, right, up-right, up,
 // up-left, left, down-left (by screen y-down convention).
 const theta=Math.atan2(dy,dx);
 return ((Math.round(theta/(Math.PI/4))+2+8)%8);
}
function makePaletteFilter(P,mon){
 const src=`
 varying vec2 vTextureCoord;
 uniform sampler2D uSampler;
 uniform float uHero;
 void main(void){
  vec4 c=texture2D(uSampler,vTextureCoord);
  if(c.a<.01){gl_FragColor=c;return;}
  float b=dot(c.rgb,vec3(.299,.587,.114));
  float hi=max(c.r,max(c.g,c.b)),lo=min(c.r,min(c.g,c.b));
  if(uHero>.5){
    // Only neutral dark Charizard body; black outlines remain black.
    if(b>.12 && b<.78 && hi-lo<.18){
      float k=clamp((b-.10)/.69,0.,1.);
      c.rgb=mix(vec3(.36,.13,.08),vec3(1.,.63,.20),k);
    }
  }else if(b>.2 && c.r>c.b*1.14){
    // Optional shiny stone variant turned back into dark mineral grey.
    c.rgb=vec3(.27,.31,.39)+vec3(.42,.44,.42)*b;
  }
  gl_FragColor=c;
 }
`;
 return new P.Filter(undefined,src,{uHero:mon==='Charizard'?1:0});
}
async function loadClip(P,mon,action){
 const [fw,fh]=mon.sizes[action];
 const url=BASE+mon.id+'/0000/0001/'+action+'-Anim.png';
 const tex=await P.Assets.load(url);
 const base=tex.baseTexture||tex.texture?.baseTexture||tex;
 const columns=Math.floor(base.width/fw),rows=Math.floor(base.height/fh);
 if(columns<1||rows<8)throw Error('invalid frame atlas for '+mon.name+' '+action+': '+base.width+'x'+base.height);
 const clips=[];
 for(let d=0;d<8;d++){
  const textures=[];
  for(let i=0;i<Math.min(15,columns);i++){
   textures.push(new P.Texture(base,new P.Rectangle(i*fw,d*fh,fw,fh)));
  }
  clips.push(textures);
 }
 return {url,clips,count:columns,frameWidth:fw,frameHeight:fh};
}
function buildController(P,parent,mon,loaded){
 const sprite=new P.AnimatedSprite(loaded.Idle.clips[mon.face]);
 sprite.anchor.set(.5,.80);
 sprite.scale.set(mon.scale);
 sprite.position.set(0,-7);sprite.roundPixels=true;
 sprite.animationSpeed=.12;sprite.loop=true;
 sprite.filters=[makePaletteFilter(P,mon.name)];
 for(const child of parent.children)child.visible=false;
 parent.addChild(sprite);
 const state={mode:'Idle',face:mon.face,locked:'',lockUntil:0,frames:0,changes:0,actions:0,
  lastAction:'',loaded:Object.keys(loaded),name:mon.name,modeSince:0,frame:0};
 const get=(action,face)=>loaded[action]?.clips[face]||loaded.Idle.clips[face];
 const controller={
  sprite,state,
  action(name,duration=0.5,time=0){
   if(!loaded[name])return false;
   state.locked=name;state.lockUntil=time+duration;
   state.actions++;state.lastAction=name;
   return true;
  },
  update(time,dx,dy,lookDx,lookDy){
   const was=state.face;
   const walking=Math.hypot(dx,dy)>0.8;
   const movingFreely=walking&&time>=state.lockUntil;
   state.face=facingDirection(movingFreely?dx:lookDx,movingFreely?dy:lookDy,state.face);
   if(state.face!==was)state.changes++;
   const mode=time<state.lockUntil&&loaded[state.locked]?state.locked:
     walking&&loaded.Walk?'Walk':'Idle';
   if(mode!==state.mode||state.face!==was){
    sprite.textures=get(mode,state.face);
    sprite.gotoAndStop(0);
    state.mode=mode;
    state.modeSince=time; // A new shoot/hurt/walk sequence always begins at frame 0.
   }
   const durations=FRAME_DURATIONS[mon.id]?.[mode];
   const i=durations?timedFrame(durations.slice(0,sprite.totalFrames),time-state.modeSince):
     Math.floor(Math.max(0,time-state.modeSince)*10)%sprite.totalFrames;
   sprite.gotoAndStop(Math.min(i,sprite.totalFrames-1));
   state.frame=i;state.frames++;
  }
 };
 parent.__pmd=controller;
 return controller;
}
export async function installSpriteCollab(P,stage,report=()=>{}){
 const outcomes=[];
 for(const mon of ROSTER){
  const parent=stage[mon.target];
  if(!parent){outcomes.push({pokemon:mon.name,status:'missing-parent'});report(outcomes.slice());continue;}
  const loaded={},errors=[];
  for(const name of ACTIONS){
   try{loaded[name]=await loadClip(P,mon,name)}
   catch(error){errors.push({name,reason:String(error?.message||error).slice(0,120)})}
  }
  if(loaded.Idle){
   buildController(P,parent,mon,loaded);
   outcomes.push({pokemon:mon.name,status:'animated-sprite-loaded',frames:loaded.Idle.count,
    actions:Object.keys(loaded),directions:8,source:PMD_CREDITS,errors});
  }else outcomes.push({pokemon:mon.name,status:'original-fallback',errors});
  report(outcomes.slice());
 }
 return outcomes;
}
