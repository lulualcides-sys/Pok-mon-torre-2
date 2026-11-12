/* Arena selection only: 4 columns × 2 rows (8 Pokémon per page).
 * Preserve native arrow navigation, touchscreen controls, duel panels and FIGHT button. */
export function paginateSelectionSource(source){
 const once=(a,b)=>{if(!source.includes(a)){
  // Never silently discard an unrecognized upstream layout. Log a small,
  // targeted source excerpt so the adaptation can be made safely without
  // changing the approved native buttons or using guessed offsets.
  const near=key=>{
   const index=source.indexOf(key);
   return index<0?null:source.slice(Math.max(0,index-180),index+330);
  };
  throw Error('Selection source changed: '+a+
   '; FILAS='+JSON.stringify(near('FILAS'))+
   '; POR_FILA='+JSON.stringify(near('POR_FILA'))+
   '; casilla='+JSON.stringify(near('casilla('))+
   '; beginning='+JSON.stringify(source.slice(0,430)));
 }source=source.replace(a,b)};
 // Upstream versions differ: original source derives FILAS from POR_FILA;
 // October client now derives POR_FILA from FILAS. For 151 entries this
 // inflates one row to ~76 columns, making native buttons unreachable.
 // Fix ONLY grid dimensions, reuse the same card and input constructors.
 const legacy='const FILAS=Math.ceil(ROSTER.length/POR_FILA);';
 const current='FILAS=ROSTER.length>13?2:1;const POR_FILA=Math.ceil(ROSTER.length/FILAS);';
 if(source.includes(legacy)){
  once('const POR_FILA=12;','const POR_FILA=4;');
  once(legacy,'const FILAS=Math.min(2,Math.ceil(ROSTER.length/POR_FILA));');
 }else if(source.includes(current))
  once(current,'FILAS=2;const POR_FILA=4;');
 else throw Error('Unrecognized Poké Arena selection dimensions; refusing unsafe patch');
 once('const fila=Math.floor(i/POR_FILA),col=i%POR_FILA;', 'const fila=Math.floor((i%(POR_FILA*2))/POR_FILA),col=i%POR_FILA;');
 once('const enFila=Math.min(POR_FILA,ROSTER.length-fila*POR_FILA);','const enFila=POR_FILA;');
 once('return this.casilla(p,x0+col*(TW+TGAP),TY+fila*(TH+TGAP),i)', 'const before=this.children.list.length;const card=this.casilla(p,x0+col*(TW+TGAP),TY+fila*(TH+TGAP),i);card.page=Math.floor(i/(POR_FILA*2));card.objects=this.children.list.slice(before);return card');
 // In the original touch handler, tapping an unselected Pokémon only focuses it.
 // The second tap is often intercepted by scroll/viewport on Android.
 // Offline Arena/VS/Training allow one deliberate tap to choose directly.
 once('if(esTactil()&&this.paso<2&&this.foco!==i){this.foco=i;sfx("seleccion");this.refrescar();return}this.elegir(i)',
  'if(this.paso<2)this.foco=i;this.elegir(i)');
 // User-approved offline roster is unlocked. Retain original ranked locks.
 const officialDraftLocks='const bloqueado=this.encargo?!!this.encargo.bloqueado?.(p.id):this.modo==="ranked"?!desbloqueadoRanked(p.id):!desbloqueado(p.id);';
 if(source.includes(officialDraftLocks)){
  // Only the OFFLINE classic roster is fully open. Preserve the current
  // online Ranked/Draft team-selection lock and the challenge's server rules.
  once(officialDraftLocks,
   'const bloqueado=this.encargo?!!this.encargo.bloqueado?.(p.id):this.modo==="ranked"?!desbloqueadoRanked(p.id):false;');
 }else{
  once('const bloqueado=this.modo==="ranked"?!desbloqueadoRanked(p.id):!desbloqueado(p.id);',
   'const bloqueado=this.modo==="ranked"?!desbloqueadoRanked(p.id):false;');
 }
 const aid='this.opciones();this.ayuda=';
 const draftAid='this.opciones();if(this.encargo?.azar)this.botonAzar=boton(this,76,this.posLuchar.y-4,"RANDOM",()=>this.azarEncargo(),{altoZona:40,anchoExtra:44});this.ayuda=';
 if(!source.includes(aid)&&source.includes(draftAid)){
  // 0.70.0 adds RANDOM draft UI before the help text; preserve it.
  once(draftAid,draftAid.replace('this.ayuda=','this.torre2Page=0;this.torre2Pages=Math.ceil(ROSTER.length/(POR_FILA*2));for(const [x,d,t] of [[72,-1,"◀"],[568,1,"▶"]])boton(this,x,26,t,()=>{this.torre2Page=(this.torre2Page+d+this.torre2Pages)%this.torre2Pages;this.foco=this.torre2Page*POR_FILA*2;this.refrescar()},{altoZona:26,anchoExtra:20});this.torre2PageLabel=texto(this,ANCHO-14,TY+FILAS*(TH+TGAP)/2,"",{tam:8,color:"#ffe3a7"}).setOrigin(1,.5);this.ayuda='));
 }else{
 once('this.opciones();this.ayuda=', 'this.opciones();this.torre2Page=0;this.torre2Pages=Math.ceil(ROSTER.length/(POR_FILA*2));for(const [x,d,t] of [[72,-1,"◀"],[568,1,"▶"]])boton(this,x,26,t,()=>{this.torre2Page=(this.torre2Page+d+this.torre2Pages)%this.torre2Pages;this.foco=this.torre2Page*POR_FILA*2;this.refrescar()},{altoZona:26,anchoExtra:20});this.torre2PageLabel=texto(this,ANCHO-14,TY+FILAS*(TH+TGAP)/2,"",{tam:8,color:"#ffe3a7"}).setOrigin(1,.5);this.ayuda=');
 }
 // The native "casillaRetrato" draws __MISSING when a portrait is not cached.
 // Request only 8 PNGs of the visible page, then install its real pixel-art
 // scaled texture; do not allocate/reveal 189 placeholder textures at once.
 const hydrate='torre2LoadPortraitPage(page){'+
  'this.__torre2PortraitQueued??=new Set();'+
  'for(const c of this.casillas.filter(c=>c.page===page)){'+
  'const key="retrato-"+c.p.dex;'+
  'const show=()=>{if(!c.img.active||!this.textures.exists(key))return;'+
  'c.img.setTexture(retratoA(this,c.p.dex,TW-4)).setDisplaySize(TW-4,TW-4);'+
  'c.img.setVisible(c.page===this.torre2Page)};'+
  'if(this.textures.exists(key)){show();continue;}'+
  'c.img.setVisible(false);'+
  'if(this.__torre2PortraitQueued.has(key))continue;'+
  'this.__torre2PortraitQueued.add(key);'+
  'this.load.once("filecomplete-image-"+key,()=>{this.__torre2PortraitQueued.delete(key);show()});'+
  'this.load.once("loaderror",file=>{if(file.key===key)this.__torre2PortraitQueued.delete(key)});'+
  'this.load.image(key,"assets/pmd/"+c.p.dex+"/portrait.png");'+
  '}if(!this.load.isLoading()&&this.__torre2PortraitQueued.size)this.load.start()}';
 once('refrescar(){const porId=',
  hydrate+'refrescar(){this.torre2Page=Math.floor(this.foco/(POR_FILA*2));'+
  'this.torre2PageLabel?.setText("PÁG "+(this.torre2Page+1)+"/"+this.torre2Pages);'+
  'for(const card of this.casillas){const show=card.page===this.torre2Page;'+
  'for(const o of card.objects){o.setVisible(show);if(o.input)o.input.enabled=show;}'+
  'if(!this.textures.exists("retrato-"+card.p.dex))card.img.setVisible(false)}'+
  'this.torre2LoadPortraitPage(this.torre2Page);const porId=');

 return source;
}
