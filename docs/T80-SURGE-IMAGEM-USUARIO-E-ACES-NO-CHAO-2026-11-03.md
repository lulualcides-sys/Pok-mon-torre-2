# T80 — Lt. Surge com a imagem enviada pelo usuário; Pokémon alinhados aos líderes

**Escopo: apenas branch de homologação, nunca main/Pages sem autorização expressa de publicação.**

## Arte do ginásio elétrico

O usuário enviou a imagem original `1001008531.png` em 2026-11-03, com as quatro plataformas de adversários vazias, o palco superior do líder e a entrada inferior. A imagem enviada foi importada como **um override**, sem regeneração por IA ou modificação das 60 WebPs anteriores.

- Fonte SHA-256: `6ad10368ae69d1be43a07ad31aecafce21e4a8a076c37eac2e73f6271653d469`.
- Override: `assets/ui/kanto-overrides/gym-surge-user.webp`, 1280×720; metadados e checksum em `gym-surge-user.json`.
- O arquivo original `assets/ui/kanto-approved-maps/kanto/gym-surge.webp` continua byte a byte igual e verificável. Apenas a rota de exibição `gym-surge` usa o override.
- A importação temporária via GitHub Actions foi concluída e o workflow de importação foi retirado, para não incluir URL temporária no runtime.
- O cliente Phaser faz fail-closed no build se o fundo alterado não corresponder ao hash do arquivo do usuário.

## Sprites interativos separados do mapa

Quatro classes FireRed originais nos quatro palcos (Sailor, Rocker, Gentleman e Worker M), mais o sprite original Lt. Surge e Raichu PMD Idle. A disposição segue as quatro plataformas da imagem do usuário. Nenhum NPC é desenhado permanentemente no WebP. O roteiro, índices dos quatro treinadores, equipe real `Voltorb / Pikachu / Raichu`, dinheiro, insígnias e save não mudam.

## Correção compartilhada de Pokémon “flutuando”

O sprite PMD pode conter linhas transparentes abaixo do Pokémon, de modo que `originY=1` faz parecer que ele levita. `torre2-gym-ace-ground.js` mede a última linha opaca da primeira célula Idle para assentar a base visível, não o limite externo da imagem. A coordenada vertical também coincide com a do líder. Aplicado a Starmie, Onix, Raichu e Weezing. Vileplume preserva seu ponto calibrado e usa o mesmo plano vertical do líder.

A animação Idle continua em pixels nítidos; a forma e as propriedades dos Pokémon não mudam.

## Testes de aceitação

- Testes Node de hash/manifesto e 60 artes originais intocadas, plano do Surge e cálculo de pés opacos.
- T41 valida a integração com o cliente nativo e os testes anteriores.
- Guardião Visual Chromium desktop e mobile: visita o Surge pela porta real de Vermilion, verifica 4 sprites FRLG originais, líder e Raichu PMD no plano vertical; captura screenshots; mede Erika/Vileplume, Brock/Onix, Misty/Starmie e Koga/Weezing. O resultado deve ser **PASS** antes de incorporar na homologação.
- Build isolado de homologação deve passar após o fast-forward. Não considerar testes controlados prova de concluir campanha natural.

As imagens aprovadas do projeto são referências de trabalho e podem conter propriedade intelectual de terceiros; lançamento público exige revisão apropriada dos direitos.
