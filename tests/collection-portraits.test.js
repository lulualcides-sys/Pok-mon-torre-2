import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {paintCollectionPortraits,releaseCollectionPortraits,collectionPortraitKey}
 from '../tools/pokearena/torre2-collection-portraits.js';
function fixture(){
 const textures=new Map([['battle-owned',{}]]),images=[];
 const load=new EventEmitter();load.queue=new Set();load.loading=false;
 load.image=(key)=>load.queue.add(key);
 load.isLoading=()=>load.loading;load.start=()=>{load.loading=true};
 load.finishOne=key=>{
  textures.set(key,{setFilter(){}});load.queue.delete(key);
  load.emit('filecomplete',key,'image',{});
 };
 load.finish=()=>{
  for(const key of [...load.queue])load.finishOne(key);
  load.loading=false;load.emit('complete');
 };
 const scene={load,events:new EventEmitter(),textures:{
  getTextureKeys:()=>[...textures.keys()],exists:key=>textures.has(key),
  get:key=>textures.get(key),remove:key=>textures.delete(key)
 },add:{image(x,y,key){
  const image={active:true,x,y,key,setDisplaySize(){return this},setDepth(){return this},
   setData(){return this},destroy(){this.active=false}};
  images.push(image);return image;
 }}};
 const card=index=>{
  const anchor=new EventEmitter();anchor.active=true;anchor.data={};
  anchor.getData=key=>anchor.data[key];anchor.setData=(k,v)=>anchor.data[k]=v;
  anchor.destroy=()=>{anchor.active=false;anchor.emit('destroy')};
  return {index,id:'species-'+index,x:12,y:9,anchor};
 };
 return {scene,images,textures,card};
}
test('collection loads only page portraits and preserves unrelated battle textures',()=>{
 const {scene,images,textures,card}=fixture();const cards=[card(0),card(150)];
 paintCollectionPortraits(scene,cards);
 assert.deepEqual([...scene.load.queue],[collectionPortraitKey(0),collectionPortraitKey(150)]);
 scene.load.finish();assert.equal(images.length,2);
 cards.forEach(c=>c.anchor.destroy());releaseCollectionPortraits(scene);
 assert.deepEqual([...textures.keys()],['battle-owned']);
 assert.ok(images.every(image=>!image.active));
});
test('rapid pagination cannot paint stale cards or retain old page textures',()=>{
 const {scene,images,textures,card}=fixture();const old=card(0),next=card(22);
 paintCollectionPortraits(scene,[old]);old.anchor.destroy();
 paintCollectionPortraits(scene,[next]);scene.load.finish();
 assert.deepEqual(images.map(i=>i.key),[collectionPortraitKey(22)]);
 assert.equal(textures.has(collectionPortraitKey(0)),false);
 assert.equal(scene.events.listenerCount('shutdown'),1,'only one scene-lifetime tracker remains');
});
test('returning during partial completion reloads portraits evicted by another page',()=>{
 const {scene,images,card}=fixture();const first=[card(0),card(1)],middle=card(22);
 paintCollectionPortraits(scene,first);scene.load.finishOne(collectionPortraitKey(0));
 first.forEach(c=>c.anchor.destroy());paintCollectionPortraits(scene,[middle]);
 middle.anchor.destroy();const returned=[card(0),card(1)];
 paintCollectionPortraits(scene,returned);
 assert.ok(scene.load.queue.has(collectionPortraitKey(0)),'evicted completed file must reload');
 scene.load.finish();
 assert.deepEqual(images.filter(i=>i.active).map(i=>i.key),
  [collectionPortraitKey(0),collectionPortraitKey(1)]);
});
test('shutdown clears pending requests and removes deferred painting callbacks',()=>{
 const {scene,images,card}=fixture();paintCollectionPortraits(scene,[card(0)]);
 scene.events.emit('shutdown');
 assert.equal(scene.load.listenerCount('complete'),0);
 assert.equal(scene.load.listenerCount('filecomplete'),0);
 assert.equal(scene.load.listenerCount('loaderror'),0);
 assert.equal(scene.__torre2CollectionPending.size,0);
 scene.load.finish();assert.equal(images.length,0);
});
