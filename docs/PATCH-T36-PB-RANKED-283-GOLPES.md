# Patch T36 — grande lote de pesquisa dos 283 golpes

Data: 31/10/2026. Status: branch isolada, leitura e auditoria, sem alterações na versão publicada.

## Entregas
- 283 nomes de golpes e famílias de efeito inferidas de metadados públicos.
- 245 nomes do elenco, 38 encontrados apenas no AST.
- 70 nomes com uso relatado contra bot, dos quais 10 vêm de relatório agregado pouco confiável; 0 sequências completas de VFX.
- 93 nomes coincidem com o catálogo de fonte Poké Arena 2D, que contém 165 nomes; os 190 restantes não são necessariamente ausentes do motor Phaser.
- Pelo menos 45 nomes protegidos pela política de aprovação e baseline.
- Ferramenta de auditoria executável offline e relatórios filtráveis. Nenhum efeito ou sprite original modificado.

## Comandos de uso
Na raiz do repositório:

    node tools/dev/pb-ranked-audit.mjs --format=summary
    node tools/dev/pb-ranked-audit.mjs --format=json --out=artifacts/pb-ranked-audit.json
    node tools/dev/pb-ranked-audit.mjs --format=md --out=artifacts/pb-ranked-audit.md
    node tools/dev/pb-ranked-audit.mjs --format=html --out=artifacts/pb-ranked-audit.html

Testes direcionados:

    node --test tests/pb-ranked-audit.test.mjs tests/pb-ranked-report-page.test.mjs

O workflow de validação da branch executa testes, npm run check, npm run check:reuse e fornece artefatos JSON, Markdown e HTML para revisão.

## Evidências e limites
- static-only: metadados; não comprova disponibilidade na arena.
- aggregate-low-confidence: relato agregado do agente; não comprova comando individual.
- agent-reported: uso relatado contra bot; não fornece quadros de animação completos.
- protected: aprovação/baseline anterior; nunca reescrever sem autorização.
- nativeSourceMoveIdCurrent: match nominal no catálogo P2; não prova existência ou ausência de VFX no runtime Torre 2.

## Segurança
Nenhum dado privado, credencial, arte ou source de terceiro é importado. A ferramenta não realiza chamadas de rede, não usa créditos TinyFish e não edita Phaser, saves, campanha, captura, cooldowns ou HUD.

Próximo patch de implementação real exigirá verificação de quatro fontes, licenças, efeito original em Phaser/WebGL, colisão, miss, FPS mobile, regressão e aceite visual.
