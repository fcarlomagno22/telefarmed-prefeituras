import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import PDFDocument from 'pdfkit'
import QRCode from 'qrcode'
import type {
  ClinicalDocumentContext,
  ClinicalDocumentKind,
  ClinicalDocumentPayload,
} from './types.js'

type PdfDoc = InstanceType<typeof PDFDocument>

const BRAND_ORANGE = '#FF6B00'
const INK = '#0f172a'
const INK_MUTED = '#475569'
const INK_LIGHT = '#64748b'
const INK_FAINT = '#94a3b8'
const LINE = '#e2e8f0'
const PANEL = '#f8fafc'

const MARGIN = 52
const FOOTER_HEIGHT = 118

const DOCUMENT_TITLES: Record<ClinicalDocumentKind, string> = {
  receita: 'Receita Médica',
  pedido_exame: 'Pedido de Exames',
  atestado: 'Atestado Médico',
}

const DOCUMENT_SUBTITLES: Record<ClinicalDocumentKind, string> = {
  receita: 'Documento de prescrição eletrônica',
  pedido_exame: 'Solicitação de exames complementares',
  atestado: 'Declaração de afastamento / comparecimento',
}

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
  const contentBottom = doc.page.height - MARGIN - FOOTER_HEIGHT - 12

  drawPageHeader(doc, context, kind, pageWidth, codigoVerificacao)
  drawPatientPanel(doc, context, pageWidth)

  doc.moveDown(0.55)

  for (const section of sections) {
    ensureSpace(doc, contentBottom, 72)
    drawSection(doc, section.title, section.lines, pageWidth)
    doc.moveDown(0.45)
  }

  if (payload.footerNote?.trim()) {
    ensureSpace(doc, contentBottom, 48)
    drawNotePanel(doc, payload.footerNote.trim(), pageWidth)
    doc.moveDown(0.45)
  }

  const range = doc.bufferedPageRange()
  for (let pageIndex = range.start; pageIndex < range.start + range.count; pageIndex += 1) {
    doc.switchToPage(pageIndex)
    await drawPageFooter(doc, {
      context,
      verificationUrl,
      codigoVerificacao,
      pageWidth,
      pageNumber: pageIndex - range.start + 1,
      pageCount: range.count,
    })
  }
}

function ensureSpace(doc: PdfDoc, contentBottom: number, needed: number) {
  if (doc.y + needed <= contentBottom) return
  doc.addPage()
  doc.y = MARGIN
}

function drawPageHeader(
  doc: PdfDoc,
  context: ClinicalDocumentContext,
  kind: ClinicalDocumentKind,
  pageWidth: number,
  codigoVerificacao: string,
) {
  const top = doc.y
  const logo = loadTelefarmedLogo()
  const entityLogoSize = context.entidadeLogoBuffer ? 44 : 0
  const metaWidth = pageWidth - 150 - (entityLogoSize > 0 ? entityLogoSize + 10 : 0)

  if (logo) {
    doc.image(logo, MARGIN, top, { fit: [128, 32] })
  } else {
    doc.font('Helvetica-Bold').fontSize(14).fillColor(BRAND_ORANGE).text('TELEFARMED', MARGIN, top + 6)
  }

  const metaX = MARGIN + pageWidth - metaWidth - entityLogoSize - (entityLogoSize > 0 ? 10 : 0)

  doc
    .font('Helvetica-Bold')
    .fontSize(9.5)
    .fillColor(INK)
    .text(sanitizeDisplayName(context.entidadeNome || 'Telemedicina Municipal'), metaX, top, {
      width: metaWidth,
      align: 'right',
    })

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(INK_MUTED)
    .text([context.unitName, context.specialty].filter(Boolean).join(' · '), metaX, top + 13, {
      width: metaWidth,
      align: 'right',
    })

  doc
    .font('Helvetica')
    .fontSize(7.5)
    .fillColor(INK_FAINT)
    .text(`Protocolo ${codigoVerificacao}`, metaX, top + 25, {
      width: metaWidth,
      align: 'right',
    })

  if (context.entidadeLogoBuffer) {
    try {
      doc.image(context.entidadeLogoBuffer, MARGIN + pageWidth - entityLogoSize, top - 2, {
        fit: [entityLogoSize, entityLogoSize],
      })
    } catch {
      // logo da entidade indisponível
    }
  }

  const ruleY = top + 40
  doc
    .moveTo(MARGIN, ruleY)
    .lineTo(MARGIN + pageWidth, ruleY)
    .strokeColor(LINE)
    .lineWidth(0.75)
    .stroke()

  const titleTop = ruleY + 22
  doc
    .font('Helvetica-Bold')
    .fontSize(22)
    .fillColor(INK)
    .text(DOCUMENT_TITLES[kind], MARGIN, titleTop, { width: pageWidth * 0.68 })

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(INK_MUTED)
    .text(DOCUMENT_SUBTITLES[kind], MARGIN, titleTop + 28, { width: pageWidth * 0.68 })

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(INK_LIGHT)
    .text('Emissão', MARGIN + pageWidth - 108, titleTop + 4, { width: 108, align: 'right' })

  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(INK)
    .text(context.emitidoEmLabel, MARGIN + pageWidth - 108, titleTop + 16, {
      width: 108,
      align: 'right',
    })

  const accentY = titleTop + 48
  doc.save()
  doc.rect(MARGIN, accentY, 48, 2).fill(BRAND_ORANGE)
  doc
    .moveTo(MARGIN + 48, accentY + 1)
    .lineTo(MARGIN + pageWidth, accentY + 1)
    .strokeColor(LINE)
    .lineWidth(0.5)
    .stroke()
  doc.restore()

  doc.y = accentY + 18
}

function sanitizeDisplayName(value: string): string {
  return value.replace(/\s*\d+$/, '').trim()
}

function drawPatientPanel(doc: PdfDoc, context: ClinicalDocumentContext, pageWidth: number) {
  const panelTop = doc.y
  const colGap = 20
  const colWidth = (pageWidth - colGap) / 2
  const leftX = MARGIN
  const rightX = MARGIN + colWidth + colGap
  const panelHeight = 72

  doc.save()
  doc.roundedRect(MARGIN, panelTop, pageWidth, panelHeight, 6).fill(PANEL)
  doc
    .moveTo(MARGIN, panelTop + panelHeight)
    .lineTo(MARGIN + pageWidth, panelTop + panelHeight)
    .strokeColor(LINE)
    .lineWidth(0.5)
    .stroke()
  doc.restore()

  doc
    .font('Helvetica-Bold')
    .fontSize(7.5)
    .fillColor(INK_LIGHT)
    .text('PACIENTE', leftX + 14, panelTop + 12)

  doc
    .font('Helvetica-Bold')
    .fontSize(10.5)
    .fillColor(INK)
    .text(context.patientName, leftX + 14, panelTop + 24, { width: colWidth - 28 })

  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(INK_LIGHT).text('CPF', rightX + 14, panelTop + 12)

  doc
    .font('Helvetica')
    .fontSize(10.5)
    .fillColor(INK)
    .text(context.patientCpfMasked, rightX + 14, panelTop + 24, { width: colWidth - 28 })

  const row2Top = panelTop + 44

  if (context.patientAgeLabel) {
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(INK_LIGHT).text('IDADE / SEXO', leftX + 14, row2Top)
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(INK)
      .text(context.patientAgeLabel, leftX + 14, row2Top + 12, { width: colWidth - 28 })
  }

  if (context.patientCity) {
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(INK_LIGHT).text('CIDADE', rightX + 14, row2Top)
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(INK)
      .text(context.patientCity, rightX + 14, row2Top + 12, { width: colWidth - 28 })
  }

  doc.y = panelTop + panelHeight + 22
}

function drawSection(doc: PdfDoc, title: string, lines: string[], pageWidth: number) {
  const sectionTop = doc.y
  const contentX = MARGIN + 2
  const contentWidth = pageWidth - 4
  const isNumberedList = lines.length > 0 && /^\d+\.\s/.test(lines[0] ?? '')

  doc.save()
  doc.rect(MARGIN, sectionTop + 2, 3, 12).fill(BRAND_ORANGE)
  doc.restore()

  doc
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .fillColor(INK_MUTED)
    .text(title.toUpperCase(), MARGIN + 10, sectionTop)

  doc
    .moveTo(MARGIN, sectionTop + 18)
    .lineTo(MARGIN + pageWidth, sectionTop + 18)
    .strokeColor(LINE)
    .lineWidth(0.5)
    .stroke()

  doc.font('Helvetica').fontSize(10.5).fillColor(INK)

  let y = sectionTop + 28
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]!
    const lineHeight = doc.heightOfString(line, { width: contentWidth, lineGap: 1 }) + 8

    doc.text(line, contentX, y, {
      width: contentWidth,
      lineGap: 1,
    })

    y += lineHeight

    if (isNumberedList && index < lines.length - 1) {
      doc
        .moveTo(MARGIN + 8, y - 2)
        .lineTo(MARGIN + pageWidth - 8, y - 2)
        .strokeColor('#f1f5f9')
        .lineWidth(0.5)
        .stroke()
    }
  }

  doc.y = y + 16
}

function drawNotePanel(doc: PdfDoc, note: string, pageWidth: number) {
  const top = doc.y

  doc
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .fillColor(INK_MUTED)
    .text('OBSERVAÇÕES', MARGIN, top)

  doc
    .moveTo(MARGIN, top + 14)
    .lineTo(MARGIN + pageWidth, top + 14)
    .strokeColor(LINE)
    .lineWidth(0.5)
    .stroke()

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(INK)
    .text(note, MARGIN, top + 22, { width: pageWidth, lineGap: 2 })

  doc.y = top + 22 + doc.heightOfString(note, { width: pageWidth, lineGap: 2 }) + 12
}

async function drawPageFooter(
  doc: PdfDoc,
  input: {
    context: ClinicalDocumentContext
    verificationUrl: string
    codigoVerificacao: string
    pageWidth: number
    pageNumber: number
    pageCount: number
  },
) {
  const footerTop = doc.page.height - MARGIN - FOOTER_HEIGHT
  const footerWidth = input.pageWidth
  const qrSize = 64
  const leftWidth = footerWidth * 0.46
  const rightX = MARGIN + leftWidth + 14
  const rightWidth = footerWidth - leftWidth - 14

  doc.save()
  doc
    .roundedRect(MARGIN, footerTop, footerWidth, FOOTER_HEIGHT, 10)
    .fillAndStroke('#ffffff', LINE)
  doc.restore()

  doc
    .moveTo(MARGIN + leftWidth + 7, footerTop + 12)
    .lineTo(MARGIN + leftWidth + 7, footerTop + FOOTER_HEIGHT - 12)
    .strokeColor(LINE)
    .lineWidth(1)
    .stroke()

  const signatureX = MARGIN + 18
  const signatureY = footerTop + 16

  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(INK_MUTED)
    .text('ASSINATURA DO PROFISSIONAL', signatureX, signatureY, { width: leftWidth - 36 })

  doc
    .moveTo(signatureX, signatureY + 34)
    .lineTo(signatureX + leftWidth - 36, signatureY + 34)
    .strokeColor(INK)
    .lineWidth(0.8)
    .stroke()

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(INK)
    .text(input.context.doctorName, signatureX, signatureY + 42, { width: leftWidth - 36 })

  const credLines = [
    input.context.doctorCrm,
    input.context.doctorRqe ? `RQE ${input.context.doctorRqe}` : '',
    input.context.doctorSpecialty,
  ].filter(Boolean)

  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(INK_MUTED)
    .text(credLines.join(' · '), signatureX, signatureY + 58, {
      width: leftWidth - 36,
      lineGap: 1,
    })

  doc
    .font('Helvetica-Oblique')
    .fontSize(7.5)
    .fillColor(INK_FAINT)
    .text(
      'Documento emitido eletronicamente via plataforma Telefarmed.',
      signatureX,
      footerTop + FOOTER_HEIGHT - 22,
      { width: leftWidth - 36 },
    )

  const qrPng = await QRCode.toBuffer(input.verificationUrl, {
    type: 'png',
    margin: 0,
    width: 220,
    errorCorrectionLevel: 'M',
  })

  const qrY = footerTop + 16
  doc.save()
  doc.roundedRect(rightX, qrY, qrSize + 8, qrSize + 8, 6).fillAndStroke(PANEL, LINE)
  doc.restore()
  doc.image(qrPng, rightX + 4, qrY + 4, { width: qrSize, height: qrSize })

  const verifyTextX = rightX + qrSize + 18
  const verifyTextWidth = rightWidth - qrSize - 22

  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(BRAND_ORANGE)
    .text('VERIFICAÇÃO DE AUTENTICIDADE', verifyTextX, qrY + 2, { width: verifyTextWidth })

  doc
    .font('Helvetica-Bold')
    .fontSize(9.5)
    .fillColor(INK)
    .text(`Código ${input.codigoVerificacao}`, verifyTextX, qrY + 16, { width: verifyTextWidth })

  doc
    .font('Helvetica')
    .fontSize(7.5)
    .fillColor(INK_MUTED)
    .text(
      'Escaneie o QR Code ou acesse o link abaixo para validar este documento.',
      verifyTextX,
      qrY + 32,
      { width: verifyTextWidth, lineGap: 1 },
    )

  doc
    .font('Helvetica')
    .fontSize(7)
    .fillColor(BRAND_ORANGE)
    .text(formatVerificationUrl(input.verificationUrl), verifyTextX, qrY + 52, {
      width: verifyTextWidth,
      lineGap: 1,
    })

  doc
    .font('Helvetica')
    .fontSize(7)
    .fillColor(INK_FAINT)
    .text(`Página ${input.pageNumber} de ${input.pageCount}`, MARGIN, footerTop + FOOTER_HEIGHT + 8, {
      width: footerWidth,
      align: 'center',
    })
}

function formatVerificationUrl(url: string): string {
  try {
    const parsed = new URL(url)
    return `${parsed.host}${parsed.pathname}`
  } catch {
    return url.replace(/^https?:\/\//, '')
  }
}
