/* T89: an actual native Phaser field scene, never a second old campaign UI.
 * Original approved backgrounds are scenery; Red, party and controls are
 * separate game objects, using the existing save/battle/summary callbacks.
 * Prototype road vectors are bounded: no teleporting through trees.
 */
const freezeRoute=points=>Object.freeze(points.map(([x,y])=>Object.freeze({x,y})));
export const NATIVE_WALK_ROUTES=Object.freeze({
 'pallet-town':freezeRoute([[.50,.92],[.50,.85],[.50,.77],[.50,.60],[.50,.50],[.50,.40],[.50,.30],[.50,.20],[.50,.075]]),
 'route-1':freezeRoute([[.50,.94],[.49,.84],[.43,.75],[.47,.65],[.53,.56],[.51,.48],[.40,.38],[.46,.29],[.55,.22],[.52,.13],[.50,.07]]),
 'viridian-city':freezeRoute([[.50,.94],[.50,.86],[.50,.75],[.39,.69],[.31,.57],[.33,.47],[.37,.40],[.42,.29],[.50,.28],[.50,.16],[.50,.075]]),
 'viridian-forest':freezeRoute([[.50,.93],[.50,.85],[.53,.79],[.56,.72],[.61,.65],[.57,.57],[.46,.52],[.40,.45],[.50,.38],[.53,.30],[.48,.23],[.50,.14],[.50,.07]]),
 'route-2':freezeRoute([[.50,.94],[.50,.81],[.49,.71],[.53,.62],[.56,.52],[.52,.43],[.49,.36],[.51,.24],[.50,.08]]),
 'pewter-city':freezeRoute([[.46,.89],[.46,.77],[.49,.65],[.50,.55],[.49,.46],[.48,.34],[.50,.20]])
});
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
export function fieldRoad(route){
 if(!Array.isArray(route)||route.length<2)throw new TypeError('Road requires at least two waypoints');
 const lengths=[0];let total=0;
 for(let i=1;i<route.length;i++){
  const a=route[i-1],b=route[i];
  const segment=Math.hypot(b.x-a.x,b.y-a.y);
  if(!Number.isFinite(segment)||segment<.001)throw new RangeError('Degenerate road vector');
  total+=segment;lengths.push(total);
 }
 return {nodes:route,lengths,total};
}
export function roadPoint(road,d){
 const pos=clamp(d,0,road.total);
 for(let i=1;i<road.nodes.length;i++){
  if(pos<=road.lengths[i]||i===road.nodes.length-1){
   const a=road.nodes[i-1],b=road.nodes[i];
   const fraction=clamp((pos-road.lengths[i-1])/(road.lengths[i]-road.lengths[i-1]),0,1);
   return {x:a.x+(b.x-a.x)*fraction,y:a.y+(b.y-a.y)*fraction,d:pos};
  }
 }
 return {...road.nodes.at(-1),d:road.total};
}
export function closestRoadPoint(road,x,y){
 if(!Number.isFinite(x)||!Number.isFinite(y))throw new TypeError('Invalid road pointer');
 let best=null;
 for(let i=1;i<road.nodes.length;i++){
  const a=road.nodes[i-1],b=road.nodes[i],dx=b.x-a.x,dy=b.y-a.y;
  const f=clamp(((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy),0,1);
  const px=a.x+dx*f,py=a.y+dy*f,dist=Math.hypot(px-x,py-y);
  if(!best||dist<best.distance)
   best={x:px,y:py,d:road.lengths[i-1]+(road.lengths[i]-road.lengths[i-1])*f,distance:dist};
 }
 return best;
}
export function fieldStartDistance(mapId,previousMap,stored){
 const route=NATIVE_WALK_ROUTES[mapId];if(!route)return null;
 const road=fieldRoad(route);
 if(Number.isFinite(stored))return clamp(stored,0,road.total);
 const fromNorth=(mapId==='pallet-town'?false:
  mapId==='route-1'?previousMap==='viridian-city':
  mapId==='viridian-city'?previousMap==='viridian-forest':
  mapId==='viridian-forest'?previousMap==='route-2':
  mapId==='route-2'?previousMap==='pewter-city':
  mapId==='pewter-city'?false:false);
 return road.total*(fromNorth?.89:.10);
}
function hudText(scene,x,y,str,size=10,color='#f2f5f9',originX=.5){
 return scene.add.text(x,y,String(str),{
  fontFamily:'Pixelify Sans,monospace',fontSize:size+'px',fontStyle:'bold',
  color,stroke:'#061320',strokeThickness:2
 }).setOrigin(originX,.5).setDepth(82);
}
function uiButton(scene,x,y,label,callback,name,width=70){
 const bg=scene.add.rectangle(x,y,width,27,0x082034,.93)
  .setStrokeStyle(1,0x89b8cd,.9).setDepth(81);
 const caption=hudText(scene,x,y,label,9);
 const hit=scene.add.zone(x,y,width,29).setDepth(84)
  .setInteractive({useHandCursor:true})
  .setData('torre2-overworld-action',name)
  .on('pointerdown',(_p,_x,_y,event)=>{event?.stopPropagation?.();callback();});
 return {bg,caption,hit};
}
/** Full party is an in-world native Phaser panel, not the former road cards.
 * Selecting a Pokémon opens its existing real summary and moves screen.
 */
export function showOverworldParty(scene,team,active,{nameOf,portraitOf,onSummary}){
 const objects=[];
 const add=obj=>{objects.push(obj);return obj};
 add(scene.add.rectangle(320,180,640,360,0x041321,.87).setDepth(100).setInteractive());
 add(scene.add.rectangle(320,178,552,292,0x0f2943,.99)
  .setStrokeStyle(2,0xe0c16a).setDepth(101));
 add(scene.add.text(320,53,'SUA EQUIPE  ·  '+team.length+'/6',{
  fontFamily:'Pixelify Sans,monospace',fontSize:'18px',color:'#ffe0a0',
  stroke:'#071322',strokeThickness:3}).setOrigin(.5).setDepth(102));
 const close=()=>{for(const o of objects)if(o?.active)o.destroy()};
 team.slice(0,6).forEach((member,i)=>{
  const x=183+(i%2)*276,y=115+Math.floor(i/2)*69;
  add(scene.add.rectangle(x,y,255,59,i===active?0x25536a:0x17334c,.99)
   .setStrokeStyle(1,i===active?0xffd87c:0x7096aa).setDepth(102));
  const key=portraitOf(member);
  if(scene.textures.exists(key))add(scene.add.image(x-94,y,key)
   .setDisplaySize(45,45).setDepth(103));
  add(scene.add.text(x-61,y-12,nameOf(member),{
   fontFamily:'Pixelify Sans,monospace',fontSize:'12px',color:'#fff3d7'
  }).setDepth(103));
  add(scene.add.text(x-61,y+7,'NV. '+(member.level??'?')+
    (i===active?'  ★ ATIVO':'')+'  HP '+(member.hp??'?'),{
   fontFamily:'Pixelify Sans,monospace',fontSize:'10px',color:'#bddde9'
  }).setDepth(103));
  add(scene.add.zone(x,y,255,58).setDepth(105)
   .setInteractive({useHandCursor:true})
   .setData('torre2-overworld-party-index',i)
   .on('pointerdown',(_p,_x,_y,event)=>{event?.stopPropagation?.();close();onSummary(i)}));
 });
 add(scene.add.text(320,312,'FECHAR  ×',{
  fontFamily:'Pixelify Sans,monospace',fontSize:'12px',color:'#ffe1a1',
  backgroundColor:'#18415a',padding:{x:28,y:8}
 }).setOrigin(.5).setDepth(103));
 add(scene.add.zone(320,312,140,31).setDepth(105).setInteractive({useHandCursor:true})
  .setData('torre2-overworld-party-close',true)
  .on('pointerdown',(_p,_x,_y,event)=>{event?.stopPropagation?.();close()}));
 return {close,objects};
}
/** Install a single map-owned HUD and movable 16x32 Red. Stops/stays local
 * to Phaser Scene; never writes into the campaign save or opens legacy cards.
 */
export function installPlayableOverworld(scene,view,{
 state,previousMap=null,storedDistance=null,
 addPlayer,nameOf,portraitOf,
 onPosition=()=>{},onSummary=()=>{},onBag=()=>{},onDex=()=>{},
 onBattle=()=>{},onCapture=()=>{},onMenu=()=>{}
}={}){
 const id=view?.id,route=NATIVE_WALK_ROUTES[id],rect=view?.rect;
 if(!route||!rect)return null;
 const road=fieldRoad(route),start=fieldStartDistance(id,previousMap,storedDistance);
 let distance=start,tween=null;
 const pos=roadPoint(road,start);
 const player=addPlayer(rect.x+pos.x*rect.width,rect.y+pos.y*rect.height);
 if(!player)throw Error('T89 original FireRed overworld Red sprite missing');
 player.setDepth(35).setData('torre2-field-player',id);
 const place=d=>{
  const pt=roadPoint(road,d);
  const x=rect.x+pt.x*rect.width,y=rect.y+pt.y*rect.height;
  player.setPosition(x,y);
  distance=d;onPosition(d);
 };
 const moveTo=d=>{
  if(!player.active)return false;
  const target=clamp(d,0,road.total),delta=target-distance;
  if(Math.abs(delta)<.002)return false;
  if(tween){tween.stop();tween=null}
  const first=roadPoint(road,distance),last=roadPoint(road,target);
  player.setFlipX(last.x<first.x);
  tween=scene.tweens.addCounter({
   from:distance,to:target,duration:Math.max(100,Math.min(5500,Math.abs(delta)*360*9)),
   ease:'Linear',
   onUpdate:t=>{if(player.active)place(t.getValue());},
   onComplete:()=>{tween=null;if(player.active)place(target);}
  });
  return true;
 };
 // Ground is interactive only beneath the original sign/door hotspot zones.
 view.image.setInteractive({useHandCursor:true}).on('pointerdown',(pointer,_lx,_ly,event)=>{
  event?.stopPropagation?.();
  if(!player.active)return;
  const mx=(pointer.worldX-rect.x)/rect.width,my=(pointer.worldY-rect.y)/rect.height;
  const nearest=closestRoadPoint(road,mx,my);
  // Block off-path taps so Red never jumps across cliffs, trees or buildings.
  if(nearest.distance>.155)return;
  moveTo(nearest.d);
 });
 // Keyboard movement is along the same verified route vector, never diagonal
 // through obstacles. Listener is unbound on next scene/map replacement.
 const keys=scene.input.keyboard;
 const onKey=event=>{
  if(!player.active||scene.__torre2ApprovedMapView?.id!==id)return;
  const k=event.key?.toLowerCase();
  if(['arrowup','w','arrowright','d'].includes(k))moveTo(distance+.11);
  if(['arrowdown','s','arrowleft','a'].includes(k))moveTo(distance-.11);
 };
 keys?.on('keydown',onKey);
 const activeMember=state.team?.[state.active??0];
 if(activeMember){
  const plate=scene.add.rectangle(516,22,230,36,0x0b2239,.92)
   .setStrokeStyle(1,0xe7cc80).setDepth(79);
  const portrait=portraitOf(activeMember);
  if(scene.textures.exists(portrait))
   scene.add.image(420,22,portrait).setDisplaySize(32,32).setDepth(82);
  const label=(nameOf(activeMember)+' · NV '+(activeMember.level??'?')).slice(0,29);
  hudText(scene,445,17,label,10,'#fff0ca',0);
  hudText(scene,445,31,'HP '+(activeMember.hp??'?')+'   EQUIPE '+state.team.length+'/6',9,'#b5e2d3',0);
  plate.setData('torre2-overworld-active-plate',id);
 }
 uiButton(scene,47,339,'EQUIPE',()=>showOverworldParty(scene,state.team||[],state.active,{
  nameOf,portraitOf,onSummary
 }),'party',76);
 uiButton(scene,128,339,'SUMÁRIO',()=>onSummary(state.active??0),'summary',76);
 uiButton(scene,209,339,'BOLSA',onBag,'bag',76);
 uiButton(scene,428,339,'POKÉDEX',onDex,'dex',76);
 uiButton(scene,510,339,'BATALHA',onBattle,'battle',76);
 uiButton(scene,593,339,'CAPTURA',onCapture,'capture',76);
 const cleanup=()=>{
  if(tween){tween.stop();tween=null}
  keys?.off('keydown',onKey);
  view.image?.removeAllListeners('pointerdown');
 };
 return {id,player,road,moveTo,place,get distance(){return distance},destroy:cleanup};
}
