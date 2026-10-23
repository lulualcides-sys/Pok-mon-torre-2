# AGENTS.md — instruções permanentes do Pokémon Torre 2

Este repositório é o **Pokémon Torre 2**, não o Torre 1. Estas são instruções para qualquer agente, pessoa ou assistente que edite movimentos no futuro.

## REGRA MÁXIMA — REAPROVEITAMENTO REAL DE QUATRO FONTES (23/10/2026)

**É proibido inventar um golpe do zero por conveniência sem verificar primeiro os recursos concretos disponíveis nas quatro fontes abaixo.** O usuário exige reutilizar efetivamente componentes já existentes — e não apenas dizer que algo foi "inspirado" em outros jogos. A estética final permanece exatamente a do Poké Arena 2D, com pixel art legível.

1. **Pokémon Torre 2 (T2)** — efeitos e componentes dos golpes já aprovados: spritesheets, quadros, animações, trajetórias, colisões, padrões de impacto e lógica de estado. **Nunca modificar os originais aprovados** para reaproveitá-los.
2. **Poké Arena 2D (P2)** — preferir **motor, renderizadores e animações já existentes** (ex. `Chorro` de Hyper Beam/Aura Storm, `Proyectil`), aproveitando o comportamento e, quando permitido, os recursos originais. Se o próprio golpe já existir em P2, NÃO criar duplicado.
3. **Pokémon Zarza (Z)** — identificar módulos e rotinas reutilizáveis (ex. `poke-arena-beams.js`, `poke-arena-atlases.js`, `poke-arena-animation.js`, `poke-arena-surface-reactions.js`) e transportar/adaptar componentes tecnicamente aproveitáveis para **Phaser/WebGL**. Zarza usa Canvas 2D em alguns pontos: **NUNCA copiar Canvas 2D para Torre 2**.
4. **Emerald Arena (E)** — pesquisar e portar quando permitido as rotinas novas MIT para movimento, temporização, física, projéteis, efeitos de cenário, entrada, contato e colisões, com atribuição e termos preservados; o motor decompilado, artes e recursos de terceiros não estão automaticamente sob MIT.

**Procedimento obrigatório ANTES de qualquer VFX novo**:
- Conferir nome canônico e aliases PT/EN no cliente atual, os 37 movimentos do baseline e o acervo de 151 candidatos; não duplicar nenhum. Surf está reprovado, Scratch adiado.
- Abrir efetivamente os quatro projetos/arquivos relevantes e localizar para **cada fonte** o recurso específico, caminho, símbolo/função e licença. Distinguir "estudado", "inspirado" e **"efetivamente reutilizado"**.
- Selecionar e adaptar os melhores recursos; **a prioridade é reaproveitamento funcional**, não produzir 8–16 quadros novos por padrão.
- Registrar para cada um dos quatro: nome do efeito original, função/arquivo de origem, contribuição **real** ao novo golpe, arquivo/trecho local onde foi integrado e permissão/licença. Se indisponível, declarar motivo e **pedir autorização ao usuário antes de dispensar uma das fontes**.
- Garantir uma animação individual, bonita e original do movimento; não criar 3 esferas genéricas recoloridas. Phaser/WebGL, pixel art proporcional, 8–16 fases conforme necessidade, dano no contato real, erro de mira possível, hitbox, status e FPS mobile.
- Manter os golpes nativos, aprovados e controles congelados; arquivos separados, sem Python/Canvas 2D/CSS simulando ataque, sem vídeos colados.
- Testar colisão, erro, status, recuo, desempenho e renderização em batalha real no navegador antes de anunciar conclusão. Fazer commit, CI e confirmar a URL publicada.
- **Nunca afirmar que "usou os quatro" se apenas estudou screenshots, teve inspiração visual ou reutilizou o motor genérico**.

**Porta de qualidade:** novos movimentos cadastrados em `SIGNATURE_MOVES` devem ter prova por fonte em `data/move-reuse-policy.json`. O teste `npm test` roda `tests/move-reuse-policy.test.js`, que bloqueia **futuras entradas sem documentação completa**, sem comprovação dos quatro ou sem exceção expressa registrada. Esse teste valida documentação/evidências, mas não substitui a revisão humana dos ativos e do código.

**Correção já identificada:** Flash Cannon, Steel Beam e Mirror Shot foram criados praticamente do zero; NÃO são exemplos aprovados da nova regra. Eles constam como `requires-rework` e sem aprovação visual. Não alterá-los sem solicitação.

**Prioridade futura registrada:** *Mewtwo lifts rocks*, inspirada na demonstração do Emerald Arena: erguer pedras do cenário por telecinese, orbitá-las e arremessá-las com colisão independente. NÃO duplicar Rock Throw, Rock Tomb ou Rock Blast. **Planejado, não implementado.**

Leia também `docs/PADRAO-DE-GOLPES-TORRE2-MODELOS.md`, `docs/FILA-GOLPES-QUATRO-FONTES-2026-10-23.md`, `docs/EMERALD-ARENA-LISTA-DE-IMPLEMENTACAO.md` e `docs/CREDITOS-E-LICENCAS.md`.
