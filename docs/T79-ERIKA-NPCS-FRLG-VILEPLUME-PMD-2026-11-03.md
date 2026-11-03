# T79 — Erika: quatro NPCs FireRed originais + Vileplume PMD Idle

**Somente homologação** `test/homologacao-kanto-20261103`. Não publicar `main`/Pages nem editar quaisquer das 60 artes aprovadas.

## Diagnóstico
O ginásio de Celadon tem quatro plataformas vazias prontas para overlays Phaser, porém os NPCs existentes repetiam `lass`, `bugcatcher`, `lass`, `bugcatcher`. Bug Catchers não pertencem à temática de treinadoras do ginásio da Erika. O Pokémon `vileplume` era um retrato quadrado de 30×30 pixels, não uma figura PMD completa.

## Correção realizada
- Quatro classes coerentes com os treinadores originais FRLG de Celadon: `lass`, `beauty`, `picnicker` e `cooltrainer_f`. Quatro texturas originais diferentes, importadas do repositório público de decompilação `pret/pokefirered`, e desenhadas somente sobre os círculos vazios, sem tocar no fundo.
- Incluído `beauty.png` ao instalador original; todos os cinco elementos indispensáveis (`erika`, `lass`, `beauty`, `picnicker`, `cooltrainer_f`) são verificados. Falta de arquivo faz o build falhar; sem substituição silenciosa por Youngster.
- A líder Erika permanece no platô central; ao lado, `Vileplume` (Pokédex 0045) usa `Idle` transparente da biblioteca SpriteCollab PMD local, filtragem NEAREST e animação original, sem retrato quadrado. O spritesheet nativo 0045 possui quadros 32×40 px, mas o primeiro quadro tem pixels opacos somente até a linha 25; o ponto de apoio foi corrigido matematicamente para `originY=26/40`, alinhando a base visível à plataforma, sem aumentar o sprite nem modificar a arte de fundo.
- Carregamento limitado ao trecho de Celadon: etapas 3 e 4, sem baixar sprites em runtime nem carregar toda a Pokédex na GPU.
- Índices de batalhas [15,16,17,18], equipes, golpes, saves, recompensas e regras de captura permanecem intocados.

## Testes
- `tests/t79-erika-native-sprites.test.mjs`: valida quatro classes e texturas únicas, origens do instalador, índices, posição, manifesto PMD e integridade dos ginásios anteriores.
- `tests/approved-map-real-browser.cjs`: fixture controlada na etapa 3, abre o mapa de Celadon e usa **clique/touch verdadeiro na porta do ginásio**. Exige sprites originais `frlg-npc-lass`, `frlg-npc-beauty`, `frlg-npc-picnicker`, `frlg-npc-cooltrainer_f`, líder `frlg-npc-erika` e ace `torre2-gym-ace-idle-0045`, sem alterar save. Screenshots `t79-approved-gym-erika-[desktop/mobile].png`.
- Gate T41/Guardião Visual/ZIP homologação devem terminar PASS no commit exato antes de integrar.

## Próxima prioridade
Koga possui `biker`, `psychic`, `ace`, `biker` ainda sem padronização FireRed: revisar com NPCs de veneno/ninja, sem sobrescrever o WebP. Surge continua em `artworkOnly` porque NPCs e Pikachu estão **pintados** na arte; não reivindicar correção visual sem aprovação de nova imagem.

**Importante:** as fixtures do navegador usam progresso controlado, não jogos completados naturalmente. Arte original não equivale a autorização de redistribuição comercial; rever licenças e direitos dos materiais antes de qualquer lançamento público.
