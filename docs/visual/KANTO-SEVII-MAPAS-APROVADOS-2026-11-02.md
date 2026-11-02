# Inventário de mapas conceituais aprovados — Kanto + Sevii
**Data de fechamento:** 2026-11-02  
**Status:** ARTES APROVADAS PARA FUTURA INTEGRAÇÃO; NÃO IMPLEMENTADAS NESTA ETAPA.

## Backup dos PNGs
Foram encontrados e verificados 58 arquivos PNG individuais. Cópia de segurança integral (189,3 MB) e `manifesto_58_imagens.json` com SHA-256 de cada imagem foram salvos na **Biblioteca do ChatGPT**, pasta:
`/Pokemon Torre 2/Mapas Aprovados 2026-11-02/`

**Importante:** os PNGs novos **não foram adicionados a este repositório por esta alteração**. Esta PR documenta os aprovados e ajuda o implementador a não confundir conceitos com assets já versionados. O ZIP está salvo separadamente na Biblioteca, pois a integração posterior deve escolher como versionar os fundos e as camadas.

## Artes com PNG verificado
- [x] 01 — Pewter City
- [x] 02 — Ginásio de Pedra
- [x] 03 — Rota 2
- [x] 04 — Rota 3
- [x] 05 — Rota 4 (oeste)
- [x] 06 — Mt. Moon (interior)
- [x] 07 — Rota 4 (leste)
- [x] 08 — Cerulean City
- [x] 09 — Ginásio de Água (Misty)
- [x] 10 — Rota 24 / Ponte Nugget
- [x] 11 — Rota 25 / Casa de Bill
- [x] 12 — Rota 5
- [x] 13 — Passagem Subterrânea 5–6
- [x] 14 — Rota 6
- [x] 15 — Vermilion City
- [x] 16 — Ginásio Elétrico (Lt. Surge)
- [x] 17 — Rota 11
- [x] 18 — Rota 9
- [x] 19 — Rotas 9–10 (agrupadas)
- [x] 20 — Lavender Town
- [x] 21 — Rotas 8–7 (agrupadas)
- [x] 22 — Celadon City
- [x] 23 — Ginásio de Planta (Erika)
- [x] 24 — Esconderijo Rocket (Celadon)
- [x] 25 — Torre Pokémon (Lavender)
- [x] 26 — Rotas 12–15 (agrupadas)
- [x] 27 — Fuchsia City
- [x] 28 — Ginásio de Veneno (Koga)
- [x] 29 — Zona Safári
- [x] 30 — Rotas 16–18 (agrupadas)
- [x] 31 — Saffron City
- [x] 32 — Silph Co. (primeira versão, com Lapras)
- [x] 33 — Ginásio Psíquico (Sabrina)
- [x] 34 — Rotas 19–20 (agrupadas)
- [x] 35 — Dojo de Luta (Saffron)
- [x] 36 — Ilhas Seafoam (interior)
- [x] 37 — Cinnabar Island (versão corrigida)
- [x] 38 — Mansão Pokémon
- [x] 39 — Ginásio de Fogo (versão final sem Blaine/Arcanine)
- [x] 40 — Rota 21
- [x] 41 — Ginásio de Terra (Giovanni)
- [x] 42 — Rotas 22–23 (agrupadas)
- [x] 43 — Victory Road (interior)
- [x] 44 — Planalto Índigo
- [x] 45 — Salões da Elite Four (sem líderes)
- [x] 46 — Sala da Fama
- [x] 47 — Ilha 1 (Sevii)
- [x] 48 — Monte Ember
- [x] 49 — Ilha 2 (Sevii)
- [x] 50 — Ilha 4 (Sevii)
- [x] 51 — Caverna Icefall
- [x] 52 — Ilha 5 (Sevii)
- [x] 53 — Depósito Rocket (Ilha 5)
- [x] 54 — Ilha 6 (Sevii)
- [x] 55 — Ilha 7 (Sevii)
- [x] 56 — Cânion Sevault
- [x] 57 — Ruínas Tanoby
- [x] 58 — Torre dos Treinadores (interior)

## Pendências de recuperação
- [ ] **S.S. Anne — interior:** usuário aprovou, mas o arquivo correspondente não foi localizado com segurança no backup da conversa.
- [ ] **Ilha 3 — Sevii:** aprovada no chat; a cópia original não foi recuperada no ambiente atual, possivelmente substituída por um PNG posterior de mesmo nome.

Não reconstruir ou escolher variantes substitutas e declarar aprovação sem nova verificação do usuário.

## Decisões de aprovação a preservar
1. **Navegação por clique**, sem controles direcionais.
2. **Sem necessidade de HM** para acessar ou atravessar os mapas; ações e progressão por eventos clicáveis.
3. **Fundos como imagem única** de cada cenário: o Phaser posiciona hotspots, UI e os sprites originais por cima, sem perder a composição visual.
4. **Treinadores e Pokémon sobrepostos em runtime**, preservando sprites originais e sem desenhos estáticos nos fundos quando possível.
5. **Rotas consecutivas reunidas** para poupar telas, mantendo espécies de captura e conexões corretas.
6. **Blaine:** aprovada a última versão com plataforma do líder vazia e **sem Arcanine**.
7. **Silph Co.:** aprovada a PRIMEIRA versão com Lapras visível no conceito, não a versão posterior que removeu elementos.
8. **Lt. Surge:** **sem lixeiras**, sem minigame de interruptores.
9. **Cinnabar:** somente a **segunda composição corrigida** segue o padrão visual aprovado.
10. **Elite Four:** usar a imagem de cinco arenas sem os líderes desenhados; adicionar personagens e ace via sprites posteriormente.
11. A aprovação dos conceitos **não autoriza sobrescrever código/saves nem publicar uma implementação** sem testes e validação.

## Próximo trabalho
1. Recuperar os PNGs pendentes de S.S. Anne e Ilha 3.
2. Levar cada PNG para assets versionados de forma auditável, preferencialmente branch própria com rastreamento de origem/SHA-256.
3. Criar atlas de coordenadas normalizadas (0..1), hotspots de rota/PC/loja/ginásio, batalhas/grama e camadas originais de sprites.
4. Testar navegação ida/volta, progressão e saves; executar validações visuais em desktop/mobile antes de publicar.

**Repositório principal:** `lulualcides-sys/Pok-mon-torre-2`.
