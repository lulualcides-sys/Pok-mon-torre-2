# T52 — fechamento do prólogo Pallet → Pewter (inventário real)

**Estado confirmado no código:** os 60 WebP da PR #498 estão na branch de integração. A `route-2.webp` tem dois hotspots testados por mouse e toque em Chromium; o acesso norte chega a Pewter, o sul não teleporta porque a imagem de Viridian Forest ainda não integra o atlas. Não publicar o início até ter todas as artes e ligações revisadas.

## Material que existe fora do pacote de 60

| Etapa | Material identificado | Estado |
|---|---|---|
| Pallet Town | `Mapa de Pallet Town em Pixel Art.png` (1672×941) | Candidata na Biblioteca; possui elementos HUD/menus pintados, **não homologada como fundo independente Phaser** |
| Rota 1 | Encontrada apenas em composições/colagens; não há arte individual confirmada | **Ausente**; requer arte própria revisada |
| Viridian City | `Mapa de Viridian City em Pixel Art.png` (1672×941) | Candidata na Biblioteca, com HUD e textos já pintados; precisa de revisão |
| Rota 2 | `assets/ui/kanto-approved-maps/kanto/route-2.webp` (1280×720) | **Arte aprovada e hotspots T52 testados**, com saída norte e sul, sem mutação de saves |
| Viridian Forest | `Mapa Pixelado da Floresta de Viridian.png` (1672×941) | Candidata na Biblioteca; requer revisão, não instalada como fundo |
| Pewter City + Brock | `pewter-city.webp` e `gym-brock.webp` | Artes aprovadas, browser QA em desktop/mobile |

`Rotas 22 e 23: Caminho da Vitória.png` é **outra etapa** que inclui Portão da Liga, distintivos e Victory Road. Não usar essa imagem como desvio inicial de Rota 22; isso abriria geografia e progressão finais prematuramente.

## Integração prevista sem pular etapa

`pallet-town` → `route-1` → `viridian-city` → `route-2` → `viridian-forest` → `route-2` (trecho norte) → `pewter-city` → `gym-brock`.

- Pallet: escolha do inicial no laboratório; ligação norte à Rota 1. Não gerar novos checkpoints.
- Rota 1: saída sul para Pallet e norte para Viridian; zonas de encontro existentes.
- Viridian: Centro, Loja, saída sul Rota 1 e norte Rota 2. Rota 22 opcional e separada.
- Rota 2: saída sul **pendente** da Floresta, saída norte aprovada até Pewter, caverna Diglett decorativa até existir interior.
- Floresta: ligação ao trecho de Rota 2 por ambas as pontas; treinadores conforme índices nativos. **Não** atribuir flags/itens/HM improvisados.
- Pewter: Centro, Loja, ginásio com 3 subchefes já existentes mais Brock. Acesso ao próximo segmento só após regras nativas de progresso.

O código atual NÃO distingue um save com Floresta visitada de outro que apenas conheça Rota 2; por isso não se deve liberar o trajeto inicial automaticamente com apenas os arquivos. Será necessário validar e conectar a sequência de checkpoints existentes antes de liberar a travessia completa, sem alterar o formato do save.

## Aprovação e qualidade
Preservar 16:9, sem zoom e sem joystick. Evitar duplicar HUD pintado nas candidatas (Phaser adiciona controles dinamicamente). Nenhuma candidata vira `approved:true` sem revisão visual e aprovação. A priorização de PRs continua: prólogo completo antes de Saffron/Sevii. Testar transições, batalha, captura, retorno, cache de texturas e salvar/carregar em mobile real antes de publicar.
