# T78 — Lt. Surge: integridade da arte pintada e ace real

**Somente homologação.** Não modificar nenhum dos 60 arquivos WebP aprovados, nem `main`, nem GitHub Pages sem autorização final expressa.

## Diagnóstico visual confirmado
A arte aprovada `gym-surge.webp` contém de fábrica o Lt. Surge, um **Pikachu** decorativo à sua direita e quatro NPCs pintados nas plataformas. Não há figuras independentes do Phaser para esses seis personagens. Alterar os sprites dessas figuras exigiria revisar o WebP aprovado, o que não está autorizado. Sobrepor novos NPCs ou um Raichu transparente sobre o Pikachu existente criaria personagens duplicados.

**A equipe de batalha real permanece** `['voltorb','pikachu','raichu']`, com `boss:'raichu'`, e não foi modificada. O Pikachu do cenário é apenas decoração, **não** o Pokémon mais forte do Surge.

## Verificação implementada
- `tests/t78-surge-painted-artwork-policy.test.mjs`: exige `artworkOnly:true`, quatro marcadores preexistentes, ausência de NPCs duplicados, sem recompensas falsas e Raichu no roster real.
- `tests/approved-map-real-browser.cjs`: entra no ginásio pela **porta real de Vermilion** em fixture controlada, confirma textura `torre2-approved-map-gym-surge`, quatro ações interativas de treinador sem figuras duplicadas, e que o roster contém Raichu. Registra `t78-approved-gym-surge-[desktop/mobile].png` e retorna por clique real à cidade sem alterar o save.
- T41 e Guardião Visual em desktop/mobile deverão passar no commit final. Esta auditoria não altera o cenário nem a jogabilidade, mas adiciona prova de regressão real.

## Pendência visual
- A figurinha de Pikachu na arte aprovada **não corresponde ao ace Raichu**; a substituição visual permanente exige aprovação explícita de uma **nova versão da arte de Surge**, preservando a original para comparação e reversão.
- Os quatro NPCs pintados não podem ser trocados individualmente por sprites FRLG enquanto permanecerem embutidos no fundo. Não declarar essas substituições concluídas.
- O próximo ginásio que permite correção real sem alterar o WebP é `gym-erika`, cujos quatro círculos estão livres e já têm NPCs Phaser independentes.

Testes são fixtures controladas, não uma campanha natural concluída.
