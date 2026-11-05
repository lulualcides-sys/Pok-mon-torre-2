/* Pokémon Torre 2 · Johto 18 · native P2 pixel-art vocabulary.
 * The original Poké Arena 2D client supplies the real MAPAS textures p-*
 * (vfx.js). Each move combines its P2 palette/sprite with an independent
 * ink-outlined, hand-authored pixel mask. Never scales a vector/circle.
 *
 * 0 = dark outline, 1 = shadow, 2 = body, 3 = light, 4 = specular pixel.
 * Shared stamp routine is consistent with already approved batch24/pixels.js.
 * These are NEW test-lab illustrations, not replacements for approved VFX.
 */
const masks={
 "triple-kick":[
  '........0000....','......0011100...','.....01122210...','....0112322210..',
  '...011233332210.','..0012333322210.','..01223334432210','..01222233322110',
  '...012222221110.','....0011111100..','......000000....','.....0000.......'
 ],
 "thief":[
  '.......000000...','.....001112210..','....0122333210..','....0123433210..',
  '....0123333210..','...00122222100..','..012122222100..','..0121222210....',
  '001222222110.....','01233322110......','0122221110.......','001110000........'
 ],
 "snore":[
  '000000000000...','011111111110...','022222233210...','000000233210...','......023210....',
  '.....023210.....','....023210......','...023210.......','..023210........',
  '.023210000000...','02334444443210..','00000000000000..'
 ],
 "powder-snow":[
  '.......00.......','.......22.......','...00..22..00...','....12233221....',
  '.....123321.....','0022223443222200','1123334444333211','0022223443222200',
  '.....123321.....','....12233221....','...00..22..00...','.......22.......',
  '.......00.......'
 ],
 "octazooka":[
  '.....000000.....','...0011111100...','..01222222110...','.0123333332210..',
  '012333444332210.','012333443332210.','012233333333210.','012223333322110.',
  '.0122222222110..','..01122222110...','...0011111100...','....0000000.....'
 ],
 "zap-cannon":[
  '......00444......','.....014430......','....012430.......','...012430........',
  '..012344444000...','.01233333332100..','001234444333210..','012333322221100..',
  '0012221100000....','..001210..........','...01210..........','....010...........'
 ],
 "false-swipe":[
  '.............000','...........00110','.........001230.','.......00123430.','.....0012334330.',
  '...001233443320.','.0012334433210..','0012344433210...','012344332210....',
  '.001233210......','...00110........','.....00..........'
 ],
 "steel-wing":[
  '...........00000.','.........00112210','.......0011234320','....0001123334320',
  '.0011223333443210','01223334444332100','012333344332110..','0012333221100....',
  '..001221100......','....0000.........','.......0..........'
 ],
 "return":[
  '...0000...0000...','..0122100012210..','.0123332101233210.','012334443334443210',
  '012334443334443210','012333333333333210','.0123333333333210.','..0123333333210..',
  '...01233333210...','....01233210.....','.....012210......','......000........'
 ],
 "present":[
  '..000000000000..','..011111111110..','..012223322210..','..012223322210..',
  '..012223322210..','0012333333332100','0123444334443210','0123444334443210',
  '0123333333333210','0122222332222210','0122222332222210','0011111111111100',
  '..000000000000..'
 ],
 "frustration":[
  '0....0.....0....0','.0..01....10..0.','..01121..012110..','00012332112321000',
  '01233444333443210','01233344444333210','0012333444332100','..012333333210..',
  '...0112332210...','..0011221100....','.001210012100...','00110....01100...'
 ],
 "magnitude":[
  '....000....000.....','..00121000121100...','00123321012333210..','012334321233443210.',
  '00122332122123210.','..00122111121100..','....0011001100....','.....01211210.....',
  '.....01233210.....','....00123432100...','...012343343210...','...001111111100...'
 ],
 "pursuit":[
  '...........0000...','.........001210...','..000000122210...','001233333333210...','012344444433210...',
  '0012333333332210..','..001122222233210.','....0011112233210','......00001233210',
  '.........00122210','..........0011100','...........000...'
 ],
 "vital-throw":[
  '....00000..........','...0122210.........','..012343210........','..0123432100000....',
  '..012333321233210..','...012333333443210.','....01233334433210','..001223333322110.',
  '0012333332221100..','0122222221100.....','00111111100........','..0000000..........'
 ],
 "hidden-power":[
  '.......000.......','.....0012100.....','...00123332100...','..0123344433210..',
  '.012334444433210.','01233444444433210','01233444444433210','01233444444433210',
  '.012334444433210.','..0123344433210..','...00123332100...','.....0012100.....',
  '.......000.......'
 ],
 "rock-smash":[
  '....0000000.......','..00112222100.....','.0123333333210....','012334443333210...',
  '012333444333210...','0012333333221100..','..001222221123210.','...00111112333210',
  '....0000012333210','.......0012222210','........001111100','..........00000.'
 ],
 "whirlpool":[
  '......000000.......','...001222221000....','..01234444432100...','.0123332222333210..',
  '0123321000012333210','0123210....01233210','012332100..00123210','001233321000123210',
  '..001233333332210.','....00123333210...','......001222100....','.......000000.....'
 ],
 "beat-up":[
  '...0000...0000...','..0122100012210..','.012332101233210.','01234432123443210',
  '01233332123333210','00122222112222100','..00122100122100','....0110000110...',
  '..001222100122210','..0123333212333210','..001222100122210','....00000..00000.'
 ]
};
const palette={
 "triple-kick":[0x242232,0x75573c,0xc08949,0xf1bd66,0xfff1bd],
 "thief":[0x171b2d,0x322c55,0x645090,0xa28bd9,0xefdcff],
 "snore":[0x1f2940,0x406e9b,0x65b3d5,0xb4e5f2,0xf1feff],
 "powder-snow":[0x182d4a,0x366d9d,0x6aaace,0xc8f3ff,0xffffff],
 "octazooka":[0x161629,0x252348,0x484173,0x8a75c3,0xd8c7ff],
 "zap-cannon":[0x4d3519,0x93701a,0xd7a725,0xffe26a,0xffffd3],
 "false-swipe":[0x173629,0x2c6b50,0x5bb48b,0xa7ebc7,0xfcfff0],
 "steel-wing":[0x1b2c3a,0x416176,0x80a6b6,0xc3e2ef,0xffffff],
 "return":[0x49304b,0x9b4e83,0xe58eaf,0xffc4db,0xfff6df],
 "present":[0x442638,0x9b3556,0xe45d7a,0xf9b86d,0xfff0c7],
 "frustration":[0x381f2a,0x792e3b,0xc94c3c,0xf58b48,0xffd778],
 "magnitude":[0x27242b,0x5f4b41,0x99734e,0xd7aa68,0xffe5aa],
 "pursuit":[0x1b1a30,0x3d345e,0x735b9e,0xaf91d6,0xead8ff],
 "vital-throw":[0x34262a,0x925034,0xd17b46,0xf2bc7c,0xffefcc],
 "hidden-power":[0x252040,0x494790,0x7886d5,0xbbc6ff,0xf9f4ff],
 "rock-smash":[0x29242b,0x574a42,0x957759,0xd2ae7b,0xfbf0d0],
 "whirlpool":[0x183248,0x286884,0x359fb6,0x94dce8,0xecffff],
 "beat-up":[0x231c34,0x55406d,0x896aab,0xc5a5e2,0xf4e6ff]
};
/* These are named textures that exist in the original P2 vfx.js MAPAS.
 * Each primary + secondary corresponds to the action's actual silhouette:
 * cut, electricity, snowflake, water swirl, rock, psychic orb etc.
 */
export const JOHTO_P2_TEXTURES=Object.freeze({
 "triple-kick":["p-cuchilla","p-estrella"],
 "thief":["p-fantasma","p-cuchilla"],
 "snore":["p-hipnosis","p-aura"],
 "powder-snow":["p-copo","p-espuma"],
 "octazooka":["p-fantasma","p-agua"],
 "zap-cannon":["p-electro","p-rayo"],
 "false-swipe":["p-cuchilla","p-mira"],
 "steel-wing":["p-cuchilla","p-roca"],
 "return":["vfx-quickattack","vfx-arco"],
 "present":["vfx-huevo","vfx-hiper_impacto"],
 "frustration":["vfx-quickattack","vfx-arco"],
 "magnitude":["vfx-roca","p-guijarro"],
 "pursuit":["p-fantasma","p-shuriken"],
 "vital-throw":["p-roca","p-aura"],
 "hidden-power":["p-psiquico","p-estrella"],
 "rock-smash":["vfx-roca","vfx-acometida"],
 "whirlpool":["p-pulsoAgua","p-chorrito"],
 "beat-up":["p-cuchilla","p-fantasma"]
});
export const JOHTO_PIXEL_MASKS=Object.freeze(Object.fromEntries(
 Object.entries(masks).map(([key,rows])=>[key,Object.freeze(rows)])));
export const JOHTO_PIXEL_PALETTES=Object.freeze(Object.fromEntries(
 Object.entries(palette).map(([key,colors])=>[key,Object.freeze(colors)])));
export const JOHTO_PIXEL_FRAMES=12;
export function stampJohto(g,id,x,y,frame=0,scale=2,alpha=1,flip=false){
 const rows=JOHTO_PIXEL_MASKS[id],pal=JOHTO_PIXEL_PALETTES[id];
 if(!rows||!pal)return 0;
 const width=Math.max(...rows.map(row=>row.length)),height=rows.length;
 const size=Math.max(1,Math.round(scale)),snap=Math.round;
 // Original client sprites use 1px ink/shadow/highlight cells. The stamp
 // uses integer, non-antialiased squares and no vector geometry.
 const pose=frame%JOHTO_PIXEL_FRAMES;
 const squash=pose===0||pose===11?1:pose===6?0.92:1;
 const flicker=pose===2||pose===9?0.92:1;
 let pixels=0;
 for(let row=0;row<height;row++){
  const line=rows[row];
  for(let col=0;col<line.length;col++){
   const char=line[col];
   if(char==='.')continue;
   const idx=char.charCodeAt(0)-48;if(idx<0||idx>4)continue;
   const rx=flip?width-1-col:col;
   const px=snap(x+(rx-(width-1)/2)*size);
   const py=snap(y+(row-(height-1)/2)*size*squash);
   g.fillStyle(pal[idx],alpha*flicker);
   g.fillRect(px,py,size,Math.max(1,snap(size*squash)));
   pixels++;
  }
 }
 return pixels;
}
