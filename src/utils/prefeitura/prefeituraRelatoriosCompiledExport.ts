import { brand } from '../../config/brand'
import type { CompiledReportHighlight } from '../../lib/prefeitura/prefeituraRelatoriosCompiledRegistry'
import { prefeituraRelatoriosCompiledRegistry } from '../../lib/prefeitura/prefeituraRelatoriosCompiledRegistry'
import type {
  AgendaComparecimentoReportApi,
  AvaliacoesAtendimentosReportApi,
  CapacidadeOcupacaoReportApi,
  DemandaEspecialidadeReportApi,
  DuracaoMediaReportApi,
  EncaminhamentosEncaixesReportApi,
  FilaEsperaAbandonoReportApi,
  FluxoTerminalReportApi,
  HorariosPicoReportApi,
  InterrupcoesReconexoesReportApi,
  MedicosPlantaoReportApi,
  PrefeituraRelatorioId,
  ProducaoUnidadeReportApi,
  RankingUbtsReportApi,
  SatisfacaoCidadaoReportApi,
  UnidadesCriticasReportApi,
  NovosCadastrosReportApi,
  CadastrosIncompletosReportApi,
  PacientesInativosReportApi,
  PerfilTerritorialReportApi,
  RetornosPendentesReportApi,
} from '../../types/prefeituraRelatorios'
import { downloadElementsAsPdf, pdfFilenameFromLabel } from '../htmlDocumentToPdf'
import { buildAgendaComparecimentoReportHtml } from './prefeituraAgendaComparecimentoReportExport'
import { buildAvaliacoesAtendimentosReportHtml } from './prefeituraAvaliacoesAtendimentosReportExport'
import { buildCapacidadeOcupacaoReportHtml } from './prefeituraCapacidadeOcupacaoReportExport'
import { buildDemandaEspecialidadeReportHtml } from './prefeituraDemandaEspecialidadeReportExport'
import { buildDuracaoMediaReportHtml } from './prefeituraDuracaoMediaReportExport'
import { buildEncaminhamentosEncaixesReportHtml } from './prefeituraEncaminhamentosEncaixesReportExport'
import { buildFilaEsperaAbandonoReportHtml } from './prefeituraFilaEsperaAbandonoReportExport'
import { buildFluxoTerminalReportHtml } from './prefeituraFluxoTerminalReportExport'
import { buildHorariosPicoReportHtml } from './prefeituraHorariosPicoReportExport'
import { buildInterrupcoesReconexoesReportHtml } from './prefeituraInterrupcoesReconexoesReportExport'
import { buildMedicosPlantaoReportHtml } from './prefeituraMedicosPlantaoReportExport'
import { buildProducaoUnidadeReportHtml } from './prefeituraProducaoUnidadeReportExport'
import { buildRankingUbtsReportHtml } from './prefeituraRankingUbtsReportExport'
import { buildSatisfacaoCidadaoReportHtml } from './prefeituraSatisfacaoCidadaoReportExport'
import { buildUnidadesCriticasReportHtml } from './prefeituraUnidadesCriticasReportExport'
import { buildNovosCadastrosReportHtml } from './prefeituraNovosCadastrosReportExport'
import { buildCadastrosIncompletosReportHtml } from './prefeituraCadastrosIncompletosReportExport'
import { buildPacientesInativosReportHtml } from './prefeituraPacientesInativosReportExport'
import { buildPerfilTerritorialReportHtml } from './prefeituraPerfilTerritorialReportExport'
import { buildRetornosPendentesReportHtml } from './prefeituraRetornosPendentesReportExport'

type CompiledOverviewEntry = {
  id: PrefeituraRelatorioId
  title: string
  description: string
  highlights: CompiledReportHighlight[]
}

type CompiledReportEntry = {
  id: PrefeituraRelatorioId
  report: unknown
  generatedAtLabel: string
}

export type CompiledExportContext = {
  periodLabel: string
  entidadeRazaoSocial: string
  generatedBy: string
  generatedAtLabel: string
  categoryTitle?: string | null
  categoryDescription?: string | null
  overviewEntries: CompiledOverviewEntry[]
  reports: CompiledReportEntry[]
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
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${window.location.origin}${normalized}`
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function extractStyleBlock(html: string) {
  return html.match(/<style>([\s\S]*?)<\/style>/i)?.[1] ?? ''
}

function extractMainBlock(html: string) {
  return html.match(/<main>([\s\S]*?)<\/main>/i)?.[1] ?? html
}

function buildOverviewStyles() {
  return `
    .overview-entry-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    .overview-entry-card {
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      background: #fff;
      padding: 16px;
    }
    .overview-entry-head {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .overview-entry-rank {
      width: 32px;
      height: 32px;
      border-radius: 999px;
      background: #fff7ed;
      color: #ea580c;
      font-size: 14px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .overview-entry-title { font-size: 14px; font-weight: 700; color: #111827; }
    .overview-entry-description { margin-top: 4px; font-size: 12px; color: #6b7280; }
    .overview-highlight-grid {
      margin-top: 12px;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }
    .overview-highlight-card {
      border: 1px solid #f3f4f6;
      border-radius: 8px;
      background: #f8fafc;
      padding: 8px 12px;
      text-align: center;
    }
    .overview-highlight-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #6b7280;
    }
    .overview-highlight-value {
      margin-top: 4px;
      font-size: 12px;
      font-weight: 700;
      color: #111827;
    }
    .compiled-report-item main {
      border: 0;
      border-radius: 0;
    }
  `
}

function buildOverviewMain({
  categoryTitle,
  categoryDescription,
  entidadeRazaoSocial,
  periodLabel,
  generatedAtLabel,
  generatedBy,
  overviewEntries,
}: CompiledExportContext) {
  const logoUrl = resolveAssetUrl(brand.logoUrl)
  const title = categoryTitle ? `${categoryTitle} — Compilado` : 'Compilado de relatórios'
  const subtitle =
    categoryDescription ??
    'Visão consolidada dos relatórios selecionados, com indicadores gerais e detalhamento individual abaixo.'

  const entryCards = overviewEntries
    .map(
      (entry, index) => `
        <article class="overview-entry-card">
          <div class="overview-entry-head">
            <span class="overview-entry-rank">${index + 1}</span>
            <div>
              <p class="overview-entry-title">${escapeHtml(entry.title)}</p>
              <p class="overview-entry-description">${escapeHtml(entry.description)}</p>
              <div class="overview-highlight-grid">
                ${entry.highlights
                  .map(
                    (highlight) => `
                      <div class="overview-highlight-card">
                        <p class="overview-highlight-label">${escapeHtml(highlight.label)}</p>
                        <p class="overview-highlight-value">${escapeHtml(highlight.value)}</p>
                      </div>
                    `,
                  )
                  .join('')}
              </div>
            </div>
          </div>
        </article>
      `,
    )
    .join('')

  return `
    <div class="brand-bar"></div>
    <header class="header">
      <div>
        <p class="eyebrow">Relatório operacional</p>
        <h1>${escapeHtml(title)}</h1>
        <p class="subtitle">${escapeHtml(subtitle)}</p>
        <div class="meta">
          <p><strong>${escapeHtml(entidadeRazaoSocial)}</strong> · ${escapeHtml(brand.appName)}</p>
          <p>Período: <strong>${escapeHtml(periodLabel)}</strong></p>
          <p>${formatNumber(overviewEntries.length)} relatório${overviewEntries.length === 1 ? '' : 's'} neste compilado</p>
        </div>
      </div>
      <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(brand.appName)}" />
    </header>

    <section>
      <div class="summary-grid">
        <article class="card">
          <p class="card-label">Relatórios incluídos</p>
          <p class="card-value">${formatNumber(overviewEntries.length)}</p>
          <p class="card-footer">Cada um inicia em página separada na impressão/PDF</p>
        </article>
        <article class="card" style="grid-column: span 2;">
          <p class="card-label">Conteúdo do compilado</p>
          <p class="card-value-sm">${escapeHtml(overviewEntries.map((entry) => entry.title).join(' · '))}</p>
        </article>
        <article class="card">
          <p class="card-label">Gerado em</p>
          <p class="card-value-sm">${escapeHtml(generatedAtLabel)}</p>
          <p class="card-footer">por ${escapeHtml(generatedBy)}</p>
        </article>
      </div>
    </section>

    <section>
      <h2>Resumo dos relatórios selecionados</h2>
      <div class="overview-entry-grid">${entryCards}</div>
    </section>
  `
}

function buildReportSectionHtml(entry: CompiledReportEntry) {
  switch (entry.id) {
    case 'producao-unidade':
      return buildProducaoUnidadeReportHtml({
        report: entry.report as ProducaoUnidadeReportApi,
        generatedAtLabel: entry.generatedAtLabel,
      })
    case 'fila-espera-abandono':
      return buildFilaEsperaAbandonoReportHtml({
        report: entry.report as FilaEsperaAbandonoReportApi,
        generatedAtLabel: entry.generatedAtLabel,
      })
    case 'agenda-comparecimento':
      return buildAgendaComparecimentoReportHtml({
        report: entry.report as AgendaComparecimentoReportApi,
        generatedAtLabel: entry.generatedAtLabel,
      })
    case 'ranking-ubts':
      return buildRankingUbtsReportHtml({
        report: entry.report as RankingUbtsReportApi,
        generatedAtLabel: entry.generatedAtLabel,
      })
    case 'fluxo-terminal':
      return buildFluxoTerminalReportHtml({
        report: entry.report as FluxoTerminalReportApi,
        generatedAtLabel: entry.generatedAtLabel,
      })
    case 'demanda-especialidade':
      return buildDemandaEspecialidadeReportHtml({
        report: entry.report as DemandaEspecialidadeReportApi,
        generatedAtLabel: entry.generatedAtLabel,
      })
    case 'capacidade-ocupacao':
      return buildCapacidadeOcupacaoReportHtml({
        report: entry.report as CapacidadeOcupacaoReportApi,
        generatedAtLabel: entry.generatedAtLabel,
      })
    case 'encaminhamentos-encaixes':
      return buildEncaminhamentosEncaixesReportHtml({
        report: entry.report as EncaminhamentosEncaixesReportApi,
        generatedAtLabel: entry.generatedAtLabel,
      })
    case 'horarios-pico':
      return buildHorariosPicoReportHtml({
        report: entry.report as HorariosPicoReportApi,
        generatedAtLabel: entry.generatedAtLabel,
      })
    case 'medicos-plantao':
      return buildMedicosPlantaoReportHtml({
        report: entry.report as MedicosPlantaoReportApi,
        generatedAtLabel: entry.generatedAtLabel,
      })
    case 'duracao-media':
      return buildDuracaoMediaReportHtml({
        report: entry.report as DuracaoMediaReportApi,
        generatedAtLabel: entry.generatedAtLabel,
      })
    case 'interrupcoes-reconexoes':
      return buildInterrupcoesReconexoesReportHtml({
        report: entry.report as InterrupcoesReconexoesReportApi,
        generatedAtLabel: entry.generatedAtLabel,
      })
    case 'avaliacoes-atendimentos':
      return buildAvaliacoesAtendimentosReportHtml({
        report: entry.report as AvaliacoesAtendimentosReportApi,
        generatedAtLabel: entry.generatedAtLabel,
      })
    case 'satisfacao-cidadao':
      return buildSatisfacaoCidadaoReportHtml({
        report: entry.report as SatisfacaoCidadaoReportApi,
        generatedAtLabel: entry.generatedAtLabel,
      })
    case 'unidades-criticas':
      return buildUnidadesCriticasReportHtml({
        report: entry.report as UnidadesCriticasReportApi,
        generatedAtLabel: entry.generatedAtLabel,
      })
    case 'novos-cadastros':
      return buildNovosCadastrosReportHtml({
        report: entry.report as NovosCadastrosReportApi,
        generatedAtLabel: entry.generatedAtLabel,
      })
    case 'cadastros-incompletos':
      return buildCadastrosIncompletosReportHtml({
        report: entry.report as CadastrosIncompletosReportApi,
        generatedAtLabel: entry.generatedAtLabel,
      })
    case 'pacientes-inativos':
      return buildPacientesInativosReportHtml({
        report: entry.report as PacientesInativosReportApi,
        generatedAtLabel: entry.generatedAtLabel,
      })
    case 'perfil-territorial':
      return buildPerfilTerritorialReportHtml({
        report: entry.report as PerfilTerritorialReportApi,
        generatedAtLabel: entry.generatedAtLabel,
      })
    case 'retornos-pendentes':
      return buildRetornosPendentesReportHtml({
        report: entry.report as RetornosPendentesReportApi,
        generatedAtLabel: entry.generatedAtLabel,
      })
    default:
      throw new Error(`Relatório ${entry.id} não suportado no compilado.`)
  }
}

function buildCompiledReportHtml(context: CompiledExportContext) {
  const styleBlocks = new Set<string>()
  const firstReportHtml = buildReportSectionHtml(context.reports[0])
  styleBlocks.add(extractStyleBlock(firstReportHtml))
  styleBlocks.add(buildOverviewStyles())

  const reportSections = context.reports.map((entry) => {
    const fullHtml = buildReportSectionHtml(entry)
    styleBlocks.add(extractStyleBlock(fullHtml))
    return `
      <div data-compiled-section="${entry.id}" class="compiled-report-item">
        <main>${extractMainBlock(fullHtml)}</main>
      </div>
    `
  })

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Compilado de relatórios</title>
  <style>${[...styleBlocks].join('\n')}</style>
</head>
<body>
  <div data-compiled-section="overview" class="compiled-overview">
    <main>${buildOverviewMain(context)}</main>
  </div>
  ${reportSections.join('\n')}
</body>
</html>`
}

function createExportFrame(html: string) {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText = [
    'position:fixed',
    'left:-10000px',
    'top:0',
    'width:1100px',
    'height:1px',
    'border:0',
    'opacity:0',
    'pointer-events:none',
  ].join(';')
  document.body.appendChild(iframe)

  const ownerDocument = iframe.contentDocument
  if (!ownerDocument) {
    document.body.removeChild(iframe)
    throw new Error('Não foi possível preparar a exportação do PDF.')
  }

  ownerDocument.open()
  ownerDocument.write(html)
  ownerDocument.close()

  return iframe
}

async function waitForExportFrame(iframe: HTMLIFrameElement) {
  const ownerDocument = iframe.contentDocument
  if (!ownerDocument) return

  if (ownerDocument.readyState !== 'complete') {
    await new Promise<void>((resolve) => {
      iframe.addEventListener('load', () => resolve(), { once: true })
    })
  }

  if (ownerDocument.fonts?.ready) {
    await ownerDocument.fonts.ready
  }

  await new Promise<void>((resolve) => {
    window.setTimeout(() => resolve(), 400)
  })
}

export async function exportPrefeituraRelatoriosCompiledPdf(context: CompiledExportContext) {
  if (context.reports.length === 0) {
    throw new Error('Nenhum relatório disponível para exportação.')
  }

  const html = buildCompiledReportHtml(context)
  const exportFrame = createExportFrame(html)

  try {
    await waitForExportFrame(exportFrame)
    const ownerDocument = exportFrame.contentDocument
    if (!ownerDocument) {
      throw new Error('Não foi possível gerar o PDF do compilado.')
    }

    const overview = ownerDocument.querySelector<HTMLElement>('[data-compiled-section="overview"]')
    if (!overview) {
      throw new Error('Não foi possível localizar o resumo do compilado.')
    }

    const sections = [
      { element: overview },
      ...context.reports.map((entry) => {
        const section = ownerDocument.querySelector<HTMLElement>(
          `[data-compiled-section="${entry.id}"]`,
        )
        if (!section) {
          throw new Error(`Não foi possível localizar o relatório ${entry.id} no compilado.`)
        }

        const pdfOptions = prefeituraRelatoriosCompiledRegistry[entry.id].pdfOptions
        return {
          element: section,
          singlePage: pdfOptions.singlePage,
          maxPages: pdfOptions.maxPages,
        }
      }),
    ]

    const filename = pdfFilenameFromLabel('compilado-relatorios', context.periodLabel)
    await downloadElementsAsPdf(sections, { filename, scale: 2, marginMm: 4 })
  } finally {
    if (exportFrame.parentNode) {
      exportFrame.parentNode.removeChild(exportFrame)
    }
  }
}
