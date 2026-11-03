# T86 — Floresta de Viridian com treinadores em sprites FireRed

**Escopo:** implementação de runtime somente em branch de teste. Não mesclar na `main` ou substituir os 60 mapas originais aprovados.

## Contrato visual aprovado pelo usuário

A imagem entregue como `1001008652.png` (arquivo JPEG apesar da extensão) mede 1536×864 e possui **cinco treinadores desenhados na pintura**. Eles precisam sair do plano de fundo, substituídos por personagens independentes no Phaser. Não é permitido sobrepor um NPC à pintura original com o NPC ainda visível.

## Código implementado

- `torre2-opening-npc-overlays.js`: cinco Bug Catchers originais da biblioteca FRLG em coordenadas normalizadas, preservando a escala do mapa 16:9.
- `torre2-campaign-scene.js`: ao detectar `entry.npcCleanPlate === true`, desenha os `16×32` sprites nativos e adiciona zonas de toque conectadas aos checkpoints da campanha, sem inventar novos checkpoints ou alterar os saves.
- `build-preview.mjs`: copia o novo módulo ao cliente real Phaser e o inclui na impressão digital da build.
- `tests/t86-opening-npc-overlays.test.mjs`: exige cinco treinadores distintos, bloqueio de duplicação em arte não limpa, geometria válida, import no cliente e ausência de mutação de progresso.

## Arte limpa produzida localmente, mas ainda NÃO transferida ao GitHub

A versão de trabalho `viridian-forest-clean.webp` deve vir da fotografia original, com remoção LOCALIZADA dos cinco sprites pintados, preservando placas, árvore, chão e demais elementos. O pré-processamento foi realizado em laboratório, mas a transferência autenticada do WebP para GitHub ainda está pendente. **Não usar o novo desenho gerado para substituir silenciosamente a arte aprovada.**

Os três outros WebPs mencionados em T85 também aguardam transferência dos arquivos binários. A política de abertura `torre2-approved-opening.js` permanece bloqueada até que todos os mapas e cliques sejam efetivamente homologados.

## Contratos de ativação

1. Registrar o PNG/JPEG original e a versão limpa com SHA-256 em novo manifesto de mídia (sem tocar no manifesto dos 60).
2. Importar os fundos `pallet-town`, `route-1`, `viridian-city`, `viridian-forest` em atlas **aditivo**.
3. Marcar `npcCleanPlate:true` SOMENTE para a arte revisada sem personagens pintados.
4. Auditar visualmente os cinco Bug Catchers com screenshots Chromium e confirmar toques e retorno de batalha.
5. Atualizar apenas o projeto de Vercel de homologação. Publicar no site oficial apenas após aprovação expressa do usuário.

**Estado atual:** código de sprites preparado. Entrada dos quatro fundos no jogo e validação visual final **pendentes**. Não apresentar o link atual como se já tivesse esses NPCs.
