import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {withScenicAtlas,SCENIC_ATLAS,scenicTheme} from '../tools/pokearena/torre2-premium-art.js';
function fixture(){
 const load=new EventEmitter();load.list={entries:[]};load.inflight={entries:[]};
 let requests=0,ready=false;
 load.image=(key,url)=>{requests++;load.list.entries.push({key,url})};
 load.isLoading=()=>true;load.start=()=>{};
 const scene={load,textures:{exists:()=>ready}};
 const owner=()=>{const layer=new EventEmitter();layer.active=true;return layer};
 return {load,scene,owner,requests:()=>requests,ready:()=>{ready=true;load.list.entries=[];load.emit('filecomplete-image-'+SCENIC_ATLAS)}};
}
test('one atlas request serves five cards; destroyed cards cannot receive late paint',()=>{
 const f=fixture(),owners=Array.from({length:5},f.owner);let paints=0;
 for(const o of owners)withScenicAtlas(f.scene,o,()=>paints++);
 assert.equal(f.requests(),1);
 owners[0].active=false;owners[0].emit('destroy');
 f.ready();assert.equal(paints,4);
 assert.equal(f.load.listenerCount('loaderror'),0);
 assert.equal(f.load.listenerCount('filecomplete-image-'+SCENIC_ATLAS),0);
 for(const o of owners)assert.equal(o.listenerCount('destroy'),0);
});
test('an error after leaving the screen does not poison the next visit',()=>{
 const f=fixture(),o=f.owner();let paints=0;
 withScenicAtlas(f.scene,o,()=>paints++);o.active=false;o.emit('destroy');
 f.load.list.entries=[];f.load.emit('loaderror',{key:SCENIC_ATLAS});
 withScenicAtlas(f.scene,f.owner(),()=>paints++);assert.equal(f.requests(),2);
 f.ready();assert.equal(paints,1);
});
test('all campaign regions resolve to a complete presentation theme',()=>{
 for(let stage=0;stage<13;stage++)for(const k of ['sky','far','path','ground','shade'])assert.equal(typeof scenicTheme(stage)[k],'number');
 assert.notEqual(scenicTheme(1).kind,scenicTheme(6).kind);
});
