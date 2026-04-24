# Derm'Attive — SDR Automatizado com Google ADK

Sistema de atendimento automatizado via WhatsApp para a Derm'Attive Cosméticos, construído com Google Agent Development Kit (ADK). Opera em dois modos: **ativo** (prospecção de novos contatos) e **receptivo** (atendimento de clientes que retornam).

---

## Visão Geral da Arquitetura

O sistema é composto por um agente orquestrador (Root) e quatro sub-agentes especializados. A cada mensagem recebida, o Root lê o histórico da conversa e decide qual sub-agente deve assumir o atendimento — o cliente nunca percebe essa troca.

```
WhatsApp (cliente)
        │
        ▼
  root_manager          ← Lê histórico e roteia
        │
        ├──► communication_activator   (sem histórico → prospecção ativa)
        ├──► opening_salesperson       (cliente receptivo → novo pedido)
        ├──► closing_sales             (interesse confirmado → fecha lista)
        └──► support                   (pós-venda → dúvidas e reclamações)
                                                │
                                                ▼
                                           Wellington
                                    (BDR humano — pagamento)
```

---

## Agentes

### `root_manager` — Orquestrador

Analisa o histórico completo da conversa e retorna internamente qual sub-agente deve assumir. **Nunca envia mensagens ao cliente.**

Regras de roteamento:

| Situação | Agente acionado |
|---|---|
| Sem histórico anterior (resposta ao template) | `communication_activator` |
| Cliente retorna querendo fazer um pedido | `opening_salesperson` |
| Interesse em comprar confirmado | `closing_sales` |
| Dúvidas de uso ou problema pós-venda | `support` |
| Ambiguidade entre venda e suporte | `support` (prioridade) |

> **Atenção:** O Root não recebe a tool `coletarProdutos`. Ele apenas roteia — quem executa ferramentas são os sub-agentes.

---

### `communication_activator` — SDR Ativo

Acionado quando não há histórico com o contato. O cliente está respondendo a um template de prospecção enviado pela equipe.

**Fluxo:**

1. Responde ao cumprimento do cliente de forma natural
2. Apresenta a Derm'Attive em até 3 blocos curtos (30 anos, 60+ produtos, fábrica em Uberlândia/MG)
3. Destaca o diferencial: qualidade de dermocosméticos com preço acessível
4. Pergunta se tem interesse em ver o catálogo
5. Se sim → transfere para `closing_sales`
6. Se não → encerra sem insistir
7. Se mencionar problema → transfere para `support`

---

### `opening_salesperson` — Vendas Receptivas

Acionado quando o cliente retorna por conta própria para fazer um pedido. Adapta o fluxo conforme o nível de conhecimento do cliente.

**Caso A — Cliente já sabe o que quer:**

1. Confirma o interesse no produto mencionado
2. Sugere no máximo 2 itens complementares (cross-sell via `coletarProdutos`)
3. Monta a lista e transfere para `closing_sales`

**Caso B — Cliente quer ver o catálogo:**

1. Pergunta pela categoria de interesse
2. Busca produtos via `coletarProdutos` e apresenta um por mensagem
3. Com produto(s) escolhido(s), transfere para `closing_sales`

> O agente nunca pergunta o que o histórico já deixou claro. Sempre consulte o histórico antes de fazer perguntas.

---

### `closing_sales` — Fechamento

Converte o interesse em uma lista de pedido concreta e passa para o Wellington finalizar o pagamento.

**Cenário 1 — Vindo do `communication_activator` (primeiro contato):**

1. Planta a oferta de 10% de desconto no primeiro pedido antes de mostrar o catálogo
2. Apresenta os produtos da categoria escolhida (um por mensagem, via `coletarProdutos`)
3. Coleta os itens de interesse um a um, confirmando cada adição
4. Apresenta a lista consolidada para validação do cliente
5. Encaminha ao Wellington com: nome do cliente + lista + flag `PRIMEIRO PEDIDO - 10% DESCONTO`

**Cenário 2 — Vindo do `opening_salesperson` (pedido recorrente):**

1. Confirma a lista recebida
2. Encaminha ao Wellington com: nome do cliente + lista

> O desconto de 10% é exclusivo para clientes vindos do fluxo ativo (primeiro pedido). Não aplicar para pedidos recorrentes sem orientação específica.

---

### `support` — Suporte Pós-Venda

Atende questões pós-compra. Resolve o que pode e encaminha o restante ao Wellington com contexto completo.

**Dúvidas de uso:**

- Busca instruções via `coletarProdutos`
- Responde de forma prática e direta
- Verifica se a dúvida foi resolvida antes de encerrar

**Reclamações e problemas logísticos:**

1. Valida sem prometer resolução
2. Coleta o contexto completo (produto/pedido + descrição do problema)
3. Encaminha ao Wellington com: nome + problema + contexto do histórico

> **Regra crítica:** Nunca encaminhe ao Wellington sem ter no mínimo o nome do cliente e a descrição do problema. Em caso de reação adversa a produto, vá direto para o encaminhamento — prioridade máxima.

> **Limitação:** O `support` não tem autonomia para autorizar reembolsos, reenvios ou descontos. Toda resolução de crise é responsabilidade do Wellington.

---

## Ferramenta Disponível

### `coletarProdutos`

Utilizada pelos sub-agentes de vendas e suporte para buscar produtos do catálogo Derm'Attive.

- `salesOpen` — busca por categoria para apresentar opções
- `salesClosed` — busca por categoria durante a montagem da lista
- `support` — busca instruções de uso de produtos específicos
- `root_manager` — **não utiliza** esta ferramenta

---

## Configuração dos Agentes

```typescript
import { LlmAgent } from '@google/adk';

export const activator = new LlmAgent({
  name: 'communication_activator',
  model: 'gemini-2.5-flash',
  instruction: promptActive,
  tools: [coletarProdutos]
});

export const salesOpen = new LlmAgent({
  name: 'opening_salesperson',
  model: 'gemini-2.5-flash',
  instruction: promptSalesOpen,
  tools: [coletarProdutos]
});

export const salesClosed = new LlmAgent({
  name: 'closing_sales',
  model: 'gemini-2.5-flash',
  instruction: promptSalesClose,
  tools: [coletarProdutos]
});

export const support = new LlmAgent({
  name: 'support',
  model: 'gemini-2.5-flash',
  instruction: promptHelp,
  tools: [coletarProdutos]
});

export const rootAgent = new LlmAgent({
  name: 'root_manager',
  model: 'gemini-2.5-flash',
  instruction: promptRoot,
  subAgents: [activator, salesOpen, salesClosed, support]
  // Sem tools — root apenas roteia
});
```

> **Ordem dos subAgents:** A ordem importa para o ADK em caso de ambiguidade. `activator` primeiro (fluxo mais frequente), `support` por último (fluxo de exceção).

---

## Requisito Crítico: Gerenciamento de Sessão

O Root toma decisões de roteamento com base no histórico da conversa. Para que isso funcione corretamente, **cada contato deve ter um `session_id` consistente e persistente** entre as mensagens.

Se o histórico não for injetado no contexto do Root a cada chamada, o agente não consegue identificar o estado da conversa e aciona o `communication_activator` em toda mensagem — inclusive para clientes no meio de uma compra.

```
session_id = identificador único por número de WhatsApp
```

O histórico completo da sessão deve ser passado em cada requisição ao Root.

---

## Convenções de Comunicação

**`[QB]` — Quebra de bloco**

Usado nos prompts para simular pausas naturais do WhatsApp. Cada `[QB]` representa uma mensagem separada enviada ao cliente. Nunca envie mais de 3 linhas em um único bloco.

**Apresentação de produtos**

Cada produto é enviado em uma mensagem separada com `[QB]` entre eles. Nunca use listas numeradas no WhatsApp — apresente em blocos corridos.

**Encaminhamento ao Wellington**

O número do Wellington é `5534999763000`. Todo encaminhamento deve incluir o contexto registrado: nome do cliente, interesse ou problema, e flag de contexto quando aplicável (ex: `PRIMEIRO PEDIDO - 10% DESCONTO`).

---

## Fluxos Completos

### Fluxo Ativo (prospecção)

```
Template enviado → Cliente responde
        │
        ▼
  communication_activator
  ├── Apresenta Derm'Attive (resumo)
  ├── Pergunta interesse no catálogo
  │
  ├── [SIM] → closing_sales
  │             ├── Oferta 10% desconto
  │             ├── Apresenta catálogo por categoria
  │             ├── Monta lista de pedido
  │             └── Encaminha Wellington + flag PRIMEIRO PEDIDO
  │
  └── [NÃO] → Encerra cordialmente
```

### Fluxo Receptivo (cliente retorna)

```
Cliente entra em contato
        │
        ▼
  root_manager (lê histórico)
        │
  opening_salesperson
  ├── [Sabe o que quer] → cross-sell → closing_sales → Wellington
  └── [Não sabe] → apresenta catálogo → closing_sales → Wellington
```

### Fluxo de Suporte

```
Cliente menciona problema/dúvida
        │
        ▼
  root_manager → support
  ├── [Dúvida de uso] → resolve com coletarProdutos → encerra
  └── [Reclamação] → coleta contexto → encaminha Wellington com contexto completo
```

---

## Estrutura de Arquivos Sugerida

```
/
├── agents/
│   └── index.ts          # Definição e exportação de todos os agentes
├── prompts/
│   ├── promptRoot.ts
│   ├── promptActive.ts
│   ├── promptSalesOpen.ts
│   ├── promptSalesClose.ts
│   └── promptHelp.ts
├── tools/
│   └── coletarProdutos.ts
└── README.md
```