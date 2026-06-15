import { History } from 'lucide-react'
import { ProfissionalPacienteHistoricoPanel } from '../components/profissional/historico/ProfissionalPacienteHistoricoPanel'
import { ProfissionalPageHeader } from '../components/profissional/ProfissionalPageHeader'
import {
  dashboardPageFillScrollAreaClass,
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'
import {
  PROFISSIONAL_HISTORICO_DEMO_PACIENTE_ID,
  profissionalHistoricoDemoAtendimentosPath,
  profissionalHistoricoDemoConsultaPath,
} from '../config/profissionalHistoricoDemo'
import { useProfissionalAuth } from '../contexts/ProfissionalAuthContext'
import { useBrandTheme } from '../hooks/useBrandTheme'

const DEMO_PATIENT_NAME = 'Maria Souza Lima'
const DEMO_SPECIALTY = 'Clínica Médica'

export function ProfissionalHistoricoDemoPage() {
  useBrandTheme()
  const { getAccessToken } = useProfissionalAuth()
  const accessToken = getAccessToken()

  return (
    <div className={dashboardPageShellClass} aria-label="Demo — histórico de consultas">
      <div className={dashboardPageHeaderWrapClass}>
        <ProfissionalPageHeader
          title="Demo — consultas anteriores"
          description="Visualização mock do histórico clínico (triagem, documentos e evolução pós-consulta) para o mesmo paciente na mesma especialidade."
        />
      </div>

      <div className={dashboardPageFillScrollAreaClass}>
        <div className={[dashboardPageScrollPaddingClass, 'mx-auto mt-4 max-w-3xl pb-8'].join(' ')}>
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
            <p className="font-semibold">Ambiente de demonstração (mock)</p>
            <p className="mt-1 text-xs leading-relaxed text-amber-900/90">
              Paciente <strong>{DEMO_PATIENT_NAME}</strong> · {DEMO_SPECIALTY}. Inclui consultas de
              outros médicos da especialidade.
            </p>
            <ul className="mt-3 space-y-1.5 text-xs">
              <li>
                <a
                  href={profissionalHistoricoDemoAtendimentosPath()}
                  className="font-semibold text-[var(--brand-primary)] underline-offset-2 hover:underline"
                >
                  Abrir drawer em Atendimentos
                </a>{' '}
                — registro demo com triagem, docs e evolução
              </li>
              <li>
                <a
                  href={profissionalHistoricoDemoConsultaPath()}
                  className="font-semibold text-[var(--brand-primary)] underline-offset-2 hover:underline"
                >
                  Abrir consulta ativa mock
                </a>{' '}
                — botão &quot;Consultas anteriores&quot; no header
              </li>
            </ul>
          </div>

          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <header className="flex items-center gap-3 border-b border-gray-100 bg-gradient-to-br from-[var(--brand-primary-light)]/40 via-white to-white px-5 py-4">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                <History className="h-5 w-5" strokeWidth={2} />
              </span>
              <div>
                <h2 className="text-base font-bold text-gray-900">Consultas anteriores</h2>
                <p className="text-xs text-gray-500">
                  {DEMO_PATIENT_NAME} · {DEMO_SPECIALTY}
                </p>
              </div>
            </header>
            <div className="p-5">
              <ProfissionalPacienteHistoricoPanel
                accessToken={accessToken}
                pacienteId={PROFISSIONAL_HISTORICO_DEMO_PACIENTE_ID}
                patientName={DEMO_PATIENT_NAME}
                specialty={DEMO_SPECIALTY}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
