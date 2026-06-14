import type { PrefeituraMunicipalPatient } from '../data/prefeituraMunicipalPatientsMock'
import type {
  AdminPatientConsultation,
  AdminPatientDetailProfile,
  AdminPatientUbtVinculo,
} from './adminPacientes'

export type PrefeituraMunicipalPatientDetail = PrefeituraMunicipalPatient & {
  ubts?: AdminPatientUbtVinculo[]
  consultations?: AdminPatientConsultation[]
  profile?: AdminPatientDetailProfile
}
