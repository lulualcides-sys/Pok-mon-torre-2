/* Pokémon Torre 2 — animated FireRed-style single-ball capture.
 * One ball = one throw, one red recall beam and up to three shakes.
 * Four internal RNG checks determine the outcome, never four attempts.
 * Separate from approved Arena 2D Pokémon sprites and move effects.
 */
import {captureChance} from './capture-mechanics.js';
import {readCampaign,attemptCapture} from './campaign-core.js';
const FONT='Pixelify Sans,monospace';
const COLORS={
 pokeball:{top:0xe44746,shine:0xff9b76,bottom:0xfff8df},
 greatball:{top:0x277ec4,shine:0xa2e7ff,bottom:0xfcf6df},
 ultraball:{top:0x262a3b,shine:0xf4d871,bottom:0xfff9e8}
};
// Authentic two-tone, horizontally split Pokéball in authored pixel cells.
// Red top, white bottom, thick charcoal separator, center white latch.
const BALL=[
 '......OOOO......','....OOXXXXOO....','...OXXXXXXXXO...',
 '..OXXXXXXXXXXO..','.OXXXXXXXXXXXXO.','.OXXXXXXXXXXXXO.',
 'OXXXXXXXXXXXXXXO','OOOOOOWWWOOOOOOO','OWWWWWOOOWWWWWWO',
 'OOWWWWWOOWWWWWOO','.OWWWWWWWWWWWWO.','..OWWWWWWWWWWWO..',
 '...OWWWWWWWWWO...','....OOWWWWWOO....','......OOOO......'];
function px(g,x,y,w,h,c,a=1){g.fillStyle(c,a);g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function ball(g,cx,cy,kind,scale=2,rotation=0){
 const c=COLORS[kind]||COLORS.pokeball;
 const shift=Math.round(Math.sin(rotation)*1.7*scale);
 const x=Math.round(cx-8*scale+shift),y=Math.round(cy-7*scale);
 for(let row=0;row<BALL.length;row++)for(let col=0;col<16;col++){
  const v=BALL[row][col];if(v==='.')continue;
  const base=v==='O'?0x151d32:v==='W'?c.bottom:c.top;
  px(g,x+col*scale,y+row*scale,scale,scale,base);
 }
 px(g,cx-2*scale+shift,cy-1*scale,4*scale,3*scale,0x141d2c);
 px(g,cx-scale+shift,cy,2*scale,2*scale,0xfffcdd);
 px(g,cx-scale+shift,cy,scale,scale,0xffffff);
 px(g,cx-4*scale+shift,cy-4*scale,3*scale,scale,c.shine);
 if(kind==='ultraball'){
  px(g,cx-5*scale+shift,cy-4*scale,2*scale,3*scale,0xe8c75f);
  px(g,cx+3*scale+shift,cy-4*scale,2*scale,3*scale,0xe8c75f);
 }else if(kind==='greatball'){
  px(g,cx-5*scale+shift,cy-3*scale,2*scale,2*scale,0xdb4f56);
  px(g,cx+3*scale+shift,cy-3*scale,2*scale,2*scale,0xdb4f56);
 }
}
function txt(scene,x,y,value,size=11,color='#f5f4e5'){
 return scene.add.text(x,y,value,{fontFamily:FONT,fontSize:size+'px',
  fontStyle:'bold',color,stroke:'#0a233b',strokeThickness:3}).setDepth(1206);
}
function frame(scene,x,y,w,h){
 const g=scene.add.graphics().setDepth(1203);
 px(g,x+2,y+3,w,h,0x061120);
 px(g,x,y,w,h,0x091b2c);px(g,x+1,y+1,w-2,h-2,0xf0d07d);
 px(g,x+3,y+3,w-6,h-6,0x113952);px(g,x+5,y+4,w-10,2,0x67b8a2);
 return g;
}
function hit(scene,x,y,w,h,onClick){
 return scene.add.zone(x,y,w,h).setDepth(1215).setInteractive({useHandCursor:true})
 .on('pointerdown',onClick);
}
function statusName(enemy){
 const raw=enemy?.status?.nombre??enemy?.estado?.nombre??enemy?.estado??
  enemy?.est?.estado??enemy?.statuses?.map(x=>x?.name||x?.tipo).join(' ')??'';
 return typeof raw==='string'?raw:'';
}
function enemyPortrait(enemy){
 const s=enemy?.sprite;
 if(s?.setAlpha&&s?.setScale)return s;
 return null;
}
function artBeam(g,ballX,ballY,enemyX,enemyY,t){
 // Narrow red cone from the opened ball TO the enemy; growing brighter
 // and contracting as the Pokémon is recalled.
 const spread=18*(1-t*.8),a=1-t*.65;
 g.fillStyle(0xf33152,.24*a);
 g.fillTriangle(ballX,ballY,enemyX-spread,enemyY-spread,enemyX+spread,enemyY+spread);
 g.lineStyle(5,0xff5267,.38*a);g.lineBetween(ballX,ballY,enemyX,enemyY);
 g.lineStyle(2,0xffb0aa,.92*a);g.lineBetween(ballX,ballY,enemyX,enemyY);
 for(let i=0;i<10;i++){
  const f=(i*.19+t*.41)%1.0,jitter=Math.sin(i*6.3+t*11)*spread*.6;
  const x=ballX+(enemyX-ballX)*f,y=ballY+(enemyY-ballY)*f+jitter;
  px(g,x,y,i%3===0?4:2,2,i%3?0xff6b76:0xffe4b7,Math.max(.15,a));
 }
}
export function installWildCapture(scene){
 if(scene.__torre2WildCapture||scene.datos?.torre2?.kind!=='wild')return;
 const enemy=scene.luchadores?.[1];
 if(!enemy?.hpMax)return;
 scene.__torre2WildCapture=true;
 const hud=frame(scene,458,41,169,42);
 txt(scene,467,47,'BOLSA  /  POKÉBOLA',11,'#fff0b9');
 const hpLine=txt(scene,469,65,'HP 100% · ENFRAQUEÇA',10,'#a9ead3');
 hit(scene,539,61,171,42,showChoices);
 let menu=[],busy=false,activeVisuals=[];
 const cleanup=()=>{
  scene.events.off('update',refresh);
  scene.__torre2WildCapture=false;
  for(const item of activeVisuals)item.destroy?.();
  activeVisuals=[];
 };
 scene.events.once('shutdown',cleanup);
 function refresh(){
  if(!scene.scene.isActive()||!enemy.hpMax)return;
  const percent=Math.max(0,Math.ceil(100*enemy.hp/enemy.hpMax));
  hpLine.setText('HP '+percent+'% · '+(percent<=25?'BOA CHANCE':
   percent<=50?'ENFRAQUECIDO':'ENFRAQUEÇA'));
 }
 scene.events.on('update',refresh);refresh();
 function add(item){menu.push(item);return item}
 function close(){for(const item of menu)item.destroy?.();menu=[]}
 function showChoices(){
  if(busy||enemy.hp<=0)return;
  close();
  const state=readCampaign();if(!state?.pendingWild)return;
  add(frame(scene,173,109,299,169));
  add(txt(scene,188,119,'ESCOLHA UMA POKÉBOLA',15,'#ffe5a4'));
  const hp=Math.max(1,Math.ceil(enemy.hp/enemy.hpMax*100));
  add(txt(scene,187,142,state.pendingWild.id.toUpperCase()+
   ' · HP '+hp+'%',11,'#d2f5e5'));
  const labels={pokeball:'POKÉ BALL',greatball:'GREAT BALL',ultraball:'ULTRA BALL'};
  for(const [i,kind]of ['pokeball','greatball','ultraball'].entries()){
   const y=178+i*27,owned=state.inventory[kind]||0;
   const draw=add(scene.add.graphics().setDepth(1208));
   ball(draw,200,y+4,kind,1);
   const chance=captureChance({...state.pendingWild,hpPercent:hp,
    status:statusName(enemy)},kind);
   add(txt(scene,220,y-5,labels[kind]+'  x'+owned+
    '  '+Math.round(chance*100)+'%',10,owned?'#f9f6e9':'#a88c9b'));
   if(owned)add(hit(scene,316,y+8,275,25,()=>throwBall(kind)));
  }
  add(txt(scene,225,265,'TOQUE NA MARGEM PARA VOLTAR',8,'#9bd9dc'));
  add(hit(scene,324,290,250,17,close));
 }
 function throwBall(kind){
  if(busy||enemy.hp<=0||!enemy.hpMax)return;
  const save=readCampaign();if(!save?.pendingWild||(save.inventory?.[kind]??0)<1)return;
  busy=true;close();
  const hp=Math.max(1,Math.ceil(enemy.hp/enemy.hpMax*100));
  // Exactly one inventory decrement, one capture roll and one projectile.
  const oldPhase=scene.fase;scene.fase='capturando';
  const result=attemptCapture(save,Math.random,kind,
   {duringBattle:true,hpPercent:hp,status:statusName(enemy)});
  const gfx=scene.add.graphics().setDepth(1208);
  const caption=txt(scene,320,100,'POKÉBOLA, VAI!',13,'#ffe5aa').setOrigin(.5);
  activeVisuals.push(gfx,caption);
  const obj=enemyPortrait(enemy);
  const before=obj?{x:obj.x,y:obj.y,sx:obj.scaleX,sy:obj.scaleY,
   alpha:obj.alpha,visible:obj.visible}:null;
  const enemyX=Math.max(165,Math.min(555,Number(enemy.x)||444)),
   enemyY=Math.max(130,Math.min(291,Number(enemy.y)||221));
  const shot={x:116,y:281},end={x:enemyX-18,y:enemyY-23};
  const ballPos={t:0,angle:0},shake={phase:0};
  const drawBall=(x,y,angle=0)=>{
   gfx.clear();
   px(gfx,x-15,y+22,31,3,0x061e27,.65);
   ball(gfx,x,y,kind,2,angle);
  };
  const restore=()=>{
   if(obj&&obj.active!==false){
    obj.setAlpha(before.alpha);
    obj.setScale(before.sx,before.sy);
    obj.setPosition(before.x,before.y);
    obj.setVisible(before.visible);
   }
  };
  scene.tweens.add({targets:ballPos,t:1,duration:650,ease:'Sine.easeInOut',
   onUpdate:()=>{
    const t=ballPos.t;
    drawBall(shot.x+(end.x-shot.x)*t,
     shot.y+(end.y-shot.y)*t-83*Math.sin(Math.PI*t),t*7);
   },onComplete:()=>{
    caption.setText('O RAIO VERMELHO ENVOLVEU O POKÉMON!');
    const beam={t:0},focus={x:enemyX,y:enemyY};
    if(obj){
     scene.tweens.add({targets:obj,x:end.x,y:end.y,
      scaleX:Math.max(.03,before.sx*.05),scaleY:Math.max(.03,before.sy*.05),
      alpha:.12,duration:370,ease:'Cubic.easeIn'});
    }
    scene.tweens.add({targets:beam,t:1,duration:400,
     onUpdate:()=>{
      gfx.clear();artBeam(gfx,end.x,end.y,focus.x,focus.y,beam.t);
      ball(gfx,end.x,end.y,kind,2);
     },onComplete:()=>{
      if(obj)obj.setAlpha(0);
      caption.setText('A POKÉBOLA CAIU...');
      const floorY=Math.min(315,enemyY+37),drop={t:0};
      scene.tweens.add({targets:drop,t:1,duration:350,ease:'Bounce.easeOut',
       onUpdate:()=>drawBall(end.x,end.y+(floorY-end.y)*drop.t),
       onComplete:()=>{
        let completed=0;
        const wobble=()=>{
         if(!scene.scene.isActive())return;
         // FRLG: 0, 1, 2 or 3 wobble(s) before opening; success
         // always shows all three. There is no 'second round'.
         const limit=result.ok?3:result.shakes;
         if(completed>=limit){
          scene.time.delayedCall(250,()=>{
           if(!scene.scene.isActive())return;
           gfx.clear();
           if(result.ok){
            ball(gfx,end.x,floorY,kind,2);
            for(let i=0;i<10;i++){
             const angle=i*Math.PI/5;
             px(gfx,end.x+Math.cos(angle)*26,floorY+Math.sin(angle)*25,
              3,3,i%2?0xfff2b8:0xffd04d);
            }
            caption.setText('CAPTURADO!').setColor('#a4ffc1');
            scene.time.delayedCall(800,()=>scene.scene.start('campanha'));
           }else{
            caption.setText('O POKÉMON ESCAPOU!').setColor('#ffdeae');
            gfx.fillStyle(0xfff8e1,.8);gfx.fillCircle(end.x,floorY,10);
            restore();scene.fase=oldPhase;
            scene.time.delayedCall(850,()=>{
             if(scene.scene.isActive()){
              gfx.destroy();caption.destroy();busy=false;refresh();
             }
            });
           }
          });
          return;
         }
         completed++;
         const wob={t:0};
         scene.tweens.add({targets:wob,t:1,duration:430,
          onUpdate:()=>drawBall(end.x+Math.sin(wob.t*Math.PI*2)*6,
           floorY+Math.sin(wob.t*Math.PI)*2,wob.t*Math.PI*2),
          onComplete:()=>{
           caption.setText('BALANÇO '+completed+' / 3');
           scene.time.delayedCall(130,wobble);
          }});
        };
        wobble();
       }});
     }});
   }});
 }
}
