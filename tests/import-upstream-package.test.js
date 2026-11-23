// Importador de pacote entregue: acha src-*/main.js em qualquer subpasta, exige
// VERSION e todos os imports presentes, copia assets e grava pin com SHA-256.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const load=()=>import('../tools/pokearena/import-upstream-package.mjs');
async function pkg(files){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'pkg-'));
 for(const [rel,text] of Object.entries(files)){
  const f=path.join(root,rel);await fs.mkdir(path.dirname(f),{recursive:true});await fs.writeFile(f,text);
 }
 return root;
}
const S='site/arena2d/src-0123456789/';
const BASE={
 [S+'main.js']:'import "./a.js";const j=()=>import("./jefes/b.js");',
 [S+'config.js']:'const VERSION="0.78.0";export{VERSION};',
 [S+'a.js']:'export const a=1;',
 [S+'jefes/b.js']:'import {a} from "../a.js";export default a;',
 'site/arena2d/assets/pmd/manifest.json':'{}',
 'site/arena2d/index.html':'<script src="src-0123456789/main.js"></script>',
};

test('pacote completo em subpasta é importado com pin, assets e index',async()=>{
 const {importPackage}=await load();
 const out=await fs.mkdtemp(path.join(os.tmpdir(),'imp-'));
 const r=await importPackage(await pkg(BASE),out);
 assert.equal(r.ok,true);assert.equal(r.alpha,'0.78.0');assert.equal(r.src,'src-0123456789');
 assert.equal(r.modules,4);assert.equal(r.assets,1);
 const pin=JSON.parse(await fs.readFile(path.join(out,'alpha0780-source-modules.json'),'utf8'));
 assert.deepEqual(Object.keys(pin.modules).sort(),['a.js','config.js','jefes/b.js','main.js']);
 await fs.access(path.join(out,'source','src-0123456789','jefes','b.js'));
 await fs.access(path.join(out,'source','assets','pmd','manifest.json'));
 await fs.access(path.join(out,'source','index.html'));
});

test('import ausente reprova o pacote e nada é gravado',async()=>{
 const {importPackage}=await load();
 const files={...BASE};delete files[S+'a.js'];
 const out=path.join(os.tmpdir(),'imp-nao-'+Date.now());
 const r=await importPackage(await pkg(files),out);
 assert.equal(r.ok,false);
 assert.ok(r.failures.some(f=>f.includes('-> a.js')));
 await assert.rejects(fs.access(out));
});

test('sem VERSION oficial reprova',async()=>{
 const {importPackage}=await load();
 const r=await importPackage(await pkg({...BASE,[S+'config.js']:'export{}'}),path.join(os.tmpdir(),'imp-v-'+Date.now()));
 assert.equal(r.ok,false);assert.ok(r.failures.includes('config.js sem VERSION oficial'));
});

test('duas versões no mesmo pacote são recusadas',async()=>{
 const {importPackage}=await load();
 await assert.rejects(importPackage(await pkg({...BASE,'outra/src-aaaaaaaaaa/main.js':'x'}),os.tmpdir()+'/x'),/ambíguo/);
});

test('partes do browser-export-console.js são expandidas e importadas',async()=>{
 const {importPackage}=await load();
 const files={};
 for(const [k,v] of Object.entries(BASE)){const rel=k.replace('site/arena2d/','');files[rel]=Buffer.from(v).toString('base64');}
 const p1={},p2={};Object.entries(files).forEach(([k,v],i)=>(i%2?p2:p1)[k]=v);
 const dir=await pkg({
  'torre2-export-0780-parte-1.json':JSON.stringify({format:'torre2-browser-export-v1',src:'src-0123456789',alpha:'0.78.0',part:1,parts:2,failures:['assets/x.png :: HTTP 404'],files:p1}),
  'torre2-export-0780-parte-2.json':JSON.stringify({format:'torre2-browser-export-v1',src:'src-0123456789',alpha:'0.78.0',part:2,parts:2,failures:[],files:p2}),
 });
 const out=await fs.mkdtemp(path.join(os.tmpdir(),'imp-b-'));
 const r=await importPackage(dir,out);
 assert.equal(r.ok,true);assert.equal(r.alpha,'0.78.0');assert.equal(r.modules,4);
 assert.equal(r.browserExportParts,2);assert.equal(r.assetGaps,1);
});

test('exportação com caminho inseguro é recusada',async()=>{
 const {importPackage}=await load();
 const dir=await pkg({'torre2-export-x.json':JSON.stringify({format:'torre2-browser-export-v1',src:'src-0123456789',files:{'../fora.js':'eA=='}})});
 await assert.rejects(importPackage(dir,os.tmpdir()+'/y'),/caminho inseguro/);
});
