/* T26 — original client assets: missing League logos never 404.
 * The fallback must reproduce the original client's procedural icon pixels.
 * It must not overwrite original uploaded or licensed assets.
 */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {inflateSync} from 'node:zlib';
import {nativeLeagueIconPatterns,pngFromNativePattern} from '../tools/pokearena/install-native-league-icons.mjs';

const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const capture=path.resolve('site-capture/pokearena-client');
const modules=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const insignias=fs.readFileSync(path.join(root,modules,'insignias.js'),'utf8');
const loading=fs.readFileSync(path.join(root,modules,'escenas/carga.js'),'utf8');
const patterns=nativeLeagueIconPatterns(insignias);
const names=['l1','l2','l3','l4','l5','l6','l7','retos'];
const hashes=new Set();
for(const name of names){
 const file=path.join(root,'assets/ui/ligas',name+'.png');
 const source=path.join(capture,'assets/ui/ligas',name+'.png');
 assert.ok(fs.existsSync(file),'Original Phaser boot requests missing League texture '+name);
 const actual=fs.readFileSync(file);
 assert.deepEqual(actual.subarray(0,8),Buffer.from([137,80,78,71,13,10,26,10]),
  'League icon must be a real PNG, not an HTML fallback');
 const width=actual.readUInt32BE(16),height=actual.readUInt32BE(20);
 assert.ok(width>=8&&height>=8&&width<=512&&height<=512,'Bad League image dimensions');
 if(fs.existsSync(source)){
  assert.deepEqual(actual,fs.readFileSync(source),'Original League sprite must never be overwritten');
 }else{
  const expected=pngFromNativePattern(patterns[name]);
  assert.deepEqual(actual,expected,'Fallback must use unchanged original native icon pixels '+name);
  const marker=Buffer.from('IDAT','ascii'),at=actual.indexOf(marker);
  assert.ok(at>8,'PNG must contain image data');
  const size=actual.readUInt32BE(at-4),scanlines=inflateSync(actual.subarray(at+4,at+4+size));
  assert.equal(scanlines.length,(56*4+1)*56,'Transparent PNG must contain 56x56 pixel art');
  for(let y=0;y<56;y++)assert.equal(scanlines[y*(56*4+1)],0,'Unexpected PNG scanline filter');
 }
 hashes.add(actual.toString('base64'));
}
assert.equal(hashes.size,8,'Eight native League icons must not be duplicates');
assert.match(loading,/liga-\$\{id\}/,'Native Phaser loading keys must be preserved');
console.log('PASS T26: 8 League/challenge PNGs present, original files preserved, native procedural pixel-art fallbacks verified.');
