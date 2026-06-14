import { z } from 'zod'

export const iniciarConsultaBodySchema = z.object({
  codigoAtendimento: z.string().trim().min(8).max(64),
  pacienteId: z.string().uuid(),
  especialidadeId: z.string().min(1).max(128),
  filaEsperaId: z.string().uuid().optional(),
  agendaConsultaId: z.string().uuid().optional(),
  profissionalId: z.string().uuid().optional(),
  tipo: z.enum(['consulta', 'retorno', 'primeira_consulta']).optional(),
  triagemResumo: z.string().max(4000).optional(),
})

export const entrarSalaEsperaBodySchema = z.object({
  codigoAtendimento: z.string().trim().min(8).max(64),
})

export const registrarAvaliacaoBodySchema = z.object({
  codigoAtendimento: z.string().trim().min(8).max(64),
  nota: z.number().int().min(1).max(5),
  comentario: z.string().max(2000).optional(),
})

export const overviewUbtConsultasQuerySchema = z.object({
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Período inválido.'),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Período inválido.'),
})

export const listUbtConsultasQuerySchema = z.object({
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Período inválido.'),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Período inválido.'),
  specialty: z.string().max(128).optional(),
  doctor: z.string().uuid().optional(),
  neighborhood: z.string().max(128).optional(),
  gender: z.enum(['F', 'M']).optional(),
  ageRange: z.enum(['0-17', '18-39', '40-59', '60+']).optional(),
  status: z.enum(['concluida', 'cancelada', 'em_andamento']).optional(),
  generalSearch: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
})

export type OverviewUbtConsultasQuery = z.infer<typeof overviewUbtConsultasQuerySchema>
export type ListUbtConsultasQuery = z.infer<typeof listUbtConsultasQuerySchema>

export type IniciarConsultaBody = z.infer<typeof iniciarConsultaBodySchema>
