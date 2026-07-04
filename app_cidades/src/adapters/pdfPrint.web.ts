/**
 * Web: html2pdf.js gera blob PDF a partir de HTML em iframe oculto.
 * Fallback: URI virtual + impressao do HTML isolado (iframe oculto, nunca a pagina do app).
 */
import {
  DEFAULT_PDF_PAGE_HEIGHT,
  DEFAULT_PDF_PAGE_WIDTH,
  HTML_PRINT_FALLBACK_URI_PREFIX,
  isHtmlPrintFallbackPdf,
  type RenderHtmlToPdfOptions,
  type RenderHtmlToPdfResult,
} from './pdfPrint.types'

export {
  DEFAULT_PDF_PAGE_HEIGHT,
  DEFAULT_PDF_PAGE_WIDTH,
  HTML_PRINT_FALLBACK_URI_PREFIX,
  isHtmlPrintFallbackPdf,
} from './pdfPrint.types'

type StoredHtmlPdf = {
  html: string
  width: number
  height: number
}

const htmlPdfStore = new Map<string, StoredHtmlPdf>()

function waitForIframeLoad(iframe: HTMLIFrameElement): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error('Tempo esgotado ao renderizar o documento para PDF.'))
    }, 15000)

    iframe.addEventListener(
      'load',
      () => {
        window.clearTimeout(timeout)
        resolve()
      },
      { once: true },
    )
  })
}

async function waitForDocumentImages(doc: Document): Promise<void> {
  const images = Array.from(doc.images)
  await Promise.all(
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

async function mountHtmlDocument(html: string): Promise<{
  iframe: HTMLIFrameElement
  cleanup: () => void
}> {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText =
    'position:fixed;left:-10000px;top:0;width:794px;height:1123px;border:0;visibility:hidden;'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument
  if (!doc) {
    document.body.removeChild(iframe)
    throw new Error('Nao foi possivel preparar o documento para PDF no navegador.')
  }

  doc.open()
  doc.write(html)
  doc.close()

  await waitForIframeLoad(iframe)
  await waitForDocumentImages(doc)

  return {
    iframe,
    cleanup: () => {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe)
      }
    },
  }
}

async function tryCreatePdfBlobFromHtml(
  html: string,
  width: number,
  height: number,
): Promise<Blob | null> {
  let mounted: Awaited<ReturnType<typeof mountHtmlDocument>> | null = null

  try {
    mounted = await mountHtmlDocument(html)
    const doc = mounted.iframe.contentDocument
    if (!doc?.body) return null

    const html2pdfModule = await import('html2pdf.js')
    const html2pdf = html2pdfModule.default

    const blob = (await html2pdf()
      .set({
        margin: 0,
        filename: 'document.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          width,
          windowWidth: width,
        },
        jsPDF: {
          unit: 'pt',
          format: [width, height],
          orientation: height >= width ? 'portrait' : 'landscape',
        },
        pagebreak: { mode: ['css', 'legacy'] },
      })
      .from(doc.body)
      .outputPdf('blob')) as Blob

    return blob
  } catch {
    return null
  } finally {
    mounted?.cleanup()
  }
}

function storeHtmlForPrintFallback(
  html: string,
  width: number,
  height: number,
): RenderHtmlToPdfResult {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

  htmlPdfStore.set(id, { html, width, height })
  return { uri: `${HTML_PRINT_FALLBACK_URI_PREFIX}${id}` }
}

export function getStoredHtmlForPrintFallback(uri: string): StoredHtmlPdf | null {
  if (!isHtmlPrintFallbackPdf(uri)) return null
  return htmlPdfStore.get(uri.slice(HTML_PRINT_FALLBACK_URI_PREFIX.length)) ?? null
}

export function releaseHtmlPrintFallback(uri: string): void {
  if (!isHtmlPrintFallbackPdf(uri)) return
  htmlPdfStore.delete(uri.slice(HTML_PRINT_FALLBACK_URI_PREFIX.length))
}

export async function printHtmlDocument(html: string, title?: string): Promise<void> {
  const mounted = await mountHtmlDocument(html)

  try {
    const frameWindow = mounted.iframe.contentWindow
    if (!frameWindow) {
      throw new Error('Nao foi possivel abrir a impressao do documento.')
    }

    if (title) {
      frameWindow.document.title = title
    }

    frameWindow.focus()
    frameWindow.print()
  } finally {
    window.setTimeout(() => mounted.cleanup(), 1000)
  }
}

async function openHtmlPrintWindow(html: string, title?: string): Promise<void> {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer')
  if (!printWindow) {
    throw new Error('Permita pop-ups para imprimir ou salvar o PDF no navegador.')
  }

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.document.title = title ?? 'Documento'

  const triggerPrint = () => {
    printWindow.focus()
    printWindow.print()
  }

  if (printWindow.document.readyState === 'complete') {
    window.setTimeout(triggerPrint, 250)
  } else {
    printWindow.addEventListener('load', () => window.setTimeout(triggerPrint, 250), {
      once: true,
    })
  }
}

export async function deliverHtmlPrintFallback(uri: string, title?: string): Promise<void> {
  const stored = getStoredHtmlForPrintFallback(uri)
  if (!stored) {
    throw new Error('Documento expirado. Gere o PDF novamente.')
  }

  try {
    await printHtmlDocument(stored.html, title)
  } catch {
    await openHtmlPrintWindow(stored.html, title)
  }
}

export async function renderHtmlToPdfFile({
  html,
  width = DEFAULT_PDF_PAGE_WIDTH,
  height = DEFAULT_PDF_PAGE_HEIGHT,
}: RenderHtmlToPdfOptions): Promise<RenderHtmlToPdfResult> {
  const blob = await tryCreatePdfBlobFromHtml(html, width, height)
  if (blob) {
    return { uri: URL.createObjectURL(blob) }
  }

  return storeHtmlForPrintFallback(html, width, height)
}
