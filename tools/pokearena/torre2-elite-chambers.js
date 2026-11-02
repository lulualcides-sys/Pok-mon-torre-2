/* T38 — five separate Indigo League chambers in the native Phaser scene.
 * Visual-only. Stage indices 8..12 are the existing Lorelei -> Champion
 * sequence; never grant access, awards, battles or mutate campaign saves.
 * Indigo pixels are an authentic overworld atlas sample, NOT claimed to be
 * an authentic Elite Four interior. Architecture is original 16px geometry.
 */
const THEMES=Object.freeze([
 Object.freeze({stage:8,leader:'Lorelei',name:'SALA GLACIAL',floor:0x4e819c,wall:0x27495f,trim:0xd4f0f0,accent:0x9bd8ed,motif:'ice'}),
 Object.freeze({stage:9,leader:'Bruno',name:'DOJO DE PEDRA',floor:0x846d58,wall:0x48392f,trim:0xd5b68a,accent:0xa88b65,motif:'dojo'}),
 Object.freeze({stage:10,leader:'Agatha',name:'CÂMARA SOMBRIA',floor:0x55446e,wall:0x292440,trim:0xc0a5dc,accent:0x9072b5,motif:'ghost'}),
 Object.freeze({stage:11,leader:'Lance',name:'SALÃO DOS DRAGÕES',floor:0x526477,wall:0x273849,trim:0xadd0e1,accent:0x6d9db4,motif:'dragon'}),
 Object.freeze({stage:12,leader:'Rival',name:'CÂMARA DO CAMPEÃO',floor:0x846e4d,wall:0x34334c,trim:0xf4d788,accent:0xd7ad60,motif:'champion'})
]);
export const ELITE_ROOM_VERSION='t38-indigo-five-rooms-v1';
const RECT=Object.freeze({x:66,y:72,width:508,height:196});
export function eliteChamberPlan(stage){
 const theme=THEMES[stage-8];if(!theme||theme.stage!==stage)return null;
 return Object.freeze({...theme,room:RECT,cameraZoom:1,
  leaderPosition:Object.freeze({x:320,y:150}),
  entrance:Object.freeze({x:320,y:260}),
  combatGate:'existing-stage-only'});
}
export function drawEliteChamber(scene,stage,addNpc){
 const plan=eliteChamberPlan(stage);if(!plan)return null;
 const back=scene.add.graphics().setDepth(4);
 const top=scene.add.graphics().setDepth(4.5);
 const fill=(g,x,y,w,h,c,a=1)=>{g.fillStyle(c,a);g.fillRect(x,y,w,h)};
 fill(back,62,68,516,204,plan.wall);
 fill(back,70,77,500,183,plan.floor);
 back.lineStyle(2,plan.trim).strokeRect(65,71,510,198);
 // Native Indigo atlas pixels are optional texture detail; the five room
 // geometries and colors remain distinct if the original sheet is missing.
 const key='frlg-location-indigo';
 let nativeTiles=0;
 if(scene.textures?.exists(key)){
  const texture=scene.textures.get(key),source=texture.source?.[0];
  if(source&&source.width>=112&&source.height>=112){
   const frame='torre2-indigo-shared-floor-16';
   if(!texture.has(frame))texture.add(frame,0,96,96,16,16);
   if(typeof Phaser!=='undefined')texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
   for(let y=92;y<252;y+=32)for(let x=94;x<542;x+=32){
    scene.add.image(x,y,key,frame).setOrigin(0).setDisplaySize(32,32)
     .setDepth(4.2).setAlpha(.28);
    nativeTiles++;
   }
  }
 }
 // Shared accessible central aisle, no battle hitboxes or zoom.
 fill(top,299,143,42,115,plan.wall,.9);
 fill(top,304,143,32,115,plan.trim,.62);
 fill(top,291,245,58,20,plan.floor);
 // Boss podium is in the rear, separate from the entrance and lower HUD.
 fill(top,248,103,144,56,plan.wall);
 fill(top,254,106,132,47,plan.accent,.9);
 fill(top,261,110,118,38,plan.floor);
 fill(top,263,110,114,4,plan.trim);
 // Independent architectural silhouettes distinguish all five chambers.
 for(const x of [84,520]){
  for(let y=88;y<247;y+=24){
   fill(top,x,y,34,19,plan.wall);
   fill(top,x+3,y+2,28,4,plan.trim,.65);
   fill(top,x+7,y+9,20,6,plan.accent,.7);
  }
 }
 if(plan.motif==='ice'){
  for(const x of [151,454])for(const y of [130,205]){
   fill(top,x,y,24,33,0x8ecfe7,.82);fill(top,x+6,y-9,12,10,0xe0f9f9);
   fill(top,x+5,y+7,14,18,0xb6e9ef,.9);
  }
 }else if(plan.motif==='dojo'){
  for(const x of [153,454])for(const y of [132,211]){
   fill(top,x,y,26,27,0x6c5c48);fill(top,x+4,y+3,18,19,0xbda17d);
   fill(top,x+9,y+8,8,8,0x614a35);
  }
 }else if(plan.motif==='ghost'){
  for(const x of [153,454])for(const y of [139,212]){
   fill(top,x,y,23,22,0x322b4b);fill(top,x+7,y-12,9,13,0xbca0d5);
   fill(top,x+9,y-16,5,6,0xe7d6f6);
  }
 }else if(plan.motif==='dragon'){
  for(const x of [150,451])for(const y of [139,211]){
   fill(top,x,y,31,24,0x3b5369);fill(top,x+5,y-9,21,11,0x83b1c7);
   fill(top,x+12,y-15,7,7,0xd1e5e9);
  }
 }else{
  for(const x of [147,453])for(const y of [135,212]){
   fill(top,x,y,33,28,0x6b573e);fill(top,x+4,y+3,25,19,0xe0bb69);
   fill(top,x+10,y+8,13,9,0x8b6839);
  }
 }
 // The same FRLG NPCs already preloaded for the existing opponent; no new
 // character art and no event that can skip the native leader checkpoint.
 const leaderKind=stage===12?'rival':plan.leader.toLowerCase();
 const leader=addNpc?.(scene,leaderKind,plan.leaderPosition.x,
  plan.leaderPosition.y,{scale:1.3,depth:17});
 leader?.setData?.('torre2-elite-opponent',stage);
 const player=addNpc?.(scene,'red_normal',320,257,{scale:1.12,depth:17});
 player?.setData?.('torre2-elite-player',true);
 const report=Object.freeze({stage,leader:plan.leader,room:plan.name,
  cameraZoom:1,nativeTiles,leaderSprite:!!leader,playerSprite:!!player,
  fixtureOnly:false});
 scene.__torre2EliteChamber=report;
 return report;
}
