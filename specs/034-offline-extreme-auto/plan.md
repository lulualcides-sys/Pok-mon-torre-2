# Plano de implantação
- Base isolada: branch `feat/offline-extreme-auto-evolution-20261103`, criada sobre `main`. Nenhum trabalho concorrente deve ser sobrescrito.
- Alterar apenas `tools/pokearena/torre2-auto-battle.js` (cérebro e EVO), os testes unitários e o teste de navegador já existentes.
- Usar o construtor e os sinais `puedeEvolucionar` / `puedeMega` de `Luchador`. A transformação é responsabilidade do cliente nativo, não de um setter de forma.
- Preservar botão AUTO, HUD, golpes, VFX, saves e toda a campanha.
- Risco: configuração da IA nativa e fase de transição após EVO. Revalidar no Chromium e não concluir com base apenas nos testes em fixture.
- Rollback: não mesclar a branch; nenhuma mudança em saves/migração. Se já integrada, reverter o commit isolado após revisar conflitos.
