# Plano de implementação

Execução direta nesta sessão, conforme autonomia solicitada. Skills: Superpowers (planejamento/execução/validação), Arsenal create-game-assets e game-ui-ux.

1. Capturar baseline real antes de editar runtime. Verificar equivalência dos módulos publicados e locais.
2. Alterar somente desenho de cards em torre2-trainer-cards.js, mantendo grid, sprites, hotspots, callbacks e paginação.
3. Acrescentar decoração estática em torre2-city-scenery.js, preservando plantas, mapas, NPCs e hitboxes. Sem novo timer.
4. Refinar apenas pcScreen em torre2-campaign-scene.js. Nenhuma edição em funções de batalha ou helpers compartilhados.
5. Produzir componentes/spritesheet original de cenário/UI com proveniência e documentação de escala.
6. Testar fontes, guardião, UI e integridade; comparar screenshots reais. Revisar diff por função e hash.

Riscos: cliente-base externo indisponível (403 em captura e artefato). Alternativa de inspeção: servidor local espelha recursos públicos existentes e substitui exclusivamente os módulos visuais editados. Não constitui build limpo nem aprovação de CI; registrar explicitamente. PR #600 toca no mesmo arquivo de cards, porém em paginação; não incorporar nem resolver silenciosamente.

Rollback: descartar branch de homologação; main não é alterada. Expansão e release bloqueados até aprovação humana.
