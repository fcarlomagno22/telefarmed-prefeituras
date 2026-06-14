import { z } from 'zod'

export const codigoAtendimentoParamSchema = z
  .string()
  .trim()
  .min(16, 'Código de atendimento inválido.')
  .max(64, 'Código de atendimento inválido.')
  .regex(/^[a-zA-Z0-9]+$/, 'Código de atendimento inválido.')

export const enviarPublicMensagemBodySchema = z.object({
  conteudo: z.string().trim().min(1).max(4000),
})

export const codigoVerificacaoParamSchema = z
  .string()
  .trim()
  .min(10, 'Código de verificação inválido.')
  .max(24, 'Código de verificação inválido.')
  .regex(/^[A-Za-z0-9]+$/, 'Código de verificação inválido.')
  .transform((value) => value.toUpperCase())

export const registrarAvaliacaoPublicaBodySchema = z.object({
  notaProfissional: z.number().int().min(1).max(5),
  comentarioProfissional: z.string().max(500).optional(),
  notaTeleconsulta: z.number().int().min(1).max(5),
  comentarioTeleconsulta: z.string().max(500).optional(),
})

export type RegistrarAvaliacaoPublicaBody = z.infer<typeof registrarAvaliacaoPublicaBodySchema>

export type PublicConsultaVideoTokenApi = {
  token: string
  roomName: string
  serverUrl: string
}
