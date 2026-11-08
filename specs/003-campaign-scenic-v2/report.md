# Campanha scenic v2 — relatório

Estado: implementado em branch isolada; CI/publicação pendentes. Base atual f079d9c7 (Alpha 0.65.8), atualizada por outra frente em #609. O redesign desta branch não modifica o cliente-base.

## Mudanças reais
- Seleção em todas as regiões: moldura vertical removida, cenários regionais, folhagem pixel art LPC real, caminhos/água/pedra/jardins/arcos, estados textuais preservados.
- Ações externas com ícones específicos; painéis recortados e menos bordas aninhadas.
- Detalhe do treinador: cenário regional e proporção do NPC reduzida para se integrar ao ambiente; roster, diálogo e ações originais mantidos.
- Páginas finais aproveitam os espaços sem cards para painel da jornada/equipe. Nenhum card é ocultado ou reordenado.
- Rótulos da Liga/Campeão corrigidos somente na seleção externa. Dados compartilhados pelo VS permanecem idênticos.
- Créditos completos da arte acessíveis nas opções. PNG intacto sob CC-BY-SA 3.0, sem alegar que open source significa CC0.

## Preservação e testes
- check-scenic-boundary: 247 arquivos protegidos idênticos; campaign-scene inteiro idêntico; rosters e diálogo do VS idênticos.
- 510 testes Node passaram após rebase; npm run check e guardião dos três assets aprovados passaram.
- Chromium Alpha 0.65.8: sete regiões, detalhe, opções, toque real emulado em paisagem, save preservado e zero pageerror. T99 opções/equipe/TM aprovado.
- Browser com requisição real do atlas atrasada: sair dos cards para PC antes da resposta não cria árvores no PC nem deixa listeners pendentes.
- Atlas 1024² RGBA, 185501 bytes; QA do Arsenal aprovado. Uma textura privada (~4 MiB GPU), sem timers ou animações por quadro novos.
- Revisão independente: nenhum bloqueio funcional/combate; corrigida documentação de licença. Páginas finais preenchidas após crítica de espaços vazios. Recorte alternativo de árvore foi descartado ao detectar troncos de variantes vizinhas.

## Evidência e limites
Evidências reais em homolog/scenic-v2/evidence. Capturas usam saves preparados, não campanha percorrida normalmente.
Desktop 1280×720 e celular paisagem 844×390. Em 390×844 e 768×1024 o cliente nativo exige rotação; aviso preservado e verificado. Android físico não testado. Alvos externos mantêm dimensões anteriores (~31 CSS px em paisagem); não alegar melhoria de ergonomia onde não houve mudança.

Este lote redesenha a seleção regional, os detalhes e opções; não é conclusão de todos os mapas, interiores, abertura e interfaces da campanha. A estética final não deve ser chamada de aprovada apenas porque os testes passaram.

## Arsenal e pesquisa
Kit pokemon-campanha-design, create-game-assets, game-ui-ux e level-design consultados. asset_report.py executado; Phaser existente e Playwright utilizados. Superpowers/Spec Kit: plano, revisão independente e validação. Pixelorama, LibreSprite e Tiled não foram executados; nenhuma engine nova ou dependência de runtime instalada.
