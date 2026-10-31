# T16 — AUTO tático de golpes de clima
- Escopo: apenas AUTO **campanha** com movimento de clima **realmente equipado** em RMB/Q. AUTO manual e Arena/VS/online permanecem intactos. Não cadastrar novo VFX.
- Analisa tipos do usuário e oponente via `weatherSpeciesMultiplier` (mesma regra +20%/-20%), comparando o clima instalado com o clima atual. Ativa só quando o ganho ofensivo/tático compensa; reativa apenas perto da expiração (3,5s).
- Só usa golpe com `forma` válida, não pendente, sem recarga, com energia suficiente, sem bloqueio de ação, baixa vida, esquiva prioritária ou projétil próximo. Pode substituir o disparo básico para iniciar uma janela vantajosa; nunca rouba outro HAB escolhido/ULT.
- Testes: decisões unitárias por afinidade (Água/Elétrico, oposição/neutralidade, substituição, duração, recarga, energia, ação, perigo), browser com Phaser e fixture explícita Squirtle Lv25 no estágio 3, sem alegar XP natural. Executar CI completa, guardião visual e revalidar PRs #378, #374 antes de merge/Pages.
- Dependência: PR #378 aumenta equipamento Rain Dance de 11 para 40 espécies. Esta lógica funciona com movimentos aprovados já disponíveis na main e futuros climas somente após sua entrada legal no catálogo.
- Rollback: reverter módulo AUTO, alias de import e arquivos novos de teste/CI. Não mexer em sprites, habilidade nativa nem saves.

## Correção de papéis por clima — 31/10/2026
Rain Dance tem 31 recipientes de Água na campanha (não mais 40 Água/Elétrico). AUTO só usa golpes efetivamente equipados; por isso Elétricos não vão ativar chuva com um Rain Dance legado. Thunder na chuva permanece com precisão 100%; não conceder +20% a todo ataque do tipo Elétrico. Granizo beneficia apenas Ice; golpes Sunny Day, Sandstorm e Hail continuam indisponíveis para equipamento até a aprovação dos VFX específicos, embora as quatro condições climáticas funcionem no motor/laboratório. Saves legados não são sobrescritos.
