import { brand } from '../../config/brand'

export type BalancoExportCentroRow = {
  nome: string
  valorBase: number
  ajuste: number
  valor: number
}

export type BalancoExportContext = {
  filterSummaryLines: string[]
  receita: number
  despesas: number
  resultado: number
  lucratividadePercentual: number
  despesasPagas: number
  totalEmAtrasoReceber: number
  despesasPorCentro: BalancoExportCentroRow[]
}

const BRAND_ORANGE: [number, number, number] = [255, 107, 0]
const BRAND_ORANGE_LIGHT: [number, number, number] = [255, 237, 213]
const SLATE_900: [number, number, number] = [17, 24, 39]
const SLATE_700: [number, number, number] = [55, 65, 81]
const SLATE_500: [number, number, number] = [107, 114, 128]
const SLATE_400: [number, number, number] = [156, 163, 175]
const SLATE_100: [number, number, number] = [243, 244, 246]
const SLATE_50: [number, number, number] = [249, 250, 251]
const EMERALD_700: [number, number, number] = [4, 120, 87]
const RED_700: [number, number, number] = [185, 28, 28]

const LOGO_MAX_WIDTH = 72
const LOGO_MAX_HEIGHT = 18
const MARGIN_X = 16
const FOOTER_HEIGHT = 26

type LoadedImage = {
  dataUrl: string
  naturalWidth: number
  naturalHeight: number
  format: 'PNG' | 'JPEG' | 'WEBP'
}

function formatCurrency(value: number) {
  const safe = Number.isFinite(value) ? value : 0
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe)
}

function formatPercent(value: number) {
  const safe = Number.isFinite(value) ? value : 0
  return `${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(safe)}%`
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

function exportStamp() {
  return new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
    .format(new Date())
    .replace(/[^\d]/g, '')
}

function csvCell(value: string | number) {
  const text = String(value)
  return `"${text.replace(/"/g, '""')}"`
}

function resolveAssetUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${window.location.origin}${normalized}`
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
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) return 'JPEG'
  if (dataUrl.startsWith('data:image/webp')) return 'WEBP'
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

function fitImageBox(naturalWidth: number, naturalHeight: number, maxWidth: number, maxHeight: number) {
  const aspect = naturalWidth / naturalHeight
  let width = maxWidth
  let height = width / aspect
  if (height > maxHeight) {
    height = maxHeight
    width = height * aspect
  }
  return { width, height }
}

function drawPageFooter(
  doc: import('jspdf').jsPDF,
  page: number,
  pageCount: number,
  pageWidth: number,
  pageHeight: number,
) {
  doc.setFillColor(...BRAND_ORANGE_LIGHT)
  doc.rect(0, pageHeight - FOOTER_HEIGHT, pageWidth, FOOTER_HEIGHT, 'F')
  doc.setDrawColor(...BRAND_ORANGE)
  doc.setLineWidth(0.4)
  doc.line(0, pageHeight - FOOTER_HEIGHT, pageWidth, pageHeight - FOOTER_HEIGHT)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...SLATE_500)
  doc.text(brand.copyright, pageWidth / 2, pageHeight - 14, { align: 'center' })
  doc.text(
    `Documento gerado automaticamente  Página ${page} de ${pageCount}`,
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' },
  )
}

type KpiCardSpec = {
  label: string
  value: string
  accent: [number, number, number]
  valueColor?: [number, number, number]
}

function drawKpiCard(
  doc: import('jspdf').jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  card: KpiCardSpec,
) {
  doc.setFillColor(...SLATE_50)
  doc.setDrawColor(229, 231, 235)
  doc.setLineWidth(0.35)
  doc.roundedRect(x, y, width, height, 3, 3, 'FD')

  doc.setFillColor(...card.accent)
  doc.roundedRect(x, y, width, 2.8, 3, 3, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...SLATE_400)
  doc.text(card.label.toUpperCase(), x + 8, y + 14)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...(card.valueColor ?? SLATE_900))
  doc.text(card.value, x + 8, y + 28, { maxWidth: width - 16 })
}

function drawSectionTitle(doc: import('jspdf').jsPDF, y: number, title: string, subtitle?: string) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...SLATE_900)
  doc.text(title, MARGIN_X, y)

  if (subtitle) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...SLATE_500)
    doc.text(subtitle, MARGIN_X, y + 6)
    return y + 14
  }

  return y + 8
}

export async function exportBalancoPdf(context: BalancoExportContext) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])

  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const contentWidth = pageWidth - MARGIN_X * 2
  const generatedAt = formatGeneratedAt(new Date())

  doc.setFillColor(...BRAND_ORANGE)
  doc.rect(0, 0, pageWidth, 3.2, 'F')

  let cursorY = 14
  const logoImage = await loadImageWithDimensions(resolveAssetUrl(brand.logoUrl))
  let headerBlockHeight = 20

  if (logoImage) {
    const logoBox = fitImageBox(
      logoImage.naturalWidth,
      logoImage.naturalHeight,
      LOGO_MAX_WIDTH,
      LOGO_MAX_HEIGHT,
    )
    doc.addImage(
      logoImage.dataUrl,
      logoImage.format,
      MARGIN_X,
      cursorY,
      logoBox.width,
      logoBox.height,
      undefined,
      'NONE',
    )
    headerBlockHeight = Math.max(headerBlockHeight, logoBox.height + 4)
  } else {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(...BRAND_ORANGE)
    doc.text(brand.appName, MARGIN_X, cursorY + 10)
  }

  const titleBaseline = cursorY + headerBlockHeight / 2 - 2
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...SLATE_900)
  doc.text('Balanço financeiro', pageWidth - MARGIN_X, titleBaseline, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10.5)
  doc.setTextColor(...SLATE_500)
  doc.text('da operação', pageWidth - MARGIN_X, titleBaseline + 7, { align: 'right' })
  doc.setFontSize(9)
  doc.text(`Gerado em ${generatedAt}`, pageWidth - MARGIN_X, titleBaseline + 14, { align: 'right' })

  cursorY += headerBlockHeight + 8
  doc.setDrawColor(229, 231, 235)
  doc.setLineWidth(0.6)
  doc.line(MARGIN_X, cursorY, pageWidth - MARGIN_X, cursorY)
  cursorY += 10

  if (context.filterSummaryLines.length > 0) {
    const filterBoxHeight = 8 + context.filterSummaryLines.length * 5.5
    doc.setFillColor(...SLATE_50)
    doc.setDrawColor(229, 231, 235)
    doc.roundedRect(MARGIN_X, cursorY, contentWidth, filterBoxHeight, 2.5, 2.5, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...SLATE_400)
    doc.text('FILTROS APLICADOS', MARGIN_X + 8, cursorY + 7)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...SLATE_700)
    context.filterSummaryLines.forEach((line, index) => {
      doc.text(`• ${line}`, MARGIN_X + 8, cursorY + 13 + index * 5.5)
    })

    cursorY += filterBoxHeight + 10
  }

  cursorY = drawSectionTitle(doc, cursorY, 'Resumo executivo', 'Indicadores consolidados do período selecionado')

  const resultadoColor: [number, number, number] =
    context.resultado >= 0 ? EMERALD_700 : RED_700
  const lucratividadeColor: [number, number, number] =
    context.lucratividadePercentual >= 0 ? EMERALD_700 : RED_700

  const kpiCards: KpiCardSpec[] = [
    { label: 'Receita prevista', value: formatCurrency(context.receita), accent: [16, 185, 129] },
    { label: 'Despesas operacionais', value: formatCurrency(context.despesas), accent: BRAND_ORANGE },
    {
      label: 'Resultado',
      value: formatCurrency(context.resultado),
      accent: context.resultado >= 0 ? [14, 165, 233] : [244, 63, 94],
      valueColor: resultadoColor,
    },
    {
      label: 'Lucratividade',
      value: formatPercent(context.lucratividadePercentual),
      accent: [99, 102, 241],
      valueColor: lucratividadeColor,
    },
    { label: 'Contas pagas', value: formatCurrency(context.despesasPagas), accent: [34, 197, 94] },
    {
      label: 'Receber em atraso',
      value: formatCurrency(context.totalEmAtrasoReceber),
      accent: [239, 68, 68],
      valueColor: context.totalEmAtrasoReceber > 0 ? RED_700 : SLATE_900,
    },
  ]

  const cardGap = 4
  const cardWidth = (contentWidth - cardGap * 2) / 3
  const cardHeight = 34

  kpiCards.forEach((card, index) => {
    const col = index % 3
    const row = Math.floor(index / 3)
    const x = MARGIN_X + col * (cardWidth + cardGap)
    const y = cursorY + row * (cardHeight + cardGap)
    drawKpiCard(doc, x, y, cardWidth, cardHeight, card)
  })

  cursorY += 2 * (cardHeight + cardGap) + 8

  const totalBase = context.despesasPorCentro.reduce((acc, row) => acc + row.valorBase, 0)
  const totalAjuste = context.despesasPorCentro.reduce((acc, row) => acc + row.ajuste, 0)
  const totalConsolidado = context.despesasPorCentro.reduce((acc, row) => acc + row.valor, 0)

  cursorY = drawSectionTitle(
    doc,
    cursorY,
    'Despesas por centro de custo',
    `${context.despesasPorCentro.length} centro${context.despesasPorCentro.length === 1 ? '' : 's'} de custo`,
  )

  autoTable(doc, {
    startY: cursorY,
    margin: { left: MARGIN_X, right: MARGIN_X, bottom: FOOTER_HEIGHT + 6 },
    tableWidth: contentWidth,
    head: [['Centro de custo', 'Despesa base', 'Ajuste manual', 'Despesa consolidada']],
    body: context.despesasPorCentro.map((centro) => [
      centro.nome,
      formatCurrency(centro.valorBase),
      formatCurrency(centro.ajuste),
      formatCurrency(centro.valor),
    ]),
    foot: [[
      'Total',
      formatCurrency(totalBase),
      formatCurrency(totalAjuste),
      formatCurrency(totalConsolidado),
    ]],
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 9.5,
      cellPadding: { top: 7, right: 8, bottom: 7, left: 8 },
      lineColor: [243, 244, 246],
      lineWidth: { top: 0, right: 0, bottom: 0.4, left: 0 },
      textColor: SLATE_700,
      valign: 'middle',
    },
    headStyles: {
      fillColor: SLATE_900,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      cellPadding: { top: 8, right: 8, bottom: 8, left: 8 },
    },
    footStyles: {
      fillColor: SLATE_100,
      textColor: SLATE_900,
      fontStyle: 'bold',
      fontSize: 9.5,
    },
    alternateRowStyles: {
      fillColor: [252, 252, 253],
    },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.4 },
      1: { halign: 'right', cellWidth: contentWidth * 0.2 },
      2: { halign: 'right', cellWidth: contentWidth * 0.2 },
      3: { halign: 'right', cellWidth: contentWidth * 0.2, fontStyle: 'bold', textColor: SLATE_900 },
    },
  })

  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    drawPageFooter(doc, page, pageCount, pageWidth, pageHeight)
  }

  doc.save(`balanco-operacao-${exportStamp()}.pdf`)
}

export function exportBalancoExcel(context: BalancoExportContext) {
  const lines: string[][] = [
    ['Relatório', 'Balanço financeiro da operação'],
    ['Gerado em', formatGeneratedAt(new Date())],
    [''],
  ]

  for (const line of context.filterSummaryLines) {
    const separatorIndex = line.indexOf(':')
    if (separatorIndex > 0) {
      lines.push([line.slice(0, separatorIndex).trim(), line.slice(separatorIndex + 1).trim()])
    } else {
      lines.push([line, ''])
    }
  }

  lines.push(
    [''],
    ['Indicador', 'Valor'],
    ['Receita prevista', formatCurrency(context.receita)],
    ['Despesas operacionais', formatCurrency(context.despesas)],
    ['Resultado', formatCurrency(context.resultado)],
    ['Lucratividade', formatPercent(context.lucratividadePercentual)],
    ['Contas pagas', formatCurrency(context.despesasPagas)],
    ['Contas a receber em atraso', formatCurrency(context.totalEmAtrasoReceber)],
    [''],
    ['Centro de custo', 'Despesa base', 'Ajuste', 'Despesa consolidada'],
    ...context.despesasPorCentro.map((centro) => [
      centro.nome,
      formatCurrency(centro.valorBase),
      formatCurrency(centro.ajuste),
      formatCurrency(centro.valor),
    ]),
  )

  const csv = lines.map((row) => row.map((cell) => csvCell(cell)).join(';')).join('\r\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `balanco-operacao-${exportStamp()}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
