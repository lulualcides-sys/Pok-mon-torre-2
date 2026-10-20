/* Pokémon Torre 2 — pure deterministic battle rules (no DOM, no Canvas2D).
 * A successful cast emits a visual event; damage applies only at impact.
 */
export const WORLD=Object.freeze({width:960,height:540,padding:46});
export const MOVES=Object.freeze({
 ember:Object.freeze({id:'ember',name:'Ember',type:'fire',power:13,cost:9,cooldown:0.60,speed:520,frames:12,range:480,radius:24,color:0xff9d27}),
 flamethrower:Object.freeze({id:'flamethrower',name:'Flamethrower',type:'fire',power:32,cost:22,cooldown:2.35,speed:750,frames:12,range:440,radius:39,color:0xff6f25}),
 firespin:Object.freeze({id:'firespin',name:'Fire Spin',type:'fire',power:26,cost:18,cooldown:3.2,speed:360,frames:12,range:400,radius:48,color:0xfbc12b}),
 fireblast:Object.freeze({id:'fireblast',name:'Fire Blast',type:'fire',power:62,cost:39,cooldown:5.5,speed:450,frames:16,range:500,radius:68,color:0xff9725})
});
export const GYMS=Object.freeze([
 {id:'pewter',name:'Pewter',leader:'Brock',terrain:'rock',level:1},
 {id:'cerulean',name:'Cerulean',leader:'Misty',terrain:'water',level:2},
 {id:'vermilion',name:'Vermilion',leader:'Lt. Surge',terrain:'electric',level:3},
 {id:'celadon',name:'Celadon',leader:'Erika',terrain:'grass',level:4},
 {id:'fuchsia',name:'Fuchsia',leader:'Koga',terrain:'poison',level:5},
 {id:'saffron',name:'Saffron',leader:'Sabrina',terrain:'psychic',level:6},
 {id:'cinnabar',name:'Cinnabar',leader:'Blaine',terrain:'fire',level:7},
 {id:'viridian',name:'Viridian',leader:'Giovanni',terrain:'ground',level:8}
]);
export const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function vector(from,to){
 const dx=to.x-from.x,dy=to.y-from.y;
 const size=Math.hypot(dx,dy)||1;
 return {x:dx/size,y:dy/size};
}
export function elementalMultiplier(attack,defender){
 if(attack==='fire'&&['rock','water','fire','dragon'].includes(defender))return .5;
 if(attack==='fire'&&['grass','bug','ice','steel'].includes(defender))return 2;
 return 1;
}
const player=()=>({id:'charizard',name:'Charizard',level:50,type:'fire',x:235,y:345,
 radius:24,hp:230,maxHp:230,energy:100,maxEnergy:100,invulnerable:0,speed:190,
 cooldowns:{ember:0,flamethrower:0,firespin:0,fireblast:0}});
const ENEMIES=[
 {id:'geodude',name:'Geodude',type:'rock',level:12,maxHp:86,hp:86,x:715,y:260,speed:76,radius:26,
  action:1.4,power:8},
 {id:'onix',name:'Onix',type:'rock',level:14,maxHp:132,hp:132,x:735,y:255,speed:61,radius:34,
  action:1.2,power:12}
];
const cloneEnemy=e=>({...e});
export function createBattle(){
 return {gym:'pewter',status:'fighting',player:player(),enemy:cloneEnemy(ENEMIES[0]),
  enemyIndex:0,t:0,projectiles:[],enemyShots:[],enemyCastCount:0,visuals:[],events:[],kills:0,badges:0,castCount:0,goal:'Vença Brock no Ginásio de Pewter'};
}
function notify(s,type,payload={}){
 s.events.push({type,time:s.t,...payload});
 if(s.events.length>80)s.events.splice(0,s.events.length-80);
}
export function consumeEvents(s){const events=s.events.slice();s.events.length=0;return events}
export function cast(s,id,aim){
 const move=MOVES[id],p=s.player;
 if(!move)return {ok:false,reason:'unknown'};
 if(s.status!=='fighting')return {ok:false,reason:'finished'};
 if(p.cooldowns[id]>0)return {ok:false,reason:'cooldown'};
 if(p.energy<move.cost)return {ok:false,reason:'energy'};
 if(!s.enemy||s.enemy.hp<=0)return {ok:false,reason:'no-target'};
 const dest=aim&&Number.isFinite(aim.x)&&Number.isFinite(aim.y)?aim:s.enemy;
 // Projectiles start from the visible Charizard mouth instead of its feet.
 // Calculate the travel vector from the actual emission point so damage and
 // the rendered flame are spatially synchronized, including diagonal casts.
 const rough=vector({x:p.x,y:p.y-34},dest);
 const origin={x:p.x+rough.x*39,y:p.y-33+rough.y*5};
 const dir=vector(origin,dest);
 const travel=clamp(distance(origin,dest),50,move.range);
 p.energy-=move.cost;p.cooldowns[id]=move.cooldown;s.castCount++;
 const pr={id,castId:s.castCount,move,origin,x:origin.x,y:origin.y,
  direction:dir,age:0,lifetime:travel/move.speed,remaining:travel,
  travel:travel,progress:0,hit:false};
 s.projectiles.push(pr);
 notify(s,'cast',{move:id,castId:pr.castId,at:{x:origin.x,y:origin.y},target:{x:dest.x,y:dest.y}});
 return {ok:true,castId:pr.castId,timeToImpact:pr.lifetime};
}
export function dodge(s,direction={x:1,y:0}){
 if(s.status!=='fighting'||s.player.energy<12||s.player.invulnerable>0)return false;
 const p=s.player,dir=vector({x:0,y:0},direction);
 p.x=clamp(p.x+dir.x*68,WORLD.padding,WORLD.width-WORLD.padding);
 p.y=clamp(p.y+dir.y*68,WORLD.padding,WORLD.height-WORLD.padding);
 p.energy-=12;p.invulnerable=.45;
 notify(s,'dodge',{x:p.x,y:p.y});return true;
}
export function movePlayer(s,dx,dy,dt){
 if(s.status!=='fighting')return;
 const p=s.player,mag=Math.hypot(dx,dy);
 if(mag<=0)return;
 // Variable analog magnitude controls walk speed, keyboard diagonal is normalized.
 const speedFactor=Math.min(1,mag);
 p.x=clamp(p.x+dx/mag*p.speed*dt*speedFactor,WORLD.padding,WORLD.width-WORLD.padding);
 p.y=clamp(p.y+dy/mag*p.speed*dt*speedFactor,WORLD.padding,WORLD.height-WORLD.padding);
}
function impact(s,projectile){
 if(projectile.hit)return;
 projectile.hit=true;
 const d=s.enemy;if(!d||d.hp<=0)return;
 const separation=distance({x:projectile.x,y:projectile.y},d);
 if(separation>projectile.move.radius+d.radius){
  notify(s,'miss',{move:projectile.id,castId:projectile.castId,x:projectile.x,y:projectile.y});
  return;
 }
 const damage=Math.max(1,Math.round(projectile.move.power*elementalMultiplier(projectile.move.type,d.type)));
 d.hp=Math.max(0,d.hp-damage);
 notify(s,'impact',{move:projectile.id,castId:projectile.castId,damage,
  x:d.x,y:d.y,remainingHp:d.hp,effective:elementalMultiplier(projectile.move.type,d.type)});
 if(!d.hp)defeatEnemy(s);
}
function defeatEnemy(s){
 s.kills++;
 s.enemyShots.length=0; // No previous Pokemon projectile survives a trainer switch.
 notify(s,'enemy-defeated',{enemy:s.enemy.id});
 if(s.enemyIndex===ENEMIES.length-1){
  s.status='victory';s.badges=1;notify(s,'badge',{leader:'Brock',gym:'pewter'});
 }else{
  s.enemyIndex++;
  s.enemy=cloneEnemy(ENEMIES[s.enemyIndex]);
  notify(s,'next-enemy',{enemy:s.enemy.id});
 }
}
export function tick(s,dt){
 dt=clamp(Number(dt)||0,0,0.045);
 if(s.status!=='fighting')return;
 s.t+=dt;const p=s.player,e=s.enemy;
 for(const key of Object.keys(p.cooldowns))p.cooldowns[key]=Math.max(0,p.cooldowns[key]-dt);
 p.energy=Math.min(p.maxEnergy,p.energy+13*dt);
 p.invulnerable=Math.max(0,p.invulnerable-dt);
 for(const shot of s.projectiles){
  if(shot.hit)continue;
  shot.age+=dt;
  const distanceNow=Math.min(shot.travel,shot.age*shot.move.speed);
  shot.progress=clamp(distanceNow/shot.travel,0,1);
  shot.x=shot.origin.x+shot.direction.x*distanceNow;
  shot.y=shot.origin.y+shot.direction.y*distanceNow;
  // Contact with the current opponent must trigger damage at the animated impact.
  if(distance(shot,e)<=shot.move.radius+e.radius||shot.progress>=1)impact(s,shot);
 }
 s.projectiles=s.projectiles.filter(shot=>!shot.hit);
 if(s.status!=='fighting')return;
 // Brock's rocks now have an actual visible travel arc and can be dodged.
 // HP is never removed by an invisible proximity hit.
 for(const rock of s.enemyShots){
  rock.age+=dt;
  const step=Math.min(rock.range,rock.speed*rock.age);
  rock.progress=step/rock.range;
  rock.x=rock.origin.x+rock.direction.x*step;
  rock.y=rock.origin.y+rock.direction.y*step;
  if(distance(rock,p)<p.radius+rock.radius){
   rock.done=true;
   if(p.invulnerable<=0){
    p.hp=Math.max(0,p.hp-rock.power);
    p.invulnerable=.32;
    notify(s,'enemy-impact',{enemy:rock.owner,id:rock.id,x:rock.x,y:rock.y});
    notify(s,'player-hit',{damage:rock.power,hp:p.hp,x:rock.x,y:rock.y});
    if(p.hp===0){s.status='defeat';notify(s,'defeat',{leader:'Brock'});}
   }
  }else if(rock.progress>=1){
   rock.done=true;notify(s,'enemy-miss',{enemy:rock.owner,id:rock.id,x:rock.x,y:rock.y});
  }
 }
 s.enemyShots=s.enemyShots.filter(rock=>!rock.done);
 if(s.status!=='fighting'||!e||e.hp<=0)return;
 const gap=distance(p,e);
 if(gap>174){
  const toward=vector(e,p);
  e.x=clamp(e.x+toward.x*e.speed*dt,80,WORLD.width-80);
  e.y=clamp(e.y+toward.y*e.speed*dt,80,WORLD.height-80);
 }
 e.action-=dt;
 if(e.action<=0){
  e.action=e.id==='onix'?1.4:1.8;
  if(distance(p,e)<490){
   const origin={x:e.x,y:e.y-24};
   const target={x:p.x,y:p.y-14};
   const dir=vector(origin,target);
   const rock={id:++s.enemyCastCount,owner:e.id,power:e.power,
    origin,direction:dir,x:origin.x,y:origin.y,
    age:0,progress:0,range:Math.min(520,distance(origin,target)+26),
    speed:e.id==='onix'?390:335,radius:e.id==='onix'?17:13,done:false};
   s.enemyShots.push(rock);
   notify(s,'enemy-cast',{enemy:e.id,id:rock.id,x:rock.x,y:rock.y,
    target,range:rock.range});
  }
 }
}
