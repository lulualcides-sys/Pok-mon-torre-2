/* Regression on the BUILT licensed Phaser site, not source-code intentions:
 * Kanto campaign NEVER runs mid-combat evo, while Training/VS CPU/Arena remain
 * the original evolution-driven fights. Touch EVO is hidden only in Kanto.
 */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
assert.ok(version,'Captured Phaser source not available');
const read=relative=>fs.readFileSync(path.join(root,version,relative),'utf8');
const fighter=read('luchador.js'),touch=read('tactil.js'),hud=read('hud.js');
const battle=read('escenas/combate.js'),title=read('escenas/titulo.js'),loader=read('escenas/carga.js');
assert.match(fighter,/if\(!this\.escena\.datos\?\.torre2&&intento\?\.mega/,'campaign guard must be per battle');
assert.doesNotMatch(fighter,/if\(false&&intento\?\.mega/,'other modes must not be globally disabled');
assert.match(touch,/BOTONES=calcular\(CONTROLES\.tactil\?\.tam\)\.filter\(b=>!escena\.datos\?\.torre2\|\|b\.slot!=="mega"\)/,
 'touch EVO must appear in Training/Arena and be absent in Kanto');
assert.match(touch,/slot:"mega"/,'original touch EVO must exist in other modes');
// Older native HUD builds displayed optional EVO/MEGA text prompts; both
// were scoped to non-campaign battles. The current upstream HUD removed these
// prompts entirely but still uses puedeEvolucionar to decorate the XP bar.
// Never mistake that passive progress bar for a callable evolution action.
// If a future native client restores either prompt, require the Kanto guard.
const oldEvoPrompt='l.puedeEvolucionar&&l.humano&&parpadeo';
const oldMegaPrompt='l.puedeMega&&l.humano&&parpadeo';
for(const [name,oldCondition] of [['evolution',oldEvoPrompt],['mega',oldMegaPrompt]]){
 if(hud.includes(oldCondition))
  assert.ok(hud.includes('!this.e.datos?.torre2&&'+oldCondition),
   name+' prompt must be hidden in the Kanto campaign');
 else
  assert.ok(!hud.includes('else if('+oldCondition+')est.push('),
   name+' prompt must never reappear unguarded');
}
assert.match(hud,/puedeEvolucionar/,'native HUD evolution XP indicator still exists');
assert.match(battle,/this\.datos\?\.torre2\?"":" · "\+n\(k\.mega\)/,'combat help must be mode-scoped');
assert.match(title,/txt:"KANTO CAMPAIGN"/,'Kanto accessible in original Play menu');
assert.match(title,/txt:"TRAINING"/,'Training still exists');
assert.match(title,/id:"arena",txt:"ARENA(?: MODE)?",escena:"preparar"/,
 'Original Arena mode must remain linked to its native Phaser scene');
assert.match(title,/txt:"VS CPU"/,'VS CPU still exists');
assert.doesNotMatch(title,/id:"versus",txt:"2 PLAYERS"/);
assert.doesNotMatch(title,/id:"online",txt:"ONLINE"/);
assert.match(loader,/else this\.scene\.start\("titulo"\)/,'preserve original title screen');
const data=JSON.parse(fs.readFileSync(path.resolve('data/kanto-new-phaser-moves.json'),'utf8'));
assert.equal(data.types.length,18);
assert.equal(data.artStrategy.renderer,'Poké Arena 2D Phaser 3 / WebGL');
assert.match(data.description,/NOT imported or copied from Torre 1/);
const types=new Set();
let planned=0,missing=0;
for(const type of data.types){
 assert.ok(!types.has(type.type));types.add(type.type);
 assert.ok(type.attack.length<=14&&type.status.length<=2);
 assert.equal(type.openAttackSlots,14-type.attack.length);
 assert.equal(type.openStatusSlots,2-type.status.length);
 for(const move of [...type.attack,...type.status]){
  assert.equal(move.status,'needs-new-phaser-vfx');
  planned++;
 }
 missing+=type.openAttackSlots+type.openStatusSlots;
}
assert.equal(planned,269);
assert.equal(missing,19);
assert.ok(!fs.existsSync(path.resolve('data/kanto-shared-moves.json')),
 'Old Torre 1 import catalog must not be used');
console.log('PASS: Kanto-only EVO disabled; other original Phaser modes retain EVO. 18 scratch-built move pools, 269 planned VFX candidates, zero old Torre 1 art.');
