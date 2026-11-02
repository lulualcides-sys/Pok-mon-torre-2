import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync('tools/pokearena/torre2-gym-presentation.js','utf8').replace(/^import .*;\n/gm,'');
const {gymPresentationModel,gymAceKey}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const stage={leader:'Brock',city:'Pewter',badge:'Rocha',type:'ROCK',boss:'onix',leaderLevels:[12,14]};
test('gym presentation uses actual progress/rewards without mutating the save',()=>{
 const state={stage:0,trainer:10,badges:[],money:400},before=JSON.stringify(state);
 const m=gymPresentationModel(state,stage,{id:'onix',level:14},13,{name:'TM39 ROCK TOMB'});
 assert.equal(m.remaining,3);assert.equal(m.ready,false);assert.equal(m.ace,'onix');assert.equal(m.tm,'TM39 ROCK TOMB');assert.equal(m.earned,false);
 assert.equal(JSON.stringify(state),before);
 const ready=gymPresentationModel({...state,trainer:13,badges:['Rocha']},stage,{id:'onix',level:14},13,null);
 assert.equal(ready.ready,true);assert.equal(ready.earned,true);assert.equal(ready.tm,null);
});
test('champion preview uses the real starter-dependent opponent instead of fixed Charizard',()=>{
 const m=gymPresentationModel({stage:12,trainer:0,badges:[]},{...stage,boss:'charizard'},{id:'blastoise',level:63},0,null);
 assert.equal(m.ace,'blastoise');assert.equal(m.level,63);assert.equal(m.kind,'rival');assert.equal(m.tm,null);
 assert.equal(gymPresentationModel({stage:12,trainer:0,champion:true},stage,null,0,null).ready,false);
});
test('gym textures have their own namespace instead of replacing battle PMD assets',()=>{
 assert.equal(gymAceKey('0095'),'torre2-gym-ace-0095');
});

import {EventEmitter} from 'node:events';
const {paintGymAce}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
function fixture(){
 const textures=new Map(),load=new EventEmitter(),events=new EventEmitter();
 load.list={entries:[]};load.isLoading=()=>false;load.start=()=>{};
 load.spritesheet=(key)=>load.list.entries.push({key});
 const scene={load,events,registry:{get:()=>Object.fromEntries(['0095','0121'].map(id=>[id,{anims:{Idle:{file:id+'/Idle.png',fw:64,fh:64}}}]))},
  textures:{getTextureKeys:()=>[...textures.keys()],exists:k=>textures.has(k),get:()=>({setFilter:()=>{}}),remove:k=>textures.delete(k)},
  add:{image:()=>{const image={active:true,setOrigin(){return this},setDepth(){return this},setScale(){return this},setData(){return this},destroy(){this.active=false}};return image}}};
 const anchor=()=>{const a=new EventEmitter(),data=new Map();a.active=true;a.getData=k=>data.get(k);a.setData=(k,v)=>data.set(k,v);a.destroy=()=>{a.active=false;a.emit('destroy')};return a};
 const complete=dex=>{const key=gymAceKey(dex);textures.set(key,{});load.list.entries=load.list.entries.filter(x=>x.key!==key);load.emit('filecomplete',key);load.emit('filecomplete-spritesheet-'+key)};
 return{scene,anchor,complete,textures};
}
test('leaving while the ace loads removes the late menu texture',()=>{
 const f=fixture(),a=f.anchor();paintGymAce(f.scene,'0095',a);a.destroy();f.complete('0095');
 assert.equal(f.textures.size,0);assert.equal(a.getData('ace-painted'),undefined);
});
test('rapid gym A to B discards late A and releases B on exit, preserving battle textures',()=>{
 const f=fixture(),a=f.anchor(),b=f.anchor();f.textures.set('pmd-0095-Idle',{});
 paintGymAce(f.scene,'0095',a);a.destroy();paintGymAce(f.scene,'0121',b);
 f.complete('0095');f.complete('0121');assert.equal(b.getData('ace-painted'),true);
 assert.deepEqual([...f.textures.keys()],['pmd-0095-Idle','torre2-gym-ace-0121']);
 b.destroy();assert.deepEqual([...f.textures.keys()],['pmd-0095-Idle']);
});
