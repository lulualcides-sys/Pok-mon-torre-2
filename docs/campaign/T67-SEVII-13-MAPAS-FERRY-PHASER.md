# T67 — Ilhas Sevii: treze imagens originais, ferry por clique Phaser

**Exclusivamente fundos #48–60 já aprovados**, sem novos mapas, sem alterações ou zoom nos originais e sem IDs novos de imagem.

## Interações adicionadas
- Ilha 1 ↔ Monte Ember pela placa original Kindled Road.
- Portos das sete ilhas: toque na placa **PORTO** e escolha dentre as ilhas imediatamente vizinhas já ligadas no grafo de 60 mapas. O menu de ferry é uma camada Phaser e não modifica saves. Na Ilha 1, permite também retorno à Sala da Fama.
- A Sala da Fama mostra um único link **VISITAR ILHAS SEVII** para quem realmente venceu o Campeão (stage 13 + `champion === true`), sem inventar cenário de porto para a Liga.
- Ilhas 2–6: PC/Loja quando pintados; Ilha 4 ↔ Icefall; Ilha 5 → Depósito Rocket (bloqueado até existir a senha do jogo); Ilha 7 ↔ Torre dos Treinadores e ↔ Cânion Sevault; Cânion → Ruínas Tanoby (bloqueado até existir a chave).
- As sete salas das ruínas e os oito níveis da Torre preservam os desenhos aprovados; tocar em cada nome **não simula combate nem recompensa**. São pendências de gameplay.
- `Voltar` sai do canto superior direito em todas as treze cenas para evitar cobrir as placas pintadas nas imagens.

## Segurança
- Sem vitória real sobre o Campeão: proibido entrar nas Ilhas Sevii, mesmo que alguém forçe stage 13 na memória.
- A entrada no Depósito Rocket e nas Ruínas Tanoby permanece bloqueada por pré-requisitos de evento ainda não implementados. Não falsificar quest flags ou inventar sistemas de itens.
- O menu de ferry só exibe vizinhos definidos no atlas original e desbloqueados pela etapa, preservando 60 WebP e save local.
- Evitar falsas atrações: Moltres, Ruby, Lost Cave, Dotted Hole, Tutor, anotações de floors e Unown não concedem ações inexistentes.

## Qualidade
- Testes de políticas do ferry, transições, grafo, coordenadas não sobrepostas e cliques com Phaser; Guardião Visual desktop/mobile e capturas reais antes de mesclar ou publicar.
- PR DRAFT e nenhuma publicação automática.
