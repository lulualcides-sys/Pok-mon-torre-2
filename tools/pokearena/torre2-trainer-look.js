/* Pokémon Torre 2 — trainer customization (owner 2026-11-22, README item 3).
 * Built from the ORIGINAL FireRed overworld sheet of Red / Leaf:
 *  - Cor da roupa: the outfit colours of the original palette are shifted
 *    to another hue (same shading, same pixels);
 *  - Pose: one of the original frames (front, side, back, walking) becomes
 *    the standing frame shown on the trainer card and the map;
 *  - Acessório: small pixel overlays on the front frame (sunglasses, scarf).
 * The result is one runtime texture ("frlg-npc-player-look"); the original
 * sheets are never modified. Choice stored per device like name/gender.
 */
export const LOOK_KEY='torre2-trainer-look';
export const LOOK_TEXTURE='frlg-npc-player-look';
export const LOOK_ID='player-look';
export const OUTFITS=Object.freeze([
 {id:'original',name:'Original'},{id:'azul',name:'Azul',hue:218},{id:'verde',name:'Verde',hue:122},
 {id:'amarelo',name:'Amarelo',hue:46},{id:'roxo',name:'Roxo',hue:276},{id:'rosa',name:'Rosa',hue:328},
 {id:'preto',name:'Preto',dark:true}
]);
// Sheet frames: 0 front, 1 back, 2 side, 3 walk front.
export const POSES=Object.freeze([{id:'frente',name:'De frente',frame:0},{id:'lado',name:'De lado',frame:2},
 {id:'costas',name:'De costas',frame:1},{id:'andando',name:'Andando',frame:3}]);
export const ACCESSORIES=Object.freeze([{id:'nenhum',name:'Nenhum'},{id:'oculos',name:'Óculos escuros'},
 {id:'lenco',name:'Lenço amarelo'},{id:'ambos',name:'Óculos + lenço'}]);
// Outfit colours of each original palette (cap/jacket for Red, hat band and
// skirt for Leaf, plus her blue top).
export const OUTFIT_COLORS=Object.freeze({
 red_normal:['c53939','ff6a4a','6a2929'],
 green_normal:['c53939','6a2929','4141d5','39397b']
});
export function defaultLook(){return {outfit:'original',pose:'frente',accessory:'nenhum'}}
export function cleanLook(l={}){
 const d=defaultLook();
 return {outfit:OUTFITS.some(o=>o.id===l.outfit)?l.outfit:d.outfit,pose:POSES.some(p=>p.id===l.pose)?l.pose:d.pose,
  accessory:ACCESSORIES.some(a=>a.id===l.accessory)?l.accessory:d.accessory};
}
export function isDefaultLook(l){const c=cleanLook(l);return c.outfit==='original'&&c.pose==='frente'&&c.accessory==='nenhum'}
const LISTS={outfit:OUTFITS,pose:POSES,accessory:ACCESSORIES};
export function cycleLook(look,key,dir=1){
 const l=cleanLook(look),opts=LISTS[key];if(!opts)return l;
 const i=opts.findIndex(o=>o.id===l[key]);l[key]=opts[(i+(dir<0?-1:1)+opts.length)%opts.length].id;return l;
}
export function lookLabel(look,key){const l=cleanLook(look);return LISTS[key]?.find(o=>o.id===l[key])?.name||''}
export function readLook(storage=globalThis.localStorage){try{return cleanLook(JSON.parse(storage?.getItem(LOOK_KEY)||'{}'))}catch{return defaultLook()}}
export function saveLook(look,storage=globalThis.localStorage){try{storage?.setItem(LOOK_KEY,JSON.stringify(cleanLook(look)));return true}catch{return false}}
// --- Pure colour helpers -----------------------------------------------------
function rgbToHsv(r,g,b){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;
 let h=0;if(d){h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;h*=60;if(h<0)h+=360}
 return [h,mx?d/mx:0,mx]}
function hsvToRgb(h,s,v){const c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c;
 const [r,g,b]=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
 return [Math.round((r+m)*255),Math.round((g+m)*255),Math.round((b+m)*255)]}
export function recolor(rgb,outfit){
 const o=OUTFITS.find(x=>x.id===outfit);if(!o||o.id==='original')return rgb;
 const [h,s,v]=rgbToHsv(...rgb);
 if(o.dark)return hsvToRgb(h,s*.12,Math.min(1,v*.42+.06));
 return hsvToRgb(o.hue,Math.max(s,.45),v);
}
const hex=h=>[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];
// Accessory pixels on the 16x32 front frame (rows from the original sheets:
// eyes on row 21, collar on row 24, identical columns for Red and Leaf).
export function accessoryPixels(acc){
 const px=[];
 if(acc==='oculos'||acc==='ambos'){for(let x=5;x<=10;x++)px.push([x,21,x===5||x===8?'5a6a8a':'1b1b2b'])}
 if(acc==='lenco'||acc==='ambos'){for(let x=5;x<=10;x++)px.push([x,24,x===5||x===10?'a07818':'f8d030']);px.push([7,25,'f8d030'],[8,25,'e0b020'])}
 return px;
}
// Transforms RGBA pixel data of the whole sheet in place.
export function applyLook(data,width,height,base,look){
 const l=cleanLook(look),srcs=(OUTFIT_COLORS[base]||OUTFIT_COLORS.red_normal).map(hex);
 for(let i=0;i<data.length;i+=4){
  if(!data[i+3])continue;
  if(srcs.some(c=>c[0]===data[i]&&c[1]===data[i+1]&&c[2]===data[i+2])){const [r,g,b]=recolor([data[i],data[i+1],data[i+2]],l.outfit);data[i]=r;data[i+1]=g;data[i+2]=b}
 }
 const cell=16,frame=POSES.find(p=>p.id===l.pose).frame;
 if(frame&&width>=cell*(frame+1)){
  for(let y=0;y<Math.min(32,height);y++)for(let x=0;x<cell;x++){
   const a=(y*width+x)*4,b=(y*width+frame*cell+x)*4;for(let k=0;k<4;k++)data[a+k]=data[b+k];
  }
 }
 if(['frente','andando'].includes(l.pose))for(const [x,y,c] of accessoryPixels(l.accessory)){
  const a=(y*width+x)*4,[r,g,b]=hex(c);data[a]=r;data[a+1]=g;data[a+2]=b;data[a+3]=255;
 }
 return data;
}
// --- Phaser: build the runtime texture --------------------------------------
export function buildLookTexture(scene,base,look=readLook()){
 const baseKey='frlg-npc-'+base;
 if(!scene?.textures?.exists(baseKey))return null;
 if(scene.textures.exists(LOOK_TEXTURE))scene.textures.remove(LOOK_TEXTURE);
 if(isDefaultLook(look))return null;
 const img=scene.textures.get(baseKey).getSourceImage();
 const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
 const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(img,0,0);
 const im=ctx.getImageData(0,0,canvas.width,canvas.height);
 applyLook(im.data,canvas.width,canvas.height,base,look);ctx.putImageData(im,0,0);
 const tex=scene.textures.addCanvas(LOOK_TEXTURE,canvas);
 tex?.setFilter?.(1); // NEAREST: crisp pixels
 return LOOK_TEXTURE;
}
// Sprite id to draw the player: the customized look when it exists.
export function playerLookId(scene,base){return scene?.textures?.exists(LOOK_TEXTURE)?LOOK_ID:base}
