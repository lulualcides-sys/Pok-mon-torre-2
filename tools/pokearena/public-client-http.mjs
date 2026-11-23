// Ordinary public GET used consistently by source probes and capture.
// No custom User-Agent, cookies, proxy, stealth or retry after HTTP 403/404.
//
// Autorização da captura (Torre 2): se o segredo TORRE2_CAPTURE_TOKEN existir no
// ambiente, cada GET ao site envia o cabeçalho X-Torre2-Capture com esse valor.
// O token é emitido/combinado pelos donos do Poké Arena 2D e só tem efeito se
// ELES criarem a regra correspondente no Cloudflare (docs/CLOUDFLARE-CAPTURA-TORRE2.md).
// Não é falsificação: é uma credencial declarada e configurada pelo dono do site.
// O valor nunca é registrado em logs nem em mensagens de erro, e nunca é enviado
// para outra origem (redirecionamentos são seguidos manualmente, só na mesma origem).
export const ORIGIN='https://www.pokearena2d.com';
export const CAPTURE_HEADER='X-Torre2-Capture';
const RETRY_STATUS=new Set([429,500,502,503,504,520,521,522,523,524]);
const defaultSleep=ms=>new Promise(r=>setTimeout(r,ms));

/** Cabeçalho de autorização a partir do segredo; undefined quando ausente. */
export function captureAuthHeaders(env=process.env){
  const raw=env?.TORRE2_CAPTURE_TOKEN;
  if(raw==null||raw==='')return undefined;
  const token=String(raw).trim();
  // valor de cabeçalho HTTP seguro: ASCII visível, sem espaços, 16..512 chars
  if(!/^[\x21-\x7e]{16,512}$/.test(token))
    throw Error('TORRE2_CAPTURE_TOKEN inválido (use 16-512 caracteres ASCII visíveis, sem espaços)');
  return {[CAPTURE_HEADER]:token};
}

/** Diagnóstico sem segredo: status, Ray ID, servidor e se a autorização foi enviada. */
export function blockDiagnostic(response,authSent){
  const h=response?.headers;
  const get=k=>(h&&typeof h.get==='function'?h.get(k):null)||'-';
  return `HTTP ${response.status} (cf-ray=${get('cf-ray')}, server=${get('server')}, `+
    `cf-mitigated=${get('cf-mitigated')}, auth-header=${authSent?'sent':'absent'})`;
}

export async function getPublicClientResource(url, maxBytes=10*1024*1024, fetcher=fetch,
  {env=process.env,attempts=3,sleep=defaultSleep}={}) {
  if(new URL(url).origin!==ORIGIN)throw Error('Off-origin source request');
  const headers=captureAuthHeaders(env);
  let lastError;
  for(let attempt=1;attempt<=attempts;attempt++){
    try {
      return await getOnce(url,maxBytes,fetcher,headers);
    } catch(e) {
      lastError=e;
      const status=Number(/HTTP (\d{3})/.exec(e.message)?.[1]||0);
      // 403/404 e erros de validação são definitivos: nunca repetir nem contornar.
      const retryable=e.retryable===true||RETRY_STATUS.has(status);
      if(!retryable||attempt===attempts)throw e;
      await sleep(1000*3**(attempt-1));
    }
  }
  throw lastError;
}

async function getOnce(url,maxBytes,fetcher,headers){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),18000);
  try {
    let current=url,response;
    for(let hop=0;;hop++){
      const options={signal:controller.signal,redirect:headers?'manual':'follow',credentials:'omit'};
      if(headers)options.headers=headers;
      try{response=await fetcher(current,options);}
      catch(e){const err=Error('Network error: '+(e?.name||'Error'));err.retryable=true;throw err;}
      if(!headers||response.status<300||response.status>=400)break;
      const location=response.headers?.get?.('location');
      const next=location?new URL(location,current):null;
      if(!next||next.origin!==ORIGIN)throw Error('Off-origin redirect');
      if(hop>=3)throw Error('Too many redirects');
      current=next.toString();
    }
    const actual=new URL(response.url||current);
    if(actual.origin!==ORIGIN)throw Error('Off-origin redirect');
    if(!response.ok)throw Error(blockDiagnostic(response,!!headers));
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
