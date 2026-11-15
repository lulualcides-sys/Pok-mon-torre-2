# Torre 2 — Performance 1.0 (15/11/2026)

## Escopo implantado no commit 772bfbd
- Fonte auditada do cliente Alpha 0.71.3 arquivada em `torre2-audited-source-alpha0713-20261115` no GitHub Releases, com SHA-256 independente, execução e commit de origem registrados.
- Recuperação: `bash tools/pokearena/restore-audited-alpha0713.sh site _site`; também aceita `source` e `provenance`. O padrão usa o artefato ainda válido e muda para o Release quando ele vence; `TORRE2_FORCE_RELEASE=1` força o arquivo persistente para auditoria.
- Pokédex nativa 0.71.3: mantém as 145 entradas lógicas do ROSTER e seus índices de salvamento, mas só aloca 25 cartões Phaser na página atual, destruindo os cartões da página anterior.
- Carregamento móvel: animações Idle da geração Johto não são mais carregadas integralmente ao abrir a Pokédex. Os carregadores nativos `torre2CargarPagina` e `torre2EnsureIdle` continuam carregando sprites conforme seleção.
- Diagnóstico opt-in: abrir `/arena2d/?torre2-perf=1` para medir cadência rAF, quadros lentos, tarefas longas, requisições, bytes e heap JS (quando suportado); resultados em `window.__torre2Perf.snapshot()`. Ao jogar normalmente, o diagnóstico permanece desligado.

## Evidência de teste e limitações

O navegador automatizado do GitHub Actions usou Chromium com renderização de software SwiftShader. Na verificação de 15/11/2026, o teste percorreu a Pokédex em desktop e celular: 145 entradas lógicas, 25 cartões ativos na página 1 e na página 2, e navegação funcional. As medições registradas foram 16,2 FPS rAF (desktop emulado) e 25 FPS rAF (mobile emulado) durante a amostra, com 71–82 MB de heap JS. **Esses números não representam o FPS esperado de celulares reais** e não permitem afirmar melhoria percentual sem medir uma versão-base equivalente.

O projeto ainda precisa de benchmarks antes/depois em aparelhos reais e testes de batalha longa para avaliar a estabilidade de memória. As otimizações não alteram a Arena, League, biblioteca de golpes ou efeitos aprovados.

## Validação e reversão

- Unitários: `node --test tests/torre2-pokedex-window.test.js tests/torre2-performance-monitor.test.js`
- Browser real: `node tests/alpha0713-performance-browser.cjs` após o build oficial.
- Gate completo: `.github/workflows/torre2-alpha0713-hotfix-publish.yml`.
- Fonte persistente: `.github/workflows/torre2-audited-source-archive.yml`.
- O publicador conserva o módulo nativo anterior no diretório SHA original. Para reversão da melhoria, restaurar o commit anterior homologado e republicar o artefato validado; não eliminar o diretório original.
