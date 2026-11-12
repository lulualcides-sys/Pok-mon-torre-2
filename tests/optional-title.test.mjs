import test from 'node:test';
import assert from 'node:assert/strict';
import {OPTIONAL_TITLE,jpegLooksValid,omitUnavailableTitleLoad} from '../tools/pokearena/torre2-optional-title.mjs';

const tick=String.fromCharCode(96);
const dollar=String.fromCharCode(36);
const source='preload(){this.load.image("ui-logo","assets/ui/logo.png");this.registry.set("fondoPortada",fondoPortada());this.load.image("ui-portada",'+tick+'assets/ui/portada/'+dollar+'{this.registry.get("fondoPortada")}.jpg'+tick+');this.load.image("ui-iconos","assets/ui/iconos.png");}';
test('Only the missing decorative title resource is optional',()=>{
 assert.equal(OPTIONAL_TITLE,'assets/ui/portada/dia.jpg');
 assert.equal(jpegLooksValid(null),false);
 assert.equal(jpegLooksValid(Buffer.alloc(2000)),false);
 const data=Buffer.alloc(2000);data[0]=0xff;data[1]=0xd8;data[data.length-2]=0xff;data[data.length-1]=0xd9;
 assert.equal(jpegLooksValid(data),true);
});
test('Missing title does not prevent boot or change native logo and combat images',()=>{
 const patched=omitUnavailableTitleLoad(source,false);
 assert.ok(!patched.includes('this.load.image("ui-portada"'));
 assert.ok(patched.includes('this.load.image("ui-logo"'));
 assert.ok(patched.includes('this.load.image("ui-iconos"'));
 assert.ok(patched.includes('ui-halo fallback'));
});
test('Verified title is never altered',()=>assert.equal(omitUnavailableTitleLoad(source,true),source));
test('Unexpected native loader fails instead of silently removing game resources',()=>{
 assert.throws(()=>omitUnavailableTitleLoad('this.load.image("ui-logo","logo.png");',false),/Unknown upstream/);
 assert.throws(()=>omitUnavailableTitleLoad(source+source,false),/Unknown upstream/);
});
