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

## Ferramentas integradas, instaláveis sob demanda

- **Repomix 1.18.1 e ast-grep 0.45.3** estão declarados **isoladamente** em `tools/dev/toolkit/package.json`. A instalação acontece quando se roda `npm install --prefix tools/dev/toolkit --no-audit --no-fund --no-package-lock`, ou na execução do GitHub Actions `toolkit-validation.yml`.
- Não foram inseridos em `package.json` da raiz nem no jogo publicado. `node_modules` permanece ignorado; o checkout não guarda executáveis.
- **Serena MCP não foi habilitado**, porque depende de um cliente MCP com acesso ao diretório de trabalho. Adicionar seus arquivos ao GitHub ou executá-lo num runner isolado NÃO o conectaria ao Astra deste chat. Instalação futura somente se a interface/cliente suportar MCP e o usuário habilitar a conexão.
- Recomendação: usar **Repomix apenas por área**, que faz compressão estrutural e tem verificação de segredos e limite de tokens; usar **ast-grep para pesquisa estrutural de símbolos sem edição automática**.

### Instalar, verificar e usar

```bash
npm install --prefix tools/dev/toolkit --no-audit --no-fund --no-package-lock
node tools/dev/contexto-ia.mjs --list
node tools/dev/contexto-ia.mjs clima
node tools/dev/busca-codigo.mjs --version
node tools/dev/busca-codigo.mjs captura 'export function $NAME($$ARGS) { $$BODY }'
```

O contexto gerado fica em `reports/contexto/<area>.xml` (não versionado). O arquivo é uma visão resumida do código, **não serve para editar ou testar a lógica sozinho**; abrir fontes reais para a modificação. O CI opcional registra versões e gera um artefato para auditoria, sem publicar o jogo.

`repomix.config.json` mantém verificação de segredos, ignora saídas, binários e bibliotecas de referência, e impõe orçamento de 60.000 tokens ao relatório: este teto é um limite de segurança da ferramenta, **não corresponde aos créditos do ChatGPT**. O ganho de créditos só pode ser estimado após medições comparáveis.

Fonte oficial: https://github.com/yamadashy/repomix ; https://github.com/ast-grep/ast-grep ; https://github.com/oraios/serena .

Estas ferramentas só geram economia quando o ambiente de desenvolvimento de fato as executar, e não por existirem no repositório.

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
