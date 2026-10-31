# Atalhos de teclado — método de pesquisa em lote confirmado
Data: 31/10/2026. Origem: `controls.js` público do PB Ranked; validado em partida solo Practice vs Bot [TinyFish #b4437ae4](https://agent.tinyfish.ai/runs/b4437ae4-5ec7-49a0-89aa-f06e5963d9bd).

| Ação | Atalho padrão |
| --- | --- |
| Golpes 1, 2, 3, 4 | `1`, `2`, `3`, `4` |
| Golpes 5–8 (modo duplo) | `5`, `6`, `7`, `8` |
| Troca de Pokémon 1–6 | `Z`, `X`, `C`, `V`, `B`, `N` |
| Alternar MANUAL/AUTO | `T` |
| Movimentação | `W`, `A`, `S`, `D` ou setas |
| Esquiva | `Espaço` |
| Mega / Battle Bond | `M` |
| Alternar controlado em dupla | `Q` |

## Evidência
O cliente público define essas teclas padrão; a sessão real confirmou `T`, `X`, `Z`, `C` e as teclas `1`–`4` com mudanças de estado de recarga. As teclas podem ter sido reconfiguradas pelo jogador; conferir configuração antes de testar.

**Por que importa:** TinyFish falhou com IDs temporários dos botões. Teclas de jogo contornam esse problema. Pressionar uma tecla e ver `ready→called/cooling` é evidência melhor de uso do que somente ver o golpe na UI. Ainda não prova qual sprite específico apareceu naquele quadro.

## Próximas partidas
- Equipe **Malamar, Noivern, Pikachu** ficou salva em 3/3, mas [a sessão de tentativa](https://agent.tinyfish.ai/runs/e40f4695-c2b4-415d-ada1-9f4fb5d98ace) terminou na fila de bot (#21), sem combate. Preservar equipe; não gastar passos reconstruindo-a.
- Atenção: defaults observados em 31/10/2026 foram Malamar **Psycho Cut, Night Slash, Superpower, Hypnosis**; Noivern **Supersonic, Boomburst, Dragon Claw, Acrobatics**; Pikachu **Thunderbolt, Quick Attack, Iron Tail, Volt Tackle**. Não confiar em ordens de outro inventário quando o HUD diferir.
- Iniciar `Practice vs Bot → 1 EASY` (não clicar `Find unranked battle` humano); aguardar o servidor. O chip `Unranked` é genérico, conforme [verificação pública](ROTAS-PRACTICE-E-UNRANKED-VERIFICADAS.md).
- Na batalha, usar `T` para manual, `Z/X/C` para equipe, `1/2/3/4` por golpe. Registrar por golpe os estados antes/depois, alvo/efeito e a sessão.
- **Sem sessões TinyFish adicionais enquanto o saldo for insuficiente**, para evitar execução interrompida por custo. Não alterar produção ou copiar material protegido.

[Progresso de 283 nomes](PROGRESSO-GOLPES-283-2026-10-31.json) · [Matriz de famílias técnicas](FAMILIAS-ESTRUTURAIS-283-GOLPES.json).
