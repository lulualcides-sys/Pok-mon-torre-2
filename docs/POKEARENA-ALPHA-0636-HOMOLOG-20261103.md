# Acompanhamento do cliente-base Poké Arena 2D — 03/11/2026

## Evidência e identificação

- **Referência:** https://www.pokearena2d.com/
- **Versão visual observada:** Alpha **0.63.6** na captura fornecida pelo usuário em 03/11/2026.
- **Versão técnica verificada nos metadados de main:** `siteVersion=src-2d2489fdee`; `sourceVersion=src-2203b5fd63`. **Não há prova nesta auditoria de que esses hashes correspondam especificamente à Alpha 0.63.6.**
- Os identificadores `src-...` são hashes técnicos e não substituem o número Alpha visível na interface.

## Diferença recuperada para a homologação

A branch de homologação tinha **165 golpes** e **32 Pokémon de origem catalogados**. O catálogo mais recente em main tinha **168 golpes** e **33 Pokémon de origem**.

- Novos registros no diferencial: Dragon Ascent, Hurricane e Twister.
- Metadados alterados: Dragon Claw, Dragon Dance e Extreme Speed.
- Novo Pokémon de origem observado: Rayquaza.
- Alteração deste lote: **somente catálogo e teste de integridade**; nenhum golpe novo foi instalado/equipado, nenhum VFX foi substituído, nenhuma espécie foi liberada na campanha.

## Fila de integração técnica

1. **Hurricane / Twister:** verificar renderizador, hitbox, cooldown, efeito de status, animação mobile/desktop e possível uso pelas espécies compatíveis antes de alterar kits. Revisar aliases e evitar efeitos duplicados.
2. **Dragon Claw / Dragon Dance / Extreme Speed:** comparar as alterações do cliente com os efeitos já existentes; preservar os aprovados e só alterar divergências verificadas.
3. **Dragon Ascent / Rayquaza:** manter no catálogo de referência; não liberar automaticamente na campanha Kanto 151 nem atribuir compatibilidade sem comprovação.
4. **Cliente-base após 0.63.6:** classificar mudanças em golpes, formas, movimentos, IA, interfaces, sprites, animações, mecanismos e desempenho. Não reduzir o acompanhamento a nomes de golpes.

## Política operacional

- Atualizações funcionais exigem implementação própria ou licença/permissão adequada, testes de jogabilidade Phaser/Chromium desktop+mobile e respeito a sprites/VFX aprovados.
- A sincronização de metadados **não significa jogabilidade validada**.
- Preservar as 60 artes aprovadas, mapa/progressão, saves, balanceamento e patches em andamento.
- PRs e integração somente na branch `test/homologacao-kanto-20261103`, depois de CI. Nunca publicar ou fazer merge em `main` sem aprovação final explícita.
- Automação de atualização do cliente-base deve operar separadamente da automação de mapas e evitar capturas completas redundantes quando não houver mudança de hash.
