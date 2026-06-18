import { brand } from '../config/brand'
import {
  applyEntidadeCopyReplacements,
  buildEntidadeCopy,
  type EntidadeCopy,
} from '../lib/entidadeBranding/copy'
import {
  buildEntidadeBrandingPresentation,
  resolvePlatformOperatorLabel,
} from '../lib/entidadeBranding/resolve'
import type { EntidadeBrandingFields, EntidadeTerminologia } from '../types/entidadeBranding'
import { buildDefaultEntidadeBranding } from '../types/entidadeBranding'

export type EntidadeExportBranding = {
  brandName: string
  logoUrl: string
  corPrimaria: string
  platformOperatorLabel: string
  copy: EntidadeCopy
  terminologia: EntidadeTerminologia
}

let cachedExportBranding: EntidadeExportBranding | null = null

export function setEntidadeExportBranding(branding: EntidadeExportBranding | null) {
  cachedExportBranding = branding
}

export function entidadeExportBrandingFromFields(
  fields: EntidadeBrandingFields | null,
): EntidadeExportBranding {
  const presentation = buildEntidadeBrandingPresentation(fields)
  const terminologia = presentation.terminologia
  return {
    brandName: presentation.displayName,
    logoUrl: presentation.logoUrl,
    corPrimaria: presentation.corPrimaria,
    platformOperatorLabel: presentation.platformOperatorLabel,
    copy: presentation.copy,
    terminologia,
  }
}

export function resolveEntidadeExportBranding(): EntidadeExportBranding {
  if (cachedExportBranding) return cachedExportBranding
  const terminologia = buildDefaultEntidadeBranding({ nomeExibicao: '' }).terminologia
  const copy = buildEntidadeCopy(terminologia, 'prefeitura')
  return {
    brandName: brand.appName,
    logoUrl: brand.logoUrl,
    corPrimaria: brand.primaryColor,
    platformOperatorLabel: brand.appName,
    copy,
    terminologia,
  }
}

export function escapeExportHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function resolveExportAssetUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path
  }
  return `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`
}

export function buildEntidadeExportBaseStyles(corPrimaria: string): string {
  return `:root { --brand-primary: ${corPrimaria}; }`
}

/** Estilos compartilhados de relatórios PDF/HTML — sem #ff6b00 hardcoded. */
export function buildEntidadeExportReportStyles(
  branding: EntidadeExportBranding = resolveEntidadeExportBranding(),
): string {
  const { corPrimaria } = branding
  return buildEntidadeExportBaseStyles(corPrimaria) + `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827; background: #fff; line-height: 1.45; }
    main { max-width: 1100px; margin: 0 auto; padding: 28px 32px 36px; border: 1px solid #e5e7eb; border-radius: 16px; background: #fff; }
    .brand-bar { height: 4px; background: ${corPrimaria}; border-radius: 999px; margin-bottom: 20px; }
    .header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
    .header img { height: 36px; width: auto; }
    .header-logo { height: 36px; width: auto; max-height: 40px; }
    .header-fallback { font-size: 18px; font-weight: 700; color: ${corPrimaria}; }
    .eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af; }
    h1 { font-size: 24px; font-weight: 700; color: #111827; margin-top: 4px; }
    h2 { font-size: 14px; font-weight: 700; color: #111827; border-bottom: 2px solid ${corPrimaria}; padding-bottom: 8px; margin-bottom: 14px; }
    .subtitle { margin-top: 4px; font-size: 13px; color: #6b7280; max-width: 42rem; }
    .meta { margin-top: 12px; font-size: 12px; color: #6b7280; }
    .meta p + p { margin-top: 4px; }
    section { margin-top: 28px; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
    .card { border: 1px solid #e5e7eb; border-radius: 12px; background: #f8fafc; padding: 16px; text-align: center; }
    .card-label { font-size: 12px; color: #6b7280; font-weight: 500; }
    .card-value { margin-top: 4px; font-size: 24px; font-weight: 700; color: #111827; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #e5e7eb; padding: 10px 12px; vertical-align: top; }
    th { background: #f9fafb; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #6b7280; }
    .footer { margin-top: 28px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #6b7280; }
    .footer p + p { margin-top: 4px; color: #9ca3af; }
  `
}

export type EntidadeExportReportHeaderInput = {
  title: string
  subtitle?: string
  entidadeRazaoSocial?: string
  periodLabel?: string
  eyebrow?: string
}

export function buildEntidadeExportReportHeader(
  branding: EntidadeExportBranding,
  input: EntidadeExportReportHeaderInput,
): string {
  const logoUrl = resolveExportAssetUrl(branding.logoUrl)
  const eyebrow = input.eyebrow ?? 'Relatório operacional'
  const metaParts = [
    input.entidadeRazaoSocial
      ? `<p><strong>${escapeExportHtml(input.entidadeRazaoSocial)}</strong> · ${escapeExportHtml(branding.brandName)}</p>`
      : `<p><strong>${escapeExportHtml(branding.brandName)}</strong></p>`,
    input.periodLabel
      ? `<p>Período: <strong>${escapeExportHtml(input.periodLabel)}</strong></p>`
      : '',
  ].filter(Boolean)

  return `<div class="brand-bar"></div><header class="header"><div><p class="eyebrow">${escapeExportHtml(eyebrow)}</p><h1>${escapeExportHtml(input.title)}</h1>${input.subtitle ? `<p class="subtitle">${escapeExportHtml(input.subtitle)}</p>` : ''}<div class="meta">${metaParts.join('')}</div></div><img src="${escapeExportHtml(logoUrl)}" alt="${escapeExportHtml(branding.brandName)}" class="header-logo" /></header>`
}

export function applyEntidadeCopyToExportText(text: string): string {
  const branding = resolveEntidadeExportBranding()
  return applyEntidadeCopyReplacements(text, branding.copy, branding.platformOperatorLabel)
}

export function resolveSupportOperatorLabel(
  terminologia?: EntidadeBrandingFields['terminologia'] | null,
): string {
  const label = terminologia
    ? resolvePlatformOperatorLabel(terminologia)
    : resolveEntidadeExportBranding().platformOperatorLabel
  return `Suporte ${label}`
}

/** Estilos de documento operacional (agenda, consultas, prontuário). */
export function buildEntidadeDocumentExportStyles(
  branding: EntidadeExportBranding = resolveEntidadeExportBranding(),
): string {
  const { corPrimaria } = branding
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827; background: #fff; line-height: 1.45; }
    .brand-bar { height: 4px; background: ${corPrimaria}; border-radius: 999px; margin-bottom: 20px; }
    .header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
    .header img, .header-logo { height: 36px; width: auto; max-height: 40px; }
    .header-fallback { font-size: 18px; font-weight: 700; color: ${corPrimaria}; }
    h1 { font-size: 22px; font-weight: 700; color: #111827; }
    h2 { font-size: 14px; font-weight: 700; color: #111827; border-bottom: 2px solid ${corPrimaria}; padding-bottom: 8px; margin-bottom: 14px; margin-top: 20px; }
    .subtitle { font-size: 13px; color: #6b7280; margin-top: 4px; }
    .meta { font-size: 12px; color: #6b7280; margin-top: 8px; }
    .footer { margin-top: 28px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #6b7280; }
  `
}
