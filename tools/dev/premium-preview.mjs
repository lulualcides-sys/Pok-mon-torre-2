// Local review only: read-only mirror of the published game, with explicit visual overrides.
// Never deploy this proxy. Saves stay on localhost; upstream receives GETs only.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const origin='https://lulualcides-sys.github.io/Pok-mon-torre-2';
const cache=path.resolve('/workspace/pt2-public-cache');
const overrides={'premium-art.js':'torre2-premium-art.js','trainer-cards.js':'torre2-trainer-cards.js','city-scenery.js':'torre2-city-scenery.js','campanha.js':'torre2-campaign-scene.js'};
const mime={'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.ogg':'audio/ogg','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{
 try{
  const u=new URL(req.url,'http://localhost');
  if(req.method!=='GET'){res.writeHead(405);return res.end()}
  const name=u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname;
  const file=path.resolve(cache,'.'+name);
  if(!file.startsWith(cache+'/')){res.writeHead(403);return res.end()}
  let data;
  if(name.startsWith('/homolog/')||name.startsWith('/tools/pokearena/')){const local=path.resolve('.'+name);if(!local.startsWith(process.cwd()+'/'))throw Error('Invalid path');data=await fs.readFile(local);res.writeHead(200,{'content-type':mime[path.extname(name)]||'text/html'});return res.end(data)}
  const visual=name.includes('/torre2/')&&overrides[path.basename(name)];
  if(process.env.PREMIUM==='1'&&visual)data=await fs.readFile('tools/pokearena/'+visual);
  else{
   try{data=await fs.readFile(file)}catch{
    const r=await fetch(origin+name,{signal:AbortSignal.timeout(60000)});
    if(!r.ok){res.writeHead(r.status);return res.end('Upstream '+r.status)}
    data=Buffer.from(await r.arrayBuffer());await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,data);
   }
  }
  res.writeHead(200,{'content-type':mime[path.extname(name)]||'application/octet-stream','cache-control':'no-store'});res.end(data);
 }catch(e){res.writeHead(502);res.end(String(e.message))}
}).listen(Number(process.env.PORT||4173),'0.0.0.0',()=>console.log('Local review on '+(process.env.PORT||4173)+', visual overrides: '+(process.env.PREMIUM==='1')));
