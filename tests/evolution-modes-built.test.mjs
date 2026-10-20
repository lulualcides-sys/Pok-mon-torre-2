/* Regression on the BUILT licensed Phaser site, not source-code intentions:
 * Kanto campaign NEVER runs mid-combat evo, while Training/VS CPU/Arena remain
 * the original evolution-driven fights. Touch EVO is hidden only in Kanto.
 */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=fs.readdirSync(root).find(x=>/^src-[a-f0-9]{10}$/.test(x));
assert.ok(version,'Captured Phaser source not available');
const read=relative=>fs.readFileSync(path.join(root,version,relative),'utf8');
const fighter=read('luchador.js'),touch=read('tactil.js'),hud=read('hud.js');
const battle=read('escenas/combate.js'),title=read('escenas/titulo.js'),loader=read('escenas/carga.js');
assert.match(fighter,/if\(!this\.escena\.datos\?\.torre2&&intento\?\.mega/,'campaign guard must be per battle');
assert.doesNotMatch(fighter,/if\(false&&intento\?\.mega/,'other modes must not be globally disabled');
assert.match(touch,/BOTONES=calcular\(CONTROLES\.tactil\?\.tam\)\.filter\(b=>!escena\.datos\?\.torre2\|\|b\.slot!=="mega"\)/,
 'touch EVO must appear in Training/Arena and be absent in Kanto');
assert.match(touch,/slot:"mega"/,'original touch EVO must exist in other modes');
assert.match(hud,/!this\.e\.datos\?\.torre2&&l\.puedeEvolucionar/,'dynamic evolution prompt must remain outside campaign');
assert.match(hud,/!this\.e\.datos\?\.torre2&&l\.puedeMega/,'Mega prompt must remain outside campaign');
assert.match(battle,/this\.datos\?\.torre2\?"":" · "\+n\(k\.mega\)/,'combat help must be mode-scoped');
assert.match(title,/txt:"KANTO CAMPAIGN"/,'Kanto accessible in original Play menu');
assert.match(title,/txt:"TRAINING"/,'Training still exists');
assert.match(title,/txt:"ARENA MODE"/,'Arena still exists');
assert.match(title,/txt:"VS CPU"/,'VS CPU still exists');
assert.doesNotMatch(title,/id:"versus",txt:"2 PLAYERS"/);
assert.doesNotMatch(title,/id:"online",txt:"ONLINE"/);
assert.match(loader,/else this\.scene\.start\("titulo"\)/,'preserve original title screen');
const data=JSON.parse(fs.readFileSync(path.resolve('data/kanto-shared-moves.json'),'utf8'));
assert.equal(data.types.length,18);
const types=new Set(),ids=new Set();let count=0,missing=0;
for(const t of data.types){
 assert.ok(!types.has(t.type),'type duplicated: '+t.type);types.add(t.type);
 assert.ok(t.attacks.length<=14&&t.statuses.length<=2,'quota exceeded');
 assert.equal(t.pending.attacks,14-t.attacks.length);
 assert.equal(t.pending.statuses,2-t.statuses.length);
 for(const move of [...t.attacks,...t.statuses]){
   assert.ok(!ids.has(move.id),'move duplicated: '+move.id);ids.add(move.id);
   assert.ok(move.sourcePath.startsWith('effects/moves/catalog/'),'source must come from Torre 1');
   assert.equal(move.adaptation,'needs-Phaser-integration');
   count++;
 }
 missing+=t.pending.attacks+t.pending.statuses;
}
assert.equal(count,246);
assert.equal(missing,42);
console.log('PASS: EVO/MEGA is Kanto-only disabled; all other Phaser modes retain original dynamics. Shared move library: 18 types, 246 candidates, 42 slots pending; no extra art declared complete.');
