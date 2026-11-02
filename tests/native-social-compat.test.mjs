import test from 'node:test';
import assert from 'node:assert/strict';
import {disableNativeTitleSocialLinks as withoutLinks} from '../tools/pokearena/torre2-native-social-compat.mjs';

test('T44 social icon method is left intact but removed from title entrypoint',()=>{
 const s='class T{redes(){this.add.image(1,2,"tiktok");}create(){this.redes();this.menu()}}';
 const output=withoutLinks(s);
 assert.match(output,/redes\(\)\{/);
 assert.doesNotMatch(output,/this\.redes\(\)/);
 assert.match(output,/this\.menu\(\)/);
});
test('T44 can handle upstream whitespace or optional call syntax',()=>{
 for(const s of ['this.redes () ;','this.redes?.()','this.redes( );']){
  const result=withoutLinks(s);
  assert.doesNotMatch(result,/this\.redes/);
 }
});
test('T44 no links in current upstream scene needs no patch',()=>{
 const s='class Title {create(){this.menu()}}';
 assert.equal(withoutLinks(s),s);
});
test('T44 duplicated/dynamic social links fail closed',()=>{
 for(const s of ['this.redes();this.redes();','const x=this.redes;','this["redes"]();this.redes()'])
  assert.throws(()=>withoutLinks(s));
});
