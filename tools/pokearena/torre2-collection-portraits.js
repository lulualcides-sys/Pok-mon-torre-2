/* Campaign collection thumbnails. Own keys only: never evict battle assets. */
const PREFIX='torre2-collection-portrait-';
export const collectionPortraitKey=index=>PREFIX+String(index+1).padStart(4,'0');
export function releaseCollectionPortraits(scene,wanted=new Set()){
 scene.__torre2CollectionWanted=wanted;
 for(const key of scene.textures.getTextureKeys())
  if(key.startsWith(PREFIX)&&!wanted.has(key))scene.textures.remove(key);
}
export function paintCollectionPortraits(scene,cards){
 const wanted=new Set(cards.map(c=>collectionPortraitKey(c.index)));
 releaseCollectionPortraits(scene,wanted);
 const pending=scene.__torre2CollectionPending??=new Set();
 if(!scene.__torre2CollectionTracking){
  // A file may finish before the batch. If paging evicts that texture,
  // returning to its page must be allowed to queue the file again.
  const settled=key=>pending.delete(key);
  const failed=file=>settled(file.key);
  const stop=()=>{
   scene.load.off('filecomplete',settled);scene.load.off('loaderror',failed);
   pending.clear();scene.__torre2CollectionTracking=false;
  };
  scene.__torre2CollectionTracking=true;
  scene.load.on('filecomplete',settled);scene.load.on('loaderror',failed);
  scene.events.once('shutdown',stop);
 }
 const paint=()=>{
  for(const card of cards){
   const key=collectionPortraitKey(card.index);
   if(!card.anchor.active||card.anchor.getData('portrait')||!scene.textures.exists(key))continue;
   scene.textures.get(key).setFilter(0);
   const image=scene.add.image(card.x,card.y,key).setDisplaySize(18,18).setDepth(8)
    .setData('torre2-dex-portrait',card.id);
   card.anchor.setData('portrait',true);
   card.anchor.once('destroy',()=>{if(image.active)image.destroy()});
  }
 };
 paint();
 let waiting=false;
 for(const card of cards){
  const key=collectionPortraitKey(card.index);
  if(scene.textures.exists(key))continue;
  waiting=true;
  if(pending.has(key))continue;
  pending.add(key);
  scene.load.image(key,'assets/pmd/'+String(card.index+1).padStart(4,'0')+'/portrait.png');
 }
 if(!waiting)return;
 const cancel=()=>{scene.load.off('complete',complete);pending.clear()};
 const complete=()=>{
  scene.events.off('shutdown',cancel);pending.clear();
  releaseCollectionPortraits(scene,scene.__torre2CollectionWanted||new Set());
  paint();
 };
 scene.events.once('shutdown',cancel);
 scene.load.once('complete',complete);
 if(!scene.load.isLoading())scene.load.start();
}
