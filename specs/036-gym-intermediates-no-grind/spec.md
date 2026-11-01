# T19 — Intermediários dos ginásios sem novos confrontos

**Problema:** a sala de ginásio atual da PR #440 exibe líder e Pokémon ace, mas não os 3–4 encontros anteriores. A rota continua mostrando o mesmo contador 13 + 2*stage.

**Escopo autorizado:** apresentação em Phaser, sem novas batalhas, sem alteração de save schema, routeNode, índices, boss, níveis, XP, IA, RNG, VFX ou Arena. Brock: 10 rota + 3 ginásio; Misty: 11 rota + 4 ginásio. Cada intermediário recebe exatamente o índice já existente na escada; só o atual é clicável.

**Conflito explícito de conteúdo:** routeNode classifica Brock índice 12 e Misty índice 12 como RIVAL; o índice 14 de Misty é TREINADOR (não Rocket). Encontros Rocket aparecem em outros índices/estágios e mantêm a identidade original. Não são subchefes canônicos. A interface preserva esses nomes/identidades em vez de falsificá-los. Exigir 3–4 subchefes *puros* requer autorização separada para reordenar índices/encontros ou criar lutas, ambas proibidas neste patch. Por isso são **3–4 encontros intermediários existentes**, incluindo visitas de rival/Rocket quando assim definido no motor.

**Requisitos visuais:** ginásio próprio, NPCs laterais com sprites FireRed, sombras e labels curtos, plataforma central de líder + ace livre, CTA e retorno acessíveis em mobile; sem uso de imagens conceituais como screenshot real.

**Critérios:** testes Node de identidade e soma, build cliente Phaser, Chromium WebGL desktop/mobile screenshots de Brock/Misty, CI verde e inspeção antes do merge. PR em draft até esses gates.

## Complemento: rota → ginásio (01/11)

O mapa de rotas deve apresentar apenas os índices anteriores ao limite de entrada: Brock 0–9 e Misty 0–10. O próximo nó visual é **ENTRADA DO GINÁSIO**, sem NPC de treinador/líder duplicado. Os índices 10–12 de Brock e 11–14 de Misty aparecem exclusivamente no interior, preservando identidades originais e progresso. A porta do ginásio na cidade deve ficar acessível a partir desse limite; a luta contra o líder continua bloqueada até a conclusão dos intermediários. Botões de rota/cidade não podem chamar `enterBattle` diretamente quando o índice atual pertence ao interior. Nenhuma alteração de save schema, confrontos, recompensas ou combate.
