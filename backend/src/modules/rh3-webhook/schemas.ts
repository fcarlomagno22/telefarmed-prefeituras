import { z } from 'zod'

export const RH3_CONSULTA_ESTADOS = ['D', 'A', 'S', 'C', 'L', 'F', 'V'] as const

export type Rh3ConsultaEstado = (typeof RH3_CONSULTA_ESTADOS)[number]

export const rh3ConsultaStatusWebhookSchema = z.object({
  tipo: z.literal('consulta'),
  id_turno: z.coerce.number().int().positive(),
  id_consulta_virtual: z.union([z.string(), z.number()]).optional(),
  id_estado: z.enum(RH3_CONSULTA_ESTADOS),
  fecha_estado: z.string().trim().min(1),
  descripcion_estado: z.string().trim().optional(),
  vc_token: z.string().trim().optional(),
  deeplink_paciente: z.string().url().optional(),
  deeplink_sala: z.string().url().optional(),
})

export type Rh3ConsultaStatusWebhookPayload = z.infer<typeof rh3ConsultaStatusWebhookSchema>
