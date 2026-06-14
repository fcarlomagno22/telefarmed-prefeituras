import { brand } from '../config/brand'
import type { PatientProntuarioData } from '../types/patientProntuario'
import { downloadWindowAsPdf, pdfFilenameFromLabel } from './htmlDocumentToPdf'

type ExportContext = {
  prontuario: PatientProntuarioData
  generatedAtLabel: string
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function resolveAssetUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`
}

function buildStyles() {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827; background: #fff; line-height: 1.5; }
    main { max-width: 900px; margin: 0 auto; padding: 28px 32px 36px; border: 1px solid #e5e7eb; border-radius: 16px; background: #fff; }
    .brand-bar { height: 4px; background: #ff6b00; border-radius: 999px; margin-bottom: 20px; }
    .header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
    .header img { height: 36px; width: auto; }
    .eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af; }
    h1 { font-size: 22px; font-weight: 700; color: #111827; margin-top: 4px; }
    .subtitle { margin-top: 4px; font-size: 13px; color: #6b7280; }
    .meta { margin-top: 12px; font-size: 12px; color: #6b7280; } .meta p + p { margin-top: 4px; }
    section { margin-top: 24px; }
    h2 { font-size: 14px; font-weight: 700; color: #111827; border-bottom: 2px solid #ff6b00; padding-bottom: 8px; margin-bottom: 14px; }
    h3 { font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 8px; }
    .patient-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 16px; font-size: 12px; }
    .patient-grid dt { font-weight: 600; color: #6b7280; }
    .entry { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 14px; page-break-inside: avoid; }
    .entry-header { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
    .entry-title { font-size: 14px; font-weight: 700; color: #111827; }
    .entry-meta { font-size: 11px; color: #6b7280; margin-top: 4px; }
    .badge { display: inline-block; border-radius: 999px; padding: 2px 8px; font-size: 10px; font-weight: 700; }
    .badge-ok { background: #ecfdf5; color: #065f46; }
    .badge-warn { background: #fffbeb; color: #92400e; }
    .block { margin-top: 12px; }
    .block-label { font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #9ca3af; margin-bottom: 6px; }
    .block-text { font-size: 12px; color: #374151; white-space: pre-wrap; }
    ul { padding-left: 18px; font-size: 12px; color: #374151; }
    li + li { margin-top: 6px; }
    .message { border-left: 3px solid #e5e7eb; padding-left: 10px; margin-top: 8px; font-size: 12px; }
    .message-from { font-weight: 700; color: #374151; }
    .message-time { color: #9ca3af; font-size: 10px; margin-left: 6px; }
    .footer { margin-top: 28px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #6b7280; }
  `
}

function messageFromLabel(from: 'doctor' | 'patient' | 'system') {
  if (from === 'doctor') return 'Profissional'
  if (from === 'patient') return 'Paciente'
  return 'Sistema'
}

function statusLabel(status: 'concluido' | 'interrompido') {
  return status === 'concluido' ? 'Concluído' : 'Interrompido'
}

export function buildPatientProntuarioReportHtml({ prontuario, generatedAtLabel }: ExportContext) {
  const logoUrl = resolveAssetUrl(brand.logoUrl)
  const { patient, entries } = prontuario

  const patientFields = [
    ['Prontuário', patient.municipalRecordId],
    ['CPF', patient.cpf],
    ['Nascimento', `${patient.birthDate} (${patient.age} anos)`],
    ['Sexo', patient.genderLabel],
    ['Município', patient.municipality],
    ['Bairro', patient.neighborhood],
    ['Entidade contratante', patient.contractingEntityRazaoSocial],
    ['Unidade de cadastro', patient.registrationUnit],
    ['Cadastro em', patient.registeredAt],
  ]
    .map(
      ([label, value]) =>
        `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`,
    )
    .join('')

  const entryBlocks = entries
    .map((entry) => {
      const prescriptions =
        entry.prescriptions.length > 0
          ? `<div class="block"><p class="block-label">Prescrições</p><ul>${entry.prescriptions
              .map(
                (item) =>
                  `<li><strong>${escapeHtml(item.medicationName)}</strong>${item.dosage ? ` — ${escapeHtml(item.dosage)}` : ''}${item.frequency ? `, ${escapeHtml(item.frequency)}` : ''}${item.duration ? `, ${escapeHtml(item.duration)}` : ''}${item.notes ? `. ${escapeHtml(item.notes)}` : ''}</li>`,
              )
              .join('')}</ul></div>`
          : ''

      const exams =
        entry.examRequests.length > 0
          ? `<div class="block"><p class="block-label">Pedidos de exame</p><ul>${entry.examRequests
              .map(
                (item) =>
                  `<li><strong>${escapeHtml(item.examName)}</strong>${item.notes ? ` — ${escapeHtml(item.notes)}` : ''}</li>`,
              )
              .join('')}</ul></div>`
          : ''

      const documents =
        entry.issuedDocuments.length > 0
          ? `<div class="block"><p class="block-label">Documentos emitidos</p><ul>${entry.issuedDocuments
              .map(
                (item) =>
                  `<li>${escapeHtml(item.title)} — ${escapeHtml(item.meta)}${item.signedAtLabel ? ` (${escapeHtml(item.signedAtLabel)})` : ''}</li>`,
              )
              .join('')}</ul></div>`
          : ''

      const messages =
        entry.messages.length > 0
          ? `<div class="block"><p class="block-label">Registro da consulta</p>${entry.messages
              .map(
                (item) =>
                  `<div class="message"><span class="message-from">${escapeHtml(messageFromLabel(item.from))}</span><span class="message-time">${escapeHtml(item.time)}</span><p>${escapeHtml(item.text)}</p></div>`,
              )
              .join('')}</div>`
          : ''

      const triage = entry.triageSummary
        ? `<div class="block"><p class="block-label">Triagem</p><p class="block-text">${escapeHtml(entry.triageSummary)}</p></div>`
        : ''

      const notes = entry.clinicalNotes
        ? `<div class="block"><p class="block-label">Anotações clínicas</p><p class="block-text">${escapeHtml(entry.clinicalNotes)}</p></div>`
        : ''

      const badgeClass = entry.status === 'concluido' ? 'badge-ok' : 'badge-warn'

      return `
        <article class="entry">
          <div class="entry-header">
            <div>
              <p class="entry-title">${escapeHtml(entry.specialty)}</p>
              <p class="entry-meta">${escapeHtml(entry.dateTimeLabel)} · ${escapeHtml(entry.attendanceId)}</p>
              <p class="entry-meta">${escapeHtml(entry.professionalName)}${entry.professionalCrm !== '—' ? ` · ${escapeHtml(entry.professionalCrm)}` : ''}</p>
              <p class="entry-meta">${escapeHtml(entry.ubtName)} · ${entry.durationMinutes} min</p>
            </div>
            <span class="badge ${badgeClass}">${statusLabel(entry.status)}</span>
          </div>
          ${triage}
          ${notes}
          ${prescriptions}
          ${exams}
          ${documents}
          ${messages}
        </article>
      `
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Prontuário — ${escapeHtml(patient.name)}</title>
  <style>${buildStyles()}</style>
</head>
<body>
  <main>
    <div class="brand-bar"></div>
    <header class="header">
      <div>
        <p class="eyebrow">Prontuário médico</p>
        <h1>${escapeHtml(patient.name)}</h1>
        <p class="subtitle">Histórico clínico completo de teleconsultas na rede Telefarmed.</p>
        <div class="meta">
          <p>Gerado em ${escapeHtml(generatedAtLabel)}</p>
          <p>Identificação: ${escapeHtml(patient.municipalRecordId)}</p>
        </div>
      </div>
      <img src="${logoUrl}" alt="${escapeHtml(brand.appName)}" />
    </header>

    <section>
      <h2>Dados do paciente</h2>
      <dl class="patient-grid">${patientFields}</dl>
    </section>

    <section>
      <h2>Atendimentos (${entries.length})</h2>
      ${entries.length > 0 ? entryBlocks : '<p class="block-text">Nenhum atendimento finalizado registrado.</p>'}
    </section>

    <footer class="footer">
      <p>${escapeHtml(brand.appName)} — documento gerado para fins operacionais e de auditoria.</p>
      <p>Uso restrito conforme LGPD e políticas internas de acesso a dados clínicos.</p>
    </footer>
  </main>
</body>
</html>`
}

function buildExportContext(prontuario: PatientProntuarioData): ExportContext {
  const generatedAtLabel = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())

  return { prontuario, generatedAtLabel }
}

async function waitForDocumentReady(ownerDocument: Document) {
  if (ownerDocument.fonts?.ready) {
    await ownerDocument.fonts.ready
  }

  await Promise.all(
    Array.from(ownerDocument.images).map(
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

  await new Promise<void>((resolve) => {
    window.setTimeout(() => resolve(), 200)
  })
}

async function renderProntuarioDocument(prontuario: PatientProntuarioData) {
  const html = buildPatientProntuarioReportHtml(buildExportContext(prontuario))
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText =
    'position:fixed;left:-9999px;top:0;width:900px;height:1px;border:0;opacity:0;pointer-events:none;'
  document.body.appendChild(iframe)

  await new Promise<void>((resolve, reject) => {
    iframe.addEventListener('load', () => resolve(), { once: true })
    iframe.addEventListener('error', () => reject(new Error('Não foi possível preparar o documento do prontuário.')), {
      once: true,
    })

    iframe.srcdoc = html
  })

  const frameDocument = iframe.contentDocument
  if (!frameDocument) {
    document.body.removeChild(iframe)
    throw new Error('Não foi possível preparar o documento do prontuário.')
  }

  await waitForDocumentReady(frameDocument)

  const main = frameDocument.querySelector('main')
  if (!main) {
    document.body.removeChild(iframe)
    throw new Error('Não foi possível montar o prontuário para exportação.')
  }

  return { iframe, main: main as HTMLElement }
}

export async function downloadPatientProntuarioPdf(prontuario: PatientProntuarioData) {
  const { iframe } = await renderProntuarioDocument(prontuario)

  try {
    const frameWindow = iframe.contentWindow
    if (!frameWindow) {
      throw new Error('Não foi possível preparar a exportação do PDF.')
    }

    await downloadWindowAsPdf(frameWindow, {
      filename: pdfFilenameFromLabel('prontuario', prontuario.patient.name),
      scale: 2,
      marginMm: 6,
    })
  } finally {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe)
    }
  }
}

export async function printPatientProntuario(prontuario: PatientProntuarioData) {
  const { iframe } = await renderProntuarioDocument(prontuario)

  try {
    const frameWindow = iframe.contentWindow
    if (!frameWindow) {
      throw new Error('Não foi possível abrir a impressão do prontuário.')
    }

    frameWindow.focus()
    frameWindow.print()
  } finally {
    window.setTimeout(() => {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe)
      }
    }, 1000)
  }
}
