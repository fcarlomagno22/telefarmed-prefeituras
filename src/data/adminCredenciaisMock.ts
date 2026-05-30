import {
  adminInternoDepartments,
  buildAdminInternoPagePermissions,
  type AdminInternoCredentialUser,
  type AdminInternoDepartmentId,
} from '../config/adminCredenciaisConfig'
import { Building2, Key, Landmark, UserCheck } from 'lucide-react'
import type { KpiStatCardItem } from '../components/ui/KpiStatCards'
import type { AdminOperatorRow } from './adminOperadoresMock'
import { adminOperatorsInitialRows } from './adminOperadoresMock'

function internoUser(
  partial: Omit<
    AdminInternoCredentialUser,
    'pagePermissions' | 'hasPassword' | 'hasAuthorizationPin' | 'initials' | 'avatarClassName'
  > & {
    initials?: string
    avatarClassName?: string
  },
): AdminInternoCredentialUser {
  const initials =
    partial.initials ??
    partial.name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase()

  return {
    ...partial,
    initials,
    avatarClassName: partial.avatarClassName ?? 'bg-orange-100 text-orange-700',
    hasPassword: partial.hasPassword ?? true,
    hasAuthorizationPin: partial.hasAuthorizationPin ?? true,
    pagePermissions: buildAdminInternoPagePermissions(partial.accessLevel),
  }
}

export const adminInternoCredentialsInitial: AdminInternoCredentialUser[] = [
  internoUser({
    id: 'adm-cred-1',
    name: 'Marina Costa',
    email: 'marina.costa@telefarmed.com.br',
    cpf: '123.456.789-01',
    role: 'Gestora de plataforma',
    departmentId: 'operacoes',
    accessLevel: 'administrador',
    status: 'ativo',
    lastAccessLabel: 'Hoje, 09:14',
  }),
  internoUser({
    id: 'adm-cred-2',
    name: 'Ricardo Almeida',
    email: 'ricardo.almeida@telefarmed.com.br',
    cpf: '234.567.890-12',
    role: 'Analista financeiro',
    departmentId: 'financeiro',
    accessLevel: 'editor',
    status: 'ativo',
    lastAccessLabel: 'Ontem, 17:42',
    avatarClassName: 'bg-sky-100 text-sky-700',
  }),
  internoUser({
    id: 'adm-cred-3',
    name: 'Patrícia Nunes',
    email: 'patricia.nunes@telefarmed.com.br',
    cpf: '345.678.901-23',
    role: 'Customer success',
    departmentId: 'suporte',
    accessLevel: 'operador',
    status: 'ativo',
    lastAccessLabel: 'Hoje, 08:03',
    avatarClassName: 'bg-violet-100 text-violet-700',
  }),
  internoUser({
    id: 'adm-cred-4',
    name: 'Felipe Andrade',
    email: 'felipe.andrade@telefarmed.com.br',
    cpf: '456.789.012-34',
    role: 'Engenheiro de software',
    departmentId: 'ti',
    accessLevel: 'administrador',
    status: 'ativo',
    lastAccessLabel: 'Hoje, 11:28',
    avatarClassName: 'bg-emerald-100 text-emerald-700',
  }),
  internoUser({
    id: 'adm-cred-5',
    name: 'Camila Rocha',
    email: 'camila.rocha@telefarmed.com.br',
    cpf: '567.890.123-45',
    role: 'Comercial B2G',
    departmentId: 'comercial',
    accessLevel: 'visualizador',
    status: 'inativo',
    lastAccessLabel: 'Sem acesso recente',
    avatarClassName: 'bg-amber-100 text-amber-800',
    hasAuthorizationPin: false,
    hasPassword: false,
  }),
]

export function getDepartmentLabel(departmentId: AdminInternoDepartmentId) {
  const match = adminInternoDepartments.find((item) => item.value === departmentId)
  return match?.label ?? departmentId
}

export function filterOperatorRowsByScope(
  rows: AdminOperatorRow[],
  scope: 'UBT' | 'Prefeitura',
) {
  return rows.filter((row) => row.scope === scope)
}

export function buildAdminCredenciaisKpiCards(
  internoRows: AdminInternoCredentialUser[],
  operatorRows: AdminOperatorRow[],
): KpiStatCardItem[] {
  const formatNumber = (value: number) => new Intl.NumberFormat('pt-BR').format(value)
  const ubtCount = operatorRows.filter((row) => row.scope === 'UBT').length
  const prefeituraCount = operatorRows.filter((row) => row.scope === 'Prefeitura').length
  const activeTotal =
    internoRows.filter((row) => row.status === 'ativo').length +
    operatorRows.filter((row) => row.status === 'ativo').length

  return [
    {
      label: 'Admin Telefarmed',
      value: formatNumber(internoRows.length),
      suffix: 'acessos internos',
      icon: Key,
      iconGradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(139,92,246,0.35)]',
      iconRing: 'ring-violet-100/80',
      topBar: 'from-violet-400 to-purple-500',
    },
    {
      label: 'Prefeitura',
      value: formatNumber(prefeituraCount),
      suffix: 'gestores municipais',
      icon: Landmark,
      iconGradient: 'from-orange-500 via-amber-500 to-orange-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(249,115,22,0.35)]',
      iconRing: 'ring-orange-100/80',
      topBar: 'from-orange-400 to-amber-500',
    },
    {
      label: 'UBT',
      value: formatNumber(ubtCount),
      suffix: 'operadores de unidade',
      icon: Building2,
      iconGradient: 'from-sky-500 via-blue-500 to-indigo-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(59,130,246,0.35)]',
      iconRing: 'ring-blue-100/80',
      topBar: 'from-sky-400 to-blue-500',
    },
    {
      label: 'Ativos na rede',
      value: formatNumber(activeTotal),
      suffix: 'com login liberado',
      icon: UserCheck,
      iconGradient: 'from-emerald-500 via-teal-500 to-emerald-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(16,185,129,0.35)]',
      iconRing: 'ring-emerald-100/80',
      topBar: 'from-emerald-400 to-teal-500',
    },
  ]
}

export { adminOperatorsInitialRows }
