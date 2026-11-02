# T16 — tarefas verificaveis: catalogo de clima

- [x] Inspecionar WEATHERMOVES, catalogo aprovado e `availableMoves/equipMove` na main 8908e9d.
- [x] Acrescentar teste compilado de presenca, desbloqueio Lv25, equipabilidade e isolamento da Arena (sem criar VFX).
- [x] Registrar workflow de gates completos e laboratorio no Chromium.
- [ ] Workflow do HEAD exato passa todos gates; caso contrario diagnosticar e corrigir teste ou causa real.
- [ ] Revisar diff, merge sem conflitos com T20/T10 e confirmar novo Pages/HTTP SHA.
- [ ] Manter Sunny Day, Sandstorm e Hail sem falsificar disponibilidades ate recursos/4 fontes/permissão aprovados.
- [ ] Testar batalha jogada manualmente no Android para Rain Dance, sem confundir CI compilada com Android real.

## T16 — equipamento de clima ampliado (30/10/2026)

- [x] Validar os 40 Pokémon de Água/Elétrico compatíveis com TM18 pela tabela FRLG local (sem modificar a tabela oficial).
- [x] Codificar liberação opcional de Rain Dance no Lv25 via editor existente e VFX `torre2_finale_raindance`.
- [x] Adicionar teste compilado de 40 equipamentos, ULT intacta, exclusões de espécies e bloqueio dos outros climas sem VFX.
- [ ] CI do HEAD exato e navegador Chromium passam; registrar SHA.
- [ ] Integrar somente se verde e sem conflito com T20; confirmar Pages público pelo commit.
- [ ] Sunny Day/Sandstorm/Hail: investigar quatro fontes, aprovar VFX específico e habilitar equipamento por tipo com TM FireRed; **não** marcar concluído antes disso.
