// Run an existing browser regression against the local review mirror.
// Only its HTTP transport is replaced; assertions and game code stay intact.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const file=process.argv[2];
if(!/^tests\/[\w-]+\.cjs$/.test(file||''))throw Error('Expected tests/name.cjs');
let src=fs.readFileSync(file,'utf8');
const start=src.indexOf('const server=http.createServer('),end=src.indexOf('\n});',start)+4;
if(start<0||end<start)throw Error('Unsupported HTTP harness; no modification performed');
src=src.slice(0,start)+`const server=http.createServer(async(req,res)=>{try{const r=await fetch('http://127.0.0.1:4174'+req.url);res.writeHead(r.status,{'content-type':r.headers.get('content-type')||'application/octet-stream'});res.end(Buffer.from(await r.arrayBuffer()))}catch(e){res.writeHead(502);res.end(String(e))}});`+src.slice(end);
if(file==='tests/t25-mobile-pc-transfer-browser.cjs')src=src.replace('?original=1', '?original=1&qa-legacy-map=1');
const tmp=path.resolve('tests/.premium-'+path.basename(file));
fs.writeFileSync(tmp,src);
try{const r=spawnSync(process.execPath,[tmp],{stdio:'inherit',env:{...process.env,CHROME_BIN:'/home/agent/.cache/ms-playwright/chromium-1194/chrome-linux/chrome'},timeout:300000});process.exitCode=r.status??1}finally{fs.unlinkSync(tmp)}
