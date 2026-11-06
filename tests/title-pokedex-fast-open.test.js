import test from 'node:test';
import assert from 'node:assert/strict';
import {removeCustomizeTitleOption,preloadPokedexOnePage} from '../tools/pokearena/torre2-title-pokedex-fast.mjs';

test('remove only CUSTOMIZE menu tile, keep settings and other buttons',()=>{
 const src='const MENUS={principal:[{id:"jugar",txt:"PLAY",menu:"jugar"},'+
  '{id:"personalizar",txt:"CUSTOMIZE",datos:{modo:"solo"},ico:"ajustes"},'+
  '{id:"ajustes",txt:"SETTINGS",menu:"ajustes"}],'+
  'ajustes:[{id:"som",txt:"SOUND"},{id:"back",txt:"BACK"}]};';
 const next=removeCustomizeTitleOption(src);
 assert.ok(!next.includes('txt:"CUSTOMIZE"'));
 for(const kept of ['txt:"PLAY"','txt:"SETTINGS"','txt:"SOUND"','txt:"BACK"'])
  assert.ok(next.includes(kept),kept);
 assert.ok(next.includes('},'+'{id:"ajustes"'));
 assert.equal(removeCustomizeTitleOption(next),next);
});
test('CUSTOMIZE removal handles first, last and only elements',()=>{
 const objects=[
  '[{id:"c",txt:"CUSTOMIZE"},{id:"p",txt:"PLAY"}]',
  '[{id:"p",txt:"PLAY"},{id:"c",txt:"CUSTOMIZE"}]',
  '[{id:"c",txt:"CUSTOMIZE"}]'
 ];
 const expected=['[{id:"p",txt:"PLAY"}]','[{id:"p",txt:"PLAY"}]','[]'];
 objects.forEach((src,i)=>assert.equal(removeCustomizeTitleOption(src),expected[i]));
 assert.throws(()=>removeCustomizeTitleOption('{id:"c",txt:"CUSTOMIZE"}'),/delimiter/);
});
test('Pokédex loads one 36-card page, not the entire roster at entry',()=>{
 const old='preload(){const m=this.registry.get("manifiesto");'+
  'this._torre2DexForms=soloFormas(m,new Set(ROSTER.map(p=>p.dex)));'+
  'cargarPMD(this,this._torre2DexForms,["Idle"]);}create(){'+
  'crearAnimsPMD(this,this._torre2DexForms,["Idle"]);';
 const chooser='const next=Math.floor(TORRE2_DEX_RANK[i]/36);if(next!==this.dexPage){';
 const pedestal='peana(et,celebrar){this.sprite?.destroy();const m=this.manifiesto[et.dex];';
 const out=preloadPokedexOnePage(old+chooser+pedestal);
 assert.ok(out.includes('TORRE2_DEX_ORDER.slice(start,start+36)'));
 assert.ok(!out.includes('new Set(ROSTER.map(p=>p.dex))'));
 assert.ok(out.includes('this.torre2DexLoadPage(next);'));
 assert.ok(out.includes('c.img.setTexture(key)'));
 assert.ok(out.includes('cargarPMD(this,forms,[])'), 'Pages load portraits first');
 assert.ok(out.includes('this.load.on("filecomplete",onFile)'), 'Each image fills as received');
 assert.ok(out.includes('this.load.once("complete",finish)'), 'Page load cleans event handler');
 assert.ok(out.includes('this.torre2DexEnsureIdle(et.dex)'), 'Selected PMD loads on demand');
 assert.ok(out.includes('this.textures.exists("pmd-"+et.dex+"-Idle")'), 'Never show a missing selected sprite');
 assert.ok(out.includes('this.__torre2DexPageRequests.delete(page)'), 'Allow retries after failed requests');
 assert.throws(()=>preloadPokedexOnePage('class Pokedex {}'),/upstream changed/);
});
