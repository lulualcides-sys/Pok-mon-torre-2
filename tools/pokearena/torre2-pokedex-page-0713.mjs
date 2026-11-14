/** Preserve native Alpha 0.71.3 move/form tabs and sprite pedestal, while
 * paginating ONLY the extended left-side Pokédex cards. Older approved
 * clients are unchanged. Strict source anchors prevent silent patch drift.
 */
const GRID='const COLS=(()=>{for(let c=5;c<12;c++){const cel=Math.min(44,Math.floor(ANCHO_REJILLA/c));if(Math.ceil(ROSTER.length/c)*cel<=ALTO_REJILLA)return c}return 12})();const CEL=Math.min(44,Math.floor(ANCHO_REJILLA/COLS));';
const CARDS='this.casillas=ROSTER.map((p,i)=>this.casilla(p,GX+i%COLS*CEL,GY+Math.floor(i/COLS)*CEL,i));';
const CELL='casilla(p,x,y,i){casillaRetrato(this,x,y,CEL-2,p.dex);this.add.zone(x+(CEL-2)/2,y+(CEL-2)/2,CEL-2,CEL-2).setInteractive({useHandCursor:true}).on("pointerdown",()=>this.elegir(i));return{p,x,y,w:CEL-2,h:CEL-2}}';
const PICK='elegir(i){if(i===this.foco)return;this.foco=i;this.etapa=0;this.alt=0;sfx("seleccion");this.refrescar()}';
const PAGE_METHODS=`actualizarPaginaDex(){
 const start=this.dexPage*PAGE_SIZE;
 this.casillas.forEach((c,i)=>{
  const on=i>=start&&i<start+PAGE_SIZE;
  c.g.setVisible(on);c.img.setVisible(on);c.zone.setVisible(on);
  if(on)c.zone.setInteractive({useHandCursor:true});else c.zone.disableInteractive();
 });
 this.rotuloPagina?.setText((this.dexPage+1)+" / "+Math.ceil(ROSTER.length/PAGE_SIZE));
}
controlesPaginaDex(){
 texto(this,GX+24,278,"< ANT",{tam:8,color:"#8fb3e6"}).setOrigin(.5,0).setDepth(7);
 texto(this,GX+195,278,"SIG >",{tam:8,color:"#8fb3e6"}).setOrigin(.5,0).setDepth(7);
 this.rotuloPagina=texto(this,GX+110,278,"",{tam:8,color:"#f8c448"}).setOrigin(.5,0).setDepth(7);
 this.add.zone(GX+24,284,50,24).setInteractive({useHandCursor:true}).on("pointerdown",()=>this.irPaginaDex(-1));
 this.add.zone(GX+195,284,50,24).setInteractive({useHandCursor:true}).on("pointerdown",()=>this.irPaginaDex(1));
 this.actualizarPaginaDex();
}
irPaginaDex(d){
 const pages=Math.ceil(ROSTER.length/PAGE_SIZE);
 const target=(this.dexPage+d+pages)%pages;
 this.elegir(Math.min(ROSTER.length-1,target*PAGE_SIZE));
}
`;
const replaceOnce=(source,from,to)=>{
 if(source.split(from).length!==2)throw Error('Unrecognized native Alpha 0.71.3 Pokédex pagination anchor: '+from.slice(0,55));
 return source.replace(from,to);
};
export function paginateModernPokedex0713(source,alpha){
 if(alpha!=='0.71.3')return source;
 if(typeof source!=='string'||!source.includes('trioMenu')||
    !source.includes('const out=slot==="e"?["ULT"]:[];')||
    !source.includes('movimientos(c,p,et,tam){'))
  throw Error('Unrecognized modern Alpha 0.71.3 Pokédex');
 let updated=replaceOnce(source,GRID,'const COLS=5;const CEL=44;const PAGE_SIZE=COLS*5;');
 updated=replaceOnce(updated,CARDS,
  'this.dexPage=Math.floor(this.foco/PAGE_SIZE);this.casillas=ROSTER.map((p,i)=>this.casilla(p,GX+(i%PAGE_SIZE)%COLS*CEL,GY+Math.floor((i%PAGE_SIZE)/COLS)*CEL,i));this.actualizarPaginaDex();this.controlesPaginaDex();');
 updated=replaceOnce(updated,CELL,
  'casilla(p,x,y,i){const {g,img}=casillaRetrato(this,x,y,CEL-2,p.dex);const zone=this.add.zone(x+(CEL-2)/2,y+(CEL-2)/2,CEL-2,CEL-2).setInteractive({useHandCursor:true}).on("pointerdown",()=>this.elegir(i));return{p,x,y,w:CEL-2,h:CEL-2,g,img,zone}}');
 updated=replaceOnce(updated,PICK,
  'elegir(i){if(i===this.foco)return;this.foco=i;this.etapa=0;this.alt=0;this.dexPage=Math.floor(i/PAGE_SIZE);this.actualizarPaginaDex();sfx("seleccion");this.refrescar()}');
 updated=replaceOnce(updated,'}casilla(p,x,y,i){','}'+PAGE_METHODS+'casilla(p,x,y,i){');
 return updated;
}
