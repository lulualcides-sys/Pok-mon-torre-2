/* T59 — original user-uploaded FireRed reference sheets for Kanto's prologue.
 * These are ORIGINAL SOURCE REFERENCES, not approved 1280x720 backgrounds.
 * Crop values isolate each overworld scene from the nearby interiors/titles.
 * They are NEVER imported into approved-prologue-assets.js automatically.
 */
export const PROLOGUE_REFERENCE_SHEETS=Object.freeze([
 Object.freeze({
  id:'pallet-town',
  source:'reference-assets/kanto/maps/cities/pallet-town.png',
  original:'1000992888(1).png',
  sourceWidth:1032,sourceHeight:376,
  sha256:'ff1161973c751bd0f1bc701d6c19cd3794121fe73c53a88254f226d5fc8edb31',
  crop:Object.freeze({x:5,y:24,width:387,height:329}),
  status:'reference-only',
  notes:'Town exterior occupies the left panel; Oak lab and house interiors remain outside the crop.'
 }),
 Object.freeze({
  id:'viridian-city',
  source:'reference-assets/kanto/maps/cities/viridian-city.png',
  original:'1000992883(1).png',
  sourceWidth:1360,sourceHeight:672,
  sha256:'647fce7d229704756b0963a7b8c65dedcc07652de09d98719c513fd7c76c6171',
  crop:Object.freeze({x:6,y:24,width:770,height:640}),
  status:'reference-only',
  notes:'City exterior occupies the left panel; PC, Mart, Gym and interiors on the right are separate reference material.'
 }),
 Object.freeze({
  id:'viridian-forest',
  source:'reference-assets/kanto/maps/locations/viridian-forest.png',
  original:'1000992894(1).png',
  sourceWidth:880,sourceHeight:1136,
  sha256:'3dedbdffb3e6aead5c2b8d0d2a0dcc6ea95c75f042cd9ac658dc496a0e6d5fff',
  crop:Object.freeze({x:6,y:24,width:868,height:1104}),
  status:'reference-only',
  notes:'Complete tall forest reference; do not distort or discard entrances to force a 16:9 crop.'
 })
]);
export const MISSING_PROLOGUE_REFERENCE_IDS=Object.freeze(['route-1']);
export function validatePrologueReferenceSheet(ref){
 if(!ref||!['pallet-town','viridian-city','viridian-forest'].includes(ref.id)||
  ref.status!=='reference-only'||!ref.source.startsWith('reference-assets/kanto/maps/')||
  !ref.source.endsWith('.png')||!/^[a-f0-9]{64}$/.test(ref.sha256)||
  !Number.isInteger(ref.sourceWidth)||!Number.isInteger(ref.sourceHeight)||
  !ref.crop||![ref.crop.x,ref.crop.y,ref.crop.width,ref.crop.height].every(Number.isInteger)||
  ref.crop.x<0||ref.crop.y<0||ref.crop.width<=0||ref.crop.height<=0||
  ref.crop.x+ref.crop.width>ref.sourceWidth||
  ref.crop.y+ref.crop.height>ref.sourceHeight)
  throw new Error('Invalid original Kanto prologue reference metadata');
 return true;
}
