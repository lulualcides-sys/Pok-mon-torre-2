import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(process.cwd(),'_site');
const port=Number(process.env.PORT)||3000;
const mime={
 '.html':'text/html; charset=utf-8',
 '.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8',
 '.json':'application/json; charset=utf-8',
 '.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg',
 '.svg':'image/svg+xml','.wasm':'application/wasm','.ogg':'audio/ogg',
 '.mp3':'audio/mpeg','.wav':'audio/wav','.ico':'image/x-icon',
 '.woff':'font/woff','.woff2':'font/woff2'
};
http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/health'){
   res.writeHead(200,{'Content-Type':'text/plain; charset=utf-8'});
   return res.end('preview-ok');
  }
  const pathname=decodeURIComponent(url.pathname);
  if(pathname.includes('\\')||pathname.includes('\0')){
   res.writeHead(400);return res.end('Bad request');
  }
  const rel=pathname.endsWith('/')?pathname+'index.html':pathname;
  const target=path.resolve(root,'.'+rel);
  if(!target.startsWith(root+path.sep)){
   res.writeHead(403);return res.end('Forbidden');
  }
  const info=await stat(target);
  if(!info.isFile())throw new Error('Not a file');
  const data=await readFile(target);
  res.writeHead(200,{
   'Content-Type':mime[path.extname(target)]||'application/octet-stream',
   'Cache-Control':path.extname(target)==='.html'?'no-cache, no-store, must-revalidate':'public, max-age=300',
   'X-Content-Type-Options':'nosniff',
   'X-Robots-Tag':'noindex, nofollow',
   'Content-Security-Policy':"frame-ancestors 'none'"
  });
  res.end(data);
 }catch{
  res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});
  res.end('Not found');
 }
}).listen(port,'0.0.0.0',()=>console.log('Pokemon Torre 2 homologation preview on port '+port));
