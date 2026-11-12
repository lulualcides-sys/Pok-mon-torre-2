// The upstream can omit its decorative title JPEG. The title scene
// already has its Graphics/halo fallback when ui-portada is absent.
// Never replace native Pokemon sprites or approved visual assets.
export const OPTIONAL_TITLE='assets/ui/portada/dia.jpg';

export function jpegLooksValid(bytes) {
  return !!bytes&&bytes.length>=1024&&bytes[0]===0xff&&bytes[1]===0xd8&&
    bytes[bytes.length-2]===0xff&&bytes[bytes.length-1]===0xd9;
}

export function omitUnavailableTitleLoad(source,hasVerifiedTitle){
  if(typeof source!=='string'||source.length<20)throw Error('Invalid native loader');
  if(hasVerifiedTitle)return source;
  const match=source.match(/this\.load\.image\("ui-portada",[^;]+;/g);
  if(!match||match.length!==1||!match[0].includes('assets/ui/portada/')||
     !match[0].includes('fondoPortada'))
    throw Error('Unknown upstream title preload; cannot suppress the missing image safely');
  return source.replace(match[0],
    '/* Optional decorative title JPEG unavailable. Native Title uses its existing ui-halo fallback. */');
}
