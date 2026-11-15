import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const code=fs.readFileSync(new URL('../tools/pokearena/torre2-performance-monitor.js',import.meta.url),'utf8');
const environment=enabled=>{
 let frames=[],updates=[],cancelled=[],stoppedTimers=[];
 const panel={style:{},textContent:'',remove(){this.removed=true}};
 const window={
  location:{href:'https://local.invalid/arena2d/?torre2-perf='+(enabled?'1':'0')},
  performance:{now:()=>2000,getEntriesByType:type=>
   type==='resource'?[{name:'https://x.test/p.png',transferSize:1500}]:
   type==='navigation'?[{domContentLoadedEventEnd:850}]:[],
   memory:{usedJSHeapSize:10485760}},
  requestAnimationFrame(fn){frames.push(fn);return frames.length},
  cancelAnimationFrame(id){cancelled.push(id)},
  setInterval(fn){updates.push(fn);return updates.length},
  clearInterval(id){stoppedTimers.push(id)},
  document:{body:{appendChild(x){this.child=x}},createElement(){return panel}}
 };
 vm.runInNewContext(code,{window,URL});
 return {window,frames,updates,cancelled,stoppedTimers,panel};
};
test('normal players incur no diagnostics loop or overlay',()=>{
 const x=environment(false);
 assert.equal(x.window.__torre2Perf,undefined);
 assert.equal(x.frames.length,0);
 assert.equal(x.window.document.body.child,undefined);
});
test('opt-in metrics remain read-only and expose bounded FPS/network snapshot',()=>{
 const x=environment(true);
 assert.ok(x.window.__torre2Perf);
 assert.equal(x.window.document.body.child,x.panel);
 let next=x.frames.shift();
 for(let i=0;i<70;i++){
  next(2000+i*16.67);
  next=x.frames.shift();
 }
 const sample=x.window.__torre2Perf.snapshot();
 assert.ok(sample.frames>=68);
 assert.ok(sample.fps>=50&&sample.fps<=65,JSON.stringify(sample));
 assert.equal(sample.imageRequests,1);
 assert.equal(sample.transferBytes,1500);
 assert.equal(sample.usedJSHeapBytes,10485760);
 x.window.__torre2Perf.mark('pokedex');
 assert.equal(x.window.__torre2Perf.snapshot().marks[0].name,'pokedex');
 x.window.__torre2Perf.stop();
 assert.ok(x.cancelled.length>0);
 assert.equal(x.panel.removed,true);
});
