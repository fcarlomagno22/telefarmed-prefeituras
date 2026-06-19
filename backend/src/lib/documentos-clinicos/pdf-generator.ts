import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import PDFDocument from 'pdfkit'
import QRCode from 'qrcode'
import { PDF_FONT, registerClinicalDocumentFonts } from './pdf-fonts.js'
import type {
  ClinicalDocumentContext,
  ClinicalDocumentKind,
  ClinicalDocumentPayload,
} from './types.js'
import { formatClinicalDocumentVerificationLabel } from './verification-url.js'

type PdfDoc = InstanceType<typeof PDFDocument>

const BRAND_ORANGE = '#FF6B00'
const INK = '#0f172a'
const INK_MUTED = '#475569'
const INK_LIGHT = '#64748b'
const INK_FAINT = '#94a3b8'
const LINE = '#e2e8f0'
const PANEL = '#f8fafc'

const MARGIN = 60
const FOOTER_HEIGHT = 118
const POWERED_BY_HEIGHT = 28

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

const URGENT_BG = '#DC2626'
const URGENT_TEXT = '#FFFFFF'

let telefarmedLogoCache: Buffer | null | undefined

function loadTelefarmedLogo(): Buffer | null {
  if (telefarmedLogoCache !== undefined) return telefarmedLogoCache

  try {
    const assetPath = join(dirname(fileURLToPath(import.meta.url)), 'assets/telefarmed-logo.png')
    telefarmedLogoCache = readFileSync(assetPath)
  } catch {
    telefarmedLogoCache = null
  }

  return telefarmedLogoCache
}

export async function renderClinicalDocumentPdf(payload: ClinicalDocumentPayload): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: MARGIN, bufferPages: true })
    registerClinicalDocumentFonts(doc)
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    void drawDocument(doc, payload).then(() => doc.end()).catch(reject)
  })
}

export function hashDocumentBuffer(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}

async function drawDocument(doc: PdfDoc, payload: ClinicalDocumentPayload): Promise<void> {
  const { context, kind, sections, verificationUrl, codigoVerificacao } = payload
  const pageWidth = doc.page.width - MARGIN * 2
  const contentBottom = getContentBottom(doc)
  const layout: ContentLayout = {
    context,
    kind,
    pageWidth,
    codigoVerificacao,
    urgent: payload.urgent,
    contentBottom,
  }

  doc.y = MARGIN
  drawPageHeader(doc, context, kind, pageWidth, codigoVerificacao, payload.urgent)
  drawPatientPanel(doc, context, pageWidth)

  doc.moveDown(0.7)

  for (const section of sections) {
    drawSection(doc, section.title, section.lines, layout)
    doc.moveDown(0.5)
  }

  if (payload.footerNote?.trim()) {
    drawNotePanel(doc, payload.footerNote.trim(), layout)
    doc.moveDown(0.45)
  }

  const range = doc.bufferedPageRange()
  for (let pageIndex = range.start; pageIndex < range.start + range.count; pageIndex += 1) {
    doc.switchToPage(pageIndex)
    drawPageHeaderPagination(doc, {
      context,
      pageWidth,
      pageNumber: pageIndex - range.start + 1,
      pageCount: range.count,
    })
    await drawPageFooter(doc, {
      context,
      verificationUrl,
      codigoVerificacao,
      pageWidth,
    })
    drawPoweredByStrip(doc, pageWidth)
  }
}

type ContentLayout = {
  context: ClinicalDocumentContext
  kind: ClinicalDocumentKind
  pageWidth: number
  codigoVerificacao: string
  urgent?: boolean
  contentBottom: number
}

function getContentBottom(doc: PdfDoc) {
  return doc.page.height - MARGIN - FOOTER_HEIGHT - POWERED_BY_HEIGHT - 16
}

function ensureContentSpace(doc: PdfDoc, layout: ContentLayout, needed: number) {
  if (doc.y + needed <= layout.contentBottom) return

  doc.addPage()
  doc.y = MARGIN
  drawPageHeader(
    doc,
    layout.context,
    layout.kind,
    layout.pageWidth,
    layout.codigoVerificacao,
    layout.urgent,
  )
}

function drawUrgentBadge(doc: PdfDoc, pageWidth: number, titleTop: number) {
  const label = 'URGENTE'
  const padX = 10
  const fontSize = 10.5
  const badgeHeight = 24
  doc.font(PDF_FONT.semiBold).fontSize(fontSize)
  const textWidth = doc.widthOfString(label)
  const badgeWidth = textWidth + padX * 2
  const badgeX = MARGIN + pageWidth - badgeWidth
  const badgeY = titleTop + 1
  const textY = badgeY + (badgeHeight - fontSize) / 2 - 1.5

  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 6).fillColor(URGENT_BG).fill()

  doc
    .font(PDF_FONT.semiBold)
    .fontSize(fontSize)
    .fillColor(URGENT_TEXT)
    .text(label, badgeX + padX, textY)
}

function drawPageHeader(
  doc: PdfDoc,
  context: ClinicalDocumentContext,
  kind: ClinicalDocumentKind,
  pageWidth: number,
  codigoVerificacao: string,
  urgent?: boolean,
) {
  const top = doc.y
  const entityName = sanitizeDisplayName(context.entidadeNome || 'Telemedicina Municipal')
  const headerMetaRight = MARGIN + pageWidth

  let headerBottom = top
  let hasEntityLogo = false
  const LOGO_MAX_HEIGHT = 56

  if (context.entidadeLogoBuffer) {
    try {
      doc.image(context.entidadeLogoBuffer, MARGIN, top, { fit: [200, LOGO_MAX_HEIGHT] })
      hasEntityLogo = true
      headerBottom = top + LOGO_MAX_HEIGHT + 8
    } catch {
      drawEntityNameFallback(doc, entityName, top)
      headerBottom = top + 28
    }
  } else {
    drawEntityNameFallback(doc, entityName, top)
    headerBottom = top + 28
  }

  const unitLine = [context.unitName, context.specialty].filter(Boolean).join(' · ')
  const metaRightWidth = 220

  if (unitLine) {
    doc
      .font(PDF_FONT.regular)
      .fontSize(hasEntityLogo ? 7.5 : 8)
      .fillColor(hasEntityLogo ? INK_FAINT : INK_MUTED)
      .text(unitLine, headerMetaRight - metaRightWidth, top + 2, {
        width: metaRightWidth,
        align: 'right',
      })
  }

  doc
    .font(PDF_FONT.regular)
    .fontSize(7.5)
    .fillColor(INK_FAINT)
    .text(`Protocolo ${codigoVerificacao}`, headerMetaRight - metaRightWidth, top + (unitLine ? 14 : 2), {
      width: metaRightWidth,
      align: 'right',
    })

  const emissaoY = top + (unitLine ? 28 : hasEntityLogo ? 14 : 28)
  const emissaoPrefix = 'Emissão: '
  doc.font(PDF_FONT.regular).fontSize(8).fillColor(INK_MUTED)
  const emissaoPrefixWidth = doc.widthOfString(emissaoPrefix)
  doc.font(PDF_FONT.semiBold).fillColor(INK)
  const emissaoValueWidth = doc.widthOfString(context.emitidoEmLabel)
  const emissaoX = headerMetaRight - emissaoPrefixWidth - emissaoValueWidth

  doc.font(PDF_FONT.regular).fontSize(8).fillColor(INK_MUTED).text(emissaoPrefix, emissaoX, emissaoY)
  doc.font(PDF_FONT.semiBold).fillColor(INK).text(context.emitidoEmLabel, emissaoX + emissaoPrefixWidth, emissaoY)

  const ruleY = Math.max(headerBottom, emissaoY + 22) + 6
  doc
    .moveTo(MARGIN, ruleY)
    .lineTo(MARGIN + pageWidth, ruleY)
    .strokeColor(LINE)
    .lineWidth(0.25)
    .stroke()

  const titleTop = ruleY + 20
  doc
    .font(PDF_FONT.semiBold)
    .fontSize(18)
    .fillColor(INK)
    .text(DOCUMENT_TITLES[kind], MARGIN, titleTop, { width: pageWidth * 0.72 })

  if (
    (kind === 'pedido_exame' ||
      kind === 'encaminhamento' ||
      kind === 'avaliacao_presencial' ||
      kind === 'internacao') &&
    urgent
  ) {
    drawUrgentBadge(doc, pageWidth, titleTop)
  }

  doc
    .font(PDF_FONT.regular)
    .fontSize(9)
    .fillColor(INK_MUTED)
    .text(DOCUMENT_SUBTITLES[kind], MARGIN, titleTop + 24, { width: pageWidth * 0.72 })

  const accentY = titleTop + 44
  doc
    .moveTo(MARGIN, accentY)
    .lineTo(MARGIN + pageWidth, accentY)
    .strokeColor(LINE)
    .lineWidth(0.25)
    .stroke()

  doc.y = accentY + 20
}

function drawPageHeaderPagination(
  doc: PdfDoc,
  input: {
    context: ClinicalDocumentContext
    pageWidth: number
    pageNumber: number
    pageCount: number
  },
) {
  if (input.pageCount <= 1) return

  const top = MARGIN
  const headerMetaRight = MARGIN + input.pageWidth
  const metaRightWidth = 220
  const hasEntityLogo = !!input.context.entidadeLogoBuffer
  const unitLine = [input.context.unitName, input.context.specialty].filter(Boolean).join(' · ')
  const emissaoY = top + (unitLine ? 28 : hasEntityLogo ? 14 : 28)
  const paginationY = emissaoY + 11

  doc
    .font(PDF_FONT.regular)
    .fontSize(7)
    .fillColor(INK_FAINT)
    .text(`Página ${input.pageNumber} de ${input.pageCount}`, headerMetaRight - metaRightWidth, paginationY, {
      width: metaRightWidth,
      align: 'right',
    })
}

function drawEntityNameFallback(doc: PdfDoc, entityName: string, top: number) {
  doc.font(PDF_FONT.semiBold).fontSize(14).fillColor(INK).text(entityName, MARGIN, top + 4, {
    width: 280,
  })
}

function sanitizeDisplayName(value: string): string {
  return value.replace(/\s*\d+$/, '').trim()
}

function drawPatientPanel(doc: PdfDoc, context: ClinicalDocumentContext, pageWidth: number) {
  const panelTop = doc.y
  const colGap = 24
  const colWidth = (pageWidth - colGap) / 2
  const leftX = MARGIN + 2
  const rightX = MARGIN + colWidth + colGap + 2
  const birthDateLabel = context.patientBirthDateLabel || context.patientAgeLabel || '—'
  const addressLabel = context.patientAddress || context.patientCity || '—'

  doc.font(PDF_FONT.regular).fontSize(9.5)
  const addressHeight = doc.heightOfString(addressLabel, { width: colWidth - 8, lineGap: 1 })
  const row2Top = panelTop + 40
  const panelHeight = Math.max(88, row2Top - panelTop + Math.max(18, addressHeight) + 14)

  doc.save()
  doc.roundedRect(MARGIN, panelTop, pageWidth, panelHeight, 8).fill(PANEL)
  doc.restore()

  doc.font(PDF_FONT.medium).fontSize(7).fillColor(INK_FAINT).text('NOME', leftX, panelTop + 12)
  doc
    .font(PDF_FONT.semiBold)
    .fontSize(10)
    .fillColor(INK)
    .text(context.patientName, leftX, panelTop + 22, { width: colWidth - 8 })

  doc.font(PDF_FONT.medium).fontSize(7).fillColor(INK_FAINT).text('CPF', rightX, panelTop + 12)
  doc
    .font(PDF_FONT.regular)
    .fontSize(10)
    .fillColor(INK)
    .text(context.patientCpfMasked, rightX, panelTop + 22, { width: colWidth - 8 })

  doc
    .font(PDF_FONT.medium)
    .fontSize(7)
    .fillColor(INK_FAINT)
    .text('DATA DE NASCIMENTO', leftX, row2Top)
  doc
    .font(PDF_FONT.regular)
    .fontSize(9.5)
    .fillColor(INK)
    .text(birthDateLabel, leftX, row2Top + 10, { width: colWidth - 8 })

  doc.font(PDF_FONT.medium).fontSize(7).fillColor(INK_FAINT).text('ENDEREÇO', rightX, row2Top)
  doc
    .font(PDF_FONT.regular)
    .fontSize(9.5)
    .fillColor(INK)
    .text(addressLabel, rightX, row2Top + 10, { width: colWidth - 8, lineGap: 1 })

  doc.y = panelTop + panelHeight + 20
}

function drawSection(doc: PdfDoc, title: string, lines: string[], layout: ContentLayout) {
  const { pageWidth, contentBottom } = layout
  const contentWidth = pageWidth
  const isNumberedList = lines.length > 0 && /^\d+\.\s/.test(lines[0] ?? '')
  let titleDrawn = false

  doc.font(PDF_FONT.regular).fontSize(10).fillColor(INK)

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]!
    const lineHeight = doc.heightOfString(line, { width: contentWidth, lineGap: 2 }) + 6
    const dividerHeight = isNumberedList && index < lines.length - 1 ? 4 : 0
    const titleBlockHeight = titleDrawn ? 0 : 34

    ensureContentSpace(doc, layout, lineHeight + titleBlockHeight + dividerHeight)

    if (!titleDrawn) {
      const sectionTop = doc.y

      doc
        .font(PDF_FONT.medium)
        .fontSize(7.5)
        .fillColor(INK_LIGHT)
        .text(title.toUpperCase(), MARGIN, sectionTop)

      doc
        .moveTo(MARGIN, sectionTop + 12)
        .lineTo(MARGIN + pageWidth, sectionTop + 12)
        .strokeColor(LINE)
        .lineWidth(0.5)
        .stroke()

      doc.y = sectionTop + 22
      doc.font(PDF_FONT.regular).fontSize(10).fillColor(INK)
      titleDrawn = true
    }

    const y = doc.y
    doc.text(line, MARGIN, y, {
      width: contentWidth,
      lineGap: 2,
    })

    doc.y = y + lineHeight

    if (isNumberedList && index < lines.length - 1) {
      doc
        .moveTo(MARGIN, doc.y)
        .lineTo(MARGIN + pageWidth, doc.y)
        .strokeColor('#f1f5f9')
        .lineWidth(0.5)
        .stroke()
      doc.y += 4
    }
  }

  doc.y += 12
}

function drawNotePanel(doc: PdfDoc, note: string, layout: ContentLayout) {
  const { pageWidth } = layout
  doc.font(PDF_FONT.regular).fontSize(9.5)
  const noteHeight = doc.heightOfString(note, { width: pageWidth, lineGap: 2 })
  ensureContentSpace(doc, layout, 34 + noteHeight + 10)

  const top = doc.y

  doc
    .font(PDF_FONT.medium)
    .fontSize(7.5)
    .fillColor(INK_LIGHT)
    .text('OBSERVAÇÕES', MARGIN, top)

  doc
    .moveTo(MARGIN, top + 12)
    .lineTo(MARGIN + pageWidth, top + 12)
    .strokeColor(LINE)
    .lineWidth(0.5)
    .stroke()

  doc
    .font(PDF_FONT.regular)
    .fontSize(9.5)
    .fillColor(INK_MUTED)
    .text(note, MARGIN, top + 20, { width: pageWidth, lineGap: 2 })

  doc.y = top + 20 + doc.heightOfString(note, { width: pageWidth, lineGap: 2 }) + 10
}

async function drawPageFooter(
  doc: PdfDoc,
  input: {
    context: ClinicalDocumentContext
    verificationUrl: string
    codigoVerificacao: string
    pageWidth: number
  },
) {
  const footerTop = doc.page.height - MARGIN - FOOTER_HEIGHT - POWERED_BY_HEIGHT
  const footerWidth = input.pageWidth
  const leftWidth = footerWidth * 0.4
  const rightX = MARGIN + leftWidth + 12
  const rightWidth = footerWidth - leftWidth - 12

  doc
    .moveTo(MARGIN, footerTop)
    .lineTo(MARGIN + footerWidth, footerTop)
    .strokeColor(LINE)
    .lineWidth(0.75)
    .stroke()

  const signatureX = MARGIN
  const signatureY = footerTop + 14

  doc
    .font(PDF_FONT.medium)
    .fontSize(7)
    .fillColor(INK_FAINT)
    .text('ASSINATURA DO PROFISSIONAL', signatureX, signatureY, { width: leftWidth - 12 })

  doc
    .moveTo(signatureX, signatureY + 28)
    .lineTo(signatureX + leftWidth - 24, signatureY + 28)
    .strokeColor(INK)
    .lineWidth(0.6)
    .stroke()

  doc
    .font(PDF_FONT.semiBold)
    .fontSize(10.5)
    .fillColor(INK)
    .text(input.context.doctorName, signatureX, signatureY + 36, { width: leftWidth - 12 })

  const credLines = [
    input.context.doctorCrm,
    input.context.doctorRqe ? `RQE ${input.context.doctorRqe}` : '',
    input.context.doctorSpecialty,
  ].filter(Boolean)

  doc
    .font(PDF_FONT.regular)
    .fontSize(8)
    .fillColor(INK_MUTED)
    .text(credLines.join(' · '), signatureX, signatureY + 52, {
      width: leftWidth - 12,
      lineGap: 1,
    })

  doc
    .font(PDF_FONT.regular)
    .fontSize(7)
    .fillColor(INK_FAINT)
    .text('Documento emitido eletronicamente.', signatureX, footerTop + FOOTER_HEIGHT - 18, {
      width: leftWidth - 12,
    })

  const qrPng = await QRCode.toBuffer(input.verificationUrl, {
    type: 'png',
    margin: 1,
    width: 240,
    errorCorrectionLevel: 'M',
  })

  const panelX = rightX - 4
  const panelY = footerTop + 10
  const panelWidth = rightWidth + 8
  const panelHeight = FOOTER_HEIGHT - 12
  const panelPadding = 12

  doc.save()
  doc.roundedRect(panelX, panelY, panelWidth, panelHeight, 8).fillAndStroke(PANEL, LINE)
  doc.restore()

  const qrSize = 52
  const qrInsetX = panelX + 12
  const qrInsetY = panelY + 12

  doc.save()
  doc.roundedRect(qrInsetX - 2, qrInsetY - 2, qrSize + 4, qrSize + 4, 6).fillAndStroke('#ffffff', LINE)
  doc.restore()
  doc.image(qrPng, qrInsetX, qrInsetY, { width: qrSize, height: qrSize })

  const verifyTextX = qrInsetX + qrSize + 14
  const verifyTextWidth = panelX + panelWidth - verifyTextX - 12
  let verifyCursorY = qrInsetY + 2

  doc
    .font(PDF_FONT.semiBold)
    .fontSize(7.5)
    .fillColor(INK)
    .text('Verificação de autenticidade', verifyTextX, verifyCursorY, { width: verifyTextWidth })

  verifyCursorY += 16

  doc
    .font(PDF_FONT.medium)
    .fontSize(6.5)
    .fillColor(INK_FAINT)
    .text('CÓDIGO', verifyTextX, verifyCursorY, { width: verifyTextWidth })

  verifyCursorY += 10

  doc
    .font(PDF_FONT.semiBold)
    .fontSize(10)
    .fillColor(INK)
    .text(input.codigoVerificacao, verifyTextX, verifyCursorY, {
      width: verifyTextWidth,
      characterSpacing: 0.6,
    })

  verifyCursorY += 16

  const instruction = 'Escaneie o QR Code ou acesse o link abaixo.'
  doc
    .font(PDF_FONT.regular)
    .fontSize(7)
    .fillColor(INK_MUTED)
    .text(instruction, verifyTextX, verifyCursorY, {
      width: verifyTextWidth,
      lineGap: 1,
    })

  verifyCursorY +=
    doc.heightOfString(instruction, { width: verifyTextWidth, lineGap: 1 }) + 6

  const linkLabel = formatClinicalDocumentVerificationLabel(
    input.verificationUrl,
    input.codigoVerificacao,
    input.context.entidadeSlug,
  )
  const linkX = panelX + panelPadding
  const linkWidth = panelWidth - panelPadding * 2
  doc.font(PDF_FONT.medium).fontSize(6.5).fillColor(INK_LIGHT)
  const linkTextHeight = doc.heightOfString(linkLabel, { width: linkWidth - 16, lineGap: 1 })
  const linkHeight = Math.max(22, linkTextHeight + 12)
  const linkTop = panelY + panelHeight - panelPadding - linkHeight

  doc.save()
  doc.roundedRect(linkX, linkTop, linkWidth, linkHeight, 4).fillAndStroke('#ffffff', LINE)
  doc.restore()

  doc
    .font(PDF_FONT.medium)
    .fontSize(6.5)
    .fillColor(INK_LIGHT)
    .text(linkLabel, linkX + 8, linkTop + 6, { width: linkWidth - 16, lineGap: 1 })
}

function drawPoweredByStrip(doc: PdfDoc, pageWidth: number) {
  const telefarmedLogo = loadTelefarmedLogo()
  const stripTop = doc.page.height - MARGIN - POWERED_BY_HEIGHT + 4
  const rightEdge = MARGIN + pageWidth
  const logoWidth = 72
  const logoHeight = 18
  const gap = 6
  const label = 'Powered by'

  doc.font(PDF_FONT.regular).fontSize(7).fillColor(INK_FAINT)
  const labelWidth = doc.widthOfString(label)

  let cursorX = rightEdge

  if (telefarmedLogo) {
    cursorX -= logoWidth
    try {
      doc.image(telefarmedLogo, cursorX, stripTop + 4, { fit: [logoWidth, logoHeight] })
    } catch {
      doc.font(PDF_FONT.medium).fontSize(7).fillColor(BRAND_ORANGE).text('Telefarmed', cursorX, stripTop + 8)
    }
    cursorX -= gap
  }

  cursorX -= labelWidth
  doc.font(PDF_FONT.regular).fontSize(7).fillColor(INK_FAINT).text(label, cursorX, stripTop + 8)
}
