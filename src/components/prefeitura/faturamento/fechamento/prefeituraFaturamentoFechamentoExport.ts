import type { ExportFormat } from '../../../ui/ExportFormatMenu'
import type {
  PrefeituraFaturamentoFechamentoLoteItem,
  PrefeituraFaturamentoFechamentoRecord,
  PrefeituraFaturamentoFechamentoSummary,
} from '../../../../types/prefeituraFaturamentoFechamento'
import {
  formatFechamentoCompetenciaLabel,
  formatFechamentoDateTime,
} from './prefeituraFaturamentoFechamentoUi'
import { formatFechamentoTipoLabel, getLoteItemsForRecord, getPrincipalRecord } from './prefeituraFaturamentoComplementoUi'
import { formatPendenciaConsultaDate } from '../pendencias/prefeituraFaturamentoPendenciasUi'

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function escapeCsv(value: string) {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function activeLoteForRecord(
  record: PrefeituraFaturamentoFechamentoRecord,
  loteItems: PrefeituraFaturamentoFechamentoLoteItem[],
  records: PrefeituraFaturamentoFechamentoRecord[],
) {
  const principal = getPrincipalRecord(records, record.competencia)
  return getLoteItemsForRecord(record, loteItems, principal).filter((item) => !item.excluded)
}

export function downloadFechamentoBpaMock(
  record: PrefeituraFaturamentoFechamentoRecord,
  loteItems: PrefeituraFaturamentoFechamentoLoteItem[],
  records: PrefeituraFaturamentoFechamentoRecord[],
  format: ExportFormat,
) {
  const activeLote = activeLoteForRecord(record, loteItems, records)
  const competenciaLabel = formatFechamentoCompetenciaLabel(record.competencia)
  const baseName = `BPA-SUS-${record.loteId ?? record.competencia}`

  if (format === 'excel') {
    const header = [
      'competencia',
      'tipo_lote',
      'lote_id',
      'fechamento_id',
      'consulta_id',
      'data_consulta',
      'paciente',
      'cpf',
      'profissional',
      'unidade',
      'cnes',
      'sigtap',
      'procedimento',
    ].join(',')

    const rows = activeLote.map((item) =>
      [
        record.competencia,
        formatFechamentoTipoLabel(record),
        record.loteId ?? '',
        record.fechamentoId ?? '',
        item.consultaId,
        formatPendenciaConsultaDate(item.consultaDate),
        item.patientName,
        item.patientCpf ?? '',
        item.professionalName,
        item.unitName,
        item.cnes,
        item.procedureCode,
        item.procedureName,
      ]
        .map((value) => escapeCsv(String(value)))
        .join(','),
    )

    const blob = new Blob(['\uFEFF' + [header, ...rows].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    })
    triggerDownload(blob, `${baseName}.csv`)
    return
  }

  const lines = [
    'BOLETIM DE PRODUÇÃO AMBULATORIAL (BPA) — MOCK',
    `Competência: ${competenciaLabel}`,
    `Lote: ${record.loteId ?? '—'}`,
    `Fechamento: ${record.fechamentoId ?? '—'}`,
    `Consultas no lote: ${activeLote.length}`,
    '',
    ...activeLote.map(
      (item, index) =>
        `${index + 1}. ${item.consultaId} · ${item.patientName} · SIGTAP ${item.procedureCode}`,
    ),
  ]

  triggerDownload(
    new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' }),
    `${baseName}.txt`,
  )
}

export function downloadFechamentoRelatorioMock(
  record: PrefeituraFaturamentoFechamentoRecord,
  summary: PrefeituraFaturamentoFechamentoSummary,
  loteItems: PrefeituraFaturamentoFechamentoLoteItem[],
  records: PrefeituraFaturamentoFechamentoRecord[],
) {
  const activeLote = activeLoteForRecord(record, loteItems, records)
  const excludedCount = loteItems.filter(
    (item) => item.competencia === record.competencia && item.excluded,
  ).length

  const lines = [
    'RELATÓRIO DE FECHAMENTO SUS — MOCK',
    '',
    `Competência: ${summary.competenciaLabel}`,
    `Tipo: ${formatFechamentoTipoLabel(record)}`,
    `Status: ${record.status}`,
    `ID do fechamento: ${record.fechamentoId ?? '—'}`,
    `Lote SUS: ${record.loteId ?? '—'}`,
    `Fechado por: ${record.closedBy ?? '—'}`,
    `Fechado em: ${formatFechamentoDateTime(record.closedAt)}`,
    `Exportado em: ${formatFechamentoDateTime(record.exportedAt)}`,
    `Última revalidação: ${formatFechamentoDateTime(record.lastRevalidationAt)}`,
    '',
    '--- Resumo ---',
    `Consultas realizadas na competência: ${summary.realizadas}`,
    `Consultas elegíveis pré-selecionadas: ${summary.elegiveis}`,
    `Consultas consolidadas no lote: ${record.consultasNoLote ?? activeLote.length}`,
    `Consultas excluídas manualmente: ${excludedCount}`,
    `Bloqueantes registradas no fechamento: ${record.bloqueantesRegistrados ?? summary.bloqueantes}`,
    `Ignoradas / não faturáveis: ${summary.ignoradas}`,
    '',
    '--- Observação ---',
    'Após o fechamento, o lote fica consolidado. Novas consultas da competência exigem fechamento complementar ou reabertura administrativa.',
  ]

  triggerDownload(
    new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' }),
    `relatorio-fechamento-${record.competencia}.txt`,
  )
}
