/* Offline reproduction/check of approved vector guides. No runtime build changes. */
import fs from 'node:fs';
import path from 'node:path';
import {renderVectorGuide,VECTOR_REFERENCE_VERSION} from './torre2-vector-reference.mjs';
const root='reference-assets/kanto/vector-reference-v1';
const input=path.join(root,'guides');
const output=path.join(root,'rendered');
const check=process.argv.includes('--check');
const names=fs.readdirSync(input).filter(x=>x.endsWith('.json')).sort();
if(names.length<3)throw new Error('expected at least 3 reference guides');
const manifest={schema:VECTOR_REFERENCE_VERSION,generatedBy:'tools/pokearena/build-vector-reference.mjs',
 status:'visual-candidates-not-game-assets',assets:[]};
for(const file of names){
 const guide=JSON.parse(fs.readFileSync(path.join(input,file),'utf8'));
 const rendered=renderVectorGuide(guide);
 if(rendered.warnings.length)throw new Error(file+': '+rendered.warnings.join(', '));
 const relative=guide.name+'.svg',dest=path.join(output,relative);
 if(check){
  if(!fs.existsSync(dest)||fs.readFileSync(dest,'utf8')!==rendered.svg)throw new Error('generated SVG mismatch: '+dest);
 }else{fs.mkdirSync(output,{recursive:true});fs.writeFileSync(dest,rendered.svg);}
 manifest.assets.push({name:guide.name,kind:guide.kind,source:'guides/'+file,
  output:'rendered/'+relative,paletteCount:rendered.metrics.paletteCount,
  foregroundBounds:rendered.metrics.foregroundBounds,
  foregroundCoverage:rendered.metrics.foregroundCoverage,
  edgeTransitions:rendered.metrics.edgeTransitions,
  seamMismatches:rendered.metrics.seamMismatches.total});
}
const manifestPath=path.join(root,'generated-manifest.json');
const serialized=JSON.stringify(manifest,null,2)+'\n';
if(check){
 if(!fs.existsSync(manifestPath)||fs.readFileSync(manifestPath,'utf8')!==serialized)
  throw new Error('manifest mismatch');
}else fs.writeFileSync(manifestPath,serialized);
console.log('Kanto reference engine',check?'checked':'rendered',names.length,'guides');
