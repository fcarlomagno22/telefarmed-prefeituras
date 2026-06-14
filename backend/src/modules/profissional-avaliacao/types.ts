export type ConsultaAvaliacaoRow = {
  id: string
  consulta_id: string
  nota: number
  comentario: string | null
  avaliado_em: string
  nota_profissional: number | null
  comentario_profissional: string | null
}

export type ConsultaOperacionalAvaliacaoRow = {
  id: string
  codigo_atendimento: string
  paciente_nome: string | null
  paciente_foto_url: string | null
}

export type ProfissionalReviewRow = {
  id: string
  consultaId: string
  consultaRef: string
  rating: 1 | 2 | 3 | 4 | 5
  patientName: string
  patientPhotoUrl: string
  comment: string
  createdAtIso: string
}
