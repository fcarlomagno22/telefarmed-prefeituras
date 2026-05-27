import {
  initialAccessCredentialUsers,
  recentAccessEntries,
  type AccessCredentialUser,
} from './accessCredentialsMock'
import { adminMunicipalityCatalog } from './adminPacientesMock'
import {
  prefeituraCredentialsUbtOptions,
  type PrefeituraCredentialUbtOption,
} from './prefeituraAccessCredentialsMock'

export type AdminOperatorScope = 'UBT' | 'Prefeitura'

export type AdminOperatorContractingEntity = {
  id: string
  razaoSocial: string
  municipality: string
  uf: string
}

export type AdminOperatorRow = AccessCredentialUser & {
  scope: AdminOperatorScope
  unitName: string
  contractingEntity: AdminOperatorContractingEntity
  lastAccessLabel: string
  profileLabel: string
}

function buildOperatorContractingEntity(index: number): AdminOperatorContractingEntity {
  const municipality =
    adminMunicipalityCatalog[index % adminMunicipalityCatalog.length] ?? 'São José dos Campos'
  return {
    id: `ent-op-${municipality.toLowerCase().replace(/\s+/g, '-')}`,
    razaoSocial: `Prefeitura Municipal de ${municipality}`,
    municipality,
    uf: 'SP',
  }
}

function fallbackUbtOption(index: number): PrefeituraCredentialUbtOption {
  return (
    prefeituraCredentialsUbtOptions[index % prefeituraCredentialsUbtOptions.length] ?? {
      value: `ubt-fallback-${index}`,
      label: 'UBT não identificada',
      ubtName: 'UBT não identificada',
      raKey: 'central',
      raLabel: 'RA Central',
    }
  )
}

export const adminOperatorsInitialRows: AdminOperatorRow[] = initialAccessCredentialUsers.map(
  (user, index) => {
    const ubt = fallbackUbtOption(index)
    const access = recentAccessEntries.find((entry) => entry.userId === user.id)
    const scope: AdminOperatorScope = index % 3 === 0 ? 'Prefeitura' : 'UBT'

    return {
      ...user,
      ubtId: user.ubtId ?? ubt.value,
      ubtName: user.ubtName ?? ubt.ubtName,
      scope,
      unitName: user.ubtName ?? ubt.ubtName,
      contractingEntity: buildOperatorContractingEntity(index),
      lastAccessLabel: access?.accessedAtLabel ?? 'Sem acesso recente',
      profileLabel: user.role,
    }
  },
)

export const adminOperatorUbtOptions = prefeituraCredentialsUbtOptions

