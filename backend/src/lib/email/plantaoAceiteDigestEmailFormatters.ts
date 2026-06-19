import {
  buildPlantaoAceiteEmailVariablesFromSlot,
  type PlantaoAceiteEmailSlotInput,
} from './plantaoAceiteEmailFormatters.js'
import { PLANTAO_ACEITE_EMAIL_DEFAULTS } from './plantaoAceiteEmailConstants.js'
import type { PlantaoAceiteEmailVariables } from './plantaoAceiteEmailTemplate.js'

export type PlantaoAceiteDigestEmailVariables = {
  total_vagas: string
  total_plantoes: string
  slots_rows_html: string
  slots_rows_text: string
  link_vagas: string
  link_escala: string
  publicado_em: string
  nome_plataforma: string
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function buildSlotRowHtml(variables: PlantaoAceiteEmailVariables): string {
  const localLine = variables.local?.trim()
    ? `<p style="margin:0 0 6px; color:#555555; font-size:13px;">${escapeHtml(variables.local.trim())}</p>`
    : ''

  return `
    <tr>
      <td style="padding:14px 0; border-bottom:1px solid #eeeeee;">
        <p style="margin:0 0 4px; color:#222222; font-size:15px; font-weight:bold;">
          ${escapeHtml(variables.especialidade)}
        </p>
        <p style="margin:0 0 4px; color:#444444; font-size:14px;">
          ${escapeHtml(variables.data)} · ${escapeHtml(variables.dia_semana)}
        </p>
        <p style="margin:0 0 4px; color:#444444; font-size:14px;">
          ${escapeHtml(variables.hora_inicio)} às ${escapeHtml(variables.hora_fim)} · ${escapeHtml(variables.turno)}
        </p>
        ${localLine}
        <p style="margin:0; color:#ff7a00; font-size:14px; font-weight:bold;">
          ${escapeHtml(variables.valor_resumo)}
        </p>
      </td>
    </tr>
  `.trim()
}

function buildSlotRowText(variables: PlantaoAceiteEmailVariables): string {
  const lines = [
    `• ${variables.especialidade}`,
    `  ${variables.data} · ${variables.dia_semana}`,
    `  ${variables.hora_inicio} às ${variables.hora_fim} · ${variables.turno}`,
    `  ${variables.valor_resumo}`,
  ]
  if (variables.local?.trim()) {
    lines.splice(3, 0, `  ${variables.local.trim()}`)
  }
  return lines.join('\n')
}

export function buildPlantaoAceiteDigestEmailVariables(
  slots: PlantaoAceiteEmailSlotInput[],
  options: {
    link_vagas: string
    link_escala?: string
    nome_plataforma?: string
  },
): PlantaoAceiteDigestEmailVariables {
  const slotVariables = slots.map((slot) =>
    buildPlantaoAceiteEmailVariablesFromSlot(slot, {
      link_aceite: options.link_vagas,
      link_escala: options.link_escala ?? PLANTAO_ACEITE_EMAIL_DEFAULTS.link_escala,
      nome_plataforma: options.nome_plataforma,
    }),
  )

  const totalVagas = slots.reduce(
    (sum, slot) => sum + Math.max(0, slot.vagas_disponiveis),
    0,
  )

  const latestPublishedAt = slots.reduce((latest, slot) => {
    const instant = new Date(slot.publicado_em).getTime()
    return instant > latest ? instant : latest
  }, 0)

  const publishedIndex =
    latestPublishedAt > 0
      ? slots.findIndex((slot) => new Date(slot.publicado_em).getTime() === latestPublishedAt)
      : 0

  const publicadoEm =
    slotVariables[publishedIndex]?.publicado_em ?? slotVariables[0]?.publicado_em ?? '—'

  return {
    total_vagas: String(totalVagas),
    total_plantoes: String(slots.length),
    slots_rows_html: slotVariables.map(buildSlotRowHtml).join('\n'),
    slots_rows_text: slotVariables.map(buildSlotRowText).join('\n\n'),
    link_vagas: options.link_vagas,
    link_escala: options.link_escala ?? PLANTAO_ACEITE_EMAIL_DEFAULTS.link_escala,
    publicado_em: publicadoEm,
    nome_plataforma: options.nome_plataforma ?? PLANTAO_ACEITE_EMAIL_DEFAULTS.nome_plataforma,
  }
}

export function buildPlantaoAceiteDigestEmailSubject(
  variables: PlantaoAceiteDigestEmailVariables,
): string {
  const count = Number(variables.total_plantoes)
  if (count === 1) {
    return 'Nova vaga de plantão disponível'
  }
  return `${count} vagas de plantão disponíveis`
}
