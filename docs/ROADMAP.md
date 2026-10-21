# Pokémon Torre 2 — Roteiro de desenvolvimento

## REGRA MESTRE ATUAL — prioridade e isolamento (21/10/2026)

**Prioridade absoluta agora: TERMINAR OS GOLPES.** Não iniciar ainda a reorganização de movesets, slots ou esquiva. Essa etapa fica **adiada até o usuário pedir explicitamente** depois de concluído o trabalho dos golpes.

**Cliente Pokémon Arena 2D congelado:** o padrão original de movimentos, distribuição entre `LMB/ATK`, `RMB/SKL`, `Q`, `E/ULT` e `ESP/DASH`, as habilidades defensivas, estatísticas, arte, lógica, UI e comportamento **permanecem exatamente como estão**. Não aplicar reorganização global ao cliente, não remapear slots nativos, não refazer ou duplicar ataques da base que o usuário já aprovou.

**Escopo autorizado para personalizações futuras:** somente (1) **novos golpes que criarmos para Pokémon Torre 2**, mantendo estatísticas/mecânicas corretas e animações em pixel art com Clash e dissipação quando fizer sentido; e (2) **Pokémon novos que adicionarmos daqui para frente**, com seus próprios slots, movesets, esquiva/defesa e evolução. Quando chegar o momento, organizar e validar essas entidades **sem afetar os Pokémon e golpes do cliente original**. Mudanças por Pokémon ou movimento já aprovado exigem solicitação explícita.

**Referência para a etapa futura (não executar agora):**
- ATK / LMB: ataque frequente; SKL / RMB: especial 1; Q: especial 2; E: ultimate que usa a barra; ESP: esquiva ou defesa própria.
- Consultar o padrão do Pokémon Arena 2D como **referência**, sem sobrescrever ou reequilibrar seus kits.
- Para nossos novos golpes e espécies, definir slots permitidos, efeitos, cooldown, nível de desbloqueio, ultimate e movimento defensivo; testar controles mobile/PC, IA, progressão e preservação das versões aprovadas.
- **Mewtwo de testes** continua livre para testar novos movimentos enquanto finalizamos a biblioteca; não impor ainda restrição de slots.
- Não fazer alterações de código motivadas por esta seção sem novo pedido do usuário.

---
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
- Reconstruir a experiência completa do Poké Arena 2D usando inventário REA, 420 vídeos, classes de comportamento e quatro arenas observadas (sem redistribuir arquivos de terceiros não licenciados). [Plano REA de implementação](REA-IMPLEMENTACAO-INTEGRAL.md).
- Prioridade: Flamethrower contínuo, Fire Blast 大, impactos de contato, Water Gun, Bubble Beam, Razor Leaf e Vine Whip.
- Construir variantes de impacto, sombra, profundidade, silhuetas com contornos escuros e densidade limitada de partículas.
- Acompanhar desempenho real em Android e limitar geração dinâmica de texturas.

## V0.3 — campanha Kanto (contrato de comportamento obrigatório)

**[Regras aprovadas: campanha do Pokémon Torre 1 e reconstrução integral da experiência de batalha Poké Arena 2D](./CONTRATO_CAMPANHA.md).**

**Evolução EXCLUSIVAMENTE POR NÍVEL:** adquirir EXP/subir de nível em combate, mas só iniciar evolução **após o combate**, nunca no meio da luta. Mesmo espécies de pedra/troca/amizade recebem níveis definidos para evoluir; não há outros gatilhos. Aprender golpes adequados ao nível e espécie.


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
O usuário declarou autorização do responsável por **pokearena2d.com** para aproveitar seu código-fonte e recursos acessíveis no projeto pessoal não comercial. A captura de recursos do site será feita em artefato de integração, com proveniência e créditos, antes de integrar ao motor Phaser. Direitos sobre marcas/obras de outros titulares não são presumidos.

## Deploy

Site estático compatível com GitHub Pages. Após a configuração única em
**Settings → Pages → Build and deployment → Source: GitHub Actions**, o workflow
`pages.yml` é capaz de publicar novas versões, desde que o workflow de testes termine com sucesso.
Até Pages ser habilitado, o próprio workflow preserva um artefato com o build do jogo.

## Atualização de manutenção — 21/10/2026

**Correções técnicas aplicadas sem alterar o cliente original nem os golpes aprovados:**
- O cliente isolado fazia uma requisição para `assets/ui/balls20.png`, mas o arquivo não estava presente na captura pública; nenhum componente original verificado consumia a textura `ui-balls`. Removida somente essa tentativa de carregamento na build isolada, para evitar 404 e erro falso no teste público.
- O arquivo `escenas/carga.js` agora entra no hash dos módulos publicados. Alterações no pré-carregamento deixam de ser mascaradas pelo cache do Android/GitHub Pages.
- Testes de comportamento de **Gust, Poison Sting e Bite** inseridos no navegador: mira, desvio, defesa, única colisão, 30% de veneno/hesitação, imunidade a veneno, desenho real e liberação dos gráficos WebGL. Mantidas como **pendentes de aprovação visual**.

**Trabalho recomendado após avaliar esses três golpes:** confirmar se **Peck, Scratch e Sand Attack** continuam ausentes na captura mais recente antes de criá-los; priorizar Pidgey/Spearow, Weedle e Rattata para as primeiras rotas, aproveitando Tackle, Quick Attack e String Shot já nativos, sem refazê-los. Para novos Pokémon, verificar a presença de retrato, animações de batalha e evoluções no manifest PMD; adquirir novos recursos apenas se houver lacuna.

**Regra:** o Pokémon Arena 2D original (slots, esquiva, sprites, golpes, UI) permanece intocado. Não adicionar espécies ou modificar os golpes aprovados sem nova solicitação.
