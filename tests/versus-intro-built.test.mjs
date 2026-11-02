import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
const folder=path.join(root,version.modules,'torre2');
const intro=fs.readFileSync(path.join(folder,'versus-intro.js'),'utf8');
const scene=fs.readFileSync(path.join(folder,'campanha.js'),'utf8');
const main=fs.readFileSync(path.join(root,version.modules,'main.js'),'utf8');
test('Phaser deployed module tree includes cache-busted intro and campaign import',()=>{
 assert.match(version.modules,/^src-[a-f0-9]{10}$/);
 assert.match(main,/from"\.\/torre2\/campanha\.js"/);
 assert.match(scene,/from '\.\/versus-intro\.js'/);
 assert.match(intro,/export function playVersusIntro/);
 assert.match(intro,/originalBallSprite/);
 assert.match(intro,/scene\.add\.container/);
});
