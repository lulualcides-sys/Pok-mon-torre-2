# Economia de contexto e créditos — Pokémon Torre 2

Este plano reduz trabalho repetido e contexto desnecessário; **não** promete aumento percentual de franquia, créditos gratuitos ou eliminação de limites do ChatGPT.

## Regra de segurança
O Script Mestre e todos os golpes aprovados têm prioridade sobre economia. Não reduzir qualidade, não desativar verificações obrigatórias, não modificar história/saves/atributos para contornar testes. Concluir e validar o patch ativo antes de integrar esta otimização. Trabalhar em branch separada, comparar diffs e criar backup antes de renomear qualquer módulo.

## Procedimento econômico por tarefa
1. Descobrir arquivos pelo `docs/GUIA-RAPIDO-REPOSITORIO.md`. Em vez de ler toda a árvore, pesquisar nomes de símbolos e arquivos.
2. Carregar apenas as partes pertinentes, com 20-40 linhas em torno do erro quando viável. Para mudanças de golpes, carregar também o contrato **integral** em `docs/agentes/POLITICA-GOLPES-INTEGRAL.md`.
3. Escrever plano curto (arquivo, hipótese, teste de regressão). Corrigir apenas o necessário.
4. Rodar a área com `node tools/dev/testes-focados.mjs <area>`. Não chamar testes de navegador todos a cada microedição, mas jamais pular a bateria completa na aprovação final.
5. Apresentar resultado em cinco campos: problema, arquivos alterados, testes, commit e publicação/pendência.
6. Reaproveitar relatórios de CI idênticos ao mesmo commit; nunca atribuir um teste de commit antigo à versão nova.
7. Usar raciocínio/ambiente mais econômico quando a tarefa for mecânica, avançando para esforço elevado somente para regressões difíceis ou alterações grandes.

## Ferramentas opcionais (NÃO instaladas por este patch)
- **Serena MCP:** navegação por símbolos em ambiente com MCP e serviço de linguagem ativo; verificar compatibilidade, custo da inicialização e permissões antes de conectar.
- **Repomix:** inventário de tokens e empacotamento seletivo, com exclusões; **não** enviar o repositório inteiro a cada turno.
- **ast-grep / ripgrep:** buscas locais rápidas. Uma boa busca simples já pode dispensar instalação adicional.

Estas ferramentas são **opcionais** e só geram economia se o agente conseguir acessá-las de verdade. Adicionar links de GitHub não instala ferramentas no ChatGPT.

## Testes focados e teste final
O utilitário `tools/dev/testes-focados.mjs` permite executar suites unitárias existentes por domínio. Ele **não** muda `package.json`, workflows, shaders, golpes, arte, campanha nem GitHub Pages.

Comandos:
```bash
node tools/dev/testes-focados.mjs --list
node tools/dev/testes-focados.mjs campanha
node tools/dev/testes-focados.mjs combate
node tools/dev/testes-focados.mjs golpes
node tools/dev/testes-focados.mjs arena
node tools/dev/testes-focados.mjs interface
node tools/dev/testes-focados.mjs captura
```

Após finalizar o patch, o pipeline deve executar `npm test`, `npm run check`, testes do cliente compilado e testes Chromium conforme escopo do `package.json` e `.github/workflows/`. Na campanha, exigir também jornada sem atalhos antes de afirmar completude.

## Como medir
Para cada tipo de patch, comparar 3–5 alterações de complexidade semelhante: créditos consumidos (se o plano expuser), tempo até testes verdes, quantidade de leituras, falhas reabertas e qualidade visual. Não comparar uma correção simples com um Script Mestre inteiro. Não atribuir uma economia numérica sem medição.

## Política de integração
Criar PR em modo rascunho e aguardar término da frente ativa do Astra para integrar. Conferir conflitos contra HEAD recente. Não ativar auto-merge. O branch de otimização é independente do jogo publicado.
