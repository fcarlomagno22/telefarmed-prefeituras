export type ConsultarCrmRegistro = {
  uf: string
  numero_registro: string
  categoria: string
  nome_razao_social: string
}

export type ConsultarCrmResolved = {
  conselhoSigla: 'CRM'
  conselhoNumero: string
  conselhoUf: string
  nomeRazaoSocial: string
}

export type ConsultarCrmErrorBody = {
  error?: string
  message?: string
}
