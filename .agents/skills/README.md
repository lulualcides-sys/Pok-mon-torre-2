# Skills de agente instaladas no repositório Pokémon Torre 2

Esta é uma **instalação de projeto**: arquivos originais `SKILL.md` + referências auxiliares em `.agents/skills/<nome>/`, para agentes compatíveis que trabalham no repositório. Não instala programas no PC, no ChatGPT nem na execução do jogo.

| Skill | Fornecedor/versão fixada | Licença | Função |
|---|---|---|---|
| `find-skills` | [vercel-labs/skills@92a9a34](https://github.com/vercel-labs/skills/tree/92a9a34ac3bf88e695e468b90c7bf32f163d32c8/skills/find-skills) | MIT | descobrir skills sob demanda |
| `playwright-cli` | [microsoft/playwright-cli@86f5616](https://github.com/microsoft/playwright-cli/tree/86f5616716033854f0990734fe2f9fcde0c1f6cc/skills/playwright-cli) | Apache-2.0 | testes e diagnóstico de navegador |
| `phaser-core` | [gamedev-skills@19d93f9](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/tree/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/web-engines/phaser-core) | Apache-2.0 | transição de cenas, estado e recursos Phaser |
| `performance-optimization` | [gamedev-skills@19d93f9](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/tree/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/performance-optimization) | Apache-2.0 | análise de gargalos, frame time e memória |

## Uso seguro

1. Ler `AGENTS.md`, `docs/GUIA-RAPIDO-REPOSITORIO.md` e as regras específicas. Acionar somente a skill da tarefa.
2. Para gargalos e congelamentos, carregar `performance-optimization` e, se necessário, `playwright-cli`. Medir antes e depois; preferir os testes existentes com `playwright-core`.
3. Para ciclo de cena/loader/inputs, ler `phaser-core`. Ela inclui exemplos de Phaser 4.2, mas a implementação deve respeitar **a versão instalada/embutida** do motor; não migrar a engine nem mexer em PixiJS 7.4.3.
4. `find-skills` é uma skill para **descoberta**, não autoriza executar `npx skills add` ou instalar qualquer origem sem revisão.
5. Skills não alteram golpes, efeitos, saves, Phaser, dependências npm, build ou publicação do jogo. Nenhuma alteração no runtime foi feita nesta instalação.

## Material de terceiros, verificação e limitações

- Os conteúdos foram copiados dos caminhos originais nos commits fixos acima, incluindo **10 referências** do Playwright, **uma** de Phaser e **uma** de desempenho.
- Textos de licença de origem estão em `.agents/skills/licenses/`: MIT da Vercel e Apache-2.0 da Microsoft e da gamedev-skills. O arquivo NOTICE da gamedev-skills foi preservado quando disponível.
- Sem `@playwright/cli` no `package.json`; `playwright-core` e os testes existentes permanecem como estavam.
- A existência dos arquivos permite que agentes compatíveis descubram e leiam as skills, mas **não é prova** de que algum agente já as carregou ou de que os testes/jogo ficaram mais rápidos.
- Não baixar ou executar comandos sugeridos em skills automaticamente. Auditar permissões, procedência e versões antes de qualquer execução.
