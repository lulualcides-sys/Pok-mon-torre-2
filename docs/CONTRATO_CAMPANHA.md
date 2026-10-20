# Pokémon Torre 2 — contrato de campanha e batalha

## Regra-mãe: Pokémon Torre 1 é a referência de jogabilidade

**Pokémon Torre 2 não é um remake da campanha do Poké Arena 2D.**
É uma nova implementação do **Pokémon Torre 1**, preservando sua estrutura de jogo, usando o Poké Arena 2D como referência de **apresentação e sensação das batalhas**. Nunca alterar o repositório do Torre 1 para validar mudanças do Torre 2.

### Campanha / progressão (mesma proposta do Torre 1)

- Campanha de Kanto com os oito líderes na ordem canônica, treinadores antes de cada ginásio e Elite Four.
- Primeiro ginásio com 13 treinadores; os ginásios seguintes aumentam a quantidade (balanceamento independente por ginásio).
- Equipe do jogador, capturas, troca de Pokémon, HP, estados, evolução, golpes aprendidos e dificuldade crescente. Ginásios/arenas variam conforme região e líder.
- Shiny e mecânicas previamente aprovadas no Torre 1 devem ser migradas conscientemente, não inventadas ou omitidas.
- Mewtwo no nível 50 com todos os golpes de teste é **somente** personagem do laboratório e não um atalho da campanha.
- O confronto com dois Pokémon do Brock e o Charizard de nível 50 da V0.8 são **apenas uma demonstração técnica**, não representam o fluxo completo do primeiro ginásio.

### Experiência e evolução: regra FireRed

1. A equipe ganha EXP por batalhas conforme as regras de distribuição que forem implementadas e verificadas; o jogador sobe de nível ao atingir os limiares de EXP da espécie.
2. A tela pode indicar EXP e níveis adquiridos durante a luta, **mas nenhuma evolução gráfica ou mudança de espécie ocorre enquanto o combate estiver ativo**.
3. Se o Pokémon cumprir a condição de evolução por nível, a evolução fica pendente e acontece **depois que a batalha termina**. Não evoluir entre golpes, não trocar sprite por evolução no combate e não reabrir a batalha no meio da animação.
4. Cada espécie deve obedecer ao nível exigido em **Pokémon FireRed/LeafGreen** (por exemplo, Charmander → Charmeleon no nível 16; Charmeleon → Charizard no nível 36; Bulbasaur → Ivysaur 16; Ivysaur → Venusaur 32; Squirtle → Wartortle 16; Wartortle → Blastoise 36).
5. Evolução por pedra, troca ou outra condição **não** é substituída arbitrariamente por nível: implementar o mecanismo correto quando estiver disponível, sem criar nível falso.
6. Após evoluir, atualizar nome, sprites, atributos, tipos aplicáveis e banco de golpes da espécie evoluída; preservar identidade, EXP/nível e histórico individual.
7. Golpes devem ser aprendidos conforme nível, espécie e evolução, respeitando o funcionamento original; o jogador decide quais manter quando houver limite de golpes.
8. Salvar estado da evolução/nível na campanha; impedir duplicações e evoluções repetidas em reinícios/carregamentos.

**Regra obrigatória de regressão:** durante `status === 'fighting'`, a espécie e os sprites evolutivos do Pokémon nunca mudam. Evoluções ficam enfileiradas para o encerramento da batalha.

### Referência visual e controles: Poké Arena 2D

- Composição da arena, sensação de profundidade 2D/2.5D em pixel art, perspectiva, escala, movimentos, direções, leitura visual dos golpes, qualidade de impactos e interface de luta devem buscar alta fidelidade à referência.
- Preservar movimentos fluídos, ataques sincronizados com colisão e dano, controles para Android/PC, compatibilidade e FPS.
- Golpes em inglês, com animações próprias fiéis ao tipo de ataque, implementadas em PixiJS/WebGL (sem Canvas 2D para golpes).
- Usar capturas/vídeos para estudo e comparação; **não importar diretamente código, sprites, sons ou texturas protegidos** do jogo de referência sem licença/autorização.
- Não confundir fidelidade visual da batalha com substituição da progressão do Torre 1.

## Critérios de aceitação de uma versão de campanha

- Um Pokémon sobe de nível em combate e **não evolui até o encerramento da batalha**.
- Ao sair da batalha, a evolução pendente acontece na condição correta da espécie, e o estado salvo passa a conter a nova espécie.
- Pokémon sem condição de evolução não evolui; condições por pedra/troca não são acionadas apenas por EXP.
- Os golpes ensinados/ajustados após subir de nível respeitam o moveset individual.
- Nenhuma mudança estética faz desaparecer ginásios, treinadores, captura, equipe ou progressão.
- O jogo V0.8 pode continuar como laboratório isolado; campanha e evolução só são anunciadas como concluídas quando tiverem implementação e testes de ponta a ponta.
