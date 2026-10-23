# Pokémon Torre 2 — 13 golpes de Kanto (23/10/2026)

**Aguardando revisão visual do usuário**, sem aprovação automática.

Os 13 são Psychic, Sleep Powder, Protect, Surf, Ice Punch, Thunder Punch,
Fire Punch, Cross Chop, Aerial Ace, Flame Wheel, Light Screen, Rain Dance
e Sand Attack.

Efeitos: runa psíquica, pó direcional que adormece após contato, proteção por
0,72s, onda com crista de espuma, socos elementais físicos, X de contato vermelho,
corte aéreo, anel de fogo junto ao atacante, Light Screen por 7,5s (50% menos
dano especial), chuva por 8s (+35% dano de água, -35% fogo) e areia direcional
(28% de redução de precisão por 6s).

Nativo usa "dormido" para RECUPERAÇÃO DE VIDA, não sono: Sleep Powder utiliza
o estado de atordoamento por 2,3s para reproduzir o sono em combate.

Fontes: componentes de dash/Clash do Torre 2, impacto raster P2 e fragmentos
com física do Emerald MIT do módulo batch24. Zarza permanece referência visual,
sem copiar código/sprites não licenciados. Ver registros no move-reuse-policy.json.

Preservar os golpes originais e os aprovados, sem placeholders. Aprová-los
somente após inspeção visual real nas batalhas.

## Atualização visual e aprovação (23/10/2026)
- Cinco golpes salvos com aprovação explícita: Fire Punch, Cross Chop, Aerial Ace, Ice Punch e Thunder Punch. Não redesenhar.
- Poison Punch: golpe personalizado (não oficial de FireRed), mesmo punho e contato aprovado, apenas roxo e veneno no impacto, aguardando aprovação visual.
- Flame Wheel: refeito conforme a descrição original FireRed: Pokémon se envolve em chamas e avança fisicamente. Fonte: https://bulbapedia.bulbagarden.net/wiki/Flame_Wheel_(move) e https://pokemondb.net/move/flame-wheel.
- Protect: escudo de pixels facetados. Light Screen: ampla parede de proteção psíquica refratada.
- Psychic: impacto psíquico grande, duplo anel de runas e estilhaços.
- Rain Dance: camada fixada na câmera cobre toda arena proporcionalmente, inclusive fullscreen.
- São nove golpes ainda visíveis em NEW, preservando os cinco aprovados.

## Surf Torre 1 remasterizado (23/10/2026)
- **Aprovados pelo usuário:** Rain Dance (chuva global), Sand Attack e Sleep Powder. Não modificar animação nem mecânica. Junto dos cinco já aprovados, total de 8 golpes protegidos neste lote.
- **Surf antigo do Torre 2:** rejeitado; não restaurar. Surf novo continua em NEW.
- **Fonte realmente reutilizada do Torre 1:** `effects/moves/_runtime/semantic-vfx.js` (mapeamento Surf -> wave), silhueta de sete pontos, altura `43+37*sin(π*t)`, avanço de crista espiralada e nove gotas animadas; referência de renderização reescrita em `tools/pokearena/torre2-finale13.js#surfRemastered`.
- No Phaser/WebGL o corpo da onda é pintado por bandas retangulares pixeladas, com espuma, crista arqueada e 12 poses; não depende de SVG, Canvas2D ou imagem estática.
- O dano acontece uma única vez quando a frente visual da onda realmente cruza o Pokémon rival; misses e ausência de contato não causam dano.
- Os golpes aprovados e os saves permanecem intactos.

## Patch de acabamento (23/10/2026)
- Aprovados pelo usuário: **Surf**, **Flame Wheel**. **Poison Jab** já estava aprovado; confirmado novamente sem alterar seu renderer. Junto dos cinco golpes físicos e Rain Dance/Sand Attack/Sleep Powder, ficam 10 aprovações neste lote de Kanto.
- **Protect:** uma única parede retangular **verde**, borda escura discreta, sem octágonos e sem decoração; bloqueio nativo preservado. Referência Gen III: https://pokemon.fandom.com/wiki/Protect.
- **Light Screen:** uma única parede retangular **roxa**, simples e legível; redução de 50% do dano especial por 7,5s preservada. Referência: https://pokemondb.net/move/light-screen.
- **Psychic:** poder canônico Gen III 90 e dano 22 (antes 18); runas mais densas, choque com três ondas e breve trepidação apenas no impacto real. Sem dano automático.
- Apenas Psychic, Protect, Light Screen e Poison Punch continuam na aba NEW, para julgamento visual do usuário. Não afetar Surf e Flame Wheel aprovados.
