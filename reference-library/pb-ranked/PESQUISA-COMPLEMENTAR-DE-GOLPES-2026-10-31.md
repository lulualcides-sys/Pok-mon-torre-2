# Pesquisa complementar de golpes — PB Ranked × Pokémon Torre 2

**Data:** 31/10/2026. **Status:** pesquisa confirmada e metadados ampliados; jogo publicado sem alterações.

## Sessões autenticadas

- [Luta em Mt. Silver, Practice vs Bot](https://agent.tinyfish.ai/runs/42da9b5a-b1ae-44a0-9e06-a41c058eaa69): equipe Crobat, Snorlax, Charizard; o agente relatou visual de quatro golpes do Crobat.
- [Tentativa específica de Charizard](https://agent.tinyfish.ai/runs/30ec1c74-b613-41a6-b6ab-058554931765): **sem batalha**. Servidor exibiu aviso de atualização; Charizard continuou no terceiro slot, não foi possível observar efeitos de Flamethrower, Fire Blast ou Dragon Claw.

## Evidência de ataques em batalha — Crobat

| Golpe | Efeito relatado pelo agente na arena | Limitação |
| --- | --- | --- |
| Cross Poison | Golpe luminoso verde e partículas de impacto | Não comprova envenenamento nem forma exata do projétil |
| Air Slash | Ataque azulado cortante, com rastro semelhante a vento | Não há tempo de voo ou duração medidos |
| Toxic | Efeito gasoso verde-escuro | Efeito de status não foi medido independentemente |
| Brave Bird | Efeito energético vermelho e impacto amplo | Não confundir poder 120 com cooldown de 120 segundos |

Os efeitos acima são **relatos do navegador TinyFish após a partida**, não extração de sprites, vídeo quadro a quadro ou medição independente. Compare com animações aprovadas antes de criar qualquer arte.

## Candidatos para próxima avaliação — valores declarados no JavaScript público

| Golpe | Tipo | Poder declarado | Cooldown declarado | Utilidade da pesquisa | Evidência de animação |
| --- | --- | ---: | ---: | --- | --- |
| Flamethrower | fire | 90 | — | Charizard move present in builder, NO live animation tested | Não validada visualmente |
| Fire Blast | fire | 110 | 360 | High-intensity VFX potentially useful to compare, avoid overwriting approved | Não validada visualmente |
| Dragon Claw | dragon | 80 | — | Contact animation unobserved | Não validada visualmente |
| Hydro Pump | water | 110 | 270 | Water trajectory and impact, visual unobserved | Não validada visualmente |
| Ice Beam | ice | 90 | — | Beam and freeze visual; unobserved | Não validada visualmente |
| Shadow Ball | ghost | 80 | — | Projectile and shadow impact; unobserved | Não validada visualmente |
| Thunderbolt | electric | 90 | — | Electric attack range and strike shape; unobserved | Não validada visualmente |
| Surf | water | 90 | 420 | Terrain/wave animation; unobserved | Não validada visualmente |
| Precipice Blades | ground | 120 | 540 | Potential strong terrain attack; only public static declaration | Não validada visualmente |
| Prismatic Laser | psychic | 160 | — | Potential signature beam; only public static declaration | Não validada visualmente |
| Origin Pulse | water | 110 | 540 | Potential multi-pulse water attack; only public static declaration | Não validada visualmente |
| Roar of Time | dragon | 150 | — | Potential cinematic finisher; only public static declaration | Não validada visualmente |
| Spacial Rend | dragon | 100 | — | Potential spatial impact; only public static declaration | Não validada visualmente |
| Astral Barrage | ghost | 120 | — | Potential unique ghost projectile; only public static declaration | Não validada visualmente |
| Sandstorm | rock | 0 | 1500 | Weather state, not an attack VFX; only public static declaration | Não validada visualmente |

**A coluna cooldown reproduz apenas um campo numérico do código de origem. A unidade (quadros, ticks ou segundos) não foi verificada e não deve ser copiada para o balanceamento do Torre 2.**

## Diretrizes de aproveitamento

1. Os golpes existentes e aprovados (por exemplo Fire Blast, Dragon Claw, Hydro Pump, Ice Beam e Shadow Ball) são **pontos de comparação**, não justificativa para substituí-los.
2. A pesquisa de espécies fora da primeira geração (por exemplo Prismatic Laser e Precipice Blades) só interessa se futuramente houver modo compatível e decisões de balanceamento.
3. A maior lacuna é visual: animação de Charizard em combate, direção/trajetória dos projéteis e sincronização de impacto. A tentativa de hoje foi bloqueada pelo servidor.
4. REA/AST indexa código público; TinyFish observa a partida autenticada. Esses dois mecanismos **não foram anexados à mesma sessão**.
5. Não copiar arquivos proprietários nem publicar sprites de terceiros sem licença que autorize esse uso.

## Arquivos de evidência

- [JSON desta pesquisa](GOLPES-ADICIONAIS-31-10.json)
- [Catálogo de 123 registros / 119 nomes](golpes-candidatos.json)
- [Relatório anterior do combate autenticado](AUDITORIA-COMBATE-AUTENTICADO-2026-10-31.md)
