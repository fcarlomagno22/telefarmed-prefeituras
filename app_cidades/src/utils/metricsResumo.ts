import type { MetricsResumoDto } from '../lib/api/vd/metricas'
import { getMetricsResumo } from '../lib/api/vd/metricas'
import { createDefaultMetricsProfile } from '../data/metricsProfileStorage'
import { metricsProfileDtoToSnapshot } from './metricsProfile'
import type { ProfileSnapshot } from '../types/metrics'

export type { MetricsResumoDto, MetricsResumoLatestDto } from '../lib/api/vd/metricas'

export function metricsResumoToProfileSnapshot(
  resumo: MetricsResumoDto | null | undefined,
): ProfileSnapshot {
  return metricsProfileDtoToSnapshot(resumo?.profile)
}

export function createEmptyMetricsResumo(
  profile: ProfileSnapshot = createDefaultMetricsProfile(),
): MetricsResumoDto {
  return {
    profile: {
      height: profile.height || null,
      weight: profile.weight || null,
      birthDate: profile.birthDate || null,
      genderLabel: profile.gender || null,
      ageYears: null,
      ageLabel: profile.age || null,
      imc: null,
      imcZone: null,
    },
    profileComplete: false,
    latest: {
      pesoKg: null,
      imc: null,
      imcZone: null,
      glicemiaMgDl: null,
      pressaoSistolica: null,
      pressaoDiastolica: null,
      hidratacaoMlHoje: null,
      circunferenciaAbdomenCm: null,
      frequenciaBpm: null,
      passosHoje: null,
      distanciaKmHoje: null,
    },
  }
}

export async function fetchMetricsResumo(): Promise<MetricsResumoDto> {
  return getMetricsResumo()
}
