/* Kanto-only additive Pokémon family pagination. Preserve original
 * Poké Arena evo tabs and sprite rendering, keep 6x6 cards above pedestal.
 */
const once=(src,a,b)=>{
 if(!src.includes(a))throw Error('Pokédex upstream source unexpectedly changed '+a.slice(0,75));
 return src.replace(a,b);
};
export function paginateKantoPokedexSource(original){
 let s=String(original);
 s=once(s,
  'this.casillas=ROSTER.map((p,i)=>this.casilla(p,GX+i%COLS*CEL,GY+Math.floor(i/COLS)*CEL,i));',
  'this.dexPage=Math.floor(this.foco/36);this.dexPages=Math.ceil(ROSTER.length/36);this.casillas=ROSTER.map((p,i)=>this.casilla(p,GX+(i%36)%COLS*CEL,GY+Math.floor((i%36)/COLS)*CEL,i));');
 const start=s.indexOf('casilla(p,x,y,i){'),end=s.indexOf('elegir(i){',start);
 if(start<0||end<0||!s.slice(start,end).includes('return{p,x,y,w:CEL-2,h:CEL-2}'))
  throw Error('Upstream Pokédex card shape unexpected');
 const card="casilla(p,x,y,i){"+
  "const g=this.add.graphics();g.fillStyle(0,1);g.fillRect(x,y,CEL-2,CEL-2);"+
  "const ancho=(CEL-2)/p.tipos.length;"+
  "p.tipos.forEach((t,k)=>{g.fillStyle(TIPOS[t],1);g.fillRect(x+k*ancho,y+CEL-4,ancho,2)});"+
  "const img=this.add.image(x+1,y+1,'retrato-'+p.dex).setOrigin(0).setDisplaySize(CEL-4,CEL-4);"+
  "const zone=this.add.zone(x+(CEL-2)/2,y+(CEL-2)/2,CEL-2,CEL-2).setInteractive({useHandCursor:true}).on('pointerdown',()=>this.elegir(i));"+
  "const show=Math.floor(i/36)===this.dexPage;"+
  "if(!show){g.setVisible(false);img.setVisible(false);zone.setVisible(false).disableInteractive();}"+
  "return{p,x,y,w:CEL-2,h:CEL-2,g,img,zone}}";
 s=s.slice(0,start)+card+s.slice(end);
 s=once(s,'elegir(i){if(i===this.foco)return;this.foco=i;',
  "elegir(i){if(i===this.foco)return;"+
  "const next=Math.floor(i/36);if(next!==this.dexPage){this.dexPage=next;"+
  "for(const [index,c] of this.casillas.entries()){"+
  "const shown=Math.floor(index/36)===next;c.g.setVisible(shown);c.img.setVisible(shown);c.zone.setVisible(shown);"+
  "if(shown)c.zone.setInteractive({useHandCursor:true});else c.zone.disableInteractive();}}"+
  "this.dexPageLabel?.setText((this.dexPage+1)+' / '+this.dexPages);this.foco=i;");
 s=once(s,
  'this.fila=0;this.time.addEvent({delay:700,loop:true,callback:()=>this.girar()});',
  "this.fila=0;"+
  "this.dexPageLabel=texto(this,114,276,(this.dexPage+1)+' / '+this.dexPages,{tam:10,color:'#c5ddf6'}).setDepth(22).setOrigin(.5);"+
  "texto(this,35,276,'◀ ANTES',{tam:8,color:'#ffe1a1'}).setDepth(22).setInteractive({useHandCursor:true}).on('pointerdown',()=>this.elegir(Math.max(0,(this.dexPage-1)*36)));"+
  "texto(this,168,276,'PRÓX ▶',{tam:8,color:'#ffe1a1'}).setDepth(22).setInteractive({useHandCursor:true}).on('pointerdown',()=>this.elegir(Math.min(ROSTER.length-1,(this.dexPage+1)*36)));"+
  "this.time.addEvent({delay:700,loop:true,callback:()=>this.girar()});");
 return s;
}
