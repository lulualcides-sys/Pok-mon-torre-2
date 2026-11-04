/* Campaign-only PMD portrait requests.
 * The Phaser Scene survives restarts, while the route/card UI does not.
 * Keep one loader request per species, bound late callbacks, and forget old
 * keys when a scene restarts or a sprite fails. No gameplay/save changes.
 */
const MAX_VIEW_SUBSCRIBERS=8;
export function resetCardPortraitRequests(scene){
 const pending=scene.__torre2CardPortraitRequests;
 if(pending instanceof Map){
  for(const record of pending.values())record.dispose();
  pending.clear();
 }
 scene.__torre2CardPortraitRequests=new Map();
 scene.__torre2CardPortraitFailed=new Set();
}
export function requestCardPortrait(scene,key,url,render){
 if(typeof key!=='string'||!key.startsWith('torre2-portrait-')||
    typeof url!=='string'||typeof render!=='function')
  return 'invalid';
 if(scene.textures.exists(key)){render();return 'ready';}
 const requests=scene.__torre2CardPortraitRequests??=new Map();
 const failed=scene.__torre2CardPortraitFailed??=new Set();
 if(failed.has(key))return 'failed';
 const existing=requests.get(key);
 if(existing){
  // Preserve only the newest live cards; old layers are gone after paging.
  existing.subscribers.push(render);
  if(existing.subscribers.length>MAX_VIEW_SUBSCRIBERS)
   existing.subscribers.shift();
  return 'pending';
 }
 const subscribers=[render];
 let done=false;
 const loader=scene.load;
 const loadError=file=>{
  if(file?.key!==key||done)return;
  dispose();
  failed.add(key); // Do not create a repeated 404 loop in the current scene.
 };
 const dispose=()=>{
  if(done)return;
  done=true;
  loader.off('filecomplete-image-'+key,succeed);
  loader.off('loaderror',loadError);
  requests.delete(key);
  subscribers.length=0;
 };
 // Keep the subscriber list alive during success dispatch; disposing must
 // detach loader listeners without dropping the callbacks to be rendered.
 const succeed=()=>{
  if(done)return;
  const ready=subscribers.slice();
  dispose();
  if(scene.textures.exists(key))for(const show of ready)show();
 };
 loader.on('filecomplete-image-'+key,succeed);
 loader.on('loaderror',loadError);
 requests.set(key,{subscribers,dispose});
 try{
  loader.image(key,url);
  if(!loader.isLoading())loader.start();
 }catch(error){
  dispose();
  failed.add(key);
  return 'failed';
 }
 return 'pending';
}
