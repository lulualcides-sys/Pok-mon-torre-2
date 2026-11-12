/* Original Torre 2 Arena adaptation of the public Alpha 0.70.0 Raichu Electro Ball.
 * No borrowed sprites, assets, FX or source implementation. Native 0.70.0 wins.
 * Only installs on older native Raichu; never changes campaign or saved games.
 */
export const RAICHU_ELECTRO_FORM='torre2_raichu_electro_ball_0700';
export const RAICHU_ELECTRO_RULES=Object.freeze({
 charge:.55,speed:380,range:300,radius:9,pulses:3,pulseGap:.1,
 pulseDamage:3.5,finisherDamage:9,finisherPush:120,
 sparkDamage:2,sparkStun:.5,cost:30,cooldown:4
});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const point=l=>({x:l.x,y:l.y-(l.alto||36)*.5});
export function sweptElectroContact(a,b,r,rad=9){
 if(!r||r.ko||!Number.isFinite(r.x)||!Number.isFinite(r.y))return false;
 const t=point(r),dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy;
 const u=den?clamp(((t.x-a.x)*dx+(t.y-a.y)*dy)/den,0,1):0;
 return Math.hypot(t.x-(a.x+u*dx),t.y-(a.y+u*dy))<=rad+Math.min(12,(r.alto||36)*.22);
}
export function upgradeRaichuElectroKit(fighter,kit){
 if(!fighter||!kit||fighter.escena?.datos?.torre2===true)return kit;
 const name=String(fighter.etapa>0?fighter.forma?.nombre:fighter.def?.nombre||fighter.forma?.nombre||'').toUpperCase();
 const family=String(fighter.def?.id||'').toLowerCase();
 if(family!=='pichu'&&family!=='raichu')return kit;
 if(family==='pichu'&&fighter.etapa!==2)return kit;
 if(name!=='RAICHU'||kit.rmb?.nombre!=='Electro Ball'||
    kit.rmb.forma!=='proyectil')return kit;
 // Do not replace a current native 0.70 move (bolaSombra) or approved moves.
 const r=RAICHU_ELECTRO_RULES;
 return {...kit,rmb:{...kit.rmb,forma:RAICHU_ELECTRO_FORM,tipo:'ELECTRIC',
  dano:r.pulseDamage,golpes:r.pulses,cada:r.pulseGap,vel:r.speed,
  alcance:r.range,radio:r.radius,carga:r.charge,lento:.5,
  final:{dano:r.finisherDamage,empuje:r.finisherPush,radio:22},
  rayito:{dano:r.sparkDamage,aturde:r.sparkStun},coste:r.cost,cd:r.cooldown,
  anim:'Charge',hoja:null,hojaFin:null,teledirigido:undefined}};
}
const INSTALLED=Symbol.for('torre2.raichu.electro.0700');
export function installRaichuElectroBall0700(Luchador){
 const proto=Luchador?.prototype;
 if(typeof proto?.kitActual!=='function')throw Error('Raichu patch requires native kitActual');
 if(Object.prototype.hasOwnProperty.call(proto,INSTALLED))return false;
 const original=proto.kitActual;
 proto.kitActual=function(...args){return upgradeRaichuElectroKit(this,original.apply(this,args))};
 Object.defineProperty(proto,INSTALLED,{value:true});
 return true;
}
const color={dark:0x20385c,blue:0x5fd9ff,yellow:0xffe96a,white:0xffffff};
function tile(g,x,y,size,c,alpha=1){g.fillStyle(c,alpha);g.fillRect(Math.round(x-size/2),Math.round(y-size/2),size,size)}
function paint(g,p,t,phase,landed=false){
 g.clear();
 const flick=Math.floor(t*20)%4,rad=phase==='charge'?4+Math.floor(t*8)%4:9;
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4+t*7,dist=rad+3+(i+flick)%3*2;
  tile(g,p.x+Math.cos(a)*dist,p.y+Math.sin(a)*dist,2,i%2?color.blue:color.yellow,.86);
 }
 tile(g,p.x,p.y,rad*2+3,color.dark);
 tile(g,p.x,p.y,rad*2-1,color.blue);
 tile(g,p.x-2,p.y-2,Math.max(3,rad-2),color.yellow);
 tile(g,p.x-3,p.y-3,3,color.white);
 if(landed){
  for(let i=0;i<4;i++){
   const a=i*Math.PI/2+t*13,d=17+Math.sin(t*20)*5;
   tile(g,p.x+Math.cos(a)*d,p.y+Math.sin(a)*d,4,color.yellow);
  }
 }
}
function nativeStrike(l,r,h,extra,damage,push=8,stun=0){
 if(!r||r.ko)return false;
 const before=r.hp,dx=r.x-l.x,dy=r.y-l.y,dist=Math.hypot(dx,dy)||1;
 const state=r.recibir?.(l,{dano:damage,tipo:'ELECTRIC',
  slot:extra?.slot,surge:extra?.surge,empuje:push,aturde:stun,
  dirX:dx/dist,dirY:dy/dist});
 return state==='golpe'&&Number.isFinite(before)&&r.hp<before;
}
export function raichuElectroBall0700(l,h,extra={}){
 const e=l?.escena,rules=RAICHU_ELECTRO_RULES;
 if(!e?.add?.graphics||!Array.isArray(e.efectos))throw Error('Native Phaser effects scene required');
 const g=e.add.graphics().setDepth(1511);
 const origin=point(l),r=l.rival,aim=r&&!r.ko?point(r):{x:l.ax??origin.x+100,y:l.ay??origin.y};
 const ax=l.ax??aim.x,ay=l.ay??aim.y;
 const a=Math.atan2(ay-origin.y,ax-origin.x);
 const direction={x:Math.cos(a),y:Math.sin(a)};
 const charge=h.carga??rules.charge,speed=h.vel??rules.speed,range=h.alcance??rules.range;
 const rad=h.radio??rules.radius,gap=h.cada??rules.pulseGap;
 const hitDamage=h.dano??rules.pulseDamage,finish=h.final??{},spark=h.rayito??{};
 const center={...origin};let age=0,travel=0,contact=null,hitAge=0,pulses=0,
  finishDone=false,successful=0,dead=false;
 l.animar?.(h.anim||'Charge',charge+.08,.13);
 l.accion={hasta:(l.t||0)+charge,bloquea:true,lento:h.lento??.5,angulo:a};
 const fx={update(dt){
  if(dead)return false;
  if(l.ko){fx.destroy();return false}
  dt=clamp(Number(dt)||0,0,.08);age+=dt;
  if(age<charge){paint(g,origin,age,'charge');return true}
  if(!contact){
   const prev={...center},move=Math.min(Math.max(0,range-travel),speed*dt);
   center.x+=direction.x*move;center.y+=direction.y*move;travel+=move;
   if(sweptElectroContact(prev,center,r,rad)){
    contact=r;hitAge=0;
   }else if(travel>=range){fx.destroy();return false}
  }
  if(contact){
   hitAge+=dt;
   while(pulses<(h.golpes??rules.pulses)&&hitAge+1e-9>=pulses*gap){
    if(nativeStrike(l,contact,h,extra,hitDamage)){successful++}
    pulses++;
   }
   if(!finishDone&&hitAge>=(h.golpes??rules.pulses)*gap){
    finishDone=true;
    if(successful>0&&!contact.ko){
     if(nativeStrike(l,contact,h,extra,finish.dano??rules.finisherDamage,
       finish.empuje??rules.finisherPush)){
       nativeStrike(l,contact,h,extra,spark.dano??rules.sparkDamage,0,
         spark.aturde??rules.sparkStun);
     }
    }
   }
   const p=point(contact);paint(g,p,hitAge,'impact',successful>0);
   if(hitAge>=.48||contact.ko){fx.destroy();return false}
  }else paint(g,center,age,'flight');
  return true;
 },destroy(){if(dead)return;dead=true;g.destroy()}};
 e.efectos.push(fx);return fx;
}
export const RAICHU_0700_FORMS={[RAICHU_ELECTRO_FORM]:raichuElectroBall0700};
