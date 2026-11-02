# Memória operacional — Pokémon Torre 2

Abra a pasta `docs/memoria` como **vault local no Obsidian**. É apenas Markdown, utilizável sem instalar Obsidian. Esta pasta não contém senhas, cópias de saves ou dados pessoais.

## Como economizar contexto

1. Para uma tarefa, execute `node tools/dev/memoria-contexto.mjs --list` e depois `node tools/dev/memoria-contexto.mjs campanha` (ou outra área). O comando **lê apenas dois arquivos curtos**, não todo o Script Mestre.
2. Use o texto gerado como **mapa de navegação**; consulte `AGENTS.md`, a política integral dos golpes quando aplicável, `docs/GUIA-RAPIDO-REPOSITORIO.md`, o Script Mestre, a fila e os trechos de código necessários. Não reduza nem substitua regras obrigatórias por resumo.
3. Antes de corrigir, confira HEAD, PRs abertas, CI e o estado real da implementação. A memória é índice, **não confirmação de conclusão**.
4. Para conteúdo de código, reaproveite `node tools/dev/contexto-ia.mjs <area> [--full]` (Repomix); usar corpos completos ao modificar lógica.
5. Após cada patch, registrar decisões e evidências nas **fontes já existentes** (`specs/`, fila e controle do Script Mestre), não duplicar um segundo status possivelmente desatualizado neste vault.

## Navegação no Obsidian

[[BASE]] · [[areas/campanha]] · [[areas/golpes]] · [[areas/captura]] · [[areas/combate]] · [[areas/clima]] · [[areas/arena]] · [[areas/interface]]

## Graphiti (etapa opcional, NÃO instalada)

O projeto **getzep/graphiti** está catalogado no [Arsenal](https://github.com/lulualcides-sys/Arsenal/tree/main/fontes/ferramentas/graphiti). Não foi configurado no Pokémon Torre 2. A ingestão com LLM/embeddings + banco de grafos introduz custo e manutenção; **não instalar por padrão**. Primeiro medir se Markdown + GitHub + Repomix responde às consultas com menor custo e sem perda de precisão.

**Não presumir economia mensurada** nem conexão do Obsidian/Graphiti ao ChatGPT; esse fluxo requer execução consciente em ambiente com acesso ao repositório.
