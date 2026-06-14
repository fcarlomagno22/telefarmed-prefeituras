import type { AdminMunicipalPatientDetailDto, AdminMunicipalPatientDto } from '../admin-pacientes/types.js'
import type { PrefeituraMunicipalPatientDetailDto, PrefeituraMunicipalPatientDto } from './types.js'

export function mapAdminPatientToPrefeituraPatient(
  row: AdminMunicipalPatientDto,
): PrefeituraMunicipalPatientDto {
  const {
    municipality: _municipality,
    contractStatus: _contractStatus,
    registrationMonthLabel: _registrationMonthLabel,
    contractingEntityId: _contractingEntityId,
    contractingEntityRazaoSocial: _contractingEntityRazaoSocial,
    ...patient
  } = row
  return patient
}

export function mapAdminDetailToPrefeituraDetail(
  row: AdminMunicipalPatientDetailDto,
): PrefeituraMunicipalPatientDetailDto {
  const patient = mapAdminPatientToPrefeituraPatient(row)
  return {
    ...patient,
    ubts: row.ubts,
    consultations: row.consultations,
    profile: row.profile,
  }
}
