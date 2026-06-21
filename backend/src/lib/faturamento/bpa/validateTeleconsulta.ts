import { isValidCns } from '../../cns.js'
import { competenciaFromDate } from '../pendenciaCatalog.js'
import {
  BPA_RECORDS_PER_SHEET,
  BPA_VERSAO_SISTEMA_DEFAULT,
  TELECONSULTA_ESPECIALIZADA_PROCEDIMENTO,
} from './constants.js'
import {
  formatCnes,
  formatCns15,
  formatCpf11,
  formatIbge6,
  mapRacaCorBpa,
  mapSexoBpa,
} from './formatters.js'
import type {
  BpaInstitutionConfig,
  BpaTeleconsultaInput,
  BpaValidationBlockReason,
  BpaValidationResult,
  ConfigFaturamentoSus,
} from './types.js'

export type TeleconsultaExportSource = {
  consultaId: string
  codigoAtendimento: string
  competencia: string
  status: string
  realizadoEm: string
  excluded: boolean
  profissionalFormacao: string | null
  profissionalCns: string | null
  profissionalCbo: string | null
  cboCompativel: boolean
  procedimentoCodigo: string | null
  pacienteNome: string
  pacienteNascimento: string | null
  pacienteSexo: string | null
  pacienteRacaCor: string | null
  pacienteNacionalidade: string | null
  pacienteCns: string | null
  pacienteCnsPendente: boolean
  pacienteCpf: string | null
  pacienteEndereco: Record<string, unknown>
  pacienteTelefone: string | null
  pacienteEmail: string | null
  situacaoRua: 'S' | 'N' | ' ' | null
  clinicalCid: string | null
  duplicateConsultaId: string | null
}

export function parseConfigFaturamentoSus(raw: unknown): ConfigFaturamentoSus {
  if (!raw || typeof raw !== 'object') return {}
  const value = raw as Record<string, unknown>
  const destino = value.destinoIndicador
  return {
    cnesExecutante:
      typeof value.cnesExecutante === 'string' ? value.cnesExecutante : undefined,
    responsavelNome:
      typeof value.responsavelNome === 'string' ? value.responsavelNome : undefined,
    responsavelSigla:
      typeof value.responsavelSigla === 'string' ? value.responsavelSigla : undefined,
    responsavelCnpjCpf:
      typeof value.responsavelCnpjCpf === 'string' ? value.responsavelCnpjCpf : undefined,
    destinatarioNome:
      typeof value.destinatarioNome === 'string' ? value.destinatarioNome : undefined,
    destinoIndicador: destino === 'M' || destino === 'E' ? destino : undefined,
    versaoSistema:
      typeof value.versaoSistema === 'string' ? value.versaoSistema : undefined,
  }
}

export function resolveInstitutionConfig(
  raw: unknown,
  entidadeNome: string,
  entidadeCnpj: string,
): { config: BpaInstitutionConfig | null; reasons: BpaValidationBlockReason[] } {
  const parsed = parseConfigFaturamentoSus(raw)
  const reasons: BpaValidationBlockReason[] = []

  const cnesExecutante = formatCnes(parsed.cnesExecutante)
  if (!cnesExecutante) reasons.push('cnes_ausente_ou_invalido')

  const responsavelNome = parsed.responsavelNome?.trim() || entidadeNome.trim()
  const responsavelSigla = parsed.responsavelSigla?.trim() || 'SMS'
  const responsavelCnpjCpf = parsed.responsavelCnpjCpf?.trim() || entidadeCnpj.trim()
  const destinatarioNome = parsed.destinatarioNome?.trim() || entidadeNome.trim()
  const destinoIndicador = parsed.destinoIndicador ?? 'M'
  const versaoSistema = parsed.versaoSistema?.trim() || BPA_VERSAO_SISTEMA_DEFAULT

  if (!responsavelNome || !responsavelSigla || !responsavelCnpjCpf || !destinatarioNome) {
    reasons.push('config_instituicao_incompleta')
  }

  if (reasons.length > 0) {
    return { config: null, reasons }
  }

  return {
    config: {
      cnesExecutante: cnesExecutante!,
      responsavelNome,
      responsavelSigla,
      responsavelCnpjCpf,
      destinatarioNome,
      destinoIndicador,
      versaoSistema,
    },
    reasons: [],
  }
}

function resolvePacienteDocumento(source: TeleconsultaExportSource): {
  cns: string | null
  cpf: string | null
  reasons: BpaValidationBlockReason[]
} {
  const reasons: BpaValidationBlockReason[] = []
  const cpf = formatCpf11(source.pacienteCpf)
  const cnsDigits = source.pacienteCns?.replace(/\D/g, '') ?? ''
  const cnsValido =
    !source.pacienteCnsPendente &&
    cnsDigits.length === 15 &&
    isValidCns(cnsDigits)
      ? cnsDigits
      : null

  if (cpf && cnsValido) {
    reasons.push('paciente_cpf_e_cns_simultaneos')
  }

  if (!cpf && !cnsValido) {
    reasons.push('paciente_sem_cpf_e_sem_cns')
  }

  return {
    cns: cpf ? null : cnsValido,
    cpf: cnsValido ? null : cpf,
    reasons,
  }
}

export function validateTeleconsultaForBpa(
  source: TeleconsultaExportSource,
  institution: BpaInstitutionConfig,
): BpaValidationResult {
  const reasons: BpaValidationBlockReason[] = []

  if (source.excluded) {
    reasons.push('consulta_excluida_lote')
  }

  if (source.status !== 'concluida') {
    reasons.push('consulta_nao_concluida')
  }

  if (source.profissionalFormacao !== 'medicina') {
    reasons.push('consulta_nao_teleconsulta_medica')
  }

  if (source.procedimentoCodigo !== TELECONSULTA_ESPECIALIZADA_PROCEDIMENTO) {
    reasons.push('procedimento_sigtap_invalido')
  }

  if (competenciaFromDate(source.realizadoEm) !== source.competencia) {
    reasons.push('consulta_fora_competencia')
  }

  if (source.duplicateConsultaId) {
    reasons.push('duplicidade_teleconsulta')
  }

  const profissionalCns = formatCns15(source.profissionalCns)
  if (!profissionalCns) {
    reasons.push('medico_sem_cns')
  }

  const profissionalCbo = source.profissionalCbo?.trim() ?? ''
  if (!profissionalCbo) {
    reasons.push('medico_sem_cbo')
  } else if (!source.cboCompativel) {
    reasons.push('cbo_incompativel_procedimento')
  }

  const documento = resolvePacienteDocumento(source)
  reasons.push(...documento.reasons)

  if (!source.pacienteNome.trim() || source.pacienteNome.trim().split(/\s+/).length < 2) {
    reasons.push('paciente_nome_ausente')
  }

  if (!source.pacienteNascimento?.trim()) {
    reasons.push('paciente_nascimento_ausente')
  }

  if (!mapSexoBpa(source.pacienteSexo)) {
    reasons.push('paciente_sexo_ausente')
  }

  if (!mapRacaCorBpa(source.pacienteRacaCor)) {
    reasons.push('paciente_raca_cor_ausente')
  }

  const ibge6 = formatIbge6(
    typeof source.pacienteEndereco.ibge === 'string'
      ? source.pacienteEndereco.ibge
      : typeof source.pacienteEndereco.codigoIbge === 'string'
        ? source.pacienteEndereco.codigoIbge
        : typeof source.pacienteEndereco.codigo_ibge === 'string'
          ? source.pacienteEndereco.codigo_ibge
          : null,
  )
  if (!ibge6) {
    reasons.push('paciente_municipio_ausente')
  }

  if (!formatCnes(institution.cnesExecutante)) {
    reasons.push('cnes_ausente_ou_invalido')
  }

  const uniqueReasons = [...new Set(reasons)]
  if (uniqueReasons.length > 0) {
    return { ok: false, reasons: uniqueReasons }
  }

  return {
    ok: true,
    input: {
      consultaId: source.consultaId,
      codigoAtendimento: source.codigoAtendimento,
      competencia: source.competencia,
      realizadoEm: source.realizadoEm,
      cnesExecutante: institution.cnesExecutante,
      profissionalCns: profissionalCns!,
      profissionalCbo: profissionalCbo,
      procedimentoCodigo: TELECONSULTA_ESPECIALIZADA_PROCEDIMENTO,
      pacienteNome: source.pacienteNome,
      pacienteNascimento: source.pacienteNascimento!,
      pacienteSexo: source.pacienteSexo!,
      pacienteRacaCor: source.pacienteRacaCor,
      pacienteNacionalidade: source.pacienteNacionalidade,
      pacienteIbge6: ibge6!,
      pacienteCns: documento.cns,
      pacienteCpf: documento.cpf,
      pacienteEndereco: source.pacienteEndereco,
      pacienteTelefone: source.pacienteTelefone,
      pacienteEmail: source.pacienteEmail,
      situacaoRua: source.situacaoRua ?? ' ',
      clinicalCid: source.clinicalCid,
      folha: 1,
      sequencia: 1,
    },
  }
}

export function assignFolhaSequencia(records: BpaTeleconsultaInput[]): BpaTeleconsultaInput[] {
  return records.map((record, index) => {
    const folha = Math.floor(index / BPA_RECORDS_PER_SHEET) + 1
    const sequencia = (index % BPA_RECORDS_PER_SHEET) + 1
    return { ...record, folha, sequencia }
  })
}

export const BPA_BLOCK_REASON_LABELS: Record<BpaValidationBlockReason, string> = {
  cnes_ausente_ou_invalido: 'CNES executante ausente ou inválido',
  config_instituicao_incompleta: 'Configuração institucional incompleta para o BPA',
  medico_sem_cns: 'Médico sem CNS',
  medico_sem_cbo: 'Médico sem CBO',
  cbo_incompativel_procedimento: 'CBO incompatível com 0301010307 na competência SIGTAP',
  paciente_sem_cpf_e_sem_cns: 'Paciente sem CPF e sem CNS',
  paciente_cpf_e_cns_simultaneos: 'CPF e CNS informados simultaneamente',
  paciente_nome_ausente: 'Nome completo ausente',
  paciente_nascimento_ausente: 'Data de nascimento ausente',
  paciente_sexo_ausente: 'Sexo ausente ou inválido',
  paciente_raca_cor_ausente: 'Raça/cor ausente ou inválida',
  paciente_municipio_ausente: 'Município IBGE ausente ou inválido',
  consulta_fora_competencia: 'Consulta fora da competência',
  consulta_nao_concluida: 'Consulta não concluída',
  consulta_nao_teleconsulta_medica: 'Consulta não é teleconsulta médica em atenção especializada',
  duplicidade_teleconsulta: 'Duplicidade da mesma teleconsulta',
  quantidade_diferente_de_1: 'Quantidade diferente de 1',
  procedimento_sigtap_invalido: 'Procedimento SIGTAP diferente de 0301010307',
  consulta_excluida_lote: 'Consulta excluída do lote',
}
