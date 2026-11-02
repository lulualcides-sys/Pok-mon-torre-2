import test from 'node:test';
import assert from 'node:assert/strict';
import {disableNativeCampaignPassiveRegen} from '../tools/pokearena/torre2-native-regen-compat.mjs';
const original='if(t-this.ultimoDano>=REGLAS.curaTras&&this.hp<this.hpMax&&!helado&&!this.est.enfermo){this.hp+=d;}';
test('Arena keeps native regeneration; Kanto campaign blocks it',()=>{
 const output=disableNativeCampaignPassiveRegen(original);
 assert.match(output,/&&!this\.escena\.datos\?\.torre2\)\{/);
 assert.match(output,/this\.hp\+=d;/);
 assert.equal(disableNativeCampaignPassiveRegen(output),output);
});
test('additional upstream modifiers stay intact',()=>{
 const code='if(t-this.ultimoDano>=REGLAS.curaTras&&this.hp<this.hpMax&&!helado&&!this.est.enfermo&&this.canHeal){return 1;}';
 assert.match(disableNativeCampaignPassiveRegen(code),/this\.canHeal&&!this\.escena/);
});
test('unknown or multiple healing guards refuse mutation',()=>{
 for(const code of [
  'if(this.hp<this.hpMax){this.hp+=d;}',
  original+original,
  'if(t-this.ultimoDano>=REGLAS.curaTras&&this.hp<this.hpMax&&!helado&&!this.est.enfermo&&torre2){this.hp+=d;}'
 ])assert.throws(()=>disableNativeCampaignPassiveRegen(code));
});
