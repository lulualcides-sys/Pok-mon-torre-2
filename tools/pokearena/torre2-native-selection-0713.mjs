/* Preserve the public Alpha 0.71.3 selection scene after upstream added
 * elegir mode and trio portraits. Older Torre 2 scene replacements are NOT
 * compatible; use only the narrow, non-destructive missing-kit guard.
 */
const BASE='init(datos){this.previo=datos?.previo;if(this.previo?.modo==="elegir")this.sys.settings.data={}}create(){';
const ORIGINAL='const h=p.kit[slot];const ky=';
const GUARDED='const h=p.kit?.[slot]??{nombre:"—",tipo:"NORMAL",coste:0,dano:0};const ky=';
export function adaptModernSelection(source,alpha){
 if(alpha!=='0.71.3')return null;
 if(typeof source!=='string' ||
  !source.includes(BASE) ||
  !source.includes('trioMenu') ||
  !source.includes('ponerRetratoA') ||
  !source.includes('const MODOS=[{id:"cpu",nombre:"VS CPU"}') ||
  !source.includes('{id:"versus",nombre:"2 PLAYERS"}') ||
  !source.includes('{id:"entreno",nombre:"TRAINING"}') ||
  !source.includes('class Seleccion extends Phaser.Scene'))
  throw Error('Unrecognized native Alpha 0.71.3 selection scene');
 const oldCount=source.split(ORIGINAL).length-1;
 const newCount=source.split(GUARDED).length-1;
 if(oldCount===1&&newCount===0)return source.replace(ORIGINAL,GUARDED);
 if(oldCount===0&&newCount===1)return source;
 throw Error('Ambiguous or missing native selection-kit slot');
}
