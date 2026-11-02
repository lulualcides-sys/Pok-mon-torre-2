# Pokémon Zarza — Varredura ampliada confirmada

Data: 21/10/2026

Fontes públicas:
- https://pokemonzarza.com/poke-arena.html?lang=en&city=encinacorba&mode=exhibition&entry=welcome
- https://pokemonzarza.com/poke-arena-lab.html
- https://pokemonzarza.com/poke-arena-effects.html
- https://pokemonzarza.com/galeria/index.html
- https://pokemonzarza.com/ranking.html
- Mais páginas públicas interligadas a partir do próprio site

Auditoria executada e comprovada: https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/39580271200

## Resultados verificados em navegador

- **16 páginas públicas** percorridas, todas com resposta HTTP 200 no teste. Cobertura de páginas acessíveis ligadas por links nesta sessão, **não** cobertura matemática de todos os endpoints do domínio.
- **175 módulos JavaScript distintos** carregados entre as páginas.
- **17 nomes de golpes** identificados em textos dos scripts. Isso indica presença de referências, não garante execução ou desbloqueio do golpe.
- Arena principal: **90 scripts** e **157 requisições de imagens** em uma sessão inicial.
- Laboratório: **55 scripts** e **75 requisições de imagens** em uma sessão inicial.
- **CanvasRenderingContext2D confirmado** nas duas interfaces: os próprios elementos canvas solicitam `getContext('2d')`. Phaser, Pixi e Three não foram detectados como bibliotecas globais na sessão. O renderizador é, pelo menos em parte, procedural sobre Canvas 2D.
- Sem login, sem quebra de bloqueios, sem modificar dados remotos. Capturas, metadados e inventário por módulos foram arquivados em um artefato temporário do GitHub Actions.

## Estruturas encontradas e melhores usos no Torre 2

| Arquivo do Zarza | Técnica observada | Adaptação preferida mantendo o visual Poké Arena 2D |
|---|---|---|
| `poke-arena-beams.js` | Contato e progressão do feixe; ações `beamContact`, `stepArenaBeams` | Feixes do motor original `Chorro` com colisão e canalização |
| `poke-arena-vfx.js` | Fases `paintArenaCharge`, `paintArenaShot`, `paintArenaEffect`, `pixelCloud`, `impactBloom` | Trilha e impacto no Phaser Graphics e WebGL; sem efeitos cartonizados |
| `poke-arena-vfx-data.js` | Parâmetros visuais por golpe `arenaAttackVfx` | Configuração de paleta, forma, duração e física separada do motor |
| `poke-arena-atlases.js` | Catálogo, pré-carregamento e desenho de atlases | Cache de spritesheets pixelados e carregamento antecipado |
| `poke-arena-move-art-data.js` | Dados por golpes incluindo fogo, gelo, água e terra | Seleção automática/manual do melhor modelo para cada família |
| `poke-arena-lighting.js` | Sombras de Pokémon e luz durante golpes | Luz contextual econômica em WebGL, sem cobrir golpes/aprovados |
| `poke-arena-surface-reactions.js` | Marcas/poeira/reações no cenário | Impacto sincronizado no chão da arena |
| `poke-arena-animation.js` | Animação/pose e ponto de emissão no lutador | Origem do ataque acompanha movimento do Pokémon |

## Regra definida pelo usuário: modelo sempre Arena 2D

**Nunca mudar a identidade gráfica do Pokémon Torre 2.** Para qualquer golpe novo:
1. Consultar a mecânica original do golpe e as referências visuais.
2. Conferir modelos nativos do **Poké Arena 2D** e escolher o que mais se aproxima.
3. Conferir no catálogo **Pokémon Zarza** técnicas complementares (fluxo, partículas, forma, impacto, atlas, iluminação).
4. Adotar as técnicas úteis no motor **Phaser 3/WebGL** do Torre 2; **não** incorporar Canvas 2D.
5. Testar física, contato, esquiva, chance de status, performance 60 FPS, fluxo animado e screenshots da batalha.
6. Publicar somente após teste e solicitar avaliação visual; manter golpe aprovado intocado.

### Modelos-base por golpe

- **Ice Beam V6:** já aprovado, `Chorro` compartilhado por Hyper Beam / Aura Storm, com cor e partículas de gelo. **Não alterar.**
- **Confuse Ray, Rock Blast, Soft-Boiled:** já aprovados. **Não alterar.**
- Próximos feixes: preferir o próprio motor `Chorro`.
- Próximos orbes / disparos múltiplos: preferir efeitos nativos do Poké Arena 2D, enriquecidos com trilhas/impactos/colisão inspirados no Zarza.
- Próximas ações de área: adaptar somente reações ao solo e dispersões que respeitem proporção e timing da arena.
- Próximas ações de status: manter indicação visual ligada ao alvo e condicionada a acerto real.

## Relatórios e evidências

- Workflow e script: `.github/workflows/zarza-public-rea.yml`, `tools/research/zarza-public-rea.cjs`.
- Artefato de auditoria: `zarza-rea-observacoes-publicas` no run 39580271200. Inclui `report.json`, `report.md`, `move-module-map.json` e capturas de páginas públicas.
- Aprovações e regra de escolha de modelos: `docs/PADRAO-DE-GOLPES-TORRE2-MODELOS.md`.
- A REA registra funções, nomes, caminho de recursos e capturas. **Não foi extraído um pacote integral de todos os sprites/golpes** nem registrada reprodução de todas as animações quadro a quadro. Quando se pedir um golpe específico, estudar sua sequência no Zarza e compará-la ao motor nativo Arena 2D antes da implementação.

**Observação sobre autorização:** a autorização de estudo informada pelo usuário é considerada no planejamento, mas qualquer publicação de código/arte original de terceiros em um repositório público deve respeitar o escopo da licença/permissão.
