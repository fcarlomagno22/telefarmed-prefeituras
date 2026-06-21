export type PrefeituraFaturamentoRegraSusCheckStatus = 'ok' | 'fail' | 'warning'

export type PrefeituraFaturamentoRegraSusCheckId =
  | 'paciente_cns_valido'
  | 'paciente_nome_completo'
  | 'paciente_data_nascimento'
  | 'paciente_sexo'
  | 'paciente_nacionalidade'
  | 'paciente_municipio_ibge'
  | 'profissional_cns'
  | 'profissional_cbo_informado'
  | 'profissional_cbo_compativel'
  | 'profissional_ativo'
  | 'profissional_vinculo_cnes'
  | 'profissional_conselho_regular'
  | 'consulta_atendimento_realizado'
  | 'consulta_horarios_inicio_fim'
  | 'consulta_prontuario_encerrado'
  | 'consulta_profissional_executante'
  | 'consulta_sem_duplicidade'
  | 'consulta_nao_cancelada'
  | 'consulta_paciente_nao_falta'
  | 'procedimento_sigtap_informado'
  | 'procedimento_vigente_competencia'
  | 'procedimento_instrumento_compativel'
  | 'procedimento_idade_sexo'
  | 'procedimento_cid_obrigatorio'
  | 'procedimento_quantidade_limite'
  | 'procedimento_teleatendimento'
  | 'procedimento_permitido_cnes'

export type PrefeituraFaturamentoRegraSusCheckItem = {
  id: PrefeituraFaturamentoRegraSusCheckId
  label: string
  status: PrefeituraFaturamentoRegraSusCheckStatus
  statusLabel: string
  fieldValue: string
  detail?: string
  canCorrect?: boolean
}

export type PrefeituraFaturamentoRegraSusCheckSection = {
  id: 'paciente' | 'profissional' | 'consulta' | 'procedimento'
  title: string
  items: PrefeituraFaturamentoRegraSusCheckItem[]
}

export type PrefeituraFaturamentoRegraSusChecklist = {
  sections: PrefeituraFaturamentoRegraSusCheckSection[]
  totalChecks: number
  passedChecks: number
  failedChecks: number
  warningChecks: number
  faturavel: boolean
}
