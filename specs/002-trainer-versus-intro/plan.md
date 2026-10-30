# Plano de implementação — VS de treinadores

1. Isolar branch da main de 30/10/2026 e não tocar nos PRs da fila T01–T31.
2. Criar módulo Phaser `torre2-versus-intro.js` para a animação e perfil de adversário: sprites FRLG existentes, bola pixel aprovada, HUD real de equipes, tween curta.
3. Integrar somente `launchBattle()` e descritor de treinador/revanche no `torre2-campaign-scene.js`; não alterar dados de batalha nem a transição Phaser original além do atraso visual.
4. Incluir o módulo em `build-preview.mjs` e na impressão digital de cache do Pages; nenhum arquivo de captura de cliente original muda.
5. Cobertura: teste de contrato, teste real de UI Chromium e build, regressões já presentes.
6. Rollback: reverter commits desta branch ou merge se falha visual/compatibilidade; saves versão 1 preservados.

## Riscos
- Conexão ao cliente remoto pode falhar na etapa capture-client — distinguir de falha no código.
- Assets de NPC não carregados: uso de stencil Phaser já existente como fallback.
- Mobile: Zone intercepta toque durante intro; scene shutdown destrói timer.
- Concorrência: main pode avançar por outro agente; resolver conflitos via PR, não forçar main.
