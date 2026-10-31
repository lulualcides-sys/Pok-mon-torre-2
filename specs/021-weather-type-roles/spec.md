# T16 — Separação temática de golpes e efeitos climáticos

## Defeito demonstrado
A campanha atribuía Rain Dance automaticamente a 40 espécies, incluindo 9 elétricas: Pikachu, Raichu, Electabuzz, Voltorb, Electrode, Magnemite, Magneton, Zapdos e Jolteon. Também atribuía +20% ATK genérico a ELECTRIC sob chuva e a WATER puro sob granizo.

## Regras corrigidas (Torre 2, house rules distintas de TM18 oficial)
- CHUVA (Rain Dance): **31 Pokémon de Água** previamente incluídos na lista com TM18 comprovado. A progressão mantém o nível 25 e Slowpoke 49. Para espécies sem essa afinidade, incluindo os 9 Elétricos, bloquear a disponibilidade de Rain Dance independentemente de TM legado, preset original ou slot do save; não alterar o save.
- Elétricos usam seus golpes elétricos reais. **Thunder** conserva 100% de precisão na chuva por regra específica de golpe; não ganhar ATK +20% geral pela chuva.
- GRANIZO: +20% apenas ICE; WATER puro é neutro, WATER/ICE recebe +20% pelo tipo ICE.
- SOL e AREIA não sofrem mudanças; os antigos -20% por tipos opostos permanecem conforme tabela aprovada.
- O movimento de clima permanece um status de dano 0, nos slots legais HAB2/HAB3, nunca ULT. Não conceder novos VFX de Sunny Day / Sandstorm / Hail sem sua aprovação; motor do clima e laboratório continuam suportando os quatro.
- A Pokédex deve omitir Rain Dance de Elétricos mesmo se o TM18 oficial for compatível. A fonte de TM oficial permanece intacta e é separada desta regra customizada.
- Preservar todos saves, progressão, captura, sprites, golpes e VFX aprovados, slots manuais dos demais ataques, original Arena/VS e duração 20 segundos.

## Testes
Unidades: rain apenas WATER, hail apenas ICE, Thunder continua 100%, clima neutro sem popup +20. Build: todos 31 usuários Água equipam Rain Dance após o nível exigido, os 9 elétricos não conseguem mesmo com TM ou saves antigos, nenhum membro sofre escrita involuntária. Browser Chromium: Pokémon Água ativa Rain Dance via AUTO e HUD móvel ainda reflete o multiplicador correto. Exigir gates antes de merge e publicar no GitHub Pages SHA exato.
