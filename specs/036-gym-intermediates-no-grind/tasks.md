# Checklist T19

- [x] Criar módulo de modelo e render dos encontros existentes.
- [x] Integrar cena de ginásio e empacotamento.
- [x] Criar teste focado de 8 ginásios, índices, identidade e geometria.
- [ ] Executar CI de HEAD exato com build + Chromium desktop/mobile.
- [ ] Inspecionar capturas reais e FPS.
- [ ] Verificar PR #440 e CI base sem regressões.
- [ ] Revisar, aprovar arte e fazer merge/publicação verificada.

## Correção da transição rota/ginásio — 01/11

- [x] Código em branch isolada: impedir batalhas internas pela rota e liberar porta do ginásio na fase correta.
- [x] Código em branch isolada: apresentar portal único no mapa de rotas, sem duplicar 3–4 NPCs.
- [x] Testes de regressão adicionados para limites e navegação; validação V8 de 40 combinações estágio/progresso.
- [ ] GitHub Actions completo no SHA final, Chromium desktop/mobile e inspeção de screenshots.
- [ ] Revisão, aprovação visual, merge e Pages com hash HTTP confirmado.
