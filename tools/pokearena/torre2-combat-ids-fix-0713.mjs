/* Alpha 0.71.3 official source regression in Combate.preload():
 * "ids" was renamed to "dexs" (Set) but one Eevee check was left behind.
 * This ReferenceError disables the entire Arena/League combat scene.
 * Patch only the exact known upstream expression; fail closed on drift.
 */
export function fixNativeBattleIds0713(source,alpha){
 if(alpha!=='0.71.3')return source;
 if(typeof source!=='string'||!source.includes('class Combate extends Phaser.Scene')||
    !source.includes('const dexs=')||
    !source.includes('soltarPMD(this,m,dexs);'))
  throw Error('Unrecognized verified Alpha 0.71.3 combat preload');
 const from='if(!d.torre2&&d.modo!=="online"&&ids.includes("eevee"))';
 const to='if(!d.torre2&&d.modo!=="online"&&dexs.has("0133"))';
 if(source.split(from).length!==2)
  throw Error('Eevee preload ids->dexs regression not present exactly once');
 return source.replace(from,to);
}
