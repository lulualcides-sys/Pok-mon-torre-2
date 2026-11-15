/* Bounded native 0.71.3 Pokédex card window.
 * The real audited client uses PAGE_SIZE=COLS*5 and actualizarPaginaDex,
 * not the family-ROOTS adapter used by older sandbox builds.
 * Preserve full ROSTER indices, Pokédex selection and save data; keep only
 * one page of Phaser Graphics/Image/Zone objects alive at a time.
 */
const once=(s,a,b,label)=>{
 const count=s.split(a).length-1;
 if(count!==1)throw Error('Pokedex window: '+label+' expected once, found '+count);
 return s.replace(a,b);
};
export function windowNativePokedex(original){
 let s=String(original);
 s=once(s,
  'this.casillas=ROSTER.map((p,i)=>this.casilla(p,GX+(i%PAGE_SIZE)%COLS*CEL,GY+Math.floor((i%PAGE_SIZE)/COLS)*CEL,i));',
  'this.casillas=ROSTER.map(p=>({p,g:null,img:null,zone:null}));'+
  'this.__torre2MountedDexIndices=[];this.__torre2MountedDexPage=-1;'+
  'this.torre2DexMountPage(this.dexPage);',
  'original all-roster card allocation');
 const mount=[
  'torre2DexMountPage(page){',
  'if(this.__torre2MountedDexPage===page)return;',
  'for(const i of this.__torre2MountedDexIndices||[]){',
  'const c=this.casillas[i];if(!c)continue;',
  'c.zone?.destroy();c.img?.destroy();c.g?.destroy();',
  'this.casillas[i]={p:c.p,g:null,img:null,zone:null};}',
  'const indices=[];',
  'for(let i=page*PAGE_SIZE;i<Math.min(ROSTER.length,(page+1)*PAGE_SIZE);i++){',
  'const v=i%PAGE_SIZE;',
  'this.casillas[i]=this.casilla(ROSTER[i],GX+(v%COLS)*CEL,GY+Math.floor(v/COLS)*CEL,i);',
  'indices.push(i);}',
  'this.__torre2MountedDexIndices=indices;',
  'this.__torre2MountedDexPage=page;',
  '}'
 ].join('');
 s=once(s,'casilla(p,x,y,i){',mount+'casilla(p,x,y,i){','Phaser card mounting method');
 const begin=s.indexOf('actualizarPaginaDex(){');
 const end=s.indexOf('controlesPaginaDex(){',begin);
 if(begin<0||end<begin||s.indexOf('actualizarPaginaDex(){',begin+1)>=0||
  !s.slice(begin,end).includes('this.casillas.forEach'))
  throw Error('Pokedex window: unexpected native page updater');
 const bounded=[
  'actualizarPaginaDex(){',
  'this.torre2DexMountPage(this.dexPage);',
  'for(const i of this.__torre2MountedDexIndices){',
  'const c=this.casillas[i];',
  'c.g.setVisible(true);',
  'const portrait="retrato-"+c.p.dex,ready=this.textures.exists(portrait);',
  'if(ready)c.img.setTexture(portrait).setDisplaySize(CEL-4,CEL-4);',
  'c.img.setVisible(ready);',
  'c.zone.setVisible(true).setInteractive({useHandCursor:true});',
  '}',
  'this.rotuloPagina?.setText((this.dexPage+1)+" / "+Math.ceil(ROSTER.length/PAGE_SIZE));',
  '}'
 ].join('');
 s=s.slice(0,begin)+bounded+s.slice(end);
 // The old 0.71.3 client eagerly requests Idle sprites for ALL 100
 // Johto forms on every Pokédex entry, even before a Johto page is opened.
 // Existing torre2CargarPagina and torre2EnsureIdle already load on demand.
 s=once(s,'this.torre2DirectLocal(this._torre2JohtoForms);',
  '/* Johto PMD is loaded only when a page or evolution is selected. */',
  'eager Johto network loading');
 s=once(s,'crearAnimsPMD(this,this._torre2JohtoForms,["Idle"]);',
  '/* Johto Idle animations are created by the existing lazy loaders. */',
  'eager Johto animation decoding');
 return s;
}
