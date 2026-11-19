/* Torre 2 is an offline game. The 0.76.2 base client opens a mandatory
 * online-account screen (Google/Discord/password) on first launch, which can
 * never connect here. Replace ONLY that mandatory first-launch case with a
 * native "trainer name" screen saved on this device. The optional online
 * account screen, battles, saves and kits stay exactly as in the base client.
 * Refuses to patch if the upstream source changed.
 */
export const TRAINER_NAME_KEY='torre2-trainer-name';
export const TRAINER_GENDER_KEY='torre2-trainer-gender';

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
  'texto(this,ANCHO/2,62,"Escolha seu personagem e seu nome",{tam:12,color:UI.amarillo,borde:4,literal:true}).setOrigin(.5);'+
  'texto(this,ANCHO/2,80,"A campanha é offline e fica salva neste aparelho.",{tam:8,color:UI.suave,literal:true}).setOrigin(.5);'+
  // Boy / girl: the original FireRed overworld sprites (Red / Leaf).
  'let genero="red";try{if(localStorage.getItem("'+TRAINER_GENDER_KEY+'")==="leaf")genero="leaf"}catch{}'+
  'const cartas={};const pintar=()=>{for(const[k,c]of Object.entries(cartas)){const on=k===genero;c.g.clear();'+
  'c.g.fillStyle(0x040c26,1).fillRoundedRect(c.x-53,93,106,90,9);'+
  'c.g.fillStyle(on?0xf8c448:0x3f7ad8,1).fillRoundedRect(c.x-52,94,104,88,8);'+
  'c.g.fillStyle(on?0x2a3f78:0x0f1e4a,1).fillRoundedRect(c.x-49,97,98,82,6);c.t.setColor(on?"#ffd23c":"#ffffff")}};'+
  'for(const[k,id,x,rot]of[["red","red_normal",ANCHO/2-62,"Menino"],["leaf","green_normal",ANCHO/2+62,"Menina"]]){'+
  'const g=this.add.graphics(),key="frlg-npc-"+id;'+
  'const t=texto(this,x,170,rot,{tam:9,color:"#ffffff",borde:3,literal:true}).setOrigin(.5).setDepth(2);cartas[k]={g,x,t};'+
  'const mostrar=()=>{if(!this.sys.isActive()||!this.textures.exists(key))return;const tx=this.textures.get(key);'+
  'if(!tx.has("torre2-front"))tx.add("torre2-front",0,0,0,16,32);tx.setFilter(Phaser.Textures.FilterMode.NEAREST);'+
  'this.add.image(x,160,key,"torre2-front").setOrigin(.5,1).setScale(2).setDepth(1).setData("torre2-gender-sprite",k)};'+
  'if(this.textures.exists(key))mostrar();else{this.load.once("filecomplete-image-"+key,mostrar);this.load.image(key,"assets/ui/frlg/npc/"+id+".png")}'+
  'this.add.zone(x,138,104,88).setInteractive({useHandCursor:true}).setData("torre2-gender",k)'+
  '.on("pointerdown",()=>{genero=k;sfx("seleccion");pintar()})}'+
  'pintar();if(!this.load.isLoading())this.load.start();'+
  'const limpar=v=>String(v||"").replace(/[^\\p{L}\\p{N} ._-]/gu,"").slice(0,12);'+
  'let indo=false;const ir=()=>{if(indo)return;indo=true;'+
  'const nome=limpar(this.torre2Campo.valor).trim()||"Red";'+
  'try{localStorage.setItem("'+TRAINER_NAME_KEY+'",nome);localStorage.setItem("'+TRAINER_GENDER_KEY+'",genero)}catch{}'+
  'red.sinCuentaHoy=true;sfx("seleccion");this.seguir()};'+
  'this.torre2Campo=campoTexto(this,{x:ANCHO/2-110,y:196,w:220,h:28,max:12,placeholder:"Red",'+
  'valor:guardado,mayusculas:false,filtro:limpar,alIntro:ir});'+
  'this.torre2Comecar=botonGrande(this,ANCHO/2,254,200,30,"COMEÇAR",ir,{principal:true});'+
  'this.torre2Campo.foco?.()}';
 return once(cuenta,'create(){const d=this.datos;this.modo=d.modo??"crear";',
  screen+'create(){const d=this.datos;if(d.obligatorio)return this.torre2Nome();this.modo=d.modo??"crear";',
  'account scene');
}

// Campaign: the saved name, or null.
export function readTrainerName(storage=globalThis.localStorage){
 try{return storage?.getItem(TRAINER_NAME_KEY)||null}catch{return null}
}
