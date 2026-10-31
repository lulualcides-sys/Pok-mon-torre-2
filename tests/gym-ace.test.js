import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {gymAceSpec,preloadGymAce,renderGymAce} from '../tools/pokearena/torre2-gym-ace.js';

// The original campaign-core imports build-time-renamed modules; parse only
// its static GYMS and KANTO_DEX literals without executing the game runtime.
const core=readFileSync(new URL('../tools/pokearena/torre2-campaign-core.js',import.meta.url),'utf8');
const gymLiteral=core.match(/export const GYMS=Object\.freeze\((\[[\s\S]*?\])\);/);
const dexLiteral=core.match(/export const KANTO_DEX=Object\.freeze\('([^']+)'\.split\(','\)\);/);
assert.ok(gymLiteral&&dexLiteral,'canonical GYMS/KANTO_DEX literals must exist');
const GYMS=runInNewContext('('+gymLiteral[1]+')',{}, {timeout:1000});
const KANTO_DEX=dexLiteral[1].split(',');
const expected=[['Brock','onix','0095'],['Misty','starmie','0121'],
 ['Lt. Surge','raichu','0026'],['Erika','vileplume','0045'],
 ['Koga','weezing','0110'],['Sabrina','alakazam','0065'],
 ['Blaine','arcanine','0059'],['Giovanni','rhyhorn','0111']];
test('all eight decorative aces come from the live canonical boss and roster',()=>{
 for(const [stage,[leader,species,dex]] of expected.entries()){
  const before=JSON.stringify(GYMS[stage]);
  const ace=gymAceSpec(stage,GYMS,KANTO_DEX);
  assert.equal(ace.leader,leader);assert.equal(ace.species,species);
  assert.equal(ace.dex,dex);assert.equal(ace.textureKey,'torre2-portrait-'+dex);
  assert.ok(GYMS[stage].leaderTeam.includes(ace.species));
  assert.equal(JSON.stringify(GYMS[stage]),before);
 }
 assert.equal(gymAceSpec(8,GYMS,KANTO_DEX),null);
 assert.equal(gymAceSpec(-1,GYMS,KANTO_DEX),null);
 assert.equal(gymAceSpec(1.5,GYMS,KANTO_DEX),null);
});
test('preload is local, idempotent and never fetches from a CDN',()=>{
 const loaded=[],scene={textures:{exists:()=>false},load:{image:(...args)=>loaded.push(args)}};
 const ace=preloadGymAce(scene,1,GYMS,KANTO_DEX);
 assert.equal(ace.species,'starmie');
 assert.deepEqual(loaded,[['torre2-portrait-0121','assets/pmd/0121/portrait.png']]);
 assert.equal(preloadGymAce(scene,9,GYMS,KANTO_DEX),null);
});
test('render is visual only: no hit zones, collision, state writes or oversized sprites',()=>{
 const calls=[],source={width:40,height:40};
 const display={setOrigin(){return this},setScale(v){calls.push(['scale',v]);return this},
  setDepth(){return this},setData(k,v){calls.push(['ace',k,v]);return this},destroy(){calls.push('destroySprite')}};
 const shadow={setDepth(){return this},destroy(){calls.push('destroyShadow')}};
 const tween={stop(){calls.push('stop')}};
 const scene={textures:{exists:()=>true,get:()=>({getSourceImage:()=>source})},
  add:{image:(...args)=>{calls.push(['image',...args]);return display},
   ellipse:(...args)=>{calls.push(['shadow',...args]);return shadow}},
  tweens:{add:args=>{calls.push(['tween',args.duration,args.repeat]);return tween}}};
 const rendered=renderGymAce(scene,0,GYMS,KANTO_DEX,{x:465,y:135,maxWidth:36,maxHeight:42});
 assert.equal(rendered.spec.species,'onix');
 assert.ok(calls.some(x=>x[0]==='scale'&&x[1]===.9));
 assert.equal(calls.filter(x=>x[0]==='image').length,1);
 assert.equal(calls.filter(x=>x[0]==='shadow').length,1);
 rendered.dispose();assert.ok(calls.includes('destroySprite'));
 assert.ok(calls.includes('destroyShadow'));assert.ok(calls.includes('stop'));
});
