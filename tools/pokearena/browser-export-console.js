/* Pokémon Torre 2 — exportar o cliente Poké Arena 2D pelo Console do navegador.
 *
 * COMO USAR (PC, Chrome/Edge/Firefox):
 *  1. Abra https://www.pokearena2d.com/ e espere o jogo carregar.
 *  2. F12 → aba "Console". Se o Chrome pedir, digite:  allow pasting  e Enter.
 *  3. Cole TODO este arquivo e aperte Enter. Aguarde a mensagem "TORRE2: pronto".
 *  4. Serão baixados arquivos "torre2-export-<versão>-parte-N.json".
 *  5. Anexe TODOS a um release do repositório com tag  upstream-package-0780
 *     (GitHub → Releases → Draft a new release). O Torre 2 importa sozinho.
 *
 * O que faz: só leituras (GET) no próprio site, com a sua sessão normal de jogador,
 * seguindo os imports a partir de main.js; inclui index.html, version.json, os
 * módulos src-*, os JSON/imagens citados em "assets/..." e o manifesto de sprites.
 * Não envia nada para lugar nenhum, não lê cookies nem senhas, não altera o jogo.
 */
(async () => {
 const ORIGIN = location.origin;
 const MAX_PART = 45 * 1024 * 1024; // ~45 MB de base64 por arquivo baixado
 const log = (...a) => console.log('%cTORRE2', 'color:#fc0;font-weight:bold', ...a);
 if (!/pokearena2d\.com$/.test(location.hostname) && !window.TORRE2_EXPORT_TEST) { log('Abra o script em www.pokearena2d.com'); return; }
 const html = await (await fetch('/', {cache: 'no-store'})).text();
 const src = (html.match(/src=["'](src-[0-9a-f]{10})\/main\.js["']/) || [])[1];
 if (!src) { log('Não achei src-XXXX/main.js no index.html'); return; }
 const files = new Map(); // caminho -> Uint8Array
 const failures = [];
 const enc = new TextEncoder();
 files.set('index.html', enc.encode(html));
 const get = async rel => {
  const r = await fetch('/' + rel, {cache: 'no-store'});
  if (!r.ok) throw Error('HTTP ' + r.status);
  return new Uint8Array(await r.arrayBuffer());
 };
 const norm = p => { const out = []; for (const s of p.split('/')) { if (s === '..') out.pop(); else if (s && s !== '.') out.push(s); } return out.join('/'); };
 const dirOf = p => p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '';
 const SPEC = [/\bfrom\s*["'](\.{1,2}\/[^"'\n]+?\.js)["']/g, /\bimport\s*["'](\.{1,2}\/[^"'\n]+?\.js)["']/g, /\bimport\s*\(\s*["'](\.{1,2}\/[^"'\n]+?\.js)["']\s*\)/g];
 const TPL = /\bimport\s*\(\s*`(\.{1,2}\/[\w\-./]*)\$\{[^}]+\}(\.js)`\s*\)/g;
 const queue = ['main.js', 'config.js'], seen = new Set(queue), optional = new Set();
 const templates = [], words = new Set(), texts = {};
 let alpha = null;
 try { files.set('version.json', await get('version.json')); } catch (e) { failures.push('version.json :: ' + e.message); }
 while (queue.length) {
  const rel = queue.shift();
  let code;
  try { const b = await get(src + '/' + rel); files.set(src + '/' + rel, b); code = new TextDecoder().decode(b); texts[rel] = code; }
  catch (e) { if (!optional.has(rel)) failures.push(rel + ' :: ' + e.message); continue; }
  const d = dirOf(rel);
  for (const re of SPEC) for (const m of code.matchAll(re)) { const n = norm(d ? d + '/' + m[1] : m[1]); if (!seen.has(n)) { seen.add(n); queue.push(n); } }
  for (const m of code.matchAll(TPL)) templates.push({d, prefix: m[1], suffix: m[2]});
  for (const m of code.matchAll(/["']([a-z][a-z0-9_]{1,30})["']/g)) words.add(m[1]);
  for (const m of code.matchAll(/[{,]\s*([a-z][a-z0-9_]{1,30})\s*:/g)) words.add(m[1]);
  if (!queue.length && templates.length) for (const t of templates.splice(0)) for (const w of words) {
   const n = norm(t.d ? t.d + '/' + t.prefix + w + t.suffix : t.prefix + w + t.suffix);
   if (!seen.has(n)) { seen.add(n); optional.add(n); queue.push(n); }
  }
  if (seen.size % 20 === 0) log('módulos lidos:', Object.keys(texts).length);
 }
 alpha = ((texts['config.js'] || '').match(/\b(?:const|let)\s+VERSION\s*=\s*["'](0\.\d+(?:\.\d+)?)["']/) || [])[1] || null;
 log('Alpha', alpha, '·', src, '·', Object.keys(texts).length, 'módulos');
 // assets citados no código + manifesto PMD
 const EXT = /\.(png|webp|jpg|jpeg|gif|json|ogg|mp3|wav|bin|txt|ttf|woff2?)$/i;
 const wanted = new Set(['assets/pmd/manifest.json']);
 for (const code of Object.values(texts)) for (const m of code.matchAll(/["'`](?:\.{0,2}\/)*(assets\/[\w\-./]+)["'`]/g)) if (EXT.test(m[1])) wanted.add(norm(m[1]));
 const walk = (v, base, out) => { if (typeof v === 'string') { if (EXT.test(v) && !v.includes('..')) out.add(v.startsWith('assets/') ? v : norm(base + '/' + v)); } else if (Array.isArray(v)) v.forEach(x => walk(x, base, out)); else if (v && typeof v === 'object') Object.values(v).forEach(x => walk(x, base, out)); };
 const list = [...wanted];
 for (let i = 0; i < list.length; i++) {
  const p = list[i];
  try {
   const b = await get(p); files.set(p, b);
   if (p.endsWith('manifest.json')) { const more = new Set(); walk(JSON.parse(new TextDecoder().decode(b)), dirOf(p), more); log('manifesto de sprites:', more.size, 'arquivos'); for (const x of more) if (!wanted.has(x)) { wanted.add(x); list.push(x); } }
  } catch (e) { failures.push(p + ' :: ' + e.message); }
  if ((i + 1) % 50 === 0) log('assets:', i + 1, '/', list.length);
 }
 // empacota em partes JSON (base64) e baixa
 const b64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
 const parts = []; let cur = {}, size = 0;
 for (const [p, u8] of files) { const v = b64(u8); if (size + v.length > MAX_PART && size) { parts.push(cur); cur = {}; size = 0; } cur[p] = v; size += v.length; }
 parts.push(cur);
 const tag = (alpha || 'x').replace(/\./g, '');
 parts.forEach((filesPart, i) => {
  const body = JSON.stringify({format: 'torre2-browser-export-v1', origin: ORIGIN, src, alpha, exportedAt: new Date().toISOString(), part: i + 1, parts: parts.length, failures: i === 0 ? failures : [], files: filesPart});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([body], {type: 'application/json'}));
  a.download = `torre2-export-${tag}-parte-${i + 1}.json`;
  document.body.appendChild(a); a.click(); a.remove();
 });
 log('pronto:', files.size, 'arquivos em', parts.length, 'parte(s);', failures.length, 'falhas', failures.length ? failures.slice(0, 20) : '');
})();
