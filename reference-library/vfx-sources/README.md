# Biblioteca de fontes de VFX — Pokémon Torre 2

**Índice de pesquisa, não código de produção.** Todos os 10 projetos pesquisados estão cadastrados em `catalog.json`. Quatro contêm amostras de código/receitas locais e suas licenças; os demais são fichas de referência com URL, condição de licença e download pendente/bloqueado.

## Comando de pesquisa

```bash
node tools/dev/vfx-source-search.mjs "Fire Blast"
node tools/dev/vfx-source-search.mjs "Ice Beam" --json
node tools/dev/vfx-source-search.mjs --all
node --test tests/vfx-source-library.test.js
```

## Checklist obrigatório antes de criar/refazer um golpe

1. **Preserve a regra das quatro fontes originais** em `docs/agentes/POLITICA-GOLPES-INTEGRAL.md`: T2 aprovado, Poké Arena 2D, Zarza, Emerald Arena. Este novo acervo é *complementar*, não uma dispensa nem comprovação automática dessas quatro fontes.
2. Consultar `catalog.json` e rodar a busca por nome canônico, tipo, categoria e semântica (trajetória, explosão, contato, status, clima).
3. Ler os caminhos em `localSamples` do candidato e comparar com os demais. **Amostra presente não significa lib completa**; consultar a origem pinada para dependências. Para `download-required`, baixar pelo site oficial, conferir ZIP/licença e registrar hash e autoria antes de integrar. Para `blocked-*`, não copiar nem executar material.
4. Comprovar a origem, caminho, função, licença e diferença entre *estudado*, *referência visual* e *reutilizado no código*. Respeitar `data/move-reuse-policy.json` e a ficha de quatro fontes.
5. Escolher o efeito pela **silhueta e semântica**, não só pela cor: disparo, rastros, hitbox, telegraph, impacto e dissipação; evitar 15 bolas genéricas recoloridas.
6. Converter para sprite sheet *offline* (nearest-neighbor) ou portar efeitos permitidos para **Phaser/WebGL**; nada de Canvas 2D/CSS como ataque. Medir FPS e memória mobile, colisão real, acerto/erro, dano/status oficiais, tamanho e visibilidade.
7. **Não alterar efeitos aprovados**, incluindo Powder Snow, Whirlpool e Zap Cannon de Johto, Surf (VFX), Flash Cannon, Steel Beam, Mirror Shot ou outros já homologados. Não desbloquear golpes na campanha só por existirem artes.
8. Fazer testes focados, regressão, build e Chromium; registrar screenshots de batalhas e submeter para revisão antes da publicação.

## Disponibilidade real

| Fonte | Estado | Licença |
|---|---|---|
| [PixelFX](pixelfx/README.md) | selected-samples-local | MIT |
| [Sprite Fusion Pixel Art VFX](sprite-fusion/README.md) | links-only | MIT (declaração do autor) |
| [Pixelbolt](pixelbolt/README.md) | selected-samples-local | MIT |
| [Pixel Ability FX Generator](pixel-ability-fx/README.md) | selected-samples-local | Apache-2.0 |
| [Spellbook GD](spellbook-gd/README.md) | selected-samples-local | MIT |
| [Foozle Pixel Magic Effects](foozle-pixel-magic/README.md) | download-required | CC0-1.0 |
| [CodeManu Free Pixel Effects Pack](codemanu-free-pixel-effects/README.md) | blocked-license-review | inconsistente: texto domínio público; metadados CC-BY-4.0 |
| [DevWizard Pixel Art Spells](devwizard-pixel-art-spells/README.md) | download-required | CC0-1.0 |
| [cs5475 Free Pixel Effects](cs5475-free-pixel-effects/README.md) | download-required | CC0-1.0 |
| [PixelDust](pixeldust/README.md) | blocked-no-license | não identificada |

**Atenção:** os packs Foozle, DevWizard e cs5475 são CC0, porém seus ZIPs ainda não foram importados. CodeManu tem licença conflitante; PixelDust não apresenta licença. Sprite Fusion foi indexada por URL; seu código não está copiado. O projeto inteiro do PixelFX/Pixelbolt/Gerador não está vendido aqui, apenas amostras selecionadas.
