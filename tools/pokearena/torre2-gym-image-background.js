/* T38 — approved raster gym interior BELOW native Phaser NPCs and controls.
 * Image backgrounds are EMPTY scenery, never screenshots with baked characters.
 * New art is opt-in, source-verified by the build and dimension-checked here.
 * No load or display occurs when art is absent; legacy scenery stays intact.
 */
import {gymWideLayout} from './torre2-gym-wide-layout.js';
import {preflightGymImageOverlay} from './torre2-gym-image-preflight.js';
export const GYM_IMAGE_VERSION='t38-approved-scene-v1';
export const GYM_IMAGE_MANIFEST_KEY='torre2-approved-gym-scenes-v1';
export const GYM_IMAGE_ART_ROOT='assets/ui/gym-interiors/';
export const GYM_IMAGE_SPECS=Object.freeze([
 'brock','misty','surge','erika','koga','sabrina','blaine','giovanni'
].map((slug,stage)=>Object.freeze({
 stage,slug,key:'torre2-gym-scene-'+slug,
 path:GYM_IMAGE_ART_ROOT+slug+'-interior.png'
})));
export const GYM_IMAGE_VIEW=Object.freeze({x:0,y:0,width:640,height:360,depth:2.4});
const GRID=2;
const snap=v=>Math.round(v/GRID)*GRID;
const overlayCache=new Map();
const normalized=[
 [.185,.475],[.795,.515],[.276,.78],[.854,.78]
];
export function approvedGymImage(manifest,stage){
 const definition=GYM_IMAGE_SPECS[stage];
 if(!definition||manifest?.version!==1||!Array.isArray(manifest.scenes))return null;
 const entry=manifest.scenes.find(item=>item?.stage===stage);
 if(!entry||entry.slug!==definition.slug||entry.key!==definition.key||
  entry.path!==definition.path||
  !(entry.width===1280&&entry.height===720||
   entry.width===640&&entry.height===360)||
  typeof entry.sha256!=='string'||!/^[a-f0-9]{64}$/.test(entry.sha256))return null;
 return Object.freeze({...definition,width:entry.width,height:entry.height,sha256:entry.sha256});
}
export function gymImageOverlayLayout(stage){
 if(!Number.isInteger(stage)||stage<0||stage>7)return null;
 if(overlayCache.has(stage))return overlayCache.get(stage);
 const existing=gymWideLayout(stage);
 // Existing Brock/Misty positions are never changed by this new mode.
 const room=Object.freeze({x:66,y:68,width:508,height:200});
 const slots=existing?existing.slots:Object.freeze(normalized.map(([u,v])=>
  Object.freeze({x:snap(room.x+u*room.width),y:snap(room.y+v*room.height)})));
 const leader=existing?.leader||Object.freeze({x:290,y:126});
 const ace=existing?.ace||Object.freeze({x:342,y:126});
 const plan={stage,room,slots,leader,ace,cameraZoom:1,
  floorBottom:268,uiTop:274,margin:7};
 // Reject collisions and mobile clipping BEFORE any Phaser display object.
 const safety=preflightGymImageOverlay(plan);
 const verified=Object.freeze({...plan,safety});
 overlayCache.set(stage,verified);
 return verified;
}
export function rosterForGymImage(roster,stage){
 if(!roster)return null;
 const layout=gymImageOverlayLayout(stage);
 if(!layout||roster.stage!==stage||roster.slots.length>layout.slots.length)
  throw new Error('Gym image: roster does not match active gym geometry');
 const slots=roster.slots.map((t,i)=>Object.freeze({...t,
  x:layout.slots[i].x,y:layout.slots[i].y}));
 return Object.freeze({...roster,slots:Object.freeze(slots),imageOverlay:true});
}
export function acePlacementForGymImage(stage,species){
 const layout=gymImageOverlayLayout(stage);
 if(!layout)return null;
 const big=species==='onix'||species==='arcanine';
 return Object.freeze({leaderX:layout.leader.x,aceX:layout.ace.x,
  baseline:layout.leader.y,maxWidth:big?58:52,maxHeight:big?48:45});
}
export function drawGymImageBackground(scene,stage,manifest){
 const spec=approvedGymImage(manifest,stage);
 if(!spec||!scene.textures?.exists(spec.key))return null;
 const tex=scene.textures.get(spec.key),source=tex?.source?.[0];
 // Enforce original landscape aspect/dimensions — no forced stretching.
 if(source?.width!==spec.width||source?.height!==spec.height)return null;
 if(typeof Phaser!=='undefined'&&Phaser.Textures?.FilterMode)
  tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
 const image=scene.add.image(GYM_IMAGE_VIEW.x,GYM_IMAGE_VIEW.y,spec.key)
  .setOrigin(0,0).setDisplaySize(GYM_IMAGE_VIEW.width,GYM_IMAGE_VIEW.height)
  .setDepth(GYM_IMAGE_VIEW.depth)
  .setData('torre2-gym-image-background',spec.slug);
 const report=Object.freeze({version:GYM_IMAGE_VERSION,stage,slug:spec.slug,
  approved:true,mode:'image',cameraZoom:1,portrait:false,decorativeOnly:true,
  image,sha256:spec.sha256});
 scene.__torre2GymImage=report;
 return report;
}
// Load only this approved gym, never all eight large raster backgrounds.
export function requestGymImageBackground(scene,stage,manifest,{token,onReady}={}){
 const spec=approvedGymImage(manifest,stage);
 if(!spec||scene.textures?.exists(spec.key))return false;
 if(!scene.load?.image||!scene.load?.on||!scene.load?.once)return false;
 const pending=scene.__torre2GymImagePending??=new Set();
 if(pending.has(spec.key))return true;
 pending.add(spec.key);
 const event='filecomplete-image-'+spec.key;
 const clean=()=>{
  scene.load.off?.(event,complete);
  scene.load.off?.('loaderror',failure);
  pending.delete(spec.key);
 };
 const complete=()=>{
  clean();
  if(token&&!token.active)return;
  if(scene.scene?.isActive?.()!==true)return;
  if(scene.textures.exists(spec.key))onReady?.(spec);
 };
 const failure=file=>{if(file?.key===spec.key)clean()};
 scene.load.once(event,complete);
 scene.load.on('loaderror',failure);
 token?.once?.('destroy',clean);
 scene.load.image(spec.key,spec.path);
 if(!scene.load.isLoading?.())scene.load.start?.();
 return true;
}
