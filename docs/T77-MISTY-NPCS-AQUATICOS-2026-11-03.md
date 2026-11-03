# T77 — Misty: NPCs aquáticos originais FRLG + auditoria temática

**Escopo**: homologação `test/homologacao-kanto-20261103`. Não tocar nos 60 WebPs originais aprovados, saves, batalhas, moves, líder, ace ou probabilidades. Não atualizar `main`/Pages sem autorização final expressa.

## Fonte e diferença intencional do FireRed
O FireRed/LeafGreen original usa Swimmer Luis e Picnicker Diana no ginásio de Cerulean, conforme scripts de `pret/pokefirered/data/maps/CeruleanCity_Gym/scripts.inc`. O nosso projeto já possui **quatro subchefes** (índices [11,12,13,14], aprovados anteriormente) e o usuário pediu **nenhum Campista/Picnicker no ginásio de água**. Portanto, a disposição de quatro NPCs é uma adaptação visual temática do FireRed, **não** reprodução exata da quantidade/classe original de adversários.

## Assets originais obtidos
Sprites de overworld do decomp `pret/pokefirered/graphics/object_events/pics/people/`, instalados pelo build do cliente Phaser (sem buscar na hora de jogar). Exigência de download e validação PNG para:
- `swimmer_m_land.png` — Nadador (plataforma superior esquerda)
- `swimmer_f_land.png` — Nadadora (superior direita)
- `tuber_m_land.png` — Banhista (inferior esquerda)
- `tuber_f.png` — Banhista (inferior direita)

São quatro sheets **distintos, coerentes com água e em pose de terra firme**. Nada de personagens nadando em plataformas secas. A instalação falha caso algum asset obrigatório falte; nunca produzir Youngster substituto na cena.

## Integração
- `FIRST_APPROVED_GYM_LAYOUTS['gym-misty']` troca só `kind`, conservando quatro posições, índices e interações. Sprite da Misty e Starmie original PMD Idle permanecem como aprovados na T76.
- `torre2-frlg-npc.js`: aliases estritos, sem fallback Youngster para o ginásio, preservando rotina legada para outras áreas ainda não auditadas.
- `Campanha.preload()` instala os quatro sprites no stage 1 **e** stage 2 (revisitar Cerulean após insígnia). Somente esses assets adicionais, para conter o uso de memória no Android.

## Plano auditável para TODOS os NPCs
`auditApprovedGymNpcThemes()` registra os 5 layouts existentes. **Apenas Misty recebe status validado nesta T77**. Brock continua em revisão; Erika e Koga têm classes questionáveis e são reportadas explicitamente como pendentes; Surge contém NPCs já **pintados** no WebP original, que não pode ser alterado sem nova aprovação. Os demais NPCs desenhados diretamente nas 60 ilustrações exigem auditoria de cada mapa antes de uma alteração. Não fingir que todas as áreas estão prontas.

## Portões de QA
- Node `tests/t76-misty-native-sprites.test.mjs` e `tests/t77-aquatic-npc-policy.test.mjs`: quatro classes aquáticas distintas, índices originais, asset de origem requerido, proibição de fallback, PMD do Starmie, backlog dos demais ginásios.
- Chromium desktop/mobile `tests/approved-map-real-browser.cjs`: verifica texturas exatas dos quatro NPCs e do Starmie, depois tira screenshot real de `approved-gym-misty-[desktop/mobile].png`.
- T41 + Guardião Visual + homologação build desktop/mobile **PASS** antes do fast-forward. Falha bloqueia integração.

Não há evidência de progresso natural da campanha completa; o browser usa fixtures controladas e não concede insígnias ou altera jogadores reais.
