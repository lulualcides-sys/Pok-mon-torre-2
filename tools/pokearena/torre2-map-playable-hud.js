/* T90: click-only Phaser map HUD. The approved image is background,
 * static NPC sprites are interactive, and doors/signs remain clickable.
 * NO movement, keyboard, joystick, tween, road vectors or character controller.
 * Reuse the ORIGINAL campaign Sumário/Bolsa/Pokédex/combate callbacks.
 */
export const CLICKABLE_OVERWORLD_MAPS=Object.freeze([
 'pallet-town','route-1','viridian-city','viridian-forest','route-2','pewter-city'
]);
// UI formatting only; the underlying combat HP keeps its full precision.
export const displayCampaignHP=value=>
 Number.isFinite(Number(value))?String(Math.max(0,Math.round(Number(value)))):'?';
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
  add(scene.add.text(x-61,y+7,'NV. '+(member.progression?.level??member.level??'?')+
    (i===active?'  ★ ATIVO':'')+'  HP '+displayCampaignHP(member.hp),{
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
/** One native Phaser scene for clickable maps. Underlying art and NPC
 * hotspots belong to renderApprovedMap; only menu buttons are added here.
 * This module never touches campaign saves or takes over ground-pointer input.
 */
export function installClickableOverworld(scene,view,{
 state,nameOf,portraitOf,
 onSummary=()=>{},onBag=()=>{},onDex=()=>{},
 onBattle=()=>{},onCapture=()=>{}
}={}){
 if(!CLICKABLE_OVERWORLD_MAPS.includes(view?.id))return null;
 const id=view.id,team=state?.team||[],activeMember=team[state.active??0];
 if(activeMember){
  const plate=scene.add.rectangle(518,22,234,36,0x0b2239,.90)
   .setStrokeStyle(1,0xe7cc80).setDepth(79);
  const portrait=portraitOf(activeMember);
  if(scene.textures.exists(portrait))
   scene.add.image(418,22,portrait).setDisplaySize(30,30).setDepth(82);
  hudText(scene,440,17,(nameOf(activeMember)+' · NV '+(activeMember.progression?.level??activeMember.level??'?')).slice(0,28),
   10,'#fff0ca',0);
  hudText(scene,440,31,'HP '+displayCampaignHP(activeMember.hp)+'   EQUIPE '+team.length+'/6',
   9,'#b5e2d3',0);
  plate.setData('torre2-overworld-active-plate',id);
 }
 uiButton(scene,47,339,'EQUIPE',()=>showOverworldParty(scene,team,state.active,{
  nameOf,portraitOf,onSummary
 }),'party',76);
 uiButton(scene,128,339,'SUMÁRIO',()=>onSummary(state.active??0),'summary',76);
 uiButton(scene,209,339,'BOLSA',onBag,'bag',76);
 uiButton(scene,428,339,'POKÉDEX',onDex,'dex',76);
 uiButton(scene,510,339,'BATALHA',onBattle,'battle',76);
 uiButton(scene,593,339,'CAPTURA',onCapture,'capture',76);
 return {
  id,
  mode:'click',
  destroy:()=>{/* scene.children.removeAll(true) owns all Phaser HUD objects */}
 };
}
