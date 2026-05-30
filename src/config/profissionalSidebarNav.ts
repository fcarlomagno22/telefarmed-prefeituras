import { CalendarClock, CalendarDays, ClipboardList, Headphones, Star, Wallet } from 'lucide-react'
import type { SidebarNavItemProps } from '../components/layout/SidebarNavItem'
import { profissionalRoutes } from './profissionalRoutes'

export const profissionalSidebarItems: SidebarNavItemProps[] = [
  {
    to: profissionalRoutes.agenda,
    label: 'Agenda',
    icon: CalendarDays,
    end: true,
  },
  {
    to: profissionalRoutes.atendimentos,
    label: 'Atendimentos',
    icon: ClipboardList,
    end: true,
  },
  {
    to: profissionalRoutes.escala,
    label: 'Plantões',
    icon: CalendarClock,
    end: true,
  },
  {
    to: profissionalRoutes.financeiro,
    label: 'Financeiro',
    icon: Wallet,
    end: true,
  },
  {
    to: profissionalRoutes.avaliacao,
    label: 'Avaliação',
    icon: Star,
    end: true,
  },
  {
    to: profissionalRoutes.suporte,
    label: 'Suporte',
    icon: Headphones,
    end: true,
  },
]

export type ProfissionalNavMeta = {
  title: string
  description: string
}

const profissionalNavMetaByPath: Record<string, ProfissionalNavMeta> = {
  [profissionalRoutes.agenda]: {
    title: 'Agenda',
    description:
      'Plantões designados, fila de pacientes e início dos atendimentos por teleconsulta.',
  },
  [profissionalRoutes.atendimentos]: {
    title: 'Atendimentos',
    description:
      'Consultas realizadas, documentos emitidos e situação de cada atendimento.',
  },
  [profissionalRoutes.escala]: {
    title: 'Plantões disponíveis',
    description:
      'Plantões abertos compatíveis com a sua especialidade. Filtre por data, turno e valor e reserve o plantão.',
  },
  [profissionalRoutes.financeiro]: {
    title: 'Financeiro',
    description:
      'Plantões por competência, previsão de faturamento, fechamento mensal, nota fiscal e PIX da empresa cadastrada.',
  },
  [profissionalRoutes.avaliacao]: {
    title: 'Avaliação',
    description:
      'Notas e comentários dos pacientes sobre seus atendimentos e desempenho no plantão.',
  },
  [profissionalRoutes.suporte]: {
    title: 'Suporte',
    description:
      'Abra chamados sobre escala, pagamentos, sistema ou dúvidas do painel profissional.',
  },
  [profissionalRoutes.notificacoes]: {
    title: 'Notificações',
    description:
      'Comunicados da Telefarmed, da gestão municipal e do corpo clínico — somente leitura.',
  },
  [profissionalRoutes.perfil]: {
    title: 'Meu perfil',
    description:
      'Dados profissionais, documentos, empresa, PIX, foto e certificado digital ICP-Brasil do seu conselho.',
  },
}

export function findProfissionalNavByPathname(pathname: string): ProfissionalNavMeta | undefined {
  const normalized = pathname.replace(/\/+$/, '') || '/'
  return profissionalNavMetaByPath[normalized]
}
