# Todos os 283 golpes — famílias de efeitos e reaproveitamento prudente

Com base nos sinais do código público, classifiquei **todos os 283 nomes distintos** em famílias técnicas de efeito (feixes, projéteis, ondas, ataques de contato, terreno, status, clima, deslocamento, luz, partículas).
Os grupos são **inferências estáticas**, não captura visual quadro a quadro. Os nomes mais parecidos estruturalmente não têm necessariamente o mesmo efeito visual.

| Família técnica | Quantidade |
|---|---:|
| terrain | 57 |
| status | 53 |
| melee | 50 |
| beam | 30 |
| projectile | 25 |
| wave | 22 |
| movement | 18 |
| undetermined | 14 |
| particles | 13 |
| light | 1 |

**Sinais VFX/sons explícitos:** 268. **Pares estruturais com similaridade maior que zero:** 243. **Analogia a golpe protegido do Torre 2:** 154 (sugestão, sem autorização para trocar ou copiar).

## Diretriz de implementação

1. Preservar integralmente os golpes aprovados; 45 nomes do cliente público cruzam com o registro de aprovações/baseline, **não** significa que os outros 238 faltem ao nosso jogo.
2. Para novos efeitos, escolher por família técnica e construir VFX originais em Phaser/WebGL, com timing e hitboxes verificados no Torre 2.
3. Não marcar 'confirmado' por pertencer a uma família; confirmar em batalha com imagem/frames reais.
4. Usar as alternativas estruturais apenas para identificar código reaproveitável **dentro do próprio Torre 2**, não para importar sprites do PB Ranked.

[Base completa dos 283 golpes e comparações](FAMILIAS-ESTRUTURAIS-283-GOLPES.json).

