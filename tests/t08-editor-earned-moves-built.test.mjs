/* T08: real compiled Phaser move editor must permit earned Kanto attacks
 * in an alternate compatible role. Fixtures are NOT a natural campaign.
 * No new attack, VFX, learnset, cooldown or save format is introduced.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const {modules}=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
const load=name=>import(pathToFileURL(path.join(root,modules,name)).href);
const [pool,core]=await Promise.all([
 load('torre2/move-pool.js'),load('torre2/campaign-core.js')
]);
const make=(id,level)=>({id,progression:{species:id,level},tmMoves:[]});
const pidgey=make('pidgey',8);
assert.ok(!pool.availableMoves(pidgey).some(m=>m.id==='quick-attack'),
 'Lv8 cannot equip the future genuine Quick Attack');
assert.equal(pool.equipMove(pidgey,0,'quick-attack'),false,
 'Lv8 must not bypass the species level gate');
pidgey.progression.level=11;
const gust=pool.availableMoves(pidgey).find(m=>m.id==='gust');
assert.ok(gust?.forma&&gust.dano>0&&gust.dano<=12,
 'Pidgey Lv11 needs a genuine learned weak Gust');
assert.equal(pool.equipMove(pidgey,0,'gust'),true,
 'A learned weak attack must be selectable in ATK, not hard-locked to Tackle');
assert.equal(pool.selectedMoves(pidgey)[0],'gust');
assert.equal(pool.resolveLoadout(pidgey).lmb?.id,'gust',
 'Battle must use the move selected in the editor');
assert.equal(pool.equipMove(pidgey,3,'gust'),false,
 'Lv11 must retain the weak meter-gated ULT');
assert.equal(pool.equipMove(pidgey,0,'blizzard'),false,
 'Editor must reject an incompatible Kanto attack');
const high=make('pikachu',50);
const existing=pool.selectedMoves(high);
const other=pool.availableMoves(high).find(m=>
 !existing.includes(m.id)&&!m.torre2IntroPractice&&
 Number.isFinite(m.dano)&&m.dano>0);
assert.ok(other,'Pikachu Lv50 must have an earned alternate ULT option');
assert.equal(pool.equipMove(high,3,other.id),true,
 'A learned attack must be selectable as a meter-gated ULT at Lv13+');
assert.equal(pool.resolveLoadout(high).e?.id,other.id);
assert.equal(pool.resolveLoadout(high).e?.ulti,true,
 'Replacing ULT must retain the native energy gate');
const storageData=new Map();
const storage={
 getItem:key=>storageData.get(key)??null,
 setItem:(key,value)=>storageData.set(key,String(value)),
 removeItem:key=>storageData.delete(key)
};
const state=core.createCampaign('bulbasaur');
state.team[0]={...state.team[0],id:'pidgey',
 progression:{...state.team[0].progression,species:'pidgey',level:11},
 tmMoves:[],moves:null,movePlanSpecies:null};
core.saveCampaign(state,storage);
assert.equal(core.equipCampaignMove(state,0,0,'gust',storage),true);
assert.equal(state.team[0].moves[0],'gust');
const loaded=core.readCampaign(storage);
assert.equal(loaded.team[0].moves[0],'gust',
 'Equipped genuine move must survive reload from the saved checkpoint');
assert.equal(pool.resolveLoadout(loaded.team[0]).lmb?.id,'gust',
 'Reloaded battle must use the saved legal move');
console.log('T08_EARNED_EDITOR_ROLES_PASS',JSON.stringify({
 species:['pidgey','pikachu'],level11:'gust',
 alternateUltimate:other.id,persisted:true,mode:'compiled-fixtures'
}));
