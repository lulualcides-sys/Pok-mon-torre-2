# Sincronização de novidades — Poké Arena 2D (29/10/2026)

## Fonte correta

Jogo de referência: https://www.pokearena2d.com/ (**não** confundir com Empress ou poke2darena.com).
A fonte mais recente **efetivamente inspecionada nesta auditoria** foi o espelho técnico isolado `pokearena2d-cliente-phaser`, capturado em 29/10/2026 às 18:39 UTC:
- Cliente: `src-32e8c9ae9b`; módulos: `src-f5c065d971`.
- Registro de captura: [capture-provenance.json](https://github.com/lulualcides-sys/Pok-mon-torre-2/blob/pokearena2d-cliente-phaser/capture-provenance.json).
- Registro **estruturado**: [data/pokearena-upstream-discoveries.json](../data/pokearena-upstream-discoveries.json).
- Auditoria histórica, não atualizado automaticamente: [160 golpes em 20/10/2026](AUDITORIA-160-GOLPES-POKEARENA2D.md).

## Primeira observação: Deoxys

**Confirmado no código de origem capturado:** Deoxys #386, formas Normal, Attack, Defense e Speed.

**Técnicas declaradas em seus kits:** Superpower, Shadow Ball, Psyshock, Cosmic Power, Zen Headbutt, Recover, Psycho Cut, Agility, Confusion, Psychic, Teleport, Form Change e Psycho Boost.

**Limitações importantes:** (a) a presença de cada técnica não prova que foi adicionada na atualização mais recente; (b) a captura não comprova que esses golpes estão liberados/funcionando no Pokémon Torre 2; (c) **Form Change** é uma mecânica de troca de forma, não um TM; (d) **Psycho Boost** é característico de Deoxys e não deve ser dado indiscriminadamente a espécies de Kanto; (e) Deoxys não integra automaticamente os 151 da campanha.

## Regra permanente de catalogação e integração

1. **Detectar versão nova** usando o site original e o manifesto público, confrontando `version.json` e `capture-provenance.json`. Não chamar uma captura antiga de atualização.
2. **Auditar nomes de todos os golpes** com `tools/pokearena/audit-moves.mjs` no workflow `.github/workflows/pokearena-source-snapshot.yml` e comparar com o relatório anterior. Normalizar nomes PT/EN; uma técnica = um registro, mesmo que vários Pokémon a utilizem.
3. **Salvar a mudança** em `data/pokearena-upstream-discoveries.json`: versão/fonte, nome canônico, tipo, forma/efeito, Pokémon/forma de origem, status e evidências. Distinguir golpe novo de golpe antigo cujo VFX mudou.
4. **Distribuir apenas com learnset validado** por Pokémon, geração, nível e TM conforme regras da campanha Kanto. Um golpe de outro jogo não é automaticamente aprendível por todos do mesmo tipo. Manter 3 ataques fracos iniciais no Lv5; ULT temática no Lv8; progressão equilibrada 9–50; ULT poderosa não repetida nos slots de ataque comuns. Compatibilidade de Arena e campanha são verificadas separadamente.
5. **Reaproveitar antes de criar:** consultar os efeitos já aprovados, Poké Arena, Zarza e Emerald Arena, com caminhos, atribuição e licença. Seguir `AGENTS.md` e `docs/agentes/POLITICA-GOLPES-INTEGRAL.md`. Recursos protegidos ou de licença desconhecida ficam como referência, nunca como redistribuição presumidamente autorizada.
6. **Validar antes de publicar:** testes de colisão/contato, slots de golpes, salvamento, regressões mobile/desktop, CI e link final do GitHub Pages. Jamais modificar VFX, slots ou saves aprovados apenas para sincronizar.
7. **Estados são distintos:** `observado na referência` → `compatibilidade comprovada` → `catalogado` → `integrado` → `testado` → `publicado`. Um JSON de referência **não** é um VFX instalado.

## Operação recorrente

A rotina de desenvolvimento de Pokémon Torre 2 deve consultar a fonte **uma vez por dia**, comparar os hashes/versões, atualizar o inventário em branch isolada e integrar em lotes somente quando os critérios acima estiverem satisfeitos. Sem diferenças verificáveis, não recriar arquivos nem repetir auditorias de recursos. Prioridade de estabilização T07/T08 e patches já em andamento é preservada.

**Estado deste patch:** somente catalogação de referência e instrução de sincronização. Nenhuma mudança executável, nenhum golpe redistribuído, nenhum teste de jogo/Pages atribuído a este patch.
