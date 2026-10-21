# Pokémon Torre 2 — Smog multi-impact e todos os três golpes aprovados

Data: 21/10/2026

## Aprovação explícita
O usuário aprovou **Sing, Crabhammer e Smog** e confirmou que **todos os efeitos nativos do Poké Arena 2D estão aprovados e são intocáveis**. As três entradas agora levam `approved:true`, e os 11 específicos anteriores continuam aprovados, sem mudança.

## Ajuste final de Smog
- Mantém a fumaça roxa da última versão; apenas as 17 bolhas receberam trajetórias mais espaçadas.
- As bolhas saem com atraso individual e fan horizontal/vertical ligeiramente ampliado.
- **Cada bolha possui detecção de contato própria**, desaparece ao acertar e causa **23% do dano-base configurado**, com impacto pixelado curto. Assim o ataque não inflige 17 vezes o dano original.
- Bolha que passa longe não causa dano. Sem aplicação automática de dano por nuvem.
- Chance de veneno (40%) é checada somente no primeiro contato válido, evitando probabilidade quase garantida por múltiplos impactos.
- Foco em sensação e sequência tipo Pay Day/Bubble sem copiar ou tocar na implementação deles.

## Regra permanente
Nunca substituir/alterar visual, física ou código de golpe nativo do Poké Arena 2D. Nunca modificar qualquer dos 14 efeitos específicos aprovados sem ordem explícita do usuário. Modificações deste patch limitadas a `torre2-species-fx.js`, `torre2-move-pool.js` e testes/documentação.
