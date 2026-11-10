// Ordinary public GET used consistently by source probes and capture.
// No custom User-Agent, cookies, credentials, proxy, stealth or retry after HTTP 403.
export async function getPublicClientResource(url, maxBytes=10*1024*1024, fetcher=fetch) {
  const origin='https://www.pokearena2d.com';
  if(new URL(url).origin!==origin)throw Error('Off-origin source request');
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),18000);
  try {
    const response=await fetcher(url,{signal:controller.signal,redirect:'follow',credentials:'omit'});
    const actual=new URL(response.url||url);
    if(actual.origin!==origin)throw Error('Off-origin redirect');
    if(!response.ok)throw Error('HTTP '+response.status);
    const advertised=Number(response.headers.get('content-length')||0);
    if(!Number.isFinite(advertised)||advertised<0||advertised>maxBytes)
      throw Error('File too large or invalid Content-Length: '+advertised);
    const data=Buffer.from(await response.arrayBuffer());
    if(data.length>maxBytes)throw Error('File exceeds cap');
    const contentType=response.headers.get('content-type')||'';
    if(contentType.includes('text/html')&&!actual.pathname.endsWith('/')&&!actual.pathname.endsWith('.html'))
      throw Error('HTML fallback instead of requested file');
    return {data,contentType,url:actual.toString()};
  } finally {clearTimeout(timeout);}
}
