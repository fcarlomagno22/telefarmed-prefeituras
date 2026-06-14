import { z } from 'zod'

export const pinBodySchema = z.object({
  pin: z.string().trim().min(6).max(6),
})

export const idParamSchema = z.object({
  id: z.string().uuid(),
})

export const cnpjParamSchema = z.object({
  cnpj: z.string().trim().min(11).max(18),
})

export const listFechamentosQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z
    .enum(['all', 'aberto', 'em_apuracao', 'pre_fechado', 'fechado', 'reaberto'])
    .optional()
    .default('all'),
  modalidade: z.string().trim().optional().default('all'),
  competencia: z.string().trim().optional().default('all'),
})

export const listBalancoQuerySchema = z.object({
  viewMode: z.enum(['consolidado', 'competencia', 'periodo']).optional().default('consolidado'),
  competencia: z.string().trim().optional(),
  dataInicial: z.string().trim().optional(),
  dataFinal: z.string().trim().optional(),
})

export const createCentroCustoBodySchema = z.object({
  nome: z.string().trim().min(1).max(120),
})

export const createFornecedorBodySchema = z.object({
  cnpj: z.string().trim().min(11),
  razaoSocial: z.string().trim().min(1).max(200),
  situacao: z.enum(['ativa', 'inativa', 'nao_informado']).default('nao_informado'),
  contatoEmail: z.string().trim().max(200).default(''),
  contatoTelefone: z.string().trim().max(40).default(''),
  pessoaContato: z.string().trim().max(120).default(''),
  observacoes: z.string().trim().max(2000).default(''),
})

export const updateFornecedorBodySchema = createFornecedorBodySchema.extend({
  id: z.string().uuid(),
})

export const createContaPagarBodySchema = z.object({
  fornecedorId: z.string().uuid(),
  descricao: z.string().trim().min(1).max(300),
  centroCustoId: z.string().uuid(),
  recorrencia: z.enum(['mensal', 'unica']),
  valor: z.number().positive(),
  vencimento: z.string().trim().min(8).max(10),
})

export const updateContaPagarBodySchema = z.object({
  pin: z.string().trim().min(6).max(6),
  descricao: z.string().trim().min(1).max(300),
  centroCustoId: z.string().uuid(),
  recorrencia: z.enum(['mensal', 'unica']),
  valor: z.number().positive(),
  vencimento: z.string().trim().min(8).max(10),
  motivoAjuste: z.string().trim().max(2000).optional(),
})

export const upsertBalancoAjusteBodySchema = z.object({
  valorConsolidado: z.number(),
})

export const approveRepasseBodySchema = z.object({
  valorAprovadoCentavos: z.number().int().min(0),
  motivoAjuste: z.string().trim().max(2000).nullable().optional(),
})

export const repasseMotivoBodySchema = z.object({
  motivo: z.string().trim().min(3).max(2000),
})

export const repassePlantaoDecisaoParamsSchema = z.object({
  id: z.string().uuid(),
  plantaoId: z.string().uuid(),
})

export const repassePlantaoDecisaoBodySchema = z.object({
  decisao: z.enum(['aprovado', 'aprovado_parcial', 'indeferido']),
  observacao: z.string().trim().max(2000).optional().default(''),
})

export const toggleContaPagarBodySchema = pinBodySchema

export const deleteFornecedorBodySchema = pinBodySchema

export const deleteContaPagarBodySchema = pinBodySchema

export const deleteReceberBodySchema = pinBodySchema

export const toggleReceberBodySchema = pinBodySchema

export const clearBalancoAjusteBodySchema = pinBodySchema
