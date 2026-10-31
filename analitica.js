// Arranque de la analítica (Cocolytics, nuestra copia de Plausible: el mismo fragmento, en archivo propio porque la CSP
// no deja scripts en línea). Lo cargan index.html (lo añade tools/juego.mjs) y privacy.html, antes del script, que se
// sirve desde nuestro dominio (/m/s, functions/m/s.js) y manda los eventos a /m/e (functions/m/e.js): desde otro
// dominio lo bloquean Brave y los bloqueadores de anuncios.
window.plausible = window.plausible || function () { (plausible.q = plausible.q || []).push(arguments); };
plausible.init = plausible.init || function (i) { plausible.o = i || {}; };
plausible.init({ endpoint: '/m/e' });
