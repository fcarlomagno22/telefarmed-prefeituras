import { isPrefeituraEntidadeTipo } from '../config/adminEntidadeTipo'
import type { TipoEntidade } from '../types/entidadeBranding'
import type { PatientAddressTerritoryRequirement } from '../components/dashboard/PatientAddressStep'

export type PatientTerritoryPolicyInput = {
  municipio: string
  uf: string
  aceitaPacientesOutrosMunicipios: boolean
  tipoEntidade?: TipoEntidade
}

/** Restrição de município só se aplica a prefeitura sem flag de outros municípios. */
export function shouldEnforcePatientMunicipalityTerritory(
  tipoEntidade: TipoEntidade | undefined,
  aceitaPacientesOutrosMunicipios: boolean,
): boolean {
  if (!isPrefeituraEntidadeTipo(tipoEntidade)) return false
  return !aceitaPacientesOutrosMunicipios
}

export function shouldEnforceUbtUnitMunicipalityTerritory(
  tipoEntidade: TipoEntidade | undefined,
): boolean {
  return isPrefeituraEntidadeTipo(tipoEntidade)
}

export function resolvePatientAddressTerritoryRequirement(
  policy: PatientTerritoryPolicyInput | null | undefined,
): PatientAddressTerritoryRequirement | undefined {
  if (!policy) return undefined
  if (
    !shouldEnforcePatientMunicipalityTerritory(
      policy.tipoEntidade,
      policy.aceitaPacientesOutrosMunicipios,
    )
  ) {
    return undefined
  }
  return {
    municipality: policy.municipio,
    uf: policy.uf,
  }
}

export function patientContractAllowsOtherMunicipalities(
  policy: PatientTerritoryPolicyInput | null | undefined,
): boolean {
  if (!policy) return false
  return !shouldEnforcePatientMunicipalityTerritory(
    policy.tipoEntidade,
    policy.aceitaPacientesOutrosMunicipios,
  )
}

export function buildPatientAddressStepDescription(input: {
  requiredTerritory?: PatientAddressTerritoryRequirement
  contractAllowsOtherMunicipalities: boolean
  territoryScope: 'patient_registration' | 'pre_registration'
  entityMunicipality?: string
  entityUf?: string
  tipoEntidade?: TipoEntidade
}): string {
  const {
    requiredTerritory,
    contractAllowsOtherMunicipalities,
    territoryScope,
    entityMunicipality,
    entityUf,
    tipoEntidade,
  } = input

  if (requiredTerritory) {
    const area = `${requiredTerritory.municipality}/${requiredTerritory.uf}`
    if (territoryScope === 'patient_registration') {
      return `Informe o CEP do endereço do paciente em ${area}. O contrato vigente aceita apenas moradores deste município.`
    }
    return `Informe o CEP do endereço do paciente em ${area}. Apenas moradores deste município podem ser pré-cadastrados.`
  }

  if (contractAllowsOtherMunicipalities) {
    if (isPrefeituraEntidadeTipo(tipoEntidade)) {
      return 'Informe onde o paciente reside. O contrato vigente permite cadastrar pacientes de outras cidades.'
    }
    return 'Informe onde o paciente reside. Pacientes de qualquer cidade podem ser cadastrados.'
  }

  return 'Informe onde o paciente reside para concluir o cadastro.'
}

export function buildUbtUnitCepGuidance(input: {
  municipio: string
  uf: string
  tipoEntidade?: TipoEntidade
}): string | null {
  if (!shouldEnforceUbtUnitMunicipalityTerritory(input.tipoEntidade)) {
    return 'Informe o CEP do endereço físico da unidade. A localização será usada no cadastro operacional.'
  }
  return `O CEP deve pertencer a ${input.municipio}/${input.uf}, área do município contratante.`
}

export function resolveGestorPortalLabel(_tipoEntidade?: TipoEntidade): string {
  return 'gestor'
}

export function resolveGestorPortalLabelTitle(_tipoEntidade?: TipoEntidade): string {
  return 'Gestor'
}

export function resolveSatisfacaoNpsLabel(
  tipoEntidade: TipoEntidade | undefined,
  daRede: string,
): string {
  if (tipoEntidade === 'santa_casa') return 'NPS da população atendida'
  return `NPS ${daRede}`
}

export function capitalizeLabel(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return trimmed
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

export function resolveSatisfacaoReportTitle(satisfacaoPublico: string): string {
  return capitalizeLabel(satisfacaoPublico)
}
