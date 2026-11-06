/* Restore Poké Arena 2D native portraits and original evolution tabs.
 * Paginate only family ROOTS; do not modify battle ROSTER or save indexes.
 */
const once=(s,a,b,label)=>{
 const count=s.split(a).length-1;
 if(count!==1)throw Error('Pokédex native compatibility '+label+' ('+count+')');
 return s.replace(a,b);
};
export function restoreNativePokedexFamilies(original){
 let s=String(original);
 const kanto='import{KANTO_151,kanto151SlotPlan}from"../torre2/all-kanto-species.js";';
 s=once(s,kanto,kanto+
  'import{JOHTO_100_ROWS}from"../torre2/johto-100-data.js";'+
  'import{LEVEL_EVOLUTIONS}from"../torre2/progression.js";'+
  'import{buildPokedexFamilies}from"../torre2/pokedex-families.js";',
  'family metadata import');
 s=once(s,'import{atacarEnMenu,cargarPMD,crearAnimsPMD,soloFormas}from"../sprites.js";',
  'import{atacarEnMenu,cargarPMD,crearAnimsPMD,soloFormas,retratoA}from"../sprites.js";',
  'native PMD portrait scaler import');
 s=once(s,'if(this.textures.exists(key)&&c.img.texture?.key!==key)c.img.setTexture(key);',
  'if(this.textures.exists(key)){const nativeKey=retratoA(this,c.p.dex,CEL-6);if(c.img.texture?.key!==nativeKey)c.img.setTexture(nativeKey).setDisplaySize(CEL-6,CEL-6);}',
  'native portrait refresh after file download');
 s=once(s,'const COLS=6,CEL=36,GX=10,GY=36;',
  'const COLS=5,CEL=44,GX=10,GY=36;','original P2 44px tiles');
 const orderStart=s.indexOf('let TORRE2_DEX_ORDER=null,TORRE2_DEX_RANK=null;');
 const orderEnd=s.indexOf('function kantoDexTypeColor(type){',orderStart);
 if(orderStart<0||orderEnd<0)throw Error('Unsupported National Dex order');
 const helper=[
  'const TORRE2_DEX_PAGE_SIZE=25;',
  'let TORRE2_DEX_ORDER=null,TORRE2_DEX_RANK=null,TORRE2_DEX_FAMILIES=null;',
  'function torre2DexEnsureOrder(){',
  'if(TORRE2_DEX_FAMILIES)return;',
  'TORRE2_DEX_FAMILIES=buildPokedexFamilies(ROSTER,JOHTO_100_ROWS,LEVEL_EVOLUTIONS);',
  'TORRE2_DEX_ORDER=TORRE2_DEX_FAMILIES.order;',
  'TORRE2_DEX_RANK=TORRE2_DEX_FAMILIES.rank;}',
  'function torre2DexFamilyStages(def){',
  'torre2DexEnsureOrder();',
  'const i=ROSTER.indexOf(def),root=TORRE2_DEX_FAMILIES.rootIndexForIndex[i]??i;',
  'const base=kantoDexStages(ROSTER[root]);',
  'const seen=new Set(base.map(x=>String(x.dex))),extras=[];',
  'for(const memberIndex of TORRE2_DEX_FAMILIES.membersByRoot.get(root)||[]){',
  'if(memberIndex===root)continue;',
  'for(const stage of kantoDexStages(ROSTER[memberIndex])){',
  'if(seen.has(String(stage.dex)))continue;',
  'seen.add(String(stage.dex));extras.push({...stage,etiqueta:stage.nombre});}}',
  'extras.sort((a,b)=>Number(a.dex)-Number(b.dex));',
  'return [...base,...extras];}'
 ].join('');
 s=s.slice(0,orderStart)+helper+s.slice(orderEnd);
 const beforeGrid='torre2DexEnsureOrder();this.dexPage=Math.floor(TORRE2_DEX_RANK[this.foco]/36);this.dexPages=Math.ceil(ROSTER.length/36);this.casillas=ROSTER.map((p,i)=>{const v=TORRE2_DEX_RANK[i]%36;return this.casilla(p,GX+(v%COLS)*CEL,GY+Math.floor(v/COLS)*CEL,i)});';
 const afterGrid=[
  'torre2DexEnsureOrder();',
  'this.foco=TORRE2_DEX_FAMILIES.rootIndexForIndex[this.foco]??this.foco;',
  'this.dexPage=Math.floor(TORRE2_DEX_RANK[this.foco]/TORRE2_DEX_PAGE_SIZE);',
  'this.dexPages=Math.ceil(TORRE2_DEX_ORDER.length/TORRE2_DEX_PAGE_SIZE);',
  'this.casillas=ROSTER.map((p,i)=>{',
  'const rank=TORRE2_DEX_RANK[i],root=TORRE2_DEX_FAMILIES.rootSet.has(i);',
  'const v=rank%TORRE2_DEX_PAGE_SIZE;',
  'return this.casilla(p,root?GX+(v%COLS)*CEL:-200,',
  'root?GY+Math.floor(v/COLS)*CEL:-200,i)});'
 ].join('');
 s=once(s,beforeGrid,afterGrid,'family card grid');
 const begin=s.indexOf('casilla(p,x,y,i){');
 const end=s.indexOf('cambiarEtapa(d){',begin);
 if(begin<0||end<0||!s.slice(begin,end).includes('this.dexPage'))
  throw Error('P2 card navigation unexpectedly changed');
 const nativeCard=[
  'casilla(p,x,y,i){',
  'const native=casillaRetrato(this,x,y,CEL-2,p.dex);',
  'const g=native.g,img=native.img;',
  'const zone=this.add.zone(x+(CEL-2)/2,y+(CEL-2)/2,CEL-2,CEL-2)',
  '.setInteractive({useHandCursor:true}).on("pointerdown",()=>this.elegir(i));',
  'const show=TORRE2_DEX_FAMILIES.rootSet.has(i)&&',
  'Math.floor(TORRE2_DEX_RANK[i]/TORRE2_DEX_PAGE_SIZE)===this.dexPage;',
  'if(!show){g.setVisible(false);img.setVisible(false);',
  'zone.setVisible(false).disableInteractive();}',
  'return{p,x,y,w:CEL-2,h:CEL-2,g,img,zone}}',
  'elegir(i){',
  'const root=TORRE2_DEX_FAMILIES.rootIndexForIndex[i]??i;',
  'if(root===this.foco)return;',
  'const next=Math.floor(TORRE2_DEX_RANK[root]/TORRE2_DEX_PAGE_SIZE);',
  'if(next!==this.dexPage){this.dexPage=next;',
  'for(const[index,c]of this.casillas.entries()){',
  'const show=TORRE2_DEX_FAMILIES.rootSet.has(index)&&',
  'Math.floor(TORRE2_DEX_RANK[index]/TORRE2_DEX_PAGE_SIZE)===next;',
  'c.g.setVisible(show);',
  'c.img.setVisible(show&&this.textures.exists("retrato-"+c.p.dex));',
  'c.zone.setVisible(show);',
  'if(show)c.zone.setInteractive({useHandCursor:true});',
  'else c.zone.disableInteractive();}',
  'this.torre2DexLoadPage(next);}',
  'this.dexPageLabel?.setText((this.dexPage+1)+" / "+this.dexPages);',
  'this.foco=root;this.etapa=0;sfx("seleccion");this.refrescar()}',
  'mover(d){const n=TORRE2_DEX_ORDER.length,f=TORRE2_DEX_RANK[this.foco];',
  'const next=(f+d%n+n)%n;this.elegir(TORRE2_DEX_ORDER[next])}'
 ].join('');
 s=s.slice(0,begin)+nativeCard+s.slice(end);
 s=once(s,'this.etapas=kantoDexStages(p);',
  'this.etapas=torre2DexFamilyStages(p);','nested evolution display');
 s=once(s,'const e=kantoDexStages(ROSTER[this.foco])[i];',
  'const e=torre2DexFamilyStages(ROSTER[this.foco])[i];','nested evolution lazy Idle');
 s=once(s,'this.etapa=i;this.etapas=kantoDexStages(ROSTER[this.foco]);',
  'this.etapa=i;this.etapas=torre2DexFamilyStages(ROSTER[this.foco]);',
  'native family tabs');
 s=once(s,'const stage=kantoDexStages(def)[i];',
  'const stage=torre2DexFamilyStages(def)[i];','move overlay evolution');
 s=once(s,
  'const id=String(i===0?def.id:(def.evoluciones?.[i-1]?.nombre||def.id)).toLowerCase();',
  'const id=String(torre2DexFamilyStages(def)[i]?.nombre||def.id).toLowerCase();',
  'move overlay stage name');
 s=once(s,'this.pestanas=this.etapas.map((e,i)=>{',
  'const __start=this.etapas.length>4?Math.max(0,Math.min(this.etapa-1,this.etapas.length-4)):0;'+
  'const __tabs=this.etapas.map((e,i)=>({e,i})).slice(__start,__start+(this.etapas.length>4?4:this.etapas.length));'+
  'this.pestanas=__tabs.map(({e,i})=>{',
  'branch evolution tabs');
 const tabAnchor='c.add(texto(this,TX,PY+24,et.nombre,';
 s=once(s,tabAnchor,
  'if(this.etapas.length>4){for(const[dx,dir,label]of [[PX+PW-52,-1,"◀"],[PX+PW-19,1,"▶"]]){'+
  'const t=texto(this,dx,PY+5,label,{tam:10,color:"#ffe5a8"}).setDepth(10).setInteractive({useHandCursor:true}).on("pointerdown",()=>this.cambiarEtapa(dir));c.add(t)}}'+
  tabAnchor,'native branch tab navigation');
 // Reuse the established portrait/Idle loader but only for family roots.
 s=once(s,'torre2DexEnsureOrder();this.__torre2DexPageRequests',
  'torre2DexEnsureOrder();this.foco=TORRE2_DEX_FAMILIES.rootIndexForIndex[this.foco]??this.foco;this.__torre2DexPageRequests',
  'family preload focus');
 s=once(s,'Math.floor(rank/36)*36',
  'Math.floor(rank/TORRE2_DEX_PAGE_SIZE)*TORRE2_DEX_PAGE_SIZE',
  'initial family page');
 s=once(s,'TORRE2_DEX_ORDER.slice(start,start+36)',
  'TORRE2_DEX_ORDER.slice(start,start+TORRE2_DEX_PAGE_SIZE)',
  'initial portrait preload');
 s=once(s,'Math.ceil(ROSTER.length/36)',
  'Math.ceil(TORRE2_DEX_ORDER.length/TORRE2_DEX_PAGE_SIZE)',
  'family page count');
 s=once(s,'TORRE2_DEX_ORDER.slice(page*36,(page+1)*36)',
  'TORRE2_DEX_ORDER.slice(page*TORRE2_DEX_PAGE_SIZE,(page+1)*TORRE2_DEX_PAGE_SIZE)',
  'lazy family portraits');
 s=once(s,
  'if(Math.floor(TORRE2_DEX_RANK[this.casillas.indexOf(c)]/36)!==page)continue;',
  'if(!TORRE2_DEX_FAMILIES.rootSet.has(this.casillas.indexOf(c))||Math.floor(TORRE2_DEX_RANK[this.casillas.indexOf(c)]/TORRE2_DEX_PAGE_SIZE)!==page)continue;',
  'exclude hidden evolved portraits');
 s=s.replaceAll('(this.dexPage-1)*36',
  '(this.dexPage-1)*TORRE2_DEX_PAGE_SIZE')
  .replaceAll('(this.dexPage+1)*36',
  '(this.dexPage+1)*TORRE2_DEX_PAGE_SIZE');
 return s;
}
