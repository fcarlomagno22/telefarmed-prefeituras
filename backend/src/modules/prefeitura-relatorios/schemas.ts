import { z } from 'zod'

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const relatorioPeriodQuerySchema = z.object({
  periodStart: isoDateSchema,
  periodEnd: isoDateSchema,
  unidadeUbtId: z.string().uuid().optional(),
  regionKey: z.string().trim().optional(),
})

export const producaoUnidadeQuerySchema = relatorioPeriodQuerySchema

export const reportIdParamSchema = z.object({
  reportId: z.enum([
    'producao-unidade',
    'fila-espera-abandono',
    'agenda-comparecimento',
    'novos-cadastros',
    'cadastros-incompletos',
    'pacientes-inativos',
    'perfil-territorial',
    'retornos-pendentes',
    'ranking-ubts',
    'fluxo-terminal',
    'demanda-especialidade',
    'capacidade-ocupacao',
    'encaminhamentos-encaixes',
    'horarios-pico',
    'medicos-plantao',
    'duracao-media',
    'interrupcoes-reconexoes',
    'avaliacoes-atendimentos',
    'satisfacao-cidadao',
    'unidades-criticas',
  ]),
})
