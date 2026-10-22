/* Wild capture HUD — actual Pokémon Torre 2 Phaser combat scene, not an image.
 * Pixel-art ball throw, red recall beam, fall, 3 visible shake slots, break-out.
 * The enemy's genuine battle HP decides the catch odds.
 */
import {captureChance} from './capture-mechanics.js';
import {readCampaign,attemptCapture} from './campaign-core.js';
const FONT='Pixelify Sans, monospace';
const LABEL={pokeball:'POKÉ BALL',greatball:'GREAT BALL',ultraball:'ULTRA BALL'};
function message(scene,x,y,s,size=11,color='#f0f7ff'){
 return scene.add.text(x,y,s,{fontFamily:FONT,fontSize:size+'px',
  color,fontStyle:'bold',stroke:'#081b35',strokeThickness:3}).setDepth(1201);
}
function block(g,x,y,w,h,c){g.fillStyle(c,1);g.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))}
function ballSprite(g,x,y,kind='pokeball',scale=2,tilt=0){
 const rim=kind==='ultraball'?0xe4ca56:kind==='greatball'?0x2e99e0:0xf04d52;
 const dark=0x10243e,shift=Math.round(Math.sin(tilt)*2);
 const sprite=[
  '....KKKK....','..KKWWWWKK..','.KWWWWWWWWK.','KWWWWWWWWWWK',
  'KCCCCCCCCCCK','KCCCCCCCCCCK','KKKKKWWKKKKK','KWWWWKKWWWWK',
  'KWWWWWWWWWWK','.KWWWWWWWWK.','..KKWWWWKK..','....KKKK....'];
 for(let row=0;row<12;row++)for(let col=0;col<12;col++){
  const cc=sprite[row][col];if(cc==='.'){continue}
  let fill=cc==='K'?dark:cc==='C'?rim:0xf3f5fa;
  if(row<3&&cc==='W')fill=0xffffff;
  block(g,x+(col-6)*scale+shift,y+(row-6)*scale,scale,scale,fill);
 }
 block(g,x-scale,y-scale,scale*2,scale*2,0x192c45);
 block(g,x,y,scale,scale,0xffffff);
 if(kind==='ultraball'){
  block(g,x-scale*3,y-scale*4,scale*2,scale,0x101c2e);
  block(g,x+scale*2,y-scale*4,scale*2,scale,0x101c2e);
 }else if(kind==='greatball'){
  block(g,x-scale*4,y-scale*4,scale,scale,0xd6464e);
  block(g,x+scale*3,y-scale*4,scale,scale,0xd6464e);
 }
}
function panel(scene,x,y,w,h){
 const g=scene.add.graphics().setDepth(1198);
 block(g,x+2,y+3,w,h,0x031020);block(g,x,y,w,h,0x08223c);
 block(g,x+1,y+1,w-2,h-2,0x4895b6);
 block(g,x+3,y+3,w-6,h-6,0x0c2b44);
 block(g,x+4,y+4,w-8,2,0x8de4e4);
 return g;
}
function click(scene,x,y,w,h,fn){
 return scene.add.zone(x,y,w,h).setDepth(1250).setInteractive({useHandCursor:true}).on('pointerdown',fn);
}
function battleStatus(enemy){
 const v=enemy?.status?.nombre||enemy?.estado?.nombre||enemy?.estado||
  enemy?.est?.estado||enemy?.statuses?.map(x=>x?.name||x?.tipo).join(' ')||'';
 return typeof v==='string'?v:'';
}
export function installWildCapture(scene){
 if(scene.__torre2WildCapture||scene.datos?.torre2?.kind!=='wild')return;
 scene.__torre2WildCapture=true;
 const enemy=scene.luchadores?.[1];if(!enemy)return;
 const ui=panel(scene,455,41,169,39);
 const title=message(scene,466,45,'◉ CAPTURAR',13,'#ffe2a0');
 const status=message(scene,466,64,'HP do alvo: 100%',9,'#aff2cf');
 const launch=click(scene,539,61,171,41,showChoices);
 const cleanup=()=>{scene.events.off('update',refresh);scene.__torre2WildCapture=false;};
 scene.events.once('shutdown',cleanup);
 function refresh(){
  if(!scene.scene.isActive()||!enemy?.hpMax)return;
  const hp=Math.max(0,Math.ceil((enemy.hp/enemy.hpMax)*100));
  status.setText('HP '+hp+'% · '+(hp<=25?'ótima chance':hp<=50?'chance maior':'enfraqueça'));
 }
 scene.events.on('update',refresh);
 refresh();
 let menu=[],busy=false;
 const close=()=>{
  for(const item of menu)item.destroy?.();menu=[];
 };
 function add(item){menu.push(item);return item}
 function showChoices(){
  if(busy||enemy.hp<=0)return;
  close();
  const state=readCampaign();if(!state?.pendingWild)return;
  const choice=add(panel(scene,175,115,292,153));
  const top=add(message(scene,188,125,'LANÇAR POKÉBOLA',16,'#ffdf8a'));
  const hp=Math.max(1,Math.ceil(enemy.hp/enemy.hpMax*100));
  add(message(scene,190,150,enemy.def?.id?.toUpperCase()+' · HP '+hp+'%',11));
  const keys=['pokeball','greatball','ultraball'];
  keys.forEach((key,i)=>{
   const yy=179+i*24;
   const gr=add(scene.add.graphics().setDepth(1202));
   ballSprite(gr,201,yy+7,key,1);
   const probability=captureChance({...state.pendingWild,hpPercent:hp,
    status:battleStatus(enemy)},key);
   add(message(scene,217,yy,LABEL[key]+' x'+(state.inventory[key]||0)+
    '  '+Math.round(probability*100)+'%',10));
   add(click(scene,316,yy+8,275,22,()=>throwBall(key)));
  });
  add(message(scene,192,251,'Toque na arena para cancelar',9,'#b5d2e2'));
  add(click(scene,325,279,250,21,close));
 }
 function throwBall(kind){
  if(busy)return;
  const state=readCampaign();if(!state?.pendingWild||!(state.inventory?.[kind]>0))return;
  if(!enemy.hpMax||enemy.hp<=0)return;
  busy=true;close();
  const hpPercent=Math.max(1,Math.ceil(enemy.hp/enemy.hpMax*100));
  const oldPhase=scene.fase;scene.fase='capturando';
  const result=attemptCapture(state,Math.random,kind,
   {duringBattle:true,hpPercent,status:battleStatus(enemy)});
  const gfx=scene.add.graphics().setDepth(1205);
  const caption=message(scene,320,112,'',14,'#ffebac').setOrigin(.5);
  const fighter=scene.luchadores?.[1];
  const start={x:110,y:284},end={x:Math.max(200,Math.min(520,fighter?.x??444)),
   y:Math.max(145,Math.min(294,fighter?.y??220))};
  const point={t:0,shake:0};
  const draw=(phase)=>{
   gfx.clear();
   if(phase==='beam'){
    for(let k=0;k<9;k++){
     const sx=end.x-38+k*10,ey=end.y-5+Math.sin(k*.9)*8;
     gfx.lineStyle(k%2?2:3,k%3?0xff6d75:0xeb324c,k%3?.8:1);
     gfx.lineBetween(sx,ey,end.x,end.y+4);
     block(gfx,end.x-14+k*3,end.y-14+Math.sin(k)*9,2,2,0xff8899);
    }
   }
   const y=phase==='throw'?start.y+(end.y-start.y)*point.t-
    95*Math.sin(Math.PI*point.t):end.y+16;
   const x=phase==='throw'?start.x+(end.x-start.x)*point.t:
    end.x+Math.sin(point.shake)*5;
   block(gfx,x-14,y+10,28,3,0x122d33);
   ballSprite(gfx,x,y,kind,2,phase==='throw'?point.t*5:point.shake);
  };
  caption.setText('POKÉBOLA, VAI!');
  scene.tweens.add({targets:point,t:1,duration:600,ease:'Sine.easeOut',
   onUpdate:()=>draw('throw'),onComplete:()=>{
    draw('beam');caption.setText('RAIO DE CAPTURA!');
    const targetSprite=fighter?.sprite;
    if(targetSprite?.setAlpha)targetSprite.setAlpha(.18);
    scene.time.delayedCall(440,()=>{
     if(!scene.scene.isActive())return;
     if(targetSprite?.setAlpha)targetSprite.setAlpha(1);
     point.shake=0;draw('land');caption.setText('A POKÉBOLA CAIU...');
     let step=0;const shakes=result.ok?3:result.shakes;
     const animateShake=()=>{
      if(!scene.scene.isActive())return;
      if(step>=shakes){
       scene.time.delayedCall(260,()=>{
        if(!scene.scene.isActive())return;
        if(result.ok){
         gfx.clear();ballSprite(gfx,end.x,end.y+16,kind,2);
         for(let k=0;k<8;k++){
          const a=k*Math.PI/4;
          block(gfx,end.x+Math.cos(a)*27,end.y+16+Math.sin(a)*27,3,3,0xffed6b);
         }
         caption.setText('CAPTURADO!');caption.setColor('#8cffb8');
         scene.time.delayedCall(700,()=>scene.scene.start('campanha'));
        }else{
         caption.setText('ESCAPOU! TENTE NOVAMENTE');
         gfx.clear();scene.fase=oldPhase;
         scene.time.delayedCall(650,()=>{caption.destroy();gfx.destroy();busy=false;refresh()});
        }
       });
       return;
      }
      step++;
      scene.tweens.add({targets:point,shake:Math.PI*2,duration:410,
       onUpdate:()=>draw('land'),onComplete:()=>{
        point.shake=0;caption.setText('BALANÇO '+step+' / 3');
        scene.time.delayedCall(170,animateShake);
       }});
     };
     animateShake();
    });
   }});
 }
}
