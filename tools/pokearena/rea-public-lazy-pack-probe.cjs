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
async function walkMenus(page, report, output) {
  // Strictly physical clicks/keyboard, no direct Phaser.scene.start(),
  // JS injection, app state changes, online/ranked interaction or private APIs.
  await page.waitForFunction(() => document.querySelector('#juego canvas'),
    null, {timeout: 45000});
  // The official 0.69.2 client does not expose Torre 2's __pt2Game global.
  // Let its normal initial loading finish; never force Phaser scenes via JS.
  await page.waitForTimeout(7000);
  report.navigation.push('public-canvas-after-load');
  report.gameAtTitle = await page.evaluate(() => ({
    hasGameGlobal: !!window.__pt2Game,
    activeScenes: window.__pt2Game?.scene?.getScenes(true)?.map(x=>x.scene.key) || [],
    canvasSize: (()=>{const x=document.querySelector('#juego canvas');return [x.width,x.height]})()
  }));
  await page.screenshot({path:path.join(output,'public-title.png')});
  // Alpha 0.69.2 public screenshot: Play, Customize, Pokedex in that order.
  // Click the REAL Pokédex button at native 640x360 coordinate (320,200).
  // Do not guess navigation success; check the active scene below.
  await clickCanvas(page,320,200);
  await page.waitForTimeout(2800);
  report.gameAfterClick=await page.evaluate(() => ({
    activeScenes: window.__pt2Game?.scene?.getScenes(true)?.map(x=>x.scene.key) || []
  }));
  await page.screenshot({path:path.join(output,'public-after-pokedex-click.png')});
  if (report.gameAtTitle.hasGameGlobal &&
      !report.gameAfterClick.activeScenes.includes('pokedex')) {
    report.errors.push({stage:'pokedex-navigation',reason:'Pokedex scene did not become active'});
    return;
  }
  report.navigation.push(report.gameAfterClick.activeScenes.includes('pokedex')
    ? 'pokedex-public-confirmed' : 'pokedex-physical-click-unverified');
  // The Pokédex only fetched the common portrait pack in the first probe;
  // do a short representative navigation, then visit the local VS CPU picker.
  for (let i=0;i<6;i++) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);
  }
  report.navigation.push('pokedex-six-keypresses');
  await page.screenshot({path:path.join(output,'public-pokedex-after-navigation.png')});
  // Real public UI controls, not scene.start() or direct asset requests.
  await clickCanvas(page,35,15); // Pokédex's top-left Menu button.
  await page.waitForTimeout(1200);
  await page.screenshot({path:path.join(output,'public-after-menu-return.png')});
  await clickCanvas(page,320,148); // Main title Play.
  await page.waitForTimeout(1000);
  await page.screenshot({path:path.join(output,'public-play-menu.png')});
  // Confirmed in the current public 0.69.2 screenshot:
  // Play submenu: League y150, Online y178, Local y205, Arena y232.
  // NEVER touch Online: it opens account creation and cannot yield solo assets.
  await clickCanvas(page,320,205);
  await page.waitForTimeout(1600);
  await page.screenshot({path:path.join(output,'public-local-menu.png')});
  report.navigation.push('local-menu-physical-click');
  // Public screenshot confirms first three starter cards are unlocked.
  // Pick Charmander as CPU opponent, without unlocking restricted forms.
  await clickCanvas(page,61,60);
  await page.waitForTimeout(550);
  await page.screenshot({path:path.join(output,'public-local-cpu-opponent.png')});
  // Click the visible "Fight!" local VS CPU button, not online/ranked.
  await clickCanvas(page,565,306);
  await page.waitForTimeout(6500);
  await page.screenshot({path:path.join(output,'public-local-battle.png')});
  report.navigation.push('local-vs-cpu-battle-attempted');
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
    page.on('pageerror', e => report.errors.push({stage:'public-page-javascript',reason:String(e.message).slice(0,180)}));
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
    await walkMenus(page,report,output).catch(e =>
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
    headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
      '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']}))
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
