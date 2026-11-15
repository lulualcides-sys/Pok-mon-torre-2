/* Torre 2 performance diagnostics. Opt-in only (?torre2-perf=1).
 * Read-only: no Phaser scene, animation, move, combat or save mutation.
 * FPS is requestAnimationFrame cadence, NOT the Phaser internal FPS counter.
 */
(function(){
 'use strict';
 if(typeof window==='undefined'||!window.location||!window.performance)return;
 if(new URL(window.location.href).searchParams.get('torre2-perf')!=='1')return;
 const clock=window.performance, started=clock.now();
 let last=0, frames=0, seconds=0, fps=0, slow=0, longest=0, raf=0, stopped=false, total=0;
 const events=[],longTasks=[];
 const observer=typeof window.PerformanceObserver==='function'
  ?new window.PerformanceObserver(list=>{
    for(const item of list.getEntries())if(item.duration>=50){
      longTasks.push(Math.round(item.duration));
      if(longTasks.length>120)longTasks.shift();
    }
   }):null;
 try{observer?.observe({entryTypes:['longtask']})}catch{}
 const tick=t=>{
   if(stopped)return;
   if(last){
     const gap=Math.max(0,t-last);
     longest=Math.max(longest,gap);
     if(gap>33.4)slow++;
     frames++;total++;
   }
   last=t;
   if(t-started-seconds*1000>=1000){
     fps=frames*1000/Math.max(1,t-started-seconds*1000);
     frames=0;seconds=(t-started)/1000;
   }
   raf=window.requestAnimationFrame(tick);
 };
 raf=window.requestAnimationFrame(tick);
 const snapshot=()=>{
   const resource=clock.getEntriesByType('resource');
   const image=resource.filter(x=>/\.(png|webp|jpg|jpeg)(?:\?|$)/i.test(x.name||''));
   const nav=clock.getEntriesByType('navigation')[0];
   const heap=clock.memory?.usedJSHeapSize;
   return {uptimeMs:Math.round(clock.now()-started),fps:+fps.toFixed(1),
    slowFrames:slow,maxFrameGapMs:Math.round(longest),frames:total,
    resources:resource.length,imageRequests:image.length,
    transferBytes:resource.reduce((n,x)=>n+(x.transferSize||0),0),
    domContentLoadedMs:nav?.domContentLoadedEventEnd??null,
    usedJSHeapBytes:Number.isFinite(heap)?heap:null,
    longTaskCount:longTasks.length,longTaskMaxMs:longTasks.length?Math.max(...longTasks):0,
    marks:events.slice()};
 };
 window.__torre2Perf={
   snapshot,
   mark(name){if(typeof name==='string'&&name.length<60){
     events.push({name,atMs:Math.round(clock.now()-started)});
     if(events.length>50)events.shift();
   }},
   stop(){stopped=true;window.cancelAnimationFrame(raf);observer?.disconnect();
     if(poller)window.clearInterval(poller);panel?.remove();}
 };
 let panel=null,poller=0;
 if(window.document?.body){
   panel=window.document.createElement('pre');
   panel.id='torre2-perf-diagnostics';
   panel.style.cssText='position:fixed;z-index:999999;top:6px;right:6px;pointer-events:none;'+
    'max-width:260px;padding:7px;background:#081622e8;color:#e5f5ff;'+
    'font:11px/1.35 monospace;border:1px solid #59778e;white-space:pre-wrap';
   window.document.body.appendChild(panel);
   const paint=()=>{const a=snapshot();panel.textContent=
    'TORRE 2 PERF (diagnóstico)\nFPS rAF: '+a.fps+
    '\nQuadros >33ms: '+a.slowFrames+'\nMáx. quadro: '+a.maxFrameGapMs+'ms'+
    '\nRequisições: '+a.resources+' (imagens '+a.imageRequests+')'+
    '\nTransferido: '+Math.round(a.transferBytes/1024)+'KB'+
    '\nHeap JS: '+(a.usedJSHeapBytes===null?'indisponível':
     Math.round(a.usedJSHeapBytes/1048576)+'MB')+
    '\nTarefas longas: '+a.longTaskCount;};
   paint();
   poller=window.setInterval(paint,1000);
 }
})();
