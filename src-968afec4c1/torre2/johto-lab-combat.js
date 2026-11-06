/* Johto battle training-only helpers: energy and retest buttons.
 * Standard Arena, VS, League, Training and Kanto remain unchanged.
 */
import {TORRE2_JOHTO_LAB_FORMS} from "./johto-lab-runtime.js";
export function installJohtoLabCombat(scene){
 if(!scene.datos?.johtoLab||scene.__johtoLabInstalled)return false;
 scene.__johtoLabInstalled=true;
 const fighter=scene.luchadores[0];
 const tick=()=>{
  if(!scene.scene.isActive())return;
  fighter.energia=100;fighter.ulti=100;fighter.calor=0;
  // Native cooldowns are never reset each step (previous infinite-cast bug).
 };
 const button=(x,label,run,color)=>{
  scene.add.rectangle(x,39,118,24,color,.94).setDepth(3800)
   .setStrokeStyle(1,0xd6e8ff).setInteractive({useHandCursor:true})
   .on("pointerdown",run);
  scene.add.text(x,39,label,{fontFamily:"Pixelify Sans,monospace",
   fontSize:"10px",color:"#fff2d5"}).setOrigin(.5).setDepth(3801);
 };
 // Native P2 does not dispatch ordinary attacks while a fighter is asleep.
 // The isolated Training shortcut explicitly casts Snore after applying Sleep;
 // regular Snore still refuses to cast when awake. This is NOT a campaign buff.
 button(130,"DORMIR + SNORE",()=>{
  const slot=["lmb","rmb","q","e"].find(key=>fighter.kit?.[key]?.id==="snore");
  if(!slot)return;
  fighter.ponerEstado("dormido",2.2,{cura:0});
  TORRE2_JOHTO_LAB_FORMS[fighter.kit[slot].forma]?.(fighter,fighter.kit[slot],{slot});
 },0x554a79);
 button(517,"TROCAR GOLPES",()=>scene.scene.start("johto-lab",{slots:scene.datos.johtoLab.slots}),0x206b66);
 scene.add.text(320,14,"MEWTWO LAB · LOTE 4 · 4 OFENSIVOS · CD 1s",{
  fontFamily:"Pixelify Sans,monospace",fontSize:"11px",color:"#ffe6ad"
 }).setOrigin(.5).setDepth(3801);
 tick();scene.game.events.on("step",tick);
 scene.events.once("shutdown",()=>{scene.game.events.off("step",tick);scene.__johtoLabInstalled=false;});
 return true;
}
