# T13 — Esquivas da Arena como golpes no slot ESP da campanha
## Origem técnica
A Arena já tem `torre2-arena-native-dodges.js` com `selectNativeDodge` e os renderizadores originais P2 `dash`/`vuelo`. A campanha usava `Dodge` genérico no `resolveLoadout` para muitas espécies.
## Requisitos
- Reutilizar o **mesmo seletor** do modo Arena, com escolhas por espécie (Teleport, Dig, Rollout, Acrobatics, Dive, Flame Charge etc.) apenas quando os respectivos objetos nativos/renderer existem.
- Proteger os 30 Pokémon nativos do cliente P2 no modo Arena/VS; na campanha manter o ESP original dessas famílias, quando validado.
- Respeitar cooldown, movimento, direção, energia e animação originais. Não transformar ESP em quinto ataque de dano nem liberar novas TMs.
- Preservar slots LMB/RMB/Q/E, especial/E, 151 learnsets, saves, escolha do usuário, limites de poção/troca e VFX aprovados.
- Caso a espécie não encontre objeto nativo real, conservar o Dodge anterior em vez de inventar efeito.
- Validar 151 espécies via módulo compilado Phaser e botões ESP em toque real com partida de campanha preparada. Nada de reivindicar vitórias ou Android físico.
## Estado
Código e testes versionados em branch separada; gates e Pages ainda a comprovar.
