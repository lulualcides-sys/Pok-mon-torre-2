// Descobridor de nova versão do cliente-base: segue imports, Alpha só via config.js,
// assets e manifesto PMD; para com mensagem clara se o site responder 403.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const load=()=>import('../tools/pokearena/discover-upstream-capture.mjs');
const ORIGIN='https://www.pokearena2d.com';

function fakeSite(files){
 return async url=>{
  const rel=url.slice(ORIGIN.length+1)||'index.html';
  if(files[rel]===403)throw Error('HTTP 403');
  if(files[rel]==null)throw Error('HTTP 404');
  return {data:Buffer.from(files[rel])};
 };
}

const SITE={
 'index.html':'<script type="module" src="src-abcdef0123/main.js"></script>',
 'src-abcdef0123/main.js':'import {a} from "./a.js";import "./b.js";const x=()=>import("./jefes/c.js");',
 'src-abcdef0123/config.js':'const VERSION="0.78.0";export{VERSION};',
 'src-abcdef0123/a.js':'const IDI={en:"English",pt:"Português"};const f=l=>import(`./idiomas/${l}.js`);export const a=1;',
 'src-abcdef0123/b.js':'const img="assets/vfx/fogo.png";export default img;',
 'src-abcdef0123/jefes/c.js':'import {a} from "../a.js";export default a;',
 'src-abcdef0123/idiomas/pt.js':'export default {};',
 'assets/vfx/fogo.png':'PNG',
 'assets/pmd/manifest.json':JSON.stringify({pikachu:{walk:'0025/Walk-Anim.png'}}),
 'assets/pmd/0025/Walk-Anim.png':'PNG2',
};

test('segue imports estáticos, dinâmicos, com template e baixa assets + PMD',async()=>{
 const {discover}=await load();
 const out=await fs.mkdtemp(path.join(os.tmpdir(),'disc-'));
 const r=await discover({out,get:fakeSite(SITE),log:()=>{}});
 assert.equal(r.alpha,'0.78.0');
 assert.equal(r.src,'src-abcdef0123');
 const pin=JSON.parse(await fs.readFile(path.join(out,'alpha0780-source-modules.json'),'utf8'));
 assert.deepEqual(Object.keys(pin.modules).sort(),
  ['a.js','b.js','config.js','idiomas/pt.js','jefes/c.js','main.js']);
 assert.ok(pin.assets['assets/vfx/fogo.png']);
 assert.ok(pin.assets['assets/pmd/0025/Walk-Anim.png']);
 assert.deepEqual(pin.failures,[],'candidatos de template ausentes (idiomas/en.js) não contam como falha');
 assert.ok(pin.authorization?.date);
});

test('403 no main.js para com aviso, sem inventar versão',async()=>{
 const {discover}=await load();
 const out=await fs.mkdtemp(path.join(os.tmpdir(),'disc-'));
 await assert.rejects(discover({out,get:fakeSite({...SITE,'src-abcdef0123/main.js':403}),log:()=>{}}),/HTTP 403/);
});

test('sem VERSION no config.js a Alpha fica nula e vira falha registrada',async()=>{
 const {discover}=await load();
 const out=await fs.mkdtemp(path.join(os.tmpdir(),'disc-'));
 const r=await discover({out,withAssets:false,get:fakeSite({...SITE,'src-abcdef0123/config.js':'export{}'}),log:()=>{}});
 assert.equal(r.alpha,null);
 assert.ok(r.failures>=1);
});
