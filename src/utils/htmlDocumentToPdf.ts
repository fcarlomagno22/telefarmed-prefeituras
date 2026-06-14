import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

export const HTML_PDF_EXPORT_MESSAGE_TYPE = 'telefarmed-export-html-as-pdf'

export type DownloadWindowAsPdfOptions = {
  filename: string
  scale?: number
  /** Reduz proporcionalmente o conteúdo para caber em uma única página A4. */
  singlePage?: boolean
  /** Escala o conteúdo para caber em até N páginas A4 com margem. */
  maxPages?: number
  marginMm?: number
}

function waitForImages(ownerDocument: Document) {
  const images = Array.from(ownerDocument.images)
  return Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve()
            return
          }
          image.addEventListener('load', () => resolve(), { once: true })
          image.addEventListener('error', () => resolve(), { once: true })
        }),
    ),
  )
}

async function waitForStylesheets(ownerDocument: Document) {
  const links = Array.from(
    ownerDocument.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
  )

  await Promise.all(
    links.map(
      (link) =>
        new Promise<void>((resolve) => {
          if (link.sheet) {
            resolve()
            return
          }
          link.addEventListener('load', () => resolve(), { once: true })
          link.addEventListener('error', () => resolve(), { once: true })
        }),
    ),
  )
}

function appendCanvasToPdf(
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  options: {
    marginMm?: number
    singlePage?: boolean
    maxPages?: number
    startNewPage?: boolean
  },
) {
  if (canvas.width === 0 || canvas.height === 0) {
    throw new Error('O relatório não pôde ser renderizado para PDF.')
  }

  const { marginMm = 4, singlePage = false, maxPages, startNewPage = false } = options
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imgData = canvas.toDataURL('image/jpeg', 0.92)
  const hasExistingPages = pdf.getNumberOfPages() > 0

  if (startNewPage && hasExistingPages) {
    pdf.addPage()
  }

  if (singlePage) {
    const availableWidth = pageWidth - marginMm * 2
    const availableHeight = pageHeight - marginMm * 2
    const naturalHeight = (canvas.height * availableWidth) / canvas.width

    let drawWidth = availableWidth
    let drawHeight = naturalHeight
    let offsetX = marginMm
    let offsetY = marginMm

    if (naturalHeight > availableHeight) {
      const fitScale = availableHeight / naturalHeight
      drawWidth = availableWidth * fitScale
      drawHeight = availableHeight
      offsetX = marginMm + (availableWidth - drawWidth) / 2
    } else {
      offsetY = marginMm + (availableHeight - drawHeight) / 2
    }

    pdf.addImage(imgData, 'JPEG', offsetX, offsetY, drawWidth, drawHeight)
    return
  }

  if (maxPages && maxPages > 0) {
    const availableWidth = pageWidth - marginMm * 2
    const chunkHeight = pageHeight - marginMm * 2
    const maxTotalHeight = chunkHeight * maxPages

    let drawWidth = availableWidth
    let drawHeight = (canvas.height * drawWidth) / canvas.width

    if (drawHeight > maxTotalHeight) {
      const fitScale = maxTotalHeight / drawHeight
      drawWidth *= fitScale
      drawHeight = maxTotalHeight
    }

    const offsetX = marginMm + (availableWidth - drawWidth) / 2

    for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
      if (pageIndex > 0) pdf.addPage()
      pdf.addImage(
        imgData,
        'JPEG',
        offsetX,
        marginMm - chunkHeight * pageIndex,
        drawWidth,
        drawHeight,
      )
    }
    return
  }

  const imgWidth = pageWidth - marginMm * 2
  const imgHeight = (canvas.height * imgWidth) / canvas.width
  const chunkHeight = pageHeight - marginMm * 2
  let heightLeft = imgHeight
  let pageIndex = 0

  while (heightLeft > 0) {
    if (pageIndex > 0) pdf.addPage()
    pdf.addImage(
      imgData,
      'JPEG',
      marginMm,
      marginMm - chunkHeight * pageIndex,
      imgWidth,
      imgHeight,
    )
    heightLeft -= chunkHeight
    pageIndex += 1
  }
}

function saveCanvasAsPdf(canvas: HTMLCanvasElement, options: DownloadWindowAsPdfOptions) {
  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
  appendCanvasToPdf(pdf, canvas, options)
  pdf.save(options.filename)
}

export type DownloadElementsAsPdfSection = {
  element: HTMLElement
  singlePage?: boolean
  maxPages?: number
}

export async function downloadElementsAsPdf(
  sections: DownloadElementsAsPdfSection[],
  options: { filename: string; scale?: number; marginMm?: number },
) {
  if (sections.length === 0) {
    throw new Error('Nenhuma seção disponível para exportação do PDF.')
  }

  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
  const scale = options.scale ?? 2
  const marginMm = options.marginMm ?? 4

  for (let index = 0; index < sections.length; index += 1) {
    const section = sections[index]
    const canvas = await renderElementToCanvas(section.element, scale)
    appendCanvasToPdf(pdf, canvas, {
      marginMm,
      singlePage: section.singlePage,
      maxPages: section.maxPages,
      startNewPage: index > 0,
    })
  }

  pdf.save(options.filename)
}

async function renderElementToCanvas(element: HTMLElement, scale: number) {
  const ownerDocument = element.ownerDocument

  if (ownerDocument.fonts?.ready) {
    await ownerDocument.fonts.ready
  }
  await waitForStylesheets(ownerDocument)
  await waitForImages(ownerDocument)
  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve())
  })

  return html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff',
    width: element.scrollWidth,
    height: element.scrollHeight,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
    scrollX: 0,
    scrollY: 0,
    ignoreElements: (node) => node.classList.contains('no-print'),
  })
}

function copyPageStyles(targetDocument: Document) {
  const head = targetDocument.head
  document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
    head.appendChild(node.cloneNode(true))
  })
}

function expandElementForCapture(element: HTMLElement) {
  const width = Math.max(element.scrollWidth, element.getBoundingClientRect().width)

  element.style.overflow = 'visible'
  element.style.maxWidth = 'none'
  element.style.width = `${width}px`

  element.querySelectorAll<HTMLElement>('*').forEach((node) => {
    const className = node.className
    if (typeof className === 'string' && /overflow-/.test(className)) {
      node.style.overflow = 'visible'
      node.style.overflowX = 'visible'
    }
  })

  const table = element.querySelector('table')
  if (table instanceof HTMLElement) {
    const tableWidth = Math.max(table.scrollWidth, table.getBoundingClientRect().width)
    if (tableWidth > width) {
      element.style.width = `${tableWidth}px`
    }
    table.style.minWidth = `${tableWidth}px`
  }

  return Math.max(
    width,
    element.scrollWidth,
    element.getBoundingClientRect().width,
  )
}

function createCaptureFrame(width: number) {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText = [
    'position:fixed',
    'left:0',
    'top:0',
    `width:${width}px`,
    'height:1px',
    'border:0',
    'opacity:0',
    'pointer-events:none',
    'z-index:-1',
  ].join(';')
  document.body.appendChild(iframe)

  const frameDocument = iframe.contentDocument
  if (!frameDocument) {
    document.body.removeChild(iframe)
    throw new Error('Não foi possível preparar a exportação do PDF.')
  }

  frameDocument.open()
  frameDocument.write(
    '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8" /></head><body style="margin:0;background:#fff;"></body></html>',
  )
  frameDocument.close()

  copyPageStyles(frameDocument)

  return iframe
}

async function waitForCaptureFrame(iframe: HTMLIFrameElement) {
  const frameDocument = iframe.contentDocument
  if (!frameDocument) return

  if (frameDocument.readyState !== 'complete') {
    await new Promise<void>((resolve) => {
      iframe.addEventListener('load', () => resolve(), { once: true })
    })
  }

  if (frameDocument.fonts?.ready) {
    await frameDocument.fonts.ready
  }

  await waitForStylesheets(frameDocument)
  await new Promise<void>((resolve) => {
    window.setTimeout(() => resolve(), 150)
  })
}

export async function downloadElementAsPdf(
  element: HTMLElement,
  options: DownloadWindowAsPdfOptions,
) {
  const baseWidth = Math.max(element.scrollWidth, element.getBoundingClientRect().width)
  let iframe: HTMLIFrameElement | null = null

  try {
    iframe = createCaptureFrame(baseWidth)
    await waitForCaptureFrame(iframe)

    const frameDocument = iframe.contentDocument
    if (!frameDocument?.body) {
      throw new Error('Não foi possível preparar a exportação do PDF.')
    }

    const clone = element.cloneNode(true) as HTMLElement
    clone.style.margin = '0'
    frameDocument.body.appendChild(clone)

    await waitForImages(frameDocument)
    await new Promise<void>((resolve) => {
      window.setTimeout(() => resolve(), 200)
    })

    const captureWidth = expandElementForCapture(clone)
    iframe.style.width = `${captureWidth}px`

    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve())
    })

    const scale = options.scale ?? 2
    const canvas = await renderElementToCanvas(clone, scale)
    saveCanvasAsPdf(canvas, options)
  } finally {
    if (iframe?.parentNode) {
      iframe.parentNode.removeChild(iframe)
    }
  }
}

export async function downloadWindowAsPdf(
  targetWindow: Window,
  options: DownloadWindowAsPdfOptions,
) {
  const ownerDocument = targetWindow.document
  const root = (ownerDocument.querySelector('main') ?? ownerDocument.body) as HTMLElement
  const scale = options.scale ?? 2
  const canvas = await renderElementToCanvas(root, scale)
  saveCanvasAsPdf(canvas, options)
}

export function pdfFilenameFromLabel(prefix: string, label: string) {
  const slug = label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${prefix}-${slug || 'do-dia'}.pdf`
}
