# T51 — Integração controlada: 60 imagens + ordem original de Kanto

Esta branch reúne o acervo de 60 fundos WebP 1280×720 da PR #494 (SHA-256 individual no manifesto, verificado no CI) com os hotspots e a trava inicial da PR #497.
Não há autorização para substituição de desenhos, reposicionamento arbitrário de rotas nem publicação automática.

**Regra de campanha:** Pallet → Rota 1 → Viridian City → Rota 2 → Viridian Forest → Pewter/Brock. Rota 22 é desvio opcional. Quatro artes obrigatórias (Pallet, Rota 1, Viridian City, Viridian Forest) continuam ausentes do catálogo de 60; a Rota 2 ainda não tem hotspots aprovados. Logo, a campanha de estágio zero permanece no fluxo nativo. Nunca inserir Pewter como início falso.

**Estado técnico:** os 60 WebP existem agora nesta branch e `APPROVED_MAP_ASSETS_READY=true`; os estágios posteriores podem ser testados com fixtures. Essa liberação técnica **não** significa campanha visual completa ou progressão cronológica validada. Os testes manuais devem respeitar os bloqueios por estágio e revanches.

**Proteções:** não alterar `SAVE_KEY`, recompensas, badges, VFX, cooldown, combate nem UI aprovada. Não publicar na `main` e manter este PR como DRAFT até validar entrada/saída, navegação e save no mobile.

**Testes reais:** `approved-map-real-browser.cjs` testa fundos aprovados com uma fixture controlada do estágio Cerulean. Isso não prova que o jogador chegou naturalmente até ela. `visual-guard-browser.cjs` valida o início do estágio zero sem salto para Pewter.

**Auditoria de origem:** mantenha a verificação SHA-256 dos 60 WebP, AABB sem sobreposição e benchmark básico de memória mobile. A ordem do documento `ORDEM-MAPAS-APROVADOS-T50.md` preserva índices originais sem pressupor que todos os pontos já são jogáveis.
