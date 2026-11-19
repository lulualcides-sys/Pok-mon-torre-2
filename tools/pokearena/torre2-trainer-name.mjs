/* Torre 2 is an offline game. The 0.76.2 base client opens a mandatory
 * online-account screen (Google/Discord/password) on first launch, which can
 * never connect here. Replace ONLY that mandatory first-launch case with a
 * native "trainer name" screen saved on this device. The optional online
 * account screen, battles, saves and kits stay exactly as in the base client.
 * Refuses to patch if the upstream source changed.
 */
export const TRAINER_NAME_KEY='torre2-trainer-name';

const once=(source,anchor,replacement,label)=>{
 if(source.split(anchor).length!==2)
  throw Error('Trainer name patch: unexpected '+label+' (base client changed)');
 return source.replace(anchor,replacement);
};

// red.js: a saved Torre 2 trainer name means the account is never required.
export function patchAccountRequirement(red){
 return once(red,'const pideCuenta=()=>!red.ficha&&',
  'const torre2TrainerName=()=>{try{return localStorage.getItem("'+TRAINER_NAME_KEY+'")}catch{return null}};'+
  'const pideCuenta=()=>!torre2TrainerName()&&!red.ficha&&','account requirement');
}

// escenas/cuenta.js: the mandatory case shows the name screen instead.
export function patchAccountScene(cuenta){
 const screen='torre2Nome(){'+
  'cabecera(this,"BEM-VINDO, TREINADOR");this.botonVolver?.mostrar(false);'+
  'let guardado="";try{guardado=localStorage.getItem("'+TRAINER_NAME_KEY+'")||""}catch{}'+
  'texto(this,ANCHO/2,92,"Qual é o seu nome?",{tam:12,color:UI.amarillo,borde:4,literal:true}).setOrigin(.5);'+
  'texto(this,ANCHO/2,112,"A campanha é offline e fica salva neste aparelho.",{tam:8,color:UI.suave,literal:true}).setOrigin(.5);'+
  'const limpar=v=>String(v||"").replace(/[^\\p{L}\\p{N} ._-]/gu,"").slice(0,12);'+
  'let indo=false;const ir=()=>{if(indo)return;indo=true;'+
  'const nome=limpar(this.torre2Campo.valor).trim()||"Red";'+
  'try{localStorage.setItem("'+TRAINER_NAME_KEY+'",nome)}catch{}'+
  'red.sinCuentaHoy=true;sfx("seleccion");this.seguir()};'+
  'this.torre2Campo=campoTexto(this,{x:ANCHO/2-110,y:134,w:220,h:28,max:12,placeholder:"Red",'+
  'valor:guardado,mayusculas:false,filtro:limpar,alIntro:ir});'+
  'this.torre2Comecar=botonGrande(this,ANCHO/2,196,200,30,"COMEÇAR",ir,{principal:true});'+
  'this.torre2Campo.foco?.()}';
 return once(cuenta,'create(){const d=this.datos;this.modo=d.modo??"crear";',
  screen+'create(){const d=this.datos;if(d.obligatorio)return this.torre2Nome();this.modo=d.modo??"crear";',
  'account scene');
}

// Campaign: the saved name, or null.
export function readTrainerName(storage=globalThis.localStorage){
 try{return storage?.getItem(TRAINER_NAME_KEY)||null}catch{return null}
}
