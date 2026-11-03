# T68 — Auditoria da progressão nos 60 mapas originais (03/11/2026)

## Escopo da homologação
Branch `feat/t68-homologacao-progression-gates-20261103`, derivada da homologação (não da `main`). **Sem merge para main, sem GitHub Pages, sem deploy oficial.**

### Correções propostas
- `tools/pokearena/torre2-approved-progression-gates.js`: fonte única do limite de etapa por mapa, insígnias nativas, bloqueios pós-Campeão, atalhos ainda sem cena física e missões sem chave/senha implementada.
- `tools/pokearena/torre2-campaign-scene.js`: consultar o save atual antes de iniciar cada travessia; revalidar após o carregamento assíncrono, recusando uma transição obsoleta ou de etapa antiga.
- Giovanni só abre imagem após sete insígnias **reais** no save; início da Liga e pós-Liga requerem as oito insígnias já conquistadas, e Hall/Sevii continuam exigindo `stage===13` e `champion===true`.
- Testes específicos verificam falta de insígnias, mapas inexistentes, flags de quest não conquistáveis e ausência de alterações no save.
- Teste de navegador para etapa 8 utiliza **fixture sintética explícita de oito insígnias**, não prova de oito ginásios vencidos de maneira natural.

### Limitações verificadas — NÃO declarar prontas
1. **Abertura de Kanto:** os 60 fundos começam na Rota 2. Pallet, Rota 1, Viridian e Viridian Forest não fazem parte desse conjunto aprovado. O início permanece no cliente nativo, sem falso salto.
2. **Saffron:** a arte e os interiores podem ser inspecionados em fixture, mas **não existe conexão física revisada** de Celadon com Saffron. O atlas conhece a relação geográfica, porém não autoriza o teleporte.
3. **Giovanni/Viridian:** o ginásio tem fundo aprovado e combate nativo; a cidade de Viridian não tem imagem aprovada neste atlas. As arestas geográficas Rota 21→Giovanni e Giovanni→Rota 22/23 não são entradas caminháveis, então não recebem atalho fictício.
4. **Missões incompletas:** senha Rocket Warehouse e chave Tanoby continuam bloqueadas. S.S. Anne, Silph Scope, Silph Co e chave da Mansão possuem imagens/placas e referências narrativas, porém **não provaram** aquisição natural dos itens/chaves exigidos pelo FireRed; integração de quests permanece pendente.
5. **Liga e Torre:** cliques no mapa não podem fabricar badges, honras, batalhas ou vitórias. As batalhas da campanha são do motor nativo e precisam de testes naturais separados, com saves íntegros.
6. **Performance:** o renderer já remove texturas obsoletas de mapas aprovados; é necessária validação de memória/FPS Android real. Chromium emulado **não** prova fluidez no aparelho.

### Critérios para considerar T68 pronta
- T40 e T41 **PASS** no SHA final; Guardião Visual **PASS** em desktop/mobile; build Phaser de homologação e seu ZIP **PASS**, sem publicar; regressão dos saves e insígnias **PASS**; nenhuma WebP alterada.
- Registrar o SHA/PR e resultados efetivos. Persistem pendências de percurso natural e de assets que não existem no conjunto aprovado.
- Integrar **somente** à branch de homologação após QA. A produção continua bloqueada até aprovação final expressa do usuário.
