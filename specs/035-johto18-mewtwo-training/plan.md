# Plano de integração
- Fonte de verdade: dados nativos já preservados em `torre2/signature-fx.js`, `escenas/combate.js`, `luchador.js`, `torre2/move-pool.js`.
- Adição isolada: `torre2-johto-lab-catalog.js`, `torre2-johto-lab-runtime.js`, `torre2-johto-lab-scene.js`, `torre2-johto-lab-combat.js`.
- Build `build-preview.mjs` injeta módulo/screen somente no cliente Phaser offline; não altera o código fonte do Poké Arena ou a campanha.
- Reuso efetivo T2/P2: pipeline `Phaser.Graphics` + `vfx.rafaga`, padrão original de ação `l.animar`/`l.accion` e `r.recibir` com contato; demais fontes Zarza e Emerald requerem ficha individual/licença antes de classificação como golpe aprovado.
- Não mesclar sem CI/Chromium, inspeção de hitbox, status e comportamento; manter PR DRAFT e sem deploy público até aprovação.
