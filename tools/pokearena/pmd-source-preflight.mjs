/**
 * Read-only availability check for a CRITICAL original-game asset.
 * No mirrors, proxy fallback or HTTP 403 workarounds. Only the owner-issued
 * X-Torre2-Capture header (secret TORRE2_CAPTURE_TOKEN) is sent when present.
 * "blocked" never means that the game or the new upstream build passed QA.
 */
import {captureAuthHeaders} from './public-client-http.mjs';
export const PUBLIC_PMD_MANIFEST='https://www.pokearena2d.com/assets/pmd/manifest.json';

export async function publicPmdPreflight(fetcher=fetch){
 try{
  const auth=captureAuthHeaders();
  const options={signal:AbortSignal.timeout(12000)};
  if(auth){options.headers=auth;options.redirect='error';}
  const response=await fetcher(PUBLIC_PMD_MANIFEST,options);
  if(!response?.ok)
   return {ok:false,reason:'pmd-http-'+String(response?.status??'unknown'),
    httpStatus:response?.status??null,
    cfRay:response?.headers?.get?.('cf-ray')??null,authHeader:auth?'sent':'absent'};
  const manifest=await response.json();
  const entries=manifest&&typeof manifest==='object'&&!Array.isArray(manifest)
    ?Object.entries(manifest):[];
  const animated=entries.filter(([,value])=>typeof value?.anims?.Idle?.file==='string'&&
    value.anims.Idle.file.endsWith('.png')).length;
  if(entries.length<100||animated<50)
   return {ok:false,reason:'pmd-incomplete',entries:entries.length,animated};
  return {ok:true,reason:'critical-pmd-publicly-readable',
   entries:entries.length,animated};
 }catch(error){
  return {ok:false,reason:'pmd-unavailable',error:String(error?.message||error).slice(0,200)};
 }
}

export function requireCriticalPmd(decision,preflight){
 if(!decision?.capture)return decision;
 if(preflight?.ok===true)return decision;
 return {capture:false,attention:true,blocked:true,
  reason:'critical-native-pmd-unavailable'};
}
