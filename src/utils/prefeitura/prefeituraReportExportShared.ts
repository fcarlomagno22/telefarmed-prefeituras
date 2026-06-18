import { evolucaoNaRede } from '../../lib/entidadeBranding/copy'
import {
  applyEntidadeCopyToExportText,
  buildEntidadeExportReportStyles,
  escapeExportHtml,
  resolveEntidadeExportBranding,
  resolveExportAssetUrl,
  type EntidadeExportBranding,
} from '../entidadeExportHtml'

export function escapePrefeituraReportHtml(value: string): string {
  return escapeExportHtml(value)
}

export function buildPrefeituraReportStyles(
  branding: EntidadeExportBranding = resolveEntidadeExportBranding(),
  extra = '',
): string {
  return buildEntidadeExportReportStyles(branding) + extra
}

export function buildPrefeituraReportShell(
  report: {
    title: string
    description: string
    entidadeRazaoSocial: string
    periodLabel: string
    generatedBy: string
  },
  generatedAtLabel: string,
  body: string,
  branding: EntidadeExportBranding = resolveEntidadeExportBranding(),
  extraStyles = '',
): string {
  const logoUrl = resolveExportAssetUrl(branding.logoUrl)
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8" /><title>${escapeExportHtml(report.title)}</title><style>${buildPrefeituraReportStyles(branding, extraStyles)}</style></head><body><main><div class="brand-bar"></div><header class="header"><div><p class="eyebrow">Relatório operacional</p><h1>${escapeExportHtml(report.title)}</h1><p class="subtitle">${escapeExportHtml(report.description)}</p><div class="meta"><p><strong>${escapeExportHtml(report.entidadeRazaoSocial)}</strong> · ${escapeExportHtml(branding.brandName)}</p><p>Período: <strong>${escapeExportHtml(report.periodLabel)}</strong></p></div></div><img src="${escapeExportHtml(logoUrl)}" alt="${escapeExportHtml(branding.brandName)}" class="header-logo" /></header>${body}<footer class="footer"><p>Relatório gerado em <strong>${escapeExportHtml(generatedAtLabel)}</strong> por <strong>${escapeExportHtml(report.generatedBy)}</strong></p><p>${escapeExportHtml(report.description)}</p></footer></main></body></html>`
  return applyEntidadeCopyToExportText(html)
}

export function buildPrefeituraEvolutionCaption(
  mode: 'daily' | 'monthly',
  subject: string,
  branding: EntidadeExportBranding = resolveEntidadeExportBranding(),
): string {
  return evolucaoNaRede(branding.copy, mode, subject)
}

export function finalizePrefeituraExportHtml(html: string): string {
  return applyEntidadeCopyToExportText(html)
}
