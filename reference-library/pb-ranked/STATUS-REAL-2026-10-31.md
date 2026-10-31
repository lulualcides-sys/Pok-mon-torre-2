# Estado verificável — pesquisa REA PB Ranked — 31/10/2026

> **ATUALIZAÇÃO SUPERVENIENTE (31/10/2026): AUTENTICAÇÃO E PARTIDAS CONTRA BOT FUNCIONARAM.**
> O bloqueio de login relatado abaixo se refere à **coleta pública inicial**, sem sessão Google.
> Depois, o usuário autenticou o perfil privado do TinyFish e foram observadas **três sessões do modo Practice vs Bot**, incluindo ataques manuais, AUTO, DODGE e troca para Crobat. Consulte [o relatório da sessão autenticada](AUDITORIA-COMBATE-AUTENTICADO-2026-10-31.md) e [o inventário JSON](COMBATE-OBSERVADO-2026-10-31.json).
> **Ressalva:** o REA foi executado sobre o site público e o TinyFish operou o navegador autenticado; não afirmar que o REA foi anexado ao navegador autenticado.

**Resultado:** biblioteca de pesquisa criada e preservada na branch `research/pb-ranked-rea-20261031`. Nenhum código, HUD, golpe aprovado, save ou sistema do Pokémon Torre 2 em produção foi alterado. **Online/PvP está explicitamente fora do escopo.**

## Evidência concluída

- **Coleta REA/CDP da página:** [Actions #41226497651](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41226497651) — **success**.
- **Coleta aprofundada com navegador e AST:** [Actions #41227227340](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41227227340) — **success**, catálogos JSON publicados na branch.
- **Rollback de alteração posterior defeituosa no coletor:** [Actions #41227663816](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41227663816) — **success**. A versão de coletor que passou em Actions foi restaurada. Os catálogos permanecem.
- **Código JS maior analisado:** `/bundles/03413a73844b301c.js`, cerca de **5.968 KB**. Parser AST local percorreu **2.379.232 nós** desse bundle. O REA, separadamente, produziu inventário CDP/bundle com cobertura parcial por limite de execução.

## Catálogos disponíveis

| Evidência | Contagem | Interpretação |
| --- | ---: | --- |
| Candidatos de golpes em objetos JavaScript | 123 | 119 nomes distintos; parâmetros variáveis declarados, sem garantir VFX jogável |
| Golpes coincidentes com catálogo-fonte Poké Arena 2D | 47 | Comparação de **referências**, não prova de implementação no Torre 2 |
| Nomes não vistos no catálogo-fonte de 165 movimentos do Poké Arena 2D | 72 | Podem existir no Torre 2 por outras fontes; conferir antes de desenvolver |
| Scripts da página lidos pelo coletor | 11 | Bundle grande também passou no analisador AST independente |
| Recursos de rede vistos na sessão | 171 | O navegador não carregou recursos que só aparecem nas partidas |
| Estados/termos de animação detectados | 189 | Muitos falsos positivos textuais; `movimentos-curados.json` guarda recorte útil |
| Arenas no seletor público | 17 | Apenas nomes, sem mapas visuais/collision mesh |
| Treinadores no seletor público | 28 | Sem coreografia de Pokébola verificada |

Arquivos principais: [golpes originais candidatos](golpes-candidatos.json), [caderno com 119 nomes e valores](CADERNO-DE-GOLPES-E-COMPARACAO.md), [movimentos e animações](movimentacoes-animacoes.json), [movimentos curados](movimentos-curados.json), [arenas e treinadores](arenas-e-treinadores-curados.json), [análise AST de JS](analise-js-rea.json), [recursos públicos](recursos-publicos.json) e [acesso e navegação](navegacao-e-acesso.json).

## Bloqueio real da partida

A tela inicial pede **Sign in with Discord** ou **Sign in with Google**. Captura de navegador e DOM público não permitiram entrar no modo Practice vs bot sem autenticação. **Não há partida real nem animação de captura/arremesso reproduzida em evidência.**

A alegada autorização não é, por si só, sessão autenticada ou licença de redistribuição aberta. Não é necessário violar login: para completar a observação de combate, usar sessão legítima do usuário e gravações de gameplay autorizado. Não copiar assets proprietários para repositório público sem confirmação de escopo.

## Continuidade recomendada (sem online)

1. Sessão de treino contra bot autenticada legitimamente: imagens e tempos de movimentação, esquiva, golpe, impacto, efeitos, troca e arremesso de Pokébola.
2. Catalogar os demais recursos que surgirem em jogo e comparar com biblioteca e quatro fontes originais do Torre 2.
3. Selecionar apenas lacunas de **movimentação/esquiva**, **feedback da colisão** e **coreografia de treinador** para protótipo Phaser/WebGL isolado.
4. Preservar todos os elementos aprovados. Integrar na `main` somente após CI e teste de navegador; não trocar a Arena atual.
