'use strict';
/**
 * Independent, read-only coverage probe for assets LAZILY loaded by the
 * publicly available Poké Arena 2D UI. Only browser network responses from
 * normal user interactions are saved. No direct asset GET, proxy, replay,
 * stealth, intercepted response, authentication or 403 workaround.
 *
 * These are quarantine artifacts, NEVER a publishable native client.
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const ORIGIN = 'https://www.pokearena2d.com';
const MAX_FILE_BYTES = 12 * 1024 * 1024;
const MAX_TOTAL_BYTES = 180 * 1024 * 1024;
const hash = data => crypto.createHash('sha256').update(data).digest('hex');

function safeAssetPath(value) {
  let url;
  try { url = new URL(value); } catch { return null; }
  if (url.origin !== ORIGIN || url.search || url.hash) return null;
  let rel;
  try { rel = decodeURIComponent(url.pathname).replace(/^\/+/, ''); }
  catch { return null; }
  if (rel.length > 240 || rel.includes('\\') || rel.split('/').includes('..')) return null;
  if (/^assets\/p\/[a-f0-9]{20}\.bin$/.test(rel)) return rel;
  if (/^assets\/pmd\/[0-9]{4}(?:-[a-z0-9]+)*\/(?:portrait\.png|[A-Za-z0-9_-]+-Anim\.png)$/.test(rel)) return rel;
  return null;
}
function readNativeIndex(html) {
  const script = html.match(/<script[^>]*\bid=["']paq["'][^>]*>([\s\S]*?)<\/script>/);
  if (!script) throw Error('Official publicly served pack index #paq is missing');
  const value = JSON.parse(script[1]);
  if (!/^[a-f0-9]{20}$/.test(value.comun || '')) throw Error('Invalid common pack hash');
  if (!value.formas || typeof value.formas !== 'object' || Array.isArray(value.formas))
    throw Error('Missing native forms in official pack index');
  for (const [dex, pack] of Object.entries(value.formas)) {
    if (!/^[0-9]{4}(?:-[a-z0-9]+)*$/.test(dex) || !/^[a-f0-9]{20}$/.test(pack))
      throw Error('Unsafe native form or pack identifier');
  }
  return value;
}
function officialSourceDir(html) {
  const found = html.match(/src=["'](src-[a-f0-9]{10})\/main\.js["']/);
  if (!found) throw Error('Official source fingerprint not present in index.html');
  return found[1];
}
function packCoverage(index, observed) {
  const present = new Set(observed.filter(p => /^assets\/p\/[a-f0-9]{20}\.bin$/.test(p)));
  const forms = Object.entries(index.formas);
  const missing = forms.filter(([,pack]) => !present.has('assets/p/' + pack + '.bin'))
    .map(([dex,pack]) => ({dex,pack}));
  return {
    declaredForms: forms.length,
    observedNativePacks: present.size,
    coveredFormsByObservedPack: forms.length - missing.length,
    missingFromTHISBrowserProbe: missing,
    commonObserved: present.has('assets/p/' + index.comun + '.bin'),
    note: 'This is browser-observed coverage only; verified old assets and loose PNGs are not counted. Missing here does not prove they do not exist on the server.'
  };
}
function isValidObservedBytes(rel, data) {
  if (!Buffer.isBuffer(data) || data.length < 64 || data.length > MAX_FILE_BYTES) return false;
  if (rel.endsWith('.png'))
    return data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  return rel.endsWith('.bin');
}
async function clickCanvas(page, x, y) {
  const point = await page.evaluate(coords => {
    const canvas = document.querySelector('#juego canvas');
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {x: rect.left + rect.width*coords.x/640,
      y: rect.top + rect.height*coords.y/360};
  }, {x,y});
  if (!point) throw Error('Public game canvas missing');
  await page.mouse.click(point.x,point.y);
}
async function walkMenus(page, report) {
  // Strictly physical clicks/keyboard, no direct Phaser.scene.start(),
  // JS injection, app state changes, online/ranked interaction or private APIs.
  await page.waitForFunction(() => window.__pt2Game?.scene?.isActive('titulo'),
    null, {timeout: 30000});
  report.navigation.push('title');
  // 0.65.1 reference menu: POKÉDEX is the second item; fail closed if changed.
  await clickCanvas(page,320,162);
  await page.waitForFunction(() => window.__pt2Game?.scene?.isActive('pokedex'),
    null, {timeout: 13000});
  report.navigation.push('pokedex-public');
  for (let i=0;i<40;i++) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(120);
  }
  report.navigation.push('pokedex-40-keypresses');
  await page.waitForTimeout(1500);
}
async function probe(outDir, browserFactory) {
  const output = path.resolve(outDir);
  const filesDir = path.join(output,'observed');
  const report = {
    origin: ORIGIN, at: new Date().toISOString(),
    method: 'ordinary-public-Chromium-UI-response-only',
    noBypass: true, noDeploy: true, version: null, src: null,
    navigation: [], observed: [], denied: [], errors: [], coverage: null
  };
  await fs.mkdir(filesDir,{recursive:true});
  let browser, page, bytes=0;
  const pending = new Set(), seen = new Set();
  let publicConfig = null;
  try {
    browser = await browserFactory();
    page = await browser.newPage({viewport:{width:1280,height:720}});
    page.on('response', resp => {
      // config.js must come from this very public navigation, not a guessed Alpha.
      const configMatch = new URL(resp.url()).pathname.match(/^\/(src-[a-f0-9]{10})\/config\.js$/);
      if (configMatch && resp.status() === 200) {
        const work = resp.text().then(body => {
          const alpha=body.match(/\b(?:const|let)\s+VERSION\s*=\s*["'](0\.\d+(?:\.\d+)?)["']/)?.[1];
          if (alpha) publicConfig={src:configMatch[1],alpha};
        }).catch(e=>report.errors.push({stage:'public-config',reason:String(e.message)}));
        pending.add(work);
        work.finally(()=>pending.delete(work));
      }
      const asset = safeAssetPath(resp.url());
      if (!asset) return;
      if (resp.status() !== 200) {
        report.denied.push({asset,status:resp.status()});
        return;
      }
      const work = (async () => {
        try {
          if (seen.has(asset)) return;
          const body = await resp.body();
          if (!isValidObservedBytes(asset,body)) {
            report.errors.push({asset,reason:'invalid image, pack or size'});
            return;
          }
          if (bytes + body.length > MAX_TOTAL_BYTES)
            throw Error('Strict total capture size limit');
          const full = path.resolve(filesDir,asset);
          if (!full.startsWith(filesDir + path.sep)) throw Error('Unsafe output path');
          await fs.mkdir(path.dirname(full),{recursive:true});
          await fs.writeFile(full,body);
          seen.add(asset);
          bytes += body.length;
          report.observed.push({asset,bytes:body.length,sha256:hash(body),
            provenance:'HTTP 200 emitted by public browser while using UI'});
        } catch (error) {
          report.errors.push({asset,reason:String(error.message).slice(0,180)});
        }
      })();
      pending.add(work);
      work.finally(() => pending.delete(work));
    });
    const navigation = await page.goto(ORIGIN+'/',{
      waitUntil:'domcontentloaded',timeout:45000
    });
    if (!navigation || navigation.status() !== 200)
      throw Error('Official public homepage unavailable: HTTP '+navigation?.status());
    const html=await navigation.text();
    const index=readNativeIndex(html);
    report.src=officialSourceDir(html);
    // A VERSION parsed from index is NOT official Alpha. The caller must
    // cross-check config.js from the exact same observed source before upgrade.
    await walkMenus(page,report).catch(e =>
      report.errors.push({stage:'public-menu-navigation',reason:String(e.message).slice(0,160)}));
    await Promise.allSettled([...pending]);
    if (publicConfig?.src === report.src) report.version=publicConfig.alpha;
    report.coverage=packCoverage(index,report.observed.map(item=>item.asset));
    report.totalBytes=bytes;
    report.status = report.denied.length || report.errors.length
      ? 'BLOCKED_OR_INCOMPLETE' : 'PUBLIC_UI_OBSERVED';
    return report;
  } finally {
    await Promise.allSettled([...pending]);
    await browser?.close().catch(()=>{});
    await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
  }
}
module.exports={safeAssetPath,readNativeIndex,officialSourceDir,packCoverage,
  isValidObservedBytes,probe};
if (require.main === module) {
  const {chromium}=require('playwright-core');
  const out=process.argv[2]||'site-capture/rea-lazy-pack-probe';
  probe(out,()=>chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
    headless:true,args:['--no-sandbox','--disable-dev-shm-usage']}))
    .then(result=>{
      console.log('REA_LAZY_PACK_COVERAGE',JSON.stringify({
        src:result.src,alpha:result.version,observed:result.observed.length,
        coverage:result.coverage?.coveredFormsByObservedPack,
        declared:result.coverage?.declaredForms,
        denied:result.denied.length,errors:result.errors.length,
        status:result.status
      }));
      if (!result.version || result.status!=='PUBLIC_UI_OBSERVED' ||
          !result.coverage?.commonObserved || result.coverage.missingFromTHISBrowserProbe.length)
        process.exitCode=2;
    }).catch(e=>{console.error('PUBLIC_LAZY_CAPTURE_UNAVAILABLE',String(e));process.exitCode=1});
}
