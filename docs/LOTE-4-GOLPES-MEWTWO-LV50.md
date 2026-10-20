# Pokémon Torre 2 — lote visual Phaser: quatro golpes exclusivos e Mewtwo 50

Atualizado em 20/10/2026. Jogo-alvo: **pokearena2d.com**; repositório: Pokémon Torre 2.

## Inventário verificado

O cliente original já contém os golpes **Egg Bomb**, **High Jump Kick**, **Volt Tackle** e **Psystrike** na respectiva implementação de criaturas/evoluções. Não serão redesenhados só por passarem para um Pokémon de Kanto: aproveitar a implementação do cliente original e aplicar o learnset de cada espécie.

## Quatro efeitos novos criados no Phaser 3/WebGL

| Golpe | Animação nova | Dano/efeito |
| --- | --- | --- |
| Bonemerang | Osso pixelado contornado girando na ida e retornando | Um contato por passagem; pode atingir duas vezes |
| Bone Club | Bastão ósseo com rotação curta próximo do corpo | Contato físico, recuo e pequeno atordoamento |
| Tri Attack | Fogo, gelo e raio com três silhuetas distintas projetados juntos | Dano no contato, brilho e faíscas no impacto |
| Pay Day | Cinco moedas douradas animadas, com brilhos e rotações | Contatos de moeda com impacto independente |

**Origem da arte:** novas rotinas originais em `tools/pokearena/torre2-signature-fx.js`, WebGL por meio do Phaser Graphics. **Nenhum efeito do Pokémon Torre 1** foi importado. VFX de impacto e partícula usam a infraestrutura Phaser do próprio Poké Arena. Esta é a **primeira versão para avaliação visual do usuário**, não uma declaração de identidade perfeita com todos os efeitos originais.

**Quem pode usar agora:** o Mewtwo de teste dentro da campanha tem os quatro golpes inicialmente equipados. Cubone, Marowak, Meowth, Persian e Porygon ganharão os respectivos golpes quando os sprites e os conjuntos completos deles estiverem integrados; não anunciar essas espécies como jogáveis antes de testá-las.

## Mewtwo nível 50

- Entra na equipe ao criar nova campanha; migração dos antigos saves sem perda dos demais membros — se a equipe estiver cheia, o último Pokémon vai para o PC.
- Banco de **137 movimentos selecionáveis no total, incluindo os quatro novos**, sem exigência de nível **apenas para esse Mewtwo de teste**. Nem todos os 137 foram testados individualmente com o corpo do Mewtwo; alguns podem exigir adaptações por espécie.
- Tela de **Sumário** clicando no Pokémon; mostra retrato PMD, HP, ATK, DEF, SPD, nível, tipos e um banco de movimentos com páginas.
- Seleção de quatro movimentos equipados em LMB, RMB, Q e E/ULT. O quinto comando de esquiva/defesa continua o original do Pokémon. O movimento no slot E continua consumindo a barra de Ultimate segundo as regras originais; estar desbloqueado não elimina o custo da habilidade.
- Trocas de golpes e equipe persistem no salvamento local e são aplicadas na cena Phaser original de combate. A evolução permanece apenas após a batalha e por nível no modo Kanto; outros modos continuam com evolução livre/dinâmica.

## Verificação

- Abrir Play → Kanto Campaign → escolher starter → selecionar Mewtwo → clicar e abrir Sumário → escolher slot e golpe → usar na batalha contra Onix.
- Capturas automatizadas do Sumário e dos quatro golpes durante a batalha e prova de execução real por `usarHabilidad` em `tests/source-client-smoke.cjs`.
- Teste do banco de golpes e persistência em `tests/solo-kanto-built.test.mjs`.
- GitHub Actions: `pokearena-source-snapshot.yml` publica uma versão imutável em `pokearena2d-cliente-phaser` quando a cópia passa pelos testes de navegação e pelo teste em Android horizontal.
- Tamanho proporcional do Bone Club reduzido após revisão das primeiras capturas; ataques especiais Fire/Ice/Electric do Tri Attack receberam silhuetas separadas.

**Pendências reais:** homologação visual pelo usuário; seleção e compatibilização final dos golpes originais que exigem mecânicas particulares; adição de Cubone, Marowak, Meowth, Persian e Porygon com seus sprites completos de combate; eventualmente aperfeiçoamento dos frames de arte dos quatro novos golpes.

