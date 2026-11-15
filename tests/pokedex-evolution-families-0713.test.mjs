import test from 'node:test';
import assert from 'node:assert/strict';
import {buildFamilyDexRoster} from '../tools/pokearena/torre2-pokedex-family-cards.js';
import {buildPokedexFamilies} from '../tools/pokearena/torre2-pokedex-families.js';
import {restoreFamiliesAndMissingSprites0713} from '../tools/pokearena/torre2-pokedex-family-restore-0713.mjs';
const kit=n=>({lmb:{nombre:n,forma:'proyectil'},rmb:{nombre:'HAB2',forma:'golpe'},
 q:{nombre:'Dodge',forma:'dash'},e:{nombre:'ULT',forma:'rayo'}});
const species=(dex,nombre,evoluciones=[])=>({
 dex,nombre,id:nombre.toLowerCase(),kit:kit(nombre),evoluciones
});
const original=[
 species('0152','CHIKORITA',[{dex:'0153',nombre:'BAYLEEF'},{dex:'0154',nombre:'MEGANIUM'}]),
 species('0240','MAGBY'),species('0126','MAGMAR'),species('0467','MAGMORTAR'),
 species('0480','UXIE'),species('0481','MESPRIT'),species('0482','AZELF')
];
const all=[...original,species('0153','BAYLEEF'),species('0154','MEGANIUM')];
const johto=[[152,'chikorita',[],0,0,0,0,0,0,null],
 [153,'bayleef',[],0,0,0,0,0,0,152],
 [154,'meganium',[],0,0,0,0,0,0,153],
 [240,'magby',[],0,0,0,0,0,0,null]];
const stages=p=>[{etiqueta:p.nombre,nombre:p.nombre,dex:p.dex,
 kit:kit(p.nombre),hp:120,vel:100,atk:1,def:1,tipos:['GRASS']}];
test('evolution family tabs keep individual moves and all members',()=>{
 const f=buildFamilyDexRoster(all,original,johto,stages,buildPokedexFamilies);
 const ch=f.find(x=>x.torre2DexFamilyMembers.includes('0152'));
 assert.deepEqual(ch.torre2DexFamilyMembers,['0152','0153','0154']);
 assert.deepEqual(ch.torre2DexStages.map(x=>x.kit.lmb.nombre),
  ['CHIKORITA','BAYLEEF','MEGANIUM']);
 const mag=f.find(x=>x.torre2DexFamilyMembers.includes('0467'));
 assert.deepEqual(mag.torre2DexFamilyMembers,['0240','0126','0467']);
 assert.equal(mag.torre2DexStages[2].kit.lmb.nombre,'MAGMORTAR');
 assert.equal(f.filter(x=>['0480','0481','0482'].includes(x.dex)).length,3);
 assert.ok(f.length<all.length);
 assert.equal(original[0].evoluciones.length,2);
});
test('source adapter restores family card and routes page sprites to local PNGs',()=>{
 const tick=String.fromCharCode(96),dollar=String.fromCharCode(36);
 const pre='import{buildIndividualDexRoster}from"../torre2/pokedex-individual-roster.js";'+
 'const ROSTER=buildIndividualDexRoster(BATTLE_ROSTER,etapasDe,REGLAS.vidaGlobal);'+
 'class Pokedex extends Phaser.Scene{'+
 'preload(){cargarPMD(this,this._torre2FirstForms,["Idle"]);this._torre2JohtoForms=soloFormas(m,new Set(ROSTER.filter(p=>{const n=Number(p.dex);return n>=152&&n<=251}).map(p=>p.dex)));'+
 'for(const[dex,form]of Object.entries(this._torre2JohtoForms)){const idle=form.anims?.Idle;this.load.spritesheet(dex,idle.file,{frameWidth:idle.fw,frameHeight:idle.fh});}'+
 '}create(){cabecera(this,"POKÉDEX",'+tick+dollar+'{ROSTER.length} POKÉMON'+tick+')}'+
 'refrescar(){this.etapas=etapasDe(p);const et=this.vista=conForma(p,this.etapas[this.etapa];'+
 'const info=p.torre2DexNext?"EVOLVES INTO "+p.torre2DexNext+" WHEN EXP IS FULL":et.mega?foo:bar;}'+
 'torre2CargarPagina(page){const count=cargarPMD(this,forms,["Idle"]);}'+
 'torre2EnsureIdle(dex){const count=cargarPMD(this,forms,["Idle"]);}}';
 const result=restoreFamiliesAndMissingSprites0713(pre,'0.71.3');
 assert.match(result,/const FULL_ROSTER=buildIndividualDexRoster/);
 assert.match(result,/buildFamilyDexRoster/);
 assert.match(result,/this.etapas=p.torre2DexStages/);
 assert.match(result,/FULL_ROSTER.filter/);
 assert.match(result,/torre2DirectLocal/);
 assert.match(result,/this.load.spritesheet/);
 assert.match(result,/assets\/pmd\//);
 assert.equal(restoreFamiliesAndMissingSprites0713(pre,'0.70.0'),pre);
});
