/* Alpha 0.71.3 Pokédex loads only the visible 25 portrait/Idle sheets
 * plus an individual selected evolution. This is an isolated source adapter,
 * never a modification of approved older clients or of published Pages.
 */
const change=(s,a,b)=>{
 if(s.split(a).length!==2)throw Error('Unrecognized 0.71.3 paginated Pokédex loader anchor: '+a.slice(0,65));
 return s.replace(a,b);
};
const SCENE='class Pokedex extends Phaser.Scene{constructor(){super("pokedex")}init(datos){this.foco=Math.max(0,ROSTER.findIndex(p=>p.id===datos?.id));this.etapa=0;this.alt=0}create(){this.manifiesto=this.registry.get("manifiesto");';
const LOADERS=`torre2CargarPagina(page){
 this._torre2PagesPending??=new Set();
 if(this._torre2PagesPending.has(page))return;
 const ids=ROSTER.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE).map(p=>p.dex);
 const forms=soloFormas(this.manifiesto,new Set(ids));
 const missing=ids.some(dex=>!this.textures.exists("retrato-"+dex)||!this.textures.exists("pmd-"+dex+"-Idle"));
 if(!missing){this.actualizarPaginaDex();return;}
 this._torre2PagesPending.add(page);
 const done=()=>{
  this._torre2PagesPending.delete(page);
  crearAnimsPMD(this,forms,["Idle"]);
  if(this.scene.isActive()){
   this.actualizarPaginaDex();
   if(this.dexPage===page&&this.etapas?.[this.etapa]&&
      this.textures.exists("pmd-"+this.etapas[this.etapa].dex+"-Idle"))this.refrescar(false);
  }
 };
 const count=cargarPMD(this,forms,["Idle"]);
 if(count||this.load.isLoading()){
  this.load.once("complete",done);
  if(count&&!this.load.isLoading())this.load.start();
 }else done();
}
torre2EnsureIdle(dex){
 const forms=soloFormas(this.manifiesto,new Set([dex]));
 if(!forms[dex])return;
 const key="pmd-"+dex+"-Idle";
 if(this.textures.exists(key)){crearAnimsPMD(this,forms,["Idle"]);return;}
 this._torre2IdlePending??=new Set();
 if(this._torre2IdlePending.has(dex))return;
 this._torre2IdlePending.add(dex);
 const done=()=>{
  this._torre2IdlePending.delete(dex);
  if(!this.textures.exists(key))return;
  crearAnimsPMD(this,forms,["Idle"]);
  if(this.scene.isActive()&&this.etapas?.[this.etapa]?.dex===dex)this.refrescar(false);
 };
 const count=cargarPMD(this,forms,["Idle"]);
 if(count||this.load.isLoading()){
  this.load.once("complete",done);
  if(count&&!this.load.isLoading())this.load.start();
 }else done();
}
`;
export function loadModernPokedexPage0713(source,alpha){
 if(alpha!=='0.71.3')return source;
 if(typeof source!=='string'||
   !source.includes('const COLS=5;const CEL=44;const PAGE_SIZE=COLS*5;')||
   !source.includes('this.actualizarPaginaDex();this.controlesPaginaDex();')||
   !source.includes('movimientos(c,p,et,tam){'))
  throw Error('Unexpected newer Pokédex loading contract');
 let s=change(source,
  'import{atacarEnMenu,trioMenu}from"../sprites.js";',
  'import{atacarEnMenu,trioMenu,cargarPMD,crearAnimsPMD,soloFormas}from"../sprites.js";');
 s=change(s,SCENE,
  SCENE.replace('create(){',
   'preload(){const m=this.registry.get("manifiesto"),start=Math.floor(this.foco/PAGE_SIZE)*PAGE_SIZE;this._torre2FirstForms=soloFormas(m,new Set(ROSTER.slice(start,start+PAGE_SIZE).map(p=>p.dex)));cargarPMD(this,this._torre2FirstForms,["Idle"])}create(){')+
  'crearAnimsPMD(this,this._torre2FirstForms,["Idle"]);');
 s=change(s,'}actualizarPaginaDex(){','}'+LOADERS+'actualizarPaginaDex(){');
 s=change(s,
  'c.g.setVisible(on);c.img.setVisible(on);c.zone.setVisible(on);',
  'c.g.setVisible(on);const portrait="retrato-"+c.p.dex,ready=this.textures.exists(portrait);if(on&&ready)c.img.setTexture(portrait).setDisplaySize(CEL-4,CEL-4);c.img.setVisible(on&&ready);c.zone.setVisible(on);');
 s=change(s,
  'this.dexPage=Math.floor(i/PAGE_SIZE);this.actualizarPaginaDex();sfx("seleccion");this.refrescar()',
  'this.dexPage=Math.floor(i/PAGE_SIZE);this.actualizarPaginaDex();this.torre2CargarPagina(this.dexPage);sfx("seleccion");this.refrescar()');
 s=change(s,
  'peana(et,celebrar){this.sprite?.destroy();const m=this.manifiesto[et.dex];',
  'peana(et,celebrar){this.sprite?.destroy();if(!this.textures.exists("pmd-"+et.dex+"-Idle")){this.torre2EnsureIdle(et.dex);return}const m=this.manifiesto[et.dex];');
 return s;
}
