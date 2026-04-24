import 'dotenv/config';
import { promptActive, promptHelp, promptRoot, promptSalesClose, promptSalesOpen, promptReceptor } from './prompt';
import { FunctionTool, LlmAgent } from '@google/adk';
import { getProductsApi } from "./src/services/tools/getProducts"
import { z } from 'zod';

/* ======================================================
   TYPES
====================================================== */

type SessionContext = any;


/* ======================================================
   REGISTER LEAD TOOL
====================================================== */

export const registerLead = new FunctionTool({
  name: 'register_lead',
  description: 'Registra um lead B2B qualificado produtos da Cardoso Motos',
  parameters: z.object({
    nome: z.string().min(2, 'Nome inválido'),
    contexto: z.string().min(10, 'Contexto insuficiente'),
    imovel: z.string().min(2, 'Imovel inválido'),
    formaDeCompra: z.string().min(2, 'Forma de compra inválida'),
    valorDeEntrada: z.string().optional(),

  }),

  execute: async (params, toolContext: SessionContext) => {
    try {
      const {
        nome,
        contexto,
        imovel,
        formaDeCompra,
        valorDeEntrada
      } = params;

      const session = toolContext?.invocationContext?.session;

      const telefoneLead = session?.id ?? JSON.stringify(session);

      /* ===============================
         LOG ESTRUTURADO
      =============================== */

      console.log('[NEW LEAD]', {
        nome,
        contexto,
        imovel,
        formaDeCompra,
        valorDeEntrada
      });

      /* ===============================
         PAYLOAD
      =============================== */

      const dados = {
        nome,
        produto: contexto,
        imovel,
        formaDeCompra,
        valorDeEntrada,

        telefone: telefoneLead,

        nomeAgente:
          process.env.NOME_AGENTE_VENDAS ?? 'Agente Gamefic',

        telefoneAgente:
          process.env.NUMBER_VENDAS ?? '5534997801829'
      };

      const metaDados = {
        display_phone_number: "553491713923",
        phone_number_id: "872884792582393"
      }

      return {
        status: 'success',
        message:
          'Obrigado pelo contato. Seu atendimento será continuado por um especialista.'
      };

      // await enviarDadosDoRegistroDeLead(telefoneLead, nome, metaDados, contexto);

      // await sendClienteToAgenteHuman(dados);

      // return {
      //   status: 'success',
      //   message:
      //     'Obrigado pelo contato. Seu atendimento será continuado por um especialista.'
      // };

    } catch (err) {
      console.error('[REGISTER ERROR]', err);

      return {
        status: 'error',
        message:
          'Falha ao registrar lead. Tente novamente.'
      };
    }
  }
});

export const coletarProdutos = new FunctionTool({
  name: 'get_products_lead',
  description: 'Coleta produtos para o lead',

  execute: async (params, toolContext: SessionContext) => {
    const products = await getProductsApi();
    return products;
  }
});


export const getDataLead = new FunctionTool({
  name: 'get_data_lead',
  description: 'Recupera os dados do lead a partir do telefone',

  parameters: z.object({
    cpf: z.string().min(11, 'CPF inválido')
  }),

  execute: async (params, toolContext: SessionContext) => {
    const { cpf } = params;

    if (cpf == '16095357667') {
      return {
        status: 'success',
        message: 'Lead encontrado',
        lead: {
          nome: "João Silva",
          cpf: "16095357667",
          telefone: "5534997801829",
          email: "joao.silva@email.com",
          compras: [
            {
              createAt: "2026-04-17T16:37:29.795Z",
              updateAt: "2026-04-18T06:37:29.795Z",
              status: "Em separação",
              transportadora: "Mercado livre",
              nome_produto: "Sabonete liquido 200ml CX 12U",
              valor_produto: "105,99",
              dataEstimada: "2026-04-20T00:00:00.000Z"
            }
          ]
        }
      }
    }

    return {
      status: 'error',
      message: 'Lead não encontrado',
      lead: null
    }
  }
})


/* ======================================================
   AGENTE 1: Ativa o interesse no cliente
   - Recebe clientes sem histórico (resposta ao template)
   - Apresenta a Derm'Attive e desperta interesse
   - Transfere para salesClosed se houver sinal positivo
====================================================== */
export const activator = new LlmAgent({
  name: 'communication_activator',
  model: 'gemini-2.5-flash',
  instruction: promptActive,
  tools: [coletarProdutos]
});

/* ======================================================
   AGENTE 2: Inicia a venda (clientes receptivos)
   - Clientes que já conhecem a marca e querem comprar
   - Identifica se o cliente sabe o que quer ou não
   - Transfere para salesClosed com a lista de interesse
====================================================== */
export const salesOpen = new LlmAgent({
  name: 'opening_salesperson',
  model: 'gemini-2.5-flash',
  instruction: promptSalesOpen,
  tools: [coletarProdutos]
});

/* ======================================================
   AGENTE 3: Fecha a venda
   - Recebe de activator (primeiro pedido c/ 10% desconto)
   - Recebe de salesOpen (pedido recorrente)
   - Monta lista e passa ao Wellington para pagamento
====================================================== */
export const salesClosed = new LlmAgent({
  name: 'closing_sales',
  model: 'gemini-2.5-flash',
  instruction: promptSalesClose,
  tools: [coletarProdutos]
});

/* ======================================================
   AGENTE 4: Suporte pós-venda
   - Resolve dúvidas de uso via get_products_info
   - Encaminha reclamações ao Wellington com contexto
====================================================== */
export const support = new LlmAgent({
  name: 'support',
  model: 'gemini-2.5-flash',
  instruction: promptHelp,
  tools: [coletarProdutos]
});

/* ======================================================
   AGENTE 5: Clientes receptivos
   - Indetifica intenções dos clientes que ja tiveram contato
   e direciona para o local definido
====================================================== */
export const receptor = new LlmAgent({
  name: 'receptor',
  model: 'gemini-2.5-flash',
  instruction: promptReceptor,
  tools: [coletarProdutos]
});


/* ======================================================
   ORQUESTRADOR: Root Manager
   - Lê o histórico a cada mensagem
   - Roteia para o sub-agente correto
   - NUNCA fala diretamente com o cliente
   
   ATENÇÃO: O rootAgent NÃO precisa da tool coletarProdutos
   pois ele apenas roteia — quem busca produtos são os sub-agentes.
   
   ORDEM dos subAgents importa: o ADK tenta na sequência
   declarada em caso de ambiguidade. Deixe activator primeiro
   pois é o fluxo mais frequente (prospecção ativa).
====================================================== */
export const rootAgent = new LlmAgent({
  name: 'root_manager',
  model: 'gemini-2.5-flash',
  instruction: promptRoot,
  subAgents: [activator, salesOpen, salesClosed, support, receptor]
  // ↑ Sem tools aqui — root só orquestra, não executa
});


/* ======================================================
   START COMMANDS

   npx adk web
   npx adk api_server
====================================================== */