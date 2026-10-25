/* Isolated battle fixtures. No storage reads, writes, inventory or rewards. */
import {KANTO_151_IDS} from './all-kanto-species.js';
import {createPartyMatch} from './party-battle.js';
import {resolveLoadout} from './move-pool.js';
import {WEATHER_NAMES,setWeather} from './weather.js';
export {KANTO_151_IDS};
export function prepareLaboratoryMatch(options={}){
 const pick=id=>KANTO_151_IDS.includes(id)?id:'mewtwo';
 const level=Math.max(1,Math.min(100,Math.floor(Number(options.level)||50)));
 const member=(id,uid)=>({id,uid,hp:100,progression:{species:id,level},status:null});
 const state={stage:0,trainer:0,active:0,team:[member(pick(options.player),'lab-player'),member('mewtwo','lab-backup')]};
 const party=createPartyMatch(state,{id:pick(options.enemy||'onix'),level,leader:false},true);
 party.foes.push({id:'onix',hp:100,level,loadout:resolveLoadout(member('onix','lab-enemy-backup'))});
 party.trainerItems={potion:2,fullrestore:1};
 return {p1:party.friend[0].id,p2:party.foes[0].id,modo:'cpu',nivel:'facil',arena:'crater',mandos:['kbm','cpu'],
  torre2:{stage:0,trainer:0,kind:'laboratory',training:true,laboratory:true,playerLevel:level,enemyLevel:level,hardCap:100,party,weather:options.weather||'none'},
  torre2Loadout:party.friend[0].loadout,torre2OpponentLoadout:party.foes[0].loadout};
}
export function installLaboratoryControls(scene){
 if(!scene.datos?.torre2?.laboratory||scene.__torre2LabInstalled)return;
 scene.__torre2LabInstalled=true;
 const statuses=['none','veneno','toxic','quemado','dormido','paralizado','congelado','confuso'];
 const weather=Object.keys(WEATHER_NAMES);let wi=weather.indexOf(scene.datos.torre2.weather),si=[0,0];
 const objects=[];
 const button=(x,w,caption,run)=>{
  const bg=scene.add.rectangle(x,77,w,20,0x10283c,.95).setStrokeStyle(1,0x7298af).setScrollFactor(0).setDepth(2800).setInteractive({useHandCursor:true});
  const label=scene.add.text(x,77,caption,{fontFamily:'Pixelify Sans,monospace',fontSize:'8px',color:'#f0e5c8'}).setOrigin(.5).setScrollFactor(0).setDepth(2801);
  bg.on('pointerdown',()=>{if(scene.fase==='lucha'&&!scene.__torre2Changing)run(label)});objects.push(bg,label);
 };
 button(170,74,'CLIMA',()=>{wi=(wi+1)%weather.length;setWeather(scene.__torre2Weather,weather[wi]);});
 for(let side=0;side<2;side++)button(252+side*84,80,'STATUS '+(side?'CPU':'P1'),label=>{
  const a=scene.luchadores[side];si[side]=(si[side]+1)%statuses.length;a.est={};
  if(si[side])a.ponerEstado(statuses[si[side]],20,{});
  label.setText((side?'CPU ':'P1 ')+statuses[si[side]]);
 });
 button(420,74,'CURAR',()=>scene.luchadores.forEach(a=>{if(!a.ko){a.hp=a.hpMax;a.est={};}}));
 button(502,74,'SAIR LAB',()=>scene.scene.start('campanha'));
 scene.events.once('shutdown',()=>{objects.forEach(o=>o.destroy());scene.__torre2LabInstalled=false;});
}
