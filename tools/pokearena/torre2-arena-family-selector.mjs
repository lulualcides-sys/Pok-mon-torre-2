/* Arena "preparar" selector only. Never change native P2 combat or saves. */
export function adaptArenaFamilySelectorSource(source){
 const start='const LW=44,LH=44,LG=2;',end='export{POR_FILA,SelectorPokemon};';
 const a=source.indexOf(start),b=source.indexOf(end,a);
 if(a<0||b<a||source.indexOf(start,a+1)>=0||source.slice(b+end.length).trim())
  throw Error('Unknown native SelectorPokemon; refusing unsafe patch');
 const imports='import{JOHTO_100_ROWS}from"./torre2/johto-100-data.js";'+
  'import{LEVEL_EVOLUTIONS}from"./torre2/progression.js";'+
  'import{buildPokedexFamilies}from"./torre2/pokedex-families.js";'+
  'import{retratoA}from"./sprites.js";';
 const replacement=String.raw`;

const POR_FILA=4,FILAS=2,PAGE_SIZE=8,FORM_PAGE=4;
const LW=46,LG=8,SW=408,SH=336,SX=Math.round((ANCHO-SW)/2),SY=Math.round((ALTO-SH)/2);
const GX=Math.round((ANCHO-(POR_FILA*(LW+LG)-LG))/2);
class SelectorPokemon{
 constructor(escena,{titulo="CHOOSE A POKÉMON",color=16303176,actual=null,
  marcas=[],azar=null,bloqueado=null,aspectos=false,alElegir,alCerrar,capa=50}){
  Object.assign(this,{e:escena,color,capa,marcas,azar,bloqueado,aspectos,alElegir,alCerrar,
   abierto:true,botones:[],versiones:[],objs:[],pageObjs:[],formObjs:[],celdas:[],
   portraitQueue:new Map(),info:null,previewOnly:false,formaPage:0,formaFocus:0});
  this.families=buildPokedexFamilies(ROSTER,JOHTO_100_ROWS,LEVEL_EVOLUTIONS);
  this.order=this.families.order;this.actual=ROSTER.findIndex(p=>p.id===actual);
  this.foco=Math.max(0,this.actual);
  this.root=this.families.rootIndexForIndex[this.foco]??this.order[0];
  this.page=Math.max(0,Math.floor(this.order.indexOf(this.root)/PAGE_SIZE));
  iniciarSonido();sfx("seleccion");
  const add=o=>(this.objs.push(o),o),C=capa;
  const frame=add(escena.add.graphics().setDepth(C));
  frame.fillStyle(0,.8).fillRect(VISTA.x,VISTA.y,VISTA.w,VISTA.h);
  marco(frame,SX,SY,SW,SH,"panel",{borde:color});bandaPanel(frame,SX,SY,SW,color);
  add(escena.add.zone(VISTA.x+VISTA.w/2,VISTA.y+VISTA.h/2,
   VISTA.w,VISTA.h).setDepth(C).setInteractive().on("pointerdown",()=>this.cerrar()));
  add(escena.add.zone(SX+SW/2,SY+SH/2,SW,SH).setDepth(C+1).setInteractive());
  add(texto(escena,SX+8,SY+5,titulo,{tam:9,color:"#081e36"}).setDepth(C+2));
  this.border=add(escena.add.graphics().setDepth(C+3));
  this.pageLabel=add(texto(escena,ANCHO/2,SY+157,"",
   {tam:9,color:"#ffdfa2"}).setOrigin(.5).setDepth(C+3));
  this.formLabel=add(texto(escena,ANCHO/2,SY+279,"",
   {tam:8,color:"#a8c8e3"}).setOrigin(.5).setDepth(C+3));
  this.makeButton(SX+26,SY+155,"◀",()=>this.turn(-1));
  this.makeButton(SX+SW-26,SY+155,"▶",()=>this.turn(1));
  this.makeButton(SX+26,SY+278,"◀",()=>this.turnForm(-1));
  this.makeButton(SX+SW-26,SY+278,"▶",()=>this.turnForm(1));
  this.makeButton(SX+79,SY+308,"CHOOSE",()=>this.elegir());
  if(azar)this.makeButton(SX+205,SY+308,"RANDOM",()=>this.alAzar());
  this.makeButton(SX+SW-72,SY+308,"CLOSE",()=>this.cerrar());
  this.pintar();
 }
 makeButton(x,y,label,fn){
  const b=boton(this.e,x,y,label,()=>{if(this.abierto)fn()},
   {altoZona:26,anchoExtra:12});
  b.capa(this.capa+4);this.botones.push(b);return b;
 }
 clear(key){for(const o of this[key])if(o?.active)o.destroy();this[key]=[]}
 addPortrait(img,dex,size){
  const key="retrato-"+dex,scene=this.e;
  const show=()=>{
   if(!this.abierto||!img.active||!scene.textures.exists(key))return;
   img.setTexture(retratoA(scene,dex,size-4))
    .setDisplaySize(size-4,size-4).setVisible(true);
  };
  if(scene.textures.exists(key)){show();return}
  img.setVisible(false);
  if(!this.portraitQueue.has(key)){
   this.portraitQueue.set(key,[]);
   scene.load.once("filecomplete-image-"+key,()=>{
    const callbacks=this.portraitQueue.get(key)||[];
    this.portraitQueue.delete(key);for(const cb of callbacks)cb();
   });
   scene.load.once("loaderror",file=>{
    if(file.key===key)this.portraitQueue.delete(key);
   });
   scene.load.image(key,"assets/pmd/"+dex+"/portrait.png");
  }
  this.portraitQueue.get(key)?.push(show);
  if(!scene.load.isLoading())scene.load.start();
 }
 members(root){return this.families.membersByRoot.get(root)||[root]}
 forms(root){
  const out=[],seen=new Set(),members=this.members(root);
  const add=(p,index)=>{
   const dex=String(p?.dex||"");if(!dex||seen.has(dex))return;
   seen.add(dex);
   out.push({dex,name:String(p.nombre||p.id||"").toUpperCase(),index});
  };
  add(ROSTER[root],root);
  for(const i of members)if(i!==root)add(ROSTER[i],i);
  for(const i of members)for(const e of ROSTER[i]?.evoluciones||[]){
   const k=ROSTER.findIndex(p=>Number(p.dex)===Number(e.dex));
   add(e,k<0?null:k);
  }
  return out;
 }
 selectFamily(root){
  if(root===this.root)return;
  this.root=root;this.foco=root;this.formaFocus=0;this.formaPage=0;
  this.previewOnly=false;
  this.page=Math.floor(this.order.indexOf(root)/PAGE_SIZE);
  sfx("seleccion");this.pintar();
 }
 renderGrid(){
  this.clear("pageObjs");this.celdas=[];
  this.order.slice(this.page*PAGE_SIZE,(this.page+1)*PAGE_SIZE)
   .forEach((index,j)=>{
    const p=ROSTER[index],x=GX+j%POR_FILA*(LW+LG),
     y=SY+26+Math.floor(j/POR_FILA)*62;
    const cas=casillaRetrato(this.e,x,y,LW,p.dex);
    cas.g.setDepth(this.capa+2);cas.img.setDepth(this.capa+2);
    this.pageObjs.push(cas.g,cas.img);
    this.addPortrait(cas.img,p.dex,LW);
    const t=texto(this.e,x+LW/2,y+47,
     String(p.nombre||p.id).toUpperCase().slice(0,8),
     {tam:7,color:"#d9eafa"}).setOrigin(.5,0).setDepth(this.capa+3);
    this.pageObjs.push(t);
    const marks=this.e.add.graphics().setDepth(this.capa+3);
    let off=2;
    for(const q of this.marcas)if(this.members(index).some(
     m=>ROSTER[m].id===q.id)){
     marks.fillStyle(q.color,1);marks.fillRect(x+off,y+LW-6,6,4);off+=8;
    }
    this.pageObjs.push(marks);
    const zone=this.e.add.zone(x+LW/2,y+LW/2,LW,LW)
     .setDepth(this.capa+4).setInteractive({useHandCursor:true})
     .on("pointerdown",()=>this.selectFamily(index));
    this.pageObjs.push(zone);
    this.celdas.push({p,x,y,w:LW,h:LW,id:p.id,zone,img:cas.img,
     objects:[cas.g,cas.img,t,marks,zone]});
   });
 }
 renderForms(){
  this.clear("formObjs");
  const forms=this.forms(this.root);
  this.formaPage=Math.min(this.formaPage,
   Math.max(0,Math.ceil(forms.length/FORM_PAGE)-1));
  const from=this.formaPage*FORM_PAGE;
  forms.slice(from,from+FORM_PAGE).forEach((f,i)=>{
   const size=36,x=ANCHO/2-100+i*54,y=SY+214;
   const cas=casillaRetrato(this.e,x,y,size,f.dex);
   cas.g.setDepth(this.capa+2);cas.img.setDepth(this.capa+2);
   this.formObjs.push(cas.g,cas.img);this.addPortrait(cas.img,f.dex,size);
   const t=texto(this.e,x+size/2,y+37,f.name.slice(0,7),
    {tam:7,color:f.index===null?"#819bb4":"#d8e9fb"})
    .setOrigin(.5,0).setDepth(this.capa+3);
   this.formObjs.push(t);
   if(from+i===this.formaFocus){
    const frame=this.e.add.graphics().setDepth(this.capa+3);
    marcoCasilla(frame,x,y,size,0xffd25f,{grueso:true});
    this.formObjs.push(frame);
   }
   const zone=this.e.add.zone(x+size/2,y+size/2,size,size)
    .setDepth(this.capa+4).setInteractive({useHandCursor:true})
    .on("pointerdown",()=>{
     this.formaFocus=from+i;
     this.previewOnly=f.index===null;
     if(this.previewOnly){this.pintar();return}
     this.foco=f.index;this.elegir(f.index);
    });
   this.formObjs.push(zone);
  });
  this.formLabel.setText("FORMAS "+(from+1)+"–"+
   Math.min(from+FORM_PAGE,forms.length)+"/"+forms.length+
   (this.previewOnly?" · EVOLUI NA BATALHA":" · TOQUE PARA ESCOLHER"));
 }
 pintar(){
  if(!this.abierto)return;
  this.versiones.forEach(b=>b.destruir());this.versiones=[];
  this.renderGrid();this.renderDetails();this.renderForms();
  this.pageLabel.setText("FAMÍLIAS · "+(this.page+1)+"/"+
   Math.ceil(this.order.length/PAGE_SIZE));
 }
 renderDetails(){
  this.info?.destroy(true);
  this.border.clear();
  for(const c of this.celdas)marcoCasilla(
   this.border,c.x,c.y,LW,c.id===ROSTER[this.root].id?0xffd25f:
    c.id===ROSTER[this.actual]?.id?this.color:0x587da7,
   {grueso:c.id===ROSTER[this.root].id});
  const p=ROSTER[this.root],C=this.capa;
  const info=this.e.add.container(0,0).setDepth(C+3);
  this.info=info;
  info.add(texto(this.e,SX+9,SY+184,p.nombre||p.id,
   {tam:13,color:"#ffe2a3"}));
  info.add(texto(this.e,SX+9,SY+203,
   "FAMÍLIA · "+this.forms(this.root).length+" FORMAS · "+(p.tipos||[]).join("/"),
   {tam:8,color:"#adc9e4"}));
  if(this.previewOnly)info.add(texto(this.e,SX+225,SY+203,
   "EVOLUI NA BATALHA",{tam:8,color:"#ffd48a"}));
  const current=ROSTER[this.foco];
  if(this.aspectos&&current&&!this.bloqueado?.(current.id)){
   const opts=aspectosElegibles(current.id)||[];
   if(opts.length>1){
    const b=boton(this.e,SX+SW-49,SY+192,"SKIN ▶",()=>{
     const k=opts.indexOf(aspectoDe(current.id));
     elegirAspecto(current.id,opts[(k+1)%opts.length]);
     this.renderDetails();
    },{altoZona:22});
    b.capa(C+4);this.versiones.push(b);
   }
  }
 }
 turn(delta){
  const count=Math.ceil(this.order.length/PAGE_SIZE);
  if(!count)return;
  this.page=(this.page+delta+count)%count;
  this.root=this.order[this.page*PAGE_SIZE];
  this.foco=this.root;this.formaFocus=0;this.formaPage=0;
  this.previewOnly=false;sfx("seleccion");this.pintar();
 }
 turnForm(delta){
  const count=Math.ceil(this.forms(this.root).length/FORM_PAGE);
  if(count<2)return;
  this.formaPage=(this.formaPage+delta+count)%count;
  this.formaFocus=this.formaPage*FORM_PAGE;
  this.previewOnly=false;this.pintar();
 }
 mover(d){
  if(!this.order.length)return;
  const pos=this.order.indexOf(this.root),next=
   (pos+d%this.order.length+this.order.length)%this.order.length;
  this.selectFamily(this.order[next]);
 }
 _notice(value){
  this.aviso?.destroy();
  this.aviso=texto(this.e,SX+6,SY+291,value,
   {tam:8,color:"#ff7f7f"}).setDepth(this.capa+6);
  this.objs.push(this.aviso);
 }
 elegir(k=this.foco){
  if(!this.abierto)return;
  if(this.previewOnly){this._notice("EVOLUÇÃO DISPONÍVEL DURANTE A BATALHA");return}
  const p=ROSTER[k];if(!p)return;
  if(this.bloqueado?.(p.id)){
   sfx("energiaVacia");
   this._notice("LOCKED · DEFEAT IT IN THE LEAGUE TO UNLOCK IT");
   return;
  }
  this.cerrar(false,true);sfx("confirmar");this.alElegir?.(p.id,k);
 }
 alAzar(){
  const id=this.azar?.(),index=ROSTER.findIndex(p=>p.id===id);
  if(index>=0)this.elegir(index);
 }
 cerrar(sonido=true,elegido=false){
  if(!this.abierto)return;
  this.abierto=false;this.clear("pageObjs");this.clear("formObjs");
  this.info?.destroy(true);
  for(const b of this.botones)b.destruir();
  for(const b of this.versiones)b.destruir();
  for(const o of this.objs)if(o?.active)o.destroy();
  if(sonido)sfx("seleccion");this.alCerrar?.(elegido);
 }
}
export{POR_FILA,SelectorPokemon};
 return source.slice(0,a)+imports+replacement;
}
