/* Approved Alpha 0.71.3 Arena ("preparar") presentation-only patch.
 * Original P2 source stays available in its immutable rollback tree.
 * Load only the shown fighter's Idle, not its entire evolution family.
 */
const once=(s,before,after,label)=>{
 if(s.split(before).length!==2)throw Error('Arena preview source drift: '+label);
 return s.replace(before,after);
};
export function loadNativeArenaPreviewIdle(original){
 let s=String(original);
 const oldImport='import{atacarEnMenu,precargarLineas,alTerminarCarga,dexAspecto,auraAspecto,encajarSprite,trioMenu}from"../sprites.js";';
 const newImport='import{atacarEnMenu,precargarLineas,alTerminarCarga,dexAspecto,auraAspecto,encajarSprite,trioMenu,cargarPMD,crearAnimsPMD,soloFormas}from"../sprites.js";';
 s=once(s,oldImport,newImport,'approved native sprite import');
 const start='if(!this.anims.exists('+String.fromCharCode(96)+String.fromCharCode(36)+'{dex}-Idle-0'+String.fromCharCode(96)+')){this.__torre2PreviewQueued';
 const stop='c.add(texto(this,52,55,"LOADING...",{tam:7}).setOrigin(.5));return}';
 const a=s.indexOf(start),b=s.indexOf(stop,a);
 if(a<0||b<a||s.indexOf(start,a+1)>=0||
    !s.slice(a,b).includes('precargarLineas(this,[pl.id],[aspecto]);alTerminarCarga(this,()=>'))
  throw Error('Arena preview source drift: original LOADING state');
 const replacement=[
 'if(!this.anims.exists(dex+"-Idle-0")){',
 'this.__torre2PreviewQueued??=new Set();',
 'this.__torre2PreviewFailedAt??=new Map();',
 'const failedAt=this.__torre2PreviewFailedAt.get(dex);',
 'if(!this.__torre2PreviewQueued.has(dex)&&',
 ' (failedAt===undefined||this.time.now-failedAt>8000)){',
 ' const forms=soloFormas(this.registry.get("manifiesto"),new Set([dex]));',
 ' if(!forms[dex]?.anims?.Idle)this.__torre2PreviewFailedAt.set(dex,this.time.now);',
 ' else{',
 ' this.__torre2PreviewQueued.add(dex);',
 ' const complete=()=>{',
 '  if(!this.textures.exists("pmd-"+dex+"-Idle")&&',
 '    !this.__torre2PreviewLooseTried?.has(dex)&&this.scene.isActive()){',
 '    this.__torre2PreviewLooseTried??=new Set();',
 '    this.__torre2PreviewLooseTried.add(dex);',
 '    const idle=forms[dex].anims.Idle;',
 '    this.load.spritesheet("pmd-"+dex+"-Idle","assets/pmd/"+idle.file,',
 '      {frameWidth:idle.fw,frameHeight:idle.fh});',
 '    this.load.once("complete",complete);',
 '    this.time.delayedCall(0,()=>{if(this.scene.isActive()&&!this.load.isLoading())this.load.start()});',
 '    return;',
 '  }',
 '  this.__torre2PreviewQueued.delete(dex);',
 '  if(this.textures.exists("pmd-"+dex+"-Idle"))crearAnimsPMD(this,forms,["Idle"]);',
 '  if(this.anims.exists(dex+"-Idle-0"))this.__torre2PreviewFailedAt.delete(dex);',
 '  else this.__torre2PreviewFailedAt.set(dex,this.time.now);',
 '  if(!this.scene.isActive())return;',
 '  for(const card of this.tarjetas||[])',
 '   if(this.plazas[card.i]?.id===pl.id)card.mostrado=null;',
 '  this.refrescar();',
 ' };',
 ' const count=cargarPMD(this,forms,["Idle"]);',
 ' if(count||this.load.isLoading()){',
 '  this.load.once("complete",complete);',
 '  if(count&&!this.load.isLoading())this.load.start();',
 ' }else this.time.delayedCall(0,complete);',
 ' }',
 '}',
 'c.add(texto(this,52,55,',
 ' this.__torre2PreviewFailedAt.has(dex)?"SPRITE UNAVAILABLE":"LOADING...",',
 ' {tam:7}).setOrigin(.5));return}'
 ].join('');
 return s.slice(0,a)+replacement+s.slice(b+stop.length);
}
