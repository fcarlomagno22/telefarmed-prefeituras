import { brand } from './brand'

function env(key: string, fallback: string): string {
  const value = import.meta.env[key]
  return typeof value === 'string' && value.trim() !== '' ? value : fallback
}

export type SystemDeploymentRelease = {
  version: string
  deployedAt: string
  /** Rótulo curto da implantação (ex.: build ou ambiente). */
  deploymentLabel?: string
  changes: string[]
}

/** Histórico por implantação — atualize a cada release em produção. */
export const systemDeploymentReleases: SystemDeploymentRelease[] = [
  {
    version: '2.4.1',
    deployedAt: '2026-05-21T14:00:00',
    deploymentLabel: 'Produção municipal',
    changes: [
      'Central de notificações entre Telefarmed, gestão e UBTs',
      'Indicador de mensagens não lidas no menu lateral',
      'Drawer de envio em massa por região administrativa',
    ],
  },
  {
    version: '2.4.0',
    deployedAt: '2026-05-14T09:30:00',
    deploymentLabel: 'Produção municipal',
    changes: [
      'Monitor operacional com grade ao vivo e ranking por UBT',
      'Credenciais de acesso no portal da prefeitura',
      'Logs de auditoria com filtros avançados',
    ],
  },
  {
    version: '2.3.2',
    deployedAt: '2026-05-07T11:00:00',
    changes: [
      'Agenda municipal consolidada por unidade',
      'Consultas com detalhamento por UBT e exportação',
      'Gestão de contrato com gráfico mensal',
    ],
  },
  {
    version: '2.3.0',
    deployedAt: '2026-04-28T16:45:00',
    changes: [
      'Dashboard municipal com KPIs e mapa por região',
      'Cadastro da rede de UBTs e painel de SLA',
      'Pacientes municipais com LGPD e histórico de alterações',
    ],
  },
]

const latestRelease = systemDeploymentReleases[0]

export const systemRelease = {
  appName: brand.appName,
  version: env('VITE_APP_VERSION', latestRelease.version),
  currentDeployment: latestRelease,
  deployments: systemDeploymentReleases,
} as const

export function formatSystemDeploymentDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso))
}
