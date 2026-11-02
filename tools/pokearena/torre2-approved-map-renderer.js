/* Pokémon Torre 2 — Phaser image-backed navigation over user-approved pixel art.
 * Isolated presentation layer; never modifies campaign saves or battle progress.
 * Do not enable until matching optimized images are installed in the repository.
 */
import {approvedMap,approvedMapNeighbours,approvedPointToScreen} from './torre2-approved-maps-atlas.js';

// Explicit off until the actual approved WebP files exist in GitHub.
export const APPROVED_MAP_ASSETS_READY = false;
export const MAP_CANVAS = Object.freeze({x:0,y:0,width:640,height:360});
export const mapTextureKey = id => 'torre2-approved-map-'+id;

export function preloadApprovedMap(scene,id) {
  const item=approvedMap(id);
  if(!APPROVED_MAP_ASSETS_READY||!item||!scene?.load||scene.textures.exists(mapTextureKey(id)))return false;
  scene.load.image(mapTextureKey(id),item.image);
  return true;
}

/**
 * `onHotspot` and `onNavigate` are functions supplied by the real campaign;
 * the renderer does not grant badges/items, start battles or alter localStorage.
 * All hit rectangles are calculated against the displayed Phaser image's bounds.
 */
export function renderApprovedMap(scene,id,{
  onExit=()=>{},onHotspot=()=>{},onNavigate=()=>{},isUnlocked=()=>false,
  onLocked=()=>{},showHitAreas=false,renderSprite=null
}={}) {
  const entry=approvedMap(id),texture=mapTextureKey(id);
  if(!entry)return {ok:false,reason:'unknown-map',id};
  if(!scene?.textures?.exists?.(texture))return {ok:false,reason:'asset-not-installed',id};
  // Object-fit: contain, preserve the original aspect ratio and pixel integrity.
  const source=scene.textures.get(texture).getSourceImage();
  const sourceW=source?.width||1280,sourceH=source?.height||720;
  const fit=Math.min(MAP_CANVAS.width/sourceW,MAP_CANVAS.height/sourceH);
  const rect={x:(640-sourceW*fit)/2,y:(360-sourceH*fit)/2,
   width:sourceW*fit,height:sourceH*fit};
  const image=scene.add.image(320,180,texture)
   .setOrigin(.5,.5).setDisplaySize(rect.width,rect.height).setDepth(1);
  const zones=[];
  const addZone=(label,p,callback,kind)=>{
   const r=approvedPointToScreen(p,rect);
   const zone=scene.add.zone(r.x,r.y,Math.max(20,r.width),Math.max(20,r.height))
    .setDepth(45).setInteractive({useHandCursor:true})
    .setData('torre2-approved-hotspot',`${id}:${label}`)
    .on('pointerdown',(_pointer,_x,_y,e)=>{e?.stopPropagation?.();callback();});
   zones.push(zone);
   if(showHitAreas){
    const g=scene.add.graphics().setDepth(43);
    g.lineStyle(1,kind==='nav'?0xa6ffcc:0xffe2a1,.9);
    g.strokeRect(r.x-r.width/2,r.y-r.height/2,r.width,r.height);
   }
   return zone;
  };
  for(const h of entry.hotspots||[]){
   // Unverified hotspots are not interactive until reviewed.
   if(h.validated!=='visual')continue;
   addZone(h.id,h,()=>onHotspot(id,h.id),h.id);
  }
  // Buttons outside art landmarks deliberately require a campaign lock check.
  const neighbors=approvedMapNeighbours(id).filter(target=>isUnlocked(id,target));
  const footer=scene.add.rectangle(320,347,636,25,0x061b2e,.90).setDepth(47);
  if(!neighbors.length)scene.add.text(17,345,'CONEXÕES BLOQUEADAS PELA PROGRESSÃO',
    {fontFamily:'Pixelify Sans,monospace',fontSize:'9px',color:'#ffde9b'}).setDepth(48);
  const navTargets=neighbors.slice(0,4);
  navTargets.forEach((target,i)=>{
    const cx=75+i*140;
    const neighbor=approvedMap(target);
    scene.add.text(cx,347,(neighbor?.name||target).slice(0,17).toUpperCase(),{
      fontFamily:'Pixelify Sans,monospace',fontSize:'8px',color:'#dcf7f0',
      backgroundColor:'#174768',padding:{x:4,y:4}}).setDepth(48).setOrigin(.5);
    scene.add.zone(cx,347,136,25).setDepth(49).setInteractive({useHandCursor:true})
      .setData('torre2-approved-route',target)
      .on('pointerdown',()=>onNavigate(id,target));
  });
  const text=null;
  const back=scene.add.zone(601,20,74,33).setDepth(50)
   .setInteractive({useHandCursor:true}).setData('torre2-approved-exit',true)
   .on('pointerdown',onExit);
  const backLabel=scene.add.text(601,20,'VOLTAR',{fontFamily:'Pixelify Sans,monospace',
   fontSize:'10px',fontStyle:'bold',color:'#ffffff',backgroundColor:'#102b47',padding:{x:7,y:5}})
   .setOrigin(.5).setDepth(49);
  // Only registered original trainer sprites are painted above the approved background.
  if(typeof renderSprite==='function')renderSprite(scene,entry,rect);
  return {ok:true,id,entry,rect,image,zones,neighbors,back,footer,text,backLabel};
}