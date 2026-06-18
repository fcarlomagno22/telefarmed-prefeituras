import type { AdminOperatorRow } from './adminOperadoresMock'
import {
  buildPresetPagePermissions,
  type AccessLevelId,
  type PermissionAction,
} from '../config/accessCredentials'
import type { AccessCredentialUser } from './accessCredentialsMock'
import { prefeituraRedeUnits, type PrefeituraRedeUnit } from './prefeituraRedeMock'

export type PrefeituraAccessCredentialUser = AccessCredentialUser & {
  ubtId: string
  ubtName: string
  raKey: string
  raLabel: string
  isUbtResponsible: boolean
}

export type PrefeituraCredentialsUbtGroup = {
  ubtId: string
  ubtName: string
  raKey: string
  raLabel: string
  responsibleName: string
  credentials: PrefeituraAccessCredentialUser[]
  totalCount: number
  activeCount: number
}

export const RESPONSIBLE_UBT_ROLE = 'Responsável pela UBT'

export function isResponsibleUbtRole(role: string) {
  return role.trim().toLowerCase() === RESPONSIBLE_UBT_ROLE.toLowerCase()
}

export type PrefeituraCredentialUbtOption = {
  value: string
  label: string
  ubtName: string
  slug?: string
  raKey: string
  raLabel: string
  contractingEntityId?: string
}

export const prefeituraCredentialsRaFilterOptions = [
  { value: '', label: 'Todas as RAs' },
  { value: 'norte', label: 'RA Norte' },
  { value: 'leste', label: 'RA Leste' },
  { value: 'central', label: 'RA Central' },
  { value: 'sul', label: 'RA Sul' },
  { value: 'oeste', label: 'RA Oeste' },
] as const

const regionKeyToRaKey: Record<string, string> = {
  centro: 'central',
  norte: 'norte',
  sul: 'sul',
  leste: 'leste',
  oeste: 'oeste',
}

function raLabelFromKey(raKey: string) {
  return (
    prefeituraCredentialsRaFilterOptions.find((option) => option.value === raKey)?.label ??
    raKey
  )
}

export const prefeituraCredentialsUbtOptions: PrefeituraCredentialUbtOption[] =
  prefeituraRedeUnits
    .filter((unit) => unit.status !== 'inativa')
    .map((unit) => {
      const raKey = regionKeyToRaKey[unit.regionKey] ?? unit.regionKey
      return {
        value: unit.id,
        label: unit.name,
        ubtName: unit.name,
        slug: unit.name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 50),
        raKey,
        raLabel: raLabelFromKey(raKey),
      }
    })
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))

export function findPrefeituraCredentialUbtOption(ubtId: string) {
  return prefeituraCredentialsUbtOptions.find((option) => option.value === ubtId)
}

export function enrichPrefeituraCredentialUser(
  user: AccessCredentialUser,
  ubtId: string,
  isUbtResponsible: boolean,
): PrefeituraAccessCredentialUser {
  const option = findPrefeituraCredentialUbtOption(ubtId)
  if (!option) {
    throw new Error('UBT inválida para credencial municipal.')
  }

  const role = isUbtResponsible ? RESPONSIBLE_UBT_ROLE : user.role

  return {
    ...user,
    role,
    ubtId: option.value,
    ubtName: option.ubtName,
    raKey: option.raKey,
    raLabel: option.raLabel,
    isUbtResponsible,
    accessLevel: isUbtResponsible ? 'administrador' : user.accessLevel,
    pagePermissions: isUbtResponsible
      ? buildPresetPagePermissions('administrador')
      : user.pagePermissions,
  }
}

const avatarPalette = [
  'bg-orange-100 text-orange-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-purple-100 text-purple-700',
  'bg-emerald-100 text-emerald-700',
  'bg-rose-100 text-rose-700',
] as const

type StaffTemplate = {
  nameSuffix: string
  role: string
  accessLevel: AccessLevelId
  status?: 'ativo' | 'inativo'
}

const staffTemplates: StaffTemplate[] = [
  { nameSuffix: 'Médico', role: 'Médico', accessLevel: 'operador' },
  { nameSuffix: 'Enfermeira', role: 'Enfermeira', accessLevel: 'operador' },
  { nameSuffix: 'Recepcionista', role: 'Recepcionista', accessLevel: 'editor' },
  { nameSuffix: 'Assistente', role: 'Assistente administrativo', accessLevel: 'visualizador' },
]

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function emailFromName(name: string, ubtId: string) {
  const slug = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join('.')
  const unitSlug = ubtId.replace('rede-', '')
  return `${slug}.${unitSlug}@ubt.gov.br`
}

function buildCredentialForUnit(
  unit: PrefeituraRedeUnit,
  index: number,
  template: StaffTemplate | 'responsible',
): PrefeituraAccessCredentialUser {
  const raKey = regionKeyToRaKey[unit.regionKey] ?? unit.regionKey
  const isResponsible = template === 'responsible'
  const staff = isResponsible
    ? {
        name: unit.responsibleName,
        role: 'Responsável pela UBT',
        accessLevel: 'administrador' as AccessLevelId,
        status: 'ativo' as const,
      }
    : {
        name: `${unit.responsibleName.split(' ')[0]} ${template.nameSuffix}`,
        role: template.role,
        accessLevel: template.accessLevel,
        status: template.status ?? 'ativo',
      }

  const id = `pref-cred-${unit.id}-${isResponsible ? 'resp' : index}`

  return {
    id,
    name: staff.name,
    email: emailFromName(staff.name, unit.id),
    role: staff.role,
    accessLevel: staff.accessLevel,
    status: staff.status,
    initials: getInitials(staff.name),
    avatarClassName: avatarPalette[index % avatarPalette.length],
    hasPassword: true,
    pagePermissions: buildPresetPagePermissions(staff.accessLevel),
    ubtId: unit.id,
    ubtName: unit.name,
    raKey,
    raLabel: raLabelFromKey(raKey),
    isUbtResponsible: isResponsible,
  }
}

function buildCredentialsForUnit(unit: PrefeituraRedeUnit): PrefeituraAccessCredentialUser[] {
  const responsible = buildCredentialForUnit(unit, 0, 'responsible')
  const staffCount = unit.status === 'ativa' ? 3 : 2
  const others = staffTemplates.slice(0, staffCount).map((template, index) =>
    buildCredentialForUnit(unit, index + 1, template),
  )
  return [responsible, ...others]
}

const selectedUnits = prefeituraRedeUnits.filter((unit) => unit.status !== 'inativa').slice(0, 12)

export const prefeituraAccessCredentialUsers: PrefeituraAccessCredentialUser[] =
  selectedUnits.flatMap(buildCredentialsForUnit)

export function groupPrefeituraCredentialsByUbt(
  users: PrefeituraAccessCredentialUser[],
): PrefeituraCredentialsUbtGroup[] {
  const map = new Map<string, PrefeituraCredentialsUbtGroup>()

  for (const user of users) {
    const existing = map.get(user.ubtId)
    if (existing) {
      existing.credentials.push(user)
      existing.totalCount += 1
      if (user.status === 'ativo') existing.activeCount += 1
      continue
    }

    map.set(user.ubtId, {
      ubtId: user.ubtId,
      ubtName: user.ubtName,
      raKey: user.raKey,
      raLabel: user.raLabel,
      responsibleName: user.isUbtResponsible ? user.name : '',
      credentials: [user],
      totalCount: 1,
      activeCount: user.status === 'ativo' ? 1 : 0,
    })
  }

  return [...map.values()]
    .map((group) => {
      const responsible = group.credentials.find((item) => item.isUbtResponsible)
      const sorted = [...group.credentials].sort((a, b) => {
        if (a.isUbtResponsible !== b.isUbtResponsible) {
          return a.isUbtResponsible ? -1 : 1
        }
        return a.name.localeCompare(b.name, 'pt-BR')
      })

      return {
        ...group,
        responsibleName: responsible?.name ?? group.responsibleName,
        credentials: sorted,
      }
    })
    .sort((a, b) => a.ubtName.localeCompare(b.ubtName, 'pt-BR'))
}

export function mapOperatorRowToPrefeituraAccessCredentialUser(
  row: AdminOperatorRow,
): PrefeituraAccessCredentialUser {
  return {
    ...row,
    ubtId: row.ubtId ?? '',
    ubtName: row.ubtName ?? row.unitName,
    raKey: row.raKey ?? '',
    raLabel: row.raLabel ?? '',
    isUbtResponsible: row.isUbtResponsible ?? false,
  }
}

export function buildPrefeituraCredentialsRaFilterOptions(
  ubtOptions: PrefeituraCredentialUbtOption[],
): Array<{ value: string; label: string }> {
  const raMap = new Map<string, string>()
  for (const option of ubtOptions) {
    if (option.raKey) {
      raMap.set(option.raKey, option.raLabel)
    }
  }

  return [
    { value: '', label: 'Todas as RAs' },
    ...Array.from(raMap.entries())
      .sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'))
      .map(([value, label]) => ({ value, label })),
  ]
}

function demoteResponsibleFields(user: AccessCredentialUser): AccessCredentialUser {
  if (!user.isUbtResponsible) return user
  return {
    ...user,
    isUbtResponsible: false,
    role: isResponsibleUbtRole(user.role) ? 'Gestor da UBT' : user.role,
  }
}

export function transferAccessCredentialToUbt(
  user: AccessCredentialUser,
  targetUbtId: string,
): AccessCredentialUser {
  const option = findPrefeituraCredentialUbtOption(targetUbtId)
  if (!option) {
    throw new Error('UBT de destino inválida.')
  }

  const demoted = demoteResponsibleFields(user)

  return {
    ...demoted,
    ubtId: option.value,
    ubtName: option.ubtName,
    raKey: option.raKey,
    raLabel: option.raLabel,
  }
}

export function transferPrefeituraCredentialToUbt(
  user: PrefeituraAccessCredentialUser,
  targetUbtId: string,
): PrefeituraAccessCredentialUser {
  const demoted = demoteResponsibleFields(user)
  return enrichPrefeituraCredentialUser(demoted, targetUbtId, false)
}

export function collectCredentialActions(user: AccessCredentialUser): PermissionAction[] {
  const actions = new Set<PermissionAction>()
  for (const pageActions of Object.values(user.pagePermissions)) {
    for (const action of pageActions) {
      actions.add(action)
    }
  }
  return ['visualizar', 'inserir', 'editar', 'excluir'].filter((action) =>
    actions.has(action as PermissionAction),
  ) as PermissionAction[]
}
