/** Native Alpha 0.71.3 picker: fetch only the visible 8 portraits
 * and Idle animations through the official pack router. The old selection
 * adapter used direct unindexed PNG URLs and left Zubat/Golbat invisible.
 * Preserve the preapproved ranked/challenge locks and older clients.
 */
const add=(s,a,b)=>{if(s.split(a).length!==2)throw Error('Unrecognized Alpha 0.71.3 selection loader anchor: '+a.slice(0,70));return s.replace(a,b)};
const START='class Seleccion extends Phaser.Scene{constructor(){super("seleccion")}init(datos){this.previo=datos?.previo;if(this.previo?.modo==="elegir")this.sys.settings.data={}}create(){';
const PAGE=`torre2LoadPortraitPage(page){
 this.__torre2PagePending??=new Set();
 const cards=this.casillas.filter(c=>c.page===page);
 const forms=soloFormas(this.registry.get("manifiesto"),new Set(cards.map(c=>c.p.dex)));
 const apply=()=>{for(const c of cards){
  const key="retrato-"+c.p.dex;
  if(this.textures.exists(key))c.img.setTexture(retratoA(this,c.p.dex,TW-4)).setDisplaySize(TW-4,TW-4);
  c.img.setVisible(c.page===this.torre2Page&&this.textures.exists(key));
 }};
 if(this.__torre2PagePending.has(page)){apply();return;}
 const need=cards.some(c=>!this.textures.exists("retrato-"+c.p.dex)||!this.anims.exists(c.p.dex+"-Idle-2"));
 if(!need){apply();return;}
 this.__torre2PagePending.add(page);
 const finish=()=>{
  this.__torre2PagePending.delete(page);
  crearAnimsPMD(this,forms,["Idle"]);
  if(!this.scene.isActive())return;
  apply();
 };
 const count=cargarPMD(this,forms,["Idle"]);
 if(count||this.load.isLoading()){
  this.load.once("complete",finish);
  if(count&&!this.load.isLoading())this.load.start();
 }else finish();
}`;
export function loadNativeSelectionPage0713(source,alpha){
 if(alpha!=='0.71.3')return source;
 if(typeof source!=='string'||!source.includes('torre2LoadPortraitPage(page){')||
  !source.includes('this.torre2PageLabel?.setText(')||
  !source.includes('const bloqueado=this.encargo?')||
  !source.includes('trioMenu'))
  throw Error('Unrecognized modern Alpha 0.71.3 selection pagination');
 let s=add(source,
  'import{atacarEnMenu,precargarLineas,alTerminarCarga,dexAspecto,auraAspecto,ponerRetratoA,encajarSprite,retratoA,trioMenu}from"../sprites.js";',
  'import{atacarEnMenu,precargarLineas,alTerminarCarga,dexAspecto,auraAspecto,ponerRetratoA,encajarSprite,retratoA,trioMenu,cargarPMD,crearAnimsPMD,soloFormas}from"../sprites.js";');
 s=add(s,START,START.replace('create(){',
  'preload(){const m=this.registry.get("manifiesto"),ids=new Set(ROSTER.slice(0,8).map(p=>p.dex));for(const d of ["0041","0042"])if(m[d])ids.add(d);this._torre2InitialSelectionForms=soloFormas(m,ids);cargarPMD(this,this._torre2InitialSelectionForms,["Idle"])}create(){')+
  'crearAnimsPMD(this,this._torre2InitialSelectionForms,["Idle"]);');
 const start=s.indexOf('torre2LoadPortraitPage(page){');
 const end=s.indexOf('refrescar(){this.torre2Page=',start);
 if(start<0||end<0||end<=start||end-start>2500)throw Error('Unexpected older selection direct-image loader');
 const old=s.slice(start,end);
 if(!old.includes('this.load.image(key,"assets/pmd/"+c.p.dex+"/portrait.png")')||
  !old.includes('this.__torre2PortraitQueued'))throw Error('Unrecognized older selection portrait request');
 s=s.slice(0,start)+PAGE+s.slice(end);
 return s;
}
