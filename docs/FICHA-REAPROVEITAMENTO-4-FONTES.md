# Ficha obrigatória — comprovação de reaproveitamento por golpe

Preencher **antes de programar** o golpe. A ausência de uma das quatro fontes requer justificativa, verificação de licença e aprovação explícita do usuário antes de seguir com exceção.

| Campo | Valor |
|---|---|
| Golpe novo / nome canônico | |
| Confirmação de que está AUSENTE do P2 e do T2 atuais (hash/commit) | |
| Referência da mecânica oficial | |
| Padrão de sprite/fases/escala | |
| Contato físico, mira, precisão e dano | |
| Teste visual e FPS Android | |
| Aprovação visual do usuário | Pendente |

### Evidência individual de cada fonte

| Fonte | Recurso específico (nome, arquivo e função) | Reutilização REAL no arquivo local (função/arquivo) | Licença / atribuição | Status |
|---|---|---|---|---|
| T2 | | | | Estudado / realmente reutilizado / indisponível |
| P2 | | | | Estudado / realmente reutilizado / indisponível |
| Zarza | | | | Estudado / realmente reutilizado / indisponível |
| Emerald Arena | | | | Estudado / realmente reutilizado / indisponível |

Afirmar "reaproveitado" apenas com técnica incorporada, arquivo/função de origem e integração verificáveis. **Inspirar-se em arte/cor não equivale a reutilizar componente.** Se só desenho novo foi produzido, marcar não conforme e pedir revisão.

### Como registrar no JSON

Adicionar uma entrada em `data/move-reuse-policy.json` > `newMoves` no formato:

```json
{
  "id-do-golpe": {
    "review": "ready-for-visual-review",
    "sources": {
      "T2": {
        "mode": "reused",
        "upstream": "tools/pokearena/torre2-algum-fx.js#funcao",
        "local": "tools/pokearena/torre2-novo-fx.js#funcao",
        "license": "Projeto T2 (não editar arte aprovada)",
        "contribution": "Descrever com precisão a função adaptada"
      },
      "P2": {
        "mode": "reused",
        "upstream": "captura P2/habilidades.js#ClasseDoGolpe",
        "local": "tools/pokearena/torre2-novo-fx.js#funcao",
        "license": "Autorização de escopo comprovado",
        "contribution": "Qual componente real foi portado"
      },
      "Z": {
        "mode": "reused",
        "upstream": "pokemonzarza.com/poke-arena-beams.js#funcao",
        "local": "tools/pokearena/torre2-novo-fx.js#funcao",
        "license": "Verificar permissão para redistribuição",
        "contribution": "Qual componente real foi portado"
      },
      "E": {
        "mode": "reused",
        "upstream": "github.com/GBurgardt/pokemon-emerald-arena/arquivo#funcao",
        "local": "tools/pokearena/torre2-novo-fx.js#funcao",
        "license": "Código novo MIT, preservar aviso",
        "contribution": "Qual rotina MIT foi adaptada"
      }
    }
  }
}
```

Quando algum material não puder ser portado por licença, incompatibilidade ou inexistência, marcar `mode: "exception"`, acrescentar `reason`, `reviewedUpstream`, `userApprovedException: true` somente **após autorização explícita**, e nunca dizer que essa fonte foi efetivamente utilizada. O validador bloqueia exceções sem essa autorização registrada.

**Os três golpes de aço criados em 23/10 (Flash Cannon, Steel Beam e Mirror Shot) continuam pendentes de adaptação real. Não são exemplo de quatro fontes efetivamente reutilizadas.**
