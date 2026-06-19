import QRCode from 'qrcode'
import { jsPDF } from 'jspdf'
import type {
  ClinicalDocumentContext,
  ClinicalDocumentKind,
  ClinicalDocumentPayload,
  ClinicalDocumentSection,
} from '../../types/clinicalDocument'
import { formatClinicalDocumentVerificationLabel } from './codigoVerificacao'

const BRAND_ORANGE: [number, number, number] = [255, 107, 0]
const INK: [number, number, number] = [15, 23, 42]
const INK_MUTED: [number, number, number] = [71, 85, 105]
const INK_LIGHT: [number, number, number] = [100, 116, 139]
const INK_FAINT: [number, number, number] = [148, 163, 184]
const LINE: [number, number, number] = [226, 232, 240]
const PANEL: [number, number, number] = [248, 250, 252]

const MARGIN = 60
const FOOTER_HEIGHT = 118
const POWERED_BY_HEIGHT = 28

const FONT = {
  regular: 'Poppins',
  medium: 'PoppinsMedium',
  semiBold: 'PoppinsSemiBold',
} as const

const DOCUMENT_TITLES: Record<ClinicalDocumentKind, string> = {
  receita: 'Receita Médica',
  pedido_exame: 'Pedido de Exames',
  atestado: 'Atestado Médico',
  encaminhamento: 'Encaminhamento Médico',
  relatorio: 'Relatório Médico',
  laudo: 'Laudo Médico',
  avaliacao_presencial: 'Avaliação Presencial',
  internacao: 'Solicitação de Internação',
}

const DOCUMENT_SUBTITLES: Record<ClinicalDocumentKind, string> = {
  receita: 'Prescrição eletrônica',
  pedido_exame: 'Solicitação de exames complementares',
  atestado: 'Declaração de afastamento ou comparecimento',
  encaminhamento: 'Referência para continuidade do cuidado',
  relatorio: 'Resumo clínico para referência ou contrarreferência',
  laudo: 'Parecer técnico sobre exame ou condição clínica',
  avaliacao_presencial: 'Solicitação de retorno ou avaliação no serviço de saúde',
  internacao: 'Solicitação de internação hospitalar para regulação de leitos',
}

const URGENT_BG: [number, number, number] = [220, 38, 38]
const URGENT_TEXT: [number, number, number] = [255, 255, 255]

type LoadedImage = {
  dataUrl: string
  format: 'PNG' | 'JPEG' | 'WEBP'
  width: number
  height: number
}

let fontsReady: Promise<void> | null = null

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]!)
  }
  return btoa(binary)
}

async function ensurePoppinsFonts(doc: jsPDF): Promise<void> {
  if (!fontsReady) {
    fontsReady = (async () => {
      const [regular, medium, semiBold] = await Promise.all([
        fetch('/fonts/poppins/Poppins-Regular.ttf').then((response) => response.arrayBuffer()),
        fetch('/fonts/poppins/Poppins-Medium.ttf').then((response) => response.arrayBuffer()),
        fetch('/fonts/poppins/Poppins-SemiBold.ttf').then((response) => response.arrayBuffer()),
      ])

      doc.addFileToVFS('Poppins-Regular.ttf', arrayBufferToBase64(regular))
      doc.addFileToVFS('Poppins-Medium.ttf', arrayBufferToBase64(medium))
      doc.addFileToVFS('Poppins-SemiBold.ttf', arrayBufferToBase64(semiBold))
      doc.addFont('Poppins-Regular.ttf', FONT.regular, 'normal')
      doc.addFont('Poppins-Medium.ttf', FONT.medium, 'normal')
      doc.addFont('Poppins-SemiBold.ttf', FONT.semiBold, 'normal')
    })()
  }

  await fontsReady
}

async function loadImage(url: string): Promise<LoadedImage | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const blob = await response.blob()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
    const format = blob.type.includes('png')
      ? 'PNG'
      : blob.type.includes('webp')
        ? 'WEBP'
        : 'JPEG'
    const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
      const image = new Image()
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
      image.onerror = () => resolve({ width: 0, height: 0 })
      image.src = dataUrl
    })
    if (!dimensions.width || !dimensions.height) return null
    return { dataUrl, format, width: dimensions.width, height: dimensions.height }
  } catch {
    return null
  }
}

function fitImage(
  naturalWidth: number,
  naturalHeight: number,
  maxWidth: number,
  maxHeight: number,
) {
  const ratio = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight)
  return {
    width: naturalWidth * ratio,
    height: naturalHeight * ratio,
  }
}

function sanitizeDisplayName(value: string): string {
  return value.replace(/\s*\d+$/, '').trim()
}

function formatVerificationDisplayPath(
  url: string,
  codigoVerificacao: string,
  entidadeSlug?: string,
): string {
  return formatClinicalDocumentVerificationLabel(url, codigoVerificacao, entidadeSlug)
}

function setColor(doc: jsPDF, color: [number, number, number]) {
  doc.setTextColor(color[0], color[1], color[2])
  doc.setDrawColor(color[0], color[1], color[2])
}

function drawUrgentBadge(doc: jsPDF, pageWidth: number, titleTop: number) {
  const label = 'URGENTE'
  const padX = 10
  const fontSize = 10.5
  const badgeHeight = 24
  doc.setFont(FONT.semiBold, 'normal')
  doc.setFontSize(fontSize)
  const textWidth = doc.getTextWidth(label)
  const badgeWidth = textWidth + padX * 2
  const badgeX = MARGIN + pageWidth - badgeWidth
  const badgeY = titleTop + 1
  const textY = badgeY + badgeHeight / 2 + fontSize * 0.12

  doc.setFillColor(...URGENT_BG)
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 6, 6, 'F')

  doc.setFont(FONT.semiBold, 'normal')
  doc.setFontSize(fontSize)
  doc.setTextColor(...URGENT_TEXT)
  doc.text(label, badgeX + padX, textY)
}

function drawPageHeader(
  doc: jsPDF,
  context: ClinicalDocumentContext,
  kind: ClinicalDocumentKind,
  pageWidth: number,
  codigoVerificacao: string,
  entidadeLogo: LoadedImage | null,
  urgent?: boolean,
) {
  const top = MARGIN
  const entityName = sanitizeDisplayName(context.entidadeNome || 'Telemedicina Municipal')
  const headerMetaRight = MARGIN + pageWidth
  let headerBottom = top

  if (entidadeLogo) {
    const logoBox = fitImage(entidadeLogo.width, entidadeLogo.height, 200, 56)
    doc.addImage(
      entidadeLogo.dataUrl,
      entidadeLogo.format,
      MARGIN,
      top,
      logoBox.width,
      logoBox.height,
      undefined,
      'FAST',
    )
    headerBottom = top + logoBox.height + 8
  } else {
    doc.setFont(FONT.semiBold, 'normal')
    doc.setFontSize(14)
    setColor(doc, INK)
    doc.text(entityName, MARGIN, top + 12, { maxWidth: 280 })
    headerBottom = top + 28
  }

  const unitLine = [context.unitName, context.specialty].filter(Boolean).join(' · ')
  const metaRightWidth = 220

  if (unitLine) {
    doc.setFont(FONT.regular, 'normal')
    doc.setFontSize(entidadeLogo ? 7.5 : 8)
    setColor(doc, entidadeLogo ? INK_FAINT : INK_MUTED)
    doc.text(unitLine, headerMetaRight - metaRightWidth, top + 2, {
      align: 'right',
      maxWidth: metaRightWidth,
    })
  }

  doc.setFont(FONT.regular, 'normal')
  doc.setFontSize(7.5)
  setColor(doc, INK_FAINT)
  doc.text(`Protocolo ${codigoVerificacao}`, headerMetaRight - metaRightWidth, top + (unitLine ? 14 : 2), {
    align: 'right',
    maxWidth: metaRightWidth,
  })

  const emissaoY = top + (unitLine ? 28 : entidadeLogo ? 14 : 28)
  doc.setFont(FONT.regular, 'normal')
  doc.setFontSize(8)
  setColor(doc, INK_MUTED)
  const emissaoPrefixWidth = doc.getTextWidth('Emissão: ')
  const emissaoValueWidth = doc.getTextWidth(context.emitidoEmLabel)
  const emissaoLineWidth = emissaoPrefixWidth + emissaoValueWidth
  const emissaoX = headerMetaRight - emissaoLineWidth

  doc.text('Emissão: ', emissaoX, emissaoY)
  doc.setFont(FONT.semiBold, 'normal')
  setColor(doc, INK)
  doc.text(context.emitidoEmLabel, emissaoX + emissaoPrefixWidth, emissaoY)

  const ruleY = Math.max(headerBottom, emissaoY + 22) + 6
  doc.setDrawColor(...LINE)
  doc.setLineWidth(0.25)
  doc.line(MARGIN, ruleY, MARGIN + pageWidth, ruleY)

  const titleTop = ruleY + 20
  doc.setFont(FONT.semiBold, 'normal')
  doc.setFontSize(18)
  setColor(doc, INK)
  doc.text(DOCUMENT_TITLES[kind], MARGIN, titleTop + 8)

  if (
    (kind === 'pedido_exame' ||
      kind === 'encaminhamento' ||
      kind === 'avaliacao_presencial' ||
      kind === 'internacao') &&
    urgent
  ) {
    drawUrgentBadge(doc, pageWidth, titleTop)
  }

  doc.setFont(FONT.regular, 'normal')
  doc.setFontSize(9)
  setColor(doc, INK_MUTED)
  doc.text(DOCUMENT_SUBTITLES[kind], MARGIN, titleTop + 28)

  const accentY = titleTop + 44
  doc.setDrawColor(...LINE)
  doc.setLineWidth(0.25)
  doc.line(MARGIN, accentY, MARGIN + pageWidth, accentY)

  return accentY + 20
}

function drawPageHeaderPagination(
  doc: jsPDF,
  input: {
    context: ClinicalDocumentContext
    pageWidth: number
    pageNumber: number
    pageCount: number
    entidadeLogo: LoadedImage | null
  },
) {
  if (input.pageCount <= 1) return

  const top = MARGIN
  const headerMetaRight = MARGIN + input.pageWidth
  const metaRightWidth = 220
  const unitLine = [input.context.unitName, input.context.specialty].filter(Boolean).join(' · ')
  const emissaoY = top + (unitLine ? 28 : input.entidadeLogo ? 14 : 28)
  const paginationY = emissaoY + 11

  doc.setFont(FONT.regular, 'normal')
  doc.setFontSize(7)
  setColor(doc, INK_FAINT)
  doc.text(`Página ${input.pageNumber} de ${input.pageCount}`, headerMetaRight - metaRightWidth, paginationY, {
    align: 'right',
    maxWidth: metaRightWidth,
  })
}

function drawPatientPanel(
  doc: jsPDF,
  context: ClinicalDocumentContext,
  pageWidth: number,
  startY: number,
) {
  const panelTop = startY
  const colGap = 24
  const colWidth = (pageWidth - colGap) / 2
  const leftX = MARGIN + 2
  const rightX = MARGIN + colWidth + colGap + 2
  const birthDateLabel = context.patientBirthDateLabel || context.patientAgeLabel || '—'
  const addressLabel = context.patientAddress || context.patientCity || '—'

  doc.setFont(FONT.regular, 'normal')
  doc.setFontSize(9.5)
  const addressLines = doc.splitTextToSize(addressLabel, colWidth - 8)
  const addressHeight = addressLines.length * 9.5 * 1.1
  const row2Top = panelTop + 40
  const panelHeight = Math.max(88, row2Top - panelTop + Math.max(18, addressHeight) + 14)

  doc.setFillColor(...PANEL)
  doc.roundedRect(MARGIN, panelTop, pageWidth, panelHeight, 8, 8, 'F')

  doc.setFont(FONT.medium, 'normal')
  doc.setFontSize(7)
  setColor(doc, INK_FAINT)
  doc.text('NOME', leftX, panelTop + 12)
  doc.text('CPF', rightX, panelTop + 12)

  doc.setFont(FONT.semiBold, 'normal')
  doc.setFontSize(10)
  setColor(doc, INK)
  doc.text(context.patientName, leftX, panelTop + 22, { maxWidth: colWidth - 8 })
  doc.setFont(FONT.regular, 'normal')
  doc.text(context.patientCpfMasked, rightX, panelTop + 22, { maxWidth: colWidth - 8 })

  doc.setFont(FONT.medium, 'normal')
  doc.setFontSize(7)
  setColor(doc, INK_FAINT)
  doc.text('DATA DE NASCIMENTO', leftX, row2Top)
  doc.setFont(FONT.regular, 'normal')
  doc.setFontSize(9.5)
  setColor(doc, INK)
  doc.text(birthDateLabel, leftX, row2Top + 10, { maxWidth: colWidth - 8 })

  doc.setFont(FONT.medium, 'normal')
  doc.setFontSize(7)
  setColor(doc, INK_FAINT)
  doc.text('ENDEREÇO', rightX, row2Top)
  doc.setFont(FONT.regular, 'normal')
  doc.setFontSize(9.5)
  setColor(doc, INK)
  doc.text(addressLines, rightX, row2Top + 10, { maxWidth: colWidth - 8, lineHeightFactor: 1.1 })

  return panelTop + panelHeight + 20
}

function drawSection(
  doc: jsPDF,
  section: ClinicalDocumentSection,
  layout: ContentLayout,
  startY: number,
) {
  let y = startY
  const isNumberedList = section.lines.length > 0 && /^\d+\.\s/.test(section.lines[0] ?? '')
  let titleDrawn = false

  doc.setFont(FONT.regular, 'normal')
  doc.setFontSize(10)
  setColor(doc, INK)

  for (let index = 0; index < section.lines.length; index += 1) {
    const line = section.lines[index]!
    const lineHeight = doc.getTextDimensions(line, { maxWidth: layout.pageWidth }).h + 6
    const dividerHeight = isNumberedList && index < section.lines.length - 1 ? 4 : 0
    const titleBlockHeight = titleDrawn ? 0 : 34

    y = ensureContentSpace(doc, layout, y, lineHeight + titleBlockHeight + dividerHeight)

    if (!titleDrawn) {
      doc.setFont(FONT.medium, 'normal')
      doc.setFontSize(7.5)
      setColor(doc, INK_LIGHT)
      doc.text(section.title.toUpperCase(), MARGIN, y + 4)

      doc.setDrawColor(...LINE)
      doc.setLineWidth(0.5)
      doc.line(MARGIN, y + 12, MARGIN + layout.pageWidth, y + 12)

      doc.setFont(FONT.regular, 'normal')
      doc.setFontSize(10)
      setColor(doc, INK)
      y += 22
      titleDrawn = true
    }

    doc.text(line, MARGIN, y, { maxWidth: layout.pageWidth, lineHeightFactor: 1.2 })
    y += lineHeight

    if (isNumberedList && index < section.lines.length - 1) {
      doc.setDrawColor(241, 245, 249)
      doc.setLineWidth(0.5)
      doc.line(MARGIN, y, MARGIN + layout.pageWidth, y)
      y += 4
    }
  }

  return y + 12
}

type ContentLayout = {
  context: ClinicalDocumentContext
  kind: ClinicalDocumentKind
  pageWidth: number
  codigoVerificacao: string
  urgent?: boolean
  contentBottom: number
  entidadeLogo: LoadedImage | null
}

function ensureContentSpace(
  doc: jsPDF,
  layout: ContentLayout,
  cursorY: number,
  needed: number,
) {
  if (cursorY + needed <= layout.contentBottom) return cursorY

  doc.addPage()
  return drawPageHeader(
    doc,
    layout.context,
    layout.kind,
    layout.pageWidth,
    layout.codigoVerificacao,
    layout.entidadeLogo,
    layout.urgent,
  )
}

function drawNotePanel(
  doc: jsPDF,
  note: string,
  layout: ContentLayout,
  startY: number,
) {
  doc.setFont(FONT.regular, 'normal')
  doc.setFontSize(9.5)
  const noteHeight = doc.getTextDimensions(note, {
    maxWidth: layout.pageWidth,
    lineHeightFactor: 1.2,
  }).h
  let y = ensureContentSpace(doc, layout, startY, 34 + noteHeight + 10)

  doc.setFont(FONT.medium, 'normal')
  doc.setFontSize(7.5)
  setColor(doc, INK_LIGHT)
  doc.text('OBSERVAÇÕES', MARGIN, y + 4)

  doc.setDrawColor(...LINE)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, y + 12, MARGIN + layout.pageWidth, y + 12)

  doc.setFont(FONT.regular, 'normal')
  doc.setFontSize(9.5)
  setColor(doc, INK_MUTED)
  doc.text(note, MARGIN, y + 20, { maxWidth: layout.pageWidth, lineHeightFactor: 1.2 })

  return y + 20 + noteHeight + 10
}

async function drawPageFooter(
  doc: jsPDF,
  input: {
    context: ClinicalDocumentContext
    verificationUrl: string
    codigoVerificacao: string
    pageWidth: number
  },
) {
  const pageHeight = doc.internal.pageSize.getHeight()
  const footerTop = pageHeight - MARGIN - FOOTER_HEIGHT - POWERED_BY_HEIGHT
  const footerWidth = input.pageWidth
  const leftWidth = footerWidth * 0.4
  const rightX = MARGIN + leftWidth + 12

  doc.setDrawColor(...LINE)
  doc.setLineWidth(0.75)
  doc.line(MARGIN, footerTop, MARGIN + footerWidth, footerTop)

  const signatureX = MARGIN
  const signatureY = footerTop + 14

  doc.setFont(FONT.medium, 'normal')
  doc.setFontSize(7)
  setColor(doc, INK_FAINT)
  doc.text('ASSINATURA DO PROFISSIONAL', signatureX, signatureY + 2)

  doc.setDrawColor(...INK)
  doc.setLineWidth(0.6)
  doc.line(signatureX, signatureY + 28, signatureX + leftWidth - 24, signatureY + 28)

  doc.setFont(FONT.semiBold, 'normal')
  doc.setFontSize(10.5)
  setColor(doc, INK)
  doc.text(input.context.doctorName, signatureX, signatureY + 38)

  const credLines = [
    input.context.doctorCrm,
    input.context.doctorRqe ? `RQE ${input.context.doctorRqe}` : '',
    input.context.doctorSpecialty,
  ]
    .filter(Boolean)
    .join(' · ')

  doc.setFont(FONT.regular, 'normal')
  doc.setFontSize(8)
  setColor(doc, INK_MUTED)
  doc.text(credLines, signatureX, signatureY + 52, { maxWidth: leftWidth - 12 })

  doc.setFontSize(7)
  setColor(doc, INK_FAINT)
  doc.text('Documento emitido eletronicamente.', signatureX, footerTop + FOOTER_HEIGHT - 14, {
    maxWidth: leftWidth - 12,
  })

  const qrDataUrl = await QRCode.toDataURL(input.verificationUrl, {
    margin: 1,
    width: 240,
    errorCorrectionLevel: 'M',
  })

  const panelX = rightX - 4
  const panelY = footerTop + 10
  const panelWidth = footerWidth - leftWidth - 8
  const panelHeight = FOOTER_HEIGHT - 12
  const panelPadding = 12

  doc.setFillColor(...PANEL)
  doc.setDrawColor(...LINE)
  doc.setLineWidth(0.75)
  doc.roundedRect(panelX, panelY, panelWidth, panelHeight, 8, 8, 'FD')

  const qrSize = 52
  const qrInsetX = panelX + 12
  const qrInsetY = panelY + 12

  doc.setFillColor(255, 255, 255)
  doc.roundedRect(qrInsetX - 2, qrInsetY - 2, qrSize + 4, qrSize + 4, 6, 6, 'FD')
  doc.addImage(qrDataUrl, 'PNG', qrInsetX, qrInsetY, qrSize, qrSize)

  const verifyTextX = qrInsetX + qrSize + 14
  const verifyTextWidth = panelX + panelWidth - verifyTextX - 12
  let verifyCursorY = qrInsetY + 2

  doc.setFont(FONT.semiBold, 'normal')
  doc.setFontSize(7.5)
  setColor(doc, INK)
  doc.text('Verificação de autenticidade', verifyTextX, verifyCursorY + 4, {
    maxWidth: verifyTextWidth,
  })

  verifyCursorY += 18

  doc.setFont(FONT.medium, 'normal')
  doc.setFontSize(6.5)
  setColor(doc, INK_FAINT)
  doc.text('CÓDIGO', verifyTextX, verifyCursorY, { maxWidth: verifyTextWidth })

  verifyCursorY += 10

  doc.setFont(FONT.semiBold, 'normal')
  doc.setFontSize(10)
  setColor(doc, INK)
  doc.text(input.codigoVerificacao, verifyTextX, verifyCursorY, { maxWidth: verifyTextWidth })

  verifyCursorY += 16

  const instruction = 'Escaneie o QR Code ou acesse o link abaixo.'
  doc.setFont(FONT.regular, 'normal')
  doc.setFontSize(7)
  setColor(doc, INK_MUTED)
  const instructionLines = doc.splitTextToSize(instruction, verifyTextWidth)
  doc.text(instructionLines, verifyTextX, verifyCursorY, {
    maxWidth: verifyTextWidth,
    lineHeightFactor: 1.15,
  })

  verifyCursorY += instructionLines.length * 7 * 1.15 + 6

  const linkLabel = formatVerificationDisplayPath(
    input.verificationUrl,
    input.codigoVerificacao,
    input.context.entidadeSlug,
  )
  const linkX = panelX + panelPadding
  const linkWidth = panelWidth - panelPadding * 2
  doc.setFont(FONT.medium, 'normal')
  doc.setFontSize(6.5)
  setColor(doc, INK_LIGHT)
  const linkLines = doc.splitTextToSize(linkLabel, linkWidth - 16)
  const linkTextHeight = linkLines.length * 6.5 * 1.15
  const linkHeight = Math.max(22, linkTextHeight + 12)
  const linkTop = panelY + panelHeight - panelPadding - linkHeight

  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(...LINE)
  doc.roundedRect(linkX, linkTop, linkWidth, linkHeight, 4, 4, 'FD')

  doc.text(linkLines, linkX + 8, linkTop + 6, {
    maxWidth: linkWidth - 16,
    lineHeightFactor: 1.15,
  })
}

function drawPoweredByStrip(doc: jsPDF, pageWidth: number, telefarmedLogo: LoadedImage | null) {
  const pageHeight = doc.internal.pageSize.getHeight()
  const stripTop = pageHeight - MARGIN - POWERED_BY_HEIGHT + 4
  const rightEdge = MARGIN + pageWidth
  const logoWidth = 72
  const logoHeight = 18
  const gap = 6
  const label = 'Powered by'

  doc.setFont(FONT.regular, 'normal')
  doc.setFontSize(7)
  setColor(doc, INK_FAINT)
  const labelWidth = doc.getTextWidth(label)

  let cursorX = rightEdge

  if (telefarmedLogo) {
    const logoBox = fitImage(telefarmedLogo.width, telefarmedLogo.height, logoWidth, logoHeight)
    cursorX -= logoBox.width
    doc.addImage(
      telefarmedLogo.dataUrl,
      telefarmedLogo.format,
      cursorX,
      stripTop + 4,
      logoBox.width,
      logoBox.height,
      undefined,
      'FAST',
    )
    cursorX -= gap
  } else {
    doc.setFont(FONT.medium, 'normal')
    doc.setFontSize(7)
    setColor(doc, BRAND_ORANGE)
    const fallback = 'Telefarmed'
    const fallbackWidth = doc.getTextWidth(fallback)
    cursorX -= fallbackWidth
    doc.text(fallback, cursorX, stripTop + 12)
    cursorX -= gap
  }

  cursorX -= labelWidth
  doc.setFont(FONT.regular, 'normal')
  doc.setFontSize(7)
  setColor(doc, INK_FAINT)
  doc.text(label, cursorX, stripTop + 12)
}

export async function generateClinicalDocumentPdf(payload: ClinicalDocumentPayload): Promise<Blob> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  await ensurePoppinsFonts(doc)

  const pageWidth = doc.internal.pageSize.getWidth() - MARGIN * 2
  const pageHeight = doc.internal.pageSize.getHeight()
  const contentBottom = pageHeight - MARGIN - FOOTER_HEIGHT - POWERED_BY_HEIGHT - 16

  const [telefarmedLogo, entidadeLogo] = await Promise.all([
    loadImage('/logo_4.png'),
    payload.context.entidadeLogoUrl ? loadImage(payload.context.entidadeLogoUrl) : Promise.resolve(null),
  ])

  const layout: ContentLayout = {
    context: payload.context,
    kind: payload.kind,
    pageWidth,
    codigoVerificacao: payload.codigoVerificacao,
    urgent: payload.urgent,
    contentBottom,
    entidadeLogo,
  }

  let cursorY = drawPageHeader(
    doc,
    payload.context,
    payload.kind,
    pageWidth,
    payload.codigoVerificacao,
    entidadeLogo,
    payload.urgent,
  )

  cursorY = drawPatientPanel(doc, payload.context, pageWidth, cursorY)

  for (const section of payload.sections) {
    cursorY = drawSection(doc, section, layout, cursorY)
    cursorY += 6
  }

  if (payload.footerNote?.trim()) {
    cursorY = drawNotePanel(doc, payload.footerNote.trim(), layout, cursorY)
  }

  const pageCount = doc.getNumberOfPages()
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    doc.setPage(pageNumber)
    drawPageHeaderPagination(doc, {
      context: payload.context,
      pageWidth,
      pageNumber,
      pageCount,
      entidadeLogo,
    })
    await drawPageFooter(doc, {
      context: payload.context,
      verificationUrl: payload.verificationUrl,
      codigoVerificacao: payload.codigoVerificacao,
      pageWidth,
    })
    drawPoweredByStrip(doc, pageWidth, telefarmedLogo)
  }

  return doc.output('blob')
}

export function openClinicalDocumentPdf(blob: Blob, fileName: string) {
  const blobUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = blobUrl
  anchor.target = '_blank'
  anchor.rel = 'noopener noreferrer'
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
  return blobUrl
}
