// Analog stick math kept independent of WebGL and DOM for regression tests.
// The distance between center and touch controls walk speed.
export function stickVector(clientX,clientY,rect,deadZone=.095){
 const cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
 const radius=Math.max(1,Math.min(rect.width,rect.height)*.32);
 const dx=(clientX-cx)/radius,dy=(clientY-cy)/radius;
 const distance=Math.hypot(dx,dy);
 const strength=Math.min(1,distance);
 if(strength<=deadZone)return {x:0,y:0,magnitude:0,offsetX:0,offsetY:0};
 // Smooth ramp from dead zone up to full speed.
 const speed=(strength-deadZone)/(1-deadZone);
 const x=dx/distance*speed,y=dy/distance*speed;
 return {x,y,magnitude:speed,
  offsetX:dx/distance*strength*radius,
  offsetY:dy/distance*strength*radius};
}
export function keyboardOrStick(keys,stick){
 const pressed=k=>keys.has(k);
 const x=Number(pressed('d')||pressed('arrowright'))-Number(pressed('a')||pressed('arrowleft'));
 const y=Number(pressed('s')||pressed('arrowdown'))-Number(pressed('w')||pressed('arrowup'));
 // A keyboard direction takes priority when active, otherwise use touch.
 return x||y?{x,y}:{x:stick.x,y:stick.y};
}
