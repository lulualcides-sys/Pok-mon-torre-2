/* Pokémon Torre 2 — Phaser image-backed navigation over user-approved pixel art.
 * Isolated presentation layer; never modifies campaign saves or battle progress.
 * Do not enable until matching optimized images are installed in the repository.
 */
import {approvedMap,approvedMapNeighbours,approvedPointToScreen} from './torre2-approved-maps-atlas.js';

// Explicit off until the actual approved WebP files exist in GitHub.
export const APPROVED_MAP_ASSETS_READY = false;
export const MAP_CANVAS = Object.freeze({x:0,y:0,width:640,height:360});
export const mapTextureKey = id => 'torre2-approved-map-'+id;

// Pure list of obsolete approved background textures. Limit mobile WebGL
// residency without changing external PMD sprites, HUD or shared FRLG maps.
export function staleApprovedMapTextureKeys(textureKeys,keepIds=[]){
 const keep=new Set(keepIds.map(mapTextureKey));
 return (textureKeys||[]).filter(key=>{
  if(typeof key!=='string'||!key.startsWith('torre2-approved-map-')||
     keep.has(key))return false;
  return !!approvedMap(key.slice('torre2-approved-map-'.length));
 });
}
export function pruneApprovedMapTextures(scene,keepIds=[]){
 if(!APPROVED_MAP_ASSETS_READY||!scene?.textures?.getTextureKeys)return 0;
 const keys=staleApprovedMapTextureKeys(scene.textures.getTextureKeys(),keepIds);
 for(const key of keys)scene.textures.remove(key);
 return keys.length;
}

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

const overlaps=(a,b)=>Math.abs(a.x-b.x)<(a.width+b.width)/2&&Math.abs(a.y-b.y)<(a.height+b.height)/2;
const bounds=(b,r)=>b.x-b.width/2>=r.x&&b.x+b.width/2<=r.x+r.width&&
 b.y-b.height/2>=r.y&&b.y+b.height/2<=r.y+r.height;

/**
 * Pure preflight, before any Phaser object is allocated. Unsafe art hotspots
 * remain unclickable until their positions are reviewed against the PNG.
 * Positions use logical 640x360 coordinates; Phaser scales the entire scene.
 */
export function planApprovedMapOverlays(entry,rect,neighbors=[]){
 const hotspots=[];
 for(const h of entry.hotspots||[]){
  if(h.validated!=='visual')continue;
  const r=approvedPointToScreen(h,rect);
  const b={id:h.id,x:r.x,y:r.y,width:Math.max(20,r.width),height:Math.max(20,r.height)};
  if(!bounds(b,rect))return {ok:false,reason:'hotspot-out-of-bounds',ids:[h.id]};
  const conflict=hotspots.find(prev=>overlaps(prev,b));
  if(conflict)return {ok:false,reason:'hotspot-overlap',ids:[conflict.id,h.id]};
  hotspots.push(b);
 }
 // Five connections exist at Cerulean, Celadon and Fuchsia. Never hide the fifth.
 const navTargets=neighbors.slice();
 if(navTargets.length>5)return {ok:false,reason:'too-many-neighbors'};
 const fullBarY=navTargets.length?[347,13].find(y=>hotspots.every(h=>!overlaps(h,{x:320,y,width:636,height:25}))):null;
 const footerY=Number.isFinite(fullBarY)?fullBarY:null;
 const navWidth=Math.min(130,(636-10)/Math.max(1,navTargets.length)-4);
 let navBoxes=navTargets.map((_,i)=>({
  x:320+(i-(navTargets.length-1)/2)*(navWidth+4),y:footerY,width:navWidth,height:25
 }));
 if(navTargets.length&&footerY===null){
  // A wide bar obscures Fuchsia's northern Safari entrance and southern exit.
  // Deterministic compact chips retain every connection without touching either.
  const candidates=[];
  for(const y of [347,13,314,46,281,79,248,112,215,145,180])
   for(const x of [66,574,190,450,320])
    candidates.push({x,y,width:110,height:23});
  navBoxes=[];
  for(const box of candidates){
   if(!bounds(box,MAP_CANVAS)||hotspots.some(h=>overlaps(h,box))||
      navBoxes.some(prev=>overlaps(prev,box)))continue;
   navBoxes.push(box);
   if(navBoxes.length===navTargets.length)break;
  }
  if(navBoxes.length!==navTargets.length)return {ok:false,reason:'navigation-overlap'};
 }
 const backCandidates=[[601,20],[39,20],[601,314],[39,314]];
 const back=backCandidates.find(([x,y])=>hotspots.every(h=>!overlaps(h,{x,y,width:74,height:33}))&&
  navBoxes.every(b=>!overlaps(b,{x,y,width:74,height:33}))&&
  (footerY===null||!overlaps({x,y,width:74,height:33},{x:320,y:footerY,width:636,height:25})));
 if(!back)return {ok:false,reason:'back-button-overlap'};
 return {ok:true,hotspots,navTargets,navBoxes,footerY,backX:back[0],backY:back[1]};
}

export function renderApprovedMap(scene,id,{
  onExit=()=>{},onHotspot=()=>{},onNavigate=()=>{},isUnlocked=()=>false,
  onLocked=()=>{},showHitAreas=false,renderSprite=null,
  resolveHotspots=null,artNavigation=false
}={}) {
  const entry=approvedMap(id),texture=mapTextureKey(id);
  if(!entry)return {ok:false,reason:'unknown-map',id};
  if(!scene?.textures?.exists?.(texture))return {ok:false,reason:'asset-not-installed',id};
  // Object-fit: contain, preserve the original aspect ratio and pixel integrity.
  const source=scene.textures.get(texture).getSourceImage();
  const sourceW=source?.width,sourceH=source?.height;
  if(!Number.isFinite(sourceW)||!Number.isFinite(sourceH)||sourceW<=0||sourceH<=0)
   return {ok:false,reason:'invalid-texture-size',id};
  const fit=Math.min(MAP_CANVAS.width/sourceW,MAP_CANVAS.height/sourceH);
  const rect={x:(640-sourceW*fit)/2,y:(360-sourceH*fit)/2,
   width:sourceW*fit,height:sourceH*fit};
  const neighbors=approvedMapNeighbours(id).filter(target=>isUnlocked(id,target));
  // A few audited city maps already have route signs painted on the art.
  // Their interactive hit zones replace the otherwise intrusive footer bar.
  const hotspots=typeof resolveHotspots==='function'?resolveHotspots(entry):entry.hotspots;
  const layout=planApprovedMapOverlays({...entry,hotspots},rect,artNavigation?[]:neighbors);
  if(!layout.ok)return {...layout,id};
  const image=scene.add.image(320,180,texture)
   .setOrigin(.5,.5).setDisplaySize(rect.width,rect.height).setDepth(1);
  const zones=[];
  const addZone=(label,p,callback,kind)=>{
   const r=p;
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
  for(const h of layout.hotspots)addZone(h.id,h,()=>onHotspot(id,h.id),h.id);
  // Navigation is absent when nothing is unlocked: never paint a false
  // "blocked" footer over the approved artwork or its exit hotspot.
  const footer=layout.footerY===null?null:
   scene.add.rectangle(320,layout.footerY,636,25,0x061b2e,.90).setDepth(47);
  layout.navTargets.forEach((target,i)=>{
    const nav=layout.navBoxes[i],cx=nav.x;
    const neighbor=approvedMap(target);
    scene.add.text(cx,nav.y,(neighbor?.name||target).slice(0,17).toUpperCase(),{
      fontFamily:'Pixelify Sans,monospace',fontSize:'8px',color:'#dcf7f0',
      backgroundColor:'#174768',padding:{x:4,y:4}}).setDepth(48).setOrigin(.5);
    scene.add.zone(cx,nav.y,nav.width,nav.height).setDepth(49).setInteractive({useHandCursor:true})
      .setData('torre2-approved-route',target)
      .on('pointerdown',(_pointer,_x,_y,e)=>{
       e?.stopPropagation?.();
       if(isUnlocked(id,target))onNavigate(id,target);
       else onLocked(id,target);
      });
  });
  const text=null;
  const back=scene.add.zone(layout.backX,layout.backY,74,33).setDepth(50)
   .setInteractive({useHandCursor:true}).setData('torre2-approved-exit',true)
   .on('pointerdown',(_pointer,_x,_y,e)=>{e?.stopPropagation?.();onExit();});
  const backLabel=scene.add.text(layout.backX,layout.backY,'VOLTAR',{fontFamily:'Pixelify Sans,monospace',
   fontSize:'10px',fontStyle:'bold',color:'#ffffff',backgroundColor:'#102b47',padding:{x:7,y:5}})
   .setOrigin(.5).setDepth(49);
  // Only registered original trainer sprites are painted above the approved background.
  if(typeof renderSprite==='function')renderSprite(scene,entry,rect);
  return {ok:true,id,entry,rect,image,zones,neighbors,back,footer,text,backLabel};
}