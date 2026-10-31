# T05 — Bolsa de batalha transacional sob falha de armazenamento

## Defeito auditado em produção
`installBattleBag.use` chamava `applyBattleBagItem` antes de confirmar o
`saveCampaign`. Sob falha de gravacao localStorage, a poção era consumida em
memória (incluindo HP da equipe) embora o save fosse rejeitado. O callback
lançava exceção e podia deixar a interface modal em estado inconsistente.

## Patch
- Criar `commitBattleBagItem` para validar uso em uma cópia de estado/equipe.
- Persistir o checkpoint PRIMÁRIO e BACKUP antes de publicar o consumo na
  equipe real, mantendo identidades de objetos da batalha.
- Se qualquer gravação falhar, não alterar HP, status, confusão, itens,
  contador de três poções, timestamps de uso, save, nem o lutador nativo.
- Manter a Bolsa aberta e apresentar erro de salvamento, permitindo repetir
  a mesma tentativa depois que o armazenamento voltar.
- Bloquear uso contra membro de UID idêntico mas espécie alterada, evitando
  aplicar um remédio ao Pokémon errado.
- Preservar itens, filtros, sprites e cliques existentes sem modificar
  dano, IA dos líderes, AUTO, VFX ou funcionamento do PC.

## Evidência exigida
Unitários puro, import do pacote Phaser compilado, negação de escrita na
chave primária e backup com rollback/retentativa, toque real na Bolsa Phaser,
navegador/guardião visual e Pages antes de afirmar publicação.
