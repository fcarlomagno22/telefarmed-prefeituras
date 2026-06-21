export type ConfigFaturamentoSus = {
  cnesExecutante?: string
  responsavelNome?: string
  responsavelSigla?: string
  responsavelCnpjCpf?: string
  destinatarioNome?: string
  destinoIndicador?: 'M' | 'E'
  versaoSistema?: string
}

export type BpaTeleconsultaInput = {
  consultaId: string
  codigoAtendimento: string
  competencia: string
  realizadoEm: string
  cnesExecutante: string
  profissionalCns: string
  profissionalCbo: string
  procedimentoCodigo: string
  pacienteNome: string
  pacienteNascimento: string
  pacienteSexo: string
  pacienteRacaCor: string | null
  pacienteNacionalidade: string | null
  pacienteIbge6: string
  pacienteCns: string | null
  pacienteCpf: string | null
  pacienteEndereco: Record<string, unknown>
  pacienteTelefone: string | null
  pacienteEmail: string | null
  situacaoRua: 'S' | 'N' | ' '
  clinicalCid: string | null
  folha: number
  sequencia: number
}

export type BpaValidationBlockReason =
  | 'cnes_ausente_ou_invalido'
  | 'config_instituicao_incompleta'
  | 'medico_sem_cns'
  | 'medico_sem_cbo'
  | 'cbo_incompativel_procedimento'
  | 'paciente_sem_cpf_e_sem_cns'
  | 'paciente_cpf_e_cns_simultaneos'
  | 'paciente_nome_ausente'
  | 'paciente_nascimento_ausente'
  | 'paciente_sexo_ausente'
  | 'paciente_raca_cor_ausente'
  | 'paciente_municipio_ausente'
  | 'consulta_fora_competencia'
  | 'consulta_nao_concluida'
  | 'consulta_nao_teleconsulta_medica'
  | 'duplicidade_teleconsulta'
  | 'quantidade_diferente_de_1'
  | 'procedimento_sigtap_invalido'
  | 'consulta_excluida_lote'

export type BpaValidationResult =
  | { ok: true; input: BpaTeleconsultaInput }
  | { ok: false; reasons: BpaValidationBlockReason[] }

export type BpaHeaderInput = {
  competencia: string
  totalRegistros: number
  totalFolhas: number
  responsavelNome: string
  responsavelSigla: string
  responsavelCnpjCpf: string
  destinatarioNome: string
  destinoIndicador: 'M' | 'E'
  versaoSistema: string
}

export type BpaExportBuildResult = {
  txtBody: string
  txtFilename: string
  includedCount: number
  blocked: Array<{
    consultaId: string
    codigoAtendimento: string
    patientName: string
    reasons: BpaValidationBlockReason[]
  }>
}

export type BpaInstitutionConfig = {
  cnesExecutante: string
  responsavelNome: string
  responsavelSigla: string
  responsavelCnpjCpf: string
  destinatarioNome: string
  destinoIndicador: 'M' | 'E'
  versaoSistema: string
}
