# AGENTS.md — instruções permanentes do Pokémon Torre 2

Este repositório é o **Pokémon Torre 2**, não o Torre 1. Estas são instruções para qualquer agente, pessoa ou assistente que edite movimentos no futuro.

## REGRA DE PRECEDÊNCIA INVIOLÁVEL — 06/11/2026 (TODOS os PRs)

- **Espécies e evoluções/Megas nativas do Poké Arena 2D são intocáveis**, inclusive Ho-Oh, Crobat e Steelix. Não modificar ou completar kits, slots, golpes, ULT, sprites, cooldown e VFX, inclusive se houver menos de quatro habilidades. Identificar o nativo antes de integrar qualquer espécie nova. A Pokédex não pode reescrever dados da Arena.
- **Todos os golpes com nome canônico igual** no Torre 2 e cliente-base P2 **usam a animação/forma executável original P2** no catálogo Torre 2, sem editar o objeto/kit nativo. Isso inclui Peck, Double Kick, Crunch e qualquer outro overlap. **Esta regra supera a proteção histórica dos efeitos caseiros homônimos**, mesmo quando antes aprovados.
- **VFX exclusivos aprovados do Torre 2 permanecem preservados**; sem renderer original P2 executável não inventar equivalência nem alterar kit nativo. Kits calculados apenas de espécies realmente novas, com learnsets compatíveis e biblioteca executável.
- **Regressões obrigatórias:** snapshot de kits nativos de espécie/evolução/Mega antes/depois; varredura de overlaps e exclusivos; testes Chromium/Phaser, checks CI e confirmação do SHA publicado no GitHub Pages.

**Em conflito com decisões anteriores neste documento, esta regra expressa prevalece.**

## REGRA MÁXIMA — REAPROVEITAMENTO REAL DE QUATRO FONTES (23/10/2026)

**É proibido inventar um golpe do zero por conveniência sem verificar primeiro os recursos concretos disponíveis nas quatro fontes abaixo.** O usuário exige reutilizar efetivamente componentes já existentes — e não apenas dizer que algo foi "inspirado" em outros jogos. A estética final permanece exatamente a do Poké Arena 2D, com pixel art legível.

1. **Pokémon Torre 2 (T2)** — efeitos e componentes dos golpes já aprovados: spritesheets, quadros, animações, trajetórias, colisões, padrões de impacto e lógica de estado. **Nunca modificar os originais aprovados** para reaproveitá-los.
2. **Poké Arena 2D (P2)** — preferir **motor, renderizadores e animações já existentes** (ex. `Chorro` de Hyper Beam/Aura Storm, `Proyectil`), aproveitando o comportamento e, quando permitido, os recursos originais. Se o próprio golpe já existir em P2, NÃO criar duplicado.
3. **Pokémon Zarza (Z)** — identificar módulos e rotinas reutilizáveis (ex. `poke-arena-beams.js`, `poke-arena-atlases.js`, `poke-arena-animation.js`, `poke-arena-surface-reactions.js`) e transportar/adaptar componentes tecnicamente aproveitáveis para **Phaser/WebGL**. Zarza usa Canvas 2D em alguns pontos: **NUNCA copiar Canvas 2D para Torre 2**.
4. **Emerald Arena (E)** — pesquisar e portar quando permitido as rotinas novas MIT para movimento, temporização, física, projéteis, efeitos de cenário, entrada, contato e colisões, com atribuição e termos preservados; o motor decompilado, artes e recursos de terceiros não estão automaticamente sob MIT.

**Procedimento obrigatório ANTES de qualquer VFX novo**:
- Conferir nome canônico e aliases PT/EN no cliente atual, os 37 movimentos do baseline e o acervo de 151 candidatos; não duplicar nenhum. **Decisão mais recente de 30/10/2026: o VFX Surf está APROVADO e deve ser preservado.** Isso NÃO libera automaticamente TM/HM Surf na campanha: o gate de obtenção/equipamento exige decisão e patch próprios. Scratch e Transform permanecem adiados. A proibição histórica de Surf foi superada somente quanto à aprovação do efeito.
- Abrir efetivamente os quatro projetos/arquivos relevantes e localizar para **cada fonte** o recurso específico, caminho, símbolo/função e licença. Distinguir "estudado", "inspirado" e **"efetivamente reutilizado"**.
- Selecionar e adaptar os melhores recursos; **a prioridade é reaproveitamento funcional**, não produzir 8–16 quadros novos por padrão.
- Registrar para cada um dos quatro: nome do efeito original, função/arquivo de origem, contribuição **real** ao novo golpe, arquivo/trecho local onde foi integrado e permissão/licença. Se indisponível, declarar motivo e **pedir autorização ao usuário antes de dispensar uma das fontes**.
- Garantir uma animação individual, bonita e original do movimento; não criar 3 esferas genéricas recoloridas. Phaser/WebGL, pixel art proporcional, 8–16 fases conforme necessidade, dano no contato real, erro de mira possível, hitbox, status e FPS mobile.
- Manter os golpes nativos, aprovados e controles congelados; arquivos separados, sem Python/Canvas 2D/CSS simulando ataque, sem vídeos colados.
- Testar colisão, erro, status, recuo, desempenho e renderização em batalha real no navegador antes de anunciar conclusão. Fazer commit, CI e confirmar a URL publicada.
- **Nunca afirmar que "usou os quatro" se apenas estudou screenshots, teve inspiração visual ou reutilizou o motor genérico**.

**Porta de qualidade:** novos movimentos cadastrados em `SIGNATURE_MOVES` devem ter prova por fonte em `data/move-reuse-policy.json`. O teste `npm test` roda `tests/move-reuse-policy.test.js`, que bloqueia **futuras entradas sem documentação completa**, sem comprovação dos quatro ou sem exceção expressa registrada. Esse teste valida documentação/evidências, mas não substitui a revisão humana dos ativos e do código.

**Aprovação visual registrada em 23/10/2026:** o usuário aprovou Flash Cannon, Steel Beam e Mirror Shot e pediu para salvar. **Não modificar** os efeitos. A aprovação visual não comprova reaproveitamento das quatro fontes: a dívida de proveniência continua registrada como `requires-rework` em `data/move-reuse-policy.json`.

**Prioridade futura registrada:** *Mewtwo lifts rocks*, inspirada na demonstração do Emerald Arena: erguer pedras do cenário por telecinese, orbitá-las e arremessá-las com colisão independente. NÃO duplicar Rock Throw, Rock Tomb ou Rock Blast. **Planejado, não implementado.**

Leia também `docs/PADRAO-DE-GOLPES-TORRE2-MODELOS.md`, `docs/FILA-GOLPES-QUATRO-FONTES-2026-10-23.md`, `docs/EMERALD-ARENA-LISTA-DE-IMPLEMENTACAO.md` e `docs/CREDITOS-E-LICENCAS.md`.

## REGRA PERMANENTE — KIT NATIVO IMUTÁVEL DO POKÉ ARENA 2D (05/11/2026)

**Para toda espécie ou evolução já presente no cliente-base oficial, os golpes e slots originais são intocáveis.** O Torre 2 não pode modificar, reordenar, substituir, completar ou reconfigurar qualquer parte de `kit` da espécie nativa: `lmb` (ATK), `rmb` (HAB 2), `q` (HAB 3), `e` (ULT), `esp` (esquiva), nomes, forma, dano, cooldown, animação ou efeitos já existentes. Esta regra abrange a **Arena, Pokédex, Training, Mega e demais modos**, não apenas a campanha.

**Critério de origem:** o identificador de espécie/evolução deve ser comparado com o `TODOS`/`ROSTER` original capturado do cliente-base **antes de qualquer `addAll*`, `upgrade*`, fallback ou sincronização do Torre 2**. A existência de uma espécie no cliente-base é suficiente para protegê-la, mesmo se o kit estiver vazio ou incompleto. Exemplo confirmado de exceção proibida: o fallback de Ho-Oh na PR #565 não deve preencher slots vazios; registrar a falta em relatório.

**Somente as espécies verdadeiramente novas** (não presentes no snapshot original do cliente-base) podem receber kits calculados de golpes FRLG/Johto, TMs, VFX aprovados e regras próprias da campanha. O código não pode confundir a Pokédex com a fonte do moveset nem usar a Pokédex para substituir os golpes nativos da Arena: ambas devem consultar a mesma fonte efetiva sem mutação. Evitar também alterações indiretas por referências compartilhadas (`kit` e `evoluciones[].kit`).

**Teste obrigatório antes do merge:** comparar os campos de golpes/slots de **cada espécie nativa e cada evolução/Mega** contra o snapshot original, antes/depois da integração. Nenhuma diferença é permitida sem autorização expressa e específica do usuário. Se o teste falhar, não mesclar nem publicar. Não mascarar slots originalmente vazios como se estivessem implementados, nem reprovar a preservação apenas por existirem lacunas já presentes no cliente-base.
