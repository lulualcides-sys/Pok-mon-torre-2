/* Optional room art cutouts from an authentic FireRed locality sheet.
 * Composite reference sheets include the town on the left and rooms on
 * the right/bottom; render ONLY the correct interior crop, never a random
 * duplicate exterior. Missing room art => use existing functional screens.
 */
export const ROOM_CROPS=Object.freeze({
 pallet:{
  house:[399,23,215,165],rival:[399,194,215,168],
  lab:[814,24,211,235]
 },
 viridian:{
  center:[782,25,243,153],mart:[783,202,238,141],
  gym:[1030,24,320,385],school:[1030,384,166,140]
 },
 pewter:{
  center:[782,24,243,153],mart:[782,198,243,150],
  gym:[787,534,198,363],museum:[4,688,451,208]
 },
 cerulean:{
  center:[780,24,245,152],mart:[780,204,246,145],
  gym:[1033,24,258,317],bike:[782,381,245,151]
 },
 vermilion:{
  center:[781,23,245,161],mart:[782,205,246,145],
  gym:[1034,24,168,340]
 },
 lavender:{
  center:[399,22,241,163],mart:[399,204,240,143],
  fuji:[647,24,195,145]
 },
 celadon:{
  center:[858,23,213,145],gym:[1013,637,183,275],
  department:[3,953,183,303]
 },
 fuchsia:{
  center:[781,21,243,167],mart:[783,195,240,151],
  gym:[1030,23,247,365],safari:[1279,23,150,149]
 },
 cinnabar:{
  center:[397,23,241,164],mart:[398,197,243,149],
  gym:[712,22,484,395],lab:[4,453,438,174]
 },
 saffron:{
  center:[903,621,196,156],mart:[1107,622,169,155],
  gym:[1550,21,402,330],dojo:[1551,393,173,215],
  silph:[902,22,645,539]
 }
});
export function canRenderInterior(scene,location,kind){
 const key='frlg-location-'+location,rect=ROOM_CROPS[location]?.[kind];
 if(!rect||!scene.textures.exists(key))return false;
 const t=scene.textures.get(key),s=t.source?.[0];
 return !!(s&&rect[0]+rect[2]<=s.width&&rect[1]+rect[3]<=s.height);
}
export function renderInteriorScene(scene,location,kind){
 if(!canRenderInterior(scene,location,kind))return false;
 const rect=ROOM_CROPS[location][kind],key='frlg-location-'+location,
  source=scene.textures.get(key),name='frlg_room_'+kind;
 if(!source.has(name))source.add(name,0,...rect);
 if(typeof Phaser!=='undefined')
  source.setFilter(Phaser.Textures.FilterMode.NEAREST);
 const maxWidth=330,maxHeight=200;
 const scale=Math.min(maxWidth/rect[2],maxHeight/rect[3],2);
 scene.add.image(227,179,key,name).setOrigin(.5,.5)
  .setDisplaySize(rect[2]*scale,rect[3]*scale).setDepth(5);
 return true;
}
