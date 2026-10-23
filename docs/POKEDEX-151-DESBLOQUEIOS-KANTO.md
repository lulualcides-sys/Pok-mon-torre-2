# Pokémon Torre 2 — Pokédex, golpes por nível e regras de evolução

## 151 Pokémon e suas evoluções
A Pokédex nativa Poké Arena 2D agora oferece, além das abas de evolução, a ação **GOLPES POR LEVEL**. Ela mostra exclusivamente os golpes cujo renderizador já está instalado para a espécie selecionada. A lista é calculada pelo mesmo `availableMoves()` do combate, do nível 1 ao 100, sem importar golpes ou efeitos de outro projeto.

ATK = ataque básico (LMB); HAB 2 = habilidade secundária (RMB); HAB 3 = habilidade secundária (Q); ULT = golpe especial (E). A **ESQUIVA (ESP)** continua separada e não é um quinto ataque. Todos os movimentos e efeitos aprovados continuam intactos.

## Desbloqueios de campanha
- Golpes adquiridos por nível mostram **NV xx**. Os níveis são calculados conforme os Pokémon realmente evoluem e o moveset de cada forma; progresso e limite de nível da campanha são preservados.
- Movimentos que exigem TM mostram **TM**. Compatibilidade sozinha não ensina o ataque: o jogador precisa receber e usar a TM.
- O conjunto de ataques equipáveis nunca inclui um golpe não desbloqueado no nível atual. Após evolução da campanha, os quatro espaços são recalculados para a nova espécie.
- Mewtwo de teste mantém o arsenal completo no nível 50, sem alterar a progressão dos demais.

## Evolução por modo
**Campanha Kanto:** acumula EXP na luta e evolui somente **após o encerramento**, com atualização da equipe e do save; o EVO/MEGA de combate é bloqueado apenas quando `datos.torre2` estiver ativo.

**VS CPU / Training / Arena:** continuam usando o sistema de evolução/mega durante o combate do próprio Poké Arena 2D. Não há bloqueio global.

## Validação
Testes verificam as 151 espécies, movimentação dos slots, inexistência de ataques extras, biblioteca de golpes aprovados, desbloqueios de nível e TM, e separação de evolução da campanha dos demais modos.
