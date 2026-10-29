/* Keep all roster families reachable without pushing FIGHT below the viewport. */
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
 once('const FILAS=Math.ceil(ROSTER.length/POR_FILA);','const FILAS=Math.min(2,Math.ceil(ROSTER.length/POR_FILA));');
 once('const fila=Math.floor(i/POR_FILA),col=i%POR_FILA;', 'const fila=Math.floor((i%(POR_FILA*2))/POR_FILA),col=i%POR_FILA;');
 once('const enFila=Math.min(POR_FILA,ROSTER.length-fila*POR_FILA);','const enFila=POR_FILA;');
 once('return this.casilla(p,x0+col*(TW+TGAP),TY+fila*(TH+TGAP),i)', 'const before=this.children.list.length;const card=this.casilla(p,x0+col*(TW+TGAP),TY+fila*(TH+TGAP),i);card.page=Math.floor(i/(POR_FILA*2));card.objects=this.children.list.slice(before);return card');
 once('this.opciones();this.ayuda=', 'this.opciones();this.torre2Page=0;this.torre2Pages=Math.ceil(ROSTER.length/(POR_FILA*2));for(const [x,d,t] of [[72,-1,"◀"],[568,1,"▶"]])boton(this,x,26,t,()=>{this.torre2Page=(this.torre2Page+d+this.torre2Pages)%this.torre2Pages;this.foco=this.torre2Page*POR_FILA*2;this.refrescar()},{altoZona:26,anchoExtra:20});this.ayuda=');
 once('refrescar(){const porId=', 'refrescar(){this.torre2Page=Math.floor(this.foco/(POR_FILA*2));for(const card of this.casillas){const show=card.page===this.torre2Page;for(const o of card.objects){o.setVisible(show);if(o.input)o.input.enabled=show;}}const porId=');
 return source;
}
