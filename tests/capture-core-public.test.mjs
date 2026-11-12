import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectCore,officialDirectory,readOfficialAlpha,isNativeData} from '../tools/pokearena/capture-core-public.mjs';

const SITE='https://www.pokearena2d.com/';
const DIR='src-abcdef1234';
const home='<script type="module" src="'+DIR+'/main.js"></script>';
const files={
 'main.js':'import{TODOS}from"./datos.js";console.log(TODOS);',
 'config.js':'const VERSION="0.69.5";export{VERSION};',
 'datos.js':'const TODOS=[{id:"pikachu",kit:{}}];export{TODOS};',
 'notas.js':'export const NOTES=[];',
 'habilidades.js':'export const FXS={};',
 'pokedex.js':'export const DEX={};'
};
const valid=(body,url)=>({data:Buffer.from(body),contentType:'text/javascript',url});
function fake(opts={}) {
 return async url=>{
   if(url===SITE)return valid(home,url);
   const filename=url.split('/').at(-1);
   if(opts.fail===filename)throw Error('HTTP 403');
   if(!(filename in files))throw Error('HTTP 404');
   return valid(files[filename],url);
 };
}
test('read official, homepage-declared src rather than arbitrary first match',()=>{
 assert.equal(officialDirectory('src-deadbeef00 '+home),DIR);
 assert.equal(officialDirectory('<script src="src-bad/main.js"></script>'),null);
 assert.equal(readOfficialAlpha('const VERSION="0.69.5";'),'0.69.5');
 assert.equal(isNativeData('const TODOS=[];export{TODOS};'),true);
 assert.equal(isNativeData('const TODOS=[];'),false);
});
test('core audit verifies Alpha, checksums, and keeps playable=false',async()=>{
 const {result,captured}=await inspectCore(fake());
 assert.equal(result.alpha,'0.69.5');
 assert.equal(result.complete,true);
 assert.equal(result.playableVerified,false);
 assert.equal(result.sourceDir,DIR);
 assert.equal(result.files.length,6);
 assert.ok(result.files.every(x=>/^[a-f0-9]{64}$/.test(x.sha256)));
 assert.ok(captured.has('datos.js'));
});
test('missing original title JPEG is irrelevant to inspecting native JavaScript',async()=>{
 const {result}=await inspectCore(fake());
 assert.equal(result.complete,true);
 assert.ok(!result.files.some(x=>x.path.includes('portada')));
});
test('403 on optional file remains explicit and does not falsify core status',async()=>{
 const {result}=await inspectCore(fake({fail:'pokedex.js'}));
 assert.equal(result.complete,true);
 assert.equal(result.failed.length,1);
 assert.match(result.failed[0].error,/403/);
});
test('403 on datos.js prevents verified result',async()=>{
 const {result,captured}=await inspectCore(fake({fail:'datos.js'}));
 assert.equal(result.complete,false);
 assert.ok(result.failed.some(x=>x.path.endsWith('datos.js')&&x.required));
 assert.equal(captured.has('datos.js'),false);
});
test('unverified Alpha refuses release even if all script HTTP GET succeed',async()=>{
 const {result}=await inspectCore(async u=>{
  const out=await fake()(u);
  if(u.endsWith('/config.js'))return valid('export const V=1;',u);
  return out;
 });
 assert.equal(result.complete,false);
 assert.equal(result.alpha,null);
});
test('untrusted homepage with no main.js refuses capture',async()=>{
 const {result}=await inspectCore(async url=>valid('<html>not the game</html>',url));
 assert.equal(result.complete,false);
 assert.match(result.error,/main\.js/);
});
