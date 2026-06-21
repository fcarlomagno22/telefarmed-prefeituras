import {
  BPA_HEADER_LENGTH,
  BPA_LINEBREAK,
  BPA_RECORD_LENGTH,
} from './constants.js'
import { buildBpaFileContent } from './layout.js'
import {
  assignFolhaSequencia,
  BPA_BLOCK_REASON_LABELS,
  resolveInstitutionConfig,
  validateTeleconsultaForBpa,
  type TeleconsultaExportSource,
} from './validateTeleconsulta.js'
import type { BpaExportBuildResult, BpaInstitutionConfig } from './types.js'

export function buildBpaTeleconsultaExport(params: {
  competencia: string
  loteId: string | null
  entidadeNome: string
  entidadeCnpj: string
  configFaturamentoSus: unknown
  sources: TeleconsultaExportSource[]
}): BpaExportBuildResult {
  const institutionResult = resolveInstitutionConfig(
    params.configFaturamentoSus,
    params.entidadeNome,
    params.entidadeCnpj,
  )

  const blocked: BpaExportBuildResult['blocked'] = []
  const includedInputs = []

  if (!institutionResult.config) {
    for (const source of params.sources) {
      blocked.push({
        consultaId: source.consultaId,
        codigoAtendimento: source.codigoAtendimento,
        patientName: source.pacienteNome,
        reasons: institutionResult.reasons,
      })
    }

    return {
      txtBody: '',
      txtFilename: buildFilename(params.competencia, params.loteId),
      includedCount: 0,
      blocked,
    }
  }

  const institution = institutionResult.config

  for (const source of params.sources) {
    const validation = validateTeleconsultaForBpa(source, institution)
    if (!validation.ok) {
      blocked.push({
        consultaId: source.consultaId,
        codigoAtendimento: source.codigoAtendimento,
        patientName: source.pacienteNome,
        reasons: validation.reasons,
      })
      continue
    }

    includedInputs.push(validation.input)
  }

  const records = assignFolhaSequencia(includedInputs)
  const totalFolhas =
    records.length === 0 ? 0 : Math.ceil(records.length / 20)

  const txtBody =
    records.length === 0
      ? ''
      : buildBpaFileContent(
          {
            competencia: params.competencia,
            totalRegistros: records.length,
            totalFolhas,
            responsavelNome: institution.responsavelNome,
            responsavelSigla: institution.responsavelSigla,
            responsavelCnpjCpf: institution.responsavelCnpjCpf,
            destinatarioNome: institution.destinatarioNome,
            destinoIndicador: institution.destinoIndicador,
            versaoSistema: institution.versaoSistema,
          },
          records,
        )

  return {
    txtBody,
    txtFilename: buildFilename(params.competencia, params.loteId),
    includedCount: records.length,
    blocked,
  }
}

function buildFilename(competencia: string, loteId: string | null): string {
  const aaaamm = competencia.replace('-', '')
  return `BPA-I-TELE-${loteId ?? aaaamm}.txt`
}

export function buildBpaPendenciasRelatorio(params: {
  competencia: string
  loteId: string | null
  fechamentoId: string | null
  includedCount: number
  blocked: BpaExportBuildResult['blocked']
  institution: BpaInstitutionConfig | null
}): string {
  const lines = [
    `Relatório de pendências BPA-I — teleconsulta médica especializada`,
    `Competência: ${params.competencia}`,
    `Lote: ${params.loteId ?? '—'}`,
    `Fechamento: ${params.fechamentoId ?? '—'}`,
    `Registros exportados no TXT: ${params.includedCount}`,
    `Consultas bloqueadas: ${params.blocked.length}`,
    '',
  ]

  if (params.institution) {
    lines.push(
      '--- Instituição executante ---',
      `CNES: ${params.institution.cnesExecutante}`,
      `Responsável: ${params.institution.responsavelNome}`,
      `Sigla: ${params.institution.responsavelSigla}`,
      `CNPJ/CPF: ${params.institution.responsavelCnpjCpf}`,
      `Destinatário: ${params.institution.destinatarioNome}`,
      `Destino: ${params.institution.destinoIndicador}`,
      '',
    )
  }

  if (params.blocked.length === 0) {
    lines.push('Nenhuma pendência bloqueante para o TXT exportado.')
    return lines.join('\n')
  }

  lines.push('--- Pendências bloqueantes ---')
  for (const [index, item] of params.blocked.entries()) {
    lines.push(
      `${index + 1}. ${item.codigoAtendimento} — ${item.patientName}`,
      ...item.reasons.map(
        (reason) => `   - ${BPA_BLOCK_REASON_LABELS[reason] ?? reason}`,
      ),
      '',
    )
  }

  return lines.join('\n').trimEnd() + '\n'
}

export function measureBpaFileBytes(txtBody: string): number {
  if (!txtBody) return 0
  return Buffer.byteLength(txtBody, 'latin1')
}

export function assertBpaFileStructure(txtBody: string, expectedRecords: number): void {
  if (expectedRecords === 0) return

  const lines = txtBody.split(BPA_LINEBREAK).filter((line) => line.length > 0)
  if (lines.length !== expectedRecords + 1) {
    throw new Error(`Esperado ${expectedRecords + 1} linhas, obteve ${lines.length}.`)
  }

  if (lines[0].length !== BPA_HEADER_LENGTH) {
    throw new Error(`Cabeçalho com ${lines[0].length} caracteres.`)
  }

  for (const line of lines.slice(1)) {
    if (line.length !== BPA_RECORD_LENGTH) {
      throw new Error(`Registro com ${line.length} caracteres.`)
    }
  }
}

export { BPA_BLOCK_REASON_LABELS }
