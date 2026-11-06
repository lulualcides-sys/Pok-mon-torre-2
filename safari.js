/* Navegador dentro de una app en iPhone (Instagram, TikTok...): no gira a horizontal y el aviso de girar tapaba el
   juego. Ahí se pide abrirlo en Safari. Va en su archivo (no en línea en index.html): la CSP de la web no lo deja. */
(() => {
  const ua = navigator.userAgent;
  if (!/iPhone|iPod/.test(ua) || !/Instagram|FBAN|FBAV|FB_IAB|TikTok|musical_ly|Bytedance|Snapchat|Twitter|LinkedInApp/i.test(ua)) return;
  const g = document.getElementById('girar');
  g.innerHTML = 'Open in Safari to play<br><small>Tap <b>···</b> at the top, then <b>Open in external browser</b></small>'
    + '<a class="boton" href="x-safari-' + location.href + '">OPEN IN SAFARI</a>'
    + '<button class="boton" type="button">COPY LINK</button>';
  const copiar = g.querySelector('button');
  copiar.onclick = async () => {
    const url = location.origin + '/';
    try { await navigator.clipboard.writeText(url); }
    catch {
      const t = document.createElement('textarea'); t.value = url; document.body.appendChild(t);
      t.select(); document.execCommand('copy'); t.remove();
    }
    copiar.textContent = 'COPIED! PASTE IT IN SAFARI';
  };
})();
