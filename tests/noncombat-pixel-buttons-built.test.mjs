/* Check the REAL compiled Phaser game; do not substitute a mock screenshot.
 * Every arena battle control/HUD remains outside the menu skin's import graph.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const base=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const {modules}=JSON.parse(fs.readFileSync(path.join(base,'version.json'),'utf8'));
const root=path.join(base,modules);
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const title=read('escenas/titulo.js'),select=read('escenas/seleccion.js');
const prepare=read('escenas/preparar.js'),pokedex=read('escenas/pokedex.js');
const campaignArt=read('torre2/campaign-art.js');
const skin=read('torre2/noncombat-pixel-buttons.js');

assert.ok(title.includes('b.g.fillRect(x0+6,y0+3,9,2)'),'Menu principal not skinned');
assert.ok(select.includes('pixelMenuButton as boton'),'Pokémon selection not skinned');
assert.ok(prepare.includes('pixelMenuButton as boton'),'Prebattle configuration not skinned');
assert.ok(pokedex.includes('g.fillRect(x0+4,PY+5'),'Pokédex tabs not skinned');
assert.ok(campaignArt.includes('Pixel Art Premium'),'Shop, bag and map button frames not skinned');
assert.ok(skin.includes("zone.setData('torre2-ui-theme','premium-noncombat')"));
assert.ok(skin.includes('zone.input.enabled=visible'),'Hidden hitboxes must disable on mobile');
assert.ok(skin.includes('t.alRepintar=measure'),'Dynamic text must resize its click target');
assert.ok(skin.includes('setSize(w,altoZona)'),'Touch hit areas must follow labels');
assert.ok(skin.includes('ancho(){return dimensions().w}'),'Original selection needs boton.ancho()');
assert.ok(skin.includes('apagar(value){dimmed=Boolean(value);draw();return this}'),'Original UI needs boton.apagar()');
for(const noTouch of ['ui.js','hud.js','tactil.js','escenas/combate.js','escenas/batalla.js']){
 const js=read(noTouch);
 assert.ok(!js.includes('noncombat-pixel-buttons'),'Battle/client shared UI import changed: '+noTouch);
 assert.ok(!js.includes('torre2-ui-theme'),'Noncombat menu skin leaked into '+noTouch);
}
assert.ok(!title.includes("from'../torre2/noncombat-pixel-buttons.js'"),'Title uses its approved native icon scene');
console.log('NONCOMBAT PREMIUM PIXEL BUTTON BUILD PASS',JSON.stringify({
 release:modules,scenes:['titulo','seleccion','preparar','pokedex','campanha'],
 arenaHud:'unchanged by premium menu skin'
}));
