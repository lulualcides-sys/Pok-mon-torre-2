# Checklist T35 — progresso verificável

- [x] Mapear GYMS e identificar os oito bosses vigentes.
- [x] Criar renderer PMD Idle e vincular à tela própria do ginásio, em branch isolada.
- [x] Preservar API do interior existente com parâmetros opcionais.
- [x] Criar testes unitários e navegador real desktop/mobile.
- [x] Criar workflow dedicado e PR DRAFT.
- [ ] Confirmar todos os testes focados verdes no SHA final.
- [ ] Confirmar build Phaser original e screenshot real dos dois ginásios em ambos viewports.
- [ ] Inspecionar as imagens e validar proporções/sombras/idle.
- [ ] Rebase seguro sobre PR #421 atual, revisão, merge e Pages HTTP SHA exato.
- [ ] Tarefa SEPARADA: mover os 3/4 encontros existentes das rotas para o interior sem duplicar confrontos.

## Loader race — 01/11/2026 (branch isolada)

- [x] Reproduzir RED: o antigo listener global `complete` não reage a `filecomplete-spritesheet-torre2-gym-ace-0121` e pode deixar Starmie ausente.
- [x] Corrigir carregamento por chave PMD exata, remover listeners no sucesso/erro e no encerramento da tela, sem tocar em batalha ou saves.
- [x] Acrescentar regressões de conclusão de outro asset, erro de arquivo específico e ausência de vazamento de listeners.
- [ ] GitHub Actions T35 no HEAD exato, testes completos e Chromium desktop/mobile reais de Brock e Misty.
- [ ] Revisar arte/escala/posição, integrar PRs empilhadas apenas com gates verdes, confirmar Pages após merge.
