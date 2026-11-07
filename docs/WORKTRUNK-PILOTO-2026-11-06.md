# Worktrunk — integração opcional e segura no Pokémon Torre 2

Fonte: https://github.com/max-sixty/worktrunk (licença MIT/Apache-2.0 conforme projeto). Ferramenta **local de desenvolvimento**; não roda no jogo, nem altera o deploy do GitHub Pages.

## Como utilizar

Pré-requisito: Git, Node 24 e a CLI oficial Worktrunk instalada **no seu computador** (a instalação não é automática pelo repositório). Windows pode fornecer `git-wt` em vez de `wt`; o script exige `wt` no PATH, para evitar chamar o comando do Windows Terminal por engano.

```sh
node tools/dev/worktrunk-isolation.mjs status
node tools/dev/worktrunk-isolation.mjs create fix/arena-pagination
# Abra a worktree criada pelo Worktrunk e edite/teste lá.
node tools/dev/testes-focados.mjs arena
npm run check
npm run check:reuse
npm test
```

- `status` funciona sem instalar Worktrunk e lê `git worktree list --porcelain` sem mutação.
- `create` chama `wt switch --create` da ferramenta oficial e **recusa** mudanças não commitadas, nomes fora de `feat/`, `fix/`, `test/`, `research/` e referências Git perigosas. Não clona, mescla nem exclui branches.
- Cada tarefa deve ter branch/worktree dedicada. Evitar edições concorrentes no `main` e sobreposição de mudanças de aprovação do P2.
- **Condição de merge:** verificar DIFF, testes completos, regressões Chromium/Phaser, snapshot de kits e VFX nativos, CI e SHA servido pelo Pages. Testes de isolamento não provam melhora de FPS ou correção de gameplay.
- **Limitação:** a CLI não pode operar no ambiente do usuário a partir do GitHub. Nenhuma instalação local, teste de jogo real, eliminação de conflitos ou economia de tempo foi demonstrada por este arquivo.

A suíte `tests/worktrunk-isolation.test.js` valida sintaxe, bloqueio de branches perigosas e parsing sem depender do executável externo. Os demais testes do jogo permanecem intactos.
