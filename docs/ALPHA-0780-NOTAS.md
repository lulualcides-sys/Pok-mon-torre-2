# Poké Arena 2D v0.78.0 "Clans and Garchomp" — o que se sabe antes da captura

**Estado:** versão **observada**, mas **não capturada**.
- **Fonte:** print da tela *Updates* do site, enviado pelo dono do Torre 2 em 23/11/2026.
- **Não verificado:** o `VERSION` do `config.js` não foi lido, os arquivos não foram obtidos e nada foi portado. O site responde 403 a servidores na nuvem (ver `docs/CLOUDFLARE-CAPTURA-TORRE2.md`).

## Notas oficiais (transcritas do print)

> v0.78.0 — 23 nov 2026 — **Clans and Garchomp**
> Garchomp joins the roster, clans arrive and the ARCEUS challenge is rebuilt.
> - New line: Gible, Gabite and Garchomp! Earn it in the LEAGUE at MT. MOON.
> - CLANS in ONLINE (clan names are permanent, so choose well) and CHANGE NAME for your username in SETTINGS.
> - ARCEUS rebuilt, FISHING reworked on a new island and a new GAUNTLET every day.
> - Play offline against the CPU or GET THE APP on your phone. Muk reworked, Porygon rebalanced and plenty of fixes.

## Impacto previsto no Torre 2

Previsão a conferir com o `compare-upstream-captures.mjs` quando os arquivos chegarem. A base de comparação é o `datos.js` da 0.77.3.

| Item da 0.78 | Situação hoje no Torre 2 | Consequência na porta |
| --- | --- | --- |
| **Gible → Gabite → Garchomp** (Dex 443–445) | Não existe no Torre 2 nem na 0.77.3 | Espécie nativa nova. Fora do Dex 1–251, então **não conflita** com as espécies Kanto/Johto do Torre 2. O kit vem do original, sem alteração. |
| **Muk refeito** | Grimer/Muk já são nativos desde a 0.77.3 | O kit nativo novo substitui o anterior, pela regra de 06/11. Sem aprovação extra. |
| **Porygon rebalanceado** | Porygon → Porygon2 → Porygon-Z já são nativos (Dex 137/233/474) | Idem: vale o nativo novo. |
| **Arceus (desafio) refeito** | Arceus nativo (Dex 493); desafio em `jefes/` | Conferir as adaptações do Torre 2 ligadas aos desafios. |
| **Clãs e troca de nome (ONLINE)** | O Torre 2 usa multiplayer próprio por código (P2P) | Os clãs dependem do servidor do site. **Decisão do dono:** ocultar no Torre 2 ou manter só a interface. |
| **Pesca numa ilha nova, Gauntlet diário** | Modos novos | Testar no Chromium; não mexer na campanha do Torre 2. |
| **"GET THE APP"** | O Torre 2 tem PWA própria (#684) | Provavelmente o app do site é uma PWA servida pelo mesmo domínio: a 0.77.3 já tinha `manifest.webmanifest`. Isso é inferência, não verificado. Não achei app em loja. Na porta, o botão deve apontar para a PWA do Torre 2 ou ser removido, como foi feito com News/MENSAGENS. |

## Fontes possíveis dos arquivos (situação em 23/11/2026)

- **Site:** 403 no Cloudflare para nuvem, inclusive para Chromium/REA no GitHub Actions.
- **Loja de apps:** nenhuma listagem encontrada. Um app PWA usa o mesmo domínio, então não é fonte independente.
- **Caminhos prontos (PR #694):**
  - pacote entregue pelos donos, em release com tag `upstream-package-0780`;
  - ou regra no Cloudflare com token `TORRE2_CAPTURE_TOKEN`.

## Pokédex oficial da 0.78 — linha Gible (transcrita dos prints do dono, 23/11/2026)

Referência para **validar** a porta quando os arquivos chegarem. **Não** é um kit implementado: a mecânica, a hitbox, os VFX e as animações só existem no código original.

- Pokédex com **51 Pokémon**.
- Papel: **Physical**. A frase do card é "Dance, dig, quake".
- Gible e Gabite evoluem quando a EXP enche. Garchomp é a forma final.

| | Gible #0443 | Gabite #0444 | Garchomp #0445 |
| --- | --- | --- | --- |
| HP / SPD | 119 / 136 | 144 / 142 | 169 / 148 |
| ATK / DEF | 0.98 / 0.94 | 1.10 / 1.00 | 1.22 / 1.06 |
| Basic — Dragon Claw | 4.8 DMG, combo ×3 | 5.4 DMG, combo ×3 | 5.6 DMG, combo ×4 |
| Skill — Earthquake (30 energia, CD 7 s) | 11 DMG, Slow | 12 DMG, Slow | 13 DMG, Stun + Slow |
| Dash — Dig (CD 8 s) | 4 DMG | 5 DMG | 6 DMG |
| Q — Dragon Dance (20 energia, CD 2.5 s) | acumula | acumula | acumula |
| ULT — Outrage | 8 DMG | 9 DMG | 11 DMG |

**Textos dos golpes:**
- **Dragon Claw:** golpes rápidos que cortam projéteis inimigos.
- **Earthquake:** onda ao redor que causa lentidão.
- **Dig:** segurar para ficar sob a terra, intocável e mais rápido; soltar para sair com um tremor.
- **Dragon Dance:** cada uso acumula ataques básicos mais rápidos, mais dano e velocidade; no máximo, sem calor.
- **Outrage:** fúria, mais forte e rápido por um tempo; depois o usuário fica confuso.

**Biblioteca executável da 0.77.3:**
- Dragon Claw, Earthquake, Dig e Dragon Dance existem, mas em kits de outros Pokémon e possivelmente com outra mecânica.
- **Outrage não existe** (0 ocorrências).
