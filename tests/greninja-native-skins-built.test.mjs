// Native offline Greninja assets must be present in the ACTUAL Phaser build.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {GRENINJA_DEX,GRENINJA_VARIANTS,verifyGreninjaManifest}
 from '../tools/pokearena/torre2-greninja-variants.mjs';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(await fs.readFile(path.join(root,'version.json'),'utf8'));
const client=version.modules; // Fingerprinted final patched Phaser source, not upstream version.src
assert.match(client,/^src-[a-f0-9]{10}$/);
const manifest=JSON.parse(await fs.readFile(path.join(root,'assets/pmd/manifest.json'),'utf8'));
const count=verifyGreninjaManifest(manifest);
const assets=[];
for(const dex of GRENINJA_DEX)for(const style of GRENINJA_VARIANTS){
 const k=dex+'-'+style.folder;
 for(const file of ['Idle-Anim.png','Walk-Anim.png','Attack-Anim.png','portrait.png']){
  const dest=path.join(root,'assets/pmd',k,file);
  const s=await fs.stat(dest);
  assert.ok(s.size>200,'Empty native Greninja asset: '+k+'/'+file);
  assets.push(k+'/'+file);
 }
}
const aspects=await fs.readFile(path.join(root,client,'aspectos.js'),'utf8');
const selection=await fs.readFile(path.join(root,client,'escenas/seleccion.js'),'utf8');
const preparar=await fs.readFile(path.join(root,client,'escenas/preparar.js'),'utf8');
const sprites=await fs.readFile(path.join(root,client,'sprites.js'),'utf8');
assert.match(aspects,/froakie:\["naranja","amarillo","blanco","azabache","azabacheaura"\]/);
assert.match(aspects,/if\(id==="froakie"\)return todos\(id\)/);
assert.match(aspects,/azabacheaura:"RED AURA",azabache:"BLACK"/);
assert.match(selection,/for\(const dex of \["0656","0657","0658"\]\)/);
assert.match(selection,/\["cpu","entreno","versus"\]/);
assert.match(preparar,/desbloqueadoNativo/);
assert.match(sprites,/azabacheaura:"azabache"/,
 'Final skin uses the original black animation frames');
assert.match(sprites,/azabacheaura:\{color:16722474/,
 'Final skin must use the original crimson AuraAspecto glow renderer');
const native=await fs.readFile(path.join(root,client,'datos.js'),'utf8');
assert.match(native,/nombre:"GRENINJA"/,'Greninja native move kit is preserved');
const report={build:client,colors:GRENINJA_VARIANTS.map(x=>x.id),forms:GRENINJA_DEX.length,
 sprites:count.spriteFolders,filesVerified:assets.length,rebuiltMoveKit:false};
console.log('PASS_NATIVE_GRENINJA_FIVE_SKINS',JSON.stringify(report));
