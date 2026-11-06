// Arranque de la analítica (Cocolytics, nuestra copia de Plausible: el mismo fragmento, en archivo propio porque la CSP
// no deja scripts en línea). Lo cargan index.html (lo añade tools/juego.mjs) y privacy.html, antes del script. Script y
// eventos van por red.pokearena2d.com (Caddy los pasa a Cocolytics): mismo sitio, así no los cortan Brave ni los
// bloqueadores. Hasta el 03/11/2026 iban por funciones de Pages (/m/s y /m/e) y pasaban del tope gratis de 100.000 al día.
window.plausible = window.plausible || function () { (plausible.q = plausible.q || []).push(arguments); };
plausible.init = plausible.init || function (i) { plausible.o = i || {}; };
plausible.init({ endpoint: 'https://red.pokearena2d.com/m/e' });
