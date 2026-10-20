# Pokémon Torre 2 — Kanto Battle Engine

Novo jogo independente do Pokémon Torre original.

**Primeiro marco:** batalha jogável no Ginásio de Pewter (Brock), controles mobile/PC, combate 2D em PixiJS/WebGL, quadro de quatro golpes de fogo e testes automatizados.

## Filosofia
- Referências visuais: [capturas reais de Poké Arena 2D — 420 vídeos](https://github.com/lulualcides-sys/Pok-mon-torre/blob/rea-pokearena-all-visible-moves/docs/rea-pokearena/registro-real/evolucoes/INDEX.md), **somente para estudo**.
- Sem copiar spritesheets, código, sons ou outros arquivos do jogo de referência.
- Renderização dos efeitos com WebGL/PixiJS. Não usar Canvas 2D para desenhar golpes; golpes isolados e dano sincronizado.
- Alterações e testes **neste repositório**, não no [Pokémon Torre original](https://github.com/lulualcides-sys/Pok-mon-torre).
- Projeto independente de fã, não oficial. Pokémon e nomes associados pertencem aos respectivos titulares.

## Controles
PC: WASD ou setas para andar; 1–4 para golpes; Espaço para esquiva; mouse para direcionar a mira.
Celular: controles direcionais virtuais e botões de golpes.

## Testes
`npm test` — regras do combate e progressão.
`npm run check` — sintaxe dos módulos.
O GitHub Actions também executa teste real de Chromium com verificação WebGL.

## Estado
Protótipo inicial em desenvolvimento. A primeira batalha é um *vertical slice*, não toda a campanha de Kanto. Nenhum golpe do jogo original é substituído.

## Publicação
GitHub Actions gera e testa o projeto. A publicação no GitHub Pages depende da configuração de Pages deste novo repositório.
