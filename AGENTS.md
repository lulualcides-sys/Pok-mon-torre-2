# AGENTS.md — regras essenciais e roteamento de tarefas (Pokémon Torre 2)

Este é o **Pokémon Torre 2**. Nunca misturar com Pokémon Torre 1. Antes de cada patch, consultar o índice `docs/GUIA-RAPIDO-REPOSITORIO.md` e abrir **somente** o código, testes e documentos necessários ao escopo. O plano de economia e suas limitações estão em `docs/ECONOMIA-DE-CONTEXTO-ASTRA.md`.

## Memória operacional de baixo custo (Obsidian/Markdown)

- **Antes da busca de código**, quando houver shell Node no checkout, executar `node tools/dev/memoria-contexto.mjs <area>` (consulte `--list`). As notas ficam em [`docs/memoria/00-INDICE.md`](docs/memoria/00-INDICE.md) e podem ser abertas localmente no Obsidian.
- **Não usar resumo para substituir** a leitura integral da política de golpes, Script Mestre, fila e fontes obrigatórias. Sempre verificar HEAD/PRs/CI atuais; o comando é um índice pequeno, não memória viva nem prova de testes.
- Graphiti está apenas catalogado no Arsenal, **não conectado** a este projeto. Nunca criar custos de LLM, embeddings ou banco de grafos sem teste e justificativa.

## Regras inegociáveis

- **Preservar todos os golpes, efeitos, sprites e mecânicas já aprovados.** Não sobrescrever aprovações ou alterar o padrão nativo do Poké Arena 2D.
- **Qualquer mudança em golpes, VFX, catálogo, proveniência ou testes de golpes exige leitura prévia da política INTEGRAL**: `docs/agentes/POLITICA-GOLPES-INTEGRAL.md`. Ela é a cópia literal das regras anteriores deste `AGENTS.md` e continua obrigatória. Ler também `docs/FICHA-REAPROVEITAMENTO-4-FONTES.md` quando pertinente.
- Para novos golpes, conferir as **quatro fontes** (efeitos aprovados do Torre 2, Poké Arena 2D, Pokémon Zarza e Emerald Arena), verificando caminhos, símbolos e licenças. Sem afirmar reutilização se houve apenas inspiração. Sem dispensar fonte sem a autorização expressa exigida na política integral. Não duplicar golpes existentes.
- Golpes em Phaser/WebGL, pixel art proporcional, colisão/dano sincronizados. Não usar Canvas 2D, CSS como ataque, vídeo colado ou Python para criar/animações de golpes.
- Respeitar os bloqueios da campanha (3 golpes fracos no nível 5; ULT fraca liberada no 8), as tabelas FRLG, saves, modos Arena e demais decisões aprovadas. Não liberar golpes fortes antecipadamente.
- **Não mover/renomear arquivos executáveis para organizar pastas** sem antes auditar imports, builds, regressões e licenças. Nenhum patch de economia deve mexer nos sistemas de batalha em andamento.

## Passo a passo econômico, sem reduzir qualidade

1. Localizar os símbolos por nome, ler apenas trechos relevantes e seus contratos; não despejar todo o repositório nem reler relatórios históricos sem motivo.
2. Corrigir somente arquivos necessários, com diff auditável. Trabalhar em branch isolada se outra frente estiver alterando `main`.
3. Rodar testes unitários focados para o diagnóstico com `node tools/dev/testes-focados.mjs --list`; após o patch, **CI, build, testes de navegador e testes completos aplicáveis continuam obrigatórios antes de publicar**.
4. Não declarar sucesso da publicação sem verificar o commit instalado no GitHub Pages. Não confundir depuração com uma campanha normalmente jogada.
5. Relatar arquivos, testes efetivamente executados, commit, riscos e status de publicação. Se não houve execução, escrever «não verificado».

## Script Mestre atual — referência permanente de continuidade

- Ler o **[Script Mestre Definitivo de 27/10/2026](docs/SCRIPT-MESTRE-DEFINITIVO-2026-10-27.md)** integralmente como especificação da campanha e dos sistemas autorizados, sem reescrevê-lo ou presumir que está concluído.
- Antes de qualquer patch ou resposta sobre o que falta, consultar **[Controle de execução das 37 seções](docs/CONTROLE-EXECUCAO-SCRIPT-MESTRE.md)**; atualizar apenas com evidência de código, testes, CI, commit e publicação verificável.
- Se o roadmap histórico estiver em conflito com escopo posterior explícito do Script Mestre, preservar os golpes/VFX/controles já aprovados; não usar a divergência para apagar progresso ou alterar o cliente nativo indiscriminadamente.
- **Testes em fixture, percurso por depuração e testes de chefes não são prova de campanha jogada normalmente.** Marcar seções como concluídas apenas depois de cumprir seus critérios no jogo real.

- **Comando do usuário `continue` / `Continue este chat`:** abrir a [FILA DE CONTINUIDADE T01–T31](docs/FILA-CONTINUE-SCRIPT-MESTRE.md), conferir o HEAD, os PRs concorrentes e começar o primeiro item ainda não validado e não bloqueado. O usuário já autorizou o Script Mestre; não pedir aval a cada patch. Para cada lote, executar o que for possível de forma concreta, testar, integrar/publicar somente quando validado, e registrar evidências e pendências na fila e no controle das 37 seções. A numeração T01–T31 é operacional, distinta das 37 seções do Script Mestre. Nunca marcar um item como completo com base apenas em código escrito ou um fixture.

## Fluxo padrão — Superpowers + Spec Kit (desde 30/10/2026)

- **Padrão obrigatório para qualquer `continue`, bug ou feature:** usar a [constituição Spec Kit](.specify/memory/constitution.md) e as [especificações de continuidade](specs/001-master-script-continuity/spec.md) como **complementos**, sem substituir o Script Mestre, esta política ou a fila T01–T31.
- **Antes de agir:** conferir `main`, PRs/branches e CI concorrentes; recuperar checkpoint/controle, identificar a primeira tarefa não bloqueada e atualizar sua especificação, plano e checklist (`specs/<id>-<tema>/spec.md`, `plan.md`, `tasks.md`). Evitar duplicação de documentação e PRs.
- **Com Superpowers disponível:** aplicar `brainstorming` em mudanças novas de comportamento (sem pedir aprovações repetidas de decisões já tomadas no Script Mestre), `systematic-debugging` em defeitos, `test-driven-development` em regressões, `executing-plans` em planos aprovados e `verification-before-completion` antes de comunicar resultado; solicitar revisão quando possível. Sem acesso à skill, executar o equivalente manualmente e dizer que não houve invocação do plugin.
- **Ciclo mínimo:** reproduzir → RED (quando aplicável) → mudança pequena e isolada → GREEN → testes focados + CI/build/navegador aplicáveis → revisão → PR/merge → confirmar Pages HTTP no SHA exato. Nunca reportar sucesso sem evidência nova.
- **Registro obrigatório:** arquivos modificados, SHA/PR, testes realmente executados (fixture vs. Chromium vs. campanha natural vs. Android físico), conclusão de CI e estado de publicação. Adoção destes métodos **não** conclui nenhuma seção do Script Mestre nem instala automaticamente o CLI Spec Kit.
