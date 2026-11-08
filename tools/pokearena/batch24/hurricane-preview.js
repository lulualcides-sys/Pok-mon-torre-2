/* Hurricane — original, unapproved Phaser Graphics preview for Arena only.
 * The official Alpha 0.63.6 catalog mentions Hurricane (Flying/torbellino),
 * but only in a disabled Rayquaza kit. No native assets/code were copied.
 * This is NEVER automatically equipped or introduced into Kanto campaign.
 * The approved Twister renderer and every established VFX remain untouched.
 */
export const HURRICANE_PREVIEW=Object.freeze({
 id:'hurricane',nombre:'Hurricane',tipo:'FLYING',categoria:'SPECIAL',
 forma:'torre2_hurricane_preview',poder:110,precisao:70,pp:10,
 dano:18,alcance:240,coste:30,cd:7,frames:12,approved:false,
 status:'original-preview-not-approved-not-equipped'
});
const TAU=Math.PI*2;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const center=l=>({x:l.x,y:l.y-(l.alto||36)/2});
export function hurricaneSweep(a,b,r,radius=16){
 if(!r||r.ko)return null;
 const c=center(r),dx=b.x-a.x,dy=b.y-a.y;
 const len=dx*dx+dy*dy;
 const f=len?clamp(((c.x-a.x)*dx+(c.y-a.y)*dy)/len,0,1):0;
 const x=a.x+dx*f,y=a.y+dy*f;
 return Math.hypot(x-c.x,y-c.y)<=radius+Math.min(12,(r.alto||36)*.22)?{x,y}:null;
}
const P=[0x213b58,0x456f86,0x79a7b6,0xbce0df,0xf1f5e9];
const px=(g,x,y,color,n=2,alpha=1)=>{
 g.fillStyle(color,alpha);
 g.fillRect(Math.round(x),Math.round(y),n,n);
};
/* Vertical, tapering funnel: separately winding airflow strands; pixel-only.
 * At most 84 bounded 2–3px rectangles per frame, no huge alpha blobs.
 */
export function paintHurricanePreview(g,x,y,phase){
 const f=phase%12;
 for(let tier=0;tier<7;tier++){
  const baseWidth=4+(6-tier)*3;
  const yy=y+21-tier*9;
  for(let strand=0;strand<4;strand++){
   const theta=f*.42+tier*1.05+strand*TAU/4;
   const side=Math.sin(theta)*baseWidth;
   const depth=Math.cos(theta);
   px(g,x+side,yy+(strand%2)*2,P[(strand+tier)%4+1],2,clamp(.52+depth*.19,.25,.85));
   const far=side*.74;
   px(g,x+far,yy-3,P[(strand+tier+1)%4],2,clamp(.26+depth*.1,.15,.43));
  }
 }
 for(let j=0;j<9;j++){
  const yy=y+23-j*8;
  const side=Math.sin(f*.46+j*1.31)*(5+(j%4)*4);
  px(g,x+side,yy,P[1+(j%3)],2,.34);
 }
}
export function paintHurricaneImpact(g,x,y,age){
 if(age<0||age>=.38)return false;
 const progress=age/.38;
 for(let i=0;i<12;i++){
  const a=i*TAU/12+progress*.35;
  const radius=3+progress*25;
  px(g,x+Math.cos(a)*radius,y+Math.sin(a)*radius*.6,
    P[1+(i%4)],2,.55*(1-progress));
 }
 return true;
}
/** Opt-in preview renderer. Rendered contact, not aim, resolves damage. */
export function castHurricanePreview(l,h=HURRICANE_PREVIEW,extra={}){
 const e=l?.escena;
 if(!e?.add?.graphics||!Array.isArray(e.efectos))throw Error('Phaser scene not ready');
 const a=Math.atan2((l.ay??l.y)-l.y,(l.ax??l.x+100)-l.x);
 const o=center(l),dx=Math.cos(a),dy=Math.sin(a);
 const g=e.add.graphics().setDepth(1513);
 const move={...HURRICANE_PREVIEW,...h};
 const range=Math.min(260,Math.max(1,move.alcance));
 const speed=220;
 l.animar?.('Shoot',.5,.13);
 let age=0,prev=o,impact=null,finished=false,dead=false;
 const fx={g,update(dt){
  if(dead)return false;
  if(l.ko){fx.destroy();return false;}
  age+=clamp(dt||0,0,.08);g.clear();
  if(impact){
   if(!paintHurricaneImpact(g,impact.x,impact.y,age-impact.time)){
    fx.destroy();return false;
   }
   return true;
  }
  if(finished){fx.destroy();return false;}
  const travel=Math.max(0,(age-.10)*speed);
  if(travel>range){finished=true;fx.destroy();return false;}
  const p={x:o.x+dx*(travel+12),y:o.y+dy*(travel+12)};
  paintHurricanePreview(g,p.x,p.y,Math.floor(age*20));
  const r=l.rival,contact=hurricaneSweep(prev,p,r,16);
  prev=p;
  if(contact){
   finished=true;
   const accurate=Math.random()<clamp((move.precisao??70)/100,0,1);
   if(accurate&&r&&!r.ko){
    const before=r.hp;
    const trainingHits=e.__torre2TrainingHits||0;
    const result=r.recibir(l,{dano:move.dano,tipo:move.tipo,
     categoria:move.categoria,estado:'HURRICANE_PREVIEW',slot:extra.slot,
     empuje:4,dirX:dx,dirY:dy});
    const damage=r.__torre2TrainingDummy===true?
      ((e.__torre2TrainingHits||0)>trainingHits?(e.__torre2TrainingLastDamage||0):0):
      Math.max(0,before-r.hp);
    if(result==='golpe'&&damage>0){
     impact={...contact,time:age};
    }
   }
   if(!impact){fx.destroy();return false;}
  }
  return true;
 },destroy(){if(dead)return;dead=true;g.destroy();}};
 e.efectos.push(fx);
 return fx;
}
export const HURRICANE_PREVIEW_FORMS=Object.freeze({
 torre2_hurricane_preview:castHurricanePreview
});
