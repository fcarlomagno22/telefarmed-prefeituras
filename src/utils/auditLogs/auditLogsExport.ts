import { brand } from '../../config/brand'
import type { AuditLogEntry, AuditLogSeverity } from '../../data/auditLogsMock'
import { auditLogPlatformLabels } from '../../components/auditoria/auditLogPlatformConfig'
import {
  formatAuditPrefeituraLabel,
  formatAuditUbtLabel,
} from '../../components/auditoria/auditLogTenantDisplay'
import type { AuditLogTenantColumnMode } from '../../types/auditLogScope'
import { downloadWindowAsPdf, pdfFilenameFromLabel } from '../htmlDocumentToPdf'

export type AuditLogsExportContext = {
  entries: AuditLogEntry[]
  filterSummaryLines: string[]
  operatorName: string
  unitLabel: string
  showPlatformColumn?: boolean
  tenantColumnMode?: AuditLogTenantColumnMode
}

const SEVERITY_LABELS: Record<AuditLogSeverity, string> = {
  info: 'Informativo',
  warning: 'Aviso',
  critical: 'Crítico',
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function resolveAssetUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${window.location.origin}${normalized}`
}

function formatGeneratedAt(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function buildReportStyles() {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #fff;
      line-height: 1.4;
    }
    main { max-width: 1100px; margin: 0 auto; padding: 28px 32px 36px; }
    .brand-bar { height: 5px; background: #ff6b00; border-radius: 999px; margin-bottom: 20px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
    .header-logo { height: 32px; width: auto; max-width: 140px; object-fit: contain; }
    .header-fallback { font-size: 18px; font-weight: 700; color: #ff6b00; }
    .doc-title { font-size: 20px; font-weight: 700; color: #111827; }
    .doc-meta { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .summary { margin-top: 16px; font-size: 13px; color: #374151; }
    .filters { margin-top: 12px; padding: 12px 14px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 12px; color: #4b5563; }
    .filters ul { margin: 6px 0 0; padding-left: 18px; }
    .table-wrap { margin-top: 20px; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #f9fafb; text-align: left; padding: 10px 8px; font-weight: 600; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
    td { padding: 9px 8px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    .severity-critical { color: #dc2626; font-weight: 600; }
    .severity-warning { color: #ea580c; font-weight: 600; }
    .severity-info { color: #2563eb; font-weight: 600; }
    .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 10px; color: #9ca3af; }
  `
}

function buildAuditLogsReportHtml(context: AuditLogsExportContext) {
  const generatedAt = formatGeneratedAt(new Date())
  const logoUrl = resolveAssetUrl(brand.logoUrl)
  const filtersBlock =
    context.filterSummaryLines.length > 0
      ? `<div class="filters"><strong>Filtros aplicados</strong><ul>${context.filterSummaryLines
          .map((line) => `<li>${escapeHtml(line)}</li>`)
          .join('')}</ul></div>`
      : ''

  const platformHeader = context.showPlatformColumn ? '<th>Plataforma</th>' : ''
  const tenantHeader =
    context.tenantColumnMode === 'full'
      ? '<th>Prefeitura</th><th>UBT</th>'
      : context.tenantColumnMode === 'ubt'
        ? '<th>UBT</th>'
        : ''
  const tableRows = context.entries
    .map((entry) => {
      const severityClass = `severity-${entry.severity}`
      const platformCell = context.showPlatformColumn
        ? `<td>${escapeHtml(auditLogPlatformLabels[entry.platform])}</td>`
        : ''
      const tenantCells =
        context.tenantColumnMode === 'full'
          ? `<td>${escapeHtml(formatAuditPrefeituraLabel(entry.prefeituraName))}</td><td>${escapeHtml(formatAuditUbtLabel(entry.ubtName))}</td>`
          : context.tenantColumnMode === 'ubt'
            ? `<td>${escapeHtml(formatAuditUbtLabel(entry.ubtName))}</td>`
            : ''
      return `<tr>
        <td class="${severityClass}">${escapeHtml(SEVERITY_LABELS[entry.severity])}</td>
        ${platformCell}
        ${tenantCells}
        <td>${escapeHtml(entry.dateTime)}</td>
        <td>${escapeHtml(entry.userName)}<br/><span style="color:#6b7280;font-size:10px">${escapeHtml(entry.userRole)}</span></td>
        <td>${escapeHtml(entry.actionLabel)}<br/><span style="color:#6b7280;font-size:10px">${escapeHtml(entry.httpMethod)}</span></td>
        <td>${escapeHtml(entry.moduleName)}<br/><span style="color:#6b7280;font-size:10px">${escapeHtml(entry.pagePath)}</span></td>
        <td>${escapeHtml(entry.resourceLabel)}<br/><span style="color:#6b7280;font-size:10px">${escapeHtml(entry.resourceId)}</span></td>
        <td>${escapeHtml(entry.serverResponse)}</td>
        <td>${escapeHtml(entry.ipAddress)}<br/><span style="color:#6b7280;font-size:10px">${escapeHtml(entry.deviceInfo)}</span></td>
      </tr>`
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <style>${buildReportStyles()}</style>
</head>
<body>
  <main>
    <div class="brand-bar"></div>
    <header class="header">
      <div>
        <img class="header-logo" src="${escapeHtml(logoUrl)}" alt="${escapeHtml(brand.appName)}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'" />
        <div class="header-fallback" style="display:none">${escapeHtml(brand.appName)}</div>
      </div>
      <div style="text-align:right">
        <h1 class="doc-title">Logs de auditoria</h1>
        <p class="doc-meta">Gerado em ${escapeHtml(generatedAt)}</p>
      </div>
    </header>

    <p class="doc-meta" style="margin-top:12px">
      <strong>Unidade:</strong> ${escapeHtml(context.unitLabel)} ·
      <strong>Operador:</strong> ${escapeHtml(context.operatorName)}
    </p>

    <p class="summary">
      <strong>${new Intl.NumberFormat('pt-BR').format(context.entries.length)}</strong>
      evento${context.entries.length === 1 ? '' : 's'} neste relatório
    </p>

    ${filtersBlock}

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Severidade</th>
            ${platformHeader}
            ${tenantHeader}
            <th>Data e hora</th>
            <th>Usuário</th>
            <th>Ação</th>
            <th>Página / Módulo</th>
            <th>Recurso</th>
            <th>Resposta</th>
            <th>IP / Dispositivo</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>

    <footer class="footer">
      <span>${escapeHtml(brand.copyright)}</span>
      <span>${escapeHtml(brand.appName)} · Documento gerado automaticamente</span>
    </footer>
  </main>
</body>
</html>`
}

function openExportWindow(html: string, title: string): Window {
  const documentHtml = html.includes('<title>')
    ? html
    : html.replace('<head>', `<head><title>${escapeHtml(title)}</title>`)

  const exportWindow = window.open('', '_blank')
  if (!exportWindow) {
    throw new Error('Permita pop-ups neste site para exportar o relatório em PDF.')
  }

  exportWindow.document.open()
  exportWindow.document.write(documentHtml)
  exportWindow.document.close()
  return exportWindow
}

function waitForExportWindowReady(targetWindow: Window) {
  return new Promise<void>((resolve) => {
    if (targetWindow.document.readyState === 'complete') {
      resolve()
      return
    }
    targetWindow.addEventListener('load', () => resolve(), { once: true })
  })
}

export async function exportAuditLogsPdf(context: AuditLogsExportContext) {
  const stamp = new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  const filename = pdfFilenameFromLabel('logs-auditoria', stamp)
  const title = `Logs de auditoria — ${stamp}`
  const html = buildAuditLogsReportHtml(context)
  const exportWindow = openExportWindow(html, title)

  try {
    await waitForExportWindowReady(exportWindow)
    await new Promise<void>((resolve) => {
      window.setTimeout(() => resolve(), 350)
    })
    await downloadWindowAsPdf(exportWindow, { filename })
  } finally {
    exportWindow.close()
  }
}

function csvCell(value: string | number) {
  const text = String(value)
  return `"${text.replace(/"/g, '""')}"`
}

export function exportAuditLogsExcel(context: AuditLogsExportContext) {
  const header = [
    'Severidade',
    ...(context.showPlatformColumn ? ['Plataforma'] : []),
    ...(context.tenantColumnMode === 'full' ? ['Prefeitura', 'UBT'] : []),
    ...(context.tenantColumnMode === 'ubt' ? ['UBT'] : []),
    'Data e hora',
    'Usuário',
    'Função',
    'Ação',
    'Método HTTP',
    'Módulo',
    'Página',
    'Recurso',
    'ID recurso',
    'Resposta servidor',
    'IP',
    'Dispositivo',
  ]

  const rows = context.entries.map((entry) => [
    SEVERITY_LABELS[entry.severity],
    ...(context.showPlatformColumn ? [auditLogPlatformLabels[entry.platform]] : []),
    ...(context.tenantColumnMode === 'full'
      ? [
          formatAuditPrefeituraLabel(entry.prefeituraName),
          formatAuditUbtLabel(entry.ubtName),
        ]
      : []),
    ...(context.tenantColumnMode === 'ubt' ? [formatAuditUbtLabel(entry.ubtName)] : []),
    entry.dateTime,
    entry.userName,
    entry.userRole,
    entry.actionLabel,
    entry.httpMethod,
    entry.moduleName,
    entry.pagePath,
    entry.resourceLabel,
    entry.resourceId,
    entry.serverResponse,
    entry.ipAddress,
    entry.deviceInfo,
  ])

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => csvCell(cell)).join(';'))
    .join('\r\n')

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const stamp = new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
    .format(new Date())
    .replace(/[^\d]/g, '')
  link.href = url
  link.download = `logs-auditoria-${stamp}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function labelFromFilterOptions(
  options: readonly { value: string; label: string }[],
  value: string,
) {
  if (!value) return null
  return options.find((item) => item.value === value)?.label ?? value
}
