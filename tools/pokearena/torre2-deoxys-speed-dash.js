/* Original Torre 2 compatibility for P2 0.65.7 Speed Deoxys.
 * REA verified official note: Speed Deoxys may dodge DURING its ULT.
 *
 * The native P2 ability dispatcher already supports action.permite=['esp']
 * and the native dash keeps an action alive when 'esp' is permitted.
 * Add only that semantic permission, without changing attack renderers,
 * native collision/dodge logic, approved cooldowns, sprites or any kits.
 *
 * Active exclusively in Arena, never in FireRed Kanto campaign.
 */
export function permitSpeedDeoxysUltimateDash(fighter){
 if(!fighter || fighter.ko || fighter.escena?.datos?.torre2 ||
    fighter.def?.id!=='deoxys' ||
    fighter.alt?.nombre!=='SPEED DEOXYS')return false;
 const action=fighter.accion;
 if(!action || action.slot!=='e' || action.bloquea!==true)return false;
 const previous=action.permite;
 // Only touch recognized native permission arrays. Unrecognized native
 // changes fail closed, not with a risky conversion.
 if(previous!=null && !Array.isArray(previous))return false;
 if(previous?.includes('esp'))return false;
 action.permite=[...(previous||[]),'esp'];
 return true;
}
/** Install as a single idempotent, opt-in Arena-only update hook. */
export function installSpeedDeoxysUltimateDash(Luchador){
 const proto=Luchador?.prototype;
 if(typeof proto?.update!=='function')
  throw Error('Speed Deoxys requires recognized native fighter.update');
 if(proto.__torre2SpeedDeoxysDashInstalled)return false;
 const original=proto.update;
 proto.update=function(...args){
  // Before the existing native input handling sees ESP, allow the ULT
  // to continue while the native dash executes. Nothing else is patched.
  permitSpeedDeoxysUltimateDash(this);
  return original.apply(this,args);
 };
 Object.defineProperty(proto,'__torre2SpeedDeoxysDashInstalled',{
  value:true,enumerable:false,configurable:false,writable:false
 });
 return true;
}
