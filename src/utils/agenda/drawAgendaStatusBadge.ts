import type { jsPDF } from 'jspdf'
import {
  AGENDA_STATUS_BADGE_HEIGHT_PT,
  AGENDA_STATUS_BADGE_LINE_PT,
  AGENDA_STATUS_BADGE_WIDTH_PT,
  type AgendaStatusStyle,
} from './agendaStatusStyles'

function mixRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ]
}

function gradientColorAt(
  stops: AgendaStatusStyle['badgeGradient'],
  position: number,
): [number, number, number] {
  const clamped = Math.min(1, Math.max(0, position))
  if (clamped <= 0.5) {
    return mixRgb(stops[0], stops[1], clamped * 2)
  }
  return mixRgb(stops[1], stops[2], (clamped - 0.5) * 2)
}

function drawGradientBar(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  stops: AgendaStatusStyle['badgeGradient'],
) {
  const segments = 28
  const segmentWidth = width / segments

  for (let index = 0; index < segments; index += 1) {
    const position = index / (segments - 1)
    const color = gradientColorAt(stops, position)
    doc.setFillColor(...color)
    doc.rect(x + index * segmentWidth, y, segmentWidth + 0.6, height, 'F')
  }
}

function drawBadgeGlow(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  glow: [number, number, number],
) {
  const glowHeight = 5
  const layers = [
    { expand: 6, lighten: 0.72 },
    { expand: 3, lighten: 0.55 },
  ] as const

  for (const layer of layers) {
    const blend = layer.lighten
    doc.setFillColor(
      Math.round(glow[0] + (255 - glow[0]) * blend),
      Math.round(glow[1] + (255 - glow[1]) * blend),
      Math.round(glow[2] + (255 - glow[2]) * blend),
    )
    doc.rect(
      x - layer.expand / 2,
      y,
      width + layer.expand,
      glowHeight,
      'F',
    )
  }
}

/** Tag de situação idêntica ao card: fundo transparente, texto colorido, linha gradiente com brilho */
export function drawAgendaStatusBadge(
  doc: jsPDF,
  centerX: number,
  centerY: number,
  style: AgendaStatusStyle,
) {
  const badgeX = centerX - AGENDA_STATUS_BADGE_WIDTH_PT / 2
  const badgeY = centerY - AGENDA_STATUS_BADGE_HEIGHT_PT / 2
  const lineY = badgeY + AGENDA_STATUS_BADGE_HEIGHT_PT - AGENDA_STATUS_BADGE_LINE_PT - 2

  drawBadgeGlow(doc, badgeX, lineY + AGENDA_STATUS_BADGE_LINE_PT - 1, AGENDA_STATUS_BADGE_WIDTH_PT, style.badgeGlow)
  drawGradientBar(
    doc,
    badgeX,
    lineY,
    AGENDA_STATUS_BADGE_WIDTH_PT,
    AGENDA_STATUS_BADGE_LINE_PT,
    style.badgeGradient,
  )

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...style.statusText)
  doc.text(style.label, centerX, badgeY + 11, { align: 'center' })
}
