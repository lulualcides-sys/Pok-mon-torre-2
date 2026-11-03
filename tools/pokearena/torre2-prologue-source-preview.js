/* T60 — actual Phaser source-map preview (QA ONLY).
 * The 60 approved WebPs and all saved campaign state stay untouched.
 */
import {PROLOGUE_REFERENCE_SHEETS,validatePrologueReferenceSheet} from './torre2-prologue-reference-sheets.js';
export const REFERENCE_BASE='assets/ui/kanto-reference-prologue/';
export const PREVIEW_VIEWPORT=Object.freeze({x:0,y:0,width:640,height:360});
export const prologueReferenceKey=id=>'torre2-original-reference-'+id;
export const sourceSheet=id=>PROLOGUE_REFERENCE_SHEETS.find(s=>s.id===id)||null;
export function sourceLayout(sheet,viewport=PREVIEW_VIEWPORT){
 if(!sheet||validatePrologueReferenceSheet(sheet)!==true)throw TypeError('Not a signed source sheet');
 if(!viewport||![viewport.x,viewport.y,viewport.width,viewport.height].every(Number.isFinite)||
    viewport.width<=0||viewport.height<=0)throw RangeError('Invalid viewport');
 const scale=Math.min(viewport.width/sheet.crop.width,viewport.height/sheet.crop.height);
 const width=sheet.crop.width*scale,height=sheet.crop.height*scale;
 return Object.freeze({
  x:viewport.x+(viewport.width-width)/2,
  y:viewport.y+(viewport.height-height)/2,
  width,height,scale,frame:sheet.crop,
  proportionsPreserved:Math.abs(width/height-sheet.crop.width/sheet.crop.height)<1e-9
 });
}
export function preloadSourceSheet(scene,id){
 if(!sourceSheet(id)||!scene?.load||!scene?.textures||scene.textures.exists(prologueReferenceKey(id)))return false;
 scene.load.image(prologueReferenceKey(id),REFERENCE_BASE+id+'.png');
 return true;
}
export function showSourceSheetPhaser(scene,id){
 const sheet=sourceSheet(id),key=prologueReferenceKey(id);
 if(!sheet||!scene?.textures||!scene?.add)return {ok:false,reason:'invalid-source'};
 if(!scene.textures.exists(key))return {ok:false,reason:'texture-not-loaded'};
 const texture=scene.textures.get(key),source=texture.getSourceImage();
 if(source?.width!==sheet.sourceWidth||source?.height!==sheet.sourceHeight)
  return {ok:false,reason:'dimension-mismatch'};
 if(!texture.has('exterior'))
  texture.add('exterior',0,sheet.crop.x,sheet.crop.y,sheet.crop.width,sheet.crop.height);
 const rect=sourceLayout(sheet);
 const picture=scene.add.image(rect.x+rect.width/2,rect.y+rect.height/2,key,'exterior')
  .setOrigin(.5).setDisplaySize(rect.width,rect.height).setDepth(1);
 picture.setData('torre2-reference-preview',id);
 return {ok:true,id,rect,picture,sourceSha256:sheet.sha256,interactive:false};
}
