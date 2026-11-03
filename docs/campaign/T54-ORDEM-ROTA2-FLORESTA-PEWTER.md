# Complemento T54 — limite geográfico de Viridian Forest

A representação simplificada do cenário **Rota 2** usa uma arte única com duas saídas. O percurso correto é:

Pallet → Rota 1 → Viridian City → Rota 2 (sul) → Viridian Forest → Rota 2 (norte) → Pewter City → Brock.

**Não há saída direta Forest → Pewter**. A floresta volta para a Rota 2, cuja passagem norte para Pewter fica bloqueada até que os dez checkpoints de treinadores da rota sejam resolvidos. O estágio 0 possui treze checkpoints: os três últimos correspondem aos treinadores internos de Brock. Assim, o jogador não pode pular as lutas da rota mesmo depois de adicionadas as imagens.

Este bloqueio usa o contador **existente** `state.trainer`, sem adicionar campos ao save, reescrever batalhas ou conceder insígnias. O mapa de Rota 22 é opcional. Enquanto as quatro artes não tiverem sido aprovadas, a interface visual inicial permanece desativada e a campanha nativa continua disponível.
