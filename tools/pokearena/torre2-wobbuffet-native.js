/* Executable Johto-only Wobbuffet skills. The three moves are legal in
 * HGSS/B2W2 and use Phaser's native combat/damage/status APIs.
 * Native Poké Arena 2D species and their move metadata remain untouched.
 */
const make=(id,nombre,tipo,forma,dur,cd,coste,anim)=>Object.freeze({
 id,nombre,tipo,forma,dur,cd,coste,anim,dano:0,alcance:0,
 torre2WobbuffetOnly:true,torre2JohtoLegal:'GEN4-HGSS-LEVEL',
 pendiente:false,approved:false
});
export const TORRE2_WOBBUFFET_MOVES=Object.freeze([
 make('counter','Counter','FIGHTING','torre2_wobbuffet_counter',1.35,3.4,0,'Charge'),
 make('safeguard','Safeguard','NORMAL','torre2_wobbuffet_safeguard',6,13,22,'Charge'),
 make('destiny-bond','Destiny Bond','GHOST','torre2_wobbuffet_destinybond',4.5,17,35,'Charge')
]);
const STATUS=new Set(['veneno','toxic','envenenado','quemado','quema',
 'paralizado','dormido','congelado','confuso','enfermo','poison',
 'burn','sleep','freeze','paralysis']);
const PHYSICAL=new Set(['NORMAL','FIGHTING','FLYING','POISON','GROUND',
 'ROCK','BUG','GHOST','STEEL']);
export function wobbuffetBlocksStatus(fighter,state){
 return Boolean(fighter?.est?.torre2WobbuffetSafeguard&&
 fighter.est.torre2WobbuffetSafeguard.hasta>fighter.t&&
 STATUS.has(String(state||'').toLowerCase()));
}
export function wobbuffetHitCategory(g){
 const category=String(g?.categoria||'').toUpperCase();
 if(category==='PHYSICAL'||category==='FISICO')return 'PHYSICAL';
 if(category==='SPECIAL'||category==='ESPECIAL')return 'SPECIAL';
 return PHYSICAL.has(String(g?.tipo||'').toUpperCase())?'PHYSICAL':'SPECIAL';
}
const pulse=(fighter,color=0xffdb87)=>{
 const e=fighter.escena;
 if(!e?.add?.graphics)return;
 const g=e.add.graphics().setDepth(1500);
 const x=Math.round(fighter.x),y=Math.round(fighter.y-fighter.alto/2);
 // Hard-edged nested rectangles: pixel-art, not opaque glow.
 g.lineStyle(2,color,.95).strokeRect(x-17,y-21,34,42);
 g.lineStyle(1,0xffffff,.55).strokeRect(x-12,y-16,24,32);
 e.time.delayedCall(350,()=>g.destroy());
};
const charge=(fighter,h,color)=>{
 fighter.animar(h.anim||'Charge',.3,null);
 fighter.accion={hasta:fighter.t+.35,bloquea:true,lento:.4};
 pulse(fighter,color);
};
const validSource=(fighter,source,g,d)=>Boolean(
 source&&source!==fighter&&!source.remoto&&!source.ko&&
 !g?.tick&&!g?.puro&&!g?.torre2WobbuffetReply&&
 Number.isFinite(d)&&d>0
);
export function wobbuffetAfterHit(fighter,source,g,d){
 if(!validSource(fighter,source,g,d))return;
 const armed=fighter.est?.torre2WobbuffetCounter;
 const activeCounter=armed?.hasta>fighter.t&&
  wobbuffetHitCategory(g)==='PHYSICAL'&&fighter.hp>0;
 if(activeCounter){
  delete fighter.est.torre2WobbuffetCounter;
  // Gen III Counter cannot damage a Ghost-type recipient.
  if(!(source.tipos||[]).includes('GHOST')){
   pulse(fighter,0xffac75);
   // Use the native recibir path for real damage, HP, KO and hit feedback.
   source.recibir(fighter,{tipo:'FIGHTING',dano:d*2,puro:true,
    slot:'lmb',torre2WobbuffetReply:true});
  }
 }
 if(fighter.hp<=0&&!fighter.inmortal&&
    fighter.est?.torre2WobbuffetDestinyBond?.hasta>fighter.t){
  delete fighter.est.torre2WobbuffetDestinyBond;
  if(!source.ko){
   pulse(fighter,0xc1a2fc);
   source.recibir(fighter,{tipo:'GHOST',
    dano:Math.max(1,(source.hp||0)+(source.escudo||0)+1),
    puro:true,slot:'e',torre2WobbuffetReply:true});
  }
 }
}
export const TORRE2_WOBBUFFET_FORMS=Object.freeze({
 torre2_wobbuffet_counter(l,h){
  charge(l,h,0xffbb7c);
  l.ponerEstado('torre2WobbuffetCounter',h.dur||1.35);
 },
 torre2_wobbuffet_safeguard(l,h){
  charge(l,h,0x9cf9d2);
  l.ponerEstado('torre2WobbuffetSafeguard',h.dur||6);
 },
 torre2_wobbuffet_destinybond(l,h){
  charge(l,h,0xc29bff);
  l.ponerEstado('torre2WobbuffetDestinyBond',h.dur||4.5);
 }
});
