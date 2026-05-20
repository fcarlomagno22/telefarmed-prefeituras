import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { brand } from '../../config/brand'
import type { AgendaDaySummary, AppointmentStatus, DayAppointment } from '../../data/agendaMock'
import { findNetworkUserForAppointment } from '../agendaPatientUser'
import { maskCpfForDisplay, maskPhoneForDisplay } from '../lgpdDisplay'
import { agendaStatusStyles } from './agendaStatusStyles'
import { drawAgendaStatusBadge } from './drawAgendaStatusBadge'

export type GenerateAgendaPdfOptions = {
  appointments: DayAppointment[]
  dayLabel: string
  unitLabel: string
  unitRoom?: string
  summary: AgendaDaySummary
  sensitiveDataUnlocked: boolean
  operatorName?: string
}

type RowMeta = {
  status: AppointmentStatus
  rowBg: [number, number, number]
  timeColor: [number, number, number]
  patientName: string
  patientCpf: string
  initials: string
  initialsBg: [number, number, number]
  initialsText: [number, number, number]
  statusLabel: string
  statusText: [number, number, number]
  accent: [number, number, number]
  sensitiveDataUnlocked: boolean
}

const BRAND_ORANGE: [number, number, number] = [255, 107, 0]
const BRAND_ORANGE_LIGHT: [number, number, number] = [255, 237, 213]

const LOGO_MAX_WIDTH = 168
const LOGO_MAX_HEIGHT = 44

type LoadedImage = {
  dataUrl: string
  naturalWidth: number
  naturalHeight: number
  format: 'PNG' | 'JPEG' | 'WEBP'
}

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const blob = await response.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function imageFormatFromDataUrl(dataUrl: string): LoadedImage['format'] {
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) {
    return 'JPEG'
  }
  if (dataUrl.startsWith('data:image/webp')) {
    return 'WEBP'
  }
  return 'PNG'
}

async function loadImageWithDimensions(url: string): Promise<LoadedImage | null> {
  const dataUrl = await loadImageAsDataUrl(url)
  if (!dataUrl) return null

  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => {
      resolve({
        dataUrl,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        format: imageFormatFromDataUrl(dataUrl),
      })
    }
    image.onerror = () => resolve(null)
    image.src = dataUrl
  })
}

function fitImageBox(
  naturalWidth: number,
  naturalHeight: number,
  maxWidth: number,
  maxHeight: number,
) {
  const aspect = naturalWidth / naturalHeight
  let width = maxWidth
  let height = width / aspect

  if (height > maxHeight) {
    height = maxHeight
    width = height * aspect
  }

  return { width, height }
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

function fileNameFromDayLabel(dayLabel: string) {
  const slug = dayLabel
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `agenda-${slug || 'do-dia'}.pdf`
}

function buildRowMeta(
  appointment: DayAppointment,
  sensitiveDataUnlocked: boolean,
): { cells: string[]; meta: RowMeta } {
  const style = agendaStatusStyles[appointment.status]
  const patient = findNetworkUserForAppointment(appointment)
  const cpf = sensitiveDataUnlocked
    ? appointment.patientCpf
    : maskCpfForDisplay(appointment.patientCpf)
  const phone = sensitiveDataUnlocked
    ? appointment.patientPhone
    : maskPhoneForDisplay(appointment.patientPhone)

  return {
    cells: [appointment.time, appointment.patientName, phone, appointment.serviceType, style.label],
    meta: {
      status: appointment.status,
      rowBg: style.rowBg,
      timeColor: style.timeColor,
      patientName: appointment.patientName,
      patientCpf: cpf,
      initials: patient.initials,
      initialsBg: style.initialsBg,
      initialsText: style.initialsText,
      statusLabel: style.label,
      statusText: style.statusText,
      accent: style.accent,
      sensitiveDataUnlocked,
    },
  }
}

export async function downloadAgendaPdf(options: GenerateAgendaPdfOptions): Promise<void> {
  const {
    appointments,
    dayLabel,
    unitLabel,
    unitRoom = 'Sala de Teleatendimento',
    summary,
    sensitiveDataUnlocked,
    operatorName = brand.operatorName,
  } = options

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginX = 36
  let cursorY = 0

  doc.setFillColor(...BRAND_ORANGE)
  doc.rect(0, 0, pageWidth, 8, 'F')

  cursorY = 32
  const logoImage = await loadImageWithDimensions(brand.logoUrl)
  let headerBlockHeight = LOGO_MAX_HEIGHT

  if (logoImage) {
    const logoBox = fitImageBox(
      logoImage.naturalWidth,
      logoImage.naturalHeight,
      LOGO_MAX_WIDTH,
      LOGO_MAX_HEIGHT,
    )
    headerBlockHeight = logoBox.height
    doc.addImage(
      logoImage.dataUrl,
      logoImage.format,
      marginX,
      cursorY,
      logoBox.width,
      logoBox.height,
      undefined,
      'NONE',
    )
  } else {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(...BRAND_ORANGE)
    doc.text(brand.appName, marginX, cursorY + 20)
    headerBlockHeight = 28
  }

  const titleBaseline = cursorY + headerBlockHeight / 2 - 4

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(17, 24, 39)
  doc.text('Agenda do dia', pageWidth - marginX, titleBaseline, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.setTextColor(75, 85, 99)
  doc.text(dayLabel, pageWidth - marginX, titleBaseline + 18, { align: 'right' })

  cursorY += headerBlockHeight + 20

  doc.setDrawColor(209, 213, 219)
  doc.setLineWidth(1.25)
  doc.line(marginX, cursorY, pageWidth - marginX, cursorY)
  cursorY += 18

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(55, 65, 81)
  doc.text(`${unitLabel} — ${unitRoom}`, marginX, cursorY)

  const metaLine = [
    `Total: ${summary.total} agendamentos`,
    `Comparecimento: ${summary.attendanceRate}%`,
    `Gerado em ${formatGeneratedAt(new Date())}`,
    `Operador: ${operatorName}`,
  ].join('   ·   ')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(107, 114, 128)
  doc.text(metaLine, marginX, cursorY + 16, { maxWidth: pageWidth - marginX * 2 })

  if (!sensitiveDataUnlocked) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(107, 114, 128)
    doc.text(
      'CPF e telefone impressos com mascaramento conforme a LGPD.',
      marginX,
      cursorY + 32,
    )
    cursorY += 46
  } else {
    cursorY += 38
  }

  const tableWidth = pageWidth - marginX * 2
  const colHorario = 62
  const colPaciente = Math.round(tableWidth * 0.34)
  const colTelefone = 104
  const colTipo = Math.round(tableWidth * 0.28)
  const colSituacao = tableWidth - colHorario - colPaciente - colTelefone - colTipo

  const rowData = appointments.map((appointment) =>
    buildRowMeta(appointment, sensitiveDataUnlocked),
  )
  const rowMetas = rowData.map((row) => row.meta)
  const body = rowData.map((row) => row.cells)

  if (body.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(107, 114, 128)
    doc.text('Nenhum agendamento para este dia.', marginX, cursorY + 20)
  } else {
    const noVerticalLines = { top: 0, right: 0, bottom: 0, left: 0 } as const
    const rowDivider = { top: 0, right: 0, bottom: 0.6, left: 0 } as const

    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginX, right: marginX, bottom: 48 },
      tableWidth,
      head: [['HORÁRIO', 'PACIENTE', 'TELEFONE', 'TIPO DE ATENDIMENTO', 'SITUAÇÃO']],
      body,
      theme: 'plain',
      styles: {
        font: 'helvetica',
        fontSize: 11,
        cellPadding: { top: 13, right: 12, bottom: 13, left: 12 },
        lineColor: [243, 244, 246],
        lineWidth: rowDivider,
        textColor: [55, 65, 81],
        valign: 'middle',
        minCellHeight: 50,
        fillColor: [255, 255, 255],
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [156, 163, 175],
        fontStyle: 'bold',
        fontSize: 9,
        cellPadding: { top: 8, right: 12, bottom: 10, left: 12 },
        lineColor: [229, 231, 235],
        lineWidth: { top: 0, right: 0, bottom: 1, left: 0 },
      },
      columnStyles: {
        0: {
          cellWidth: colHorario,
          fontStyle: 'bold',
          halign: 'left',
          lineWidth: noVerticalLines,
        },
        1: {
          cellWidth: colPaciente,
          cellPadding: { top: 13, right: 12, bottom: 13, left: 56 },
          lineWidth: noVerticalLines,
        },
        2: {
          cellWidth: colTelefone,
          halign: 'center',
          lineWidth: noVerticalLines,
        },
        3: {
          cellWidth: colTipo,
          halign: 'center',
          lineWidth: noVerticalLines,
        },
        4: {
          cellWidth: colSituacao,
          halign: 'center',
          lineWidth: noVerticalLines,
        },
      },
      didParseCell(data) {
        if (data.section === 'head') {
          data.cell.styles.lineWidth = { top: 0, right: 0, bottom: 1, left: 0 }
          if (data.column.index === 1) {
            data.cell.styles.cellPadding = { top: 8, right: 12, bottom: 10, left: 12 }
          }
          return
        }

        if (data.section !== 'body') return

        const meta = rowMetas[data.row.index]
        if (!meta) return

        const isLastRow = data.row.index === body.length - 1
        data.cell.styles.fillColor = meta.rowBg
        data.cell.styles.lineWidth = isLastRow ? noVerticalLines : rowDivider

        if (data.column.index === 0) {
          data.cell.styles.textColor = meta.timeColor
          data.cell.styles.fontStyle = 'bold'
        }

        if (data.column.index === 1) {
          data.cell.text = []
        }

        if (data.column.index === 2 && meta.sensitiveDataUnlocked) {
          data.cell.styles.textColor = [2, 132, 199]
        }

        if (data.column.index === 4) {
          data.cell.text = []
        }
      },
      didDrawCell(data) {
        if (data.section !== 'body') return

        const meta = rowMetas[data.row.index]
        if (!meta) return

        const { x, y, width, height } = data.cell
        const style = agendaStatusStyles[meta.status]

        if (data.column.index === 1) {
          const radius = 16
          const circleX = x + 24
          const circleY = y + height / 2
          const textX = x + 54

          doc.setFillColor(...meta.initialsBg)
          doc.circle(circleX, circleY, radius, 'F')

          doc.setFont('helvetica', 'bold')
          doc.setFontSize(10)
          doc.setTextColor(...meta.initialsText)
          doc.text(meta.initials, circleX, circleY + 3.5, { align: 'center' })

          doc.setFont('helvetica', 'bold')
          doc.setFontSize(11)
          doc.setTextColor(17, 24, 39)
          doc.text(meta.patientName, textX, circleY - 3)

          doc.setFont('helvetica', 'normal')
          doc.setFontSize(10)
          if (meta.sensitiveDataUnlocked) {
            doc.setTextColor(2, 132, 199)
          } else {
            doc.setTextColor(107, 114, 128)
          }
          doc.text(meta.patientCpf, textX, circleY + 11)
        }

        if (data.column.index === 4) {
          drawAgendaStatusBadge(doc, x + width / 2, y + height / 2, style)
        }
      },
    })
  }

  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    doc.setFillColor(...BRAND_ORANGE_LIGHT)
    doc.rect(0, pageHeight - 24, pageWidth, 24, 'F')
    doc.setDrawColor(...BRAND_ORANGE)
    doc.setLineWidth(0.5)
    doc.line(0, pageHeight - 24, pageWidth, pageHeight - 24)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(120, 113, 108)
    doc.text(brand.copyright, marginX, pageHeight - 9)
    doc.text(
      `Página ${page} de ${pageCount}`,
      pageWidth - marginX,
      pageHeight - 9,
      { align: 'right' },
    )
  }

  doc.save(fileNameFromDayLabel(dayLabel))
}
