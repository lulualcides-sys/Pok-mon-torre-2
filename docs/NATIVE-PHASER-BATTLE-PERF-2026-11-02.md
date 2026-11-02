# Pokémon Torre 2 — perfil de combate normal e otimização segura (02/11/2026)

## Ambiente e limites

Teste automatizado do **combate nativo Phaser/WebGL**, entrando pelo botão real da campanha com Bulbasaur contra Pidgey, nos dois perfis: Chromium 1280×720 desktop e Chromium 854×480 com toque emulado. A renderização usada no CI é **SwiftShader (software)**, não GPU Android ou desktop real. Os valores oscilam conforme o runner, portanto cada valor de FPS ou milissegundo é uma **amostra**, e não uma promessa ou benchmark real do jogador.

Meta de produto: 60 FPS/16,67ms de quadro quando compatível e ao menos 30 FPS/33,33ms em aparelhos mais limitados. Não comprometer os VFX existentes, a tela VS de 2,5 segundos, as 3 oscilações de captura, saves, treino, combate, lojas ou regras de Pokémon Gen III para perseguir essas metas.

## Evidência de funcionamento anterior às correções

- [CI #41423602081](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41423602081): desktop 7,97s de clique a comando de combate, 19,52 FPS na amostra; mobile emulado 6,60s, 42,44 FPS.
- [CI #41423988866](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41423988866): desktop 8,63s, 16,60 FPS; mobile 6,87s, 38,74 FPS.
- [CI #41424812960](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41424812960): desktop 11,06s, 11,43 FPS; mobile 7,75s, 26,67 FPS. Todos entraram em combate e registraram zero exceções de JS/erros de fotograma.
- A versão da origem pode variar entre execuções (`src-...`): comparar métricas entre runs **não é A/B rigoroso**.

### Separação temporal da entrada

No perfil #41424812960, em torno de 3,8–3,9s depois do clique os dois lutadores e o instalador de HUD estavam prontos. Os 39 arquivos PMD das três espécies antecipados durante o VS tinham sido carregados em torno de 0,5–1,2s após o início. O estado `torre2-sendout` do arremesso inicial persistiu até ~7,47s no desktop e ~5,58s no mobile; em seguida houve estado `intro` da própria arena, prolongando a liberação dos comandos. Portanto **reduzir o inventário de animações não é a primeira correção correta**: o trecho maior está no relógio e nas transições gráficas.

## Alterações pontuais propostas nesta branch

1. Adaptar o empacotador às mudanças verificadas do cliente público (Pokébola `balls10.png`, roster local, importação de habilidades, tela inicial e regeneração passiva só da campanha). Esse código foi extraído sem importar o Laboratório REA da PR #459.
2. Manter o relógio original do Phaser com cap de 64ms para capturas, recall/KO e trocas, mas permitir até 180ms de recuperação na **primeira saída** de cada Pokémon, com leitura de `performance.now()` apenas nesse caso. Os gráficos `ballArc`, `drawRedBeam` e `drawReleaseBurst` não tiveram seus desenhos ou cores alterados.
3. A geometria de pixel do raio vermelho na **saída** tem origem e alvo fixos: construí-la uma única vez em um `Phaser.Graphics` de mesma profundidade e modular apenas `alpha`, mantendo os efeitos de burst em outra camada. O raio **móvel** durante recall continua sendo desenhado em tempo real.
4. Acrescentar testes de unidade de orçamento de quadros, pontos da curva, isolamento de primeira entrada, cache do raio e limpeza de objetos; coletar tempos da campanha, contagens de texturas, fases `intro`/`torre2-sendout`/`lucha`, percentis de frame e screenshots do jogo em desktop/mobile emulado.

**Importante:** um primeiro teste aumentando apenas o limite de `delta` de 64 para 180ms não mostrou melhora demonstrável porque o Phaser normaliza `delta` quando o navegador está lento. Daí a adição do relógio monotônico. Qualquer alegação de velocidade dependerá de validação posterior.

## Bloqueios de publicação

Não há prova de FPS real no telefone; a importação nativa também acusa duas requisições opcionais 404 em alguns builds (portada e música), sem evidência de que elas sejam o gargalo. Não substituir arte ou áudio sem inventário verificado.

A branch `perf/native-battle-entry-mobile-20261102` e a [PR #466](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/466) permanecem em rascunho e **não foram aplicadas ao jogo público**. Antes de mesclar, verificar todas as fases, resultados de dano, VS, Pokébola, capturas, KO e save, além de performance em aparelho com GPU real.
