/* Preserve the official sudden-death HP rule introduced in Alpha 0.71.3.
 * Additional Arena-only poison healing exemption applies exclusively to
 * Torre2-added species. Reject unrecognized regenerative conditions.
 */
const LEGACY='!this.est.enfermo&&!this.escena.datos?.torre2';
const MODERN='!this.est.enfermo&&!this.escena.muerteSubita&&!this.escena.datos?.torre2';
const EXTRA='!(this.def?.torre2ArenaAdded===true&&!this.escena.entreno&&this.est.veneno)';
export function patchNativePoisonRegen(source,alpha){
 const current=alpha==='0.71.3'?MODERN:alpha==='0.70.0'?LEGACY:null;
 if(!current||typeof source!=='string'||source.split(current).length!==2||
    !source.includes('REGLAS.curaTras')||!source.includes('this.ultimoDano'))
  throw Error('Unrecognized official native poison healing condition');
 return source.replace(current,
  current.replace('!this.est.enfermo','!this.est.enfermo&&'+EXTRA));
}
