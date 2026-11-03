# T69 — Retorno ao mapa aprovado após Sumário / Equipe

**Somente homologação:** branch `feat/t69-homologacao-retorno-sumario-mapa-20261103`, base `test/homologacao-kanto-20261103`.

## Problema reproduzido no código anterior
O botão `◀ EQUIPE` no Sumário e a seleção do Pokémon ativo chamavam `renderCampaign(state)`, descartando visualmente a cidade ou rota de arte aprovada e abrindo a interface nativa antiga. A referência da localização original permanecia apenas no objeto `__torre2ApprovedReturn`, sendo restaurada depois de um novo restart. Isso quebrava a continuidade visual exigida para os 60 mapas.

## Correção
- `approvedReturnMapId`: política pura de recuperação visual. A referência à localização é temporária na cena e tem que corresponder à **etapa atual**, a um **mapa existente** e aos **bloqueios de insígnias/campeão** em vigor.
- `returnFromPartyToMap`: relê o checkpoint; se a textura original ainda está carregada e a política autoriza, redesenha a cena original. Se não, retorna de forma segura à campanha nativa sem alterar saves.
- Botões **voltar do Sumário** e **selecionar o Pokémon ativo** usam o mesmo retorno. Sem `scene.restart()` e sem interferir em tela cheia, combate, sprites ou WebPs.
- Testes Node cobrem mapa/etapa inválidos, Giovanni, Victory Road, Champion, missões bloqueadas e imutabilidade. O Chromium em desktop/mobile abre Sumário e retorna por **clique/touch real**, verificando o mesmo ID de mapa, hotspot interativo e o mesmo save.

## Fora do escopo
- Não cria novas imagens, não substitui uma das 60 artes e não altera o sprite de nenhum treinador.
- Não desbloqueia quests não implementadas, não entrega insígnias, não inventa vitórias ou HMs.
- Não valida ainda uma jornada natural completa Pallet → Liga → Sevii. Continuam pendências T68 documentadas.

**Gate:** T41, Guardião Visual e workflow de homologação devem ficar verdes no SHA final antes de integrar. **Não atualizar a `main`, não publicar em GitHub Pages.**