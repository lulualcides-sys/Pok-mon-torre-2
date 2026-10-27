# Remédios de status — campanha

Continuação do Script Mestre após as insígnias com sprites. Base: 3626b83, preservando ajustes recentes dos golpes da Arena.

- Poké Mart vende Antídoto ($100), Anti-Paralisia ($200), Despertar e Anti-Queimadura ($250). Anticongelante ($250) libera na etapa 2; Cura Total ($600), na etapa 4.
- Bolsa mantém poções, TMs e Sumário; botão separado abre os seis remédios para o membro escolhido. Mostra o status persistente real.
- Cura específica exige status correspondente; Antídoto também remove Toxic. Cura Total remove status principal e confusão. Não recupera HP nem revive desmaiados.
- Somente cura com efeito consome uma unidade. Saves antigos recebem contagens zero, sem reset de equipe, saldo ou progresso. Cura e compra usam o salvamento existente.
- Escopo: itens fora de batalha. Não implementa ainda o uso de remédios no BAG durante o combate nem novos VFX.

Regressões: `tests/status-items-built.test.mjs` cobre todos os status, Toxic, confusão, alvo sem efeito, desmaio, consumo, compras, bloqueios e migração. `tests/status-medicine-browser.cjs` compra Antídoto no Mart, abre Bolsa, cura por clique e verifica persistência em desktop e viewport mobile. Integração nas suítes existentes; resultados reais devem ser consultados na execução CI do commit.
