import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Execute the actual patch injected into native fighter.actualizarGraficos,
// not a copy of its logic: a normal Walk/Attack texture must survive ticks.
const source=readFileSync(new URL('../tools/pokearena/publish-hotfix-on-alpha0713.mjs',import.meta.url),'utf8');
const from=source.indexOf('const branchSpriteSync=');
const to=source.indexOf('fighter=fighter.replace(spriteGraphicsAnchor,spriteGraphicsAnchor+branchSpriteSync);',from);
assert.ok(from>0&&to>from,'Source has changed: inspect native sprite synchronization');
const snippet=source.slice(from,to);
const injected=new Function(snippet+'\nreturn branchSpriteSync;')();
assert.ok(injected.includes('this.cambiarForma(dex)'));
const frame=new Function('dt',injected);

function fighter({dex='0212',target='0212',mode='cpu',campaign=false,stage=1}={}){
 const calls={stop:0,set:0,change:0};
 const spr={
  active:true,
  texture:{key:'pmd-'+dex+'-Walk'},
  anims:{stop(){calls.stop++;}},
  setTexture(key){calls.set++;this.texture.key=key;return this;}
 };
 const player={
  escena:{datos:{modo,torre2:campaign},manifiesto:{'0212':{anims:{Idle:{},Walk:{},Attack:{}}}},
   textures:{exists:key=>key==='pmd-0212-Idle'}},
  def:{id:'scyther',torre2ArenaAdded:true},
  etapa:stage,dex,dexActual:target,spr,claveAnim:dex+'-Walk-0',
  kit:null,
  cambiarForma(to){calls.change++;this.dex=to;this.claveAnim=null;},
  kitActual(){return {lmb:{nombre:'X-Scissor'}};}
 };
 return {player,spr,calls};
}

test('an evolved fighter keeps Walk and attack animation textures between frames',()=>{
 const {player,spr,calls}=fighter();
 for(let i=0;i<60;i++){
  spr.texture.key=i%3===0?'pmd-0212-Attack':'pmd-0212-Walk';
  frame.call(player,1/60);
  assert.equal(spr.texture.key,i%3===0?'pmd-0212-Attack':'pmd-0212-Walk');
 }
 assert.deepEqual(calls,{stop:0,set:0,change:0});
 assert.equal(player.claveAnim,'0212-Walk-0');
});

test('a real dex transition may reset the old animation only once',()=>{
 const {player,spr,calls}=fighter({dex:'0123'});
 frame.call(player,1/60);
 assert.equal(player.dex,'0212');
 assert.equal(spr.texture.key,'pmd-0212-Idle');
 assert.deepEqual(calls,{stop:1,set:1,change:1});
 for(let i=0;i<30;i++){
  spr.texture.key='pmd-0212-Walk';
  frame.call(player,1/60);
  assert.equal(spr.texture.key,'pmd-0212-Walk');
 }
 assert.deepEqual(calls,{stop:1,set:1,change:1});
});

test('campaign, online and unevolved sprites retain original native behavior',()=>{
 for(const options of [{campaign:true,dex:'0123'},
  {mode:'online',dex:'0123'},{stage:0,dex:'0123'}]){
  const {player,spr,calls}=fighter(options);
  frame.call(player,1/60);
  assert.equal(spr.texture.key,'pmd-0123-Walk');
  assert.deepEqual(calls,{stop:0,set:0,change:0});
 }
});
