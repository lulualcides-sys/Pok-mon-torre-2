# Pokémon Torre 2 — Roteiro de desenvolvimento

## V0.1 — motor isolado (implementado e testado)

- Arena real em WebGL/PixiJS, arte original provisória em pixel art.
- Laboratório Kanto: Charizard nível 50 versus Geodude e Onix no Ginásio de Pewter.
- Quatro ataques: Ember, Flamethrower (fluxo contínuo), Fire Spin e Fire Blast (grafia 大).
- Movimentação teclado/toque, esquiva, auto/mira por mouse, IA de perseguição, barras de PV/energia, cooldown.
- Impacto sincronizado com o projétil e multiplicador de tipo Rocha × Fogo.
- Testes unitários e em Chromium para todos os quatro ataques, interface mobile e WebGL.
- Insígnia Rocha após o confronto com Brock.
- Repositório separado; Pokémon Torre original preservado.

**Evidência:** [execução de CI](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/39436666887) com screenshots desktop/móvel.

## V0.2 — camada artística

- Substituir as texturas provisórias geradas pelo WebGL por spritesheets de pixel art **original**, com 8/12/16 quadros e fontes editáveis em LibreSprite.
- Recriar o acabamento de ataques usando os 420 vídeos de estudo do Poké Arena 2D sem importar arquivos de terceiros.
- Prioridade: Flamethrower contínuo, Fire Blast 大, impactos de contato, Water Gun, Bubble Beam, Razor Leaf e Vine Whip.
- Construir variantes de impacto, sombra, profundidade, silhuetas com contornos escuros e densidade limitada de partículas.
- Acompanhar desempenho real em Android e limitar geração dinâmica de texturas.

## V0.3 — campanha Kanto (contrato de comportamento obrigatório)

**[Regras aprovadas pelo criador: manter a campanha do Pokémon Torre 1; referências do Poké Arena 2D apenas para combate, arte e animações](./CONTRATO_CAMPANHA.md).**

**Evolução FireRed:** adquirir EXP/subir de nível em combate, mas só iniciar evolução **após o combate**, nunca no meio da luta. Respeitar evolução por nível específico de cada espécie; pedras e trocas não viram evolução por nível. Aprender golpes adequados ao nível e espécie.


- Primeira campanha com 13 treinadores antes de Brock; número cresce conforme o ginásio.
- Oito líderes, cenários específicos por ginásio e final da Elite Four.
- Capturas, troca de Pokémon, cura, progressão, evolução por nível e registro de insígnias.
- Mewtwo nível 50 separado como personagem de laboratório.
- Golpes em inglês e movesets específicos para cada evolução.

## V0.4 — robustez

- IA de adversários com troca de Pokémon e escolhas táticas.
- Duplas opcionais e sincronização de dano, animação, colisão, esquiva e recarga.
- Save local versionado e ferramenta de migração.
- Fluxo de prévia/aprovação por lotes de quatro, preservando os efeitos aceitos.
- Teste de 60 FPS com métrica de frame-time e suíte de regressão.

## Código e direitos

O jogo é um projeto de fã não oficial. Os personagens Pokémon e suas marcas pertencem a seus titulares.
Os 420 vídeos do Poké Arena 2D foram capturados para estudo de ritmo, comportamento,
dimensões e composição; **não** são uma licença para copiar ou redistribuir spritesheets,
código ou sons. Os efeitos e cenários usados aqui devem ser autorais ou licenciados.

## Deploy

Site estático compatível com GitHub Pages. Após a configuração única em
**Settings → Pages → Build and deployment → Source: GitHub Actions**, o workflow
`pages.yml` é capaz de publicar novas versões, desde que o workflow de testes termine com sucesso.
Até Pages ser habilitado, o próprio workflow preserva um artefato com o build do jogo.
