import test from 'node:test';
import assert from 'node:assert/strict';
import {FIRE_PARTICLE_CAP,isFireParticleTexture,capFireEmitter,installFireParticleCap} from '../tools/pokearena/torre2-fire-particle-cap.js';

test('only fire textures are capped (llama glow and animated vfx-llam flames)',()=>{
 for(const k of ['llama','vfx-llamitas-calor','vfx-llamas-x'])assert.equal(isFireParticleTexture(k),true,k);
 for(const k of ['vfx-copos','humo','px2','gota','vfx-chorro','estrella',undefined])assert.equal(isFireParticleTexture(k),false,String(k));
 assert.equal(FIRE_PARTICLE_CAP,250);
});

test('cap keeps a stricter existing limit and never touches other emitters',()=>{
 const fire={texture:{key:'llama'},maxAliveParticles:0};
 assert.equal(capFireEmitter(fire),true);assert.equal(fire.maxAliveParticles,250);
 const strict={texture:{key:'llama'},maxAliveParticles:40};
 assert.equal(capFireEmitter(strict),false);assert.equal(strict.maxAliveParticles,40);
 const ice={texture:{key:'vfx-copos'},maxAliveParticles:0};
 assert.equal(capFireEmitter(ice),false);assert.equal(ice.maxAliveParticles,0);
});

test('factory wrapper is installed once and caps emitters created by any scene',()=>{
 const made=[];
 class Factory{particles(x,y,texture){const e={texture:{key:texture},maxAliveParticles:0};made.push(e);return e}}
 const P={GameObjects:{GameObjectFactory:Factory}};
 assert.equal(installFireParticleCap(P),true);
 assert.equal(installFireParticleCap(P),true,'second install is a no-op');
 const f=new Factory();
 assert.equal(f.particles(0,0,'vfx-llamitas-calor').maxAliveParticles,250);
 assert.equal(f.particles(0,0,'humo').maxAliveParticles,0);
 assert.equal(installFireParticleCap({}),false,'no Phaser: nothing to wrap');
});
