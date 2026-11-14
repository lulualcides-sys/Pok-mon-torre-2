/* Preserve the public Alpha 0.71.3 selection scene after upstream added
 * elegir mode and trio portraits. Older Torre 2 scene replacements are NOT
 * compatible; use only the narrow, non-destructive missing-kit guard.
 */
const BASE='init(datos){this.previo=datos?.previo;if(this.previo?.modo==="elegir")this.sys.settings.data={}}create(){';
/* The verified 0.71.3 loader inserts a native PMD preload before create().
 * Accept this exact staged entrypoint as well as untouched upstream code.
 * Unknown preload implementations must still fail closed. */
const PRELOADED=BASE.replace('create(){',
 'preload(){const m=this.registry.get("manifiesto"),ids=new Set(ROSTER.slice(0,8).map(p=>p.dex));for(const d of ["0041","0042"])if(m[d])ids.add(d);this._torre2InitialSelectionForms=soloFormas(m,ids);cargarPMD(this,this._torre2InitialSelectionForms,["Idle"])}create(){')+
 'crearAnimsPMD(this,this._torre2InitialSelectionForms,["Idle"]);';

const ORIGINAL='const h=p.kit[slot];const ky=';
const GUARDED='const h=p.kit?.[slot]??{nombre:"—",tipo:"NORMAL",coste:0,dano:0};const ky=';
export function adaptModernSelection(source,alpha){
 if(alpha!=='0.71.3')return null;
 if(typeof source!=='string' ||
  [BASE,PRELOADED].filter(entry=>source.split(entry).length===2).length!==1 ||
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
