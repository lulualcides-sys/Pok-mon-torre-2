# Diretriz PixelFX — Johto (04/11/2026)

## Decisão explícita atual

- **Novos VFX** de golpes, a partir deste lote, são criados com a biblioteca MIT [PixelFX](https://github.com/patch-gg/pixelfx) (commit `a84159688af3ca37a4be05a0d422b94451b2e24e`, v0.3.0).
- **Exceção mandatória:** **Powder Snow / Snow, Whirlpool e Zap Cannon** permanecem com os efeitos existentes, já aprovados pelo usuário. Não reexportar, redesenhar ou substituir as suas animações.
- Dos 18 golpes do laboratório do Mewtwo, os **15 demais** usam sprite sheets geradas pelo PixelFX. Seus hit windows existentes permanecem enquanto aguardam validação completa dos movimentos.
- Os **28 restantes** da auditoria dos 46 ausentes de Johto recebem **prévia apenas visual**, sem dano/status falsos, sem desbloqueio em Kanto e sem uso por Arena padrão.
- O laboratório reúne **46 seleções** para inspeção: 3 aprovados, 15 refeitos, 28 prévias. Isso **não significa** 86 movimentos de Gen II completos ou jogáveis.
- Continuar verificando originalidade, golpes nativos e licenças das fontes históricas para **mecânica e deduplicação**, sem reutilizar seus recursos visuais para *novos* VFX deste lote. A decisão de PixelFX substitui apenas a escolha do **gerador visual** para novos VFX de Johto; não relaxa a preservação de outros aprovados, os limites por modo ou a revisão humana.

## Regras de implementação

1. Gerar quadros offline via `tools/pokearena/torre2-pixelfx-sheets.mjs` e `pixelfx` MIT fixado em `package.json`.
2. No Phaser, usar spritesheets transparentes com nearest-neighbor; sem simulação PixelFX, Canvas, CSS ou serviços externos no combate.
3. Manter efeitos do laboratório isolados; os 28 visuais novos nunca aplicam dano/status enquanto não houver mecânica oficial validada.
4. Antes do merge: executar testes unitários, geração real de 43 PNGs, testes do Mewtwo no Chromium, guardião visual e revisão estética. Conferir limites mobile e preservação dos três efeitos aprovados.
5. Aprovação artística do usuário é distinta de CI verde. Publicar no original apenas depois de testes e gates. Registrar explícito se o Pages estiver pendente.

## Arquivos

- `tools/pokearena/torre2-johto-pixelfx-catalog.js`: mapeamento 43/3.
- `tools/pokearena/torre2-pixelfx-sheets.mjs`: geração de PNGs com PixelFX original.
- `tools/pokearena/torre2-johto-pixelfx-runtime.js`: 28 casts apenas visuais.
- `tools/pokearena/torre2-johto-lab-runtime.js`: 15 casts com VFX PixelFX e 3 originais preservados.
- `tools/pokearena/torre2-johto-lab-scene.js`: seleção paginada.
- `tests/johto-pixelfx.test.js`, `tests/johto-pixelfx-built.test.mjs`: validação.

## Licença e atribuição

PixelFX © patch-gg, licenciado sob MIT. Consultar `LICENSE` e `NOTICE.md` no repositório upstream para atribuições transitivas; não inferir que sprites ou recursos de terceiros não incluídos no PixelFX também sejam MIT. Não copiar os efeitos aprovados do cliente base para exportá-los como PixelFX.


## Correção de cooldown do Mewtwo Test Lab

- Os **46 golpes** agora usam `cd:1` segundo, exclusivo do laboratório Johto.
- Corrigido reset indevido a cada quadro em `torre2-johto-lab-combat.js`; energia/ULT de teste continuam ilimitadas.
- O novo `torre2-johto-lab-cooldown.js` controla a pausa global de 1s entre os quatro botões e impede sobreposição de VFX ativos que durem mais de 1s. Nenhuma animação aprovada é editada.
- Testes específicos e Chromium verificam repetição, troca de tecla, 0,99s, 1,01s e persistência de animação; campanha/Arena continuam fora do escopo.
