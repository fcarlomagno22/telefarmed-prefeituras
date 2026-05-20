import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

export const HTML_PDF_EXPORT_MESSAGE_TYPE = 'telefarmed-export-html-as-pdf'

export type DownloadWindowAsPdfOptions = {
  filename: string
  scale?: number
}

function waitForImages(document: Document) {
  const images = Array.from(document.images)
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

export async function downloadWindowAsPdf(
  targetWindow: Window,
  options: DownloadWindowAsPdfOptions,
) {
  const document = targetWindow.document
  const root = (document.querySelector('main') ?? document.body) as HTMLElement

  if (document.fonts?.ready) {
    await document.fonts.ready
  }
  await waitForImages(document)

  const scale = options.scale ?? 2
  const canvas = await html2canvas(root, {
    scale,
    useCORS: true,
    allowTaint: false,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: root.scrollWidth,
    ignoreElements: (element) => element.classList.contains('no-print'),
  })

  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imgWidth = pageWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width
  const imgData = canvas.toDataURL('image/jpeg', 0.92)

  let heightLeft = imgHeight
  let position = 0

  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
  heightLeft -= pageHeight

  while (heightLeft > 0) {
    position = heightLeft - imgHeight
    pdf.addPage()
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
  }

  pdf.save(options.filename)
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
