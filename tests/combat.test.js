import test from 'node:test';
import assert from 'node:assert/strict';
import {createBattle,MOVES,GYMS,cast,tick,dodge,movePlayer,consumeEvents,elementalMultiplier,WORLD} from '../src/combat-core.js';

test('Kanto has the canonical eight leader gyms in order',()=>{
 assert.equal(GYMS.length,8);
 assert.deepEqual(GYMS.map(g=>g.leader),['Brock','Misty','Lt. Surge','Erika','Koga','Sabrina','Blaine','Giovanni']);
});
test('approved benchmark: 4 separate fire moves with 12 or 16 frames',()=>{
 assert.deepEqual(Object.keys(MOVES),['ember','flamethrower','firespin','fireblast']);
 for(const m of Object.values(MOVES))assert.ok(m.frames===12||m.frames===16);
 assert.equal(MOVES.flamethrower.frames,12);
 assert.equal(MOVES.fireblast.frames,16);
});
test('damage applies ONLY at animated impact, never when move button pressed',()=>{
 const s=createBattle(),initial=s.enemy.hp;
 const c=cast(s,'fireblast',s.enemy);
 assert.equal(c.ok,true);
 assert.equal(s.enemy.hp,initial,'early damage must not be applied');
 tick(s,.04);assert.equal(s.enemy.hp,initial);
 for(let i=0;i<45;i++)tick(s,.04);
 assert.ok(s.enemy.hp<initial,'damage must occur once after travel');
 assert.equal(consumeEvents(s).filter(e=>e.type==='impact').length,1);
});
test('rock receives half fire damage',()=>assert.equal(elementalMultiplier('fire','rock'),.5));
test('player energy and cooldown guard repeated commands',()=>{
 const s=createBattle(),before=s.player.energy;
 const casted=cast(s,'flamethrower',s.enemy);
 assert.equal(casted.ok,true);
 assert.equal(s.player.energy,before-MOVES.flamethrower.cost);
 assert.equal(cast(s,'flamethrower',s.enemy).reason,'cooldown');
});
test('energy regenerates and cooldown elapses at fixed delta',()=>{
 const s=createBattle();
 cast(s,'ember',s.enemy);
 tick(s,.04);assert.ok(s.player.energy>91);
 for(let i=0;i<20;i++)tick(s,.04);
 assert.equal(s.player.cooldowns.ember,0);
});
test('players cannot walk beyond arena or dodge for free',()=>{
 const s=createBattle();
 movePlayer(s,-20,-20,8);
 assert.ok(s.player.x>=WORLD.padding);
 assert.ok(s.player.y>=WORLD.padding);
 const initial=s.player.energy;
 assert.equal(dodge(s,{x:1,y:0}),true);
 assert.equal(s.player.energy,initial-12);
 assert.equal(dodge(s,{x:1,y:0}),false);
});
test('Brock advances from Geodude to Onix, then awards Boulder Badge',()=>{
 const s=createBattle();
 s.enemy.hp=1;
 assert.equal(cast(s,'fireblast',s.enemy).ok,true);
 for(let i=0;i<45;i++)tick(s,.04);
 assert.equal(s.enemy.id,'onix');
 assert.equal(s.status,'fighting');
 s.enemy.hp=1;s.player.energy=100;s.player.cooldowns.fireblast=0;
 assert.equal(cast(s,'fireblast',s.enemy).ok,true);
 for(let i=0;i<45;i++)tick(s,.04);
 assert.equal(s.status,'victory');
 assert.equal(s.badges,1);
});
test('unknown moves rejected, no dummy damage or type confusion',()=>{
 const s=createBattle();
 assert.equal(cast(s,'totally-unknown',s.enemy).reason,'unknown');
 assert.equal(s.enemy.hp,s.enemy.maxHp);
 assert.equal(Object.isFrozen(MOVES.fireblast),true);
});

test('attack originates at the mouth and travels toward a moving opponent',()=>{
 const s=createBattle(),p=s.player,e=s.enemy;
 const result=cast(s,'flamethrower',e);
 assert.equal(result.ok,true);
 const fx=s.projectiles[0];
 assert.ok(fx.origin.y<=p.y-28,'emission must be above the Pokémon foot anchor');
 assert.ok(fx.origin.x>p.x+25,'emission should be outside the Pokémon body');
 assert.ok(fx.direction.y<0,'diagonal projectile should rise toward Geodude');
 assert.equal(e.hp,e.maxHp,'animation must start before any damage');
 for(let i=0;i<45;i++)tick(s,.04);
 assert.ok(e.hp<e.maxHp,'damage must still reach target after muzzle correction');
});

test('Geodude fires a visible moving stone rather than applying invisible proximity damage',()=>{
 const s=createBattle();
 const initial=s.player.hp;
 s.enemy.x=s.player.x+220;s.enemy.y=s.player.y;
 s.enemy.action=.01;
 tick(s,.025);
 assert.equal(s.player.hp,initial,'rock throw cannot damage on cast');
 assert.equal(s.enemyShots.length,1,'enemy must create a visible rock object');
 const born={...s.enemyShots[0]};
 tick(s,.025);
 assert.ok(s.enemyShots[0].x<born.x,'rock travels toward player');
 assert.ok(consumeEvents(s).some(e=>e.type==='enemy-cast'));
});
test('timed dodge protects against rock throw and rock does not hit through invulnerability',()=>{
 const s=createBattle(),hp=s.player.hp;
 s.enemy.x=s.player.x+90;s.enemy.y=s.player.y;
 s.enemy.action=0.01;
 tick(s,.03);
 assert.ok(s.enemyShots.length>0);
 assert.equal(dodge(s,{x:1,y:0}),true);
 for(let i=0;i<12;i++)tick(s,.03);
 assert.equal(s.player.hp,hp,'invulnerable character cannot be hit by Rock Throw');
});
