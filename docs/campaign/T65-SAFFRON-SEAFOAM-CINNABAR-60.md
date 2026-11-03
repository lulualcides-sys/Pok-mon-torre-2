# T65 — Saffron, Seafoam e Cinnabar: integração sem novos mapas

**Fonte exclusiva:** imagens 33–41 do pacote original de 60 WebP, em suas resoluções e hashes aprovados. Nenhum novo fundo ou sprite duplicado.

### Caminhos agora clicáveis
- Silph Co., Dojo de Luta e Ginásio Sabrina: saídas físicas para Saffron. O acesso aos interiores permanece controlado pela cidade. A PR #510 definiu a posição de Silph e Sabrina em Saffron; a porta do Dojo continua deliberadamente sem destino até preflight visual compatível.
- Fuchsia → Rotas 19/20 → Ilhas Seafoam → Cinnabar. A arte Seafoam tem Rota 19 na saída leste e Rota 20/Cinnabar na saída oeste. Não transformar os pavimentos B1F/B2F/B3F/B4F em mapas adicionais, porque não pertencem às 60 artes.
- Cinnabar ↔ Mansão Pokémon, Cinnabar ↔ Ginásio de Blaine, Cinnabar ↔ Rota 21. Os prédios Centro e Loja usam a UI já existente. A placa Rota 20 se conecta à própria Seafoam, sem atalhos de praia.
- Após vencer Sabrina, estágio 6 começa em **Fuchsia**, de onde o caminho costeiro aprovado é percorrível antes de Cinnabar. O estágio 7 (Giovanni) continua com fallback já existente porque Pallet e Viridian não são fundos individuais no pacote 60.

### Limites intencionais
- Não conceder Card Key, Lapras, Articuno, itens, HM, chaves da mansão ou badges apenas por clicar em sinais.
- Ginásios de Sabrina/Blaine: por ora a **saída é funcional**, mas a interação específica dos treinadores ainda precisa ser ligada ao sistema nativo. Não declarar líder jogável até teste de batalha completo.
- A Rota 21 aponta para Pallet, que não consta dos 60. Não direcioná-la artificialmente ao ginásio Giovanni apesar da aresta simplificada preexistente no atlas.
- O Dojo de Luta não ganhou portal de entrada em Saffron porque o preflight T64 é deliberadamente limitado às quatro portas originais verificadas. Sua saída pode ser usada quando o acesso estiver validado.

### QA
Executar T41 de geometria, adjacências, cliques e regressões. Verificar o Guardião Visual Phaser desktop/mobile antes de reportar conclusão. Os 60 WebP e seus hashes não podem ser modificados; os saves e batalhas existentes permanecem intactos. PR DRAFT sem merge/main/deploy.
