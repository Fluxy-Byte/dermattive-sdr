import 'dotenv/config';
import { promptSales, promptHelp, promptRoot } from './prompt';
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


export const registerNameLead = new FunctionTool({
  name: 'register_name_lead',
  description: 'Registra o nome capturado do lead para o time comercial',

  parameters: z.object({
    nome: z.string().min(2, 'Nome inválido')
  }),

  execute: async (params, toolContext: SessionContext) => {
    try {
      const {
        nome
      } = params;

      const session = toolContext?.invocationContext?.session;

      const telefoneLead = session?.id ?? JSON.stringify(session);

      /* ===============================
         LOG ESTRUTURADO
      =============================== */

      console.log('[Atualizado nome do Lead]', {
        nome
      });

      /* ===============================
         PAYLOAD
      =============================== */

      const metaDados = {
        display_phone_number: "553491713923",
        phone_number_id: "872884792582393"
      }

      return {
        status: 'success',
        message:
          `Contato atualizado com sucesso. O nome do lead é ${nome}.`
      };
      // await enviarDadosDaAtualizacaoDeNome(telefoneLead, nome, metaDados);

    } catch (err) {
      console.error('[REGISTER ERROR]', err);

      return {
        status: 'error',
        message:
          'Falha ao registrar nome do lead. Tente novamente.'
      };
    }
  }
});


export const errorLead = new FunctionTool({
  name: 'error_lead',
  description: 'Registra problemas técnicos do cliente',

  parameters: z.object({
    nome: z.string().min(2),
    motivo: z.string().min(5),
  }),

  execute: async (params, toolContext: SessionContext) => {
    try {
      const { nome, motivo } = params;

      const session = toolContext?.invocationContext?.session

      const telefoneLead = session?.id ?? JSON.stringify(session);

      const dados = {
        nome,
        motivo,
        telefone: telefoneLead,
        nomeAgente:
          process.env.NOME_AGENTE_SUPORTE ?? 'Suporte Cardoso',

        telefoneAgente:
          process.env.NUMBER_SUPORTE ?? '5534997801829'
      };

      const metaDados = {
        display_phone_number: "553491713923",
        phone_number_id: "872884792582393"
      }

      // await enviarDadosDoRegistroDeLead(telefoneLead, nome, metaDados, motivo);

      return {
        status: 'success',
        message:
          `Obrigado, ${nome}. Nosso suporte já recebeu sua solicitação.`
      };

    } catch (err) {
      console.error('[SUPPORT ERROR]', err);

      return {
        status: 'error',
        message:
          'Erro ao registrar suporte.'
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
   AGENTE 1: VENDAS (Bento)
====================================================== */
export const salesAgent = new LlmAgent({
  name: 'vendas_metropole',
  model: 'gemini-2.5-flash', // Recomendo usar o 1.5 ou 2.0
  instruction: promptSales,
  tools: [coletarProdutos]
});

/* ======================================================
   AGENTE 2: PÓS-VENDA (Suporte/Financeiro)
====================================================== */
export const supportAgent = new LlmAgent({
  name: 'suporte_metropole',
  model: 'gemini-2.5-flash',
  instruction: promptHelp,
  tools: [coletarProdutos]
});

/* ======================================================
   AGENTE 3: ORQUESTRADOR (O Roteador)
====================================================== */
export const rootAgent = new LlmAgent({
  name: 'orquestrador_metropole',
  model: 'gemini-2.5-flash',
  instruction: promptRoot,
  subAgents: [salesAgent, supportAgent]
});

/* ======================================================
   START COMMANDS

   npx adk web
   npx adk api_server
====================================================== */