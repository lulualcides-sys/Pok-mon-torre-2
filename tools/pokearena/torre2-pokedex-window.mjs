/* Virtualize the audited native Pokédex, never the battle ROSTER.
 * Keep a cheap entry per Pokémon (save index stable) but create Phaser
 * Graphics/Image/Zone objects ONLY for the visible 25 family roots.
 * This is a fail-closed source adapter for the audited Alpha 0.71.3.
 */
const replaceOne=(source,from,to,label)=>{
 const n=source.split(from).length-1;
 if(n!==1)throw Error('Pokedex window: '+label+' expected once, found '+n);
 return source.replace(from,to);
};
export function windowNativePokedex(original){
 let s=String(original);
 const allCards='this.casillas=ROSTER.map((p,i)=>{const rank=TORRE2_DEX_RANK[i],root=TORRE2_DEX_FAMILIES.rootSet.has(i);const v=rank%TORRE2_DEX_PAGE_SIZE;return this.casilla(p,root?GX+(v%COLS)*CEL:-200,root?GY+Math.floor(v/COLS)*CEL:-200,i)});';
 const visibleCards='this.casillas=ROSTER.map(p=>({p,g:null,img:null,zone:null}));this.__torre2MountedDexPage=-1;this.__torre2MountedDexIndices=[];this.torre2DexMountPage(this.dexPage);';
 s=replaceOne(s,allCards,visibleCards,'family descriptor grid');
 const mount=[
 'torre2DexMountPage(page){',
 'if(this.__torre2MountedDexPage===page)return;',
 'for(const i of this.__torre2MountedDexIndices||[]){',
 'const c=this.casillas[i];if(!c)continue;',
 'c.zone?.destroy();c.img?.destroy();c.g?.destroy();',
 'this.casillas[i]={p:c.p,g:null,img:null,zone:null};}',
 'const indices=TORRE2_DEX_ORDER.slice(page*TORRE2_DEX_PAGE_SIZE,(page+1)*TORRE2_DEX_PAGE_SIZE);',
 'for(const i of indices){',
 'const p=ROSTER[i],v=TORRE2_DEX_RANK[i]%TORRE2_DEX_PAGE_SIZE;',
 'this.casillas[i]=this.casilla(p,GX+(v%COLS)*CEL,GY+Math.floor(v/COLS)*CEL,i);}',
 'this.__torre2MountedDexIndices=indices;this.__torre2MountedDexPage=page;',
 '}'
 ].join('');
 s=replaceOne(s,'casilla(p,x,y,i){',mount+'casilla(p,x,y,i){','mount hook');
 const start=s.indexOf('elegir(i){const root=TORRE2_DEX_FAMILIES.rootIndexForIndex[i]??i;');
 const end=s.indexOf('mover(d){',start);
 if(start<0||end<start||s.indexOf('elegir(i){const root=',start+1)>=0)
  throw Error('Pokedex window: unexpected native family navigation');
 const chooser=[
 'elegir(i){',
 'const root=TORRE2_DEX_FAMILIES.rootIndexForIndex[i]??i;',
 'if(root===this.foco)return;',
 'const next=Math.floor(TORRE2_DEX_RANK[root]/TORRE2_DEX_PAGE_SIZE);',
 'if(next!==this.dexPage){this.dexPage=next;',
 'this.torre2DexMountPage(next);this.torre2DexLoadPage(next);}',
 'this.dexPageLabel?.setText((this.dexPage+1)+" / "+this.dexPages);',
 'this.foco=root;this.etapa=0;sfx("seleccion");this.refrescar()}'
 ].join('');
 s=s.slice(0,start)+chooser+s.slice(end);
 const applyStart='for(const c of this.casillas||[]){if(!TORRE2_DEX_FAMILIES.rootSet.has(this.casillas.indexOf(c))||Math.floor(TORRE2_DEX_RANK[this.casillas.indexOf(c)]/TORRE2_DEX_PAGE_SIZE)!==page)continue;';
 const bounded='if(this.__torre2MountedDexPage!==page)return;for(const i of this.__torre2MountedDexIndices){const c=this.casillas[i];if(!c?.img)continue;';
 s=replaceOne(s,applyStart,bounded,'bounded portrait update');
 // Load family portraits (25) on entry, NOT all 25 animated Idle sheets.
 // The pre-existing peana/torre2DexEnsureIdle guard loads selected Idle
 // asynchronously on demand and caches it for all subsequent visits.
 s=replaceOne(s,
  'cargarPMD(this,this._torre2DexForms,["Idle"]);}',
  'cargarPMD(this,this._torre2DexForms,[]);}',
  'mobile portraits-only initial preload');
 s=replaceOne(s,
  'create(){crearAnimsPMD(this,this._torre2DexForms,["Idle"]);',
  'create(){',
  'avoid redundant animations on first frame');
 return s;
}
