import { Activity, ClipboardList, HeartPulse, Stethoscope } from 'lucide-react'
import type { AdminDashboardTriageChartsView } from '../../../types/adminDashboardTriage'
import { CredentialDonutChart } from '../../credenciais/CredentialDonutChart'
import { DashCard, formatPrefeituraNumber } from '../../prefeitura/prefeituraDashboardUi'
import {
  AdminDashboardHorizontalBarChart,
  AdminDashboardVerticalBarChart,
  withBarGradients,
} from './AdminDashboardBarCharts'

type AdminTriageChartsSectionProps = {
  data: AdminDashboardTriageChartsView
  animationKey: string
  periodLabel: string
  sectionLabel?: string
  title?: string
  scopeHint?: string
}

function triageSubtitle(
  periodLabel: string,
  totalTriages: number,
  scopeHint?: string,
): string {
  const base = `${formatPrefeituraNumber(totalTriages)} triagem(ns) com dados no período`
  const scoped = scopeHint ? `${base} · ${scopeHint}` : base
  if (periodLabel === 'Hoje') return `${scoped} · hoje`
  if (periodLabel === 'Últimos 7 dias') return `${scoped} · últimos 7 dias`
  if (periodLabel === 'Últimos 30 dias') return `${scoped} · últimos 30 dias`
  return scoped
}

export function AdminTriageChartsSection({
  data,
  animationKey,
  periodLabel,
  sectionLabel = 'Inteligência clínica',
  title = 'Perfil da triagem clínica',
  scopeHint,
}: AdminTriageChartsSectionProps) {
  const chronicItems = withBarGradients(data.chronicConditions)
  const complaintItems = withBarGradients(data.chiefComplaints)
  const symptomItems = withBarGradients(data.associatedSymptoms)
  const comorbidityItems = withBarGradients(data.comorbidities)

  const chronicDenominator = data.chronicShare.withChronicCount + data.chronicShare.withoutChronicCount

  return (
    <section className="min-w-0 space-y-3 xl:col-span-12">
      <div className="flex flex-wrap items-end justify-between gap-3 px-0.5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-primary)]">
            {sectionLabel}
          </p>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            {triageSubtitle(periodLabel, data.totalTriages, scopeHint)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <DashCard
            fillHeight
            className="h-full min-h-[18rem]"
            title="Pacientes com crônica"
            subtitle="Participação entre triagens com resposta declarada"
            bodyClassName="flex min-h-0 flex-1 flex-col gap-4 p-4"
          >
            <div className="flex items-center gap-4">
              <CredentialDonutChart
                chartId={`admin-triage-chronic-${animationKey}`}
                size="lg"
                centerPrimary={`${data.chronicShare.withChronicPercent}%`}
                centerSecondary="com crônica"
                slices={[
                  {
                    key: 'with',
                    label: 'Com crônica',
                    count: data.chronicShare.withChronicCount,
                    gradientFrom: '#f43f5e',
                    gradientTo: '#e11d48',
                  },
                  {
                    key: 'without',
                    label: 'Sem crônica informada',
                    count: data.chronicShare.withoutChronicCount,
                    gradientFrom: '#e2e8f0',
                    gradientTo: '#cbd5e1',
                  },
                ]}
              />
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Com crônica</p>
                  <p className="text-2xl font-bold tabular-nums text-gray-900">
                    {formatPrefeituraNumber(data.chronicShare.withChronicCount)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {data.chronicShare.withChronicPercent}% do recorte declarado
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Sem crônica informada
                  </p>
                  <p className="text-lg font-bold tabular-nums text-gray-800">
                    {formatPrefeituraNumber(data.chronicShare.withoutChronicCount)}
                  </p>
                </div>
                {chronicDenominator === 0 ? (
                  <p className="text-xs text-gray-500">Nenhuma triagem estruturada no período.</p>
                ) : null}
              </div>
            </div>
          </DashCard>
        </div>

        <div className="xl:col-span-8">
          <DashCard
            fillHeight
            className="h-full min-h-[18rem]"
            title="Doenças crônicas mais frequentes"
            subtitle="Ocorrências por condição declarada na triagem"
            bodyClassName="flex min-h-0 flex-1 flex-col p-4 pt-3"
          >
            <AdminDashboardHorizontalBarChart
              items={chronicItems}
              animationKey={`${animationKey}-chronic`}
              maxItems={10}
              emptyMessage="Sem doenças crônicas registradas na triagem"
            />
          </DashCard>
        </div>

        <div className="xl:col-span-4">
          <DashCard
            fillHeight
            className="h-full min-h-[16rem]"
            title="Comorbidades"
            subtitle="Quantidade de condições crônicas por paciente"
            bodyClassName="flex min-h-0 flex-1 flex-col p-4 pt-3"
          >
            <AdminDashboardVerticalBarChart
              items={comorbidityItems}
              animationKey={`${animationKey}-comorbidity`}
              emptyMessage="Sem comorbidades registradas"
            />
          </DashCard>
        </div>

        <div className="xl:col-span-4">
          <DashCard
            fillHeight
            className="h-full min-h-[16rem]"
            title="Principais motivos de consulta"
            subtitle="Top queixas declaradas no terminal"
            bodyClassName="flex min-h-0 flex-1 flex-col p-4 pt-3"
          >
            <AdminDashboardHorizontalBarChart
              items={complaintItems}
              animationKey={`${animationKey}-complaints`}
              maxItems={8}
              emptyMessage="Sem motivos de consulta registrados"
            />
          </DashCard>
        </div>

        <div className="xl:col-span-4">
          <DashCard
            fillHeight
            className="h-full min-h-[16rem]"
            title="Sintomas associados"
            subtitle="Sinais e sintomas mais citados na triagem"
            bodyClassName="flex min-h-0 flex-1 flex-col p-4 pt-3"
          >
            <AdminDashboardHorizontalBarChart
              items={symptomItems}
              animationKey={`${animationKey}-symptoms`}
              maxItems={8}
              emptyMessage="Sem sintomas associados registrados"
            />
          </DashCard>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            icon: HeartPulse,
            label: 'Condições crônicas distintas',
            value: formatPrefeituraNumber(data.chronicConditions.length),
          },
          {
            icon: Stethoscope,
            label: 'Queixas distintas',
            value: formatPrefeituraNumber(data.chiefComplaints.length),
          },
          {
            icon: Activity,
            label: 'Sintomas distintos',
            value: formatPrefeituraNumber(data.associatedSymptoms.length),
          },
          {
            icon: ClipboardList,
            label: 'Triagens analisadas',
            value: formatPrefeituraNumber(data.totalTriages),
          },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-2xl border border-gray-200/90 bg-white px-4 py-3 shadow-sm"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
              <item.icon className="h-4 w-4" strokeWidth={2} />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{item.label}</p>
              <p className="text-lg font-bold tabular-nums text-gray-900">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
