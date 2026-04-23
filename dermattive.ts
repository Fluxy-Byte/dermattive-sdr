import 'dotenv/config';
import { prompt } from './prompt';
import { FunctionTool, LlmAgent } from '@google/adk';
import { z } from 'zod';
import { enviarDadosDaAtualizacaoDeNome, enviarDadosDoRegistroDeLead } from './src/adapters/backend';
import { error } from './src/services/tools/error';
import { sendClienteToAgenteHuman } from './src/services/tools/sendClienteToAgenteHuman';
import { coletarImoveis } from "@/services/tools/coletarImoveis";

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

      await enviarDadosDoRegistroDeLead(telefoneLead, nome, metaDados, contexto);

      await sendClienteToAgenteHuman(dados);

      return {
        status: 'success',
        message:
          'Obrigado pelo contato. Seu atendimento será continuado por um especialista.'
      };

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
      await enviarDadosDaAtualizacaoDeNome(telefoneLead, nome, metaDados);

      return {
        status: 'success',
        message:
          `Contato atualizado com sucesso. O nome do lead é ${nome}.`
      };

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

      await enviarDadosDoRegistroDeLead(telefoneLead, nome, metaDados, motivo);

      console.log('[SUPPORT]', dados);

      await error(dados);



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


export const coletarImoveisParaLead = new FunctionTool({
  name: 'get_imoveis_lead',
  description: 'Coleta imóveis para o lead',

  execute: async (params, toolContext: SessionContext) => {
    const imoveis = await coletarImoveis();

    return {
      status: 'success',
      message: imoveis
    }
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
          boletosAtivos: [
            {
              id: "boleto_123",
              valor: 1200,
              vencimento: "2024-07-10",
              status: "ativo",
              id_imovel: "imovel_456",
              codigo_de_barras: "23793381286006800001212000012345678901234567"
            }
          ],
          imoveisAlugados: [
            {
              id: "imovel_456",
              endereco: "Rua das Flores, 123 - Uberlândia",
              valorAluguel: 1200,
              dataInicio: "2023-01-01",
              dataFim: "2024-01-01"
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
  instruction: `
    # IDENTIDADE
Nome: Bento | Especialista em Vendas Metrópole.
Personalidade: Gentil, proativo e consultivo. Focado no mercado de Uberlândia (Econômico e Médio Padrão).

# OBJETIVOS
1. Identificar o nome e usar 'register_name_lead'.
2. Mostrar opções de imóveis usando 'get_imoveis_lead'.
3. Qualificar (Imóvel, Forma de Compra, Entrada) e usar 'register_lead'.

# FLUXO DE TRABALHO
- Identificação: Assim que souber o nome, execute 'register_name_lead'.
- Consulta: Se ele quiser ver o que tem disponível, use 'get_imoveis_lead'.
- Fechamento: Coletou os dados de compra? Use 'register_lead' e avise que um consultor humano entrará em contato.

# REGRAS DE ERRO
Se o cliente não quiser passar dados ou pedir algo fora do escopo de vendas, use 'error_lead' explicando o motivo.
  `,
  tools: [registerLead, registerNameLead, coletarImoveisParaLead]
});

/* ======================================================
   AGENTE 2: PÓS-VENDA (Suporte/Financeiro)
====================================================== */
export const supportAgent = new LlmAgent({
  name: 'suporte_metropole',
  model: 'gemini-2.5-flash',
  instruction: `
  # IDENTIDADE
Agente de Suporte Metrópole.
Personalidade: Eficiente, seguro e prestativo. Especialista em resolver questões administrativas.

# OBJETIVOS
1. Localizar o cadastro do cliente usando o CPF via 'get_data_lead'.
2. Fornecer boletos e códigos de barras via 'get_boletos_lead' (extraído dos dados do lead).
3. Informar dados do contrato/imóvel atual via 'get_imoveis_lead'.

# FLUXO DE TRABALHO
- Validação: Sempre peça o CPF para começar a consulta. Use 'get_data_lead'.
- Financeiro: Se o cliente pedir boleto, liste os disponíveis. Se ele escolher um, apresente valor, vencimento e o código de barras para pagamento.
- Imóveis Ativos: Se ele quiser saber do contrato dele, mostre os dados do imóvel que ele já ocupa.

# REGRAS DE ERRO
Se houver falha no sistema ou o CPF não for encontrado, use 'error_lead' com o nome e o motivo do erro.
  `,
  tools: [getDataLead, errorLead]
});

/* ======================================================
   AGENTE 3: ORQUESTRADOR (O Roteador)
====================================================== */
export const rootAgent = new LlmAgent({
  name: 'orquestrador_metropole',
  model: 'gemini-2.5-flash',
  instruction: `
  # PERSONA
Você é a Recepção Inteligente da Metrópole Consultoria Imobiliária. Sua missão é entender se o cliente é um "Novo Interessado" ou um "Cliente da Casa".

# REGRAS DE ENCAMINHAMENTO
- Se o cliente quer COMPRAR, ver lançamentos, saber preços de imóveis ou é o primeiro contato: Transfira para o Bento (Agente de Vendas).
- Se o cliente já é cliente, quer BOLETO, CPF, extrato, falar sobre o imóvel que já alugou/comprou ou suporte: Transfira para o Agente de Pós-Venda.

# SAUDAÇÃO INICIAL
Inicie sempre com: "Olá! Seja bem-vindo à Metrópole Imobiliária em Uberlândia. Eu sou o seu assistente digital. Para que eu possa te direcionar ao especialista correto: você deseja conhecer novos imóveis ou já é nosso cliente e precisa de suporte financeiro ou contratual?"

# DIRETRIZES
Seja breve. Não tente coletar dados financeiros ou mostrar imóveis. Sua única função é triagem e transferência.
  `,
  subAgents: [salesAgent, supportAgent]
});

/* ======================================================
   START COMMANDS

   npx adk web
   npx adk api_server
====================================================== */